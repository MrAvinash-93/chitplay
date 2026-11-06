const SIGNAL_VERSION = 2;
const SIGNAL_PREFIX = 'CP2.';
const MAX_SIGNAL_LENGTH = 100_000;
const PEER_OPTIONS = { iceServers: [] };
const SIGNAL_TIMEOUT_MS = 20_000;

function toBase64Url(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function compressText(text) {
  const StreamType = globalThis.CompressionStream;
  if (typeof StreamType === 'undefined') {
    throw new Error('This browser cannot compress connection codes. Use the latest Chrome, Safari, or Firefox.');
  }
  const stream = new Blob([text]).stream().pipeThrough(new StreamType('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompressText(bytes) {
  const StreamType = globalThis.DecompressionStream;
  if (typeof StreamType === 'undefined') {
    throw new Error('This browser cannot open compressed connection codes. Update to the latest Chrome, Safari, or Firefox.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new StreamType('deflate'));
  return new Response(stream).text();
}

export async function encodeSignal(type, id, sdp) {
  const compact = JSON.stringify({ v: SIGNAL_VERSION, t: type, i: id, s: sdp });
  const compressed = await compressText(compact);
  return `${SIGNAL_PREFIX}${toBase64Url(compressed)}`;
}

export async function parseSignal(text, expectedType) {
  if (typeof text !== 'string' || text.length > MAX_SIGNAL_LENGTH) {
    throw new Error('Connection code is empty or too large.');
  }
  if (text.startsWith(SIGNAL_PREFIX) && typeof globalThis.DecompressionStream === 'undefined') {
    throw new Error('This browser cannot open compressed connection codes. Update to the latest Chrome, Safari, or Firefox.');
  }

  let value;
  try {
    if (text.startsWith(SIGNAL_PREFIX)) {
      const json = await decompressText(fromBase64Url(text.slice(SIGNAL_PREFIX.length)));
      value = JSON.parse(json);
    } else {
      value = JSON.parse(text);
    }
  } catch {
    throw new Error(text.startsWith(SIGNAL_PREFIX)
      ? 'That compressed connection code is damaged. Copy it again from WhatsApp.'
      : 'That connection code is not valid JSON. Copy it again from WhatsApp.');
  }

  const type = value?.t || value?.type;
  const id = value?.i || value?.id;
  const sdp = value?.s || value?.sdp;
  if (![1, SIGNAL_VERSION].includes(value?.v) || typeof id !== 'string' || type !== expectedType || typeof sdp !== 'string') {
    throw new Error(`This is not a valid ChitPlay ${expectedType} code.`);
  }

  return { id, sdp };
}

function waitForIceGathering(peer) {
  if (peer.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Could not prepare the local connection. Check that all phones are on the same hotspot and retry.'));
    }, SIGNAL_TIMEOUT_MS);
    const onStateChange = () => {
      if (peer.iceGatheringState === 'complete') {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      clearTimeout(timeout);
      peer.removeEventListener('icegatheringstatechange', onStateChange);
    };
    peer.addEventListener('icegatheringstatechange', onStateChange);
  });
}

function createId() {
  return crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function sendData(channel, message) {
  if (channel.readyState !== 'open') throw new Error('That player is no longer connected.');
  channel.send(JSON.stringify(message));
}

export class PeerRoomHost {
  #peers = new Map();
  #onMessage;
  #onChange;
  #onError;
  #closed = false;

  constructor({ onMessage, onChange, onError }) {
    this.#onMessage = onMessage;
    this.#onChange = onChange;
    this.#onError = onError;
  }

  get connectionCount() {
    return [...this.#peers.values()].filter(peer => peer.playerId && peer.channel?.readyState === 'open').length;
  }

  get pendingCount() {
    return [...this.#peers.values()].filter(peer => !peer.playerId && peer.channel?.readyState !== 'closed').length;
  }

  async createInvite() {
    if (this.#closed) throw new Error('This room has been closed.');
    if (this.connectionCount + this.pendingCount >= 3) throw new Error('This room already has three guest players.');

    const id = createId();
    const peer = new RTCPeerConnection(PEER_OPTIONS);
    const channel = peer.createDataChannel('chitplay', { ordered: true });
    const record = { id, peer, channel, playerId: null, cleaned: false };
    this.#peers.set(id, record);
    this.#wirePeer(record);

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIceGathering(peer);
        record.inviteCode = await encodeSignal('offer', id, peer.localDescription.sdp);
      return record.inviteCode;
    } catch (error) {
      this.#removeRecord(record, false);
      throw error;
    }
  }

  async acceptAnswer(text) {
    const signal = await parseSignal(text, 'answer');
    const record = this.#peers.get(signal.id);
    if (!record) throw new Error('This answer does not match an invitation from this room.');
    if (record.peer.remoteDescription) {
      if (['failed', 'closed'].includes(record.peer.connectionState)) {
        this.#removeRecord(record);
        throw new Error('That connection expired. Create a fresh invite for this player.');
      }
      throw new Error('This answer was already used. If the player is not in the room, cancel this invite and create a fresh one.');
    }
    await record.peer.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
    this.#onChange?.();
  }

  async cancelInvite(text) {
    const signal = await parseSignal(text, 'offer');
    const record = this.#peers.get(signal.id);
    if (!record) throw new Error('This invite is no longer active. Create a fresh invite.');
    if (record.playerId) throw new Error('This guest is already connected. Use Disconnect beside their name.');
    this.#removeRecord(record, false);
  }

  sendTo(playerId, message) {
    const record = [...this.#peers.values()].find(peer => peer.playerId === playerId);
    if (!record) throw new Error('That player is no longer connected.');
    sendData(record.channel, message);
  }

  disconnectPlayer(playerId) {
    const record = [...this.#peers.values()].find(peer => peer.playerId === playerId);
    if (!record) throw new Error('That player is no longer connected.');
    this.#removeRecord(record);
  }

  broadcast(message) {
    for (const record of this.#peers.values()) {
      if (record.playerId && record.channel.readyState === 'open') {
        sendData(record.channel, message);
      }
    }
  }

  close() {
    this.#closed = true;
    for (const record of this.#peers.values()) this.#removeRecord(record, false);
  }

  #wirePeer(record) {
    record.peer.addEventListener('connectionstatechange', () => {
      if (record.peer.connectionState === 'failed') {
        this.#onError?.('A player connection failed. Make sure every device is on the host phone’s hotspot, then reconnect that player.');
        this.#removeRecord(record);
      } else if (record.peer.connectionState === 'closed') {
        this.#removeRecord(record);
      }
    });
    record.channel.addEventListener('open', () => this.#onChange?.());
    record.channel.addEventListener('close', () => {
      this.#removeRecord(record);
    });
    record.channel.addEventListener('message', event => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        this.#onError?.('A guest sent an unreadable message. Ask them to reload and reconnect.');
        return;
      }
      if (message.type === 'join') {
        if (record.playerId) return;
        const name = typeof message.name === 'string' ? message.name.trim().slice(0, 20) : '';
        if (!name) {
          sendData(record.channel, { type: 'error', message: 'Enter a player name before joining.' });
          return;
        }
        record.playerId = `guest-${record.id}`;
        this.#onMessage?.({ type: 'join', playerId: record.playerId, name, send: payload => sendData(record.channel, payload) });
        this.#onChange?.();
        return;
      }
      if (!record.playerId) return;
      this.#onMessage?.({ ...message, playerId: record.playerId });
    });
  }

  #removeRecord(record, notifyDisconnect = true) {
    if (record.cleaned) return;
    record.cleaned = true;
    this.#peers.delete(record.id);
    const playerId = record.playerId;
    record.channel?.close();
    record.peer.close();
    if (notifyDisconnect && playerId && !this.#closed) {
      this.#onMessage?.({ type: 'disconnect', playerId });
    }
    if (!this.#closed) this.#onChange?.();
  }
}

export class PeerRoomGuest {
  #peer;
  #channel = null;
  #onMessage;
  #onChange;
  #onError;
  #joined = false;
  #signalId = null;
  #closed = false;

  constructor({ onMessage, onChange, onError }) {
    this.#onMessage = onMessage;
    this.#onChange = onChange;
    this.#onError = onError;
  }

  get connected() {
    return this.#channel?.readyState === 'open';
  }

  async createAnswer(offerText, playerName) {
    if (this.#peer) this.close();
    const signal = await parseSignal(offerText, 'offer');
    this.#signalId = signal.id;
    this.#closed = false;
    this.#peer = new RTCPeerConnection(PEER_OPTIONS);
    this.#peer.addEventListener('datachannel', event => {
      this.#channel = event.channel;
      this.#channel.addEventListener('open', () => {
        if (!this.#joined) {
          sendData(this.#channel, { type: 'join', name: playerName.trim().slice(0, 20) });
          this.#joined = true;
        }
        this.#onChange?.();
      });
      this.#channel.addEventListener('close', () => {
        if (!this.#closed) this.#onMessage?.({ type: 'disconnect' });
        this.#onChange?.();
      });
      this.#channel.addEventListener('message', event => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          this.#onError?.('The host sent an unreadable game update. Please reconnect.');
          return;
        }
        if (message.type === 'error') this.#onError?.(message.message);
        else this.#onMessage?.(message);
      });
    });
    this.#peer.addEventListener('connectionstatechange', () => {
      if (this.#peer.connectionState === 'failed') {
        this.#onError?.('Could not connect. Check that you are on the host phone’s hotspot and try a fresh invite.');
      }
    });

    try {
      await this.#peer.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
      const answer = await this.#peer.createAnswer();
      await this.#peer.setLocalDescription(answer);
      await waitForIceGathering(this.#peer);
      return await encodeSignal('answer', signal.id, this.#peer.localDescription.sdp);
    } catch (error) {
      this.close();
      throw error;
    }
  }

  send(message) {
    if (!this.#channel) throw new Error('You are not connected to the host.');
    sendData(this.#channel, message);
  }

  close() {
    this.#closed = true;
    this.#joined = false;
    this.#channel?.close();
    this.#peer?.close();
    this.#peer = null;
    this.#channel = null;
  }
}
