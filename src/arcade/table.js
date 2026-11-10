/**
 * Playing a table game: this page runs any game in src/arcade/games, in the 3D room, on one phone
 * or several.
 *
 * Whoever opens the table is the host, and only the host's phone runs the rules. Every other phone
 * gets its own view of the state (with other players' secrets taken out), shows it, and sends back
 * the moves its player chooses; the host checks each one against the legal moves. Computer players
 * fill the empty seats, and take over a seat whose phone has gone or stopped answering.
 *
 * Modes: play (you and bots), online (strangers at a public table, bots fill up), nearby (friends
 * with a code or QR), pass (one phone handed round), watch (bots only).
 */
import { ALL_GAMES, gameBySlug } from './catalog.js?v=20261110-1548';
import { createBoard, STEP_SECONDS } from './boards.js?v=20261110-1548';
import { loadWorld } from '../world/world-loader.js?v=20261110-1548';
import { PRESETS, lookOf, portraitSvg, randomLook } from '../world/character-looks.js?v=20261110-1548';
import { asOneGame, COUNTRIES, detectCountryInfo, editionFor, EDITION_FOR } from '../world/countries.js?v=20261110-1548';
import { detectNameRegion, NAME_REGION_FOR, pickOpponents } from '../world/names.js?v=20261110-1548';
import { isLanguage, LANGUAGES } from '../i18n/index.js?v=20261110-1548';
import { profile } from '../persistence/profile-store.js?v=20261110-1548';
import { audioManager } from '../audio/audio-manager.js';
import { iconSvg } from '../ui/icons.js?v=20261110-1548';
import { faceHtml } from './photo.js?v=20261110-1548';
import { NearbyHost, NearbyGuest, nearbyError, isCode, newToken, PUBLIC_TABLES, tableCode, peekTables } from '../net/nearby.js?v=20261110-1548';

import { settingsStore } from '../persistence/settings-store.js?v=20261110-1548';

import { fill, shellText } from './shell-text.js?v=20261110-1548';
import { nextForRoom } from './decor.js?v=20261110-1548';
import { achievementList, bestOf, bump, gameFinished, holdPopups, onPopup, playStats, rankProgress } from './achievements.js?v=20261110-1548';
import { SPECIAL_EMOJIS } from '../world/table-talk.js?v=20261110-1548';
import { hotPrompt, resultImage, shareResult, suggestionRow } from './share.js?v=20261110-1548';
import { hideHint, hintsLeft, showHint } from './hint.js?v=20261110-1548';
import { clearSaved, isReload, loadSaved, saveGame } from './resume.js?v=20261110-1548';
import { ask } from './dialog.js?v=20261110-1548';
import { startReminder } from './reminder.js?v=20261110-1548';
import { lineCount, linesFor, MOMENT } from './talk.js?v=20261110-1548';
import { adBreak, gameplayStart, gameplayStop, loadingDone } from '../platform/portal.js?v=20261110-1548';

const V = '?v=20261110-1548';
const $ = (sel) => document.querySelector(sel);
const app = $('#party');
const params = new URLSearchParams(location.search);
const COLORS = ['#d4a017', '#e91e63', '#2196f3', '#43a047'];
const EMOJIS = ['😂', '🤡', '😜', '😈', '🤫', '🙄', '💀', '🐔', '🍌', '🔥', '🤣', '🤪', '👀', '🥶', '🧂'];
/** The trolling emojis, plus the special ones this player has earned. */
const myEmojis = () => [...SPECIAL_EMOJIS.filter(e => profile.owns(e.id)).map(e => e.symbol), ...EMOJIS];
const CHAT_EMOJIS = [...EMOJIS, ...SPECIAL_EMOJIS.map(e => e.symbol), '👍', '😮', '😎', '🙏', '😱', '🤔', '👏', '💪'];
const BOT_MS = [650, 1500];
const AWAY_MS = 8000;       // a phone that's gone: a bot steps in after this long
const IDLE_MS = 45000;      // on a public table, nobody waits longer than this for one player
const PUBLIC_WAIT_MS = 20000;

/* ─── small DOM helpers: everything from the game or the network goes in as text, never HTML ─── */
function h(tag, props = {}, kids = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;   // only our own icons and portraits, never anything a player typed
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(kids)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
const btn = (label, onclick, cls = '') => h('button', { type: 'button', class: `btn ${cls}`, onclick: (e) => { audioManager.unlock(); audioManager.play('button'); onclick(e); } }, [label]);
/** A name at this table: letters, marks and numbers ("Player 2"), short enough for a name tag. */
const cleanName = (s) => String(s || '').replace(/[^\p{L}\p{M}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
const homeCountry = () => detectCountryInfo().id;
const keepKey = (m) => JSON.stringify(m, Object.keys(m || {}).sort());
const myName = () => cleanName(profile.name) || 'Player';
const myLook = () => profile.look;
const rand = (a, b) => a + Math.random() * (b - a);
const SLIP = { easy: 0.45, normal: 0.12, hard: 0 };
const LEVEL = SLIP[params.get('level')] != null ? params.get('level') : 'normal';
/* the language you play in decides whose names and faces sit at your table; English follows your device */
const LANG = (() => { const q = new URLSearchParams(location.search).get('lang'); if (isLanguage(q)) { settingsStore.set('chatLang', q); return q; } const l = settingsStore.get('chatLang'); if (isLanguage(l)) return l; const B = { hi: 'hindi', ur: 'urdu', ne: 'nepali', bn: 'bangla', ja: 'romaji', ko: 'korean_roman', zh: 'pinyin', ru: 'russian_latin', de: 'german', fr: 'french', pt: 'portuguese', es: 'spanish', id: 'indonesian', ms: 'indonesian', tr: 'turkish', it: 'italian' }; return B[String(navigator.language || '').slice(0, 2).toLowerCase()] || 'en'; })();
const REGION = LANG === 'en' ? detectNameRegion() : (NAME_REGION_FOR[LANG] || EDITION_FOR[LANG]);
const EDITION = LANG === 'en' ? (COUNTRIES[detectCountryInfo().id] || editionFor('en')) : editionFor(LANG);
const say = shellText(LANG);
const localName = (taken) => pickOpponents(1, taken, REGION, profile.gender)[0];
const localLook = (gender) => {
  const skins = EDITION.theme?.skins || [];
  return randomLook(gender, skins.length ? skins[Math.floor(Math.random() * skins.length)] : undefined);
};

function show(...kids) {
  app.replaceChildren(...kids.filter(Boolean));
  fitBoard();
}
function panelOf() { return app.querySelector('.panel'); }
// while playing there is one button up here: it pauses the game and holds everything else (rules, profile, sound, quit)
const topBar = (game) => h('header', { class: 'bar' }, [
  h('button', { type: 'button', class: 'back pausebtn', 'aria-label': 'Pause and menu', title: 'Pause and menu (Esc)', onclick: () => openPauseMenu() }, [h('span', { class: 'pausebtn__ico', html: iconSvg('pause') }), h('span', { class: 'wideonly' }, [' Menu'])]),
  h('strong', { class: 'bartitle' }, [game ? `${game.icon} ${game.name}` : 'ChitPlay']),
  // what matters right now: the round, and everyone's points (filled in as the game goes)
  h('span', { class: 'barstatus', 'aria-live': 'polite' }, [statusNow]),
  h('button', { type: 'button', class: 'back langpick', 'aria-label': 'Language', title: 'Language', onclick: () => openLanguages() }, [`🌐 ${(LANGUAGES.find(l => l.id === LANG) || LANGUAGES[0]).short}`]),
]);
let statusNow = '';
/** Round 3/15 · You 120 · Riya 90: from the game's view and the players' strip. */
function setStatus(view, strip) {
  let round = '';
  if (view && Logic?.rounds && Number.isInteger(view.round) && (G.slug !== 'ludo' || view.style === 'score')) round = `Round ${Math.min(view.round, Logic.rounds)}/${Logic.rounds}`;
  else if (view && Number.isInteger(view.at) && Number.isInteger(view.total)) round = `Question ${Math.min(view.at + 1, view.total)}/${view.total}`;
  let scores = (strip || []).map(x => `${String(x.name).slice(0, 10)} ${x.text}`).join(' · ');
  // no strip of players: the points from the game itself (penalty points where lower is better)
  const pts = view && [view.scores, view.pts, view.points, view.pen].find(a => Array.isArray(a) && a.every(Number.isFinite));
  if (!scores && pts && shown?.ctx?.names) {
    const me = shown.ctx.me;
    scores = pts.map((v, i) => `${i === me ? 'You' : String(shown.ctx.names[i] || '').slice(0, 10)} ${Math.round(v * 10) / 10}`).join(' · ') + (view.pen === pts ? ' (penalty)' : '');
  }
  statusNow = [round, scores].filter(Boolean).join(' · ');
  document.querySelectorAll('.barstatus').forEach((el) => { el.textContent = statusNow; el.title = statusNow; });
}
/** Change the language in the middle of a game: the page reloads and the game carries on where it was. */
function openLanguages() {
  document.querySelector('.sheet')?.remove();
  const close = () => sheet.remove();
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Language', onclick: (e) => { if (e.target === sheet) close(); } }, [
    h('div', { class: 'sheet__box' }, [
      h('h1', {}, ['🌐 Language']),
      h('div', { class: 'langlist' }, LANGUAGES.map(l => h('button', { type: 'button', class: `btn${l.id === LANG ? ' primary' : ''}`, onclick: () => {
        if (l.id === LANG) { close(); return; }
        if ((room || guest) && !window.confirm('Changing the language reloads the page and leaves this room. Continue?')) return;
        settingsStore.set('chatLang', l.id);
        try { const u = new URL(location.href); u.searchParams.delete('lang'); history.replaceState(null, '', u); } catch {}
        location.reload();
      } }, [l.label]))),
      btn(say.close, close),
    ]),
  ]);
  document.body.append(sheet);
}

/* ─── the pause menu ─── */
// alone (with or without computer players) the game really stops; with people online or nearby it can't, and says so
const playingWithPeople = () => !!(room || guest || match?.opts?.public || window.__tvOnline);
let paused = false;
function setPaused(on) {
  if (paused === on) return;
  paused = on;
  if (on) gameplayStop(); else if (match && !Logic.result(match.s)) gameplayStart();
  if (match) {
    if (on) clearMatchTimers();
    else if (!Logic.result(match.s)) scheduleActive(Logic.active(match.s));
  }
  dispatchEvent(new CustomEvent('chitplay:pause', { detail: { on } }));
}
/**
 * The game menu, the same as in Raja Rani Chor Police: who you are, then Pause game, Restart match,
 * How to play, Quit game, Your profile and Sound, and Back to the game. Alone, opening it already
 * holds the game; Pause game shows the paused screen until Resume.
 */
function openPauseMenu() {
  if (document.querySelector('.pausemenu')) return;
  const solo = !playingWithPeople();
  if (solo) setPaused(true);
  const sheet = h('div', { class: 'sheet pausemenu', role: 'dialog', 'aria-modal': 'true' });
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  const close = () => { sheet.remove(); removeEventListener('keydown', onKey, true); if (solo) setPaused(false); };
  const leave = () => { sheet.remove(); removeEventListener('keydown', onKey, true); };
  const row = (label, onclick, icon, cls = '') => h('button', { type: 'button', class: `game__choice game__choice--row ${cls}`, onclick: () => { audioManager.unlock(); audioManager.play('button'); onclick(); } }, [
    icon ? h('span', { class: 'game__choice-ico', html: iconSvg(icon) }) : null,
    h('strong', {}, [label]),
  ]);
  const back = (label, onclick) => h('button', { type: 'button', class: 'game__back', onclick }, [h('span', { html: iconSvg('left') }), label]);
  const card = () => {
    const rp = rankProgress();
    return h('div', { class: 'game__card' }, [
      h('span', { class: 'game__avatar', html: faceHtml(portraitSvg(profile.look)) }),
      h('div', { class: 'game__card-text' }, [
        h('strong', {}, [myName()]),
        h('span', {}, [`${rp.icon} ${rp.title}`]),
        h('span', { class: 'game__card-points' }, [`${rp.points.toLocaleString('en')} points${rp.next ? ` · next ${rp.next.icon} ${rp.next.title}` : ''}`]),
      ]),
    ]);
  };
  const soundOn = () => audioManager.enabled !== false;
  const paint = (kids) => { sheet.replaceChildren(h('div', { class: 'game__panel' }, kids.filter(Boolean))); sheet.querySelector('.game__choice--primary')?.focus({ preventScroll: true }); };
  const menu = () => paint([
    h('h2', { class: 'game__title' }, ['Game menu']),
    card(),
    solo ? null : h('p', { class: 'game__sub' }, ['You are playing with other people: the game goes on for them while this menu is open.']),
    solo ? row('Pause game', showPaused, 'pause', 'game__choice--primary') : null,
    solo && match ? row('Restart match', () => { if (!window.confirm('Restart this match from the beginning?')) return; leaveAll(); clearSaved(G.slug); location.reload(); }, 'restart') : null,
    G ? row(say.howTo, async () => { leave(); await openRules(G); if (solo) setPaused(false); }, 'book') : null,
    row('Quit game', () => { leaveAll(); location.href = '../'; }, 'exit'),
    row('Your profile', () => { if (match && !Logic?.result?.(match.s) && !window.confirm('Open your profile? This game will end.')) return; leaveAll(); location.href = '../?profile=1'; }, 'user'),
    row(settingsStore.get('voiceEnabled') !== false ? 'Voices: on' : 'Voices: off', () => { settingsStore.set('voiceEnabled', settingsStore.get('voiceEnabled') === false); if (settingsStore.get('voiceEnabled') === false) window.speechSynthesis?.cancel(); menu(); }, settingsStore.get('voiceEnabled') !== false ? 'mic' : 'micOff'),
    row(soundOn() ? 'Sound: on' : 'Sound: off', () => { const next = !soundOn(); audioManager.setEnabled(next); settingsStore.set('soundEnabled', next); menu(); }, soundOn() ? 'sound' : 'soundOff'),
    back('Back to the game', close),
  ]);
  // the paused screen: nothing moves until Resume
  function showPaused() {
    paint([
      h('h2', { class: 'game__title' }, ['⏸ Paused']),
      h('p', { class: 'game__sub' }, ['The game is waiting for you. Nothing moves until you come back.']),
      row('Resume', close, 'play', 'game__choice--primary'),
      back('Game menu', menu),
    ]);
  }
  menu();
  addEventListener('keydown', onKey, true);
  document.body.append(sheet);
}
// Esc opens it on a computer
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.querySelector('.sheet')) { e.preventDefault(); openPauseMenu(); } });
function message(title, lead, ...buttons) {
  show(topBar(G), h('section', { class: 'panel' }, [h('h1', {}, [title]), lead ? h('p', { class: 'lead' }, [lead]) : null, ...buttons]));
}

/* ─── how to play, on a sheet over the game ─── */
async function openRules(game) {
  let r = null;
  try { r = (await import(`./rules.js${V}`)).RULES[game.slug]; } catch {}
  if (!r) return;
  document.querySelector('.sheet')?.remove();
  await new Promise((done) => {
    const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${game.name}: how to play` }, [
      h('div', { class: 'sheet__box' }, [
        h('h1', {}, [`${game.icon} ${say.howTo}: ${game.name}`]),
        h('ol', { class: 'steps' }, r.steps.map(s => h('li', {}, [s]))),
        h('h2', {}, ['Who wins']), h('p', {}, [r.win]),
        r.levels ? h('h2', {}, ['Levels']) : null,
        r.levels ? h('ol', {}, r.levels.map(([k, d]) => h('li', {}, [h('strong', {}, [`${k}:`]), ` ${d}`]))) : null,
        r.house ? h('h2', {}, ['House rules']) : null,
        r.house ? h('ul', {}, r.house.map(([k, d]) => h('li', {}, [h('strong', {}, [k]), ` ${d}`]))) : null,
        h('h2', {}, ['Scoring']), h('p', {}, [r.scoring]),
        h('a', { class: 'rules', href: `../games/${game.slug}/` }, ['Tips and the full guide →']),
        h('div', { class: 'sheet__go' }, [btn(say.gotIt, () => { sheet.remove(); done(); }, 'primary')]),
      ]),
    ]);
    document.body.append(sheet);
    sheet.querySelector('button').focus({ preventScroll: true });
  });
}
/** The first time you open a game, it tells you how to play before anything starts. */
function howToFirstTime(game) {
  const key = `chitplay.howto.${game.slug}`;
  try {
    if (localStorage.getItem(key)) return Promise.resolve();
    localStorage.setItem(key, '1');
  } catch { return Promise.resolve(); }
  return openRules(game);
}

/* ─── the room ─── */
let world = null;
let board = null;
let G = null;              // this game's catalog entry
let Logic = null;          // this game's rules
let seats4 = [];           // which player sits at each of the 4 places in the room
const seatOf = (i) => seats4.indexOf(i);

function fitBoard() {
  if (!world?.story || !board) return;
  world.story.boardMode(true, { span: board.span, panel: panelOf() });
}
function lookFor(name) {
  let n = 0;
  for (const ch of String(name).toLowerCase()) n = (n * 31 + ch.codePointAt(0)) >>> 0;
  const adults = PRESETS.filter(p => p.age !== 'child');
  return lookOf(adults[n % adults.length].id);
}
/** Sit the players down: all of them at four or fewer, otherwise the current player and the next three. */
function sitDown(players, current = 0) {
  const n = players.length;
  seats4 = Logic?.places?.(n) || (n <= 4 ? [0, 1, 2, 3].map(k => (k < n ? k : -1)) : [0, 1, 2, 3].map(k => (current + k) % n));
  if (!world?.story) return;
  world.story.begin(seats4.map((p, k) => (p < 0
    ? { name: '', look: lookOf(PRESETS[(k * 7) % PRESETS.length].id), color: COLORS[k], isHuman: false, label: '', hidden: true }
    : { name: players[p].name, look: players[p].look || lookFor(players[p].name), color: COLORS[k], isHuman: false, label: players[p].name })));
  fitBoard();
}
function startBoard(players) {
  board?.dispose();
  board = createBoard(G.slug, world, { seatOf });
  sitDown(players);
}
const act = (seat, pose, emoji) => {
  if (!world?.story) return;
  const k = seatOf(seat);
  if (k < 0) return;
  if (pose) world.story.pose(k, pose);
  if (emoji) world.story.emote(k, emoji, 2.2);
};
/** Is this seat the person holding this phone? */
const isMe = (seat) => (match ? match.players[seat]?.kind === 'me' : guest && shown?.ctx?.me === seat);
/** What the people in the room do when something happens in the game. */
function react(events, players) {
  if (!Array.isArray(events)) return;
  for (const ev of events) {
    const seat = Number.isInteger(ev?.seat) && players[ev.seat] ? ev.seat : -1;
    switch (ev?.k) {
      case 'roll':
        if (G.slug === 'ludo' && ev.n === 6) { if (isMe(seat)) bump('ludo', 'sixes'); if (match?.s?.sixes === 2 || (guest && 0)) world?.story?.emojiPop('🔥', `${players[seat]?.name || ''}: two sixes!`); }
        if (board?.throwDie) { if (ev.n === 6) setTimeout(() => act(seat, null, '🎉'), 1300); break; }
        // several dice at once (Yacht): the arm still throws them
        audioManager.play('paper-toss'); if (seatOf(seat) >= 0) world?.story?.rollGesture(seatOf(seat)); break;
      case 'block': if (seatOf(seat) >= 0) { act(seat, 'cheer', '🧱'); world?.story?.emojiPop('🧱', `${players[seat]?.name || ''}: blockade!`); } break;
      case 'capture': audioManager.play('reveal');
        if (G.slug === 'ludo') { world?.story?.emojiPop('⚔️', `${players[seat]?.name || ''} captured ${players[ev.victim]?.name || ''}!`); if (isMe(seat)) bump('ludo', 'caps'); } act(seat, 'cheer', '😎'); if (seatOf(seat) >= 0) world?.story?.effect('royal', seatOf(seat)); if (Number.isInteger(ev.victim)) act(ev.victim, 'facepalm', '😱'); break;
      case 'line': audioManager.play('confirm'); act(seat, 'cheer', '🔥'); break;
      case 'crown': audioManager.play('reveal'); act(seat, 'cheer', '👑'); break;
      case 'check': audioManager.play('wrong'); act(seat, 'point', '⚠️'); break;
      case 'home': if (G.slug === 'ludo') { world?.story?.emojiPop('🏠', `${players[seat]?.name || ''}: a token is home!`); if (isMe(seat)) bump('ludo', 'home'); }
        // falls through
      case 'ladder': case 'bank': audioManager.play('score'); act(seat, 'clap', '🎉'); break;
      case 'snake': case 'bust': case 'forfeit': case 'foul': case 'miss': audioManager.play('wrong'); act(seat, 'facepalm', '🙈'); break;
      case 'laugh': act(seat, 'laugh', '😂'); break;
      case 'prompt': act(seat, ev.kind === 'truth' ? 'think' : 'surprised', ev.kind === 'truth' ? '🤔' : '😬'); break;
      case 'say': if (seatOf(seat) >= 0 && typeof ev.text === 'string') world?.story?.say(seatOf(seat), ev.text.slice(0, 80)); break;
      case 'point': if (seatOf(seat) >= 0 && seatOf(ev.at) >= 0) world?.story?.point(seatOf(seat), seatOf(ev.at)); break;
      case 'bid': act(seat, 'think', '🤔'); break;
      case 'escape': act(seat, 'laugh', '😎'); break;
      case 'night': audioManager.play('select'); world?.story?.emojiPop('🌙', 'Night falls… eyes closed'); break;
      case 'day': world?.story?.emojiPop('☀️', 'Morning in the village'); break;
      case 'caught': audioManager.play('wrong'); act(seat, 'surprised', '😱'); break;
      case 'saved': audioManager.play('reveal'); act(seat, 'cheer', '🩺'); break;
      case 'move': case 'card': case 'place': case 'flip': case 'shot': case 'draw':
        audioManager.play('select');
        if (seatOf(seat) >= 0) world?.story?.reachOut(seatOf(seat));
        break;
      case 'trick': audioManager.play('select'); act(seat, 'clap', null); break;
      case 'pass': case 'stuck': act(seat, 'facepalm', null); break;
      case 'deal': case 'draw': audioManager.play('select'); break;
      default:
    }
  }
}

/* ─── the panel under the board ─── */
let shown = null;          // what's on this phone now: { view, ctx, players, result }
let selectedAim = null;
let autoTimer = 0;
let throwing = false, afterThrow = null;
/** A roll: the player's character picks up the die and throws it. Then, once it lands, the result. */
function landThenShow(events, players, me, then) {
  if (throwing) { afterThrow = then; return; }
  const r = Array.isArray(events) ? events.find(e => e?.k === 'roll') : null;
  const k = r ? seatOf(r.seat) : -1;
  if (!r || k < 0 || !board?.throwDie || !world?.story || !Number.isInteger(r.n)) { then(); return; }
  throwing = true;
  shown = null;
  clearTimeout(autoTimer);
  const who = r.seat === me ? 'You' : players[r.seat]?.name || '';
  show(topBar(G), h('section', { class: 'panel panel--tight' }, [
    stripOf(lastStrip),
    h('div', { class: 'head' }, [h('span', { class: 'dieface dieface--spin', 'aria-hidden': 'true' }, ['🎲']), h('h1', {}, [r.seat === me ? 'You are rolling…' : `${who} is rolling…`])]),
  ]));
  world.story.rollGesture(k);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    throwing = false;
    audioManager.play('select');
    const next = afterThrow || then;
    afterThrow = null;
    next();
  };
  board.throwDie(r.n, () => world.story.handOf(k), finish, () => audioManager.play('paper-toss'));
  setTimeout(finish, 2600);    // a hidden tab has no frames: never leave the game waiting
}
/* "Your turn!": hard to miss */
let wasMine = false;
function turnBanner(ctx) {
  const mine = ctx.mine;
  if (mine && !wasMine && !match?.opts?.silent) {
    const b = h('div', { class: 'turnbanner', role: 'status' }, [ctx.pass ? `${ctx.names[ctx.me]}: ${say.yourTurn}` : say.yourTurn]);
    document.body.append(b);
    setTimeout(() => b.remove(), 1500);
    audioManager.play('confirm');
    navigator.vibrate?.(60);
  }
  wasMine = mine && !ctx.pass;
}

/** One view on this phone. `send(move)` plays a move for this seat. */
function present(view, ctx, players, send, result) {
  shown = { view, ctx, players, send, result };
  clearTimeout(autoTimer);
  ctx.mine = ctx.active.includes(ctx.me);
  // whoever's working out a move looks like it, in games with something to work out
  if (world?.story && G.skill) {
    const thinker = ctx.active.length === 1 && !result ? seatOf(ctx.active[0]) : -1;
    if (thinking >= 0 && thinking !== thinker) world.story.pose(thinking, 'idle');
    if (thinker >= 0 && thinker !== thinking) world.story.pose(thinker, 'think');
    thinking = thinker;
  }
  // a player beyond the four seats comes to the table when it's their turn
  if (players.length > 4 && ctx.active.length === 1 && seatOf(ctx.active[0]) < 0) sitDown(players, ctx.active[0]);
  try {
    board?.draw(view, ctx, Logic);
  } catch (e) { console.error('[table] draw', e); }
  let panel;
  try {
    panel = Logic.ui(view, ctx);
  } catch (e) {
    console.error('[table] panel', e);
    panel = { title: 'One moment…' };
  }
  if (result) { wasMine = false; showResult(result, ctx, players); return; }
  paintPanel(panel, ctx, send);
  turnBanner(ctx);
  // the first few turns of a game: a hand shows where to tap
  hideHint();
  if (ctx.mine && hintsLeft(G.slug) && !Number.isInteger(panel.auto)) {
    setTimeout(() => {
      if (shown?.ctx !== ctx) return;
      const spot = board?.hintTarget?.();
      const at = spot && world?.story?.screenOf?.(spot);
      if (at) { const ask = /:\s*(tap .+)$/i.exec(panel.title || '')?.[1]; showHint(G.slug, at, ask ? ask[0].toUpperCase() + ask.slice(1) : 'Tap a glowing spot'); return; }
      const b = document.querySelector('#party .panel .hand button:not(:disabled), #party .panel .grid button.primary:not(:disabled), #party .panel .grid button:not(:disabled)');
      if (b) showHint(G.slug, b, panel.aim ? 'Aim, then shoot' : 'Tap to choose');
    }, 650);
  }
  // only one thing you could do: do it for you, once you've seen what you rolled
  if (ctx.mine && Number.isInteger(panel.auto) && ctx.legal[panel.auto]) {
    autoTimer = setTimeout(() => { if (shown?.ctx === ctx) send(ctx.legal[panel.auto]); }, 800);
  }
}
let lastStrip = null;
let thinking = -1;
const stripOf = (list) => (list ? h('ul', { class: 'strip' }, list.map(x => h('li', { class: x.on ? 'on' : '', style: `--who:${x.color}` }, [h('strong', {}, [x.name]), h('span', {}, [x.text])]))) : null);
function paintPanel(p, ctx, send) {
  lastStrip = p.players || null;
  setStatus(shown?.view, p.players);
  const play = (i) => () => send(ctx.legal[i]);
  const cards = (p.buttons || []).filter(b => b.card);
  const plain = (p.buttons || []).filter(b => !b.card);
  const inHand = new Set(cards.map(b => b.card));
  const rest = (p.hand || []).filter(c => !inHand.has(c));
  const kids = [
    stripOf(p.players),
    h('div', { class: 'head' }, [
      Number.isInteger(p.die) && p.die >= 1 && p.die <= 6 ? h('span', { class: 'dieface', 'aria-label': `Die shows ${p.die}` }, [String.fromCodePoint(0x2680 + p.die - 1)]) : null,
      h('h1', {}, [p.title || '']),
    ]),
    p.lead ? h('p', { class: 'lead' }, [p.lead]) : null,
    p.big ? h('div', { class: 'chit open' }, [h('span', { class: 'big' }, [p.big])]) : null,
    p.prompt ? h('div', { class: 'chit open unfold' }, [h('span', { class: 'prompt' }, [p.prompt])]) : null,
    p.hint ? h('p', { class: 'hint' }, [`Hint: ${p.hint}`]) : null,
    p.list?.length ? h('ul', { class: 'said' }, p.list.map(x => h('li', {}, [x]))) : null,
    p.bars ? h('ul', { class: 'bars' }, p.bars.map(b => h('li', { class: b.win ? 'win' : '' }, [h('span', {}, [b.label]), h('i', { style: `width:${Math.round((b.n / b.of) * 100)}%` }), h('strong', {}, [String(b.n)])]))) : null,
    p.input ? typedLine(p.input, send) : null,
    p.aim ? aimControls(ctx, send) : null,
    cards.length ? h('div', { class: 'hand' }, cards.map(b => cardButton(b.label, b.card, play(b.i), b.tint))) : null,
    p.tiles?.length ? h('div', { class: 'hand hand--idle', 'aria-label': 'Your other cards' }, p.tiles.map(t => h('span', { class: `card card--idle card--tint-${t.tint}` }, [t.label]))) : null,
    rest.length ? h('div', { class: 'hand hand--idle', 'aria-label': 'Your other cards' }, rest.map(c => cardChip(c))) : null,
    plain.length ? h('div', { class: plain.every(b => b.label.length <= 2) ? 'grid tiny' : p.compact ? 'grid compact' : 'grid' }, plain.map(b => btn(b.label, play(b.i), `${b.primary ? 'primary' : ''}${b.wide ? ' wide' : ''}`))) : null,
    trollBar(ctx),
  ];
  show(topBar(G), h('section', { class: `panel${p.compact ? ' panel--tight' : ''}` }, kids));
  board?.aimOff();
  if (p.aim && selectedAim) board?.aim(ctx.me, selectedAim.x, selectedAim.a, selectedAim.p);
}
const RED = /[♥♦]/;
const cardChip = (c) => {
  const text = `${c.slice(0, -1)}${{ S: '♠', H: '♥', D: '♦', C: '♣' }[c[c.length - 1]] || ''}`;
  return h('span', { class: `card card--idle${RED.test(text) ? ' card--red' : ''}` }, [text]);
};
function cardButton(label, code, onclick, tint) {
  return h('button', { type: 'button', class: `card${tint ? ` card--tint-${tint}` : RED.test(label) ? ' card--red' : ''}`, onclick: () => { audioManager.play('select'); onclick(); } }, [label]);
}
function typedLine(input, send) {
  const box = h('textarea', { maxlength: '90', rows: '2', placeholder: input.placeholder, 'aria-label': 'Your line' });
  return h('div', { class: 'typed' }, [box, btn(input.button, () => send({ line: box.value }), 'primary')]);
}
/** Carrom: where the striker sits, which way it goes, and how hard. */
function aimControls(ctx, send) {
  const forward = ctx.me === 0 ? -Math.PI / 2 : Math.PI / 2;
  selectedAim = selectedAim || { x: 0, a: forward, p: 0.65 };
  if (Math.abs(selectedAim.a - forward) > 1.5) selectedAim.a = forward;
  const update = () => board?.aim(ctx.me, selectedAim.x, selectedAim.a, selectedAim.p);
  const slider = (label, min, max, value, set) => h('label', { class: 'slider' }, [
    h('span', {}, [label]),
    h('input', { type: 'range', min, max, step: '0.01', value, oninput: (e) => { set(Number(e.target.value)); update(); } }),
  ]);
  // from the player's side of the board, "right" is always to their right
  const flip = ctx.me === 0 ? 1 : -1;
  return h('div', { class: 'aim' }, [
    slider('Striker', -0.62, 0.62, selectedAim.x * flip, (v) => { selectedAim.x = v * flip; }),
    slider('Aim', -1.25, 1.25, (selectedAim.a - forward) * flip, (v) => { selectedAim.a = forward + v * flip; }),
    slider('Power', 0.15, 1, selectedAim.p, (v) => { selectedAim.p = v; }),
    btn('Shoot!', () => { board?.aimOff(); send({ x: selectedAim.x, a: selectedAim.a, p: selectedAim.p }); }, 'primary'),
  ]);
}
/* ─── chat: emojis and fixed lines, shown over the sender's head in each reader's language ─── */
let lines = [];            // this game's lines, in this phone's language
let talkAt = 0;
function openChat() {
  document.querySelector('.sheet')?.remove();
  const close = () => sheet.remove();
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': say.chat, onclick: (e) => { if (e.target === sheet) close(); } }, [
    h('div', { class: 'sheet__box' }, [
      h('div', { class: 'emojis emojis--big' }, CHAT_EMOJIS.map(e => h('button', { type: 'button', 'aria-label': `Send ${e}`, onclick: () => { close(); sendEmoji(e); } }, [e]))),
      h('div', { class: 'talklines' }, lines.map((line, i) => h('button', { type: 'button', class: 'btn', onclick: () => { close(); sendTalk(i); } }, [line]))),
      btn(say.close, close),
    ]),
  ]);
  document.body.append(sheet);
}
function sayLine(seat, line) {
  const text = lines[line];
  const k = seatOf(seat);
  if (text && k >= 0) world?.story?.say(k, text);
}
/** Troll a computer player and it may well troll you back. */
function botEmoji(from, to = null) {
  const bots = botSeats().filter(s => s !== from);
  if (!bots.length || Math.random() > (to != null && match.players[to]?.kind === 'bot' ? 0.9 : 0.5)) return;
  // the one you trolled answers back, at you
  const who = to != null && bots.includes(to) ? to : bots[Math.floor(Math.random() * bots.length)];
  setTimeout(() => {
    if (!match) return;
    const e = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    showEmoji(who, e, from);
    room?.broadcast({ t: 'emoji', seat: who, e, to: from });
  }, rand(900, 1700));
}
function sendTalk(line) {
  if (guest) { guest.send({ t: 'talk', line }); return; }
  if (!match) return;
  const me = match.players.findIndex(p => p.kind === 'me');
  hostTalk(me, line);
  botReply(me);
}
function hostTalk(seat, line) {
  if (!Number.isInteger(line) || line < 0 || line >= lineCount(G.slug)) return;
  sayLine(seat, line);
  room?.broadcast({ t: 'talk', seat, line });
}
const botSeats = () => match.players.map((p, i) => (p.kind === 'bot' ? i : -1)).filter(i => i >= 0);
function botReply(to) {
  const bots = botSeats();
  if (!bots.length || Math.random() > 0.6) return;
  const who = bots[Math.floor(Math.random() * bots.length)];
  if (who === to) return;
  const list = MOMENT.reply;
  setTimeout(() => { if (match) hostTalk(who, list[Math.floor(Math.random() * list.length)]); }, rand(900, 1800));
}
/** Computer players talk now and then, about what just happened. */
function botChatter(events) {
  if (Date.now() - talkAt < 3500) return;
  const speak = (seat, when, chance) => {
    if (match.players[seat]?.kind !== 'bot' || Math.random() > chance) return false;
    const list = MOMENT[when];
    talkAt = Date.now();
    setTimeout(() => { if (match) hostTalk(seat, list[Math.floor(Math.random() * list.length)]); }, 1500);
    return true;
  };
  for (const ev of events) {
    if (ev.victim != null && speak(ev.victim, 'bad', 0.8)) return;
    if (['capture', 'line', 'home', 'ladder', 'crown', 'check', 'trick'].includes(ev.k) && speak(ev.seat, 'good', ev.k === 'trick' ? 0.12 : 0.6)) return;
    if (['snake', 'bust', 'foul', 'miss', 'stuck', 'forfeit'].includes(ev.k) && speak(ev.seat, 'bad', ev.k === 'miss' || ev.k === 'stuck' ? 0.14 : 0.6)) return;
    if (ev.k === 'say' || ev.k === 'bid') continue;
  }
  if (Math.random() < 0.035) { const bots = botSeats(); if (bots.length) speak(bots[Math.floor(Math.random() * bots.length)], 'chat', 1); }
}
function sendEmoji(e) {
  const to = emojiTo;
  if (guest) guest.send({ t: 'emoji', e, to });
  else if (match) {
    const me = match.players.findIndex(p => p.kind === 'me');
    showEmoji(me, e, to);
    room?.broadcast({ t: 'emoji', seat: me, e, to });
    botEmoji(me, to);
  }
}
function showEmoji(seat, e, to = null) {
  if (!CHAT_EMOJIS.includes(e)) return;
  const list = playersNow();
  const target = Number.isInteger(to) && list[to] && to !== seat ? to : null;
  const k = seatOf(seat), kt = target != null ? seatOf(target) : -1;
  if (k >= 0) world?.story?.throwEmoji(k, kt >= 0 ? kt : null, e);
  world?.story?.emojiPop(e, target != null ? `${list[seat]?.name || ''} → ${list[target].name}` : list[seat]?.name || '');
  audioManager.play('select');
}
const playersNow = () => match?.players || guestState.players;
let emojiAt = 0;
/** Always on screen in a game: one tap and everybody sees it, big, right in front of them. */
let emojiTo = null;          // null: everybody; otherwise one player's seat
/**
 * The chat row, always along the bottom of the panel in one line: who it goes to (tap to change),
 * the emojis, and the message button.
 */
function trollBar(ctx) {
  if (ctx.me < 0 || ctx.pass) return null;
  const others = ctx.names.map((n, i) => (i === ctx.me ? null : [i, n])).filter(Boolean);
  if (emojiTo != null && !others.some(([i]) => i === emojiTo)) emojiTo = null;
  const order = [null, ...others.map(([i]) => i)];
  const nameOf = (i) => (i == null ? '👥 All' : ctx.names[i]);
  const who = h('button', { type: 'button', class: 'chatrow__to', 'aria-label': `Send to: ${nameOf(emojiTo)}. Tap to change.`, onclick: (e) => {
    emojiTo = order[(order.indexOf(emojiTo) + 1) % order.length];
    e.currentTarget.firstChild.textContent = nameOf(emojiTo);
    e.currentTarget.setAttribute('aria-label', `Send to: ${nameOf(emojiTo)}. Tap to change.`);
    audioManager.play('select');
  } }, [h('span', {}, [nameOf(emojiTo)]), h('b', { 'aria-hidden': 'true' }, ['▾'])]);
  return h('div', { class: 'chatrow' }, [
    who,
    h('div', { class: 'troll', role: 'group', 'aria-label': say.chat }, myEmojis().map(e => h('button', { type: 'button', 'aria-label': e, onclick: () => { if (Date.now() - emojiAt < 500) return; emojiAt = Date.now(); sendEmoji(e); } }, [e]))),
    h('button', { type: 'button', class: 'chatbtn', 'aria-label': say.chat, title: say.chat, onclick: openChat }, ['💬']),
  ]);
}

/* a tap on the 3D board */
document.addEventListener('click', (e) => {
  if (!board || !shown || e.target.closest?.('.panel, .bar, .sheet, a, button, input, textarea, select')) return;
  const { ctx, send } = shown;
  const redraw = () => { try { board.draw(shown.view, ctx, Logic); } catch {} };
  const askPromotion = ({ f, t }) => {
    const names = { Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight' };
    const choices = ctx.legal.filter(m => m.f === f && m.t === t && m.q);
    const sheet = h('div', { class: 'sheet' }, [h('div', { class: 'sheet__box' }, [
      h('h1', {}, ['Promote your pawn to…']),
      h('div', { class: 'grid' }, choices.map(m => btn(names[m.q], () => { sheet.remove(); send(m); }, m.q === 'Q' ? 'primary' : ''))),
    ])]);
    document.body.append(sheet);
  };
  const i = board.pickAt(e.clientX, e.clientY, redraw, askPromotion);
  if (Number.isInteger(i) && ctx.legal[i]) { audioManager.unlock(); send(ctx.legal[i]); }
});

/* ─── the match, on the host's phone ─── */
let match = null;
let room = null;           // the host's room, when other phones can join
let guest = null;          // this phone's link to a host

function seededPlayers(humans, total) {
  const players = humans.slice();
  const taken = players.map(p => p.name);
  while (players.length < total) {
    const b = localName(taken);
    taken.push(b.name);
    players.push({ name: b.name, kind: 'bot', look: localLook(b.gender) });
  }
  return players;
}
function startMatch(players, opts = {}, resumeState = null) {
  gameplayStart();
  recorded = false;
  holdPopups(true);
  thinking = -1;
  wasMine = false;
  clearMatchTimers();
  const n = players.length;
  match = { players, opts, s: resumeState || Logic.init({ n, rng: Math.random, opts, names: players.map(p => p.name) }), timers: new Map(), events: [], lastShown: -1, busyUntil: 0, handoff: false };
  startBoard(players);
  if (!resumeState) { const bots = botSeats(); if (bots.length) setTimeout(() => { if (match) hostTalk(bots[0], MOMENT.start[0]); }, 900); }
  room?.broadcast({ t: 'sit', game: G.slug, players: players.map(({ name, look }) => ({ name, look })) });
  pump([]);
}
function clearMatchTimers() {
  match?.timers.forEach(t => clearTimeout(t));
  match?.timers.clear();
}
const isHere = (p) => p.kind === 'me' || p.kind === 'pass';
const guestLive = (p) => (room ? [...room.guests.values()].find(g => g.token === p.token) : null);
const namesOf = () => match.players.map(p => p.name);

/** The state changed: tell everyone, and get whoever has to move next going. */
function pump(events) {
  const { s, players } = match;
  const result = Logic.result(s);
  // a game on this phone only is kept after every move; finished, it's gone
  if (!room && !guest) {
    if (result) clearSaved(G.slug);
    else {
      const { frames, ids, ...light } = s;   // a carrom shot's replay isn't needed to carry on
      saveGame(G.slug, { players: players.map(({ name, kind, look }) => ({ name, kind, look })), opts: match.opts, s: light });
    }
  }
  const active = result ? [] : Logic.active(s);
  // how long the board needs to show this (a carrom shot rolls on for a while)
  const shot = events.find(e => e.k === 'shot');
  if (shot && s.frames) match.busyUntil = Date.now() + (s.frames.length / 20) * 1000 + 300;
  const thrown = events.some(e => e.k === 'roll') && board?.throwDie ? 1500 : 0;
  const walk = events.find(e => e.steps);
  if (thrown || walk) match.busyUntil = Date.now() + thrown + (walk ? walk.steps * STEP_SECONDS * 1000 + 200 : 0);
  const names = namesOf();
  players.forEach((p, seat) => {
    if (p.kind !== 'guest') return;
    const g = guestLive(p);
    if (g) sendView(g.id, seat, events, result);
  });
  showHere(events, active, result, names);
  botChatter(events);
  match.timers.forEach(t => clearTimeout(t));
  match.timers.clear();
  if (result) return;
  if (!paused) scheduleActive(active);
}
/** Whoever's turn it is and isn't a person here: a computer player, or someone who has gone. */
function scheduleActive(active) {
  const players = match.players;
  active.forEach((seat) => {
    const p = players[seat];
    if (p.kind === 'bot') schedule(seat, rand(...BOT_MS));
    else if (p.kind === 'guest' && !guestLive(p)) schedule(seat, AWAY_MS);
    else if (match.opts.public) schedule(seat, IDLE_MS);
  });
}
function schedule(seat, ms) {
  const wait = Math.max(ms, match.busyUntil - Date.now());
  match.timers.set(seat, setTimeout(() => autoMove(seat), wait));
}
function autoMove(seat) {
  if (!match || Logic.result(match.s) || !Logic.active(match.s).includes(seat)) return;
  const legal = Logic.moves(match.s, seat);
  // an easier bot sometimes just makes any legal move; only when the seat is a real bot
  const slip = match.players[seat].kind === 'bot' && !Logic.check && legal.length > 1 && G.skill && Math.random() < SLIP[LEVEL];
  const move = slip ? legal[Math.floor(Math.random() * legal.length)] : Logic.bot(match.s, seat, Math.random, legal);
  submit(seat, move);
}
function viewFor(seat) { return Logic.view ? Logic.view(match.s, seat) : match.s; }
function sendView(id, seat, events, result) {
  const active = result ? [] : Logic.active(match.s);
  room.send(id, { t: 'state', me: seat, view: viewFor(seat), legal: active.includes(seat) ? Logic.moves(match.s, seat) : [], active, events, result: result || null });
}
function showHere(events, active, result, names) {
  const { players } = match;
  const here = players.map((p, i) => (isHere(p) ? i : -1)).filter(i => i >= 0);
  // whose eyes are on this phone? With one phone handed round, whoever moves next.
  let me = here.length === 1 ? here[0] : -1;
  if (here.length > 1) {
    const next = active.find(i => here.includes(i));
    me = next ?? match.lastSeat ?? here[0];
  }
  const legal = me >= 0 && active.includes(me) ? Logic.moves(match.s, me) : [];
  const ctx = { me, legal, active, names, pass: here.length > 1 };
  react(events, players);
  if (result) celebrate(result);
  const send = (move) => submit(me, move);
  const needsHandoff = here.length > 1 && Logic.secret && !result && me >= 0 && active.includes(me) && match.lastSeat !== me;
  if (needsHandoff) {
    // the phone changes hands: a blank screen first, so the next player's secret stays theirs
    match.lastSeat = -1;
    board?.draw(viewFor(-1), { me: -1, legal: [], active, names, mine: false }, Logic);
    shown = null;
    show(topBar(G), h('section', { class: 'panel pass' }, [
      h('p', { class: 'lead' }, ['Pass the phone to']),
      h('h1', {}, [names[me]]),
      h('p', {}, ['Nobody else should look.']),
      btn(`I’m ${names[me]}: show me`, () => { match.lastSeat = me; present(viewFor(me), ctx, players, send, null); }, 'primary'),
    ]));
    return;
  }
  match.lastSeat = me;
  landThenShow(events, players, me, () => present(viewFor(me), ctx, players, send, result));
}
/** A move from someone at the table. Checked here, whoever it came from. */
function submit(seat, move) {
  if (!match || !move || typeof move !== 'object') return false;
  const { s } = match;
  if (Logic.result(s) || !Logic.active(s).includes(seat)) return false;
  const legal = Logic.moves(s, seat);
  const key = keepKey(move);
  let chosen = legal.find(m => keepKey(m) === key);
  if (!chosen && Logic.check) chosen = Logic.check(s, seat, move);
  if (!chosen) return false;
  const events = Logic.apply(s, seat, chosen, Math.random) || [];
  pump(events);
  return true;
}
function celebrate(result) {
  if (!result.winners?.length) return;
  audioManager.play('victory');
  result.winners.forEach((w) => { act(w, 'cheer', '👑'); });
  match?.players.forEach((_, i) => { if (!result.winners.includes(i)) act(i, 'clap', null); });
  world?.story?.effect('confetti');
}
/** Your record in each game, and your coins and rank: a finished game always counts for something. */
let recorded = false;
function recordResult(result, ctx) {
  gameplayStop();
  holdPopups(false);
  if (recorded || ctx.me < 0 || ctx.pass) return null;
  recorded = true;
  const won = (result.winners || []).includes(ctx.me);
  const key = `chitplay.record.${G.slug}`;
  let rec = { played: 0, won: 0, streak: 0 };
  try { rec = { ...rec, ...JSON.parse(localStorage.getItem(key)) }; } catch {}
  rec.played += 1;
  if (won) { rec.won += 1; rec.streak += 1; } else rec.streak = 0;
  try { localStorage.setItem(key, JSON.stringify(rec)); } catch {}
  const done = gameFinished({ slug: G.slug, won, mode: room || guest ? 'nearby' : 'local', online: !!match?.opts?.public });
  return { ...rec, coins: done.coins, gained: done.gained };
}
let lastRecord = null;
/** After a game: what your room gets next, as a link to My Room. */
function roomTeaser() {
  try {
    const st = playStats();
    const next = nextForRoom({ wins: Object.values(st.wins || {}).reduce((x, y) => x + y, 0), achievements: achievementList().filter(a => a.done).length, coins: profile.coins });
    if (!next) return null;
    return h('a', { class: `roomteaser${next.ready ? ' roomteaser--ready' : ''}`, href: '../', onclick: () => { try { sessionStorage.setItem('chitplay.openRoom', '1'); } catch {} leaveAll?.(); } }, [h('span', { class: 'roomteaser__icon' }, [next.icon]), h('span', {}, [next.text]), h('b', {}, ['🛋️ My Room →'])]);
  } catch { return null; }
}
/** The slate on the wall: this game, and how you have done at it. */
function chalkSlate() {
  if (!world?.story?.setSlate || !G) return;
  const st = playStats();
  const row = (k, v) => `${k}${' '.repeat(Math.max(1, 12 - k.length))}${v}`;
  world.story.setSlate(G.name, [row('Played', st.plays?.[G.slug] || 0), row('Won', st.wins?.[G.slug] || 0), G.video || G.medals ? row('Best', bestOf(G.slug)) : '', '']);
}
function showResult(result, ctx, players) {
  setTimeout(chalkSlate, 600);
  lastRecord = recordResult(result, ctx) || lastRecord;
  const names = players.map(p => p.name);
  const order = names.map((n, i) => [n, result.scores[i], i]).sort((a, b) => (result.lowWins ? a[1] - b[1] : b[1] - a[1]));
  const won = result.winners || [];
  const title = !won.length ? (result.story ? 'The story unfolds…' : say.draw)
    : won.length > 1 ? 'A tie at the top!' : won[0] === ctx.me ? `🏆 ${say.youWin}` : ctx.me >= 0 && !ctx.pass ? `😵 You lost! ${fill(say.wins, { name: names[won[0]] })}` : fill(say.wins, { name: names[won[0]] });
  const iAmHost = !guest;
  show(topBar(G), h('section', { class: 'panel' }, [
    h('h1', {}, [title]),
    result.note ? h('p', { class: 'lead' }, [result.note]) : null,
    result.story ? h('div', { class: 'chit open story' }, result.story.map(line => h('p', { class: 'line' }, [line]))) : h('ol', { class: 'board' }, order.map(([n, v, i], k) => h('li', { class: won.includes(i) ? 'first' : '' }, [h('span', {}, [`${['🥇', '🥈', '🥉'][k] || k + 1} ${n}`]), h('strong', {}, [String(v)])]))),
    lastRecord ? h('p', { class: 'record' }, [fill(say.record, lastRecord), lastRecord.streak > 1 ? ` · ${fill(say.streak, { n: lastRecord.streak })}` : '', lastRecord.coins ? ` · ${fill(say.coins, { n: lastRecord.coins })}` : '']) : null,
    (() => {
      const rp = rankProgress();
      return h('div', { class: 'rankline' }, [h('span', {}, [`${rp.icon} ${rp.title}`]), h('div', { class: 'rankbar' }, [h('i', { style: `width:${Math.round(rp.share * 100)}%` })]), lastRecord?.gained ? h('small', {}, [`+${lastRecord.gained} rank points`]) : null]);
    })(),
    roomTeaser(),
    iAmHost ? btn(say.playAgain, async () => { await adBreak(); startMatch(match.players.map(p => ((p.kind === 'guest' && !guestLive(p)) ? { ...p, kind: 'bot' } : p)), match.opts); }, 'primary') : h('p', { class: 'lead' }, ['Waiting for the host to play again…']),
    btn(won.includes(ctx.me) ? '📤 Share my win' : '📤 Share', async () => {
      let pic = null;
      try { const img = new Image(); img.src = world?.story?.snapshot?.() || ''; await img.decode(); pic = img; } catch {}
      const card = resultImage({ picture: pic, game: G, headline: won.includes(ctx.me) ? 'I won!' : title.replace(/^\S+ /, ''), sub: names.join(' · ') });
      await shareResult({ canvas: card, text: `${won.includes(ctx.me) ? 'I won' : 'I played'} ${G.name} on ChitPlay!`, slug: G.slug });
    }, 'sharebtn'),
    suggestionRow(G.slug, '../', won.includes(ctx.me) ? 'Try these next' : 'Or try another game'),
    h('a', { class: 'btn', href: '../', onclick: leaveAll }, [say.allGames]),
    h('a', { class: 'rules', href: `../games/${G.slug}/` }, ['Tips and the full guide →']),
    hotPrompt(G.slug, G.name),
  ]));
}

/* ─── the first screen of a game: pick how to play ─── */
function intro(game) {
  const sizes = [];
  for (let n = game.min; n <= Math.min(game.max, 6); n++) sizes.push(n);
  let size = game.seats;
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Players at the table' });
  const paintChips = () => chips.replaceChildren(...sizes.map(n => h('button', { type: 'button', class: `chip${n === size ? ' on' : ''}`, 'aria-pressed': String(n === size), onclick: () => { size = n; paintChips(); } }, [String(n)])));
  paintChips();
  chosenStyle = chosenStyle || game.modes?.[0]?.[0] || null;
  const modes = h('div', { class: 'chips' });
  const modeHelp = h('p', { class: 'lead' });
  const paintModes = () => {
    if (!game.modes) return;
    modes.replaceChildren(...game.modes.map(([id, label]) => h('button', { type: 'button', class: `chip wide${id === chosenStyle ? ' on' : ''}`, 'aria-pressed': String(id === chosenStyle), onclick: () => { chosenStyle = id; paintModes(); } }, [label])));
    modeHelp.textContent = game.modes.find(m => m[0] === chosenStyle)?.[2] || '';
  };
  paintModes();
  show(topBar(game), h('section', { class: 'panel' }, [
    h('h1', {}, [game.name]),
    h('p', { class: 'lead' }, [`${game.blurb} ${game.min === game.max ? game.min : `${game.min}–${game.max}`} players · about ${game.minutes} minutes.`]),
    sizes.length > 1 ? h('div', { class: 'opt' }, [h('span', {}, ['Players']), chips]) : null,
    game.modes ? h('div', { class: 'opt' }, [h('span', {}, ['Mode']), modes]) : null,
    game.modes ? modeHelp : null,
    btn('▶ Play with computer players', () => solo(size), 'primary'),
    btn('🌍 Play online', () => online(size)),
    h('div', { class: 'grid two' }, [btn('📶 Nearby', () => nearby(size)), btn('📱 Pass the phone', () => passSetup(size))]),
    btn('👀 Watch the computer play', () => watch(size)),
    btn('Join a friend’s code', () => joinForm()),
    btn(`📖 ${say.howTo}`, () => openRules(game)),
  ]));
}
function solo(size) {
  startMatch(seededPlayers([{ name: myName(), kind: 'me', look: myLook() }], size), styleOpts());
}
function watch(size) {
  startMatch(seededPlayers([], size), styleOpts());
}
/** One phone, several people. */
function passSetup(size) {
  const names = [myName()];
  while (names.length < Math.max(size, G.min)) names.push(localName(names).name);
  const list = h('ol', { class: 'names' });
  const err = h('p', { class: 'err', role: 'alert' });
  const paint = () => {
    list.replaceChildren(...names.map((n, i) => h('li', {}, [
      h('input', { value: n, maxlength: '14', 'aria-label': `Player ${i + 1} name`, oninput: (e) => { names[i] = e.target.value; } }),
      h('button', { type: 'button', class: 'x', 'aria-label': `Suggest another name for player ${i + 1}`, onclick: () => { names[i] = localName(names).name; paint(); } }, ['🎲']),
      names.length > G.min ? h('button', { type: 'button', class: 'x', 'aria-label': `Remove ${n}`, onclick: () => { names.splice(i, 1); paint(); } }, ['✕']) : null,
    ])));
    add.disabled = names.length >= G.max;
  };
  const add = btn('+ Add player', () => { names.push(localName(names).name); paint(); });
  paint();
  show(topBar(G), h('section', { class: 'panel' }, [
    h('h1', {}, ['Who’s playing?']),
    h('p', { class: 'lead' }, ['Hand the phone round: the game says whose turn it is.']),
    list, add, err,
    btn('Start', () => {
      const clean = names.map(cleanName).filter(Boolean);
      if (clean.length < G.min) { err.textContent = `This game needs at least ${G.min} players.`; return; }
      if (new Set(clean.map(n => n.toLowerCase())).size !== clean.length) { err.textContent = 'Two players have the same name: change one.'; return; }
      startMatch(clean.map(name => ({ name, kind: 'pass', look: lookFor(name) })), styleOpts());
    }, 'primary'),
    btn('Back', () => intro(G)),
  ]));
}

/* ─── friends nearby, and strangers online ─── */
const ERRORS = {
  errNoRoom: 'No game with that code. Check the number on the host’s phone.',
  errFull: 'That game is full.',
  errStarted: 'That game has already started. Ask them to tap Play again, then join.',
  errBrowser: 'This browser can’t connect to other phones. Try Chrome or Safari.',
  errTimeout: 'The host’s phone didn’t answer. Are you both online?',
  errNetwork: 'Couldn’t reach the internet. Check your connection and try again.',
  errOther: 'Something went wrong. Try again.',
};
const netError = (e) => ERRORS[nearbyError(e)];
function openRoom(code, handlers) {
  room = new NearbyHost({
    onChange: () => { welcome(); handlers.onChange?.(); },
    onMessage: (id, msg) => hostMessage(id, msg),
    onLeave: () => { if (match && !Logic.result(match.s)) pump([]); },
    onRejoin: (id, token) => {
      if (!match) return;
      const seat = match.players.findIndex(p => p.token === token);
      if (seat < 0) return;
      room.send(id, { t: 'sit', game: G.slug, players: match.players.map(({ name, look }) => ({ name, look })) });
      sendView(id, seat, [], Logic.result(match.s));
      pump([]);
    },
  }, { maxGuests: G.max - 1 });
  room.hostName = myName();
  room.country = homeCountry();
  return room.open(code);
}
const welcomed = new Set();
function welcome() {
  room.guests.forEach((g) => {
    if (welcomed.has(g.id)) return;
    welcomed.add(g.id);
    room.send(g.id, { t: 'lobby', arcade: true, game: G.slug });
  });
  [...welcomed].forEach((id) => { if (!room.guests.has(id)) welcomed.delete(id); });
}
function hostMessage(id, msg) {
  if (!match) return;
  const token = room.guests.get(id)?.token;
  const seat = match.players.findIndex(p => p.kind === 'guest' && p.token === token);
  if (seat < 0) return;
  if (msg.t === 'move') {
    if (!submit(seat, msg.move)) sendView(id, seat, [], Logic.result(match.s));
  } else if (msg.t === 'talk' && Date.now() - (match.players[seat].saidAt || 0) > 1500) {
    match.players[seat].saidAt = Date.now();
    hostTalk(seat, msg.line);
    botReply(seat);
  } else if (msg.t === 'emoji' && CHAT_EMOJIS.includes(msg.e)) {
    if (Date.now() - (match.players[seat].emojiAt || 0) < 400) return;
    match.players[seat].emojiAt = Date.now();
    const to = Number.isInteger(msg.to) && match.players[msg.to] ? msg.to : null;
    showEmoji(seat, msg.e, to);
    room.broadcast({ t: 'emoji', seat, e: msg.e, to });
    botEmoji(seat, to);
  }
}
function lobbyPlayers() {
  const guests = room.list.map(g => ({ name: g.name, kind: 'guest', token: g.token, look: g.look }));
  return [{ name: room.hostLabel, kind: 'me', look: myLook() }, ...guests];
}
function pushLobby(extra = {}) {
  const names = [room.hostLabel, ...room.list.map(g => g.name)];
  room.broadcast({ t: 'lobby', arcade: true, game: G.slug, players: names, ...extra });
  return names;
}

async function nearby(size) {
  show(topBar(G), h('section', { class: 'panel' }, [h('h1', {}, ['Opening a room…']), h('p', { class: 'lead' }, ['Getting a code for your friends.'])]));
  let wanted = size;
  const paint = () => {
    const names = pushLobby();
    const link = `${location.origin}${location.pathname}?join=${room.code}`;
    const err = h('p', { class: 'err', role: 'alert' });
    const qr = h('div', { class: 'qr' });
    import(`../net/qr.js${V}`).then(({ qrSvg }) => { const svg = qrSvg(link, 'Scan to join'); if (svg) qr.append(svg); }).catch(() => {});
    show(topBar(G), h('section', { class: 'panel' }, [
      h('h1', {}, ['Friends join with this code']),
      h('p', { class: 'code', 'aria-label': `Room code ${room.code}` }, [`${room.code.slice(0, 3)} ${room.code.slice(3)}`]),
      qr,
      h('button', { type: 'button', class: 'btn', onclick: async (e) => { const b = e.currentTarget; try { if (navigator.share) await navigator.share({ title: G.name, text: `Join my ${G.name} game on ChitPlay`, url: link }); else { await navigator.clipboard.writeText(link); b.textContent = 'Link copied!'; } } catch {} } }, ['Share the invite link']),
      h('h2', {}, [`Players (${names.length} of ${G.max === G.min ? G.max : `${G.min}–${G.max}`})`]),
      h('ol', { class: 'names joined' }, names.map((n, i) => h('li', {}, [i ? n : `${n} (host)`]))),
      h('p', { class: 'lead' }, [wanted > names.length ? `Computer players will take the other ${wanted - names.length} seat${wanted - names.length > 1 ? 's' : ''}.` : 'Everyone here plays.']),
      err,
      btn('Start', () => {
        const players = lobbyPlayers();
        room.lock();
        startMatch(seededPlayers(players, Math.max(wanted, players.length, G.min)), styleOpts());
      }, 'primary'),
      btn('Back', () => { room.close(); room = null; intro(G); }),
    ]));
  };
  try {
    await openRoom(null, { onChange: () => { if (!match) paint(); } });
    paint();
  } catch (e) {
    room?.close();
    room = null;
    message('Couldn’t open a room', netError(e), btn('Play with computer players instead', () => solo(size), 'primary'), btn('Back', () => intro(G)));
  }
}

/** Play online: a table with people already waiting (your own country first), or open one for the next player. */
async function online(size = G.seats) {
  let cancelled = false;
  show(topBar(G), h('section', { class: 'panel' }, [
    h('h1', {}, ['Finding a table…']),
    h('p', { class: 'lead' }, ['Looking for players. Computer players fill any empty seats.']),
    h('div', { class: 'spinner', 'aria-hidden': 'true' }),
    btn('Back', () => { cancelled = true; room?.close(); room = null; intro(G); }),
  ]));
  const codes = Array.from({ length: PUBLIC_TABLES }, (_, i) => tableCode(chosenStyle && chosenStyle !== G.modes?.[0]?.[0] ? `${G.slug}-${chosenStyle}` : G.slug, i + 1));
  let seen = [];
  let failed = false;
  try { seen = await peekTables(codes); } catch { failed = true; }
  if (cancelled) return;
  const home = homeCountry();
  const waiting = seen.filter(t => !t.locked && t.seats < G.max - 1).sort((a, b) => (b.country === home) - (a.country === home) || b.seats - a.seats);
  for (const t of waiting) {
    if (await joinGame(t.code, myName(), true) === 'joined' || cancelled) return;
  }
  if (!failed) {
    const busy = new Set(seen.map(t => t.code));
    for (const code of codes.filter(c => !busy.has(c))) {
      if (cancelled) return;
      try {
        await openRoom(code, { onChange: () => paintPublic?.() });
        if (cancelled) { room?.close(); room = null; return; }
        publicTable(size);
        return;
      } catch (e) {
        room?.close();
        room = null;
        if (e?.type !== 'unavailable-id') break;
        if (await joinGame(code, myName(), true) === 'joined' || cancelled) return;
      }
    }
  }
  if (cancelled) return;
  message('No connection right now', 'You can still play this game with computer players, and try online again later.', btn('Play with computer players', () => solo(size), 'primary'), btn('Try again', () => online(size)), btn('Back', () => intro(G)));
}
let paintPublic = null;
/** Which way of playing this game was chosen (Ludo: normal or score). */
let chosenStyle = null;
const houseRules = Object.fromEntries((params.get('rules') || '').split(',').filter(Boolean).map(k => [k, true]));
const styleOpts = () => ({ ...(chosenStyle ? { style: chosenStyle } : {}), ...(Object.keys(houseRules).length ? { rules: houseRules } : {}) });
/** Hosting a public table: it starts when it's full, or when the wait is over. Bots take the seats left. */
function publicTable(size) {
  const opened = Date.now();
  const total = Math.max(size, G.min);
  let bots = [];
  let timer = 0;
  const start = () => {
    clearInterval(timer);
    paintPublic = null;
    const humans = lobbyPlayers();
    room.lock();
    const players = [...humans];
    bots.forEach((b) => { if (players.length < total) players.push(b); });
    startMatch(seededPlayers(players, Math.max(total, players.length)), { public: true, ...styleOpts() });
  };
  const tick = () => {
    const left = Math.max(0, Math.ceil((opened + PUBLIC_WAIT_MS - Date.now()) / 1000));
    const humans = lobbyPlayers();
    // seats fill one by one, so the table is full by the time the wait is over; real players come first
    const due = Math.min(total - humans.length, Math.floor(((Date.now() - opened) / PUBLIC_WAIT_MS) * (total - 0.2)));
    while (bots.length > Math.max(0, total - humans.length)) bots.pop();
    while (bots.length < due) {
      const b = localName([...humans.map(p => p.name), ...bots.map(x => x.name)]);
      bots.push({ name: b.name, kind: 'bot', look: localLook(b.gender) });
    }
    if (humans.length >= total || left === 0) { start(); return; }
    const names = [...humans.map(p => p.name), ...bots.map(b => `🤖 ${b.name}`)];
    pushLobby({ players: names, startsIn: left });
    show(topBar(G), h('section', { class: 'panel' }, [
      h('h1', {}, ['At the table']),
      h('p', { class: 'lead' }, [`Starting in ${left} seconds…`]),
      h('ol', { class: 'names joined' }, names.map(n => h('li', {}, [n]))),
      btn('Start now', () => start(), 'primary'),
      btn('Back', () => { clearInterval(timer); paintPublic = null; room.close(); room = null; intro(G); }),
    ]));
  };
  paintPublic = tick;
  timer = setInterval(() => { if (room && !match) tick(); else clearInterval(timer); }, 1000);
  tick();
}

/* ─── a player's own phone, at somebody else's table ─── */
const guestState = { players: [], me: -1, code: '', name: '', started: false };
const TOKEN = 'chitplay.table.token';
async function joinGame(code, name, quiet = false) {
  let token = null;
  try { token = sessionStorage.getItem(TOKEN); } catch {}
  if (!token) { token = newToken(); try { sessionStorage.setItem(TOKEN, token); } catch {} }
  const link = new NearbyGuest({ onMessage: guestMessage, onClose: guestClosed });
  try {
    const hello = await link.join(code, name, token, { look: myLook() });
    if (!hello?.arcade) {
      // it's a room of the main game: that page knows how to join it
      link.close();
      location.href = `../?join=${code}`;
      return 'joined';
    }
    const known = gameBySlug(hello.game);
    if (!known) { link.close(); throw Object.assign(new Error('other'), { type: 'other' }); }
    if (known.video) {
      G = known;
      const handle = await startTv(known, { guest: link });
      link.h.onMessage = handle;
      guest = link;
      Object.assign(guestState, { code, name, started: true });
      return 'joined';
    }
    await loadGame(known);
    howToFirstTime(known);
    guest = link;
    Object.assign(guestState, { code, name, started: false });
    guestLobby(hello);
    return 'joined';
  } catch (e) {
    try { link.close(true); } catch {}
    if (quiet) return e?.type || 'failed';
    throw e;
  }
}
function guestLobby(m) {
  if (guestState.started) return;
  const names = Array.isArray(m.players) ? m.players.slice(0, 12).map(n => String(n).slice(0, 20)) : [];
  show(topBar(G), h('section', { class: 'panel' }, [
    h('h1', {}, ['You’re in!']),
    h('p', { class: 'lead' }, [Number.isFinite(m.startsIn) ? `Starting in ${Math.max(0, m.startsIn | 0)} seconds…` : 'Waiting for the host to start.']),
    names.length ? h('ol', { class: 'names joined' }, names.map(n => h('li', {}, [n]))) : null,
    h('a', { class: 'btn', href: '../', onclick: leaveAll }, ['Leave']),
  ]));
}
function guestMessage(m) {
  if (m.t === 'lobby') { guestLobby(m); return; }
  if (m.t === 'sit') {
    if (!Array.isArray(m.players)) return;
    guestState.players = m.players.slice(0, 12).map((p, i) => ({ name: String(p?.name || `Player ${i + 1}`).slice(0, 20), look: p?.look || null }));
    guestState.started = true;
    recorded = false;
    startBoard(guestState.players.map(p => ({ ...p, look: p.look || lookFor(p.name) })));
    return;
  }
  if (m.t === 'emoji') { if (Number.isInteger(m.seat)) showEmoji(m.seat, m.e, Number.isInteger(m.to) ? m.to : null); return; }
  if (m.t === 'talk') { if (Number.isInteger(m.seat) && Number.isInteger(m.line)) sayLine(m.seat, m.line); return; }
  if (m.t === 'state') {
    const players = guestState.players;
    if (!players.length) return;
    const me = Number.isInteger(m.me) ? m.me : -1;
    const legal = Array.isArray(m.legal) ? m.legal : [];
    const active = Array.isArray(m.active) ? m.active.filter(Number.isInteger) : [];
    const ctx = { me, legal, active, names: players.map(p => p.name) };
    react(m.events, players);
    if (m.result) celebrateGuest(m.result, players);
    landThenShow(m.events, players, me, () => present(m.view, ctx, players, (move) => { app.querySelectorAll('.panel button').forEach((b) => { b.disabled = true; }); guest?.send({ t: 'move', move }); }, m.result || null));
  }
}
function celebrateGuest(result, players) {
  if (!result.winners?.length) return;
  audioManager.play('victory');
  result.winners.forEach((w) => { if (players[w]) act(w, 'cheer', '👑'); });
  world?.story?.effect('confetti');
}
function guestClosed(reason) {
  const again = { code: guestState.code, name: guestState.name };
  const started = guestState.started;
  guest = null;
  if (reason === 'lost' && started) { reconnect(again, 6); return; }
  const why = { 'host-left': 'The host closed the game.', kicked: 'The host removed you from the game.', started: 'That game had already started.' }[reason] || 'Lost the connection to the host’s phone.';
  guestState.started = false;
  message('Game over here', why, reason === 'lost' ? btn('Join again', () => joinForm(again.code), 'primary') : null, h('a', { class: 'btn', href: '../', onclick: leaveAll }, ['All games']));
}
async function reconnect(again, tries) {
  message('Reconnecting…', 'Trying to get you back to your seat.');
  for (let i = 0; i < tries; i++) {
    await new Promise(r => setTimeout(r, 2500));
    if (await joinGame(again.code, again.name, true) === 'joined') { guestState.started = true; return; }
  }
  guestState.started = false;
  message('Game over here', 'Couldn’t get back to the host’s phone.', h('a', { class: 'btn', href: '../', onclick: leaveAll }, ['All games']));
}
function joinForm(code = '') {
  const codeIn = h('input', { value: code, inputmode: 'numeric', maxlength: '7', autocomplete: 'off', 'aria-label': 'Room code', placeholder: '6-digit code' });
  const nameIn = h('input', { value: myName(), maxlength: '14', 'aria-label': 'Your name', placeholder: 'Your name' });
  const err = h('p', { class: 'err', role: 'alert' });
  const go = btn('Join', async () => {
    const c = codeIn.value.replace(/\D/g, '');
    const n = cleanName(nameIn.value);
    if (!isCode(c)) { err.textContent = 'Type the 6-digit code from the host’s phone.'; return; }
    if (!n) { err.textContent = 'Type your name.'; return; }
    go.disabled = true; go.textContent = 'Joining…'; err.textContent = '';
    try { await joinGame(c, n); } catch (e) { err.textContent = netError(e); go.disabled = false; go.textContent = 'Join'; }
  }, 'primary');
  show(topBar(G), h('section', { class: 'panel' }, [
    h('h1', {}, ['Join a friend’s game']),
    h('p', { class: 'lead' }, ['The host taps Nearby and gets a code. Type it here.']),
    h('label', { class: 'opt' }, [h('span', {}, ['Code']), codeIn]),
    h('label', { class: 'opt' }, [h('span', {}, ['Your name']), nameIn]),
    err, go,
  ]));
}

function leaveAll() {
  paused = false;
  gameplayStop();
  holdPopups(false);
  clearMatchTimers();
  guest?.close();
  room?.close();
  guest = null;
  room = null;
}
addEventListener('pagehide', leaveAll);

/* ─── start ─── */
async function loadGame(game) {
  G = game;
  if (!ALL_GAMES.includes(game)) throw new Error('unknown game');
  Logic = (await import(`./games/${game.slug}.js${V}`)).default;
  document.title = `${game.name}: Play Free in 3D | ChitPlay`;
  lines = linesFor(game.slug, LANG);
}
const ROOM_GAMES_NEED_3D = new Set(ALL_GAMES.filter(g => g.kind !== 'Party' && !g.video).map(g => g.slug));
/** The TV games have their own screen and controls; the room and the words are shared. */
async function startTv(game, extra) {
  const { runTv } = await import(`./tv.js${V}`);
  return runTv({ game, world, h, btn, show, topBar, say, LANG, myName, myLook, localName, localLook, leaveAll, audio: n => audioManager.play(n), emojis: myEmojis, join: code => joinGame(code, myName(), true), ...extra });
}

async function main() {
  const slug = params.get('game');
  const join = (params.get('join') || '').replace(/\D/g, '');
  const game = gameBySlug(slug);
  if (!game && !isCode(join)) { location.replace('../'); return; }
  G = game;
  const w = await loadWorld();
  loadingDone();
  if (w?.story) {
    world = w;
    document.body.classList.add('room');
    world.story.setCountry(asOneGame(EDITION, LANG));
    world.story.setCalm?.(false);
    // only this game on the mat: never the Cops and Robbers chits
    world.story.clearMat?.();
    chalkSlate();
    addEventListener('resize', fitBoard);
  }
  if (isCode(join)) { joinForm(join); return; }
  onPopup((k) => audioManager.play(k || 'reveal'));
  startReminder(LANG);
  if (game.video) {
    G = game;
    document.title = `${game.name}: Play Free | ChitPlay`;
    const n = Math.min(game.max, Math.max(game.min, Number(params.get('n')) || game.seats));
    const tvMode = params.get('mode') || 'play';
    if (tvMode !== 'watch') await howToFirstTime(game);
    await startTv(game, { mode: tvMode, size: n });
    return;
  }
  await loadGame(game);
  // the game's own board is on the mat from the start, while players choose how to play
  if (world?.story && !board) { try { board = createBoard(G.slug, world, { seatOf }); fitBoard(); } catch (e) { console.warn('[table] board preview', e); } }
  if (!world && ROOM_GAMES_NEED_3D.has(game.slug)) {
    message('This game needs 3D', 'Your browser can’t show 3D graphics, which this board needs. The chit games work on any phone, and the rules are always readable.', h('a', { class: 'btn primary', href: `../games/${game.slug}/` }, ['Read the rules']), h('a', { class: 'btn', href: '../' }, ['All games']));
    return;
  }
  const size = Math.min(game.max, Math.max(game.min, Number(params.get('n')) || game.seats));
  if (game.modes) chosenStyle = game.modes.some(m => m[0] === params.get('style')) ? params.get('style') : game.modes[0][0];
  const mode = params.get('mode');
  // a game in progress on this phone: straight back to it after a refresh, or ask if you came another way
  const saved = !['online', 'nearby'].includes(mode) ? loadSaved(game.slug) : null;
  if (saved?.s && Array.isArray(saved.players) && saved.players.length) {
    const carryOn = isReload() || await ask({ icon: '⏯️', title: 'Carry on your game?', body: `You have a game of ${game.name} in progress.`, ok: 'Carry on', cancel: 'Start a new one' });
    if (carryOn) {
      if (saved.opts?.style) chosenStyle = saved.opts.style;
      startMatch(saved.players, saved.opts || {}, saved.s);
      world?.story?.emojiPop?.('⏯️', 'Welcome back: carrying on');
      return;
    }
    clearSaved(game.slug);
  }
  if (mode && mode !== 'watch') await howToFirstTime(game);
  if (mode === 'play') solo(size);
  else if (mode === 'online') online(size);
  else if (mode === 'nearby') nearby(size);
  else if (mode === 'pass') passSetup(size);
  else if (mode === 'watch') watch(size);
  else intro(game);
}
main().catch((e) => {
  console.error(e);
  app.replaceChildren(h('section', { class: 'panel' }, [h('h1', {}, ['Something went wrong']), h('p', { class: 'lead' }, ['Reload the page to try again.']), h('a', { class: 'btn', href: '../' }, ['All games'])]));
});
