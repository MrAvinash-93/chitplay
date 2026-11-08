/**
 * Nearby Play: up to 4 phones in one match.
 *
 * The host's phone runs the game. Friends join with the host's 6-digit code.
 * The code is only used to find each other (a tiny handshake through the free
 * PeerJS broker); after that every message goes phone-to-phone over WebRTC,
 * which on the same WiFi stays inside the local network.
 *
 * PeerJS (MIT, vendored in src/vendor) is loaded only when Nearby Play is opened.
 */
import { cleanName, politeName } from '../world/names.js?v=20261108-0738';
import { cleanLook } from '../world/character-looks.js?v=20261108-0738';

const PREFIX = 'chitplay-v1-';
const MAX_GUESTS = 3;
const PING_MS = 3000;
const DEAD_MS = 15000;
const JOIN_TIMEOUT_MS = 15000;
const OPEN_TIMEOUT_MS = 20000;

let peerLib = null;
/** Load PeerJS once (≈90 KB). */
export function loadPeer() {
  if (window.Peer) return Promise.resolve(window.Peer);
  if (peerLib) return peerLib;
  peerLib = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/peerjs.min.js?v=20261108-0738.5.4', import.meta.url).href;
    s.async = true;
    s.onload = () => (window.Peer ? resolve(window.Peer) : reject(new Error('load')));
    s.onerror = () => { peerLib = null; reject(new Error('load')); };
    document.head.append(s);
  });
  return peerLib;
}

export const randomCode = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Online play with strangers: a few public tables with fixed names. Whoever gets a free name first
 * hosts that table; everyone after joins it until it's full or started, then tries the next one.
 * The free PeerJS broker guarantees only one phone can hold a name, so no server of our own is needed.
 */
export const PUBLIC_TABLES = 8;
export const publicCode = (n) => `public-${n}`;
export const isPublicCode = (c) => /^public-[1-9]\d?$/.test(String(c || ''));
export const isCode = (c) => /^\d{6}$/.test(String(c || ''));
/** A phone's private ticket back to its seat if the connection drops. */
export const newToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Friendly reason for a PeerJS / network failure. */
/** The text key (src/i18n) that explains a connection failure to the player. */
export function nearbyError(e) {
  const type = e?.type || e?.message;
  if (type === 'peer-unavailable' || type === 'no-room') return 'errNoRoom';
  if (type === 'full') return 'errFull';
  if (type === 'started') return 'errStarted';
  if (type === 'browser-incompatible') return 'errBrowser';
  if (type === 'timeout') return 'errTimeout';
  if (type === 'load' || type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed') return 'errNetwork';
  return 'errOther';
}

/** Register with the broker; a stalled network fails instead of hanging on "Connecting…". */
function openPeer(Peer, id) {
  return new Promise((resolve, reject) => {
    const p = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
    const fail = (e) => { clearTimeout(timer); p.destroy(); reject(e); };
    const timer = setTimeout(() => fail(Object.assign(new Error('network'), { type: 'network' })), OPEN_TIMEOUT_MS);
    p.once('open', () => { clearTimeout(timer); p.off('error', fail); resolve(p); });
    p.once('error', fail);
  });
}

function safeSend(conn, msg) {
  try { if (conn?.open) conn.send(msg); } catch { /* connection already gone */ }
}

/** Keeps a connection alive and notices when the other phone disappears. */
function watch(conn, onDead) {
  let last = Date.now();
  const timer = setInterval(() => {
    if (Date.now() - last > DEAD_MS) { clearInterval(timer); onDead(); return; }
    safeSend(conn, { t: 'ping' });
  }, PING_MS);
  return { seen() { last = Date.now(); }, stop() { clearInterval(timer); } };
}

export class NearbyHost {
  /**
   * @param {{ onChange?: Function, onMessage?: (guestId, msg) => void, onLeave?: (guestId) => void, onRejoin?: (guestId, token) => void }} handlers
   */
  constructor(handlers = {}) {
    this.h = handlers;
    this.code = null;
    this.peer = null;
    this.guests = new Map();      // id -> { id, name, conn, w }
    this.locked = false;          // once a match starts nobody new can join…
    this.known = new Set();       // …except the phones that started it (by token)
    this.closed = false;
    this.retry = 0;
    this.hostName = '';
  }

  /**
   * Everyone at the table has to be told apart: two people called Avin become
   * "Avin 1" and "Avin 4" after their place in the room. Others keep their name.
   */
  labels() {
    const raw = [this.hostName, ...[...this.guests.values()].map(g => g.name)];
    const count = (n) => raw.filter(x => x.toLowerCase() === n.toLowerCase()).length;
    return raw.map((n, i) => (count(n) > 1 ? `${n.slice(0, 10)} ${i + 1}` : n));
  }

  /** The match starts: only these phones can come back from now on. */
  lock() {
    this.locked = true;
    this.guests.forEach(g => this.known.add(g.token));
  }

  /** Stay findable: friends who lost the connection need the broker to reach us again. */
  #stayOnline() {
    clearTimeout(this.retry);
    if (this.closed || !this.peer?.disconnected || this.peer.destroyed) return;
    try { this.peer.reconnect(); } catch {}
    this.retry = setTimeout(() => this.#stayOnline(), 5000);
  }

  /**
   * Open the room. Resolves with the 6-digit code (null if it was closed meanwhile).
   * With a fixed code (a public table) there is one try: if the name is taken it fails with
   * type 'unavailable-id', which means somebody already hosts that table.
   */
  async open(fixedCode = null) {
    const Peer = await loadPeer();
    if (fixedCode) {
      const p = await openPeer(Peer, PREFIX + fixedCode);
      if (this.closed) { p.destroy(); return null; }
      this.peer = p;
      this.code = fixedCode;
      this.isPublic = isPublicCode(fixedCode);
    }
    for (let attempt = 0; attempt < 5 && !this.peer; attempt++) {
      const code = randomCode();
      try {
        const p = await openPeer(Peer, PREFIX + code);
        if (this.closed) { p.destroy(); return null; }
        this.peer = p;
        this.code = code;
        break;
      } catch (e) {
        if (e?.type !== 'unavailable-id') throw e;   // code taken: roll another
      }
    }
    if (!this.peer) throw Object.assign(new Error('server-error'), { type: 'server-error' });
    this.peer.on('connection', (conn) => this.#accept(conn));
    this.peer.on('disconnected', () => this.#stayOnline());
    this.peer.on('error', () => {});
    return this.code;
  }

  #accept(conn) {
    const id = conn.connectionId || conn.peer;
    conn.on('data', (msg) => {
      const g = this.guests.get(id);
      g?.w.seen();
      if (!msg || typeof msg !== 'object' || msg.t === 'ping') return;
      if (msg.t === 'bye') { this.#drop(id); return; }
      if (msg.t === 'hello') {
        if (g) return;
        const token = String(msg.token || id);
        // the same phone is back before we noticed it had gone: the old connection is dead
        [...this.guests.values()].filter(x => x.token === token).forEach(x => this.#drop(x.id));
        const returning = this.locked && this.known.has(token);
        if (this.locked && !returning) { safeSend(conn, { t: 'reject', reason: 'started' }); setTimeout(() => conn.close(), 400); return; }
        if (this.guests.size >= MAX_GUESTS) { safeSend(conn, { t: 'reject', reason: 'full' }); setTimeout(() => conn.close(), 400); return; }
        const typed = cleanName(msg.name).trim() || 'Player';
        // strangers on a public table never see a rude name
        const name = this.isPublic ? politeName(typed) : typed;
        const weekly = Number.isFinite(msg.weekly) ? Math.max(0, Math.min(10000000, Math.floor(msg.weekly))) : 0;
        const guest = { id, name, gender: msg.gender === 'f' ? 'f' : 'm', look: cleanLook(msg.look, msg.look?.id), weekly, token, conn, w: watch(conn, () => this.#drop(id)) };
        this.guests.set(id, guest);
        this.h.onChange?.();
        if (returning) this.h.onRejoin?.(id, token);
        return;
      }
      if (g) this.h.onMessage?.(id, msg);
    });
    conn.on('close', () => this.#drop(id));
    conn.on('error', () => this.#drop(id));
  }

  #drop(id) {
    const g = this.guests.get(id);
    if (!g) return;
    g.w.stop();
    this.guests.delete(id);
    try { g.conn.close(); } catch {}
    if (!this.closed) { this.h.onLeave?.(id, g.name); this.h.onChange?.(); }
  }

  get list() {
    const labels = this.labels();
    return [...this.guests.values()].map((g, i) => ({ id: g.id, name: labels[i + 1], gender: g.gender, look: g.look, weekly: g.weekly, token: g.token }));
  }
  get hostLabel() { return this.labels()[0]; }
  send(id, msg) { safeSend(this.guests.get(id)?.conn, msg); }
  broadcast(msg) { this.guests.forEach(g => safeSend(g.conn, msg)); }
  kick(id) { this.send(id, { t: 'reject', reason: 'kicked' }); setTimeout(() => this.#drop(id), 300); }

  close() {
    if (this.closed) return;
    this.broadcast({ t: 'bye' });
    this.closed = true;
    clearTimeout(this.retry);
    this.guests.forEach(g => { g.w.stop(); try { g.conn.close(); } catch {} });
    this.guests.clear();
    setTimeout(() => { try { this.peer?.destroy(); } catch {} }, 300);
  }
}

export class NearbyGuest {
  /** @param {{ onMessage?: (msg) => void, onClose?: (reason) => void }} handlers */
  constructor(handlers = {}) {
    this.h = handlers;
    this.peer = null;
    this.conn = null;
    this.closed = false;
  }

  /** Connect to the host with this code. Resolves once the host has said welcome. */
  async join(code, name, token, extra = {}) {
    const Peer = await loadPeer();
    const p = await openPeer(Peer);
    if (this.closed) { p.destroy(); throw new Error('cancelled'); }
    this.peer = p;
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (err, val) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) { this.close(true); reject(err); } else resolve(val);
      };
      const timer = setTimeout(() => finish(Object.assign(new Error('timeout'), { type: 'timeout' })), JOIN_TIMEOUT_MS);
      this.peer.on('error', (e) => finish(e));
      const conn = this.peer.connect(PREFIX + code, { reliable: true });
      this.conn = conn;
      conn.on('open', () => {
        this.w = watch(conn, () => this.#lost('lost'));
        safeSend(conn, { t: 'hello', name, token, v: 2, ...extra });
      });
      conn.on('error', (e) => finish(e));
      conn.on('data', (msg) => {
        if (this.closed) return;   // already left: a late message must not pull us back in
        this.w?.seen();
        if (!msg || typeof msg !== 'object' || msg.t === 'ping') return;
        if (msg.t === 'reject') {
          if (!settled) finish(Object.assign(new Error(msg.reason), { type: msg.reason }));
          else this.#lost(msg.reason);
          return;
        }
        if (msg.t === 'bye') { this.#lost('host-left'); return; }
        if (msg.t === 'lobby' && !settled) finish(null, msg);
        this.h.onMessage?.(msg);
      });
      conn.on('close', () => { if (settled) this.#lost('lost'); else finish(Object.assign(new Error('no-room'), { type: 'no-room' })); });
    });
  }

  #lost(reason) {
    if (this.closed) return;
    this.close(true);
    this.h.onClose?.(reason);
  }

  send(msg) { safeSend(this.conn, msg); }

  close(silent = false) {
    if (this.closed) return;
    this.closed = true;
    this.w?.stop();
    if (!silent) safeSend(this.conn, { t: 'bye' });
    setTimeout(() => { try { this.conn?.close(); } catch {} try { this.peer?.destroy(); } catch {} }, 200);
  }
}
