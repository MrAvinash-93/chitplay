/**
 * Voice chat between friends in a Nearby room.
 *
 * - Only in rooms friends join by code, QR or invite link: never on public tables with strangers.
 * - Off by default. Whoever switches it on both speaks and hears the others who switched it on.
 * - The sound goes phone to phone (WebRTC through the same PeerJS connection as the game). It is
 *   never recorded, stored or sent to a server of ours.
 *
 * Every phone tells the host whether its voice is on; the host tells everyone who is talking (the
 * "roster"). Of two phones that are both on, the one with the smaller id rings the other, so each
 * pair has exactly one call.
 */
export class VoiceChat {
  constructor(peer) {
    this.peer = peer;
    this.stream = null;
    this.on = false;
    this.calls = new Map();      // peer id -> MediaConnection
    this.players = new Map();    // peer id -> <audio>
    this.onIncoming = (call) => this.#incoming(call);
    peer?.on('call', this.onIncoming);
  }

  get id() { return this.peer?.id || null; }

  /** Asks for the microphone. Rejects if the player refuses or there is none. */
  async start() {
    if (this.on) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    this.on = true;
  }

  stop() {
    this.on = false;
    this.calls.forEach(c => { try { c.close(); } catch { /* already gone */ } });
    this.calls.clear();
    this.players.forEach(a => { a.srcObject = null; a.remove(); });
    this.players.clear();
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  /** Everyone whose voice is on (peer ids, this phone included). */
  setRoster(ids) {
    if (!this.on || !this.peer) return;
    const want = new Set((ids || []).filter(id => typeof id === 'string' && id !== this.id));
    // hang up on anyone who switched off or left
    [...this.calls.keys()].forEach(id => { if (!want.has(id)) this.#hangUp(id); });
    want.forEach((id) => {
      if (!this.calls.has(id) && this.id < id) this.#wire(id, this.peer.call(id, this.stream));
    });
  }

  /** How many friends you can hear right now. */
  get heard() { return this.players.size; }

  destroy() {
    this.stop();
    this.peer?.off?.('call', this.onIncoming);
    this.peer = null;
  }

  #incoming(call) {
    if (!this.on) { try { call.close(); } catch { /* fine */ } return; }
    call.answer(this.stream);
    this.#wire(call.peer, call);
  }

  #wire(id, call) {
    if (!call) return;
    this.calls.set(id, call);
    call.on('stream', (remote) => {
      let audio = this.players.get(id);
      if (!audio) {
        audio = document.createElement('audio');
        audio.className = 'game__voice-audio';
        audio.autoplay = true;
        audio.setAttribute('playsinline', '');
        audio.hidden = true;
        document.body.append(audio);
        this.players.set(id, audio);
      }
      audio.srcObject = remote;
      audio.play?.().catch(() => { /* plays after the next tap */ });
    });
    const end = () => this.#hangUp(id);
    call.on('close', end);
    call.on('error', end);
  }

  #hangUp(id) {
    const c = this.calls.get(id);
    this.calls.delete(id);
    try { c?.close(); } catch { /* fine */ }
    const a = this.players.get(id);
    if (a) { a.srcObject = null; a.remove(); this.players.delete(id); }
  }
}
