/**
 * Play with Friends, across every game: a party.
 *
 * One phone hosts a party and gets a 6-digit code; friends join with the code or a link. The party
 * stays together while people move between games: every page (the home page and each game) joins the
 * party again by itself, because the code is remembered on each phone.
 *
 * The host is in charge. When the host picks a game, everyone in the party is taken to it:
 *  - as many as fit at one table play together (four at Ludo);
 *  - more than that are split into tables (pairs at Chess), each led by one of them.
 * A friend can suggest a game; the host accepts or turns it down.
 *
 * How it stays reliable when pages change: the host keeps the party's state (who is in it, which game
 * was picked, the tables and their room codes) and sends all of it whenever anybody (re)connects. So a
 * phone that was between pages simply reads the state when it is back and goes where it should.
 * Each table's own room is the game's usual "Play with friends" room: its lead opens it (mode=nearby),
 * reports the code, and the others join it (?join=code&auto=1).
 */
import { ALL_GAMES, CATEGORIES, gameBySlug, localName, allNames } from '../arcade/catalog.js?v=20261116-1239';
import { logoSvg } from '../arcade/logo.js?v=20261116-1239';
import { NearbyGuest, NearbyHost, newToken, randomCode } from './nearby.js?v=20261116-1239';
import { profile } from '../persistence/profile-store.js?v=20261116-1239';

const KEY = 'chitplay.party';            // { code, host }
const TOKEN_KEY = 'chitplay.partyToken';
const STATE_KEY = 'chitplay.partyState'; // the host's plan: { go }
const V = '?v=20261116-1239';
const DONE_KEY = 'chitplay.partyDone';   // the last plan this phone acted on
const MAX_FRIENDS = 9;
const channel = (code) => `party-${code}`;

const read = (k, fallback = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const myToken = () => { let t = read(TOKEN_KEY); if (!t) { t = newToken(); write(TOKEN_KEY, t); } return t; };
const myName = () => String(profile?.name || 'Player').slice(0, 14);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
/** Cops and Robbers lives on the home page (the 3D room), not in the table games' catalog, but a party plays it too. */
/**
 * The site-wide party (one lobby for every game) is switched off: friends play together from inside each
 * game, with that game's own room code, the way Cops and Robbers works. A party saved from before is let go.
 */
const PARTIES_ON = false;
export const COPS = { slug: 'cops-and-robbers', name: 'Cops and Robbers', icon: '👮', min: 2, max: 4, seats: 4, kind: 'Party', accent: '#b5341f', blurb: 'King, Queen, Police and Thief: the chit game.' };
const gameOf = (slug) => (slug === COPS.slug ? COPS : gameBySlug(slug));
// a game's name in the app's language (the chit game keeps its own English name here)
const shown = (slug, lang) => (slug === COPS.slug ? COPS.name : localName(slug, lang));
const partyGames = () => [COPS, ...ALL_GAMES.filter(g => g.max >= 2)];

/** Where this page is, relative to the site root. */
let ROOT = '';
let HERE = null;       // the game on this page (null on the home page)

let host = null, guest = null, members = [], state = { go: null }, status = 'off';
let ui = null;
let pendingTable = null;
const chips = new Set();   // party buttons inside a game's top bar (partyChip)   // a table code to report once the party line is back

/* ─── the plan: who plays where ─── */
export function planFor(slug, list) {
  const game = gameOf(slug);
  const size = Math.max(2, game?.max || 2);
  const tables = [];
  for (let i = 0; i < list.length; i += size) tables.push(list.slice(i, i + size));
  // one person left alone at the end joins the table before (unless that one is full: then they play the computer)
  // (written without Array.at, which older phones do not have)
  const last = tables[tables.length - 1], before = tables[tables.length - 2];
  if (tables.length > 1 && last.length === 1 && before.length < size) before.push(...tables.pop());
  // every table's room code is chosen now, so the lead and the friends head there at the same moment
  // (the lead's phone opens the room with it; the friends' phones keep knocking until it is up)
  const codes = {};
  tables.forEach((t, i) => { codes[i] = randomCode(); });
  return { id: Date.now(), slug, tables, codes };
}
const tableOf = (go, token) => go.tables.findIndex(t => t.includes(token));
// every game, Cops and Robbers included, opens on the play page: /play/?game=<slug>
const gameUrl = (slug, extra) => `${ROOT}play/?game=${encodeURIComponent(slug)}&${extra}`;
const nameOf = (slug, fallback) => gameOf(slug)?.name || fallback;

/** Act on the host's plan once: lead a table, or join one when its code is known. */
function follow(go) {
  if (!go) return;
  const me = myToken();
  const n = tableOf(go, me);
  if (n < 0) return;
  const done = read(DONE_KEY);
  const lead = go.tables[n][0] === me;
  const step = lead ? `${go.id}:lead` : `${go.id}:join`;
  if (done === step) return;
  if (lead) {
    write(DONE_KEY, step);
    toast(`Opening ${nameOf(go.slug, 'the game')} for your friends…`);
    const room = go.codes?.[n] ? `&room=${go.codes[n]}` : '';
    setTimeout(() => { location.href = gameUrl(go.slug, `mode=nearby&party=1${room}`); }, 60);
  } else if (go.codes?.[n]) {
    // the code is part of the step: if the lead's phone had to take another code, go again with that one
    const joinStep = `${step}:${go.codes[n]}`;
    if (done === joinStep) return;
    if (HERE && new URLSearchParams(location.search).get('join') === String(go.codes[n])) { write(DONE_KEY, joinStep); return; }
    write(DONE_KEY, joinStep);
    toast(`Joining ${nameOf(go.slug, 'the game')}…`);
    setTimeout(() => { location.href = gameUrl(go.slug, `join=${go.codes[n]}&auto=1`); }, 60);
  } else {
    toast(`${nameOf(go.slug, 'A game')} is starting: getting your seat ready…`);
  }
}

/* ─── host ─── */
function hostLobby() {
  members = [{ name: myName(), token: myToken(), host: true }, ...(host?.list || []).map(g => ({ name: g.name, token: g.token }))];
  // a proposal only counts the people still here
  if (proposal) proposal.yes = proposal.yes.filter(t => members.some(m => m.token === t));
  return { t: 'lobby', members, go: state.go, proposal };
}

/*
 * Starting a game in a party: whoever picks a game proposes it; everyone else is asked (Accept or
 * Reject). When all have said yes, the whole party goes to it together. A no, or no answer within
 * thirty seconds, calls it off. The host's phone keeps the proposal and tells everyone.
 */
const ASK_MS = 30000;
let proposal = null;   // { id, slug, from: { name, token }, yes: [tokens], at }
function propose(slug, fromToken) {
  if (!host || !gameOf(slug)) return;
  const from = members.find(m => m.token === fromToken) || { name: myName(), token: fromToken };
  if (proposal) { if (fromToken === myToken()) toast(`Waiting on ${nameOf(proposal.slug, 'a game')} first`); return; }
  proposal = { id: Date.now(), slug, from: { name: from.name, token: from.token }, yes: [fromToken], at: Date.now() };
  settleProposal();
}
function answerProposal(token, id, yes) {
  if (!proposal || proposal.id !== id) return;
  if (!yes) {
    const who = members.find(m => m.token === token)?.name || 'A friend';
    const slug = proposal.slug;
    proposal = null;
    host?.broadcast({ t: 'declined', who, slug });
    toast(`${who} said no to ${nameOf(slug, 'that game')}`);
    hostShare();
    return;
  }
  if (!proposal.yes.includes(token)) proposal.yes.push(token);
  settleProposal();
}
function settleProposal() {
  if (!proposal) return;
  const all = members.every(m => proposal.yes.includes(m.token));
  if (all) { const slug = proposal.slug; proposal = null; pick(slug); return; }
  hostShare();
}
if (typeof document !== 'undefined') setInterval(() => {   // (only in a browser: tests import this file too)
  if (!host) return;
  if (proposal && Date.now() - proposal.at > ASK_MS) {
    const slug = proposal.slug;
    proposal = null;
    host.broadcast({ t: 'declined', who: 'Nobody answered', slug, timeout: true });
    toast(`No answer for ${nameOf(slug, 'that game')}: called off`);
    hostShare();
  }
  // a party nobody plays in for thirty minutes closes by itself (a game page counts as playing)
  const now = Date.now();
  if (HERE) { if (now - (state.lastPlay || 0) > 60000) { state.lastPlay = now; write(STATE_KEY, state); } }
  else if (state.lastPlay && now - state.lastPlay > IDLE_MS) {
    host.broadcast({ t: 'idle-end' });
    leaveParty(true);
    toast('The party closed: no game was played for 30 minutes.');
  }
}, 1000);
const IDLE_MS = 30 * 60 * 1000;
function hostShare() { host?.broadcast(hostLobby()); paint(); }
async function openHost(code) {
  status = 'connecting'; paint();
  for (let attempt = 0; attempt < 25 && read(KEY)?.code === code; attempt++) {
    const room = new NearbyHost({
      onChange: () => hostShare(),
      onLeave: () => hostShare(),
      onMessage: (id, msg) => hostMessage(id, msg),
    }, { maxGuests: MAX_FRIENDS });
    room.hostName = myName();
    try {
      await room.open(channel(code));
      host = room;
      status = 'on';
      hostShare();
      if (pendingPick) { const s = pendingPick; pendingPick = null; pick(s); }
      return;
    } catch (e) {
      // the last page's line can take a moment to let go of the code
      try { room.close(); } catch {}
      await sleep(attempt < 4 ? 500 : 1500);
    }
  }
  status = 'error'; paint();
}
function hostMessage(id, msg) {
  const from = host.list.find(g => g.id === id);
  if (msg.t === 'table' && state.go && msg.id === state.go.id && Number.isInteger(msg.n) && /^\d{6}$/.test(String(msg.code))) {
    state.go.codes[msg.n] = String(msg.code);
    write(STATE_KEY, state);
    hostShare();
  } else if ((msg.t === 'suggest' || msg.t === 'propose') && from && gameOf(msg.slug)) {
    propose(msg.slug, from.token);
  } else if (msg.t === 'answer' && from) {
    answerProposal(from.token, msg.id, !!msg.yes);
  }
}
let pendingPick = null;
function pick(slug) {
  if (!host) { pendingPick = slug; return; }
  state.lastPlay = Date.now();
  state.go = planFor(slug, members.map(m => m.token));
  write(STATE_KEY, state);
  hostShare();
  follow(state.go);   // the host leads the first table
}

/* ─── friend ─── */
async function openGuest(code) {
  status = 'connecting'; paint();
  for (let attempt = 0; read(KEY)?.code === code && attempt < 40; attempt++) {
    const g = new NearbyGuest({
      onMessage: (msg) => guestMessage(msg),
      onClose: (reason) => {
        guest = null;
        if (['host-left', 'kicked'].includes(reason)) { leaveParty(true); toast('The party has ended.'); return; }
        status = 'connecting'; paint();
        setTimeout(() => { if (read(KEY)?.code === code && !guest) openGuest(code); }, 600);
      },
    });
    try {
      const lobby = await g.join(channel(code), myName(), myToken());
      guest = g;
      status = 'on';
      if (pendingTable) g.send(pendingTable);
      guestMessage(lobby);
      return;
    } catch (e) {
      if (['full', 'kicked'].includes(e?.type)) { leaveParty(true); toast(e.type === 'full' ? 'That party is full.' : 'You were removed from the party.'); return; }
      await sleep(attempt < 5 ? 700 : 2000);   // the host may be changing pages: try again in a moment
    }
  }
  if (!guest) { status = 'error'; paint(); }
}
function guestMessage(msg) {
  if (msg.t === 'lobby') {
    members = Array.isArray(msg.members) ? msg.members.slice(0, MAX_FRIENDS + 1) : [];
    state.go = msg.go || null;
    proposal = msg.proposal || null;
    paint();
    follow(state.go);
  } else if (msg.t === 'declined') toast(msg.timeout ? `No answer for ${nameOf(msg.slug, 'that game')}: called off` : `${msg.who} said no to ${nameOf(msg.slug, 'that game')}`);
  else if (msg.t === 'idle-end') toast('The party closed: no game was played for 30 minutes.');
}
function suggest(slug) {
  if (read(KEY)?.host) { propose(slug, myToken()); return; }
  guest?.send({ t: 'propose', slug });
}
function answer(yes) {
  if (!proposal) return;
  if (read(KEY)?.host) answerProposal(myToken(), proposal.id, yes);
  else { guest?.send({ t: 'answer', id: proposal.id, yes }); if (!yes) { proposal = null; paint(); } }
}

/**
 * Starting a game while in a party: the friends come along. The host's pick takes everyone there at
 * once (no codes, no questions); a friend's pick becomes a request to the host. Resolves true when the
 * party took over (the caller should not open the game itself).
 */
export async function partyPlay(slug) {   // resolves true when the party takes over
  if (!PARTIES_ON) return false;
  const p = read(KEY);
  const game = gameOf(slug);
  if (!p || !game || game.max < 2) return false;
  if (p.host) {
    // a page just opened: the party line and the friends on it take a moment to come back
    if (status !== 'on' || members.length < 2) {
      toast('Getting your party together…');
      const start = Date.now();
      while (Date.now() - start < 5000 && (status !== 'on' || members.length < 2) && read(KEY)?.code === p.code) await sleep(200);
    }
    if (members.length < 2) return false;   // nobody has joined yet: just play
    propose(slug, myToken());
    return true;
  }
  // a friend: the same, through the host's phone (which leads the table)
  if (status !== 'on') {
    toast('Getting your party together…');
    const start = Date.now();
    while (Date.now() - start < 5000 && status !== 'on' && read(KEY)?.code === p.code) await sleep(200);
  }
  if (status !== 'on') return false;
  suggest(slug);
  return true;
}

/* ─── start, join, leave ─── */
function startParty() {
  setTimeout(() => dispatchEvent(new CustomEvent('chitplay:party-changed')), 0);
  const code = randomCode();
  write(KEY, { code, host: true });
  state = { go: null, lastPlay: Date.now() };
  write(STATE_KEY, state);
  openHost(code);
}
export function joinParty(code) {
  if (!PARTIES_ON) return;
  setTimeout(() => dispatchEvent(new CustomEvent('chitplay:party-changed')), 0);
  if (read(KEY)?.code === code && (guest || status === 'connecting')) return;
  // one party at a time: let go of any other first
  try { host?.close(); } catch {}
  try { guest?.close(); } catch {}
  host = null; guest = null;
  write(KEY, { code, host: false });
  write(DONE_KEY, null);
  openGuest(code);
}
function leaveParty(quiet = false) {
  const wasHost = !!read(KEY)?.host;
  try { host?.close(); } catch {}
  try { guest?.close(); } catch {}
  host = null; guest = null; members = []; state = { go: null }; status = 'off'; proposal = null;
  document.querySelector('.party-ask')?.remove();
  write(KEY, null); write(STATE_KEY, null); write(DONE_KEY, null);
  if (!quiet) toast(wasHost ? 'You stopped hosting: the party has ended for everyone.' : 'You left the party.');
  paint();
}

/* ─── a table's lead reports its room's code ─── */
addEventListener('chitplay:room-open', (e) => {
  const { code, slug } = e.detail || {};
  const go = state.go;
  if (!go || go.slug !== slug || !/^\d{6}$/.test(String(code))) return;
  const n = tableOf(go, myToken());
  if (n < 0 || go.tables[n][0] !== myToken()) return;
  // the code is kept first, then sent: the party's own line may still be coming back after the page change
  if (read(KEY)?.host) { go.codes[n] = String(code); write(STATE_KEY, state); hostShare(); }
  else { pendingTable = { t: 'table', id: go.id, n, code: String(code) }; guest?.send(pendingTable); }
});
// leaving a page: let go of the party's line at once, so the next page can take it straight back
addEventListener('pagehide', () => { try { host?.peer?.destroy(); } catch {} try { guest?.peer?.destroy(); } catch {} });

/* ─── the button and the panel ─── */
const CSS = `
.party-pill{position:fixed;z-index:60;display:flex;align-items:center;gap:6px;padding:9px 14px;border-radius:999px;border:2px solid rgba(255,210,63,.55);background:rgba(28,16,10,.92);color:#ffd27a;font:800 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.party-pill:hover{background:rgba(48,28,16,.95)}
.partychip{display:inline-flex;align-items:center;gap:5px;font-weight:800;white-space:nowrap}
.partychip[hidden]{display:none}
.partychip__dot{width:8px;height:8px;border-radius:50%;background:#888;display:inline-block}
.partychip__dot.on{background:#3ddc6a}.partychip__dot.connecting{background:#ffd23f}
.partychip__leave{margin-left:6px;padding:2px 8px;border-radius:999px;background:rgba(255,107,87,.18);border:1px solid rgba(255,140,120,.45);color:#ffb3a6;font-weight:800;font-size:12px;cursor:pointer}
.party-pill--home{left:14px;bottom:14px}
.party-pill--play{left:50%;transform:translateX(-50%);top:10px;padding:6px 12px;font-size:13px}
.party-pill i{width:9px;height:9px;border-radius:50%;background:#888;display:inline-block}
.party-pill i.on{background:#3ddc6a}.party-pill i.connecting{background:#ffd23f}
.party-sheet{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:14px}
.party-card{width:min(560px,100%);max-height:90vh;overflow:auto;background:#1e120b;color:#f6ead2;border:1px solid rgba(255,210,122,.25);border-radius:18px;padding:16px 16px 18px;font:15px/1.5 system-ui,sans-serif}
.party-card h2{margin:0 0 6px;color:#ffd27a;font-size:22px}
.party-card p{margin:6px 0}
.party-code{font:900 34px ui-monospace,Consolas,monospace;letter-spacing:6px;color:#fff;text-align:center;margin:8px 0}
.party-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.party-btn{flex:1 1 auto;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,210,122,.35);background:#2c1a10;color:#ffd27a;font:800 15px system-ui,sans-serif;cursor:pointer}
.party-btn--main{background:linear-gradient(#ffb347,#f0791f);color:#1e120b;border:0}
.party-btn--quiet{background:transparent;color:#d4c2a0;font-weight:700}
.party-btn--danger{background:transparent;color:#ff9b8a;border-color:rgba(255,120,100,.45)}
.party-or{text-align:center;color:#d4c2a0;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:12px 0 2px}
.party-scan:empty{display:none}
.party-video{display:block;width:100%;max-height:min(46vh,320px);object-fit:cover;border-radius:14px;background:#000;margin-top:8px}
.party-note{text-align:center;color:#d4c2a0;font-size:13px}
.party-lobby{align-items:stretch;padding:0}
.party-lobby .party-card{width:100%;max-width:760px;max-height:100dvh;height:100dvh;margin:0 auto;border-radius:0;display:flex;flex-direction:column;gap:6px;padding:max(12px,env(safe-area-inset-top)) 14px max(12px,env(safe-area-inset-bottom))}
.party-lobby .party-card>*{flex:none}
.party-lobby .party-card>.party-games{flex:1 1 auto;min-height:0;overflow-y:auto;align-content:start;padding-bottom:6px}
.party-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.party-top h2{margin:0}
.party-leave{flex:none;padding:8px 12px}
.party-status{margin:2px 0;color:#d4c2a0;font-size:13px}
.party-invite{background:#24140c;border-radius:12px;padding:6px 10px}
.party-invite summary{cursor:pointer;font-weight:800;color:#ffd27a}
.party-search{width:100%;padding:11px 14px;border-radius:12px;border:1px solid rgba(255,210,122,.35);background:#120a06;color:#fff;font:600 15px system-ui,sans-serif}
.party-cats{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}
.party-cat{flex:none;padding:7px 12px;border-radius:999px;border:1px solid rgba(255,210,122,.35);background:#2c1a10;color:#f6ead2;font:700 13px system-ui,sans-serif;cursor:pointer}
.party-cat.on{background:#ffd27a;color:#1e120b}
.party-ask{z-index:75}
.party-askcard{text-align:center}
.party-asklogo{display:flex;justify-content:center;margin:4px 0}
.party-spinner{width:28px;height:28px;margin:8px auto;border-radius:50%;border:3px solid rgba(255,210,122,.25);border-top-color:#ffd27a;animation:party-spin 1s linear infinite}
@keyframes party-spin{to{transform:rotate(360deg)}}
@media (max-width:420px){.party-sheet{padding:8px;align-items:flex-end}.party-card{max-height:calc(100dvh - 16px);border-radius:18px 18px 14px 14px;padding:14px 12px 16px}.party-code{font-size:28px;letter-spacing:4px}.party-games{grid-template-columns:repeat(auto-fill,minmax(74px,1fr))}.party-btn{padding:11px 10px;font-size:14px}}
.party-input{flex:1 1 140px;padding:12px;border-radius:12px;border:1px solid rgba(255,210,122,.35);background:#120a06;color:#fff;font:800 20px ui-monospace,monospace;letter-spacing:3px;text-align:center}
.party-qr{display:flex;justify-content:center;margin:6px 0}.party-qr svg{width:150px;height:150px;background:#fff;padding:8px;border-radius:12px}
.party-members{list-style:none;padding:0;margin:8px 0;display:flex;flex-wrap:wrap;gap:6px}
.party-members li{padding:5px 10px;border-radius:999px;background:#2c1a10;font-weight:700;font-size:13px}
.party-games{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px;margin-top:8px}
.party-games button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:12px;border:1px solid transparent;background:#2a180e;color:#f6ead2;font:700 11px/1.2 system-ui,sans-serif;cursor:pointer}
.party-games button:hover{border-color:#ffd27a}
.party-games button.here{border-color:#3ddc6a}
.party-games svg{width:48px;height:48px}
.party-toast{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:80;background:#2c1a10;color:#ffd27a;border:1px solid rgba(255,210,122,.4);padding:10px 16px;border-radius:12px;font:700 14px system-ui,sans-serif;max-width:90vw;text-align:center}
`;
function el(tag, attrs = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'onclick') n.addEventListener('click', v);
    else if (k === 'html') n.innerHTML = v;
    else if (v != null) n.setAttribute(k, v);
  }
  n.append(...kids.filter(x => x != null));
  return n;
}
let toastTimer = 0;
function toast(text) {
  document.querySelector('.party-toast')?.remove();
  const t = el('div', { class: 'party-toast', role: 'status' }, [text]);
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3500);
}
function confirmBox(title, yes, no, done) {
  const sheet = el('div', { class: 'party-sheet', role: 'dialog', 'aria-modal': 'true' }, [
    el('div', { class: 'party-card' }, [
      el('h2', {}, [title]),
      el('div', { class: 'party-row' }, [
        el('button', { class: 'party-btn party-btn--main', type: 'button', onclick: () => { sheet.remove(); done(true); } }, [yes]),
        el('button', { class: 'party-btn', type: 'button', onclick: () => { sheet.remove(); done(false); } }, [no]),
      ]),
    ]),
  ]);
  document.body.append(sheet);
}
// from the page's base: on the Cops and Robbers page that is the site's root, like the home page
/** Leave (a friend) or stop hosting (the host): asked once, then done. */
function askLeave() {
  const host = !!read(KEY)?.host;
  confirmBox(host ? 'Stop hosting? The party ends for everyone.' : 'Leave the party?', host ? 'Stop hosting' : 'Leave', 'Stay', (yes) => {
    if (!yes) return;
    document.querySelector('.party-sheet')?.remove();
    if (ui) ui.open = false;
    leaveParty();
    // out of the party: the page offers every way of playing again
    dispatchEvent(new CustomEvent('chitplay:party-changed'));
  });
}
function inviteLink(code) { return `${new URL(ROOT || './', document.baseURI).href.split('?')[0]}?party=${code}`; }

function paint() {
  const p = read(KEY);
  const n = members.length;
  for (const c of chips) {
    // a button that was on the page and has gone (the bar was redrawn) is forgotten; a new one not yet placed is painted
    if (c.isConnected) c.dataset.placed = '1';
    else if (c.dataset.placed) { chips.delete(c); continue; }
    c.hidden = !p && !c.dataset.always;
    if (p) {
      const leave = el('span', { class: 'partychip__leave', role: 'button', 'aria-label': p.host ? 'Stop hosting' : 'Leave the party' }, ['🚪 Leave']);
      leave.addEventListener('click', (e) => { e.stopPropagation(); askLeave(); });
      c.replaceChildren(el('i', { class: `partychip__dot ${status}` }), `👫 ${Math.max(1, n)}`, leave);
    }
    else c.replaceChildren('👫 ', el('span', { class: 'partychip__long' }, ['Play with ']), 'Friends');
    c.setAttribute('aria-label', p ? `Your party: ${n} players. Open party` : 'Play with friends: start or join a party');
  }
  if (!ui) return;
  // in a game, the button is there for a party only: the game's own menu already offers Play with friends
  ui.pill.hidden = ui.place === 'play' && !p;
  ui.pill.replaceChildren(
    el('i', { class: p ? status : '' }),
    p ? `👫 Party · ${Math.max(1, n)}` : '👫 Play with Friends',
  );
  ui.pill.setAttribute('aria-label', p ? `Your party: ${n} players. Open party` : 'Play with friends: start or join a party');
  if (ui.open) openPanel();
  paintAsk();
}
/** A game someone proposed: Accept or Reject; for the one who proposed it, the wait for the others. */
function paintAsk() {
  const box = document.querySelector('.party-ask');
  const p = read(KEY);
  if (!p || !proposal || status !== 'on') { box?.remove(); return; }
  const mine = proposal.yes.includes(myToken());
  const key = `${proposal.id}:${mine}:${proposal.yes.length}:${members.length}`;
  if (box?.dataset.key === key) return;
  box?.remove();
  const game = gameOf(proposal.slug);
  const name = shown(proposal.slug, appLang());
  const who = proposal.from.token === myToken() ? 'You' : proposal.from.name;
  const left = Math.max(0, Math.ceil((ASK_MS - (Date.now() - proposal.at)) / 1000));
  const card = el('div', { class: 'party-card party-askcard' }, mine ? [
    el('div', { class: 'party-asklogo', html: logoSvg(game, 72) }),
    el('h2', {}, [`${name}`]),
    el('p', {}, [`Waiting for your friends to accept… ${proposal.yes.length} of ${members.length} ready`]),
    el('div', { class: 'party-spinner' }),
    el('div', { class: 'party-row' }, [el('button', { class: 'party-btn party-btn--quiet', type: 'button', onclick: () => answer(false) }, ['Cancel'])]),
  ] : [
    el('div', { class: 'party-asklogo', html: logoSvg(game, 72) }),
    el('h2', {}, [`${who} wants to play ${name}`]),
    el('p', {}, [`${proposal.yes.length} of ${members.length} ready · answer within ${left} seconds`]),
    el('div', { class: 'party-row' }, [
      el('button', { class: 'party-btn party-btn--main', type: 'button', onclick: () => { answer(true); } }, ['✅ Accept']),
      el('button', { class: 'party-btn party-btn--danger', type: 'button', onclick: () => answer(false) }, ['❌ Reject']),
    ]),
  ]);
  const sheet = el('div', { class: 'party-sheet party-ask', role: 'dialog', 'aria-modal': 'true' }, [card]);
  sheet.dataset.key = key;
  document.body.append(sheet);
}
/** The app's language (the same setting every page reads), for game names in the lobby. */
const appLang = () => { try { return (JSON.parse(localStorage.getItem('chitplay.settings.v1') || '{}').data?.chatLang) || 'en'; } catch { return 'en'; } };
function gameGrid(onPick) {
  const here = HERE ? gameBySlug(HERE) : null;
  const list = [...(here && here.max >= 2 ? [here] : []), ...partyGames().filter(g => g !== here)];
  return el('div', { class: 'party-games' }, list.map(g => el('button', { type: 'button', class: g === here ? 'here' : '', title: g.blurb, onclick: () => onPick(g.slug) }, [
    el('span', { html: logoSvg(g, 48) }), g === here ? `▶ ${g.name}` : g.name,
  ])));
}
let lobbyQuery = '', lobbyKind = '';
function openPanel() {
  ui.open = true;
  const wasFocused = document.activeElement?.classList?.contains('party-search');
  document.querySelector('.party-sheet:not(.party-ask)')?.remove();
  const close = () => { ui.open = false; sheet.remove(); };
  const p = read(KEY);
  const card = el('div', { class: 'party-card' });
  const sheet = el('div', { class: 'party-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Play with friends' }, [card]);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
  if (!p) {
    const input = el('input', { class: 'party-input', inputmode: 'numeric', maxlength: '7', autocomplete: 'one-time-code', placeholder: '6-digit code', 'aria-label': 'Party code' });
    const tryJoin = () => { const c = input.value.replace(/\D/g, ''); if (c.length === 6) { joinParty(c); return true; } return false; };
    // six digits typed or pasted: joined at once, no extra tap
    input.addEventListener('input', () => { if (input.value.replace(/\D/g, '').length === 6) tryJoin(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !tryJoin()) input.focus(); });
    const scanArea = el('div', { class: 'party-scan' });
    card.append(
      el('h2', {}, ['👫 Play with Friends']),
      el('p', {}, ['Join once, then play together: whatever game the host starts, everyone in the party goes with them. No codes again.']),
      el('div', { class: 'party-row' }, [el('button', { class: 'party-btn party-btn--main', type: 'button', onclick: () => { startParty(); } }, ['🎉 Host a party'])]),
      el('p', { class: 'party-or' }, ['or join a friend']),
      el('div', { class: 'party-row' }, [el('button', { class: 'party-btn', type: 'button', onclick: () => openScanner(scanArea, (c) => joinParty(c)) }, ['📷 Scan QR'])]),
      scanArea,
      el('div', { class: 'party-row' }, [input, el('button', { class: 'party-btn', type: 'button', onclick: () => { if (!tryJoin()) input.focus(); } }, ['Join'])]),
      el('div', { class: 'party-row' }, [el('button', { class: 'party-btn party-btn--quiet', type: 'button', onclick: close }, ['Close'])]),
    );
  } else {
    const iAmHost = !!p.host;
    const link = inviteLink(p.code);
    sheet.classList.add('party-lobby');
    const lang = appLang();
    const search = el('input', { class: 'party-search', type: 'search', placeholder: '🔍 Search games', 'aria-label': 'Search games', enterkeyhint: 'search' });
    search.value = lobbyQuery;
    const chipsRow = el('div', { class: 'party-cats' });
    const grid = el('div', { class: 'party-games' });
    const paintGrid = () => {
      const q = lobbyQuery.trim().toLowerCase();
      const list = partyGames().filter(g => (!lobbyKind || g.kind === lobbyKind) && (!q || `${g.name} ${localName(g.slug, lang)} ${g.aka || ''} ${allNames(g.slug)}`.toLowerCase().includes(q)));
      grid.replaceChildren(...list.map(g => el('button', { type: 'button', title: g.blurb || '', onclick: () => {
        if (status !== 'on') { toast('Still connecting…'); return; }
        if (members.length < 2) { toast('Waiting for a friend to join: share the code first'); return; }
        suggest(g.slug);
      } }, [el('span', { html: logoSvg(g, 52) }), shown(g.slug, lang)])));
      if (!list.length) grid.append(el('p', { class: 'party-note' }, ['No game matches that.']));
      chipsRow.replaceChildren(...['', ...CATEGORIES].map(k => el('button', { type: 'button', class: `party-cat${k === lobbyKind ? ' on' : ''}`, onclick: () => { lobbyKind = k; paintGrid(); } }, [k || 'All'])));
    };
    search.addEventListener('input', () => { lobbyQuery = search.value; paintGrid(); });
    paintGrid();
    card.append(...[
      el('div', { class: 'party-top' }, [
        el('h2', {}, [`👫 ${iAmHost ? 'Your party' : 'Party'} · ${Math.max(1, members.length)}`]),
        el('button', { class: 'party-btn party-btn--danger party-leave', type: 'button', onclick: () => askLeave() }, [iAmHost ? '⏹ Stop' : '🚪 Leave']),
      ]),
      el('ul', { class: 'party-members', 'aria-label': 'In the party' }, members.map(m => el('li', {}, [`${m.host ? '👑 ' : '✅ '}${m.name}`]))),
      el('p', { class: 'party-status' }, [status === 'on' ? (members.length < 2 ? (iAmHost ? 'Share the code: your friends join from their own phones.' : 'Connected. Waiting for the others…') : 'Pick any game: everyone is asked, and when all accept you play it together.') : status === 'error' ? 'Could not reach the party. Check the internet and try again.' : 'Connecting…']),
      iAmHost ? el('details', { class: 'party-invite', ...(members.length < 2 ? { open: '' } : {}) }, [
        el('summary', {}, [`➕ Invite friends · code ${p.code}`]),
        el('div', { class: 'party-code', 'aria-label': `Party code ${p.code.split('').join(' ')}` }, [p.code]),
        (() => { const q = el('div', { class: 'party-qr', 'aria-label': 'Scan to join the party' }); import(`./qr.js${V}`).then(({ qrSvg }) => { const svg = qrSvg(link, 'Scan to join the party'); if (svg) q.append(svg); }).catch(() => {}); return q; })(),
        el('div', { class: 'party-row' }, [
          el('button', { class: 'party-btn', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(link); toast('Invite link copied'); } catch { toast(link); } } }, ['🔗 Copy link']),
          navigator.share ? el('button', { class: 'party-btn', type: 'button', onclick: () => navigator.share({ title: 'Play with me on ChitPlay', text: `Join my ChitPlay party: code ${p.code}`, url: link }).catch(() => {}) }, ['📤 Share']) : null,
        ]),
      ]) : null,
      search,
      chipsRow,
      grid,
      el('div', { class: 'party-row' }, [
        status === 'error' ? el('button', { class: 'party-btn', type: 'button', onclick: () => (iAmHost ? openHost(p.code) : openGuest(p.code)) }, ['Try again']) : null,
        el('button', { class: 'party-btn party-btn--quiet', type: 'button', onclick: close }, ['Close lobby']),
      ]),
    ].filter(Boolean));
    if (wasFocused) queueMicrotask(() => { search.focus(); search.setSelectionRange(search.value.length, search.value.length); });
  }
  document.body.append(sheet);
}

/**
 * Put the party button on this page and join the party again if this phone is in one.
 * @param {{ root?: string, game?: string|null, place?: 'home'|'play' }} o
 */
export function mountParty({ root = '', game = null, place = 'home' } = {}) {
  if (ui) return;
  if (!PARTIES_ON) { try { write(KEY, null); write(STATE_KEY, null); write(DONE_KEY, null); } catch {} return; }
  ROOT = root; HERE = game;
  const style = el('style', {}, [CSS]);
  document.head.append(style);
  const pill = el('button', { class: `party-pill party-pill--${place}`, type: 'button', onclick: () => openPanel() });
  ui = { pill, open: false, place };
  // the button sits in each page's own bar (partyChip); only a page without one gets the floating button
  if (place === 'float') document.body.append(pill);
  // an invite link: ?party=123456
  const params = new URLSearchParams(location.search);
  const invited = (params.get('party') || '').replace(/\D/g, '');
  if (invited.length === 6) {
    try { const u = new URL(location.href); u.searchParams.delete('party'); history.replaceState(null, '', u); } catch {}
    // they scanned the host's code or opened the link: that is the yes, so join straight away
    if (read(KEY)?.code !== invited) { write(KEY, { code: invited, host: false }); write(DONE_KEY, null); toast('Joining the party…'); }
  }
  const p = read(KEY);
  if (p) {
    state = read(STATE_KEY, { go: null }) || { go: null };
    if (p.host) openHost(p.code); else openGuest(p.code);
    // back on the home page while in a party: straight into the party's lobby
    if (place === 'home') setTimeout(() => { if (read(KEY) && !ui.open) openPanel(); }, 400);
  }
  paint();
}
export const inParty = () => PARTIES_ON && !!read(KEY);
/** On a table this phone leads for the party: how many of the party are meant to sit at it (else 0). */
export function myTableSize(slug) {
  const go = (read(STATE_KEY) || state)?.go;
  if (!go || go.slug !== slug) return 0;
  const n = tableOf(go, myToken());
  return n >= 0 && go.tables[n][0] === myToken() ? go.tables[n].length : 0;
}

/** A party button for a game's top bar: it sits with the other buttons, so it never covers the game. */
export function partyChip({ always = false, className = 'back partychip' } = {}) {
  if (!PARTIES_ON) return el('span', { hidden: '', 'aria-hidden': 'true' });
  const c = el('button', { type: 'button', class: className, title: 'Play with friends', onclick: () => openPanel() });
  if (always) c.dataset.always = '1';
  chips.add(c);
  queueMicrotask(paint);
  return c;
}

/**
 * Opening a game while in a party: the party plays it together. The host is asked to take everyone
 * there; a friend is asked to suggest it. Asked once the party line is back and friends who were
 * changing pages have had a few seconds to return, so nobody is left out of the plan.
 */
export async function offerParty(slug) {
  return partyPlay(slug);
}

/** The camera (or a photo) reads the host's party QR code. */
function openScanner(box, onCode) {
  box.replaceChildren();
  const video = el('video', { class: 'party-video', playsinline: '', muted: '' });
  const note = el('p', { class: 'party-note' }, ['Point the camera at the host’s QR code']);
  const photo = el('input', { type: 'file', accept: 'image/*', hidden: '' });
  let cam = null;
  const stop = () => { cam?.stop(); cam = null; box.replaceChildren(); };
  const got = (code) => { stop(); onCode(code); };
  photo.addEventListener('change', async () => {
    const f = photo.files?.[0];
    if (!f) return;
    note.textContent = 'Reading the picture…';
    try { const { codeFromPhoto } = await import(`./qr-scan.js${V}`); const r = await codeFromPhoto(f); if (r.code) { got(r.code); return; } note.textContent = 'No ChitPlay code in that picture.'; } catch { note.textContent = 'Could not read that picture.'; }
  });
  box.append(video, note, el('div', { class: 'party-row' }, [
    el('button', { class: 'party-btn', type: 'button', onclick: () => photo.click() }, ['🖼️ From a photo']),
    el('button', { class: 'party-btn party-btn--quiet', type: 'button', onclick: stop }, ['Cancel']),
  ]), photo);
  import(`./qr-scan.js${V}`).then(({ startCameraScan }) => {
    if (!video.isConnected) return;
    cam = startCameraScan(video, got, () => { note.textContent = 'That is not a ChitPlay code.'; });
    cam.ready.catch(() => { video.remove(); note.textContent = 'The camera is not available here: pick a photo of the code instead.'; });
  }).catch(() => { note.textContent = 'The scanner could not load: type the code instead.'; });
}
