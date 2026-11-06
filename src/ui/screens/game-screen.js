import { el, clear } from '../../utils/dom.js';
import { GAME_PHASES } from '../../app/config.js?v=20261107-cast';
import { settingsStore } from '../../persistence/settings-store.js?v=20261107-cast';
import { profile, BADGES } from '../../persistence/profile-store.js?v=20261107-cast';
import { audioManager } from '../../audio/audio-manager.js';
import { loadWorld } from '../../world/world-loader.js?v=20261107-cast';
import { COUNTRIES, COUNTRY_ORDER, detectCountryInfo, localize, GAME_SLUGS, GAME_AKA, GAME_NAME_EN, GAME_ICON, ROLE_LATIN } from '../../world/countries.js?v=20261107-cast';
import { Dialogue, loadPack, CHAT_LANGUAGES } from '../../world/dialogue.js?v=20261107-cast';
import { Match, CHEAT_PENALTY } from '../../world/match.js?v=20261107-cast';
import { voiceBox } from '../../world/voice.js?v=20261107-cast';
import { NearbyHost, NearbyGuest, nearbyError, isCode, newToken } from '../../net/nearby.js?v=20261107-cast';
import { cleanName, pickOpponents } from '../../world/names.js?v=20261107-cast';
import {
  PRESETS, AGES, HAIR_STYLES, OUTFITS, HEADWEAR, GLASSES, FACIAL, SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTH_COLORS, PANTS_COLORS,
  lookOf, cleanLook, randomLook, portraitSvg,
} from '../../world/character-looks.js?v=20261107-cast';
import { nextCaughtScene, nextCloseCall } from '../../world/cheat-lines.js?v=20261107-cast';

/**
 * CHITPLAY: the whole game. Pick a game, then four people play a full match:
 * toss, pick, peek, bluff, investigate, react. A human player opens their chit,
 * may try to cheat, and taps the player they suspect when it's their turn to guess.
 */

const HUMAN_SEAT = 3;
const SHIRTS = ['#d4a017', '#e91e63', '#2196f3', '#43a047'];
const CANCEL = Symbol('cancel');
const ROUND_OPTIONS = [3, 5, 7, 10, 20];
const DEFAULT_ROUNDS = 7;
const TOSS_WAIT_SECONDS = 5;
const CLOSE_CALL_CHANCE = 0.35;   // an unnoticed peek sometimes still gets an "are you looking at my chit?"
// a restart starts a new screen; this tells it to go straight into the match
let pendingStart = null;

/** Fun forfeits for last place, for real people in a real room: all harmless, any age. */
const FORFEITS = [
  'sing one line of your favourite old song', 'do your best impression of a strict teacher', 'tell the most embarrassing thing from your school days',
  'speak like a news anchor until the next match ends', 'make everyone laugh in 20 seconds', 'do ten sit-ups while saying the alphabet',
  'walk like a penguin across the room', 'say something nice about each player', 'dance for 15 seconds with no music',
  'act out your favourite film scene', 'bring everyone a glass of water', 'name five of your old classmates in 10 seconds',
  'do your best villain laugh', 'clap only with your eyes closed for the next round', 'tell a joke, even a very bad one',
  'hold your ears and do five squats', 'recite a school poem you still remember', 'tell the story of your first best friend',
  'talk without using the word "no" for the next five minutes', 'draw a portrait of the winner in 30 seconds', 'copy the winner’s voice for one minute',
  'say the 7 times table quickly', 'pretend to be a cricket commentator for a minute', 'hum a tune until someone guesses it',
];


const UI = {
  en: {
    roundOf: 'Round {n} / {m}', aka: 'Also called', howto: '📖 How to play', resumed: '👋 Welcome back! Carrying on with round {n}', loading: 'Loading the 3D room…', you: 'You', play: '▶ Play', playSub: 'Take your seat at the table',
    watch: '👀 Just Watch', watchSub: 'Four computer players play on their own', rounds: 'Rounds',
    chit: 'Your chit has arrived!', chitTap: 'Tap to open it, don’t show anyone 🤫', youAre: 'You are the {role}!', close: 'Tap to close',
    accuse: '{icon} You are the {role}! Who is the {thief}? Tap a player', second: 'One more chance! Pick another player',
    cheat: '🤫 Cheat', cheatSub: 'Peek at a chit: 70% nobody notices', peekResult: 'Psst… {name} is the {role} {emoji}. Not the {thief}!',
    aiPeeked: '🤫 {name} sneaked a look at {other}’s chit!', caught: 'Caught! −{n} 😬', caughtYou: 'Caught! −{n} 😬 You saw nothing. Choose from all {c}',
    safe: 'Nobody noticed 😏',
    nightClear: '🌙 Night check: {name} is innocent', nightThief: '🌙 Night check: {name} is the {thief}! 😱',
    over: 'Match over!', won: '{name} wins! 🏆', youWon: 'You win! 🎉', again: '🔁 Play again', againSub: 'Same game, new match',
    change: '🎮 Change game', changeSub: 'Swipe to another game',
    sharpEye: '🕵️ Sharp Eye', sharpEyeSub: '{n} catches', escape: '🦊 Escape Artist', escapeSub: 'got away {n}×',
    share: '📤 Share', shareSub: 'Challenge a friend', copied: 'Link copied! 📋',
    tagline: 'Four paper chits. One thief. Just like the old days.',
    indoorTitle: '🏠 Indoor Games', indoorSub: 'For school, home, or anywhere with four people. ⭐ keeps your games at the front.',
    pinned: '⭐ Pinned', yourGame: '📍 Your country', pinAdd: 'Pin this game', pinRemove: 'Unpin this game',
    rankLine: '{icon} {title} · {pts} points{streak}', streak: ' · 🔥 {n}-day streak',
    tossTitle: '🎲 Toss the chits!', tossSub: 'Or someone else will in {n}s', tossSubGuest: 'First to tap throws them, {n}s left', tossing: '{name} tossed the chits',
    rejoinBtn: '🔁 Rejoin your game', rejoinSub: 'Back to the game you left · code {code}',
    nearby: '📶 Nearby Play', nearbySub: 'Friends on their own phones, up to 4 players',
    invite: '📤 Share invite link', inviteSub: 'WhatsApp, SMS, anywhere', inviteText: 'Join my CHITPLAY game! Code {code}', qrLabel: 'QR code to join this game',
    reconnecting: '📶 Reconnecting…', reconnectSub: 'Getting you back into the game. Keep this page open.',
    backNext: 'You’re back! 🎉 You play again from the next round', rejoined: '{name} is back 🎉 Plays from the next round', rejoinFail: 'Couldn’t get back into that game 😕',
    host: '🏠 Host a game', hostSub: '{game} · {n} rounds', join: '🔗 Join a game', joinSub: 'Scan the QR code or enter the 6-digit code',
    yourName: 'Your name', hostName: 'Host', back: '‹ Back', connecting: 'Connecting…', codeIs: 'Game code',
    codeHelp: 'Friends scan this, open the invite link, or type the code in 📶 Nearby Play → 🔗 Join a game',
    waiting: '⏳ Waiting for a friend…', bot: '🤖 Computer player', youHost: '(you, host)',
    startN: '▶ Start with {n} players', startNeedOne: 'At least one friend has to join', cancel: '✕ Close room',
    enterCode: '6-digit code', joinBtn: '🔗 Join', joined: '✅ Joined {host}’s game', waitStart: 'Waiting for the host to start…',
    scanQr: '📷 Scan QR code', scanHint: 'Point the camera at the code on your friend’s phone', scanPhoto: '📷 Take a photo of the QR code',
    scanNoCode: 'No game code in that picture. Try again, closer and steady.', scanNoCamera: 'The camera didn’t open here. Take a photo of the code instead.', scanCancel: '✕ Stop scanning',
    hostLeft: 'The host closed the game 👋', lostConn: 'Connection lost 📶', left: '{name} left, a computer player takes over',
    choosing: '⏳ {name} is choosing…', waitHostAgain: 'Waiting for the host to start the next match…',
    againNearby: 'Same friends, new match', leave: '🚪 Leave', leaveSub: 'Back to the games', changeNearby: 'Closes this room',
    nearbyNote: 'Connecting needs internet for a moment; the game itself goes phone to phone.', points: 'points', noGl: '3D isn’t available on this device 😕',
    voiceOff: 'No voice for this language on this device, bubbles only',
    menuTitle: 'Game menu', pause: '⏸ Pause game', resume: '▶ Resume game', restart: '🔁 Restart match', quit: '🚪 Quit game', backToGame: '‹ Back to the game',
    paused: '⏸ Game paused', pausedHost: '⏸ The host paused the game', pausedSub: 'Everything waits right where it stopped.',
    localPts: 'Local', nearbyPts: 'Nearby', chatOn: 'Conversation on', chatOff: 'Conversation off',
    profile: 'Your profile', profileBtn: 'Your profile', gender: 'Gender', male: 'Male', female: 'Female', nameHelp: 'Letters only: no numbers or symbols.',
    character: 'Choose a character', custom: 'Make your own', age: 'Age', hair: 'Hair', hairColor: 'Hair colour', skin: 'Skin', eyes: 'Eyes', outfit: 'Clothes', color1: 'Main colour', color2: 'Second colour', pants: 'Bottoms', glasses: 'Glasses', facial: 'Facial hair', headwear: 'On the head', bindi: 'Bindi',
    score: 'Your score', matches: 'Matches', wins: 'Wins', totalPts: 'Points', best: 'Best', nextRank: '{pts} points to {title}', topRank: 'The highest rank there is!',
    badges: 'Badges', hall: 'Best matches on this device', noHall: 'Finish a match to get on this list.',
    resetScore: '🗑️ Reset score', resetSure: 'Tap again to erase your points, rank and badges', resetDone: 'Score reset',
    graphics: 'Graphics', gAuto: 'Auto (recommended)', gLow: 'Low (fastest)', gMedium: 'Medium', gHigh: 'High', gUltra: '4K (for strong devices)',
    done: '✓ Done', rankUp: '{icon} New rank: {title}!', newBadge: '{icon} Badge: {name}!', gained: '+{n} rank points', hallPlace: '🏅 #{n} in your best matches',
    forfeit: '🎲 Forfeit for {name}', forfeitLine: 'If you’re in the same room: {name} has to {text}.',
  },
};
// How each kind of line should sound
const EMOTION = {
  intro: 'excited', introReply: 'happy', deal: 'happy', waiting: 'neutral', banter: 'happy', pick: 'happy', peek: 'whisper',
  kingAnnounce: 'excited', askGuesser: 'happy', announce: 'excited', nervous: 'scared', outage: 'scared', restore: 'excited',
  night: 'whisper', victim: 'scared', saved: 'happy', notSaved: 'sad', thinking: 'sly', plead: 'scared',
  accuse: 'angry', accusedReply: 'scared', show: 'excited', guesserWin: 'excited', guesserLose: 'sad',
  thiefWin: 'excited', thiefLose: 'sad', royal: 'happy', nextRound: 'happy', winner: 'excited', loser: 'sad',
  cheatCaught: 'angry', cheatDeny: 'scared', cheatLaugh: 'excited', giggle: 'happy', tellNotice: 'sly', witness: 'whisper',
  checkThief: 'excited', checkClear: 'neutral', hint: 'sly', alibi: 'neutral', fine: 'happy', penalty: 'sad',
  steal: 'excited', missOnce: 'sad', secondTry: 'angry',
};
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

/** Share the game (native share sheet on phones, clipboard elsewhere). */
async function shareGame({ title, text, url }) {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return 'shared'; }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return 'copied'; } catch { /* clipboard blocked: try the old way */ }
  try {
    const ta = Object.assign(document.createElement('textarea'), { value: `${text} ${url}` });
    ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove();
    return ok ? 'copied' : 'failed';
  } catch { return 'failed'; }
}

/* ─── Saved match (survives an accidental refresh) ─────────── */
const SAVE_KEY = 'chitplay.match3d.v1';
const SAVE_MAX_AGE = 7 * 24 * 3600 * 1000;
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.v === 1 && COUNTRIES[s.country] && Match.isValidSnapshot(s.match)
      && Array.isArray(s.players) && s.players.length === 4 && Date.now() - s.at < SAVE_MAX_AGE) return s;
  } catch {}
  return null;
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }

/* Nearby Play: a friend's ticket back into the game after a dropped connection or a reload */
const REJOIN_KEY = 'chitplay.nearby.v1';
const REJOIN_MAX_AGE = 3 * 3600 * 1000;
const REJOIN_AFTER_DROP_MS = 120000;   // the page stayed open: keep trying for a while
const REJOIN_AFTER_LOAD_MS = 20000;    // a fresh page load may just be an old, finished game
function loadRejoin() {
  try {
    const s = JSON.parse(localStorage.getItem(REJOIN_KEY));
    if (s && isCode(s.code) && s.token && Date.now() - s.at < REJOIN_MAX_AGE) return s;
  } catch {}
  return null;
}
function saveRejoin(s) { try { localStorage.setItem(REJOIN_KEY, JSON.stringify({ ...s, at: Date.now() })); } catch {} }
function clearRejoin() { try { localStorage.removeItem(REJOIN_KEY); } catch {} }

/** ?join=123456 from an invite link or QR code */
function readUrlJoin() {
  try {
    const c = new URLSearchParams(location.search).get('join');
    return isCode(c) ? c : null;
  } catch { return null; }
}
function clearUrlJoin() {
  try {
    const url = new URL(location.href);
    if (!url.searchParams.has('join')) return;
    url.searchParams.delete('join');
    history.replaceState(null, '', url);
  } catch {}
}
function inviteUrl(code) {
  const url = new URL(location.href);
  url.search = `?join=${code}`;
  url.hash = '';
  return url.toString();
}

/** ?game=raja-rani-chor-police (or ?game=IN) and optional &lang=local|en */
function readUrlGame() {
  try {
    const q = new URLSearchParams(location.search);
    const g = (q.get('game') || '').trim();
    if (!g) return null;
    const id = COUNTRIES[g.toUpperCase()] ? g.toUpperCase() : Object.keys(GAME_SLUGS).find(k => GAME_SLUGS[k] === g.toLowerCase());
    if (!id) return null;
    const lang = q.get('lang');
    return { country: COUNTRIES[id], lang: lang === 'local' || lang === 'en' ? lang : null };
  } catch { return null; }
}
/** Keep the address bar shareable: ?game=<slug> for the chosen edition. */
function setUrlGame(c) {
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('game') === GAME_SLUGS[c.id]) return;
    url.searchParams.set('game', GAME_SLUGS[c.id]);
    history.replaceState(null, '', url);
  } catch {}
}

/** Country to open with: the device's own country, unless the player pinned one. */
function startingCountry() {
  // every visit opens on the game of the country the player is in (Cops and Robbers elsewhere)
  const detected = COUNTRIES[detectCountryInfo().id] || COUNTRIES.US;
  return { country: detected, detected, pinned: false };
}

export function GameScreen({ transition }) {
  let alive = true;
  let world = null;
  let tapHandler = null;

  /* Every game timer goes through here, so a pause really stops the match. */
  const tasks = new Set();
  let paused = false;
  const arm = (task) => {
    task.began = performance.now();
    task.timer = setTimeout(() => { tasks.delete(task); task.fn(); }, task.left);
  };
  function later(ms, fn) {
    const task = { fn, left: ms, began: 0, timer: 0 };
    tasks.add(task);
    if (!paused) arm(task);
    return task;
  }
  function cancelLater(task) {
    if (!task) return;
    clearTimeout(task.timer);
    tasks.delete(task);
  }
  function holdTimers(on) {
    if (on === paused) return;
    paused = on;
    tasks.forEach((task) => {
      if (on) { clearTimeout(task.timer); task.left = Math.max(0, task.left - (performance.now() - task.began)); } else arm(task);
    });
    world?.story?.setPaused(on);
    voiceBox.pause(on);
  }
  const sleep = (ms) => new Promise((resolve, reject) => {
    if (!alive) { reject(CANCEL); return; }
    later(ms, () => (alive ? resolve() : reject(CANCEL)));
  });
  // a wait that never rejects (safe to lose a Promise.race)
  const idle = (ms) => new Promise((resolve) => { later(ms, resolve); });
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const others = (...ex) => [0, 1, 2, 3].filter(i => !ex.includes(i));

  const start = startingCountry();
  let base = start.country;                 // the raw edition
  let pinned = start.pinned;
  const detected = start.detected;
  const mode = 'en';                        // menus, rules and voices are always English
  // the players' chat can be read in the player's own language (Latin letters); English by default
  let chatLang = CHAT_LANGUAGES.some(l => l.id === settingsStore.get('chatLang')) ? settingsStore.get('chatLang') : 'en';
  const chatPack = () => (chatLang === 'en' ? country.lang : chatLang);
  let country = localize(base, mode);       // the edition as shown in the current text mode
  const uiFor = () => UI.en;
  let ui = uiFor();
  let players = [];        // { name, gender, look, color, isHuman (this phone), remote (a friend's phone id) }
  let cast = null;         // who sits at the table before the match starts
  let match = null;
  let net = null;          // Nearby Play: { role: 'host', room } or { role: 'guest', room, seat }
  let guestTotals = [0, 0, 0, 0];
  const isHost = () => net?.role === 'host';
  const tell = (msg) => { if (isHost()) net.room.broadcast(msg); };
  const tellSeat = (seat, msg) => { const id = players[seat]?.remote; if (isHost() && id) net.room.send(id, msg); };
  // while one player decides, the other phones say who everybody is waiting for
  const noteOthers = (seat, text) => players.forEach((_, i) => { if (i !== seat) tellSeat(i, { t: 'note', text }); });
  // sounds go to every phone in a Nearby match
  const sfx = {
    play(n) { if (match) tell({ t: 'sfx', n }); audioManager.play(n); },
    fanStart() { tell({ t: 'fan', on: true }); audioManager.fanStart(); },
    fanStop() { tell({ t: 'fan', on: false }); audioManager.fanStop(); },
  };
  let talks = {};                           // one no-repeat memory per language, per match
  const roleNamesOf = (c) => ({
    king: c.roles.king.name, queen: c.roles.queen.name,
    det: c.roles.detective.name, thief: c.roles.thief.name,
    guesser: c.roles[c.rules.guesser].name,
  });
  // in the player's own language the roles keep this game's own names (Raja, Chor, Huángdì…)
  const latinNames = () => {
    const L = ROLE_LATIN[base.id];
    if (!L) return roleNamesOf(country);
    const slots = ['king', 'queen', 'detective', 'thief'];
    return { king: L[0], queen: L[1], det: L[2], thief: L[3], guesser: L[slots.indexOf(country.rules.guesser)] };
  };
  const namesFor = (pack) => (pack === country.lang ? roleNamesOf(country) : latinNames());
  const talkNow = () => { const p = chatPack(); return (talks[p] ||= new Dialogue(p, namesFor(p), country.lang)); };
  let onModeChange = null;                  // the start sheet re-renders itself on a switch

  /* ─── HUD ─────────────────────────────────────────────── */
  const roundEl = el('span', { className: 'game__round-text' }, ['CHITPLAY']);
  const roundPill = el('span', { className: 'game__round' }, [
    el('img', { className: 'game__logo', attrs: { src: 'assets/icon.svg', alt: '', width: '22', height: '22' } }),
    roundEl,
  ]);
  const scoreRow = el('div', { className: 'game__scores' });
  const prompt = el('div', { className: 'game__prompt', attrs: { 'aria-live': 'polite' } });
  const toast = el('div', { className: 'game__toast', attrs: { 'aria-live': 'polite' } });
  const sheet = el('div', { className: 'game__sheet' });
  const iconBtn = (label, text, onClick) => el('button', { className: 'game__exit', type: 'button', attrs: { 'aria-label': label }, onClick }, [text]);
  const overlay = el('div', { className: 'game__overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
  overlay.hidden = true;
  const exitBtn = iconBtn('Game menu', '✕', () => openMenu());
  exitBtn.hidden = true;
  const profileBtn = iconBtn(ui.profileBtn, '👤', () => openProfile());
  const chatOn = () => settingsStore.get('chatEnabled') !== false;
  const chatBtn = iconBtn('Toggle conversation', chatOn() ? '💬' : '🔕', () => {
    const next = !chatOn();
    settingsStore.set('chatEnabled', next);
    chatBtn.textContent = next ? '💬' : '🔕';
    showToast(next ? ui.chatOn : ui.chatOff, 1600);
    if (!next) { voiceBox.stop(); world?.story?.clearTalk(); }
  });
  chatBtn.title = ui.chatOn;
  const soundBtn = iconBtn('Toggle sound', settingsStore.get('soundEnabled') ? '🔊' : '🔇', () => {
    const next = !settingsStore.get('soundEnabled');
    settingsStore.set('soundEnabled', next);
    audioManager.setEnabled(next);
    if (next) { audioManager.unlock(); sfx.play('select'); }
    soundBtn.textContent = next ? '🔊' : '🔇';
  });
  const voiceOn = () => settingsStore.get('voiceEnabled') !== false;
  const voiceBtn = iconBtn('Toggle voices', voiceOn() ? '🗣️' : '🤐', () => {
    const next = !voiceOn();
    settingsStore.set('voiceEnabled', next);
    voiceBox.setEnabled(next);
    voiceBtn.textContent = next ? '🗣️' : '🤐';
  });
  voiceBox.setEnabled(voiceOn());

  /* ─── Mobile comfort: rotate to landscape, keep the screen awake, haptics ─── */
  const isTouch = window.matchMedia?.('(pointer: coarse)').matches;
  const isLandscape = () => window.matchMedia('(orientation: landscape)').matches;
  const rotateBtn = iconBtn('Rotate to landscape', '🔄', () => toggleLandscape());
  rotateBtn.classList.add('game__rotate');
  rotateBtn.hidden = !isTouch;
  async function toggleLandscape() {
    haptic(15);
    // window.screen: a local `screen` element below hides the global one in this function
    const orientation = window.screen.orientation;
    const fs = document.fullscreenElement;
    try {
      if (fs && orientation?.type?.startsWith('landscape')) {
        orientation.unlock?.();
        await document.exitFullscreen?.();
        return;
      }
      await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
      await orientation.lock('landscape');
    } catch {
      // iPhones (and some browsers) can't rotate for us: show a friendly nudge
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      if (!isLandscape()) showRotateHint(true);
    }
  }
  const rotateHint = el('div', { className: 'game__rotatehint', attrs: { 'aria-live': 'polite' } }, [
    el('span', { className: 'game__rotatehint-phone', attrs: { 'aria-hidden': 'true' } }, ['📱']),
    el('span', {}, ['Turn your phone sideways. If it stays upright, turn off rotation lock.']),
  ]);
  // shown by CSS only on phone-sized touch screens held upright
  const ROTATE_LABEL = 'Rotate for a bigger view';
  const rotatePill = el('div', { className: 'game__rotatepill' }, [
    el('button', { className: 'game__rotatepill-go', type: 'button', onClick: () => toggleLandscape() }, [
      el('span', { className: 'game__rotatehint-phone', attrs: { 'aria-hidden': 'true' } }, ['📱']), ROTATE_LABEL,
    ]),
    el('button', {
      className: 'game__rotatepill-close', type: 'button', attrs: { 'aria-label': 'Hide the rotate option' },
      onClick: () => {
        rotatePill.hidden = true;
        try { sessionStorage.setItem('chitplay.rotatePillHidden', '1'); } catch {}
      },
    }, ['✕']),
  ]);
  try { rotatePill.hidden = sessionStorage.getItem('chitplay.rotatePillHidden') === '1'; } catch {}
  function showRotateHint(on) {
    rotateHint.classList.toggle('game__rotatehint--show', !!on);
    clearTimeout(rotateHint._t);
    if (on) rotateHint._t = setTimeout(() => rotateHint.classList.remove('game__rotatehint--show'), 3800);
  }
  window.matchMedia('(orientation: landscape)').addEventListener?.('change', (e) => { if (e.matches) showRotateHint(false); });

  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch {}
  }
  // a friend's phone has no match of its own, only a room
  const onVisible = () => { if (document.visibilityState === 'visible' && (match || net) && alive) keepAwake(true); };
  document.addEventListener('visibilitychange', onVisible);

  function haptic(pattern) {
    if (settingsStore.get('hapticsEnabled') === false) return;
    // browsers refuse (and log an error) until the first tap, e.g. a match resumed after a refresh
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try { navigator.vibrate?.(pattern); } catch {}
  }


  const screen = el('div', { className: 'screen game', attrs: { 'aria-label': 'CHITPLAY' } }, [
    el('div', { className: 'game__top' }, [exitBtn, roundPill, el('div', { className: 'game__top-right' }, [rotateBtn, chatBtn, voiceBtn, soundBtn, profileBtn])]),
    scoreRow, prompt, toast, rotateHint, sheet, rotatePill, overlay,
  ]);
  screen.addEventListener('pointerdown', (e) => { if (tapHandler && e.target === screen) tapHandler(e); });

  function renderScores(gains = null) {
    clear(scoreRow);
    const totals = net?.role === 'guest' ? guestTotals : match?.totals;
    if (match) tell({ t: 'scores', totals: match.totals, gains });
    players.forEach((p, i) => {
      const gain = gains?.[i];
      scoreRow.appendChild(el('div', {
        className: `game__score${p.isHuman ? ' game__score--me' : ''}`,
        style: { '--chip': p.color },
      }, [
        el('span', { className: 'game__score-name' }, [p.isHuman ? `${p.name} ⭐` : p.name]),
        el('span', { className: 'game__score-pts' }, [String(totals?.[i] ?? 0)]),
        gain ? el('span', { className: `game__gain${gain < 0 ? ' game__gain--neg' : ''}` }, [gain > 0 ? `+${gain}` : String(gain)]) : null,
      ]));
    });
  }

  function setRound(text) {
    roundEl.textContent = text;
    if (match) tell({ t: 'round', text });
  }
  function showPrompt(text) {
    prompt.textContent = text || '';
    prompt.classList.toggle('game__prompt--show', !!text);
  }
  function showToast(text, ms = 2600) {
    toast.textContent = text;
    toast.classList.add('game__toast--show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('game__toast--show'), ms);
  }

  /* ─── Speech (never repeats; players are silent if a pool runs dry) ─── */
  // the browser's speech voice (the narrator borrows the deepest player voice)
  function voice(seat, parts, emotion) {
    tell({ t: 'voice', seat, text: parts.text, emotion });
    return voiceBox.speak(seat === 'narrator' ? 2 : seat, parts.text, emotion);
  }

  /* Who is this line said to? That decides where the camera goes. */
  const SAID_TO_GUESSER = new Set(['plead', 'nervous', 'accusedReply', 'alibi']);
  // rule-related clues still appear when the conversation is switched off
  const ESSENTIAL = new Set(['witness', 'hint', 'tellNotice', 'checkThief', 'checkClear']);
  let lastSpeaker = { seat: -1, at: 0 };
  function listenerFor(i, key, vars) {
    if (vars?.name) {
      const j = players.findIndex(p => p.name === vars.name);
      if (j >= 0 && j !== i) return j;
    }
    const g = match?.roles?.length ? match.guesser : -1;
    if (SAID_TO_GUESSER.has(key) && g >= 0 && g !== i) return g;
    if (Date.now() - lastSpeaker.at < 7000 && lastSpeaker.seat >= 0 && lastSpeaker.seat !== i) return lastSpeaker.seat;
    return null;
  }
  function cutTo(i, j, dur) {
    lastSpeaker = { seat: i, at: Date.now() };
    S().talkTo(i, j, dur);
  }

  /**
   * camera: 'cut' moves to the speaker, 'soft' only if the last cut has had time to land,
   * 'none' for people talking over each other.
   */
  function say(i, key, vars, { to, camera = 'soft' } = {}) {
    if (!chatOn() && !ESSENTIAL.has(key)) return { dur: 0, done: Promise.resolve() };
    const talk = talkNow();
    const text = talk.line(key, vars);
    if (!text) return { dur: 0, done: Promise.resolve() };
    const dur = S().say(i, text);
    if (camera === 'cut' || (camera === 'soft' && world.story.sinceCut > 1.1)) cutTo(i, to !== undefined ? to : listenerFor(i, key, vars), dur);
    return { dur, done: voice(i, talk.last, EMOTION[key] || 'neutral') };
  }
  async function sayWait(i, key, vars, extra = 250, opts = {}) {
    const { dur, done } = say(i, key, vars, { camera: 'cut', ...opts });
    if (!dur) return;
    // wait for the voice to finish, but never less than the bubble needs, and never forever
    await Promise.race([
      Promise.all([done, idle(dur * 0.6)]),
      idle(Math.max(dur * 0.75, 7000)),
    ]);
    if (!alive) throw CANCEL;
    await sleep(extra);
  }
  /** A line that was written for this exact moment (the cheat scenes). */
  async function speak(i, text, to, emotion, extra = 200) {
    if (!chatOn()) { await sleep(250); return; }
    const dur = S().say(i, text);
    cutTo(i, to, dur);
    const done = voice(i, { text }, emotion);
    await Promise.race([Promise.all([done, idle(dur * 0.8)]), idle(Math.max(dur, 7000))]);
    if (!alive) throw CANCEL;
    await sleep(extra);
  }
  async function narrate(key, vars, { parent = false, wait = 1800, always = false } = {}) {
    if (!chatOn() && !always) return;
    const talk = talkNow();
    const text = talk.line(key, vars);
    if (!text) return;
    S().narrate(parent ? `${country.parent}: ${text}` : text);
    // the narrator / parent voice (falls back to the deepest player voice, a little slower)
    voice('narrator', talk.last, parent ? 'sad' : 'whisper');
    await sleep(wait);
  }
  // In a Nearby match every 3D story call is replayed on the friends' phones too
  const LOCAL_ONLY = new Set(['actorAt', 'country', 'active', 'preview', 'setLook', 'portrait', 'setPaused', 'chitsOnMat', 'sinceCut', 'lookKeyOf', 'quality', 'graphics', 'setGraphics']);
  let mirror = null;
  let dark = null;   // 'power' or 'night' while the room is dark, so a returning phone matches it
  const S = () => {
    if (!isHost()) return world.story;
    return (mirror ||= new Proxy(world.story, {
      get(t, k) {
        const v = t[k];
        if (typeof v !== 'function' || LOCAL_ONLY.has(k)) return v;
        return (...a) => {
          if (k === 'begin') dark = null;
          if (k === 'power') dark = a[0] ? null : 'power';
          if (k === 'night') dark = a[0] ? 'night' : null;
          tell({ t: 'story', m: k, a: k === 'setCountry' ? [base.id] : a });
          return v.apply(t, a);
        };
      },
    }));
  };
  const act = (i, pose, emoji, mood) => {
    if (pose) S().pose(i, pose);
    if (emoji) S().emote(i, emoji, 2.2);
    if (mood) S().mood(i, mood, 2.5);
  };

  /* ─── Start sheet: swipe through the games, then play ─── */
  function chooseSetup() {
    return new Promise((resolve) => {
      // your pinned games first, then your own country's game
      const order = [...new Set([...profile.pins.filter(id => COUNTRIES[id]), detected.id, ...COUNTRY_ORDER])];
      setRound('CHITPLAY');
      clear(sheet);
      sheet.className = 'game__sheet game__sheet--show game__sheet--start';

      // 1) The game carousel: one big card per game, swipe (or ‹ ›) to the next
      const cards = new Map();
      const pinPainters = [];
      const track = el('div', { className: 'game__carousel', attrs: { role: 'listbox', 'aria-label': 'Choose a game', tabindex: '0' } },
        order.map((id) => {
          const g = COUNTRIES[id];
          const badge = el('span', { className: 'game__bigcard-badge' });
          const star = el('button', {
            className: 'game__star', type: 'button',
            onClick: (e) => {
              e.stopPropagation();
              profile.togglePin(id);
              haptic(10);
              paintPin();
            },
          });
          const paintPin = () => {
            const on = profile.isPinned(id);
            star.textContent = on ? '⭐' : '☆';
            star.classList.toggle('game__star--on', on);
            star.setAttribute('aria-label', on ? ui.pinRemove : ui.pinAdd);
            star.setAttribute('aria-pressed', String(on));
            badge.textContent = on ? ui.pinned : id === detected.id ? ui.yourGame : '';
            badge.hidden = !badge.textContent;
          };
          pinPainters.push(paintPin);
          const card = el('div', {
            className: 'game__bigcard',
            style: { '--accent': g.theme.wall[1], '--accent2': g.roles.king.color },
            attrs: { role: 'option', 'aria-label': GAME_NAME_EN[id], 'data-id': id, tabindex: '0' },
            onClick: () => { if (id !== base.id) centerOn(id, true); },
          }, [
            star,
            badge,
            el('span', { className: 'game__bigcard-icon', attrs: { 'aria-hidden': 'true' } }, [GAME_ICON[id]]),
            el('strong', { className: 'game__bigcard-name' }, [GAME_NAME_EN[id]]),
            el('span', { className: 'game__bigcard-roles' }, [(ROLE_LATIN[id] || []).join(' · ')]),
          ]);
          paintPin();
          cards.set(id, card);
          return card;
        }));
      const arrow = (dir, label) => el('button', {
        className: `game__arrow game__arrow--${dir < 0 ? 'prev' : 'next'}`, type: 'button',
        attrs: { 'aria-label': label }, onClick: () => step(dir),
      }, [dir < 0 ? '‹' : '›']);
      const dots = el('div', { className: 'game__dots', attrs: { 'aria-hidden': 'true' } }, order.map(id => el('span', { attrs: { 'data-id': id } })));
      const carousel = el('div', { className: 'game__carouselwrap' }, [arrow(-1, 'Previous game'), track, arrow(1, 'Next game')]);

      // 2) Everything about the chosen game (re-filled on every swipe)
      const details = el('div', { className: 'game__chosen' });

      // 3) Start buttons + options (built once)
      const opt = (label, sub, value, primary) => el('button', {
        className: `game__choice${primary ? ' game__choice--primary' : ''}`, type: 'button',
        onClick: () => {
          audioManager.unlock(); sfx.play('select'); haptic(15);
          // the game you choose moves to the front of your Indoor Games, with a star
          if (value !== 'rejoin') profile.pin(base.id);
          document.removeEventListener('keydown', onKey);
          sheet.className = 'game__sheet'; onModeChange = null; resolve(value);
        },
      }, [el('strong', {}, [label]), el('span', {}, [sub])]);
      const roundsNow = () => (ROUND_OPTIONS.includes(settingsStore.get('matchRounds')) ? settingsStore.get('matchRounds') : DEFAULT_ROUNDS);
      const rounds = el('div', { className: 'game__rounds' }, [
        el('span', {}, [ui.rounds]),
        ...ROUND_OPTIONS.map(n => el('button', {
          className: `game__pill${n === roundsNow() ? ' game__pill--on' : ''}`, type: 'button', attrs: { 'data-n': String(n) },
          onClick: () => {
            settingsStore.set('matchRounds', n);
            rounds.querySelectorAll('.game__pill').forEach(p => p.classList.toggle('game__pill--on', p.dataset.n === String(n)));
          },
        }, [String(n)])),
      ]);
      const chatSelect = el('select', {
        className: 'game__select', attrs: { 'aria-label': 'Chat language' },
        onChange: (e) => { chatLang = e.target.value; settingsStore.set('chatLang', chatLang); loadPack(chatPack()); },
      }, CHAT_LANGUAGES.map(l => el('option', { attrs: { value: l.id, ...(l.id === chatLang ? { selected: 'selected' } : {}) } }, [l.label])));
      const chat = el('label', { className: 'game__chatlang' }, [el('span', {}, ['🗣️ Chat']), chatSelect]);

      const rankBtn = el('button', { className: 'game__rankline', type: 'button', onClick: () => openProfile() });
      rankRefresh = () => {
        const rank = profile.rank;
        rankBtn.textContent = fmt(ui.rankLine, {
          icon: rank.icon, title: rank.title, pts: profile.all.points.toLocaleString('en'),
          streak: profile.streak > 1 ? fmt(ui.streak, { n: profile.streak }) : '',
        });
      };
      rankRefresh();
      const ticket = loadRejoin();
      sheet.append(
        ...(ticket?.left ? [el('div', { className: 'game__modes game__modes--one' }, [opt(ui.rejoinBtn, fmt(ui.rejoinSub, { code: ticket.code }), 'rejoin', true)])] : []),
        el('p', { className: 'game__tagline' }, [ui.tagline]),
        rankBtn,
        el('h2', { className: 'game__category' }, [ui.indoorTitle]),
        el('p', { className: 'game__category-sub' }, [ui.indoorSub]),
        carousel,
        dots,
        el('div', { className: 'game__modes' }, [opt(ui.play, ui.playSub, 'play', !ticket?.left), opt(ui.watch, ui.watchSub, 'watch', false)]),
        el('div', { className: 'game__modes game__modes--one' }, [opt(ui.nearby, ui.nearbySub, 'nearby', false)]),
        nameField(),
        el('div', { className: 'game__row' }, [rounds, chat]),
        details,
        el('button', { className: 'game__rotatebar', type: 'button', onClick: () => toggleLandscape() }, [
          el('span', { className: 'game__rotatehint-phone', attrs: { 'aria-hidden': 'true' } }, ['📱']), ROTATE_LABEL,
        ]),
      );

      function fillDetails() {
        clear(details);
        const roles = el('div', { className: 'game__roles' }, ['king', 'queen', 'detective', 'thief'].map((slot, i) => {
          const r = country.roles[slot];
          const own = ROLE_LATIN[base.id]?.[i] || r.name;
          const meaning = own.toLowerCase() === r.name.toLowerCase() ? null : r.name;
          return el('span', { className: 'game__role', style: { '--chip': r.color } }, [
            `${r.emoji} ${own}`, meaning ? el('em', {}, [meaning]) : null,
            el('small', {}, [slot === 'thief' ? '0 / ?' : String(r.points)]),
          ]);
        }));
        details.append(
          el('h2', { className: 'game__title sr-only' }, [country.game]),
          roles,
          el('details', { className: 'game__about' }, [
            el('summary', {}, [ui.howto || '📖 How to play']),
            el('p', { className: 'game__sub' }, [country.ruleText]),
            el('p', { className: 'game__aka' }, [
              `${(GAME_AKA[base.id] || []).slice(0, 5).join(' · ')} · `,
              el('a', { className: 'game__howto', attrs: { href: `games/${GAME_SLUGS[base.id]}/` } }, ['→']),
            ]),
            seoIntro,
          ]),
          // always visible, so visitors and ad-network reviewers can find these pages
          el('nav', { className: 'game__legal', attrs: { 'aria-label': 'About ChitPlay' } }, [
            ['about/', 'About'], ['contact/', 'Contact'], ['privacy/', 'Privacy'], ['terms/', 'Terms'],
          ].map(([href, label]) => el('a', { attrs: { href } }, [label]))),
        );
      }

      function select(id) {
        base = COUNTRIES[id];
        country = localize(base, mode);
        ui = uiFor();
        voiceBox.setLanguages(country.voice);
        // the start sheet shows instantly; the 3D room catches up when it's loaded
        world?.story?.setCountry(country, { soon: true });
        previewTable();
        // a plain visit keeps its clean / address: analytics counts a rewrite as a second page view
        if (base.id !== detected.id || new URLSearchParams(location.search).has('game')) {
          setUrlGame(base);
          document.title = `CHITPLAY: ${GAME_NAME_EN[base.id].replace(':', '')}`;
        }
        loadPack(chatPack());
        cards.forEach((c, cid) => { c.classList.toggle('game__bigcard--on', cid === id); c.setAttribute('aria-selected', String(cid === id)); });
        dots.querySelectorAll('span').forEach(d => d.classList.toggle('on', d.dataset.id === id));
        fillDetails();
      }

      function centerOn(id, smooth) {
        const card = cards.get(id);
        if (!card) return;
        // 'instant', not 'auto': the track's CSS is scroll-behavior:smooth, and a slow opening glide
        // would let the scroll handler below pick a card it merely passes through
        track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: smooth ? 'smooth' : 'instant' });
        if (!smooth) select(id);
      }
      function step(dir) {
        const i = order.indexOf(base.id);
        const next = order[(i + dir + order.length) % order.length];
        haptic(10);
        centerOn(next, true);
      }
      // whichever card ends up in the middle after a swipe becomes the game
      let scrollTimer = 0;
      track.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          const mid = track.scrollLeft + track.clientWidth / 2;
          let best = null, bestD = Infinity;
          cards.forEach((c, id) => { const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid); if (d < bestD) { bestD = d; best = id; } });
          if (best && best !== base.id) { sfx.play('select'); haptic(8); select(best); }
        }, 110);
      }, { passive: true });
      const onKey = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      };
      document.addEventListener('keydown', onKey);

      onModeChange = () => select(base.id);
      requestAnimationFrame(() => centerOn(base.id, false));
    });
  }

  /* ─── Human interactions ──────────────────────────────── */
  function humanPeek(slot) {
    return new Promise((resolve) => {
      const r = country.roles[slot];
      clear(sheet);
      sheet.className = 'game__sheet game__sheet--show';
      let opened = false;
      let auto;
      const card = el('button', { className: 'game__chit', type: 'button' }, [
        el('span', { className: 'game__chit-emoji' }, ['📜']),
        el('strong', {}, [ui.chit]),
        el('span', {}, [ui.chitTap]),
      ]);
      const close = () => {
        cancelLater(auto);
        // something newer took over the sheet (e.g. "Reconnecting…"): leave it alone
        if (card.isConnected) { sheet.className = 'game__sheet'; clear(sheet); }
        resolve();
      };
      card.addEventListener('click', () => {
        if (opened) { close(); return; }
        opened = true;
        haptic(25);
        sfx.play('chit-unfold');
        card.classList.add('game__chit--open');
        card.style.setProperty('--role', r.color);
        clear(card);
        const pts = slot === 'thief' ? `0 / ${country.rules.escape ?? country.roles[country.rules.guesser].points}` : String(r.points);
        card.append(
          el('span', { className: 'game__chit-emoji' }, [r.emoji]),
          el('strong', {}, [fmt(ui.youAre, { role: r.name })]),
          el('span', {}, [`${pts} ${ui.points}`]),
          el('em', {}, [ui.close]),
        );
        sfx.play('reveal');
        cancelLater(auto);
        auto = later(5000, close);
      });
      auto = later(9000, () => card.click());
      sheet.appendChild(card);
    });
  }

  /* The cheat, played out. Whatever happens, the thief's chit is never seen. */
  const cheatVars = (g, seat) => ({ name: players[g].name, other: players[seat].name });

  /** Noticed: the opponent says so, the cheater makes an excuse, somebody teases. No two scenes alike. */
  async function caughtScene(g, seat) {
    const [accusation, excuse, tease] = nextCaughtScene(chatPack(), cheatVars(g, seat));
    haptic([60, 40, 60]);
    act(seat, 'point', '💢', 'angry');
    await speak(seat, accusation, g, 'angry');
    act(g, 'deny', '💧', 'worried');
    await speak(g, excuse, seat, 'scared');
    const teaser = pickOne(others(g, seat));
    act(teaser, 'laugh', '😂');
    await speak(teaser, tease, g, 'excited', 100);
    sfx.play('wrong');
    const text = `${players[g].name}: ${fmt(ui.caught, { n: CHEAT_PENALTY })}`;
    showToast(players[g].isHuman ? fmt(ui.caughtYou, { n: CHEAT_PENALTY, c: match.suspects().length }) : text, 3600);
    tell({ t: 'toast', text, ms: 3000 });
    renderScores({ [g]: -CHEAT_PENALTY });
    others(g).forEach(i => S().pose(i, 'nervous'));
    S().pose(g, 'think');
  }

  /** Nearly noticed: "are you looking at my chit?" "No!" "Sorry, I thought you were." And right then, the peek works. */
  async function closeCallScene(g, seat) {
    const [question, denial, apology] = nextCloseCall(chatPack(), cheatVars(g, seat));
    act(seat, 'nervous', '🤨', 'worried');
    await speak(seat, question, g, 'sly');
    act(g, 'shrug', '😇', 'happy');
    await speak(g, denial, seat, 'neutral');
    act(seat, 'shrug', '😅', 'happy');
    await speak(seat, apology, g, 'happy', 100);
    S().look(seat, 'center');
  }

  async function playCheat(g) {
    const res = match.cheat();
    if (!res) return null;
    saveGame('inRound');   // refreshing can't undo a cheat (or its fine)
    sfx.play('select');
    S().sneak(g, res.seat);
    S().emote(g, '🤫', 2);
    await sleep(900);
    if (res.caught) await caughtScene(g, res.seat);
    else {
      if (Math.random() < CLOSE_CALL_CHANCE) await closeCallScene(g, res.seat);
      S().sneak(g, res.seat);
      await sleep(600);
      S().pose(g, 'think');
    }
    S().clearTalk();
    return res;
  }

  /** A computer guesser tries it too; the table sees the attempt, but never what it saw. */
  async function aiCheatScene(g) {
    const res = await playCheat(g);
    if (res?.peeked) {
      const text = fmt(ui.aiPeeked, { name: players[g].name, other: players[res.seat].name });
      showToast(text, 2800);
      tell({ t: 'toast', text, ms: 2800 });
      await sleep(900);
    }
  }
  const peekText = (res) => {
    const role = country.roles[res.slot];
    return fmt(ui.peekResult, { name: players[res.seat].name, role: role.name, emoji: role.emoji, thief: country.roles.thief.name });
  };

  function humanAccuse(allowed, text, { canCheat = false } = {}) {
    return new Promise((resolve) => {
      let pool = allowed.slice();
      let busy = false;
      const h = HUMAN_SEAT;
      const done = (idx) => {
        if (busy || !pool.includes(idx)) return;
        tapHandler = null;
        showPrompt('');
        noteOthers(h, '');
        sheet.className = 'game__sheet';
        clear(sheet);
        sfx.play('confirm');
        resolve(idx);
      };
      const renderChips = () => {
        clear(sheet);
        sheet.className = 'game__sheet game__sheet--show game__sheet--chips';
        pool.forEach(i => {
          sheet.appendChild(el('button', {
            className: 'game__suspect', type: 'button',
            style: { '--chip': players[i].color }, onClick: () => done(i),
          }, [players[i].name]));
        });
        if (canCheat && !match.cheated && pool.some(s => s !== match.thief)) {
          sheet.appendChild(el('button', {
            className: 'game__cheat', type: 'button',
            attrs: { title: ui.cheatSub },
            onClick: async () => {
              if (busy) return;
              busy = true;
              clear(sheet);
              sheet.className = 'game__sheet';
              showPrompt('');
              try {
                const res = await playCheat(h);
                if (res?.peeked) {
                  pool = pool.filter(s => s !== res.seat);
                  showToast(peekText(res), 4600);
                }
              } catch (e) { if (e !== CANCEL) console.error(e); }
              busy = false;
              if (!alive) return;
              renderChips();
              showPrompt(text);
            },
          }, [el('strong', {}, [ui.cheat]), el('span', {}, [ui.cheatSub])]));
        }
      };
      showPrompt(text);
      noteOthers(h, fmt(ui.choosing, { name: players[h].name }));
      S().clearTalk();
      tapHandler = (e) => done(world.story.actorAt(e.clientX, e.clientY));
      renderChips();
    });
  }

  /* ─── Nearby Play: the host waits for a friend's phone ───── */
  const pending = new Map();   // seat -> { type, allowed?, resolve, fallback, busy }
  function ask(seat, msg, type, { timeout, fallback, ...extra }) {
    return new Promise((resolve) => {
      const done = (v) => {
        if (pending.get(seat)?.resolve !== finish) return;
        pending.delete(seat);
        cancelLater(timer);
        resolve(v);
      };
      const finish = done;
      const timer = later(timeout, () => { tellSeat(seat, { t: 'cancelAsk' }); done(fallback()); });
      pending.set(seat, { type, resolve: finish, fallback, ...extra });
      tellSeat(seat, msg);
    });
  }
  // a friend opens their own chit on their own phone
  const remotePeek = (seat, slot) => ask(seat, { t: 'peek', slot }, 'peek', { timeout: 15000, fallback: () => null });

  function remoteAccuse(seat, allowed, text, { canCheat = false } = {}) {
    const fallback = () => match.aiGuess(match.suspects().filter(s => !allowed.includes(s) && s !== match.guesser));
    if (!players[seat].remote) return Promise.resolve(fallback());   // they dropped earlier this round
    const waitText = fmt(ui.choosing, { name: players[seat].name });
    showPrompt(waitText);
    noteOthers(seat, waitText);
    const cheatOk = canCheat && !match.cheated && allowed.some(s => s !== match.thief);
    return ask(seat, { t: 'accuse', allowed, text, canCheat: cheatOk }, 'accuse', {
      timeout: 90000, allowed: allowed.slice(), canCheat: cheatOk, fallback,
    }).then((idx) => { showPrompt(''); noteOthers(seat, ''); return idx; });
  }

  async function onGuestMessage(id, msg) {
    const seat = players.findIndex(p => p.remote === id);
    if (msg.t === 'toss' && seat >= 0 && tossWait) { tossWait(seat); return; }
    const job = pending.get(seat);
    if (seat < 0 || !job) return;
    if (msg.t === 'peeked' && job.type === 'peek') job.resolve(null);
    else if (msg.t === 'accused' && job.type === 'accuse' && !job.busy && job.allowed.includes(msg.idx)) {
      sfx.play('confirm');
      job.resolve(msg.idx);
    } else if (msg.t === 'cheat' && job.type === 'accuse' && job.canCheat && !job.busy) {
      job.busy = true;
      job.canCheat = false;
      let res = null;
      try { res = await playCheat(seat); } catch (e) { if (e !== CANCEL) console.error(e); }
      if (res) {
        tellSeat(seat, {
          t: 'cheatResult', seat: res.peeked ? res.seat : null,
          text: res.peeked ? peekText(res) : fmt(ui.caughtYou, { n: CHEAT_PENALTY, c: job.allowed.length }),
        });
        if (res.peeked) job.allowed = job.allowed.filter(s => s !== res.seat);
      }
      job.busy = false;
      tellSeat(seat, { t: 'cheatDone' });
    }
  }

  // a friend's phone dropped: a computer player takes their seat
  function onGuestLeave(id, name) {
    const seat = players.findIndex(p => p.remote === id || p.back === id);
    if (seat < 0) return;
    const wasPlaying = players[seat].remote === id;
    players[seat].remote = null;
    players[seat].back = null;
    const job = wasPlaying ? pending.get(seat) : null;
    if (job) job.resolve(job.fallback());
    const text = fmt(ui.left, { name: players[seat].name || name });
    showToast(text, 3200);
    tell({ t: 'toast', text, ms: 3200 });
  }

  // a friend's phone came back: bring it up to date; its seat returns at the next round,
  // because the computer player already holds this round's chit
  function onGuestBack(id, token) {
    const room = net.room;
    const seat = net.seats.findIndex(s => s.token === token);
    room.send(id, { t: 'lobby', rejoin: true, host: net.name, game: base.id, rounds: match?.rounds || 0, players: [] });
    if (seat < 0 || !match || !players[seat]) return;   // still starting: startMatch will include them
    players[seat].back = id;
    room.send(id, { t: 'start', rejoin: true, game: base.id, rounds: match.rounds, seat, players: seatList() });
    room.send(id, { t: 'story', m: 'begin', a: [] });
    if (dark) room.send(id, { t: 'story', m: dark, a: [dark === 'night'] });
    room.send(id, { t: 'round', text: roundEl.textContent });
    room.send(id, { t: 'scores', totals: match.totals });
    if (net.lastEnd) room.send(id, { t: 'end', ...net.lastEnd });
    const text = fmt(ui.rejoined, { name: players[seat].name });
    showToast(text, 3200);
    players.forEach((p, i) => { if (i !== seat) tellSeat(i, { t: 'toast', text, ms: 3200 }); });
  }

  /* ─── Nearby Play on a friend's phone: replay what the host sends ─── */
  function guestAccuse({ allowed, text, canCheat }) {
    let pool = allowed.slice();
    let locked = false;
    const pick = (idx) => {
      if (locked || !pool.includes(idx)) return;
      tapHandler = null; showPrompt(''); sheet.className = 'game__sheet'; clear(sheet);
      audioManager.play('confirm');
      net?.room.send({ t: 'accused', idx });
      guestAsk = null;
    };
    const render = () => {
      clear(sheet);
      sheet.className = 'game__sheet game__sheet--show game__sheet--chips';
      pool.forEach(i => sheet.appendChild(el('button', {
        className: 'game__suspect', type: 'button', style: { '--chip': players[i].color }, onClick: () => pick(i),
      }, [players[i].name])));
      if (canCheat) {
        sheet.appendChild(el('button', {
          className: 'game__cheat', type: 'button', attrs: { title: ui.cheatSub },
          onClick: () => { if (locked) return; locked = true; canCheat = false; audioManager.play('select'); net?.room.send({ t: 'cheat' }); render(); },
        }, [el('strong', {}, [ui.cheat]), el('span', {}, [ui.cheatSub])]));
      }
    };
    guestAsk = {
      cheatResult(m) { if (m.seat != null) pool = pool.filter(s => s !== m.seat); showToast(m.text, 4400); render(); },
      cheatDone() { locked = false; showPrompt(text); },
      cancel() { tapHandler = null; showPrompt(''); sheet.className = 'game__sheet'; clear(sheet); guestAsk = null; },
    };
    haptic([20, 30, 20]);
    showPrompt(text);
    tapHandler = (e) => pick(world.story.actorAt(e.clientX, e.clientY));
    render();
  }
  let guestAsk = null;
  let guestTossEnd = null;
  /** On a friend's phone: the first to tap throws the chits. */
  function guestToss({ seconds = TOSS_WAIT_SECONDS }) {
    const { stop } = tossButton(seconds, ui.tossSubGuest, () => { net?.room.send({ t: 'toss' }); });
    guestTossEnd = () => { stop(); guestTossEnd = null; };
  }

  function guestStart(m) {
    base = COUNTRIES[m.game] || COUNTRIES.US;
    country = localize(base, mode);
    ui = uiFor();
    net.seat = m.seat;
    players = m.players.map((p, i) => ({
      name: String(p.name).slice(0, 16), gender: p.gender === 'f' ? 'f' : 'm', look: cleanLook(p.look, p.look?.id),
      color: SHIRTS[i], isHuman: i === m.seat, remote: null,
    }));
    voiceBox.setCast(players.map(p => ({ gender: p.gender, age: p.look.age })));
    exitBtn.hidden = false;
    guestTotals = [0, 0, 0, 0];
    clear(sheet); sheet.className = 'game__sheet'; showPrompt('');
    voiceBox.setLanguages(country.voice);
    world.story.setCountry(country);
    renderScores();
    keepAwake(true);
  }

  function guestApply(m) {
    const st = world.story;
    switch (m.t) {
      case 'start': guestStart(m); if (m.rejoin) showToast(ui.backNext, 4200); break;
      case 'story': {
        if (m.m === 'setCountry') { st.setCountry(localize(COUNTRIES[m.a[0]] || base, mode)); break; }
        if (m.m === 'begin') {
          // the host's own labels say "(You)" about the host, so each phone writes its own
          st.begin(players.map(p => ({ name: p.name, look: p.look, color: p.color, isHuman: p.isHuman, label: p.isHuman ? `${p.name} (${ui.you})` : p.name })));
          break;
        }
        if (!chatOn() && (m.m === 'say' || m.m === 'talkTo')) break;
        if (typeof st[m.m] === 'function' && !LOCAL_ONLY.has(m.m)) st[m.m](...(Array.isArray(m.a) ? m.a : []));
        break;
      }
      case 'voice': if (chatOn()) voiceBox.speak(m.seat === 'narrator' ? 2 : m.seat, String(m.text || ''), m.emotion); break;
      case 'sfx': audioManager.play(m.n); break;
      case 'fan': if (m.on) audioManager.fanStart(); else audioManager.fanStop(); break;
      case 'round': roundEl.textContent = m.text; break;
      case 'scores': guestTotals = m.totals.slice(); renderScores(m.gains); break;
      case 'toast': showToast(m.text, m.ms || 2600); break;
      case 'note': showPrompt(String(m.text || '')); break;
      case 'peek': humanPeek(m.slot).then(() => net?.room.send({ t: 'peeked' })); haptic(25); break;
      case 'accuse': guestAccuse(m); break;
      case 'cheatResult': guestAsk?.cheatResult(m); break;
      case 'cheatDone': guestAsk?.cheatDone(); break;
      case 'cancelAsk': guestAsk?.cancel(); break;
      case 'tossAsk': guestToss(m); break;
      case 'tossEnd': guestTossEnd?.(); break;
      case 'pause': holdTimers(!!m.on); if (m.on) showPaused(); else closeOverlay(); break;
      case 'end': setRound(`🏆 ${ui.over}`); keepAwake(false); showEnd(m); break;
      default: break;
    }
  }

  /* ─── Nearby Play lobby ─────────────────────────────────── */
  const myName = () => profile.name;
  /** The player's name box: letters only, saved as they type, never left empty. */
  function nameInputEl() {
    const input = el('input', {
      className: 'game__input',
      attrs: { type: 'text', maxlength: '12', placeholder: ui.yourName, 'aria-label': ui.yourName, autocomplete: 'off', enterkeyhint: 'done', title: ui.nameHelp },
      value: myName(),
    });
    input.addEventListener('input', () => {
      const clean = cleanName(input.value);
      if (clean !== input.value) input.value = clean;
      if (profile.setName(clean)) previewTable();
    });
    input.addEventListener('blur', () => { if (!cleanName(input.value).trim()) input.value = myName(); else input.value = myName(); });
    return input;
  }
  const nameField = () => el('label', { className: 'game__field game__field--name' }, [el('span', {}, [ui.yourName]), nameInputEl()]);
  /**
   * Resolves 'host' (room open, Start pressed), 'guest' (joined; the host drives from here) or 'back'.
   * Opens on the normal menu, on the join page for an invite link (code) or on "Reconnecting…" (rejoin).
   */
  function nearbyFlow({ code: linkCode = null, rejoin = null } = {}) {
    return new Promise((resolve) => {
      const nameInput = nameInputEl();
      const nameNow = () => myName();
      const joinExtras = () => ({ gender: profile.gender, look: profile.look });
      const rounds = () => (ROUND_OPTIONS.includes(settingsStore.get('matchRounds')) ? settingsStore.get('matchRounds') : DEFAULT_ROUNDS);
      const big = (label, sub, onClick, primary) => el('button', {
        className: `game__choice${primary ? ' game__choice--primary' : ''}`, type: 'button', onClick,
      }, [el('strong', {}, [label]), el('span', {}, [sub])]);
      const backBtn = (fn) => el('button', { className: 'game__back', type: 'button', onClick: fn }, [ui.back]);
      const status = el('p', { className: 'game__netstatus', attrs: { 'aria-live': 'polite' } });
      const page = (...players) => {
        clear(sheet);
        sheet.className = 'game__sheet game__sheet--show game__sheet--start game__sheet--nearby';
        sheet.append(...players.filter(Boolean));
      };

      function menu() {
        status.textContent = '';
        page(
          el('h2', { className: 'game__title' }, [ui.nearby]),
          el('p', { className: 'game__sub' }, [ui.nearbySub]),
          el('label', { className: 'game__field' }, [el('span', {}, [ui.yourName]), nameInput]),
          big(ui.host, fmt(ui.hostSub, { game: GAME_NAME_EN[base.id], n: rounds() }), hostLobby, true),
          big(ui.join, ui.joinSub, () => joinPage()),
          el('p', { className: 'game__netnote' }, [ui.nearbyNote]),
          backBtn(() => resolve('back')),
        );
      }

      async function hostLobby() {
        const name = nameNow();
        const codeEl = el('div', { className: 'game__code', attrs: { 'aria-label': ui.codeIs } }, ['······']);
        const list = el('ol', { className: 'game__lobby' });
        const qrBox = el('div', { className: 'game__qr' });
        const inviteSub = el('span', {}, [ui.inviteSub]);
        const inviteBtn = el('button', { className: 'game__choice', type: 'button', onClick: async () => {
          const r = await shareGame({ title: 'ChitPlay', text: fmt(ui.inviteText, { code: room.code }), url: inviteUrl(room.code) });
          if (r === 'copied') inviteSub.textContent = ui.copied;
          else if (r === 'failed') inviteSub.textContent = inviteUrl(room.code);
        } }, [el('strong', {}, [ui.invite]), inviteSub]);
        inviteBtn.hidden = true;
        const startBtn = big(ui.startNeedOne, GAME_NAME_EN[base.id], () => {
          if (!room.guests.size) return;
          // each friend keeps this seat for the whole room, even if their phone drops
          net.seats = room.list.slice(0, 3).map(g => ({ token: g.token, name: g.name, gender: g.gender, look: g.look }));
          net.name = room.hostLabel;
          room.lock();
          // the host goes straight into the game, like everyone else
          clear(sheet);
          sheet.className = 'game__sheet';
          resolve('host');
        }, true);
        startBtn.disabled = true;
        const room = new NearbyHost({
          onChange: () => paint(),
          onMessage: (id, msg) => onGuestMessage(id, msg),
          onLeave: (id, gname) => onGuestLeave(id, gname),
          onRejoin: (id, token) => onGuestBack(id, token),
        });
        room.hostName = name;
        net = { role: 'host', room, name, seats: [], lastEnd: null };
        const paint = () => {
          if (room.locked) return;   // the lobby is over: never paint it on friends' phones mid-match
          clear(list);
          const g = room.list;
          list.append(el('li', { className: 'game__lobby-me' }, [`⭐ ${room.hostLabel} ${ui.youHost}`]));
          for (let i = 0; i < 3; i++) {
            list.append(el('li', { className: g[i] ? 'on' : '' }, [g[i] ? `✅ ${g[i].name}` : (i === g.length ? ui.waiting : ui.bot)]));
          }
          const n = g.length + 1;
          startBtn.disabled = g.length === 0;
          startBtn.querySelector('strong').textContent = g.length ? fmt(ui.startN, { n }) : ui.startNeedOne;
          if (g.length) haptic(15);
          room.broadcast({ t: 'lobby', host: room.hostLabel, game: base.id, rounds: rounds(), players: [room.hostLabel, ...g.map(x => x.name)] });
        };
        page(
          el('h2', { className: 'game__title' }, [ui.host]),
          el('p', { className: 'game__sub' }, [fmt(ui.hostSub, { game: GAME_NAME_EN[base.id], n: rounds() })]),
          el('p', { className: 'game__codelabel' }, [ui.codeIs]),
          codeEl,
          qrBox,
          el('p', { className: 'game__netnote' }, [ui.codeHelp]),
          inviteBtn,
          list,
          status,
          startBtn,
          backBtn(() => { room.close(); net = null; menu(); }),
        );
        paint();
        status.textContent = ui.connecting;
        try {
          const code = await room.open();
          if (net?.room !== room) return;   // Back was pressed while connecting
          codeEl.textContent = `${code.slice(0, 3)} ${code.slice(3)}`;
          status.textContent = '';
          inviteBtn.hidden = false;
          keepAwake(true);
          import('../../net/qr.js?v=20261107-cast').then(({ qrSvg }) => {
            const svg = qrSvg(inviteUrl(code), ui.qrLabel);
            if (svg) qrBox.append(svg);
          }).catch(() => {});   // no QR: the link and the code still work
        } catch (e) {
          if (net?.room !== room) return;
          room.close();
          net = null;
          status.textContent = nearbyError(e);
          codeEl.textContent = '✕';
        }
      }

      /** A friend's room: keeps playing what the host sends; a dropped connection tries to come back. */
      function guestRoom(code, token, name) {
        let started = false;
        return new NearbyGuest({
          onMessage: (m) => {
            if (m.t === 'lobby') { if (!started && !m.rejoin) waitingPaint(m); return; }
            if (m.t === 'start' && !started) { started = true; resolve('guest'); }
            guestQueue(m);
          },
          onClose: (reason) => {
            if (reason === 'lost') {
              tapHandler = null;
              showPrompt('');
              guestAsk = null;
              nearbyFlow({ rejoin: { code, token, name, ms: REJOIN_AFTER_DROP_MS } });
              return;
            }
            clearRejoin();
            showToast(reason === 'host-left' || reason === 'kicked' ? ui.hostLeft : ui.lostConn, 3500);
            setTimeout(() => { if (alive) transition(GAME_PHASES.HOME); }, 2600);
          },
        });
      }

      function rejoinPage({ code, token, name, ms = REJOIN_AFTER_LOAD_MS }) {
        const until = Date.now() + ms;
        let stop = false;
        const leave = () => {
          stop = true;
          clearRejoin();
          net?.room.close();
          net = null;
          transition(GAME_PHASES.HOME);
        };
        page(
          el('h2', { className: 'game__title' }, [ui.reconnecting]),
          el('p', { className: 'game__sub' }, [ui.reconnectSub]),
          el('button', { className: 'game__back', type: 'button', onClick: leave }, [ui.leave]),
        );
        keepAwake(true);
        (async () => {
          while (alive && !stop) {
            const room = guestRoom(code, token, name);
            net = { role: 'guest', room, seat: -1 };
            try {
              const lobby = await room.join(code, name, token, joinExtras());
              if (net?.room !== room) return;
              saveRejoin({ code, token, name });
              clearUrlJoin();
              if (!lobby.rejoin) waitingPaint(lobby);   // the match hadn't started yet: back in the lobby
              haptic([20, 40, 20]);
              return;
            } catch (e) {
              if (net?.room !== room) return;
              net = null;
              if (['started', 'full', 'kicked'].includes(e?.type) || Date.now() > until) {
                clearRejoin();
                showToast(ui.rejoinFail, 3500);
                setTimeout(() => { if (alive) transition(GAME_PHASES.HOME); }, 2600);
                return;
              }
              await idle(3000);
            }
          }
        })();
      }

      function joinPage(prefill = null) {
        nameNow();
        const codeInput = el('input', {
          className: 'game__input game__input--code',
          attrs: { type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '7', placeholder: '000 000', 'aria-label': ui.enterCode, autocomplete: 'one-time-code', enterkeyhint: 'go' },
          value: isCode(prefill) ? `${prefill.slice(0, 3)} ${prefill.slice(3)}` : '',
        });
        const go = big(ui.joinBtn, ui.joinSub, () => connect(), true);
        let busy = false;
        codeInput.addEventListener('input', () => {
          const d = codeInput.value.replace(/\D/g, '').slice(0, 6);
          codeInput.value = d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
          if (d.length === 6) connect();
        });
        codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(); });
        async function connect() {
          const code = codeInput.value.replace(/\D/g, '');
          if (busy || !isCode(code)) { if (!isCode(code)) status.textContent = ui.enterCode; return; }
          busy = true;
          go.disabled = true;
          status.textContent = ui.connecting;
          audioManager.unlock();
          const name = nameNow();
          const saved = loadRejoin();
          const token = saved?.code === code ? saved.token : newToken();
          const room = guestRoom(code, token, name);
          net = { role: 'guest', room, seat: -1 };   // set now, so Back or ✕ can cancel a join in progress
          try {
            const lobby = await room.join(code, name, token, joinExtras());
            if (net?.room !== room) return;
            saveRejoin({ code, token, name });
            clearUrlJoin();
            if (!lobby.rejoin) waitingPaint(lobby);
            keepAwake(true);
            haptic([20, 40, 20]);
          } catch (e) {
            if (net?.room !== room) return;
            net = null;
            status.textContent = nearbyError(e);
            busy = false;
            go.disabled = false;
          }
        }
        /* Scan the host's QR code: live camera where the browser allows it, a photo everywhere else */
        const scanBox = el('div', { className: 'game__scan' });
        let stopScan = null;
        let photoOnly = false;
        const useCode = (code) => {
          codeInput.value = `${code.slice(0, 3)} ${code.slice(3)}`;
          haptic([20, 30, 20]);
          closeScan();
          connect();
        };
        function closeScan() {
          stopScan?.();
          stopScan = null;
          clear(scanBox);
          scanBox.append(scanBtn);
        }
        const photoInput = el('input', { attrs: { type: 'file', accept: 'image/*', capture: 'environment', 'aria-label': ui.scanPhoto } });
        photoInput.hidden = true;
        photoInput.addEventListener('change', async () => {
          const file = photoInput.files?.[0];
          if (!file) return;
          status.textContent = ui.connecting;
          try {
            const { codeFromPhoto } = await import('../../net/qr-scan.js?v=20261107-cast');
            const code = await codeFromPhoto(file);
            if (code) { useCode(code); return; }
            status.textContent = ui.scanNoCode;
          } catch { status.textContent = ui.scanNoCode; }
          photoInput.value = '';
        });
        const scanBtn = el('button', {
          className: 'game__choice', type: 'button',
          onClick: async () => {
            const { canUseCamera, startCameraScan } = await import('../../net/qr-scan.js?v=20261107-cast');
            if (!canUseCamera() || photoOnly) { photoInput.click(); return; }
            const video = el('video', { className: 'game__scan-video', attrs: { playsinline: '', muted: '' } });
            clear(scanBox);
            scanBox.append(
              video,
              el('p', { className: 'game__netnote' }, [ui.scanHint]),
              el('button', { className: 'game__back', type: 'button', onClick: closeScan }, [ui.scanCancel]),
            );
            try {
              stopScan = await startCameraScan(video, useCode);
            } catch {
              closeScan();
              status.textContent = ui.scanNoCamera;
              scanBtn.querySelector('strong').textContent = ui.scanPhoto;
              photoOnly = true;
            }
          },
        }, [el('strong', {}, [ui.scanQr]), el('span', {}, [ui.scanHint])]);
        scanBox.append(scanBtn);
        page(
          el('h2', { className: 'game__title' }, [ui.join]),
          scanBox,
          photoInput,
          // an invite link skips the menu, so the name is asked here
          prefill ? el('label', { className: 'game__field' }, [el('span', {}, [ui.yourName]), nameInput]) : null,
          el('label', { className: 'game__field' }, [el('span', {}, [ui.enterCode]), codeInput]),
          status,
          go,
          backBtn(() => { stopScan?.(); net?.room.close(); net = null; clearUrlJoin(); menu(); }),
        );
        setTimeout(() => (prefill ? nameInput : codeInput).focus(), 60);
      }

      function waitingPaint(m) {
        const g = COUNTRIES[m.game] ? m.game : base.id;
        page(
          el('h2', { className: 'game__title' }, [fmt(ui.joined, { host: m.host })]),
          el('p', { className: 'game__sub' }, [`${GAME_NAME_EN[g]} · ${m.rounds} rounds`]),
          el('ol', { className: 'game__lobby' }, m.players.map((n, i) => el('li', { className: 'on' }, [`${i === 0 ? '⭐' : '✅'} ${n}`]))),
          el('p', { className: 'game__netstatus' }, [ui.waitStart]),
          backBtn(() => { net?.room.close(); net = null; clearRejoin(); menu(); }),
        );
        // the room behind the sheet shows the game the host picked
        if (g !== base.id) { base = COUNTRIES[g]; country = localize(base, mode); world?.story?.setCountry(country); previewTable(); }
      }

      if (rejoin) rejoinPage(rejoin);
      else if (linkCode) joinPage(linkCode);
      else menu();
    });
  }
  // the guest replays messages in order, once the 3D room is ready
  let guestChain = Promise.resolve();
  function guestQueue(m) {
    guestChain = guestChain.then(async () => {
      if (!world?.story) await ensureWorld();
      if (alive && net?.role === 'guest') guestApply(m);
    }).catch(onError);
  }

  /* ─── The toss: anyone may throw; after 5 seconds someone else does ─── */
  let tossWait = null;
  function tossButton(seconds, subText, onTap) {
    let left = seconds, tick = null, stopped = false;
    const sub = el('span', {}, [fmt(subText, { n: left })]);
    const btn = el('button', {
      className: 'game__toss', type: 'button',
      onClick: () => { haptic(25); sfx.play('select'); onTap(); },
    }, [el('strong', {}, [ui.tossTitle]), sub]);
    clear(sheet);
    sheet.className = 'game__sheet game__sheet--show game__sheet--chips';
    sheet.appendChild(btn);
    const step = () => {
      if (stopped) return;
      left -= 1;
      sub.textContent = fmt(subText, { n: Math.max(0, left) });
      if (left > 0) tick = later(1000, step);
    };
    tick = later(1000, step);
    return {
      stop() {
        stopped = true;
        cancelLater(tick);
        if (btn.isConnected) { clear(sheet); sheet.className = 'game__sheet'; }
      },
    };
  }
  /** Resolves with the seat that throws the chits. */
  function waitForToss() {
    return new Promise((resolve) => {
      const me = players.findIndex(p => p.isHuman);
      const remotes = players.filter(p => p.remote);
      if (me < 0 && !remotes.length) { later(1000, () => resolve(pickOne([0, 1, 2, 3]))); return; }
      let timer = null, button = null;
      const finish = (seat) => {
        if (!tossWait) return;
        tossWait = null;
        cancelLater(timer);
        button?.stop();
        tell({ t: 'tossEnd' });
        resolve(seat);
      };
      tossWait = finish;
      if (me >= 0) button = tossButton(TOSS_WAIT_SECONDS, ui.tossSub, () => finish(me));
      tell({ t: 'tossAsk', seconds: TOSS_WAIT_SECONDS });
      // nobody threw: a computer player does, or anyone at random if all four are people
      const computers = players.map((p, i) => (p.isHuman || p.remote ? -1 : i)).filter(i => i >= 0);
      timer = later(TOSS_WAIT_SECONDS * 1000, () => finish(pickOne(computers.length ? computers : [0, 1, 2, 3])));
    });
  }

  /* ─── One round ───────────────────────────────────────── */
  async function playRound(round, { resume = false } = {}) {
    const R = country.rules;
    // friends who came back during the last round get their seats again
    players.forEach((p) => { if (p.back) { p.remote = p.back; p.back = null; } });
    setRound(fmt(ui.roundOf, { n: round, m: match.rounds }));
    // after a refresh the round is replayed with the very same chits (no re-rolling roles)
    if (!resume) match.startRound();
    saveGame('inRound');
    const name = (i) => players[i].name;

    if (R.finalDouble && match.isFinal) {
      players.forEach((_, i) => S().emote(i, '✨', 2.5));
      await narrate('doubleRound', {}, { wait: 2200 });
    }

    // The chits wait in a pile until someone throws them
    S().gather();
    await sleep(650);
    const dealer = await waitForToss();
    S().deal(dealer);
    say(dealer, 'deal', {}, { to: null, camera: 'cut' });
    await sleep(1700);
    await sayWait(pickOne(others(dealer)), 'waiting', {}, 250, { to: dealer });
    if (Math.random() < 0.3) await sayWait(pickOne(others(dealer)), 'banter');
    S().clearTalk();
    await sleep(300);

    // Everyone picks and peeks (only some speak, so lines stay fresh)
    for (let n = 1; n <= 4; n++) {
      const i = (dealer + n) % 4;
      S().focus(i);
      S().pick(i);
      S().allLook(i);
      if (Math.random() < 0.55) say(i, 'pick', {}, { to: null, camera: 'none' });
      await sleep(1300);
      if (players[i].isHuman) await humanPeek(match.slotOf(i));
      else if (players[i].remote) await remotePeek(i, match.slotOf(i));
      else if (Math.random() < 0.6) {
        if (Math.random() < 0.4) S().emote(i, pickOne(['🤭', '😏', '😐', '🙄']), 1.6);
        await sayWait(i, 'peek', {}, 300, { to: null, camera: 'none' });
      } else await sleep(700);
      S().hold(i);
    }
    S().focus(null);
    S().clearTalk();
    await sleep(400);

    const g = match.guesser;
    const thief = match.thief;
    const guesserRole = country.roles[R.guesser];
    const local = players[g].isHuman;               // the guesser is on this phone
    const remote = !!players[g].remote;             // … or on a friend's phone
    const human = local || remote;
    let lean = null;          // a clue the computer guesser can lean on
    let forced = null;         // Russia: the night check found the Mafia

    // Korea: the night comes first
    if (R.night) {
      S().night(true);
      sfx.fanStop();
      sfx.play('crickets');
      await narrate('night', {}, { wait: 2200 });
      const nr = match.playNight();
      S().allLook(nr.victim);
      act(nr.victim, 'surprised', '😱');
      await narrate('victim', { name: name(nr.victim) }, { wait: 2000 });
      if (nr.saved) {
        act(nr.victim, 'jump', '😮‍💨');
        await narrate('saved', { name: name(nr.victim) }, { wait: 2000 });
      } else {
        act(nr.victim, 'cry', '😭');
        await narrate('notSaved', { name: name(nr.victim) }, { wait: 2000 });
      }
      S().night(false);
      sfx.fanStart();
      S().hold(nr.victim);
      await sleep(500);
    }

    // Classic opening: "Raja kaun?" … "Mera Wazir kaun?"
    if (R.announce) {
      const k = match.announcer;
      S().showOne(k, R.announce);
      S().emote(k, country.roles[R.announce].emoji, 2);
      await sayWait(k, 'kingAnnounce');
      await sayWait(k, 'askGuesser');
      S().showOne(g, R.guesser);
    }
    S().investigate(g, guesserRole.acc);
    S().emote(g, '😎', 1.8);
    await sayWait(g, 'announce');
    const nervousKid = pickOne(match.suspects());
    act(nervousKid, 'nervous', '💧');
    await sayWait(nervousKid, 'nervous');

    // Power cut (the night already did the dark in Korea)
    let powerOff = false;
    if (!R.night) {
      S().power(false);
      powerOff = true;
      sfx.fanStop();
      if (country.outage.off.includes('🌩️')) { sfx.play('thunder'); sfx.play('rain'); }
      await sleep(700);
      const scared = pickOne([0, 1, 2, 3]);
      act(scared, 'surprised', '😱');
      await sayWait(scared, 'outage');
      S().pose(scared, 'hold');
    }
    S().focus(g, { y: 1.05, back: 2.4, lift: 0.1 });
    if (Math.random() < 0.35) await narrate('parent', {}, { parent: true, wait: 1600 });

    // Russia: the Komissar's night check
    if (R.check) {
      sfx.play('crickets');
      await narrate('night', {}, { wait: 1800 });
      const c = match.nightCheck();
      const secret = fmt(c.isThief ? ui.nightThief : ui.nightClear, { name: name(c.seat), thief: country.roles.thief.name });
      if (local) showToast(secret, 4000);
      else if (remote) tellSeat(g, { t: 'toast', text: secret, ms: 4000 });
      else {
        S().look(g, c.seat);
        await sayWait(g, c.isThief ? 'checkThief' : 'checkClear', { name: name(c.seat) }, 300);
      }
      act(c.seat, c.isThief ? 'surprised' : 'shrug', c.isThief ? '❗' : '😇');
      if (c.isThief) forced = c.seat;
    }

    // Japan: a clue clears one innocent
    if (R.hint) {
      const cleared = match.giveHint();
      if (cleared != null) {
        act(cleared, 'cheer', '😇');
        await sayWait(g, 'hint', { name: name(cleared) }, 500);
        S().hold(cleared);
      }
    }

    // Germany: a witness gives a (not always right) tip
    if (R.witness) {
      const w = match.witness();
      S().look(w.who, w.tip);
      act(w.who, 'point', '👀');
      await sayWait(w.who, 'witness', { name: name(w.tip) }, 300);
      act(w.tip, 'deny', '❗');
      S().hold(w.who);
      lean = w.tip;
    }

    // UK: every suspect gives an alibi
    if (R.alibi) {
      for (const s of match.suspects()) {
        S().look(g, s);
        act(s, 'shrug');
        await sayWait(s, 'alibi', {}, 300);
        S().pose(s, 'hold');
      }
    }

    // Mexico: someone can't hold in the giggles
    if (R.tell) {
      const t = match.tell();
      act(t, 'laugh', '🤭');
      await sayWait(t, 'giggle', {}, 200);
      S().look(g, t);
      S().emote(g, '🤨', 1.8);
      await sayWait(g, 'tellNotice', { name: name(t) }, 300);
      S().pose(t, 'hold');
      lean = t;
    }

    // The guess
    const guesses = [];
    const accusePrompt = fmt(ui.accuse, { icon: guesserRole.emoji, role: guesserRole.name, thief: country.roles.thief.name });
    if (human) {
      const pleader = pickOne(match.suspects());
      act(pleader, 'nervous');
      say(pleader, 'plead', {}, { camera: 'none' });
      guesses.push(local
        ? await humanAccuse(match.suspects(), accusePrompt, { canCheat: true })
        : await remoteAccuse(g, match.suspects(), accusePrompt, { canCheat: true }));
    } else {
      // with only two suspects left a peek settles it, so computer players rarely risk it
      if (forced == null && Math.random() < (match.suspects().length >= 3 ? 0.45 : 0.2)) await aiCheatScene(g);
      const sus = match.suspects();
      const a = pickOne(sus);
      S().emote(g, '🤔', 2);
      await sayWait(g, 'thinking', { name: name(a) });
      if (Math.random() < 0.6) { act(a, 'nervous', '💧'); await sayWait(a, 'plead'); }
      if (sus.length > 1) await sayWait(g, 'thinking', { name: name(pickOne(sus.filter(s => s !== a))) });
      guesses.push(forced ?? match.aiGuess([], lean));
    }

    if (powerOff) {
      S().power(true);
      sfx.fanStart();
      await sleep(900);
      say(pickOne([0, 1, 2, 3]), 'restore', {}, { to: null });
      await sleep(900);
    }
    S().view('result');

    S().point(g, guesses[0]);
    act(guesses[0], 'surprised', '❗');
    await sayWait(g, 'accuse', { name: name(guesses[0]) }, 400);
    act(guesses[0], 'deny');
    await sayWait(guesses[0], 'accusedReply');

    // USA: a second shot after a miss
    if (R.secondChance && guesses[0] !== thief) {
      S().showOne(guesses[0], match.slotOf(guesses[0]));
      sfx.play('wrong');
      act(g, 'facepalm', '😬');
      await sayWait(g, 'missOnce', {}, 300);
      const left = match.suspects().filter(s => s !== guesses[0]);
      const second = local ? await humanAccuse(left, ui.second)
        : remote ? await remoteAccuse(g, left, ui.second)
          : match.aiGuess([guesses[0]], lean);
      guesses.push(second);
      S().point(g, second);
      act(second, 'surprised', '❗');
      await sayWait(g, 'secondTry', { name: name(second) }, 400);
    }

    const res = match.resolve(guesses);
    saveGame('between');     // round scored: a refresh now continues with the next round

    // Everyone shows their chit
    say(pickOne(others(g)), 'show', {}, { to: null, camera: 'none' });
    S().clearTalk();
    await sleep(700);
    S().reveal(match.roles);
    haptic(30);
    await sleep(1500);

    // Reactions
    others(g, thief).forEach(i => act(i, 'clap', null, 'happy'));
    if (res.correct) {
      act(g, 'jump', '🎉');
      act(thief, 'cry', '😭');
      S().look(thief, null);
      sfx.play('correct');
      haptic([20, 40, 20]);
      say(g, 'guesserWin', {}, { to: thief, camera: 'none' });
      await sleep(900);
      say(thief, 'thiefLose', {}, { to: g, camera: 'none' });
      if (R.fine) { await sleep(1400); say(g, 'fine', { name: name(thief) }, { camera: 'none' }); }
    } else {
      act(thief, 'laugh', '😂');
      act(g, 'facepalm', '💢');
      S().look(g, null);
      sfx.play('wrong');
      say(thief, 'thiefWin', {}, { to: g, camera: 'none' });
      await sleep(900);
      say(g, 'guesserLose', {}, { to: thief, camera: 'none' });
      if (R.onWrong === 'penalty') { await sleep(1400); say(g, 'penalty', {}, { camera: 'none' }); }
      if (R.steal) {
        await sleep(1400);
        const k = match.seatOf('king');
        act(k, 'cry', '💸');
        say(thief, 'steal', { name: name(k) }, { camera: 'none' });
      }
    }
    await sleep(1400);
    const royals = others(g, thief);
    if (royals.length) say(pickOne(royals), 'royal', {}, { camera: 'none' });
    renderScores(res.points);
    sfx.play('score');
    await sleep(3200);
  }

  /* ─── The match ───────────────────────────────────────── */
  let playMode = 'play';
  const seoIntro = document.querySelector('.seo-intro');

  function saveGame(phase) {
    if (!match || net) return;   // a Nearby match lives on four phones, it can't be resumed from one
    try {
      const spoken = {};
      Object.entries(talks).forEach(([lang, d]) => { spoken[lang] = d.exportSpoken().slice(-600); });
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1, at: Date.now(), phase, country: base.id, playMode,
        match: match.snapshot(),
        players: players.map(p => ({ name: p.name, gender: p.gender, look: p.look, isHuman: p.isHuman })),
        spoken,
      }));
    } catch {}
  }

  async function ensureWorld() {
    if (!world) showPrompt(ui.loading);
    world = await worldReady;
    showPrompt('');
    if (!alive) throw CANCEL;
    if (!world?.story) { showPrompt(ui.noGl); throw CANCEL; }
  }

  let worldReady = null;
  async function run() {
    // the 3D room loads in the background; the start screen doesn't wait for it
    worldReady = loadWorld().then((w) => {
      world = w;
      if (w?.story && alive && !match) { w.story.setCountry(country); previewTable(); }
      return w;
    });
    loadPack('english');               // every language falls back to it for rule-specific moments
    loadPack(chatPack());

    // an invite link, or a friend's phone coming back after a reload, goes straight to Nearby Play
    if (pendingStart) {
      const p = pendingStart;
      pendingStart = null;
      base = COUNTRIES[p.game] || base;
      country = localize(base, mode);
      ui = uiFor();
      await ensureWorld();
      await startMatch(p.mode);
      return;
    }
    const urlJoin = readUrlJoin();
    const ticket = loadRejoin();
    // after a reload the phone goes straight back; after ✕ the player chooses (the Rejoin button)
    let nearbyStart = ticket && (urlJoin === ticket.code || (!urlJoin && !ticket.left)) ? { rejoin: ticket } : urlJoin ? { code: urlJoin } : null;
    if (nearbyStart?.rejoin) {
      // a reload has no tap to unlock sound yet: the first touch does it
      screen.addEventListener('pointerdown', () => audioManager.unlock(), { once: true });
    }

    const saved = nearbyStart ? null : loadSave();
    const fromUrl = readUrlGame();
    if (saved && (!fromUrl || fromUrl.country.id === saved.country)) {
      base = COUNTRIES[saved.country];
      country = localize(base, mode);
      ui = uiFor();
      setRound(fmt(ui.roundOf, { n: saved.match.round, m: saved.match.rounds }));
      await ensureWorld();
      await startMatch(saved.playMode === 'watch' ? 'watch' : 'play', saved);
      return;
    }
    if (fromUrl) {
      base = fromUrl.country;
      country = localize(base, mode);
      ui = uiFor();
    }

    let pm;
    for (;;) {
      pm = nearbyStart ? 'nearby' : await chooseSetup();
      if (!alive) return;
      if (pm === 'rejoin') {
        const back = loadRejoin();
        if (!back) continue;
        nearbyStart = { rejoin: back };
        pm = 'nearby';
      }
      if (pm !== 'nearby') break;
      const r = await nearbyFlow(nearbyStart || {});
      nearbyStart = null;
      if (!alive) return;
      if (r === 'host') break;           // room full enough and Start pressed
      if (r === 'guest') return;         // a friend's phone: the host drives from here
    }
    await ensureWorld();
    await startMatch(pm);
  }

  async function startMatch(pm, saved = null) {
    playMode = pm;
    clearSave();
    exitBtn.hidden = false;
    if (saved) {
      players = saved.players.map((p, i) => ({
        name: String(p.name).slice(0, 16), gender: p.gender === 'f' ? 'f' : 'm', look: cleanLook(p.look, p.look?.id),
        color: SHIRTS[i], isHuman: !!p.isHuman,
      }));
      match = Match.restore(base, saved.match);
    } else {
      const human = pm === 'play' || pm === 'nearby';
      // new strangers at the table every match; the ones on the start screen play the first one
      const table = cast || makeCast();
      cast = null;
      players = table.map((p, i) => ({ name: p.name, gender: p.gender, look: { ...p.look, skin: country.theme.skins[i % country.theme.skins.length] }, color: SHIRTS[i], isHuman: false, remote: null }));
      if (human) players[HUMAN_SEAT] = { ...players[HUMAN_SEAT], name: myName(), gender: profile.gender, look: profile.look, isHuman: true };
      // Nearby: friends take seats 0, 1, 2 in the order they joined; empty seats stay computer players
      if (pm === 'nearby' && isHost()) {
        players[HUMAN_SEAT].name = net.name;   // the name the friends already saw in the lobby
        net.lastEnd = null;
        const online = net.room.list;
        net.seats.forEach((s, k) => {
          // a friend who is away keeps name and seat; a computer player sits in until they're back
          players[k] = { name: s.name, gender: s.gender, look: s.look, color: SHIRTS[k], isHuman: false, remote: online.find(g => g.token === s.token)?.id || null };
        });
        // nobody at the table shares a name with a friend
        const taken = new Set(players.filter((p, i) => p.remote || i === HUMAN_SEAT || net.seats[i]).map(p => p.name.toLowerCase()));
        players.forEach((p, i) => {
          if (p.remote || p.isHuman || net.seats[i] || !taken.has(p.name.toLowerCase())) return;
          const fresh = pickOpponents(1, [...taken])[0];
          p.name = fresh.name; p.gender = fresh.gender; p.look = randomLook(fresh.gender, country.theme.skins[i % country.theme.skins.length]);
          taken.add(p.name.toLowerCase());
        });
      }
      const rounds = ROUND_OPTIONS.includes(settingsStore.get('matchRounds')) ? settingsStore.get('matchRounds') : DEFAULT_ROUNDS;
      match = new Match(base, 4, rounds, { humanSeat: pm === 'play' || pm === 'nearby' ? HUMAN_SEAT : -1 });
      if (isHost()) {
        pending.clear();
        players.forEach((p, seat) => {
          if (p.remote) net.room.send(p.remote, { t: 'start', game: base.id, rounds, seat, players: seatList() });
        });
      }
    }
    talks = {};
    await Promise.all([loadPack('english'), loadPack(country.lang), loadPack(chatPack())]);
    if (saved?.spoken) {
      // remember what was already said, so nothing repeats after the refresh
      await Promise.all(Object.keys(saved.spoken).map(loadPack));
      Object.entries(saved.spoken).forEach(([lang, list]) => {
        talks[lang] = new Dialogue(lang, namesFor(lang), country.lang);
        talks[lang].importSpoken(list);
      });
    }
    if (!alive) return;
    voiceBox.setLanguages(country.voice);
    voiceBox.setCast(players.map(p => ({ gender: p.gender, age: p.look.age })));
    sfx.fanStart();
    renderScores();

    S().setCountry(country);
    S().begin(players.map(p => ({
      name: p.name, look: p.look, color: p.color, isHuman: p.isHuman,
      label: p.isHuman && p.name !== ui.you ? `${p.name} (${ui.you})` : p.name,
    })));
    if (voiceOn() && !voiceBox.available) showToast(ui.voiceOff, 3500);
    keepAwake(true);
    await sleep(800);

    let first = 1, resumeRound = false;
    if (saved) {
      resumeRound = saved.phase === 'inRound';
      first = resumeRound ? match.round : match.round + 1;
      showToast(fmt(ui.resumed, { n: Math.min(first, match.rounds) }), 3200);
      saveGame(resumeRound ? 'inRound' : 'between');
    } else {
      act(0, 'wave', '👋');
      await sayWait(0, 'intro', {}, 250, { to: null });
      await sayWait(1, 'introReply', {}, 250, { to: 0 });
      S().clearTalk();
    }

    for (let r = first; r <= match.rounds; r++) {
      await playRound(r, { resume: resumeRound && r === first });
      if (r < match.rounds) {
        await sayWait(pickOne([0, 1, 2, 3]), 'nextRound');
        renderScores();
      }
    }
    clearSave();    // the match is finished: a refresh now goes back to the start screen

    // Game over
    const w = match.winner();
    setRound(`🏆 ${ui.over}`);
    S().celebrate(w);
    S().emote(w, '🏆', 4);
    sfx.play('victory');
    haptic([30, 50, 30, 50, 90]);
    keepAwake(false);
    await sayWait(w, 'winner', {}, 250, { camera: 'none' });
    others(w).forEach(i => { say(i, 'loser', {}, { camera: 'none' }); S().emote(i, pickOne(['👏', '😅', '😤']), 2.5); });
    await sleep(1800);
    await narrate('parentEnd', {}, { parent: true, wait: 1500 });

    const result = {
      w, totals: match.totals.slice(), order: match.standings(), awards: match.awards(),
      rounds: match.rounds, game: base.id, catches: match.catches.slice(), escapes: match.escapes.slice(),
      cheats: match.cheats.slice(), caughtCheats: match.caughtCheats.slice(),
    };
    if (net?.role === 'host') { net.lastEnd = result; net.room.broadcast({ t: 'end', ...result }); }
    showEnd(result);
  }

  /** The end-of-match sheet (same on the host and on every guest phone). */
  function showEnd({ w, totals, order, awards, rounds, game, catches, escapes, cheats, caughtCheats }) {
    const guest = net?.role === 'guest';
    const me = players.findIndex(p => p.isHuman);
    let progress = null;
    if (me >= 0) {
      progress = profile.recordMatch({
        mode: net ? 'nearby' : 'local', won: w === me, score: totals[me], catches: catches?.[me] || 0, escapes: escapes?.[me] || 0,
        cheats: cheats?.[me] || 0, caught: caughtCheats?.[me] || 0, game, rounds,
      });
      if (progress.rankedUp) { sfx.play('victory'); showToast(fmt(ui.rankUp, { icon: progress.after.icon, title: progress.after.title }), 4200); }
    }
    const lastPlace = order[order.length - 1];
    const MEDALS = ['🥇', '🥈', '🥉', '4'];
    const standings = el('ol', { className: 'game__standings' }, order.map((seat, place) => el('li', {
      className: `game__standing${players[seat].isHuman ? ' game__standing--me' : ''}`,
      style: { '--chip': players[seat].color },
    }, [
      el('span', { className: 'game__medal' }, [MEDALS[place]]),
      el('strong', {}, [players[seat].isHuman ? `${players[seat].name} (${ui.you})` : players[seat].name]),
      el('span', { className: 'game__pts' }, [String(totals[seat])]),
    ])));
    const awardRow = awards.length ? el('div', { className: 'game__awards' }, awards.map(a => el('span', { className: 'game__award' }, [
      el('strong', {}, [ui[a.id]]),
      el('span', {}, [`${players[a.seat].name} · ${fmt(ui[`${a.id}Sub`], { n: a.count })}`]),
    ]))) : null;
    const shareMsg = el('span', {}, [ui.shareSub]);
    const shareBtn = el('button', {
      className: 'game__choice', type: 'button',
      onClick: async () => {
        const url = new URL(location.href);
        url.search = `?game=${GAME_SLUGS[game]}`; url.hash = '';
        const score = me >= 0 ? totals[me] : totals[w];
        const text = me >= 0
          ? `I scored ${score} in ${GAME_NAME_EN[game]}${w === me ? ' and won 🏆' : ''}! Can you beat me?`
          : `Play ${GAME_NAME_EN[game]} online, free!`;
        const r = await shareGame({ title: `${GAME_NAME_EN[game]} – ChitPlay`, text, url: url.toString() });
        if (r === 'copied') shareMsg.textContent = ui.copied;
        else if (r === 'failed') shareMsg.textContent = url.toString();   // at least show the link to copy by hand
      },
    }, [el('strong', {}, [ui.share]), shareMsg]);

    clear(sheet);
    sheet.className = 'game__sheet game__sheet--show game__sheet--start';
    sheet.append(
      el('h2', { className: 'game__title' }, [players[w].isHuman ? ui.youWon : fmt(ui.won, { name: players[w].name })]),
      el('p', { className: 'game__sub' }, [`${GAME_NAME_EN[game]} · ${rounds} rounds${net ? ' · 📶 Nearby' : ''}`]),
      standings,
      ...(awardRow ? [awardRow] : []),
      ...(progress ? [el('div', { className: 'game__progress' }, [
        el('strong', {}, [`${progress.after.icon} ${progress.after.title}`]),
        el('div', { className: 'game__bar' }, [el('span', { style: { width: `${Math.round(progress.after.progress * 100)}%` } })]),
        el('span', {}, [[
          fmt(ui.gained, { n: progress.gained.toLocaleString('en') }),
          progress.place ? fmt(ui.hallPlace, { n: progress.place }) : '',
          ...progress.newBadges.map(b => fmt(ui.newBadge, { icon: b.icon, name: b.name })),
        ].filter(Boolean).join(' · ')]),
      ])] : []),
      el('div', { className: 'game__forfeit' }, [
        el('strong', {}, [fmt(ui.forfeit, { name: players[lastPlace].name })]),
        el('span', {}, [fmt(ui.forfeitLine, { name: players[lastPlace].isHuman ? ui.you : players[lastPlace].name, text: pickOne(FORFEITS) })]),
      ]),
      guest
        ? el('p', { className: 'game__stats' }, [ui.waitHostAgain])
        : el('button', {
          className: 'game__choice game__choice--primary', type: 'button',
          onClick: () => { sheet.className = 'game__sheet'; startMatch(playMode).catch(onError); },
        }, [el('strong', {}, [ui.again]), el('span', {}, [net ? ui.againNearby : ui.againSub])]),
      el('button', {
        className: 'game__choice', type: 'button',
        onClick: () => { clearRejoin(); transition(GAME_PHASES.HOME); },
      }, guest ? [el('strong', {}, [ui.leave]), el('span', {}, [ui.leaveSub])] : [el('strong', {}, [ui.change]), el('span', {}, [net ? ui.changeNearby : ui.changeSub])]),
      shareBtn,
    );
  }

  /* ─── Who sits at the table ─────────────────────────────── */
  function makeCast() {
    const skins = country.theme.skins;
    return pickOpponents(4, [myName()]).map((o, i) => ({ ...o, look: randomLook(o.gender, skins[i % skins.length]) }));
  }
  function seatList() {
    return players.map(x => ({ name: x.name, gender: x.gender, look: x.look }));
  }
  /** The start screen shows who you'd play with: three strangers and you. */
  function previewTable() {
    if (!world?.story || match || net) return;
    cast ||= makeCast();
    const skins = country.theme.skins;
    world.story.preview(cast.map((p, i) => (i === HUMAN_SEAT
      ? { name: myName(), look: profile.look }
      : { name: p.name, look: { ...p.look, skin: skins[i % skins.length] } })));
  }

  /* ─── ✕ menu ──────────────────────────────────────────── */
  const isSolo = () => !net;
  const canPause = () => !net || isHost();
  function closeOverlay() {
    overlay.hidden = true;
    clear(overlay);
    screen.classList.remove('game--overlay', 'game--profile');
    world?.story?.portrait(null);
  }
  function quitGame() {
    clearSave();
    const ticket = net?.role === 'guest' ? loadRejoin() : null;
    if (ticket) saveRejoin({ ...ticket, left: true }); else clearRejoin();
    holdTimers(false);
    transition(GAME_PHASES.HOME);
  }
  const scoreCard = () => {
    const rank = profile.rank, st = profile.stats;
    return el('div', { className: 'game__card' }, [
      el('span', { className: 'game__avatar', html: portraitSvg(profile.look) }),
      el('div', { className: 'game__card-text' }, [
        el('strong', {}, [profile.name]),
        el('span', {}, [`${rank.icon} ${rank.title}`]),
        el('span', { className: 'game__card-points' }, [
          `${ui.localPts}: ${st.local.points.toLocaleString('en')} · ${ui.nearbyPts}: ${st.nearby.points.toLocaleString('en')}`,
        ]),
      ]),
    ]);
  };
  const menuBtn = (label, onClick, cls = '') => el('button', { className: `game__choice ${cls}`, type: 'button', onClick }, [el('strong', {}, [label])]);
  function openMenu() {
    if (isSolo()) holdTimers(true);
    clear(overlay);
    overlay.hidden = false;
    screen.classList.add('game--overlay');
    overlay.append(el('div', { className: 'game__panel' }, [
      el('h2', { className: 'game__title' }, [ui.menuTitle]),
      scoreCard(),
      canPause() ? menuBtn(ui.pause, () => pauseGame(), 'game__choice--primary') : null,
      isSolo() && match ? menuBtn(ui.restart, () => {
        clearSave();
        pendingStart = { mode: playMode, game: base.id };
        holdTimers(false);
        transition(GAME_PHASES.HOME);
      }) : null,
      menuBtn(ui.quit, quitGame),
      menuBtn(`👤 ${ui.profile}`, () => openProfile({ fromMenu: true })),
      el('button', {
        className: 'game__back', type: 'button',
        onClick: () => { closeOverlay(); if (isSolo()) holdTimers(false); },
      }, [ui.backToGame]),
    ].filter(Boolean)));
  }
  function pauseGame() {
    holdTimers(true);
    tell({ t: 'pause', on: true });
    showPaused();
  }
  function showPaused() {
    clear(overlay);
    overlay.hidden = false;
    screen.classList.add('game--overlay');
    const guest = net?.role === 'guest';
    overlay.append(el('div', { className: 'game__panel game__panel--paused' }, [
      el('h2', { className: 'game__title' }, [guest ? ui.pausedHost : ui.paused]),
      el('p', { className: 'game__sub' }, [ui.pausedSub]),
      guest ? null : menuBtn(ui.resume, () => {
        closeOverlay();
        holdTimers(false);
        tell({ t: 'pause', on: false });
      }, 'game__choice--primary'),
      menuBtn(ui.quit, quitGame),
    ].filter(Boolean)));
  }

  /* ─── Profile ─────────────────────────────────────────── */
  function openProfile({ fromMenu = false } = {}) {
    const inMatch = !!match && !!players.length;
    // a live preview only on your own seat, and only when nobody else is watching that seat
    const canPreview = !net && (!inMatch || playMode === 'play');
    if (inMatch && isSolo() && !paused) holdTimers(true);
    clear(overlay);
    overlay.hidden = false;
    screen.classList.add('game--overlay', ...(canPreview ? ['game--profile'] : []));
    if (canPreview) world?.story?.portrait(HUMAN_SEAT);

    const applyLook = (look) => {
      const saved = profile.setLook(look);
      if (canPreview) world?.story?.setLook(HUMAN_SEAT, { ...saved, gender: profile.gender });
      paintPicker();
      avatar.innerHTML = portraitSvg(profile.look);
    };
    const avatar = el('span', { className: 'game__avatar', html: portraitSvg(profile.look) });
    const seg = (options, current, onPick) => {
      const box = el('div', { className: 'game__seg' });
      const paint = (v) => [...box.children].forEach(c => c.classList.toggle('game__seg-btn--on', c.dataset.v === v));
      options.forEach(([v, label]) => box.append(el('button', {
        className: 'game__seg-btn', type: 'button', attrs: { 'data-v': v },
        onClick: () => { paint(v); onPick(v); },
      }, [label])));
      paint(current);
      box.paintValue = paint;
      return box;
    };
    const genderSeg = seg([['m', ui.male], ['f', ui.female]], profile.gender, (g) => {
      profile.setGender(g);
      applyLook({ ...profile.look, gender: g });
    });
    const presetGrid = el('div', { className: 'game__presets', attrs: { role: 'listbox', 'aria-label': ui.character } });
    function paintPicker() {
      [...presetGrid.children].forEach(c => c.classList.toggle('game__preset--on', c.dataset.id === profile.look.id));
    }
    [...PRESETS].forEach((p) => {
      presetGrid.append(el('button', {
        className: 'game__preset', type: 'button', attrs: { 'data-id': p.id, 'aria-label': p.label },
        onClick: () => {
          profile.setGender(p.gender);
          genderSeg.paintValue(p.gender);
          applyLook(lookOf(p.id));
          refreshCustom();
        },
      }, [el('span', { html: portraitSvg(lookOf(p.id)) }), el('small', {}, [p.label])]));
    });

    /* make your own */
    const customBox = el('div', { className: 'game__custom' });
    const swatches = (values, key) => el('div', { className: 'game__swatches' }, values.map(c => el('button', {
      className: `game__swatch${profile.look[key] === c ? ' game__swatch--on' : ''}`, type: 'button',
      style: { background: c }, attrs: { 'aria-label': `${key} ${c}` },
      onClick: (e) => {
        [...e.currentTarget.parentNode.children].forEach(x => x.classList.remove('game__swatch--on'));
        e.currentTarget.classList.add('game__swatch--on');
        applyLook({ ...profile.look, [key]: c, id: 'custom' });
      },
    })));
    const choose = (list, key) => {
      const select = el('select', {
        className: 'game__select', attrs: { 'aria-label': key },
        onChange: (e) => applyLook({ ...profile.look, [key]: e.target.value, id: 'custom' }),
      }, list.map(o => el('option', { attrs: { value: o.id, ...(profile.look[key] === o.id ? { selected: 'selected' } : {}) } }, [o.label])));
      return select;
    };
    const row = (label, control) => el('label', { className: 'game__row-field' }, [el('span', {}, [label]), control]);
    function refreshCustom() {
      clear(customBox);
      const bindi = el('input', { attrs: { type: 'checkbox', ...(profile.look.bindi ? { checked: 'checked' } : {}) } });
      bindi.addEventListener('change', () => applyLook({ ...profile.look, bindi: bindi.checked, id: 'custom' }));
      customBox.append(
        row(ui.age, choose(AGES, 'age')), row(ui.hair, choose(HAIR_STYLES, 'hair')),
        row(ui.hairColor, swatches(HAIR_COLORS, 'hairColor')), row(ui.skin, swatches(SKIN_TONES, 'skin')),
        row(ui.eyes, swatches(EYE_COLORS, 'eyes')), row(ui.outfit, choose(OUTFITS, 'outfit')),
        row(ui.color1, swatches(CLOTH_COLORS, 'color')), row(ui.color2, swatches(CLOTH_COLORS, 'color2')),
        row(ui.pants, swatches(PANTS_COLORS, 'pants')), row(ui.glasses, choose(GLASSES, 'glasses')),
        row(ui.facial, choose(FACIAL, 'facial')), row(ui.headwear, choose(HEADWEAR, 'headwear')),
        row(ui.bindi, bindi),
      );
    }
    refreshCustom();

    /* score */
    const scoreBox = el('div', { className: 'game__scorebox' });
    function paintScore() {
      clear(scoreBox);
      const rank = profile.rank, all = profile.all, st = profile.stats;
      const cell = (t) => el('td', {}, [t]);
      const num = (n) => n.toLocaleString('en');
      scoreBox.append(
        el('div', { className: 'game__progress' }, [
          el('strong', {}, [`${rank.icon} ${rank.title}`]),
          el('div', { className: 'game__bar' }, [el('span', { style: { width: `${Math.round(rank.progress * 100)}%` } })]),
          el('span', {}, [rank.next ? fmt(ui.nextRank, { pts: num(rank.next.at - all.points), title: rank.next.title }) : ui.topRank]),
        ]),
        el('table', { className: 'game__table' }, [
          el('thead', {}, [el('tr', {}, [cell(''), cell(ui.localPts), cell(ui.nearbyPts)])]),
          el('tbody', {}, [
            [ui.totalPts, 'points'], [ui.matches, 'matches'], [ui.wins, 'wins'], [ui.best, 'best'],
          ].map(([label, k]) => el('tr', {}, [cell(label), cell(num(st.local[k])), cell(num(st.nearby[k]))]))),
        ]),
        el('h3', { className: 'game__h3' }, [ui.badges]),
        el('div', { className: 'game__badges' }, BADGES.map((b) => {
          const on = profile.badges.includes(b.id);
          return el('span', { className: `game__badge${on ? ' game__badge--on' : ''}`, attrs: { title: `${b.name}: ${b.hint}` } }, [
            el('b', {}, [b.icon]), el('small', {}, [b.name]),
          ]);
        })),
        el('h3', { className: 'game__h3' }, [ui.hall]),
        profile.hall.length
          ? el('ol', { className: 'game__hall' }, profile.hall.slice(0, 5).map(h => el('li', {}, [
            el('strong', {}, [num(h.score)]),
            el('span', {}, [`${GAME_NAME_EN[h.game] || ''}${h.mode === 'nearby' ? ' · 📶' : ''}${h.won ? ' · 🏆' : ''}`]),
          ])))
          : el('p', { className: 'game__netnote' }, [ui.noHall]),
      );
    }
    paintScore();
    let armed = false;
    const resetBtn = el('button', {
      className: 'game__danger', type: 'button',
      onClick: () => {
        if (!armed) { armed = true; resetBtn.textContent = ui.resetSure; return; }
        profile.resetScore();
        armed = false;
        resetBtn.textContent = ui.resetScore;
        paintScore();
        showToast(ui.resetDone, 1800);
      },
    }, [ui.resetScore]);
    const nameInput = nameInputEl();
    const graphics = el('select', {
      className: 'game__select', attrs: { 'aria-label': ui.graphics },
      onChange: (e) => { settingsStore.set('graphics', e.target.value); world?.story?.setGraphics(e.target.value); },
    }, [['auto', ui.gAuto], ['low', ui.gLow], ['medium', ui.gMedium], ['high', ui.gHigh], ['ultra', ui.gUltra]].map(([v, label]) => {
      const current = world?.story?.graphics || settingsStore.get('graphics') || 'auto';
      return el('option', { attrs: { value: v, ...(current === v ? { selected: 'selected' } : {}) } }, [label]);
    }));

    overlay.append(el('div', { className: 'game__panel game__panel--profile' }, [
      el('div', { className: 'game__card' }, [avatar, el('h2', { className: 'game__title' }, [ui.profile])]),
      row(ui.yourName, nameInput),
      el('p', { className: 'game__netnote' }, [ui.nameHelp]),
      row(ui.gender, genderSeg),
      el('h3', { className: 'game__h3' }, [ui.character]),
      presetGrid,
      el('details', { className: 'game__about' }, [el('summary', {}, [`🎨 ${ui.custom}`]), customBox]),
      el('h3', { className: 'game__h3' }, [ui.score]),
      scoreBox,
      resetBtn,
      row(ui.graphics, graphics),
      el('button', {
        className: 'game__choice game__choice--primary', type: 'button',
        onClick: () => {
          screen.classList.remove('game--profile');
          world?.story?.portrait(null);
          previewTable();
          if (fromMenu) { openMenu(); return; }
          closeOverlay();
          if (inMatch && isSolo()) holdTimers(false);
          rankRefresh?.();
        },
      }, [el('strong', {}, [ui.done])]),
    ]));
    paintPicker();
  }
  let rankRefresh = null;

  function onError(e) {
    if (e !== CANCEL) console.error('[ChitPlay3D]', e);
  }

  return {
    element: screen,
    onEnter() { run().catch(onError); },
    onExit() {
      alive = false;
      tapHandler = null;
      tasks.forEach(task => clearTimeout(task.timer));
      tasks.clear();
      world?.story?.setPaused(false);
      world?.story?.portrait(null);
      voiceBox.pause(false);
      voiceBox.stop();
      sfx.fanStop();
      keepAwake(false);
      document.removeEventListener('visibilitychange', onVisible);
      onModeChange = null;
      net?.room.close();
      net = null;
      world?.story?.end();
    },
  };
}
