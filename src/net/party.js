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
import { ALL_GAMES, gameBySlug } from '../arcade/catalog.js?v=20261114-1459';
import { logoSvg } from '../arcade/logo.js?v=20261114-1459';
import { NearbyGuest, NearbyHost, newToken, randomCode } from './nearby.js?v=20261114-1459';
import { profile } from '../persistence/profile-store.js?v=20261114-1459';

const KEY = 'chitplay.party';            // { code, host }
const TOKEN_KEY = 'chitplay.partyToken';
const STATE_KEY = 'chitplay.partyState'; // the host's plan: { go }
const DONE_KEY = 'chitplay.partyDone';   // the last plan this phone acted on
const MAX_FRIENDS = 9;
const channel = (code) => `party-${code}`;

const read = (k, fallback = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const myToken = () => { let t = read(TOKEN_KEY); if (!t) { t = newToken(); write(TOKEN_KEY, t); } return t; };
const myName = () => String(profile?.name || 'Player').slice(0, 14);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const partyGames = () => ALL_GAMES.filter(g => g.max >= 2);

/** Where this page is, relative to the site root. */
let ROOT = '';
let HERE = null;       // the game on this page (null on the home page)

let host = null, guest = null, members = [], state = { go: null }, status = 'off';
let ui = null;
let pendingTable = null;
const chips = new Set();   // party buttons inside a game's top bar (partyChip)   // a table code to report once the party line is back

/* ─── the plan: who plays where ─── */
export function planFor(slug, list) {
  const game = gameBySlug(slug);
  const size = Math.max(2, game?.max || 2);
  const tables = [];
  for (let i = 0; i < list.length; i += size) tables.push(list.slice(i, i + size));
  // one person left alone at the end joins the table before (unless that one is full: then they play the computer)
  // (written without Array.at, which older phones do not have)
  const last = tables[tables.length - 1], before = tables[tables.length - 2];
  if (tables.length > 1 && last.length === 1 && before.length < size) before.push(...tables.pop());
  return { id: Date.now(), slug, tables, codes: {} };
}
const tableOf = (go, token) => go.tables.findIndex(t => t.includes(token));
const gameUrl = (slug, extra) => `${ROOT}play/?game=${encodeURIComponent(slug)}&${extra}`;

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
    toast(`Opening ${gameBySlug(go.slug)?.name || 'the game'} for your table…`);
    setTimeout(() => { location.href = gameUrl(go.slug, 'mode=nearby&party=1'); }, 600);
  } else if (go.codes?.[n]) {
    write(DONE_KEY, step);
    toast(`Joining ${gameBySlug(go.slug)?.name || 'the game'}…`);
    setTimeout(() => { location.href = gameUrl(go.slug, `join=${go.codes[n]}&auto=1`); }, 600);
  } else {
    toast(`${gameBySlug(go.slug)?.name || 'A game'} is about to start: waiting for your table…`);
  }
}

/* ─── host ─── */
function hostLobby() {
  members = [{ name: myName(), token: myToken(), host: true }, ...(host?.list || []).map(g => ({ name: g.name, token: g.token }))];
  return { t: 'lobby', members, go: state.go };
}
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
      await sleep(1500);
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
  } else if (msg.t === 'suggest' && from && gameBySlug(msg.slug)) {
    askHost(from, msg.slug);
  }
}
let pendingPick = null;
function pick(slug) {
  if (!host) { pendingPick = slug; return; }
  state.go = planFor(slug, members.map(m => m.token));
  write(STATE_KEY, state);
  hostShare();
  follow(state.go);   // the host leads the first table
}
function askHost(from, slug) {
  const game = gameBySlug(slug);
  confirmBox(`${from.name} wants to play ${game.name}`, 'Accept', 'Not now', (yes) => {
    if (yes) pick(slug);
    else host?.send(from.id, { t: 'nope', slug });
  });
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
        setTimeout(() => { if (read(KEY)?.code === code && !guest) openGuest(code); }, 1500);
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
      await sleep(2000);   // the host may be changing pages: try again in a moment
    }
  }
  if (!guest) { status = 'error'; paint(); }
}
function guestMessage(msg) {
  if (msg.t === 'lobby') {
    members = Array.isArray(msg.members) ? msg.members.slice(0, MAX_FRIENDS + 1) : [];
    state.go = msg.go || null;
    paint();
    follow(state.go);
  } else if (msg.t === 'nope') toast(`The host passed on ${gameBySlug(msg.slug)?.name || 'that game'} for now.`);
}
function suggest(slug) {
  guest?.send({ t: 'suggest', slug });
  toast(`Suggested ${gameBySlug(slug)?.name}: the host decides.`);
}

/* ─── start, join, leave ─── */
function startParty() {
  const code = randomCode();
  write(KEY, { code, host: true });
  state = { go: null };
  write(STATE_KEY, state);
  openHost(code);
}
export function joinParty(code) {
  write(KEY, { code, host: false });
  write(DONE_KEY, null);
  openGuest(code);
}
function leaveParty(quiet = false) {
  try { host?.close(); } catch {}
  try { guest?.close(); } catch {}
  host = null; guest = null; members = []; state = { go: null }; status = 'off';
  write(KEY, null); write(STATE_KEY, null); write(DONE_KEY, null);
  if (!quiet) toast('You left the party.');
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
function inviteLink(code) { return `${new URL(ROOT || './', location.href).href.split('?')[0]}?party=${code}`; }

function paint() {
  const p = read(KEY);
  const n = members.length;
  for (const c of chips) {
    // a button that was on the page and has gone (the bar was redrawn) is forgotten; a new one not yet placed is painted
    if (c.isConnected) c.dataset.placed = '1';
    else if (c.dataset.placed) { chips.delete(c); continue; }
    c.hidden = !p && !c.dataset.always;
    if (p) c.replaceChildren(el('i', { class: `partychip__dot ${status}` }), `👫 ${Math.max(1, n)}`);
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
}
function gameGrid(onPick) {
  const here = HERE ? gameBySlug(HERE) : null;
  const list = [...(here && here.max >= 2 ? [here] : []), ...partyGames().filter(g => g !== here)];
  return el('div', { class: 'party-games' }, list.map(g => el('button', { type: 'button', class: g === here ? 'here' : '', title: g.blurb, onclick: () => onPick(g.slug) }, [
    el('span', { html: logoSvg(g, 48) }), g === here ? `▶ ${g.name}` : g.name,
  ])));
}
function openPanel() {
  ui.open = true;
  document.querySelector('.party-sheet')?.remove();
  const close = () => { ui.open = false; sheet.remove(); };
  const p = read(KEY);
  const card = el('div', { class: 'party-card' });
  const sheet = el('div', { class: 'party-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Play with friends' }, [card]);
  sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
  if (!p) {
    const input = el('input', { class: 'party-input', inputmode: 'numeric', maxlength: '6', placeholder: '6-digit code', 'aria-label': 'Party code' });
    card.append(
      el('h2', {}, ['👫 Play with Friends']),
      el('p', {}, ['Start a party and your friends join from their own phones. You pick the games; everyone goes with you from game to game. Friends can suggest a game, and you decide.']),
      el('div', { class: 'party-row' }, [el('button', { class: 'party-btn party-btn--main', type: 'button', onclick: () => { startParty(); } }, ['🎉 Start a party'])]),
      el('p', {}, ['Got a code from a friend?']),
      el('div', { class: 'party-row' }, [input, el('button', { class: 'party-btn', type: 'button', onclick: () => { const c = input.value.replace(/\D/g, ''); if (c.length === 6) joinParty(c); else input.focus(); } }, ['Join party'])]),
      el('div', { class: 'party-row' }, [el('button', { class: 'party-btn party-btn--quiet', type: 'button', onclick: close }, ['Close'])]),
    );
  } else {
    const iAmHost = !!p.host;
    const link = inviteLink(p.code);
    card.append(
      el('h2', {}, [iAmHost ? '🎉 Your party' : '👫 Party']),
      el('p', {}, [status === 'on' ? (iAmHost ? 'Friends join with this code or the link:' : 'You are in. The host picks the game; you can suggest one.') : status === 'error' ? 'Could not reach the party. Check the internet and try again.' : 'Connecting…']),
      el('div', { class: 'party-code', 'aria-label': `Party code ${p.code.split('').join(' ')}` }, [p.code]),
      // a QR of the invite link: friends point their camera at it and are asked to join
      iAmHost ? (() => { const q = el('div', { class: 'party-qr', 'aria-label': 'Scan to join the party' }); import(`./qr.js?v=20261114-1459`).then(({ qrSvg }) => { const svg = qrSvg(link, 'Scan to join the party'); if (svg) q.append(svg); }).catch(() => {}); return q; })() : null,
      iAmHost ? el('div', { class: 'party-row' }, [
        el('button', { class: 'party-btn', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(link); toast('Invite link copied'); } catch { toast(link); } } }, ['🔗 Copy invite link']),
        navigator.share ? el('button', { class: 'party-btn', type: 'button', onclick: () => navigator.share({ title: 'Play with me on ChitPlay', text: `Join my ChitPlay party: code ${p.code}`, url: link }).catch(() => {}) }, ['📤 Share']) : null,
      ]) : null,
      el('ul', { class: 'party-members', 'aria-label': 'In the party' }, members.map(m => el('li', {}, [`${m.host ? '👑 ' : ''}${m.name}`]))),
      el('p', {}, [iAmHost ? 'Pick a game: everyone in the party goes to it. (At 2-player games the party splits into pairs.)' : 'Suggest a game to the host:']),
      gameGrid((slug) => { close(); if (iAmHost) pick(slug); else suggest(slug); }),
      el('div', { class: 'party-row' }, [
        status === 'error' ? el('button', { class: 'party-btn', type: 'button', onclick: () => (iAmHost ? openHost(p.code) : openGuest(p.code)) }, ['Try again']) : null,
        el('button', { class: 'party-btn party-btn--quiet', type: 'button', onclick: () => { if (window.confirm(iAmHost ? 'End the party for everyone?' : 'Leave the party?')) { close(); leaveParty(); } } }, [iAmHost ? 'End party' : 'Leave party']),
        el('button', { class: 'party-btn party-btn--quiet', type: 'button', onclick: close }, ['Close']),
      ]),
    );
  }
  document.body.append(sheet);
}

/**
 * Put the party button on this page and join the party again if this phone is in one.
 * @param {{ root?: string, game?: string|null, place?: 'home'|'play' }} o
 */
export function mountParty({ root = '', game = null, place = 'home' } = {}) {
  if (ui) return;
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
  if (invited.length === 6 && read(KEY)?.code !== invited) {
    try { const u = new URL(location.href); u.searchParams.delete('party'); history.replaceState(null, '', u); } catch {}
    confirmBox(`Join the party ${invited}?`, 'Join', 'No thanks', (yes) => { if (yes) joinParty(invited); });
  }
  const p = read(KEY);
  if (p) {
    state = read(STATE_KEY, { go: null }) || { go: null };
    if (p.host) openHost(p.code); else openGuest(p.code);
  }
  paint();
}
export const inParty = () => !!read(KEY);

/** A party button for a game's top bar: it sits with the other buttons, so it never covers the game. */
export function partyChip({ always = false, className = 'back partychip' } = {}) {
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
  const p = read(KEY);
  const game = gameBySlug(slug);
  if (!p || !game || game.max < 2) return;
  const start = Date.now();
  while (Date.now() - start < 9000 && (status !== 'on' || (p.host && members.length < 2))) await sleep(400);
  if (status !== 'on' || read(KEY)?.code !== p.code) return;
  if (p.host) {
    if (members.length < 2) return;   // nobody else is here right now: just play
    confirmBox(`Play ${game.name} with your party (${members.length})?`, '👫 Yes, everyone', 'Just me', (yes) => { if (yes) pick(slug); });
  } else {
    confirmBox(`Suggest ${game.name} to the host?`, '👫 Suggest it', 'Play alone', (yes) => { if (yes) suggest(slug); });
  }
}
