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
import { ALL_GAMES, gameBySlug } from './catalog.js?v=20261114-1538';
import { createBoard, STEP_SECONDS } from './boards.js?v=20261114-1538';
import { loadWorld } from '../world/world-loader.js?v=20261114-1538';
import { PRESETS, lookOf, portraitSvg, randomLook } from '../world/character-looks.js?v=20261114-1538';
import { asOneGame, COUNTRIES, detectCountryInfo, editionFor, EDITION_FOR } from '../world/countries.js?v=20261114-1538';
import { detectNameRegion, NAME_REGION_FOR, pickOpponents } from '../world/names.js?v=20261114-1538';
import { isLanguage, LANGUAGES } from '../i18n/index.js?v=20261114-1538';
import { COINS, profile } from '../persistence/profile-store.js?v=20261114-1538';
import { audioManager } from '../audio/audio-manager.js';
/** Vibrate only for what happens to the person holding this phone. */
const buzz = (kind) => audioManager.haptic(kind);
import { iconSvg } from '../ui/icons.js?v=20261114-1538';
import { faceHtml } from './photo.js?v=20261114-1538';
import { NearbyHost, NearbyGuest, nearbyError, isCode, newToken, PUBLIC_TABLES, tableCode, peekTables } from '../net/nearby.js?v=20261114-1538';

import { settingsStore } from '../persistence/settings-store.js?v=20261114-1538';

import { fill, shellText } from './shell-text.js?v=20261114-1538';
import { MORE, RULE_WORDS, RULES_IN } from './shell-text-more.js?v=20261114-1538';
import { bestOf, bump, gameFinished, holdPopups, myLevel, onPopup, playStats, popup, rankProgress } from './achievements.js?v=20261114-1538';
import { SPECIAL_EMOJIS } from '../world/table-talk.js?v=20261114-1538';
import { hotPrompt, resultImage, shareResult, suggestionRow } from './share.js?v=20261114-1538';
import { hideHint, hintsLeft, showHint } from './hint.js?v=20261114-1538';
import { clearSaved, isReload, loadSaved, saveGame } from './resume.js?v=20261114-1538';
import { ask, confirmSpend, notice } from './dialog.js?v=20261114-1538';
import { buyGameCosmetic, equipGameCosmetic, gameCosmeticOwned, gameCosmeticsFor, gameStyleSlots, selectedGameCosmetic } from './game-cosmetics.js?v=20261114-1538';
import { startReminder } from './reminder.js?v=20261114-1538';
import { lineCount, linesFor, MOMENT } from './talk.js?v=20261114-1538';
import { applyOfferReply, normalizeOfferRequest } from './postgame-offers.js?v=20261114-1538';
import { roomLevel } from './decor.js?v=20261114-1538';

import { viewButton } from './view-mode.js?v=20261114-1538';
import { adBreak } from './ad-breaks.js?v=20261114-1538';
import { resultAd } from './ads.js?v=20261114-1538';
import { gameStrip } from './game-strip.js?v=20261114-1538';
import { mountParty, partyChip, offerParty, inParty, joinParty, myTableSize } from '../net/party.js?v=20261114-1538';
const V = '?v=20261114-1538';
const $ = (sel) => document.querySelector(sel);
const app = $('#party');
const params = new URLSearchParams(location.search);
const COLORS = ['#d4a017', '#e91e63', '#2196f3', '#43a047'];
const EMOJIS = ['😂', '🤡', '😜', '😈', '🤫', '🙄', '💀', '🐔', '🍌', '🔥', '🤣', '🤪', '👀', '🥶', '🧂'];
/** The trolling emojis, plus the special ones this player has earned. */
const myEmojis = () => [...SPECIAL_EMOJIS.filter(e => profile.owns(e.id)).map(e => e.symbol), ...EMOJIS];
const CHAT_EMOJIS = [...EMOJIS, ...SPECIAL_EMOJIS.map(e => e.symbol), '👍', '😮', '😎', '🙏', '😱', '🤔', '👏', '💪'];
const BOT_MS = [650, 1500];
const TURN_TIMEOUT_MS = 30000; // every game mode lets a bot make one move after 30 seconds of inactivity
const PUBLIC_WAIT_MS = 20000;
const TOUCH_INPUT = typeof navigator !== 'undefined' && ((navigator.maxTouchPoints || 0) > 0
  || (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches));

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
const say = { ...shellText(LANG), ...(MORE[LANG] || {}) };
const localName = (taken) => pickOpponents(1, taken, REGION, profile.gender)[0];
const localLook = (gender) => {
  const skins = EDITION.theme?.skins || [];
  return randomLook(gender, skins.length ? skins[Math.floor(Math.random() * skins.length)] : undefined);
};

function show(...kids) {
  // a new screen (not the next move of the same game) slides in; repainting the same screen never jumps
  const fresh = kids.find(k => k?.classList?.contains('panel'));
  const before = app.querySelector('.panel h1')?.textContent;
  if (fresh && !fresh.classList.contains('panel--play') && !fresh.classList.contains('panel--tight') && fresh.querySelector('h1')?.textContent !== before) fresh.classList.add('panel--enter');
  app.replaceChildren(...kids.filter(Boolean));
  // while a game is being played: one slim bar on top, a short tray at the bottom, the game in between
  document.body.classList.toggle('in-play', !!fresh && (fresh.classList.contains('panel--play') || fresh.classList.contains('tvpanel')));
  fitBoard();
}
// 2D ⇄ 3D: the board is drawn again (chess swaps its pieces for flat tokens) and the camera re-frames
addEventListener('chitplay:view', () => {
  if (board && shown) { try { board.draw(shown.view, shown.ctx, Logic); } catch { /* the next move redraws it */ } }
  fitBoard();
});
function panelOf() { return app.querySelector('.panel'); }
// while playing there is one button up here: it pauses the game and holds everything else (rules, profile, sound, quit)
const topBar = (game) => {
  const rp = rankProgress();
  return h('header', { class: 'bar' }, [
    h('button', { type: 'button', class: 'back pausebtn', 'aria-label': 'Pause and menu', title: 'Pause and menu (Esc)', onclick: () => openPauseMenu() }, [h('span', { class: 'pausebtn__ico', html: iconSvg('pause') }), h('span', { class: 'wideonly' }, [' Menu'])]),
    h('strong', { class: 'bartitle' }, [game ? `${game.icon} ${game.name}` : 'ChitPlay']),
    h('button', { type: 'button', class: 'back rank-chip', title: `Level ${myLevel()} · ${rp.title} · ${rp.points.toLocaleString('en')} points`, 'aria-label': `Level ${myLevel()}, ${rp.title}, ${rp.points.toLocaleString('en')} points`, onclick: openStatusDetails }, [`${rp.icon} Lv ${myLevel()}`]),
    // the compact record and score line opens a fuller room scoreboard
    h('span', { class: 'barstatus', 'aria-live': 'polite' }, statusKids()),
    // the party, if this phone is in one: in the bar with the other buttons, never over the game
    inParty() ? partyChip() : null,
    game ? viewButton('back viewbtn', () => audioManager.play('select')) : null,
    h('button', { type: 'button', class: 'back langpick', 'aria-label': 'Language', title: 'Language', onclick: () => openLanguages() }, [`🌐 ${(LANGUAGES.find(l => l.id === LANG) || LANGUAGES[0]).short}`]),
  ]);
};
let statusNow = '';
let bestNow = '';          // the record to beat, shown at the top of every game
let statusRound = '';
let statusRows = [];
/** The record to beat in this game, in a few words: a best score, a win streak, or a first-game nudge. */
function refreshBest() {
  if (!G) { bestNow = ''; return bestNow; }
  if (G.video) { const b = bestOf(G.slug); bestNow = b ? fill(say.best, { n: b }) : say.firstBest; return bestNow; }
  const rec = recordOf(G.slug);
  if (!rec.played) { bestNow = say.firstGame; return bestNow; }
  const parts = [];
  if (SCORED.has(G.slug) && rec.bestScore) parts.push(fill(say.best, { n: rec.bestScore }));
  else parts.push(fill(say.won, { n: rec.won }));
  if (rec.bestStreak > 1 || rec.streak > 0) parts.push(`${fill(say.inRow, { n: rec.streak })}${rec.bestStreak > rec.streak ? ` ${fill(say.bestOf, { n: rec.bestStreak })}` : ''}`);
  bestNow = parts.join(' ');
  return bestNow;
}
/**
 * Every game in its own colours: the panel, the buttons, the headings and the glow all take the
 * game's accent (Ludo red, Chess walnut, Tunnel Race violet…), worked out so text stays readable:
 * a light accent gets dark writing on its buttons, a dark one gets light.
 */
function applyTheme(game) {
  const hex = /^#?([0-9a-f]{6})$/i.exec(game?.accent || '')?.[1] || 'c94c14';
  const rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
  const css = (c) => `rgb(${c.join(', ')})`;
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ink = [18, 10, 6], white = [255, 250, 240];
  const hi = mix(rgb, white, 0.12), deep = mix(rgb, ink, 0.38);
  const v = {
    '--accent': css(rgb),
    '--accent-rgb': rgb.join(', '),
    '--acc-hi': css(hi),
    '--acc-deep': css(deep),
    '--acc-shadow': css(mix(rgb, ink, 0.62)),
    '--acc-light': css(mix(rgb, white, 0.55)),
    // whichever of light or dark writing stands out more on the button (WCAG contrast)
    '--on-accent': ((L) => (1.05 / (L + 0.05) >= (L + 0.05) / (lum([29, 18, 6]) + 0.05) ? '#fffaf0' : '#1d1206'))(lum(mix(hi, deep, 0.5))),
    '--panel-rgb': mix(rgb, [22, 12, 7], 0.86).join(', '),
    '--panel-rgb2': mix(rgb, [14, 8, 5], 0.92).join(', '),
    '--tile': css(mix(rgb, [42, 26, 16], 0.84)),
    '--line': `rgba(${mix(rgb, white, 0.5).join(', ')}, .2)`,
    '--hot': `linear-gradient(180deg, ${css(hi)}, ${css(deep)})`,
  };
  const root = document.documentElement.style;
  Object.entries(v).forEach(([k, val]) => root.setProperty(k, val));
  document.documentElement.dataset.kind = String(game?.kind || '').toLowerCase();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', css(mix(rgb, [14, 8, 5], 0.9)));
}
/** Games where your own points are the thing to beat (in the others, it's wins in a row). */
const SCORED = new Set(['yacht', 'color-clash', 'dots-and-boxes', 'memory-match', 'mancala', 'reversi']);
const recordOf = (slug) => { try { return { played: 0, won: 0, streak: 0, bestStreak: 0, bestScore: 0, ...JSON.parse(localStorage.getItem(`chitplay.record.${slug}`)) }; } catch { return { played: 0, won: 0, streak: 0, bestStreak: 0, bestScore: 0 }; } };
const watching = () => params.get('mode') === 'watch' || (!!match && !match.players.some(p => p.kind === 'me' || p.kind === 'pass'));
function compactBest() {
  if (!G || watching()) return '';
  if (G.video) return `🏆${bestOf(G.slug) || '—'}`;
  const rec = recordOf(G.slug);
  if (!rec.played) return '🏆—';
  return `🏆${SCORED.has(G.slug) ? rec.bestScore : `${rec.bestStreak || rec.won}W`}`;
}
function compactStatus() {
  const scores = statusRows.map(row => `${row.mine ? say.you : row.name.slice(0, 5)} ${row.score}`).join(' · ');
  return scores || statusRound.replace(/^Round /, 'R').replace(/^Question /, 'Q');
}
const statusKids = () => {
  const best = compactBest();
  const scores = compactStatus();
  const bestEl = best ? h('b', { class: 'barbest', title: bestNow }, [best]) : null;
  const scoreEl = scores ? h('span', { class: 'barstatus__summary' }, [scores]) : null;
  return [
    // a TV game: your score now, then your best beside it
    ...(G?.video ? [scoreEl, bestEl] : [bestEl, scoreEl]),
    h('button', { type: 'button', class: 'barstatus__more', title: say.more, 'aria-label': say.more, onclick: openStatusDetails }, [say.more]),
  ];
};
function paintStatus() {
  document.querySelectorAll('.barstatus').forEach((el) => {
    el.replaceChildren(...statusKids().filter(Boolean));
    el.title = [bestNow, statusNow].filter(Boolean).join(' · ');
  });
}
/** A TV game's score, live: the chip at the top shows it beside your best (racing, flying, every scored run). */
let liveScoreNow = null;
function liveScore(score) {
  if (!Number.isFinite(score) || score === liveScoreNow) return;
  liveScoreNow = score;
  statusRows = [{ name: say.you, score: String(score), active: true, mine: true }];
  paintStatus();
}
/** A TV game's score going past your best, live: the chip at the top says so. */
function liveBest(score) {
  const was = bestOf(G?.slug);
  if (score > was && was > 0) { bestNow = fill(say.newBest, { n: score }); paintStatus(); }
}
/** Round 3/15 · You 120 · Riya 90: from the game's view and the players' strip. */
function setStatus(view, strip) {
  statusRound = '';
  if (view && Logic?.rounds && Number.isInteger(view.round) && (G.slug !== 'ludo' || view.style === 'score')) statusRound = `Round ${Math.min(view.round, Logic.rounds)}/${Logic.rounds}`;
  else if (view && Number.isInteger(view.at) && Number.isInteger(view.total)) statusRound = `Question ${Math.min(view.at + 1, view.total)}/${view.total}`;
  statusRows = (strip || []).map((x, i) => ({
    name: String(x.name || '').trim(),
    score: String(x.text ?? ''),
    active: !!x.on,
    mine: i === shown?.ctx?.me && !shown?.ctx?.pass,
  }));
  // no strip of players: the points from the game itself (penalty points where lower is better)
  const pts = view && [view.scores, view.pts, view.points, view.pen].find(a => Array.isArray(a) && a.every(Number.isFinite));
  if (!statusRows.length && pts && shown?.ctx?.names) {
    const me = shown.ctx.me;
    statusRows = pts.map((v, i) => ({
      name: i === me ? say.you : String(shown.ctx.names[i] || '').trim(),
      score: `${Math.round(v * 10) / 10}${view.pen === pts ? ' (penalty)' : ''}`,
      active: false,
      mine: i === me && !shown.ctx.pass,
    }));
  }
  const scores = statusRows.map(row => `${row.name.slice(0, 10)} ${row.score}`).join(' · ');
  statusNow = [statusRound, scores].filter(Boolean).join(' · ');
  paintStatus();
}
function openStatusDetails() {
  if (!G || document.querySelector('.score-sheet')) return;
  const rp = rankProgress();
  const room = roomLevel();
  let sheet;
  const close = () => {
    sheet.remove();
    removeEventListener('keydown', onKey, true);
  };
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  const rows = statusRows.map(row => h('li', { class: row.active ? 'score-sheet__active' : '' }, [
    h('span', {}, [row.name]),
    h('strong', {}, [row.score]),
  ]));
  sheet = h('div', { class: 'sheet score-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${G.name} scores`, onclick: e => { if (e.target === sheet) close(); } }, [
    h('div', { class: 'sheet__box' }, [
      h('div', { class: 'score-sheet__head' }, [
        h('h1', {}, [`${G.icon} ${G.name}`]),
        h('button', { type: 'button', class: 'score-sheet__close', 'aria-label': say.close, onclick: close }, ['×']),
      ]),
      statusRound ? h('p', { class: 'lead' }, [statusRound]) : null,
      rows.length ? h('ol', { class: 'score-sheet__rows' }, rows) : null,
      !watching() ? h('section', { class: 'score-sheet__rank' }, [
        h('strong', {}, [`${rp.icon} Lv ${rp.index + 1} · ${rp.title}`]),
        h('div', { class: 'rankbar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(rp.share * 100)) }, [h('i', { style: `width:${Math.round(rp.share * 100)}%` })]),
        h('p', {}, [rp.next ? `${rp.next.at - rp.points} points to ${rp.next.title}` : 'Top rank']),
        h('small', {}, [`Rank-up: +${COINS.rankUp} coins; some ranks unlock hats.`]),
        h('strong', { class: 'score-sheet__room' }, [`🏠 Room Lv ${room.level} · ${room.title}`]),
        h('div', { class: 'rankbar', role: 'progressbar', 'aria-label': 'Room level progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(room.share * 100)) }, [h('i', { style: `width:${Math.round(room.share * 100)}%` })]),
        h('p', {}, [room.next ? `${room.next.at - room.points} room points to ${room.next.title}` : 'All room levels reached.']),
        h('small', { class: 'score-sheet__room' }, ['Bigger room at Lv 3 + 800 coins · Gaming hall at Lv 5 + 10 wins + 2500 coins.']),
      ]) : null,
      bestNow ? h('p', { class: 'score-sheet__best' }, [bestNow]) : null,
    ]),
  ]);
  document.body.append(sheet);
  addEventListener('keydown', onKey, true);
  sheet.querySelector('.score-sheet__close').focus({ preventScroll: true });
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
let partyAutoStart = 0;   // a party table starts by itself once everyone is in
let paused = false;
function setPaused(on) {
  if (paused === on) return;
  if (on && match) Logic.active(match.s).forEach(chargeClock);
  paused = on;
  audioManager.musicPause(on);
  if (match) {
    if (on) clearMatchTimers();
    else if (!Logic.result(match.s)) scheduleActive(Logic.active(match.s));
  }
  dispatchEvent(new CustomEvent('chitplay:pause', { detail: { on } }));
}
/**
 * The game menu, in the order people reach for things: who you are, Resume (alone, opening the menu
 * already holds the game), Restart, How to play, Sound and Voices, Your profile, and Quit last.
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
  const paint = (kids) => { sheet.replaceChildren(h('div', { class: 'game__panel' }, kids.filter(Boolean))); sheet.querySelector('.game__choice--primary, .game__choice--row')?.focus({ preventScroll: true }); };
  const styleSlots = gameStyleSlots(G?.slug);
  const renderStyles = () => {
    const kids = [
      h('h2', { class: 'game__title' }, [say.styles]),
      h('p', { class: 'game__sub' }, [`🪙 ${profile.coins} coins · Saved on this device; starts next game.`]),
    ];
    styleSlots.forEach((slot) => {
      const selected = selectedGameCosmetic(G.slug, slot.id);
      kids.push(h('p', { class: 'game__sub' }, [slot.label]));
      kids.push(row(`${slot.defaultName}${selected ? ' · Use' : ' · Using'}`, () => chooseStyle(slot, null), null));
      gameCosmeticsFor(G.slug, slot.id).forEach((item) => {
        const owned = gameCosmeticOwned(item.id);
        const active = selected?.id === item.id;
        const action = active ? ' · Using' : owned ? ' · Use' : ` · ${item.price} coins`;
        kids.push(row(`${item.icon} ${item.name}${action}`, () => chooseStyle(slot, item), null));
      });
    });
    kids.push(row('Back to menu', menu, 'back'));
    paint(kids);
  };
  const chooseStyle = async (slot, item) => {
    try {
      if (item && !gameCosmeticOwned(item.id)) {
        const yes = await confirmSpend({ what: item.name, price: item.price, coins: profile.coins, icon: item.icon });
        if (!yes) return;
        if (!buyGameCosmetic(item.id)) {
          await notice({ icon: '⚠️', tone: 'warn', title: 'Could not unlock style', body: 'Coins were not spent. Please try again.' });
          return;
        }
      } else if (!equipGameCosmetic(G.slug, slot.id, item?.id ?? null)) {
        await notice({ icon: '⚠️', tone: 'warn', title: 'Could not equip style', body: 'This style is not available for this game.' });
        return;
      }
      if (!match && !G?.video) previewBoard();
      renderStyles();
    } catch (error) {
      console.error('[game cosmetics] purchase or equip failed', error);
      await notice({ icon: '⚠️', tone: 'warn', title: 'Style could not be saved', body: 'Check your device storage and try again.' });
    }
  };
  const menu = () => paint([
    h('h2', { class: 'game__title' }, [say.menu]),
    card(),
    h('p', { class: 'game__sub' }, [solo ? say.pausedNote : say.withPeople]),
    // first what most people want (back to the game), then the game, then settings, then you; leaving is last
    row(solo ? say.resume : say.backToGame, close, 'play', 'game__choice--primary'),
    // every game, one tap away: bored of this one, open another without going home
    gameStrip({ current: G?.slug || null, root: '../', title: say.moreGames || 'More games', leave: () => {
      if (match && !Logic?.result?.(match.s) && !window.confirm('Leave this game and open the other one?')) return false;
      leaveAll(); return true;
    } }),
    solo && match ? row(say.restart, () => { if (!window.confirm('Restart this match from the beginning?')) return; leaveAll(); clearSaved(G.slug); location.reload(); }, 'restart') : null,
    G ? row(say.howTo, async () => { leave(); await openRules(G); if (solo) setPaused(false); }, 'book') : null,
    styleSlots.length ? row(`🎨 ${say.styles}`, renderStyles, null) : null,
    h('div', { class: 'game__menu-pair' }, [
      row(soundOn() ? say.soundOn : say.soundOff, () => { const next = !soundOn(); audioManager.setEnabled(next); settingsStore.set('soundEnabled', next); menu(); }, soundOn() ? 'sound' : 'soundOff'),
      row(settingsStore.get('voiceEnabled') !== false ? say.voicesOn : say.voicesOff, () => { settingsStore.set('voiceEnabled', settingsStore.get('voiceEnabled') === false); if (settingsStore.get('voiceEnabled') === false) window.speechSynthesis?.cancel(); menu(); }, settingsStore.get('voiceEnabled') !== false ? 'mic' : 'micOff'),
    ]),
    // background music: off until the player wants it; the game's sounds work either way
    soundOn() ? row(audioManager.musicOn ? '🎵 Music: on' : '🎵 Music: off', () => { audioManager.unlock(); audioManager.setMusic(!audioManager.musicOn); if (solo && paused) audioManager.musicPause(true); menu(); }, null) : null,
    row(say.profile, () => { if (match && !Logic?.result?.(match.s) && !window.confirm('Open your profile? This game will end.')) return; leaveAll(); location.href = '../?profile=1'; }, 'user'),
    // quitting goes back to this game's own page on the home screen (Guest Play, Online, Play with Friends…)
    row(say.quit, () => { if (match && !Logic?.result?.(match.s) && !window.confirm('Quit this game?')) return; leaveAll(); location.href = G ? `../?pick=${G.slug}` : '../'; }, 'exit', 'game__choice--danger'),
  ]);
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
  // in the player's language where it has been written; the same steps, so anything missing stays English
  if (RULES_IN.includes(LANG)) {
    try {
      const own = (await import(`./rules-i18n/${LANG}.js${V}`)).default[game.slug];
      if (own?.steps?.length === r.steps.length) r = { ...r, ...own, house: own.house?.length === r.house?.length ? own.house : r.house };
    } catch { /* the English stays */ }
  }
  const words = { ...RULE_WORDS.en, ...(RULE_WORDS[LANG] || {}) };
  document.querySelector('.sheet')?.remove();
  await new Promise((done) => {
    const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${game.name}: how to play` }, [
      h('div', { class: 'sheet__box' }, [
        h('h1', {}, [`${game.icon} ${say.howTo}: ${game.name}`]),
        h('ol', { class: 'steps' }, r.steps.map(s => h('li', {}, [s]))),
        h('h2', {}, [words.whoWins]), h('p', {}, [r.win]),
        r.levels ? h('h2', {}, [words.levels]) : null,
        r.levels ? h('ol', {}, r.levels.map(([k, d]) => h('li', {}, [h('strong', {}, [`${k}:`]), ` ${d}`]))) : null,
        r.house ? h('h2', {}, [words.house]) : null,
        r.house ? h('ul', {}, r.house.map(([k, d]) => h('li', {}, [h('strong', {}, [k]), ` ${d}`]))) : null,
        h('h2', {}, [words.scoring]), h('p', {}, [r.scoring]),
        h('a', { class: 'rules', href: `../games/${game.slug}/` }, [words.guide]),
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
  world.story.boardMode(true, { span: board.span, panel: panelOf(), half: board.half });
}
function lookFor(name) {
  let n = 0;
  for (const ch of String(name).toLowerCase()) n = (n * 31 + ch.codePointAt(0)) >>> 0;
  const adults = PRESETS.filter(p => p.age !== 'child');
  return lookOf(adults[n % adults.length].id);
}
/**
 * Where everyone sits round the table. The room has four places: 0 back-left, 1 back-right, 2 front-right,
 * 3 front-left (the camera looks in from the front). The first player (you, usually) sits at the front,
 * and the others face you across the table, the way people really sit for a game:
 *  - two players sit opposite each other, corner to corner, so in Chess, Checkers, Carrom and Mancala
 *    each sits on the side of their own pieces (the first player's side of every board is the front);
 *  - three: you at the front, the other two across from you;
 *  - four: round the table in turn order.
 * A game can ask for something else (Ludo puts each player by their own coloured corner).
 */
let seatsFlipped = false;
const PLACES = { 1: [-1, -1, 0, -1], 2: [1, -1, 0, -1], 3: [1, 2, 0, -1], 4: [2, 3, 0, 1] };
/** Sit the players down: all of them at four or fewer, otherwise the current player and the next three. */
function sitDown(players, current = 0) {
  const n = players.length;
  seats4 = Logic?.places?.(n) || (n <= 4 ? PLACES[n].slice() : [0, 1, 2, 3].map(k => (current + k) % n));
  // a board that turns round for the second player (Chess): on their phone they sit at the front too
  seatsFlipped = !!(board?.def?.faces && n === 2 && shown?.ctx?.me === 1);
  if (seatsFlipped) seats4 = [0, -1, 1, -1];
  if (!world?.story) return;
  world.story.begin(seats4.map((p, k) => (p < 0
    ? { name: '', look: lookOf(PRESETS[(k * 7) % PRESETS.length].id), color: COLORS[k], isHuman: false, label: '', hidden: true }
    : { name: players[p].name, look: players[p].look || lookFor(players[p].name), color: COLORS[k], isHuman: false, label: players[p].name })));
  fitBoard();
}
function startBoard(players) {
  calmTable();
  board?.dispose();
  board = createBoard(G.slug, world, { seatOf });
  sitDown(players);
}
const poseTimers = new Map();
/**
 * Somebody at the table reacts: a pose, maybe an emoji over their head. A reaction lasts a moment and
 * then they settle back (into thinking, if it is still their move). `hold` 0 keeps the pose.
 */
const act = (seat, pose, emoji, hold = 1900) => {
  if (!world?.story) return;
  const k = seatOf(seat);
  if (k < 0) return;
  if (pose) {
    world.story.pose(k, pose);
    clearTimeout(poseTimers.get(k));
    poseTimers.delete(k);
    if (hold) poseTimers.set(k, setTimeout(() => { poseTimers.delete(k); world?.story?.pose(k, k === thinking ? 'think' : 'idle'); }, hold));
  }
  if (emoji) world.story.emote(k, emoji, 2.2);
};
const calmTable = () => { poseTimers.forEach(t => clearTimeout(t)); poseTimers.clear(); clearInterval(fidgetTimer); fidgetTimer = 0; lookTurn = -2; };

/* the table's director: who looks where, who's nervous, who's restless, as the game goes */
let lookTurn = -2, fidgetTimer = 0, lookBack = 0;
/** Seats one good move from winning: the last card, the last token, the last few squares. */
function nearWin(view) {
  if (!view || typeof view !== 'object') return [];
  const out = [];
  // the last card only matters where emptying your hand wins (not in Call Break, where hands run down together)
  if (Array.isArray(view.counts) && ['color-clash', 'crazy-eights'].includes(G?.slug)) view.counts.forEach((c, p) => { if (c === 1) out.push(p); });
  if (Array.isArray(view.t) && Array.isArray(view.t[0])) view.t.forEach((tok, p) => { if (tok.filter(x => x === 56).length === 3) out.push(p); });
  if (Array.isArray(view.at)) view.at.forEach((sq, p) => { if (sq >= 90) out.push(p); });
  return out;
}
function direct(ctx, view, players, result) {
  const st = world?.story;
  if (!st) return;
  clearInterval(fidgetTimer);
  fidgetTimer = 0;
  if (result) { lookTurn = -2; return; }
  const seated = players.map((_, i) => seatOf(i)).filter(k => k >= 0);
  const turn = ctx.active.length === 1 ? seatOf(ctx.active[0]) : -1;
  if (turn !== lookTurn) {
    lookTurn = turn;
    clearTimeout(lookBack);
    if (turn >= 0) {
      // the player whose move it is looks at the board; the others glance at them, then back at the board
      st.look(turn, 'center');
      seated.forEach((k) => { if (k !== turn) st.look(k, turn); });
      lookBack = setTimeout(() => seated.forEach((k) => { if (k !== lookTurn) world?.story?.look(k, 'center'); }), 1300);
    } else seated.forEach(k => st.look(k, 'center'));
  }
  // one move from winning: a sly smile for them, worried faces round the table
  const near = nearWin(view);
  if (near.length) {
    near.forEach((p) => { const k = seatOf(p); if (k >= 0) st.mood?.(k, 'sly', 4); });
    players.forEach((_, p) => { const k = seatOf(p); if (k >= 0 && !near.includes(p)) st.mood?.(k, 'worried', 3); });
  }
  // a long wait: the others get restless, one small thing at a time
  if (turn >= 0) {
    fidgetTimer = setInterval(() => {
      const idle = players.map((_, p) => p).filter(p => seatOf(p) >= 0 && seatOf(p) !== lookTurn && !isMe(p) && !poseTimers.has(seatOf(p)));
      if (!idle.length || document.hidden) return;
      const p = idle[Math.floor(Math.random() * idle.length)];
      const k = seatOf(p);
      const r = Math.random();
      if (r < 0.3) act(p, 'shrug', null, 1500);
      else if (r < 0.55) act(p, 'think', null, 1800);
      else if (r < 0.75) { world?.story?.look(k, lookTurn); setTimeout(() => world?.story?.look(k, 'center'), 1600); }
      else if (r < 0.88) act(p, 'nervous', null, 1400);
      else world?.story?.look(k, 'camera');
    }, 5200 + Math.random() * 1800);
  }
}
/** The end of a match: the winner jumps for joy and dances, the rest are surprised, then clap. */
function cheerTable(winners, players) {
  calmTable();
  const st = world?.story;
  if (!st) return;
  if (!winners?.length) { players.forEach((_, p) => act(p, 'shrug', '🤝', 2600)); return; }
  const w0 = seatOf(winners[0]);
  winners.forEach((w) => { act(w, 'jump', '👑', 0); setTimeout(() => act(w, 'dance', null, 0), 1400); });
  players.forEach((_, p) => {
    if (winners.includes(p)) return;
    act(p, isMe(p) ? 'facepalm' : 'surprised', null, 0);
    if (w0 >= 0 && seatOf(p) >= 0) st.look(seatOf(p), w0);
    setTimeout(() => act(p, 'clap', null, 0), 900);
  });
  st.effect('confetti');
}
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
        audioManager.play('dice-throw'); setTimeout(() => audioManager.play('dice-land'), 650); if (seatOf(seat) >= 0) world?.story?.rollGesture(seatOf(seat)); break;
      case 'block': if (seatOf(seat) >= 0) { act(seat, 'cheer', '🧱'); world?.story?.emojiPop('🧱', `${players[seat]?.name || ''}: blockade!`); } break;
      case 'capture': audioManager.play('capture');
        if (seatOf(seat) >= 0) players.forEach((_, p) => { if (p !== seat && p !== ev.victim && seatOf(p) >= 0) { world?.story?.look(seatOf(p), seatOf(seat)); act(p, 'surprised', null, 900); } });
        if (isMe(seat) || (Number.isInteger(ev.victim) && isMe(ev.victim))) buzz('capture');
        if (G.slug === 'ludo') { world?.story?.emojiPop('⚔️', `${players[seat]?.name || ''} captured ${players[ev.victim]?.name || ''}!`); if (isMe(seat)) bump('ludo', 'caps'); } act(seat, 'cheer', '😎'); if (seatOf(seat) >= 0) world?.story?.effect('royal', seatOf(seat)); if (Number.isInteger(ev.victim)) act(ev.victim, 'facepalm', '😱'); break;
      case 'line': audioManager.play('confirm'); act(seat, 'cheer', '🔥'); break;
      case 'crown': audioManager.play('reveal'); act(seat, 'cheer', '👑'); break;
      case 'check': audioManager.play('alert'); if (isMe(ev.victim ?? -1) || !isMe(seat)) buzz('wrong'); act(seat, 'point', '⚠️'); break;
      case 'home': if (G.slug === 'ludo') { world?.story?.emojiPop('🏠', `${players[seat]?.name || ''}: a token is home!`); if (isMe(seat)) bump('ludo', 'home'); }
        // falls through
      case 'ladder': case 'bank': audioManager.play(ev.k === 'ladder' ? 'climb' : ev.k === 'bank' ? 'coin' : 'score'); act(seat, 'clap', '🎉'); break;
      case 'snake': audioManager.play('slide'); if (isMe(seat)) buzz('hit'); act(seat, 'facepalm', '🙈'); break;
      case 'bust': case 'forfeit': case 'foul': case 'miss': audioManager.play('wrong'); if (isMe(seat)) buzz('wrong'); act(seat, 'facepalm', '🙈'); break;
      case 'laugh': act(seat, 'laugh', '😂'); break;
      case 'last': act(seat, 'show', '☝️', 1600); audioManager.play('alert'); players.forEach((_, p) => { if (p !== seat && seatOf(p) >= 0) world?.story?.mood?.(seatOf(p), 'worried', 3); }); break;
      case 'skip': if (Number.isInteger(ev.victim)) act(ev.victim, 'deny', '⏭️', 1300); act(seat, 'laugh', null, 1200); break;
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
        audioManager.play({ card: 'card', draw: 'card', flip: 'flip', shot: 'clack' }[ev.k] || 'piece');
        if (isMe(seat)) buzz('move');
        if (seatOf(seat) >= 0) world?.story?.reachOut(seatOf(seat));
        break;
      case 'trick': audioManager.play('deal'); act(seat, 'clap', null); break;
      case 'pass': case 'stuck': act(seat, 'facepalm', null); break;
      case 'deal': case 'draw': audioManager.play('deal'); break;
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
    const next = afterThrow || then;
    afterThrow = null;
    next();
  };
  board.throwDie(r.n, () => world.story.handOf(k), finish, () => audioManager.play('dice-throw'));
  setTimeout(finish, 2600);    // a hidden tab has no frames: never leave the game waiting
}
/* A sound and optional haptic mark the start of a turn without taking room from the game. */
let wasMine = false;
function signalTurn(ctx) {
  const mine = ctx.mine;
  if (mine && !wasMine && !match?.opts?.silent) {
    audioManager.play('turn');
    buzz('turn');
  }
  wasMine = mine && !ctx.pass;
}

/** One view on this phone. `send(move)` plays a move for this seat. */
function present(view, ctx, players, send, result) {
  shown = { view, ctx, players, send, result };
  clearTimeout(autoTimer);
  ctx.mine = ctx.active.includes(ctx.me);
  // playing the second side of a board that turns round: sit on that side
  if (board?.def?.faces && players.length === 2 && (ctx.me === 1) !== seatsFlipped) sitDown(players);
  direct(ctx, view, players, result);
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
  setStatus(view, panel.players);
  if (result) { wasMine = false; showResult(result, ctx, players); return; }
  paintPanel(panel, ctx, send, view);
  signalTurn(ctx);
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
function paintPanel(p, ctx, send, view) {
  lastStrip = p.players || null;
  const play = (i) => () => send(ctx.legal[i]);
  const cards = (p.buttons || []).filter(b => b.card);
  const plain = (p.buttons || []).filter(b => !b.card);
  const boardPickIndices = board?.pickIndices;
  const directTicTacToeInput = G?.slug === 'tic-tac-toe' && boardPickIndices?.size > 0;
  const pickIndices = TOUCH_INPUT || directTicTacToeInput ? boardPickIndices : null;
  const boardChoices = pickIndices ? plain.filter(b => pickIndices.has(b.i)) : [];
  const boardChoiceIndices = new Set(boardChoices.map(b => b.i));
  const panelChoices = plain.filter(b => !boardChoiceIndices.has(b.i));
  const inHand = new Set(cards.map(b => b.card));
  const rest = (p.hand || []).filter(c => !inHand.has(c));
  const choiceGrid = (choices, alternative = false) => choices.length
    ? h('div', { class: `${choices.every(b => b.label.length <= 2) ? 'grid tiny' : p.compact ? 'grid compact' : 'grid'}${alternative ? ' grid--board-alternative' : ''}` }, choices.map(b => btn(b.label, play(b.i), `${b.primary ? 'primary' : ''}${b.wide ? ' wide' : ''}`)))
    : null;
  const rawTitle = p.title || '';
  const title = ctx.mine && /^your turn:\s*/i.test(rawTitle)
    ? rawTitle.replace(/^your turn:\s*/i, '').replace(/^./, c => c.toUpperCase())
    : rawTitle;
  const kids = [
    clockRow(view, ctx),
    stripOf(p.players),
    h('div', { class: 'head' }, [
      Number.isInteger(p.die) && p.die >= 1 && p.die <= 6 ? h('span', { class: 'dieface', 'aria-label': `Die shows ${p.die}` }, [String.fromCodePoint(0x2680 + p.die - 1)]) : null,
      h('h1', {}, [title]),
      // against the computer, in a game of skill: take your last move back
      !shown?.result && canUndo() && ctx.mine && LEVEL !== 'hard' ? (ctx.hinting
        ? h('button', { type: 'button', class: 'undobtn', title: 'Choose from every move again', onclick: () => { audioManager.play('button'); unhint(); } }, [say.allMoves])
        : h('button', { type: 'button', class: 'undobtn', title: 'Show a good move (H)', 'aria-label': 'Show a hint', onclick: () => { audioManager.unlock(); hint(); } }, [say.hint])) : null,
      !shown?.result && canUndo() && match.history?.length ? h('button', { type: 'button', class: 'undobtn', title: 'Take back your last move (Ctrl+Z)', 'aria-label': 'Undo your last move', onclick: () => { audioManager.unlock(); undo(); } }, [say.undo]) : null,
    ]),
    ctx.hinting ? h('p', { class: 'hintline' }, [say.hintLine]) : null,
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
    choiceGrid(panelChoices),
    choiceGrid(boardChoices, true),
    trollBar(ctx),
  ];
  show(topBar(G), h('section', { class: `panel panel--play${p.compact ? ' panel--tight' : ''}` }, kids));
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
/* ─── your chess level: everyone starts as a Beginner and climbs one level at a time (see chessLevelUp) ─── */
const CHESS_LEVELS = ['beginner', 'novice', 'intermediate', 'good', 'advanced', 'expert', 'master', 'grandmaster'];
/** A chess table waits longer: finding someone of your own level takes a little time. */
const publicWait = () => (G?.slug === 'chess' ? 60000 : PUBLIC_WAIT_MS);
const an = (word) => `${/^[AEIOU]/.test(word) ? 'an' : 'a'} ${word}`;
const CHESS_NAMES = ['Beginner', 'Novice', 'Intermediate', 'Good', 'Advanced', 'Expert', 'Master', 'Grandmaster'];
const chessName = (id) => CHESS_NAMES[CHESS_LEVELS.indexOf(id)] || 'Beginner';
function myChessLevel() {
  let v = null;
  try { v = localStorage.getItem('chitplay.chessLevel'); } catch {}
  return CHESS_LEVELS.includes(v) ? v : 'beginner';
}
/**
 * After a chess game you won, you climb one level at a time, the way rating ladders work:
 *  - beat a player of a higher level: up one level (never straight to theirs);
 *  - beat three players of your own level: up one level.
 * A level is never lost, so a bad day never takes away what you earned.
 */
const WINS_TO_CLIMB = 3;
function chessLevelUp(result, ctx) {
  if (G?.slug !== 'chess' || !match || ctx.me < 0 || ctx.pass || !result.winners?.includes(ctx.me)) return null;
  const loser = 1 - ctx.me, p = match.players[loser];
  const beaten = p?.kind === 'bot' ? match.s.level : p?.kind === 'guest' ? p.level : guestState.hostLevel;
  const was = myChessLevel();
  const at = CHESS_LEVELS.indexOf(was), them = CHESS_LEVELS.indexOf(beaten);
  if (them < 0 || at >= CHESS_LEVELS.length - 1) return null;
  let wins = 0;
  try { wins = Number(localStorage.getItem('chitplay.chessWins')) || 0; } catch {}
  let next = null;
  if (them > at) next = CHESS_LEVELS[at + 1];
  else if (them === at) { wins += 1; if (wins >= WINS_TO_CLIMB) next = CHESS_LEVELS[at + 1]; }
  try {
    if (next) { localStorage.setItem('chitplay.chessLevel', next); localStorage.setItem('chitplay.chessWins', '0'); }
    else localStorage.setItem('chitplay.chessWins', String(wins));
  } catch {}
  return next;
}
/* ─── a chess clock ─── */
let clockTick = 0;
const showTime = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return t >= 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` : `0:${String(t).padStart(2, '0')}${ms < 10000 ? `.${Math.floor((ms % 1000) / 100)}` : ''}`; };
function clockRow(view, ctx) {
  clearInterval(clockTick);
  if (!view?.clock) return null;
  const since = Date.now(), running = view.end ? -1 : view.p;
  const cells = [0, 1].map((seat) => h('span', { class: `clock${seat === running ? ' clock--on' : ''}${seat === ctx.me ? ' clock--me' : ''}` }, [
    h('small', {}, [ctx.names[seat] || '']), h('b', {}, [showTime(view.clock.left[seat])]),
  ]));
  const row = h('div', { class: 'clocks', role: 'timer', 'aria-label': 'Chess clock' }, cells);
  if (running >= 0) {
    let warned = false;
    clockTick = setInterval(() => {
      if (!row.isConnected) { clearInterval(clockTick); return; }
      if (paused) return;
      const left = view.clock.left[running] - (Date.now() - since);
      cells[running].lastChild.textContent = showTime(left);
      cells[running].classList.toggle('clock--low', left < 20000);
      if (left < 10000 && !warned && running === ctx.me) { warned = true; audioManager.play('tick'); }
    }, 100);
  }
  return row;
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
  // only somebody not sitting in the room (a fifth player) needs the small banner to be seen at all
  else world?.story?.emojiPop(e, target != null ? `${list[seat]?.name || ''} → ${list[target].name}` : list[seat]?.name || '');
  audioManager.play('select');
}
const playersNow = () => match?.players || guestState.players;
let emojiAt = 0;
/** Always on screen in a game, for everyone, on their turn or not: one tap and it flies across the room to the others. */
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
  const nameOf = (i) => (i == null ? `👥 ${say.everyone}` : ctx.names[i]);
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
let pendingOffer = null;
let postgameOfferNote = null;
let lastOfferSent = 0;
let sentOfferId = null;
let incomingOfferId = null;

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
  audioManager.musicStart('calm');
  clearPendingOffer();
  postgameOfferNote = null;
  recorded = false; seriesDone = false;
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
/** Bots play quickly; any human seat gets one bot move if its turn sits idle for 30 seconds. */
function scheduleActive(active) {
  const players = match.players;
  match.turnAt = Date.now();
  // a game with a clock: the player to move loses when their time is up
  const clock = match.s.clock;
  if (clock && Logic.timeout && active.length === 1) {
    const seat = active[0];
    match.timers.set('clock', setTimeout(() => {
      if (!match || Logic.result(match.s) || !Logic.active(match.s).includes(seat)) return;
      Logic.timeout(match.s, seat);
      pump([{ k: 'timeout', seat }]);
    }, Math.max(0, clock.left[seat])));
  }
  active.forEach((seat) => {
    const p = players[seat];
    if (p.kind === 'bot') schedule(seat, rand(...BOT_MS));
    // with other people waiting online, an idle player gets one move made for them after 30 seconds;
    // playing alone or on one phone, nobody moves for you, and with a clock the clock decides
    else if ((room || guest) && !clock) schedule(seat, TURN_TIMEOUT_MS);
  });
}
/** The time the player to move has used since their turn began comes off their clock. */
function chargeClock(seat) {
  const clock = match?.s.clock;
  if (!clock || !match.turnAt || paused) return;
  clock.left[seat] = Math.max(0, clock.left[seat] - (Date.now() - match.turnAt));
  match.turnAt = Date.now();
}
function schedule(seat, ms) {
  const wait = Math.max(ms, match.busyUntil - Date.now());
  match.timers.set(seat, setTimeout(() => autoMove(seat), wait));
}
function autoMove(seat) {
  if (!match || Logic.result(match.s) || !Logic.active(match.s).includes(seat)) return;
  const legal = Logic.moves(match.s, seat);
  // an easier bot sometimes just makes any legal move; only when the seat is a real bot
  const slip = match.players[seat].kind === 'bot' && !match.s.level && !Logic.check && legal.length > 1 && G.skill && Math.random() < SLIP[LEVEL];
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
  const ctx = { me, legal, active, names, pass: here.length > 1, level: LEVEL };
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
/*
 * Take back a move: only where it's fair and makes sense, against the computer in the games of pure
 * skill (no dice, no hidden cards: an undo there would let you re-roll or peek). It goes back to the
 * start of your last turn, the computer's reply undone with it.
 */
const UNDO_GAMES = new Set(['chess', 'checkers', 'reversi', 'four-in-a-row', 'tic-tac-toe', 'mancala', 'nine-mens-morris', 'dots-and-boxes']);
const canUndo = () => !!match && !room && !guest && !match.opts?.public && UNDO_GAMES.has(G?.slug)
  && match.players.filter(p => p.kind === 'me').length === 1 && match.players.every(p => p.kind === 'me' || p.kind === 'bot');
function undo() {
  if (!canUndo() || !match.history?.length || Logic.result(match.s)) return;
  clearMatchTimers();
  match.s = match.history.pop();
  match.lastMover = -1;
  match.undos = (match.undos || 0) + 1;
  match.busyUntil = 0;
  audioManager.play('whoosh');
  buzz('tap');
  world?.story?.emojiPop?.('↶', say.movedBack);
  pump([]);
}
addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.target.closest?.('input, textarea') && !document.querySelector('.sheet')) hint(); });
addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.target.closest?.('input, textarea')) { e.preventDefault(); undo(); } });
/**
 * A hint, in the same fair places as undo: the computer works out a good move for you, and the board
 * shows only that one (its piece and where it goes glow). Make it, or tap "All moves" to choose freely.
 */
function hint() {
  if (!canUndo() || LEVEL === 'hard' || !shown || shown.result || !shown.ctx.mine || shown.ctx.hinting || !shown.ctx.legal?.length) return;
  const me = shown.ctx.me;
  const best = Logic.bot(match.s, me, Math.random, Logic.moves(match.s, me));
  const i = shown.ctx.legal.findIndex(m => keepKey(m) === keepKey(best));
  if (i < 0) return;
  match.hints = (match.hints || 0) + 1;
  audioManager.play('reveal');
  buzz('tap');
  const full = shown.ctx;
  present(shown.view, { ...full, legal: [full.legal[i]], hinting: full }, shown.players, shown.send, null);
}
/** Back to every move after a hint. */
function unhint() {
  if (!shown?.ctx.hinting) return;
  present(shown.view, shown.ctx.hinting, shown.players, shown.send, null);
}
function submit(seat, move) {
  if (!match || !move || typeof move !== 'object') return false;
  const { s } = match;
  if (Logic.result(s) || !Logic.active(s).includes(seat)) return false;
  const legal = Logic.moves(s, seat);
  const key = keepKey(move);
  let chosen = legal.find(m => keepKey(m) === key);
  if (!chosen && Logic.check) chosen = Logic.check(s, seat, move);
  if (!chosen) return false;
  // the start of your turn is kept, so it can be taken back (a multi-jump or an extra turn is one turn)
  if (match.players[seat]?.kind === 'me' && match.lastMover !== seat && canUndo()) {
    (match.history ||= []).push(JSON.parse(JSON.stringify(s)));
    if (match.history.length > 60) match.history.shift();
  }
  match.lastMover = seat;
  chargeClock(seat);
  const events = Logic.apply(s, seat, chosen, Math.random) || [];
  if (s.clock && !Logic.result(s)) s.clock.left[seat] += s.clock.inc || 0;
  pump(events);
  return true;
}
/** The sound (and buzz) at the end of a match, for the person holding this phone. */
function endSound(winners, mine) {
  if (!winners?.length) { audioManager.play('draw-game'); return; }
  // nobody of ours at the table (watching), or everybody is (pass the phone): just celebrate
  if (!mine.length || mine.length > 1) { audioManager.play('victory'); return; }
  const won = winners.includes(mine[0]);
  audioManager.play(won ? 'victory' : 'lose');
  buzz(won ? 'win' : 'lose');
}
function celebrate(result) {
  endSound(result.winners, match ? match.players.map((p, i) => (isHere(p) ? i : -1)).filter(i => i >= 0) : []);
  cheerTable(result.winners, match?.players || []);
}
/** Your record in each game, and your coins and rank: a finished game always counts for something. */
let recorded = false;
/** Wins in a row of matches at the same table (the same game and players), until the page is left. */
let series = { key: '', wins: {}, draws: 0, played: 0 }, seriesDone = false;
function countSeries(result, names) {
  if (seriesDone) return;
  seriesDone = true;
  const key = `${G.slug}|${names.join('|')}`;
  if (series.key !== key) series = { key, wins: {}, draws: 0, played: 0 };
  series.played += 1;
  if (!result.winners?.length) series.draws += 1;
  else result.winners.forEach((w) => { series.wins[w] = (series.wins[w] || 0) + 1; });
}
/** "Series: You 2 · Ravi 1 · 1 draw", once there's more than one match to count. */
function seriesLine(names, me) {
  if (series.played < 2) return null;
  const parts = names.map((n, i) => `${i === me ? say.you : n} ${series.wins[i] || 0}`);
  if (series.draws) parts.push(fill(say.draws, { n: series.draws }));
  return fill(say.series, { n: series.played, list: parts.join(' · ') });
}
function recordResult(result, ctx) {
  holdPopups(false);
  if (recorded || ctx.me < 0 || ctx.pass) return null;
  recorded = true;
  const won = (result.winners || []).includes(ctx.me);
  const key = `chitplay.record.${G.slug}`;
  let rec = { played: 0, won: 0, streak: 0 };
  try { rec = { ...rec, ...JSON.parse(localStorage.getItem(key)) }; } catch {}
  rec.played += 1;
  if (won) { rec.won += 1; rec.streak += 1; } else rec.streak = 0;
  // records worth chasing: the longest run of wins, and (where points matter) the best score
  const mine = Number(result.scores?.[ctx.me]);
  const newStreak = rec.streak > 1 && rec.streak > (rec.bestStreak || 0);
  const newScore = SCORED.has(G.slug) && !result.lowWins && Number.isFinite(mine) && rec.played > 1 && mine > (rec.bestScore || 0);
  rec.bestStreak = Math.max(rec.bestStreak || 0, rec.streak);
  if (SCORED.has(G.slug) && !result.lowWins && Number.isFinite(mine)) rec.bestScore = Math.max(rec.bestScore || 0, mine);
  try { localStorage.setItem(key, JSON.stringify(rec)); } catch {}
  if (newScore) popup('🏆', 'New best score!', `${mine}: your best ever at ${G.name}.`);
  else if (newStreak) popup('🔥', `${rec.streak} wins in a row!`, 'Your longest winning streak yet.');
  rec.newBest = newScore ? mine : null;
  rec.newStreak = newStreak;
  refreshBest();
  paintStatus();
  const done = gameFinished({ slug: G.slug, won, mode: room || guest ? 'nearby' : 'local', online: !!match?.opts?.public });
  return { ...rec, coins: done.coins, gained: done.gained };
}
let lastRecord = null;
/** The slate on the wall: this game, and how you have done at it. */
function chalkSlate() {
  if (!world?.story?.setSlate || !G) return;
  const st = playStats();
  const rp = rankProgress();
  const room = roomLevel();
  world.story.setSlate(G.name, [
    `Player L${rp.index + 1} ${rp.title}`,
    rp.next ? `Next +${rp.next.at - rp.points} pts` : 'Top rank reached',
    `Room L${room.level} ${room.title}`,
    `Played ${st.plays?.[G.slug] || 0} · Won ${st.wins?.[G.slug] || 0}`,
  ]);
}
function liveGuestIds() {
  if (!room || !match) return [];
  return [...room.guests.entries()]
    .filter(([, g]) => match.players.some(p => p.kind === 'guest' && p.token === g.token))
    .map(([id]) => id);
}
function setPostgameOfferNote(text, state = 'idle') {
  if (!postgameOfferNote?.isConnected) return;
  postgameOfferNote.replaceChildren();
  postgameOfferNote.hidden = !text;
  if (text) {
    postgameOfferNote.append(document.createTextNode(text));
    if (state === 'declined') postgameOfferNote.append(btn(say.findAnother, findAnotherPlayer, 'result-find'));
  }
  document.querySelectorAll('.result-actions .btn').forEach(button => { button.disabled = state === 'waiting'; });
}
function findAnotherPlayer() {
  const url = new URL(location.href);
  url.searchParams.set('mode', 'online');
  url.searchParams.delete('join');
  leaveAll();
  location.assign(url.href);
}
function clearPendingOffer() {
  if (pendingOffer?.timer) clearTimeout(pendingOffer.timer);
  pendingOffer = null;
}
function showOfferPrompt({ kind, game, fromName }, reply) {
  document.querySelector('.offer-sheet')?.remove();
  const prompt = kind === 'again' ? say.offerRematch : fill(say.offerGame, { game: game.name });
  let answered = false;
  const sheet = h('div', { class: 'sheet offer-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': prompt }, [
    h('div', { class: 'sheet__box' }, [
      h('h1', {}, [fromName ? `${fromName}: ${prompt}` : prompt]),
      btn(kind === 'again' ? say.playAgain : fill(say.startGame, { game: game.name }), () => {
        if (answered) return;
        answered = true;
        sheet.remove();
        reply(true);
      }, 'primary'),
      btn(say.declineOffer, () => {
        if (answered) return;
        answered = true;
        sheet.remove();
        reply(false);
      }),
    ]),
  ]);
  document.body.append(sheet);
  sheet.querySelector('button')?.focus({ preventScroll: true });
}
async function beginOfferedMatch(offer) {
  if (!room || guest || !match) return;
  const current = match;
  const players = current.players.map(p => p.kind === 'guest' && !guestLive(p) ? { ...p, kind: 'bot' } : p);
  if (offer.kind === 'again') {
    startMatch(players, current.opts);
    return;
  }
  const next = gameBySlug(offer.game);
  if (!next || next.video || players.length > next.max) throw new Error('The offered game is unavailable for this table.');
  const publicMatch = !!current.opts?.public || !!room.isPublic;
  await loadGame(next);
  chosenStyle = next.modes?.[0]?.[0] || null;
  try {
    const url = new URL(location.href);
    url.searchParams.set('game', next.slug);
    ['mode', 'style', 'n', 'rules'].forEach(k => url.searchParams.delete(k));
    history.replaceState(null, '', url);
  } catch {}
  room.broadcast({ t: 'lobby', arcade: true, game: next.slug, players: players.map(p => p.name) });
  const opts = { ...(chosenStyle ? { style: chosenStyle } : {}), ...(publicMatch ? { public: true } : {}) };
  startMatch(seededPlayers(players, Math.max(players.length, next.min)), opts);
}
function resolveOffer(id, accept, expired = false) {
  const offer = pendingOffer;
  if (!offer || offer.id !== id) return;
  clearPendingOffer();
  if (offer.source === 'guest') document.querySelector('.offer-sheet')?.remove();
  const status = accept ? 'accepted' : expired ? 'expired' : 'declined';
  const response = { t: 'offerResult', id, status };
  if (offer.source === 'host') room?.broadcast(response);
  else room?.send(offer.fromId, response);
  setPostgameOfferNote(accept ? '' : expired ? say.offerExpired : say.offerDeclined, accept ? 'idle' : 'declined');
  if (!accept) return;
  beginOfferedMatch(offer).catch((e) => {
    console.error('[table] offered game', e);
    message('Couldn’t start the next game', 'Return to the room and try again.', btn(say.backToRoom, () => switchGame(G), 'primary'));
  });
}
function offerFromGuest(id, seat, msg) {
  if (typeof msg.id !== 'string' || msg.id.length > 64) return;
  if (!match || !Logic.result(match.s)) { room.send(id, { t: 'offerResult', id: msg.id, status: 'busy' }); return; }
  if (pendingOffer) { room.send(id, { t: 'offerResult', id: msg.id, status: 'busy' }); return; }
  const request = normalizeOfferRequest(msg, { currentGame: G, gameBySlug, playerCount: match.players.length });
  if (!request) {
    room.send(id, { t: 'offerResult', id: msg.id, status: 'declined' });
    return;
  }
  const offer = { ...request, game: request.game.slug, source: 'guest', fromId: id, timer: null };
  pendingOffer = offer;
  offer.timer = setTimeout(() => resolveOffer(offer.id, false, true), 30000);
  showOfferPrompt({ ...offer, game: request.game, fromName: match.players[seat].name }, accept => resolveOffer(offer.id, accept));
}
function replyToOffer(id, msg) {
  const offer = pendingOffer;
  const result = applyOfferReply(offer, id, msg);
  if (result.outcome) resolveOffer(offer.id, result.outcome === 'accepted');
  else if (result.offer !== offer) pendingOffer = result.offer;
}
function createOffer(kind, gameSlug = G.slug) {
  const ended = guest ? guestState.started && guestState.result : !!match && !!Logic.result(match.s);
  if (!ended || sentOfferId || pendingOffer || Date.now() - lastOfferSent < 1000) return;
  const people = guest ? guestState.players.length : match.players.length;
  const request = normalizeOfferRequest({ id: 'local', kind, game: gameSlug }, { currentGame: G, gameBySlug, playerCount: people });
  if (!request) return;
  const game = request.game;
  lastOfferSent = Date.now();
  if (guest) {
    const id = newToken();
    sentOfferId = id;
    guest.send({ t: 'offer', id, kind, game: game.slug });
    setPostgameOfferNote(say.offerSent, 'waiting');
    return;
  }
  if (!room || pendingOffer) return;
  const targets = liveGuestIds();
  if (!targets.length) return;
  const offer = { id: newToken(), kind, game: game.slug, source: 'host', targets: new Set(targets), timer: null };
  pendingOffer = offer;
  offer.timer = setTimeout(() => resolveOffer(offer.id, false, true), 30000);
  room.broadcast({ t: 'offer', id: offer.id, kind, game: game.slug });
  setPostgameOfferNote(say.offerSent, 'waiting');
}
function showResult(result, ctx, players) {
  audioManager.musicStop();
  setTimeout(chalkSlate, 600);
  const levelUp = chessLevelUp(result, ctx);
  if (levelUp) setTimeout(() => notice({ icon: '♟️', title: `Level up: ${chessName(levelUp)}!`, body: `You beat ${an(chessName(levelUp))} player, so that is your level now. Online, you are matched with ${chessName(levelUp)} players.` }), 900);
  lastRecord = recordResult(result, ctx) || lastRecord;
  const names = players.map(p => p.name);
  countSeries(result, names);
  const seriesNow = seriesLine(names, ctx.pass ? -1 : ctx.me);
  const order = names.map((n, i) => [n, result.scores[i], i]).sort((a, b) => (result.lowWins ? a[1] - b[1] : b[1] - a[1]));
  const won = result.winners || [];
  const title = !won.length ? (result.story ? 'The story unfolds…' : say.draw)
    : won.length > 1 ? 'A tie at the top!' : won[0] === ctx.me ? `🏆 ${say.youWin}` : ctx.me >= 0 && !ctx.pass ? `😵 You lost! ${fill(say.wins, { name: names[won[0]] })}` : fill(say.wins, { name: names[won[0]] });
  const iAmHost = !guest;
  const hasOpponent = !!guest || liveGuestIds().length > 0;
  postgameOfferNote = h('div', { class: 'result-feedback', role: 'status', 'aria-live': 'polite', hidden: true });
  const againButton = hasOpponent
    ? btn(say.offerRematchButton, () => createOffer('again'), 'primary')
    : iAmHost
      ? btn(say.playAgain, async (e) => { if (e?.currentTarget) e.currentTarget.disabled = true; const next = match.players.map(p => ((p.kind === 'guest' && !guestLive(p)) ? { ...p, kind: 'bot' } : p)); const opts = match.opts; if (!playingWithPeople()) await adBreak(`${G.slug}-again`, { pause: () => audioManager.musicPause(true), resume: () => audioManager.musicPause(false) }); startMatch(next, opts); }, 'primary')
      : h('p', { class: 'lead' }, [say.waitHostAgain]);
  const anotherButton = hasOpponent
    ? btn(say.offerAnotherButton, () => openGamePicker(game => createOffer('game', game.slug)))
    : iAmHost && inFriendsRoom()
      ? btn(say.anotherGame, () => openGamePicker())
      : null;
  const resultActions = h('div', { class: 'result-actions' }, [
    againButton,
    anotherButton,
    iAmHost && inFriendsRoom() ? btn(say.backToRoom, () => switchGame(G)) : null,
  ].filter(Boolean));
  const resultMore = h('details', { class: 'result-more' }, [
    h('summary', {}, [say.more]),
    guest || inFriendsRoom() ? null : suggestionRow(G.slug, '../', won.includes(ctx.me) ? 'Try these next' : 'Or try another game'),
    h('a', { class: 'btn', href: '../', onclick: leaveAll }, [say.allGames]),
    h('a', { class: 'rules', href: `../games/${G.slug}/` }, [{ ...RULE_WORDS.en, ...(RULE_WORDS[LANG] || {}) }.guide]),
    hotPrompt(G.slug, G.name),
  ]);
  show(topBar(G), h('section', { class: 'panel panel--result' }, [
    h('h1', {}, [title]),
    result.note ? h('p', { class: 'lead' }, [result.note]) : null,
    seriesNow ? h('p', { class: 'record record--series' }, [seriesNow]) : null,
    match?.undos || match?.hints ? h('p', { class: 'lead' }, [[match.undos ? fill(say.takenBack, { n: match.undos }) : '', match.hints ? fill(say.hintsUsed, { n: match.hints }) : ''].filter(Boolean).join(' · ')]) : null,
    result.story ? h('div', { class: 'chit open story' }, result.story.map(line => h('p', { class: 'line' }, [line]))) : h('ol', { class: 'board' }, order.map(([n, v, i], k) => h('li', { class: won.includes(i) ? 'first' : '' }, [h('span', {}, [`${['🥇', '🥈', '🥉'][k] || k + 1} ${n}`]), h('strong', {}, [String(v)])]))),
    lastRecord?.newBest ? h('p', { class: 'record record--best' }, [fill(say.newBestScore, { n: lastRecord.newBest })]) : lastRecord?.newStreak ? h('p', { class: 'record record--best' }, [fill(say.bestStreakLine, { n: lastRecord.streak })]) : null,
    lastRecord ? h('p', { class: 'record' }, [fill(say.record, lastRecord), lastRecord.streak > 1 ? ` · ${fill(say.streak, { n: lastRecord.streak })}` : '', lastRecord.coins ? ` · ${fill(say.coins, { n: lastRecord.coins })}` : '']) : null,
    (() => {
      const rp = rankProgress();
      return h('div', { class: 'rankline' }, [h('span', {}, [`${rp.icon} ${rp.title}`]), h('div', { class: 'rankbar' }, [h('i', { style: `width:${Math.round(rp.share * 100)}%` })]), lastRecord?.gained ? h('small', {}, [`+${lastRecord.gained} rank points`]) : null]);
    })(),
    trollBar(ctx),
    resultActions,
    postgameOfferNote,
    btn(won.includes(ctx.me) ? '📤 Share my win' : '📤 Share', async () => {
      let pic = null;
      try { const img = new Image(); img.src = world?.story?.snapshot?.() || ''; await img.decode(); pic = img; } catch {}
      const card = resultImage({ picture: pic, game: G, headline: won.includes(ctx.me) ? 'I won!' : title.replace(/^\S+ /, ''), sub: names.join(' · ') });
      await shareResult({ canvas: card, text: `${won.includes(ctx.me) ? 'I won' : 'I played'} ${G.name} on ChitPlay!`, slug: G.slug });
    }, 'result-share'),
    resultMore,
    // the only ad in a game: last on the result screen, below every button (src/arcade/ads.js)
    resultAd(),
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
    btn('👫 Play with friends', () => nearby(size)),
    h('div', { class: 'grid two' }, [btn('👀 Just watch', () => watch(size)), btn('📱 Pass the phone', () => passSetup(size))]),
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
  if (G.slug === 'chess') room.level = myChessLevel();
  room.lv = myLevel();   // strangers looking for a table are matched by level (online)
  // a party's table lead reports the code, so the rest of the table can join it (src/net/party.js)
  return room.open(code).then((c) => { if (c) dispatchEvent(new CustomEvent('chitplay:room-open', { detail: { code: c, slug: G.slug } })); return c; });
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
  if (msg.t === 'offer') {
    if (Date.now() - (match.players[seat].offerAt || 0) <= 4000) return;
    match.players[seat].offerAt = Date.now();
    offerFromGuest(id, seat, msg);
  } else if (msg.t === 'offerReply') {
    replyToOffer(id, msg);
  } else if (msg.t === 'move') {
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
  const guests = room.list.map(g => ({ name: g.name, kind: 'guest', token: g.token, look: g.look, level: g.level }));
  return [{ name: room.hostLabel, kind: 'me', look: myLook() }, ...guests];
}
function pushLobby(extra = {}) {
  const names = [room.hostLabel, ...room.list.map(g => g.name)];
  room.broadcast({ t: 'lobby', arcade: true, game: G.slug, players: names, ...extra });
  return names;
}

/* ─── a friends' room: everybody stays in it from game to game, and the host picks what's next ─── */
let wanted = 0;            // seats at the table in a friends' room; computer players take the ones left
let qrCache = null;        // the room's QR code, drawn once (repainting the lobby must not make it flicker)
/** The games a friends' room can move to: every table game (the TV games have their own screens). */
const ROOM_GAMES = ALL_GAMES.filter(g => !g.video);
const inFriendsRoom = () => !!room && !guest && !match?.opts?.public && !paintPublic;

async function nearby(size) {
  show(topBar(G), h('section', { class: 'panel' }, [h('h1', {}, ['Opening a room…']), h('p', { class: 'lead' }, ['Getting a code for your friends.'])]));
  wanted = size;
  try {
    await openRoom(null, { onChange: () => { if (!match) hostLobby(); } });
    hostLobby();
  } catch (e) {
    room?.close();
    room = null;
    message('Couldn’t open a room', netError(e), btn('Play with computer players instead', () => solo(size), 'primary'), btn('Back', () => intro(G)));
  }
}
/** The host's lobby: the code, who's here, how many seats, which mode, and which game. */
function hostLobby() {
  if (!room) return;
  const names = pushLobby();
  const people = names.length;
  wanted = Math.min(Math.max(G.max, people), Math.max(G.min, people, wanted || G.seats));
  const link = `${location.origin}${location.pathname}?join=${room.code}`;
  if (qrCache?.code !== room.code) {
    qrCache = { code: room.code, el: h('div', { class: 'qr' }) };
    const el = qrCache.el;
    import(`../net/qr.js${V}`).then(({ qrSvg }) => { const svg = qrSvg(link, 'Scan to join'); if (svg) el.append(svg); }).catch(() => {});
  }
  // seats: never fewer than the people here, never more than the game takes
  const sizes = [];
  for (let n = Math.max(G.min, people); n <= Math.max(people, Math.min(G.max, 6)); n++) sizes.push(n);
  const guests = room.list;
  const seatsLeft = wanted - people;
  // sent here by a party: once everyone meant for this table is in, the game starts by itself
  const expected = params.get('party') === '1' ? myTableSize(G.slug) : 0;
  const everyoneIn = expected > 1 && people >= expected;
  if (everyoneIn && !partyAutoStart) partyAutoStart = setTimeout(() => { if (room && !match) document.querySelector('.lobby .btn.primary, .lobby .primary')?.click(); }, 3000);
  show(topBar(G), h('section', { class: 'panel lobby' }, [
    everyoneIn ? h('p', { class: 'lead', role: 'status' }, ['🎉 Everyone is here! Starting in 3 seconds…']) : null,
    h('div', { class: 'lobby__game' }, [
      h('span', { class: 'lobby__icon', 'aria-hidden': 'true' }, [G.icon]),
      h('div', {}, [h('small', {}, [say.nowPlaying]), h('strong', {}, [G.name])]),
      btn(say.change, () => openGamePicker(), 'lobby__change'),
    ]),
    h('h1', {}, [say.friendsJoin]),
    h('p', { class: 'code', 'aria-label': `Room code ${room.code}` }, [`${room.code.slice(0, 3)} ${room.code.slice(3)}`]),
    qrCache.el,
    h('button', { type: 'button', class: 'btn', onclick: async (e) => { const b = e.currentTarget; try { if (navigator.share) await navigator.share({ title: 'ChitPlay', text: `Join my ${G.name} game on ChitPlay`, url: link }); else { await navigator.clipboard.writeText(link); b.textContent = 'Link copied!'; } } catch {} } }, [say.shareInvite]),
    h('h2', {}, [`Players (${people} of ${G.max === G.min ? G.max : `${G.min}–${G.max}`})`]),
    h('ol', { class: 'names joined lobby__names' }, [
      h('li', {}, [h('span', {}, [`${names[0]} (host)`])]),
      ...guests.map(g => h('li', {}, [
        h('span', {}, [g.name]),
        h('button', { type: 'button', class: 'x', 'aria-label': `Remove ${g.name} from the room`, title: 'Remove from the room', onclick: () => { if (window.confirm(`Remove ${g.name} from the room?`)) room.kick(g.id); } }, ['✕']),
      ])),
    ]),
    sizes.length > 1 ? h('div', { class: 'opt' }, [h('span', {}, [say.seats]), h('div', { class: 'chips', role: 'group', 'aria-label': 'Seats at the table' }, sizes.map(n => h('button', { type: 'button', class: `chip${n === wanted ? ' on' : ''}`, 'aria-pressed': String(n === wanted), onclick: () => { wanted = n; hostLobby(); } }, [String(n)])))]) : null,
    G.modes ? h('div', { class: 'opt' }, [h('span', {}, ['Mode']), h('div', { class: 'chips' }, G.modes.map(([id, label]) => h('button', { type: 'button', class: `chip wide${id === chosenStyle ? ' on' : ''}`, 'aria-pressed': String(id === chosenStyle), onclick: () => { chosenStyle = id; hostLobby(); } }, [label])))]) : null,
    G.modes ? h('p', { class: 'lead' }, [G.modes.find(m => m[0] === chosenStyle)?.[2] || '']) : null,
    h('p', { class: 'lead' }, [seatsLeft > 0 ? `Computer players will take the other ${seatsLeft} seat${seatsLeft > 1 ? 's' : ''}.` : 'Everyone here plays.']),
    btn(fill(say.startGame, { game: G.name }), () => {
      const players = lobbyPlayers();
      room.lock();
      startMatch(seededPlayers(players, Math.max(wanted, players.length, G.min)), styleOpts());
    }, 'primary'),
    btn(`📖 ${say.howTo}`, () => openRules(G)),
    btn(say.closeRoom, () => { if (guests.length && !window.confirm('Close the room? Your friends will be sent out.')) return; room.close(); room = null; intro(G); }),
  ]));
}
/** The host picks the next game for everybody. Games that can't seat everyone here are greyed out. */
function openGamePicker(onPick = null) {
  if ((!room || guest) && !onPick) return;
  document.querySelector('.sheet')?.remove();
  const people = match?.players.length || guestState.players.length || (room ? 1 + room.guests.size : 1);
  const close = () => sheet.remove();
  const groups = ['Board', 'Cards', 'Dice', 'Puzzle', 'Party'].map(kind => [kind, ROOM_GAMES.filter(g => g.kind === kind)]).filter(([, list]) => list.length);
  const tile = (g) => {
    const fits = g.max >= people && (world || !ROOM_GAMES_NEED_3D.has(g.slug)) && (!onPick || g !== G);
    return h('button', { type: 'button', class: `pick${g === G ? ' on' : ''}`, disabled: !fits, 'aria-pressed': String(g === G), style: `--accent:${g.accent}`, title: fits ? g.blurb : `Up to ${g.max} players`, onclick: () => { close(); audioManager.play('button'); if (onPick) onPick(g); else switchGame(g); } }, [
      h('span', { class: 'pick__icon', 'aria-hidden': 'true' }, [g.icon]),
      h('strong', {}, [g.name]),
      h('small', {}, [fits ? `${g.min === g.max ? g.min : `${g.min}–${g.max}`} players` : `Up to ${g.max}`]),
    ]);
  };
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Pick a game', onclick: (e) => { if (e.target === sheet) close(); } }, [
    h('div', { class: 'sheet__box' }, [
      h('h1', {}, [say.pickNext]),
      h('p', { class: 'lead' }, [onPick ? say.offerPickHelp : fill(say.everyoneMoves, { n: people })]),
      ...groups.flatMap(([kind, list]) => [h('h2', {}, [kind]), h('div', { class: 'picks' }, list.map(tile))]),
      btn(say.close, close),
    ]),
  ]);
  document.body.append(sheet);
  sheet.querySelector('.pick.on, .pick:not([disabled])')?.focus({ preventScroll: true });
}
/** The same board on the mat as the game everybody is about to play. */
function previewBoard() {
  board?.dispose();
  board = null;
  if (world?.story) { try { board = createBoard(G.slug, world, { seatOf }); } catch (e) { console.warn('[table] board preview', e); } }
  fitBoard();
}
/** Everybody in the room moves to another game: new rules, new board, back to the lobby. */
async function switchGame(game) {
  if (!room || guest) return;
  clearPendingOffer();
  document.querySelector('.sheet')?.remove();
  postgameOfferNote = null;
  clearMatchTimers();
  match = null;
  paused = false;
  holdPopups(false);
  if (game !== G) {
    await loadGame(game);
    chosenStyle = game.modes?.[0]?.[0] || null;
    wanted = game.seats;
    try { const u = new URL(location.href); u.searchParams.set('game', game.slug); ['mode', 'style', 'n'].forEach(k => u.searchParams.delete(k)); history.replaceState(null, '', u); } catch {}
    world?.story?.emojiPop?.(game.icon, `Next game: ${game.name}`);
  }
  setStatus(null, []);
  previewBoard();
  chalkSlate();
  room.unlock(G.max - 1);
  hostLobby();
}

/** Play online: a table with people already waiting (your own country first), or open one for the next player. */
async function online(size = G.seats) {
  if (G.slug === 'chess') { chessOnline(); return; }
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
  // your own level first, then the nearest levels, then anyone: never left waiting for a perfect match
  const mine = myLevel();
  const gap = (t) => (t.lv ? Math.abs(t.lv - mine) : 50);
  const band = (t) => (gap(t) <= 3 ? 0 : gap(t) <= 10 ? 1 : gap(t) <= 25 ? 2 : 3);
  const waiting = seen.filter(t => !t.locked && t.seats < G.max - 1).sort((a, b) => band(a) - band(b) || (b.country === home) - (a.country === home) || gap(a) - gap(b) || b.seats - a.seats);
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
/**
 * Chess online: you are matched with a player of your own level. If nobody of your level is waiting,
 * you can play someone waiting at a lower level instead, wait at your own level's table, or play the
 * computer at your level.
 */
const CHESS_TABLES = 4;
const chessCodes = (level) => Array.from({ length: CHESS_TABLES }, (_, i) => tableCode(`chess-${level}`, i + 1));
async function chessOnline() {
  let cancelled = false;
  const mine = myChessLevel(), myName_ = chessName(mine);
  const searching = (lead) => show(topBar(G), h('section', { class: 'panel' }, [
    h('h1', {}, [`Finding ${an(myName_)} player…`]),
    h('p', { class: 'lead' }, [lead]),
    h('div', { class: 'spinner', 'aria-hidden': 'true' }),
    btn('Back', () => { cancelled = true; room?.close(); room = null; intro(G); }),
  ]));
  searching(`Your level: ${myName_}. Looking for someone at the same level.`);
  const open = (list) => list.filter(t => !t.locked && t.seats < 1);
  let same = [];
  try { same = open(await peekTables(chessCodes(mine))); } catch { /* offline: handled below */ }
  if (cancelled) return;
  for (const t of same) if (await joinGame(t.code, myName(), true) === 'joined' || cancelled) return;
  // nobody at your level: who is waiting below it?
  searching(`No ${myName_} player is waiting. Looking at the levels below yours…`);
  const lower = CHESS_LEVELS.slice(0, CHESS_LEVELS.indexOf(mine)).reverse();
  let below = [];
  try { below = open(await peekTables(lower.flatMap(chessCodes))); } catch { /* none */ }
  if (cancelled) return;
  const levelOfCode = (code) => /^public-chess-([a-z]+)-\d+$/.exec(code)?.[1];
  below.sort((a, b) => CHESS_LEVELS.indexOf(levelOfCode(b.code)) - CHESS_LEVELS.indexOf(levelOfCode(a.code)));
  const home = homeCountry();
  const offers = below.slice(0, 3).map((t) => {
    const lv = levelOfCode(t.code);
    return btn(`♟️ Play ${an(chessName(lv))} player${t.country ? ` · ${t.country === home ? 'from your country' : t.country}` : ''}`, async () => {
      if (await joinGame(t.code, myName()) !== 'joined') chessOnline();
    }, 'primary');
  });
  show(topBar(G), h('section', { class: 'panel' }, [
    h('h1', {}, [`No ${myName_} player online right now`]),
    h('p', { class: 'lead' }, [offers.length
      ? `These players are waiting at a lower level. Beating them won't raise your level, but it's a real game.`
      : `Nobody else is waiting for chess at the moment.`]),
    ...offers,
    btn(`⏳ Wait for ${an(myName_)} player`, () => hostChessTable(), offers.length ? '' : 'primary'),
    btn(`🤖 Play the computer at ${myName_} level`, () => { chosenRating = mine; solo(2); }),
    btn('Back', () => intro(G)),
  ]));
}
/** Sit at a free table of your own level and wait; a computer of your level plays you if nobody comes. */
async function hostChessTable() {
  const codes = chessCodes(myChessLevel());
  for (const code of codes) {
    try {
      await openRoom(code, { onChange: () => paintPublic?.() });
      chosenRating = myChessLevel();
      publicTable(2);
      return;
    } catch (e) {
      room?.close(); room = null;
      if (e?.type !== 'unavailable-id') break;
      if (await joinGame(code, myName(), true) === 'joined') return;
    }
  }
  message('No connection right now', 'You can still play chess with the computer, and try online again later.', btn('Play with the computer', () => solo(2), 'primary'), btn('Back', () => intro(G)));
}
/** The computer's level when it fills a seat at your own table online. */
let chosenRating = null;
let paintPublic = null;
/** Which way of playing this game was chosen (Ludo: normal or score). */
let chosenStyle = null;
const houseRules = Object.fromEntries((params.get('rules') || '').split(',').filter(Boolean).map(k => [k, true]));
const styleOpts = () => ({ ...(chosenStyle ? { style: chosenStyle } : {}), ...(Object.keys(houseRules).length ? { rules: houseRules } : {}), ...((chosenRating || params.get('rating')) ? { rating: chosenRating || params.get('rating') } : {}), ...(/^\d+(\+\d+)?$/.test(params.get('clock') || '') ? { clock: params.get('clock') } : {}) });
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
    const left = Math.max(0, Math.ceil((opened + publicWait() - Date.now()) / 1000));
    const humans = lobbyPlayers();
    // seats fill one by one, so the table is full by the time the wait is over; real players come first
    // chess: the computer sits down only when the wait is over, so a player of your level can still find the seat
    const due = G.slug === 'chess' ? (Date.now() - opened >= publicWait() ? total - humans.length : 0) : Math.min(total - humans.length, Math.floor(((Date.now() - opened) / publicWait()) * (total - 0.2)));
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
const guestState = { players: [], me: -1, code: '', name: '', started: false, result: false };
const TOKEN = 'chitplay.table.token';
async function joinGame(code, name, quiet = false) {
  let token = null;
  try { token = sessionStorage.getItem(TOKEN); } catch {}
  if (!token) { token = newToken(); try { sessionStorage.setItem(TOKEN, token); } catch {} }
  const link = new NearbyGuest({ onMessage: guestMessage, onClose: guestClosed });
  try {
    const hello = await link.join(code, name, token, { look: myLook(), ...(G?.slug === 'chess' ? { level: myChessLevel() } : {}) });
    guestState.hostLevel = /^public-chess-([a-z]+)-\d+$/.exec(code)?.[1] || '';
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
  show(topBar(G), h('section', { class: 'panel lobby' }, [
    h('h1', {}, [say.youreIn]),
    G ? h('div', { class: 'lobby__game' }, [
      h('span', { class: 'lobby__icon', 'aria-hidden': 'true' }, [G.icon]),
      h('div', {}, [h('small', {}, [say.nextGame]), h('strong', {}, [G.name])]),
    ]) : null,
    h('p', { class: 'lead' }, [Number.isFinite(m.startsIn) ? `Starting in ${Math.max(0, m.startsIn | 0)} seconds…` : say.waitHost]),
    names.length ? h('ol', { class: 'names joined' }, names.map((n, i) => h('li', {}, [i ? n : `${n} (host)`]))) : null,
    G ? btn(`📖 ${say.howTo}`, () => openRules(G)) : null,
    h('a', { class: 'btn', href: '../', onclick: leaveAll }, [say.leave]),
  ]));
}
/** Messages are handled one at a time: moving to another game loads its rules before anything else lands. */
let guestChain = Promise.resolve();
function guestMessage(m) {
  guestChain = guestChain.then(() => onGuestMessage(m)).catch(e => console.warn('[table] guest message', e));
}
/** The host moved the room to another game (or back to the lobby): follow along. */
async function guestFollow(m) {
  const next = gameBySlug(m.game);
  if (next && !next.video && next !== G) {
    await loadGame(next);
    chosenStyle = next.modes?.[0]?.[0] || null;
    previewBoard();
    chalkSlate();
    world?.story?.emojiPop?.(next.icon, `Next game: ${next.name}`);
    await howToFirstTime(next);
  }
  if (guestState.started) { guestState.started = false; guestState.result = false; recorded = false; seriesDone = false; setStatus(null, []); }
}
async function onGuestMessage(m) {
  if (m.t === 'offer') {
    if (!guest || !guestState.started || !guestState.result || typeof m.id !== 'string' || m.id.length > 64) return;
    const request = normalizeOfferRequest(m, { currentGame: G, gameBySlug, playerCount: guestState.players.length });
    if (!request) {
      guest.send({ t: 'offerReply', id: m.id, accept: false });
      return;
    }
    incomingOfferId = m.id;
    showOfferPrompt({ kind: request.kind, game: request.game, fromName: guestState.players[0]?.name }, accept => {
      incomingOfferId = null;
      guest?.send({ t: 'offerReply', id: m.id, accept });
    });
    return;
  }
  if (m.t === 'offerResult') {
    if (m.id === sentOfferId) sentOfferId = null;
    else if (m.id === incomingOfferId) {
      incomingOfferId = null;
      document.querySelector('.offer-sheet')?.remove();
    } else return;
    setPostgameOfferNote(m.status === 'accepted' ? '' : m.status === 'expired' ? say.offerExpired : say.offerDeclined, m.status === 'accepted' ? 'idle' : 'declined');
    return;
  }
  if (m.t === 'lobby') {
    if (!guest) return;   // the welcome while joining: joinGame shows the lobby itself
    await guestFollow(m);
    guestLobby(m);
    return;
  }
  if (m.t === 'sit') {
    if (!Array.isArray(m.players)) return;
    document.querySelector('.sheet')?.remove();
    postgameOfferNote = null;
    sentOfferId = null;
    incomingOfferId = null;
    guestState.players = m.players.slice(0, 12).map((p, i) => ({ name: String(p?.name || `Player ${i + 1}`).slice(0, 20), look: p?.look || null }));
    guestState.started = true;
    guestState.result = false;
    recorded = false; seriesDone = false;
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
    guestState.result = !!m.result;
    react(m.events, players);
    if (m.result) celebrateGuest(m.result, players);
    landThenShow(m.events, players, me, () => present(m.view, ctx, players, (move) => { app.querySelectorAll('.panel button').forEach((b) => { b.disabled = true; }); guest?.send({ t: 'move', move }); }, m.result || null));
  }
}
function celebrateGuest(result, players) {
  endSound(result.winners, Number.isInteger(shown?.ctx?.me) && shown.ctx.me >= 0 ? [shown.ctx.me] : []);
  cheerTable(result.winners, players);
}
function guestClosed(reason) {
  const again = { code: guestState.code, name: guestState.name };
  const started = guestState.started;
  guest = null;
  if (reason === 'lost' && started) { reconnect(again, 6); return; }
  const why = { 'host-left': 'The host closed the game.', kicked: 'The host removed you from the game.', started: 'That game had already started.' }[reason] || 'Lost the connection to the host’s phone.';
  guestState.started = false;
  guestState.result = false;
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
function joinForm(code = '', auto = false) {
  const codeIn = h('input', { value: code, inputmode: 'numeric', maxlength: '7', autocomplete: 'off', 'aria-label': 'Room code', placeholder: '6-digit code' });
  const nameIn = h('input', { value: myName(), maxlength: '14', 'aria-label': 'Your name', placeholder: 'Your name' });
  const err = h('p', { class: 'err', role: 'alert' });
  const go = btn('Join', async () => {
    const c = codeIn.value.replace(/\D/g, '');
    const n = cleanName(nameIn.value);
    if (!isCode(c)) { err.textContent = 'Type the 6-digit code from the host’s phone.'; return; }
    if (!n) { err.textContent = 'Type your name.'; return; }
    go.disabled = true; go.textContent = 'Joining…'; err.textContent = '';
    try { await joinGame(c, n); } catch (e) {
      // no table with that code: it may be a party's code, so join the party instead
      try { const [t] = await peekTables([`party-${c}`], 3000); if (t) { joinParty(c); location.href = '../'; return; } } catch {}
      err.textContent = netError(e); go.disabled = false; go.textContent = 'Join';
    }
  }, 'primary');
  show(topBar(G), h('section', { class: 'panel' }, [
    h('h1', {}, ['Join a friend’s game']),
    h('p', { class: 'lead' }, ['The host taps Play with friends and gets a code. Type it here.']),
    h('label', { class: 'opt' }, [h('span', {}, ['Code']), codeIn]),
    h('label', { class: 'opt' }, [h('span', {}, ['Your name']), nameIn]),
    err, go,
  ]));
  // sent here by a party: join straight away, no tap needed
  if (auto && isCode(code)) setTimeout(() => go.click(), 250);
}

function leaveAll() {
  audioManager.musicStop(0.4);
  paused = false;
  clearPendingOffer();
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
  applyTheme(game);
  refreshBest();
}
const ROOM_GAMES_NEED_3D = new Set(ALL_GAMES.filter(g => g.kind !== 'Party' && !g.video).map(g => g.slug));
/** The TV games have their own screen and controls; the room and the words are shared. */
async function startTv(game, extra) {
  const { runTv } = await import(`./tv.js${V}`);
  G = game;
  applyTheme(game);
  refreshBest();
  return runTv({ game, world, h, btn, show, topBar, say, LANG, myName, myLook, localName, localLook, leaveAll, liveScore, music: on => (on ? audioManager.musicStart('arcade') : audioManager.musicStop()), audio: n => audioManager.play(n), haptic: k => audioManager.haptic(k), liveBest, refreshBest: () => { refreshBest(); paintStatus(); }, emojis: myEmojis, join: code => joinGame(code, myName(), true), ...extra });
}

async function main() {
  const slug = params.get('game');
  const join = (params.get('join') || '').replace(/\D/g, '');
  const game = gameBySlug(slug);
  if (!game && !isCode(join)) { location.replace('../'); return; }
  G = game;
  applyTheme(game);
  // the party button: a party follows its host from game to game
  try { mountParty({ root: '../', game: game?.slug || null, place: 'play' }); } catch (e) { console.warn('[party]', e); }
  // in a party and opened a game by hand (not sent here by the party): offer to play it together
  if (game && !params.get('party') && !isCode(join) && inParty()) offerParty(game.slug).catch(() => {});
  const w = await loadWorld();
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
  if (isCode(join)) { joinForm(join, params.get('auto') === '1'); return; }
  onPopup((k) => audioManager.play(k || 'reveal'));
  startReminder(LANG);
  if (game.video) {
    G = game;
    document.title = `${game.name}: Play Free | ChitPlay`;
    const n = Math.min(game.max, Math.max(game.min, Number(params.get('n')) || game.seats));
    const tvMode = params.get('mode') || 'play';
    // a party is waiting at this table: its lead opens the room at once (the rules stay in the menu)
    if (tvMode !== 'watch' && params.get('party') !== '1') await howToFirstTime(game);
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
  if (mode && mode !== 'watch' && params.get('party') !== '1') await howToFirstTime(game);
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
