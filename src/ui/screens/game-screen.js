import { el, clear } from '../../utils/dom.js';
import { GAME_PHASES } from '../../app/config.js?v=20261110-0233';
import { settingsStore } from '../../persistence/settings-store.js?v=20261110-0233';
import { profile, BADGES, RANKS, FLAIRS, DAILY_BONUS } from '../../persistence/profile-store.js?v=20261110-0233';
import { audioManager } from '../../audio/audio-manager.js';
import { loadWorld } from '../../world/world-loader.js?v=20261110-0233';
import { COUNTRIES, COUNTRY_ORDER, detectCountryInfo, localize, GAME_SLUGS, GAME_AKA, GAME_NAME_EN, GAME_ICON, ROLE_LATIN, asOneGame, editionFor, HOUSE_RULES } from '../../world/countries.js?v=20261110-0233';
import { Dialogue, loadPack } from '../../world/dialogue.js?v=20261110-0233';
import { Match, CHEAT_PENALTY } from '../../world/match.js?v=20261110-0233';
import { NearbyHost, NearbyGuest, nearbyError, isCode, newToken, PUBLIC_TABLES, publicCode, isPublicCode, peekTables } from '../../net/nearby.js?v=20261110-0233';
import { cleanName, detectNameRegion, NAME_REGION_FOR, pickOpponents as pickAny, politeName } from '../../world/names.js?v=20261110-0233';
import {
  PRESETS, AGES, HAIR_STYLES, OUTFITS, HEADWEAR, GLASSES, FACIAL, SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTH_COLORS, PANTS_COLORS,
  lookOf, cleanLook, randomLook, portraitSvg, FANCY_HATS, PREMIUM_COLORS,
} from '../../world/character-looks.js?v=20261110-0233';
import { nextCaughtScene, nextCloseCall } from '../../world/cheat-lines.js?v=20261110-0233';
import { TALK_EMOJIS, TALK_LINE_COUNT, talkLine, isTalkEmoji, SPECIAL_EMOJIS, ALL_EMOJIS } from '../../world/table-talk.js?v=20261110-0233';
import { LANGUAGES, isLanguage, useLanguage, languageId, strings, forfeits, lookName, rankTitle, badgeText } from '../../i18n/index.js?v=20261110-0233';
import { iconSvg } from '../icons.js?v=20261110-0233';
import { shellText, fill } from '../../arcade/shell-text.js?v=20261110-0233';
import { ACHIEVEMENTS, TIERS, achievementList, bestOf, playStats, checkUnlocks, onPopup, rankProgress } from '../../arcade/achievements.js?v=20261110-0233';
import { reminderSettings, reminderSupported, setReminder, startReminder } from '../../arcade/reminder.js?v=20261110-0233';
import { confirmSpend, notice } from '../../arcade/dialog.js?v=20261110-0233';
import { clearPhoto, faceHtml, setPhotoFromFile } from '../../arcade/photo.js?v=20261110-0233';
import { DECOR, RARITY, THEMES, decorOf, decorState, lockedBy, roomLevel, saveDecor, spotsFor } from '../../arcade/decor.js?v=20261110-0233';
import { savedList } from '../../arcade/resume.js?v=20261110-0233';
import { logoSvg } from '../../arcade/logo.js?v=20261110-0233';
import { ALL_GAMES as TABLE_GAMES, CATEGORIES, HOT_DEFAULT, gameBySlug } from '../../arcade/catalog.js?v=20261110-0233';

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
const LANGUAGE_TAGS = { en: 'en', hinglish: 'hi-Latn', urdu: 'ur-Latn', nepali: 'ne-Latn', bangla: 'bn-Latn', romaji: 'ja-Latn', korean_roman: 'ko-Latn', pinyin: 'zh-Latn', russian_latin: 'ru-Latn', german: 'de', french: 'fr', portuguese: 'pt', spanish: 'es', hindi: 'hi', indonesian: 'id', turkish: 'tr', italian: 'it' };
const TOSS_WAIT_SECONDS = 5;
const CLOSE_CALL_CHANCE = 0.35;   // an unnoticed peek sometimes still gets an "are you looking at my chit?"
// a restart starts a new screen; this tells it to go straight into the match
let pendingStart = null;
let lastPassTable = null;         // who played on the single phone, for "play again" and restart
const AWAY_SECONDS = 30;          // a player who doesn't choose in time gets a computer stand-in for that choice

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
const fmt = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

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
let cameFromGameLink = false;
const SAVE_MAX_AGE = 7 * 24 * 3600 * 1000;
/** Opponents named in the language being played, leaning towards the other gender to the player. */
const pickOpponents = (count, exclude = []) => pickAny(count, exclude, languageId() === 'en' ? detectNameRegion() : (NAME_REGION_FOR[languageId()] || detectNameRegion()), profile.gender);

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
  const mode = 'en';                        // role names and rules stay in the game's own English text
  // the whole game can be read in the player's language (Latin letters); English by default
  const BROWSER_LANG = { hi: 'hindi', ur: 'urdu', ne: 'nepali', bn: 'bangla', ja: 'romaji', ko: 'korean_roman', zh: 'pinyin', ru: 'russian_latin', de: 'german', fr: 'french', pt: 'portuguese', es: 'spanish', id: 'indonesian', ms: 'indonesian', tr: 'turkish', it: 'italian' };
  const fromBrowser = () => { for (const l of navigator.languages || [navigator.language || 'en']) { const id = BROWSER_LANG[String(l).slice(0, 2).toLowerCase()]; if (id) return id; if (/^en/i.test(l)) return 'en'; } return 'en'; };
  let lang = isLanguage(settingsStore.get('chatLang')) ? settingsStore.get('chatLang') : fromBrowser();
  const chatPack = () => (lang === 'en' || ['hindi', 'indonesian', 'turkish', 'italian'].includes(lang) ? country.lang : lang);
  base = editionFor(lang);                  // one game: the language picks its name, room and voices
  const houseRules = () => (settingsStore.get('houseRules') || []).filter(r => HOUSE_RULES.includes(r));
  const oneGame = (b) => asOneGame(localize(b, mode), lang, houseRules());
  let country = oneGame(base);              // the game as played: classic rules + house rules
  const uiFor = () => strings();
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
  /* What you drew stays in your corner once you've opened it; tap to hide it from anyone looking over your shoulder. */
  const myChitEl = el('button', { className: 'game__mychit', type: 'button', onClick: () => { myChitOpen = !myChitOpen; paintMyChit(); } });
  myChitEl.hidden = true;
  let myChitRole = null, myChitOpen = true;
  function paintMyChit() {
    myChitEl.hidden = !myChitRole;
    if (myChitRole) myChitEl.textContent = myChitOpen ? fmt(ui.myChit, { emoji: myChitRole.emoji, role: myChitRole.name }) : ui.myChitHidden;
  }
  function setMyChit(slot) {
    myChitRole = slot ? country.roles[slot] : null;
    myChitOpen = true;
    paintMyChit();
  }
  // the emojis everyone reaches for, always on screen during a match
  const QUICK_EMOJIS = ['😂', '🤡', '😜', '😈', '🤫', '🙄', '💀', '🐔', '🍌', '🔥'];
  let quickAt = 0;
  const quickBar = el('div', { className: 'game__troll', attrs: { role: 'group', 'aria-label': 'Emojis' } }, QUICK_EMOJIS.map(sym => el('button', {
    type: 'button', attrs: { 'aria-label': sym },
    onClick: () => { if (Date.now() - quickAt < 500) return; quickAt = Date.now(); sendEmoji(null, ALL_EMOJIS.indexOf(sym)); },
  }, [sym])));
  quickBar.hidden = true;
  const talkBtn = el('button', { className: 'game__talkbtn', type: 'button', html: iconSvg('chatDots'), onClick: () => toggleTalk() });
  talkBtn.hidden = true;
  const talkPanel = el('div', { className: 'game__talk' });
  talkPanel.hidden = true;
  const whisperEl = el('div', { className: 'game__whisper', attrs: { 'aria-live': 'polite' } });
  whisperEl.hidden = true;
  const prompt = el('div', { className: 'game__prompt', attrs: { 'aria-live': 'polite' } });
  const toast = el('div', { className: 'game__toast', attrs: { 'aria-live': 'polite' } });
  const sheet = el('div', { className: 'game__sheet' });
  const iconBtn = (iconName, onClick, cls = '') => el('button', { className: `game__exit ${cls}`, type: 'button', html: iconSvg(iconName), onClick });
  const setIcon = (btn, iconName) => { btn.innerHTML = iconSvg(iconName); };
  const overlay = el('div', { className: 'game__overlay', attrs: { role: 'dialog', 'aria-modal': 'true' } });
  overlay.hidden = true;
  const exitBtn = iconBtn('menu', () => openMenu());
  exitBtn.hidden = true;
  const profileBtn = el('button', { className: 'game__exit game__profilebtn', type: 'button', onClick: () => openProfile() });
  const paintProfileBtn = () => { profileBtn.innerHTML = faceHtml(portraitSvg(profile.look)); };
  // from the list and a game's own screen it opens straight away; from a match, it asks first
  let homeLeave = null;
  const scanBtn = iconBtn('qr', () => {
    if (homeLeave) { homeLeave('scan'); return; }
    if (match && !window.confirm(`${ui.scanJoin}?`)) return;
    location.href = './?scan=1';
  }, 'game__scanbtn');
  const langBtn = el('button', { className: 'game__exit game__langbtn', type: 'button', onClick: () => openLanguage() });
  const paintLangBtn = () => {
    langBtn.innerHTML = iconSvg('globe');
    langBtn.append(el('span', {}, [LANGUAGES.find(l => l.id === lang)?.short || 'EN']));
  };

  /* The three on/off switches: in the top bar, and again in the profile's settings */
  const chatOn = () => settingsStore.get('chatEnabled') !== false;
  const soundOn = () => !!settingsStore.get('soundEnabled');
  function setChat(next) {
    settingsStore.set('chatEnabled', next);
    showToast(next ? ui.chatOn : ui.chatOff, 1600);
    if (!next) world?.story?.clearTalk();
    paintSwitches();
  }
  function setSound(next) {
    settingsStore.set('soundEnabled', next);
    audioManager.setEnabled(next);
    if (next) { audioManager.unlock(); sfx.play('select'); }
    paintSwitches();
  }
  const chatBtn = iconBtn('chat', () => setChat(!chatOn()));
  const soundBtn = iconBtn('sound', () => setSound(!soundOn()));
  function paintSwitches() {
    setIcon(chatBtn, chatOn() ? 'chat' : 'chatOff');
    setIcon(soundBtn, soundOn() ? 'sound' : 'soundOff');
    [[chatBtn, chatOn()], [soundBtn, soundOn()]].forEach(([b, on]) => {
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('game__exit--off', !on);
    });
  }

  /* ─── Mobile comfort: rotate to landscape, keep the screen awake, haptics ─── */
  const isTouch = window.matchMedia?.('(pointer: coarse)').matches;
  const isLandscape = () => window.matchMedia('(orientation: landscape)').matches;
  const rotateBtn = iconBtn('rotate', () => toggleLandscape(), 'game__rotate');
  rotateBtn.hidden = !isTouch;

  /* On small screens the switches fold away behind one button, so the top bar never overflows */
  const toolsBox = el('div', { className: 'game__tools' }, [rotateBtn, chatBtn, soundBtn]);
  const toolsBtn = iconBtn('sliders', () => toolsBox.classList.toggle('game__tools--open'), 'game__toolsbtn');

  /** Every label on the always-visible controls, for the first paint and after a language change. */
  function paintHud() {
    const label = (b, text) => { b.setAttribute('aria-label', text); b.title = text; };
    label(exitBtn, ui.menuTitle);
    label(profileBtn, ui.profile);
    label(langBtn, ui.language);
    label(scanBtn, ui.scanJoin);
    label(chatBtn, ui.chatLabel);
    label(soundBtn, ui.soundLabel);
    label(rotateBtn, ui.rotateLabel);
    label(toolsBtn, ui.moreLabel);
    label(talkBtn, ui.talk);
    paintLangBtn();
    paintProfileBtn();
    paintSwitches();
    rotateTurnEl.textContent = ui.rotateTurn;
    rotateGoLabel.textContent = ui.rotateBig;
    rotateCloseBtn.setAttribute('aria-label', ui.rotateHide);
    paintMyChit();
  }
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
  const rotateTurnEl = el('span', {});
  const rotateHint = el('div', { className: 'game__rotatehint', attrs: { 'aria-live': 'polite' } }, [
    el('span', { className: 'game__rotatehint-phone', attrs: { 'aria-hidden': 'true' }, html: iconSvg('phone') }),
    rotateTurnEl,
  ]);
  // shown by CSS only on phone-sized touch screens held upright
  const rotateGoLabel = el('span', {});
  const rotateCloseBtn = el('button', {
    className: 'game__rotatepill-close', type: 'button', html: iconSvg('close'),
    onClick: () => {
      rotatePill.hidden = true;
      try { sessionStorage.setItem('chitplay.rotatePillHidden', '1'); } catch {}
    },
  });
  const rotatePill = el('div', { className: 'game__rotatepill' }, [
    el('button', { className: 'game__rotatepill-go', type: 'button', onClick: () => toggleLandscape() }, [
      el('span', { className: 'game__rotatehint-phone', attrs: { 'aria-hidden': 'true' }, html: iconSvg('phone') }), rotateGoLabel,
    ]),
    rotateCloseBtn,
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


  const topBar = el('div', { className: 'game__top' }, [
    exitBtn, roundPill, scoreRow,
    el('div', { className: 'game__top-right' }, [scanBtn, langBtn, toolsBox, toolsBtn, profileBtn]),
  ]);
  // the prompt, the chips and the rotate pill stack at the bottom, so they can never overlap
  const dock = el('div', { className: 'game__dock' }, [prompt, sheet, rotatePill]);
  const screen = el('div', { className: 'screen game', attrs: { 'aria-label': 'CHITPLAY' } }, [
    topBar, myChitEl, talkBtn, quickBar, whisperEl, toast, dock, talkPanel, rotateHint, overlay,
  ]);
  screen.addEventListener('pointerdown', (e) => { if (tapHandler && e.target === screen) tapHandler(e); });

  // whatever sits under the top bar follows its real height, whichever way the phone is held
  const hudObserver = new ResizeObserver(() => {
    const zoom = parseFloat(getComputedStyle(screen).zoom) || 1;
    document.documentElement.style.setProperty('--hud-h', `${Math.ceil(topBar.getBoundingClientRect().bottom / zoom)}px`);
  });
  hudObserver.observe(topBar);

  // a tap anywhere else closes the small pop-ups; the tap still does what it was going to do
  const onOutsideTap = (e) => {
    if (toolsBox.classList.contains('game__tools--open') && !toolsBox.contains(e.target) && !toolsBtn.contains(e.target)) toolsBox.classList.remove('game__tools--open');
    if (!talkPanel.hidden && !talkPanel.contains(e.target) && !talkBtn.contains(e.target)) closeTalk();
  };
  document.addEventListener('pointerdown', onOutsideTap, true);

  // while a big sheet covers the room there's no need to draw it at full speed
  const syncCalm = () => world?.story?.setCalm(sheet.classList.contains('game__sheet--start'));
  const calmObserver = new MutationObserver(syncCalm);
  calmObserver.observe(sheet, { attributes: true, attributeFilter: ['class'] });

  function renderScores(gains = null) {
    clear(scoreRow);
    const totals = net?.role === 'guest' ? guestTotals : match?.totals;
    if (match) tell({ t: 'scores', totals: match.totals, gains });
    players.forEach((p, i) => {
      const gain = gains?.[i];
      scoreRow.appendChild(el('div', {
        className: `game__score${isMe(p) ? ' game__score--me' : ''}`,
        style: { '--chip': p.color },
      }, [
        el('span', { className: 'game__score-name' }, [isMe(p) ? `${p.name} ⭐` : p.name]),
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
  // players talk in speech bubbles only: nothing to wait for but the bubble
  const voice = () => Promise.resolve();

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
  const LOCAL_ONLY = new Set(['actorAt', 'country', 'active', 'preview', 'setLook', 'portrait', 'setPaused', 'setCalm', 'chitsOnMat', 'sinceCut', 'lookKeyOf', 'quality', 'graphics', 'setGraphics']);
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

  onPopup((k) => sfx.play(k || 'reveal'));
  (() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem('chitplay.gate'); sessionStorage.setItem('chitplay.gate', '1'); } catch {}
    if (seen) return;
    const gate = el('div', { className: 'gate', attrs: { 'aria-hidden': 'true' } }, [
      el('div', { className: 'gate__glow' }),
      el('img', { className: 'gate__logo', attrs: { src: 'assets/icon.svg', alt: '', width: '120', height: '120' } }),
      el('strong', { className: 'gate__name' }, ['CHITPLAY']),
      el('span', { className: 'gate__sub' }, ['Welcome to the gaming house']),
      el('span', { className: 'gate__doors' }, [el('i'), el('i')]),
    ]);
    const done = () => { gate.classList.add('gate--out'); setTimeout(() => gate.remove(), 700); };
    gate.addEventListener('pointerdown', () => { audioManager.unlock(); sfx.play('whoosh-in'); done(); });
    document.body.append(gate);
    world?.story?.flyIn?.();
    setTimeout(done, 2300);
  })();
  startReminder(lang);

  /* ─── Start sheet: swipe through the games, then play ─── */
  function chooseSetup() {
    return new Promise((resolve) => {
      // a language change rebuilds the sheet in place, on the same game
      let openedId = cameFromGameLink ? base.id : null;
      cameFromGameLink = false;
      function build() {
        // your pinned games first, then your own country's game
        // the chit game (its name follows the language), then every table game side by side
        const shell = shellText(lang);
        let recent = [];
        try { recent = JSON.parse(localStorage.getItem('chitplay.recent')) || []; } catch {}
        const everyGame = [base.id, ...TABLE_GAMES.map(g => g.slug)];
        // your pinned games come first, then the ones you last started
        const orderNow = () => {
          const pins = profile.pins.filter(id => everyGame.includes(id));
          const seen = recent.filter(id => everyGame.includes(id) && !pins.includes(id));
          return [...pins, ...seen, ...everyGame.filter(id => !pins.includes(id) && !seen.includes(id))];
        };
        let chosen = base.id;
        const tableGame = () => gameBySlug(chosen);
        setRound('CHITPLAY');
        clear(sheet);
        // Everything about the chosen game
        const details = el('div', { className: 'game__chosen' });

        // Start buttons + options (built once)
        const leave = (value) => {
          audioManager.unlock(); sfx.play('select'); haptic(15);
          // a table game plays on its own page; a code or a QR finds the right game by itself
          try { if (value !== 'rejoin' && value !== 'scan') localStorage.setItem('chitplay.recent', JSON.stringify([chosen, ...recent.filter(id => id !== chosen)].slice(0, 8))); } catch {}
          const table = tableGame();
          if (table && value !== 'rejoin' && value !== 'scan') {
            location.href = `play/?game=${table.slug}&mode=${value}&n=${seatsFor(table)}${table.modes ? `&style=${styleFor(table)}` : ''}${table.skill ? `&level=${levelFor(table)}` : ''}${table.rules && rulesFor(table).length ? `&rules=${rulesFor(table).join(',')}` : ''}`;
            return;
          }
          lobbyBack = null;
          homeLeave = null;
          sheet.className = 'game__sheet'; onModeChange = null; resolve(value);
        };
        const bigPlay = (iconName, label, sub, value) => el('button', {
          className: 'game__choice game__choice--primary game__choice--icon', type: 'button', onClick: () => leave(value),
        }, [
          el('span', { className: 'game__choice-ico', html: iconSvg(iconName) }),
          el('span', { className: 'game__choice-text' }, [el('strong', {}, [label]), el('span', {}, [sub])]),
        ]);
        const tile = (iconName, label, sub, value) => el('button', {
          className: 'game__tile', type: 'button', attrs: { title: sub }, onClick: () => leave(value),
        }, [el('span', { className: 'game__tile-ico', html: iconSvg(iconName) }), el('span', { className: 'game__tile-label' }, [label])]);

        // how many are playing, for a table game: remembered for each game
        const seatsFor = (g) => {
          let n = g.seats;
          try { n = Number(localStorage.getItem(`chitplay.seats.${g.slug}`)) || n; } catch {}
          return Math.min(g.max, Math.max(g.min, n));
        };
        const styleFor = (g) => {
          let s = null;
          try { s = localStorage.getItem(`chitplay.style.${g.slug}`); } catch {}
          return g.modes?.some(m => m[0] === s) ? s : g.modes?.[0]?.[0];
        };
        const levelFor = (g) => {
          let s = null;
          try { s = localStorage.getItem('chitplay.level'); } catch {}
          return ['easy', 'normal', 'hard'].includes(s) ? s : (g.slug && 'normal');
        };
        const levelPicker = el('div', { className: 'game__rounds' });
        const paintLevel = () => {
          const g = tableGame();
          clear(levelPicker);
          levelPicker.hidden = !g?.skill;
          if (levelPicker.hidden) return;
          levelPicker.append(el('span', { className: 'game__rounds-label' }, [shell.level]), ...['easy', 'normal', 'hard'].map(id => el('button', {
            className: `game__pill${id === levelFor(g) ? ' game__pill--on' : ''}`, type: 'button', attrs: { 'aria-pressed': String(id === levelFor(g)) },
            onClick: () => { try { localStorage.setItem('chitplay.level', id); } catch {} haptic(10); paintLevel(); },
          }, [shell[id]])));
        };
        const rulesFor = (g) => { try { const r = JSON.parse(localStorage.getItem(`chitplay.rules.${g.slug}`)); return Array.isArray(r) ? r.filter(k => g.rules?.some(x => x[0] === k)) : []; } catch { return []; } };
        const rulesBox = el('div', { className: 'game__houserules' });
        const paintRules = () => {
          const g = tableGame();
          clear(rulesBox);
          rulesBox.hidden = !g?.rules;
          if (rulesBox.hidden) return;
          const on = rulesFor(g);
          rulesBox.append(el('strong', {}, ['House rules']), ...g.rules.map(([k, label, help]) => {
            const box = el('input', { attrs: { type: 'checkbox', ...(on.includes(k) ? { checked: 'checked' } : {}) } });
            box.addEventListener('change', () => {
              const next = new Set(rulesFor(g));
              if (box.checked) next.add(k); else next.delete(k);
              try { localStorage.setItem(`chitplay.rules.${g.slug}`, JSON.stringify([...next])); } catch {}
              haptic(8);
            });
            return el('label', { className: 'game__house-rule' }, [box, el('span', {}, [el('b', {}, [label]), ` ${help}`])]);
          }));
        };
        const stylePicker = el('div', { className: 'game__rounds' });
        const paintStyles = () => {
          const g = tableGame();
          clear(stylePicker);
          stylePicker.hidden = !g?.modes;
          if (stylePicker.hidden) return;
          stylePicker.append(el('span', { className: 'game__rounds-label' }, [shell.mode]), ...g.modes.map(([id, label, help]) => el('button', {
            className: `game__pill${id === styleFor(g) ? ' game__pill--on' : ''}`, type: 'button', attrs: { title: help, 'aria-pressed': String(id === styleFor(g)) },
            onClick: () => {
              try { localStorage.setItem(`chitplay.style.${g.slug}`, id); } catch {}
              haptic(10);
              paintStyles();
            },
          }, [label])));
        };
        const seatPicker = el('div', { className: 'game__rounds' });
        const paintSeats = () => {
          const g = tableGame();
          clear(seatPicker);
          seatPicker.hidden = !g || g.min === g.max;
          if (seatPicker.hidden) return;
          const sizes = [];
          for (let n = g.min; n <= Math.min(g.max, 6); n++) sizes.push(n);
          seatPicker.append(el('span', { className: 'game__rounds-label' }, [shell.players]), ...sizes.map(n => el('button', {
            className: `game__pill${n === seatsFor(g) ? ' game__pill--on' : ''}`, type: 'button', attrs: { 'aria-pressed': String(n === seatsFor(g)) },
            onClick: () => {
              try { localStorage.setItem(`chitplay.seats.${g.slug}`, String(n)); } catch {}
              haptic(10);
              paintSeats();
        paintStyles();
        paintLevel();
        paintRules();
            },
          }, [String(n)])));
        };
        const roundsNow = () => (ROUND_OPTIONS.includes(settingsStore.get('matchRounds')) ? settingsStore.get('matchRounds') : DEFAULT_ROUNDS);
        const rounds = el('div', { className: 'game__rounds' }, [
          el('span', { className: 'game__rounds-label' }, [ui.rounds]),
          ...ROUND_OPTIONS.map(n => el('button', {
            className: `game__pill${n === roundsNow() ? ' game__pill--on' : ''}`, type: 'button', attrs: { 'data-n': String(n) },
            onClick: () => {
              settingsStore.set('matchRounds', n);
              rounds.querySelectorAll('.game__pill').forEach(p => p.classList.toggle('game__pill--on', p.dataset.n === String(n)));
            },
          }, [String(n)])),
        ]);

        // who you are: your character, name and rank, one tap from your profile
        const playerFace = el('span', { className: 'game__avatar' });
        const playerName = el('strong', {});
        const playerRank = el('span', {});
        const playerCard = el('button', { className: 'game__playercard', type: 'button', attrs: { 'aria-label': ui.profile }, onClick: () => openProfile() }, [
          playerFace,
          el('span', { className: 'game__playercard-text' }, [playerName, playerRank]),
          el('span', { className: 'game__playercard-go', html: iconSvg('right') }),
        ]);
        rankRefresh = () => {
          const rank = profile.rank;
          playerFace.innerHTML = faceHtml(portraitSvg(profile.look));
          playerName.textContent = profile.name;
          playerRank.textContent = `${rank.icon} ${fmt(ui.rankLine, {
            title: rankTitle(rank), pts: profile.all.points.toLocaleString('en'),
            streak: profile.streak > 1 ? fmt(ui.streak, { n: profile.streak }) : '',
          })}`;
        };
        rankRefresh();
        // today's challenges and your coins, one tap from the rewards
        const dailyPill = el('button', { className: 'game__dailypill', type: 'button', onClick: () => openProfile({ tab: 'rewards' }) });
        const paintDaily = () => {
          const d = profile.daily;
          clear(dailyPill);
          dailyPill.append(
            el('span', { className: 'game__dailypill-ico', html: iconSvg('target') }),
            el('span', {}, [fmt(ui.dailyShort, { n: d.items.filter(i => i.done).length })]),
            el('span', { className: 'game__dailypill-coins' }, [el('span', { html: iconSvg('coin') }), String(profile.coins)]),
          );
          dailyPill.setAttribute('aria-label', `${ui.rewards}: ${fmt(ui.dailyShort, { n: d.items.filter(i => i.done).length })}, ${profile.coins} ${ui.coins}`);
        };
        paintDaily();
        // the first visit of the day: today's reward
        // only while the start screen is still up: never over a match or a room the player already chose
        if (!profile.login.claimed) later(700, () => { if (alive && !match && !net && overlay.hidden && sheet.classList.contains('game__sheet--start')) openLoginReward(paintDaily); });
        const baseRefresh = rankRefresh;
        rankRefresh = () => { baseRefresh(); paintDaily(); };

        const rankStrip = el('div', { className: 'rankline rankline--home' });
        const paintRank = () => {
          const rp = rankProgress();
          clear(rankStrip);
          const fill = el('i');
          fill.style.width = `${Math.round(rp.share * 100)}%`;
          rankStrip.append(el('span', {}, [`${rp.icon} ${rp.title}`]), el('div', { className: 'rankbar' }, [fill]), el('small', {}, [rp.next ? `${rp.points.toLocaleString('en')} / ${rp.next.at.toLocaleString('en')} → ${rp.next.icon}` : rp.points.toLocaleString('en')]));
        };
        paintRank();
        const ticket = loadRejoin();
        const legalLinksNow = () => legalLinks();

        /* A: what you see when ChitPlay opens: every game, with search and pins */
        const entries = () => [
          { id: base.id, slug: 'cops', name: country.game, icon: GAME_ICON[base.id], kind: 'Party', accent: '#b5341f', blurb: ['king', 'queen', 'detective', 'thief'].map(r => country.roles[r].name).join(' · '), aka: [GAME_NAME_EN[base.id], ...(GAME_AKA[base.id] || []), 'raja rani chor police sipahi mafia cops robbers'].join(' ') },
          ...TABLE_GAMES.map(g => ({ id: g.slug, slug: g.slug, name: g.name, icon: g.icon, kind: g.kind, also: g.also, hot: g.hot, video: g.video, accent: g.accent, blurb: g.blurb, aka: g.aka || '' })),
        ];
        const pinButton = (id, onChange) => {
          const star = el('button', {
            className: 'game__pin', type: 'button',
            onClick: (e) => { e.stopPropagation(); profile.togglePin(id); haptic(10); paint(); onChange?.(); },
          });
          const paint = () => {
            const on = profile.isPinned(id);
            star.innerHTML = iconSvg(on ? 'starOn' : 'star');
            star.classList.toggle('game__pin--on', on);
            star.setAttribute('aria-label', on ? ui.pinRemove : ui.pinAdd);
            star.setAttribute('aria-pressed', String(on));
          };
          paint();
          return star;
        };
        let kind = '';
        const search = el('input', { className: 'allgames__search', attrs: { type: 'search', placeholder: shell.search, 'aria-label': shell.search, enterkeyhint: 'search' } });
        const grid = el('div', { className: 'allgames__grid' });
        const hotRow = el('div', { className: 'hotrow' });
        const recentRow = el('div', { className: 'hotrow recent' });
        const carryRow = el('div', { className: 'hotrow recent' });
        
        function hotList() {
          try { const h = JSON.parse(localStorage.getItem('chitplay.hot')); if (Array.isArray(h) && h.length) return h.filter(id => everyGame.includes(id)); } catch {}
          return HOT_DEFAULT;
        }
        /* choose your own hot games: as many as you like, never none */
        function editHot() {
          let list = hotList();
          const body = el('div', { className: 'hotedit__list' });
          const paint = () => {
            clear(body);
            body.append(...entries().map(g => el('button', { className: `hotedit__item${list.includes(g.id) ? ' on' : ''}`, type: 'button', attrs: { 'aria-pressed': String(list.includes(g.id)) }, onClick: async () => {
              if (list.includes(g.id)) {
                if (list.length === 1) { await notice({ icon: '🔥', title: 'Keep at least one hot game', body: 'Add another game to Hot first, then take this one off.' }); return; }
                list = list.filter(x => x !== g.id);
              } else list = [...list, g.id];
              try { localStorage.setItem('chitplay.hot', JSON.stringify(list)); } catch {}
              paint();
            } }, [el('span', { html: logoSvg(g, 40) }), el('strong', {}, [g.name]), el('small', {}, [list.includes(g.id) ? '🔥 In Hot' : '+ Add'])])));
          };
          const box = el('div', { className: 'myroom hotedit', attrs: { role: 'dialog', 'aria-label': 'Hot games' } }, [
            el('div', { className: 'myroom__head' }, [el('strong', {}, ['🔥 Your hot games']), el('button', { className: 'allgames__close', type: 'button', attrs: { 'aria-label': shell.close }, onClick: () => { box.remove(); paintList(); } }, ['✕'])]),
            el('p', { className: 'game__netnote' }, ['Tap to add or take off. Keep as many as you like.']),
            body,
            el('button', { className: 'game__back', type: 'button', onClick: () => { try { localStorage.removeItem('chitplay.hot'); } catch {} list = HOT_DEFAULT.slice(); paint(); } }, ['Back to the usual hot games']),
          ]);
          paint();
          document.body.append(box);
        }
        const chips = el('div', { className: 'allgames__chips' });
        const kinds = ['', ...CATEGORIES];
        function paintList() {
          const q = search.value.trim().toLowerCase();
          const rank = orderNow();
          const found = entries()
            .filter(g => (!kind || g.kind === kind) && (!q || `${g.name} ${g.aka} ${g.kind}`.toLowerCase().includes(q)))
            .sort((a, b) => rank.indexOf(a.id) - rank.indexOf(b.id));
          clear(chips);
          chips.append(...kinds.map(k => el('button', { className: `allgames__chip${k === kind ? ' on' : ''}`, type: 'button', attrs: { 'aria-pressed': String(k === kind) }, onClick: () => { kind = k; paintList(); } }, [k || shell.allGames])));
          clear(grid);
          const hotIds = hotList();
          const hot = !q && !kind ? hotIds.map(id => entries().find(g => g.id === id)).filter(Boolean) : [];
          hotRow.hidden = !hot.length;
          clear(hotRow);
          if (hot.length) {
            hotRow.append(el('div', { className: 'hotrow__head' }, [el('h2', { className: 'hotrow__title' }, ['🔥 Hot right now']), el('button', { className: 'hotrow__edit', type: 'button', onClick: () => editHot() }, ['✏️ Edit'])]), el('div', { className: 'hotrow__list' }, hot.map(g => el('button', {
              className: 'hotcard', type: 'button', style: { '--accent': g.accent }, onClick: () => { sfx.play('select'); haptic(10); showGame(g.id); },
            }, [
              el('span', { className: 'hotcard__logo', attrs: { 'aria-hidden': 'true' }, html: logoSvg(g, 88) }),
              el('strong', {}, [g.name]),
              el('small', {}, [bestOf(g.id) ? `🏅 Best ${bestOf(g.id)}` : '▶ Tap to play']),
            ]))));
          }
          // games in progress: carry on with one tap
          clear(carryRow);
          const going = !q && !kind ? savedList().map(x => gameBySlug(x.slug)).filter(Boolean).slice(0, 4) : [];
          carryRow.hidden = !going.length;
          if (going.length) carryRow.append(el('h2', { className: 'hotrow__title' }, ['⏯️ Carry on']), el('div', { className: 'recent__list' }, going.map(g => el('a', { className: 'recent__game carry', attrs: { href: `play/?game=${g.slug}&mode=play`, 'aria-label': `Carry on ${g.name}` } }, [el('span', { html: logoSvg(g, 52) }), el('small', {}, [g.name])]))));
          // the games you played last, one tap away
          clear(recentRow);
          const rec = !q && !kind ? recent.filter(id => everyGame.includes(id)).slice(0, 6) : [];
          recentRow.hidden = !rec.length;
          if (rec.length) recentRow.append(el('h2', { className: 'hotrow__title' }, ['🕘 Recently played']), el('div', { className: 'recent__list' }, rec.map((id) => { const g = entries().find(x => x.id === id); return g ? el('button', { className: 'recent__game', type: 'button', attrs: { 'aria-label': g.name }, onClick: () => { sfx.play('select'); showGame(g.id); } }, [el('span', { html: logoSvg(g, 52) }), el('small', {}, [g.name])]) : null; })));
          if (!found.length) grid.append(el('p', { className: 'allgames__none' }, [shell.none]));
          grid.append(...found.map(g => el('div', { className: 'allgames__box', style: { '--accent': g.accent } }, [
            el('button', { className: 'allgames__open', type: 'button', attrs: { 'aria-label': g.name }, onClick: () => { sfx.play('select'); haptic(10); showGame(g.id); } }, [
              el('span', { className: 'allgames__logo', attrs: { 'aria-hidden': 'true' }, html: logoSvg(g, 76) }),
              el('strong', {}, [g.name]),
              el('small', {}, [g.blurb]),
              g.video && bestOf(g.id) ? el('em', { className: 'allgames__best' }, [`🏅 Best ${bestOf(g.id)}`]) : null,
            ]),
            pinButton(g.id, paintList),
          ])));
        }
        search.addEventListener('input', paintList);
        const listView = el('div', { className: 'game__list' }, [
          el('div', { className: 'game__list-me' }, [playerCard, dailyPill]),
          el('div', { className: 'game__list-row' }, [rankStrip, el('button', { className: 'game__roombtn', type: 'button', onClick: () => openMyRoom() }, ['🛋️ My Room'])]),
          ...(ticket?.left ? [bigPlay('restart', ui.rejoinBtn, fmt(ui.rejoinSub, { code: ticket.code }), 'rejoin')] : []),
          search,
          chips,
          el('div', { className: 'game__list-scroll' }, [carryRow, hotRow, recentRow, grid, legalLinksNow()]),
        ]);

        /* My Room: make the gaming house your own, and show it off */
        function openMyRoom() {
          const st = world?.story;
          if (!st?.setRoomStyle) { showToast('Your room needs 3D graphics.', 2600); return; }
          document.querySelector('.myroom')?.remove();
          const pick = (key, value) => { st.setRoomStyle({ [key]: value }); sfx.play('select'); haptic(8); paint(); };
          const MOOD = [['warm', '🕯️ Warm'], ['cool', '❄️ Cool'], ['sunset', '🌇 Sunset'], ['neon', '🟣 Neon night', { wins: 10 }], ['disco', '🪩 Disco', { achievements: 4 }]];
          // how far the player has come: the best things open up with wins, achievements and rank
          const progress = () => ({ wins: Object.values(playStats().wins || {}).reduce((x, y) => x + y, 0), achievements: achievementList().filter(a => a.done).length, rank: rankProgress().index || 0 });
          const DECO_NEED = { fairy: { wins: 3 }, neon: { achievements: 2 } };
          const lockedNote = (why) => showToast(`${why} to unlock this`, 2600);
          const WALLS = [['', 'Classic'], ['#ffd9a8', 'Peach'], ['#bfe6c8', 'Mint'], ['#c9d6ff', 'Sky'], ['#ffc2d4', 'Rose'], ['#d9c2ff', 'Lilac'], ['#8f8f8f', 'Slate']];
          const head = el('div', { className: 'myroom__level' });
          const body = el('div', { className: 'myroom__body' });
          let tab = 'shop';
          let previewing = null;            // a theme being tried on before buying
          const ownTheme = st.roomStyle.theme || '';
          const tabs = el('div', { className: 'myroom__tabs' });
          const stopPreview = () => { if (previewing != null) { previewing = null; st.setRoomStyle({ theme: decorState().themes.includes(st.roomStyle.theme) ? st.roomStyle.theme : ownTheme }); } };
          const close = () => { stopPreview(); if (!decorState().themes.includes(st.roomStyle.theme) && st.roomStyle.theme) st.setRoomStyle({ theme: '' }); box.remove(); st.roomView?.(false); document.body.classList.remove('room-edit'); };
          setTimeout(() => st.roomView?.(true, box), 0);
          // only the room and its panel while you decorate: the game list steps aside
          document.body.classList.add('room-edit');
          const celebrate = (before, what) => {
            const after = roomLevel();
            sfx.play('achieve');
            haptic([10, 40, 10]);
            if (after.level > before.level) showToast(`🏠 Room level ${after.level}: ${after.title}!`, 3600);
            else showToast(`🎉 ${what} is in your room!`, 2400);
          };
          const buyDecor = async (d) => {
            const why = lockedBy(d.need, progress());
            if (why) { lockedNote(why); return; }
            if (!(await confirmSpend({ what: d.name, price: d.price, coins: profile.coins, icon: d.icon }))) return;
            if (!profile.spend(d.price)) return;
            const before = roomLevel();
            const ds = decorState();
            ds.owned.push(d.id);
            const free = spotsFor(d).find(s2 => !Object.values(ds.placed).includes(s2.id));
            if (free) ds.placed[d.id] = free.id;
            saveDecor(ds);
            st.placeDecor();
            celebrate(before, d.name);
            if (!free) showToast(`${d.icon} ${d.name} is in your bag: make space for it in My things`, 3200);
            paintDaily?.();
            paint();
          };
          const buyTheme = async (t) => {
            const why = lockedBy(t.need, progress());
            if (why) { lockedNote(why); return; }
            if (!(await confirmSpend({ what: `${t.name} theme`, price: t.price, coins: profile.coins, icon: t.icon }))) return;
            if (!profile.spend(t.price)) return;
            const before = roomLevel();
            const ds = decorState();
            ds.themes.push(t.id);
            saveDecor(ds);
            previewing = null;
            st.setRoomStyle({ theme: t.id, mood: t.mood || st.roomStyle.mood });
            celebrate(before, `The ${t.name} look`);
            paint();
          };
          const place = (id, spotId) => {
            const ds = decorState();
            // whatever was in that spot goes back to the bag
            Object.keys(ds.placed).forEach((k) => { if (ds.placed[k] === spotId) delete ds.placed[k]; });
            if (spotId) ds.placed[id] = spotId; else delete ds.placed[id];
            saveDecor(ds);
            st.placeDecor();
            sfx.play('select');
            paint();
          };
          const tag = (rarity) => el('small', { className: 'myroom__rarity', style: { '--r': RARITY[rarity].color } }, [RARITY[rarity].name]);
          const paintHead = () => {
            const lv = roomLevel();
            clear(head);
            head.append(
              el('div', { className: 'myroom__lvtop' }, [el('strong', {}, [`🏠 Lv ${lv.level} · ${lv.title}`]), el('span', { className: 'myroom__coins' }, [el('span', { html: iconSvg('coin') }), String(profile.coins)])]),
              el('div', { className: 'myroom__lvbar' }, [el('i', { style: { width: `${Math.round(lv.share * 100)}%` } })]),
              el('small', {}, [lv.next ? `${lv.next.at - lv.points} more room points to “${lv.next.title}”. Rarer things give more.` : 'The greatest gaming house there is!']),
            );
          };
          const paint = () => {
            const now = st.roomStyle;
            const p = progress();
            paintHead();
            clear(tabs);
            tabs.append(...[['shop', '🛍️ Shop'], ['themes', '🎨 Themes'], ['mine', '🎒 My things'], ['lights', '💡 Lights']].map(([id, label]) => el('button', { className: `myroom__opt${tab === id ? ' on' : ''}`, type: 'button', onClick: () => { if (tab === 'themes' && id !== 'themes') stopPreview(); tab = id; paint(); } }, [label])));
            clear(body);
            const ds = decorState();
            if (tab === 'shop') {
              Object.keys(RARITY).forEach((r) => {
                const list = DECOR.filter(d => d.rarity === r);
                body.append(el('h3', { className: 'myroom__group', style: { '--r': RARITY[r].color } }, [`${RARITY[r].name} · ${list.filter(d => ds.owned.includes(d.id)).length}/${list.length}`]), el('div', { className: 'myroom__shop' }, list.map((d) => {
                  const why = lockedBy(d.need, p);
                  const mine = ds.owned.includes(d.id);
                  return el('div', { className: `myroom__item${mine ? ' owned' : ''}${why ? ' locked' : ''}`, style: { '--r': RARITY[r].color } }, [
                    el('span', { className: 'myroom__icon' }, [d.icon]), el('strong', {}, [d.name]),
                    mine ? el('small', { className: 'myroom__ok' }, ['✓ In your room']) : why ? el('small', { className: 'myroom__lock' }, [why]) : el('button', { className: `game__buy${profile.coins < d.price ? ' short' : ''}`, type: 'button', onClick: () => buyDecor(d) }, [el('span', { html: iconSvg('coin') }), String(d.price)]),
                  ]);
                })));
              });
              return;
            }
            if (tab === 'themes') {
              body.append(el('p', { className: 'game__netnote' }, ['A theme changes the whole room: floor, mat, walls and light. Try one on before you buy it.']), el('div', { className: 'myroom__shop' }, THEMES.map((t) => {
                const owned = !t.id || ds.themes.includes(t.id);
                const using = (now.theme || '') === t.id;
                const why = lockedBy(t.need, p);
                return el('div', { className: `myroom__item${using ? ' owned' : ''}${why && !owned ? ' locked' : ''}`, style: { '--r': RARITY[t.rarity].color } }, [
                  el('span', { className: 'myroom__icon' }, [t.icon]), el('strong', {}, [t.name]), t.id ? tag(t.rarity) : el('small', {}, [t.note]),
                  using && previewing == null ? el('small', { className: 'myroom__ok' }, ['✓ Using']) : owned
                    ? el('button', { className: 'game__buy', type: 'button', onClick: () => { previewing = null; pick('theme', t.id); if (t.mood) st.setRoomStyle({ mood: t.mood }); } }, ['Use'])
                    : el('div', { className: 'myroom__pair' }, [
                      el('button', { className: 'myroom__try', type: 'button', onClick: () => { previewing = t.id; st.setRoomStyle({ theme: t.id }); sfx.play('select'); paint(); } }, [previewing === t.id ? '👁️ Trying' : '👁️ Try']),
                      why ? el('small', { className: 'myroom__lock' }, [why]) : el('button', { className: `game__buy${profile.coins < t.price ? ' short' : ''}`, type: 'button', onClick: () => buyTheme(t) }, [el('span', { html: iconSvg('coin') }), String(t.price)]),
                    ]),
                ]);
              })));
              return;
            }
            if (tab === 'mine') {
              if (!ds.owned.length) { body.append(el('p', { className: 'game__netnote' }, ['Nothing yet. Win games, collect coins, and buy things in the Shop.'])); return; }
              body.append(el('p', { className: 'game__netnote' }, ['Choose where each thing goes. Picking a taken spot swaps them.']), ...ds.owned.map((id) => {
                const d = decorOf(id);
                if (!d) return null;
                const sel = el('select', { className: 'myroom__select', attrs: { 'aria-label': `Where to put ${d.name}` } }, [el('option', { attrs: { value: '' } }, ['In my bag']), ...spotsFor(d).map(s2 => el('option', { attrs: { value: s2.id, ...(ds.placed[id] === s2.id ? { selected: 'selected' } : {}) } }, [s2.name]))]);
                sel.addEventListener('change', () => place(id, sel.value));
                return el('div', { className: 'myroom__item myroom__item--row', style: { '--r': RARITY[d.rarity].color } }, [el('span', { className: 'myroom__icon' }, [d.icon]), el('strong', {}, [d.name]), sel]);
              }));
              return;
            }
            body.append(
              el('h3', {}, ['Light']),
              el('div', { className: 'myroom__row' }, MOOD.map(([id, label, need]) => { const why = lockedBy(need, p); return el('button', { className: `myroom__opt${now.mood === id ? ' on' : ''}${why ? ' locked' : ''}`, type: 'button', attrs: { 'aria-pressed': String(now.mood === id), title: why || label }, onClick: () => (why ? lockedNote(why) : pick('mood', id)) }, [why ? `🔒 ${label.split(' ').slice(1).join(' ')}` : label]); })),
              el('h3', {}, ['Wall tint']),
              el('div', { className: 'myroom__row' }, WALLS.map(([c, label]) => el('button', { className: `myroom__swatch${now.wall === c ? ' on' : ''}`, type: 'button', style: { '--c': c || '#e6dcc6' }, attrs: { 'aria-label': label, title: label, 'aria-pressed': String(now.wall === c) }, onClick: () => pick('wall', c) }))),
              el('h3', {}, ['Party lights']),
              el('div', { className: 'myroom__row' }, [
                ...[['fairy', '✨ Fairy lights'], ['neon', '💡 Neon strips']].map(([k, label]) => { const why = lockedBy(DECO_NEED[k], p); return el('button', { className: `myroom__opt${now[k] ? ' on' : ''}${why ? ' locked' : ''}`, type: 'button', attrs: { 'aria-pressed': String(!!now[k]), title: why || label }, onClick: () => (why ? lockedNote(why) : pick(k, !now[k])) }, [why ? `🔒 ${label.split(' ').slice(1).join(' ')}` : label]); }),
              ]),
            );
          };
          const lookAround = el('button', { className: 'game__choice', type: 'button', onClick: () => {
            document.body.classList.add('room-only');
            const exit = el('button', { className: 'roomonly-exit', type: 'button' }, ['✕ Tap anywhere to come back']);
            const back = () => { document.body.classList.remove('room-only'); exit.remove(); removeEventListener('pointerdown', onTap, true); };
            const onTap = (e) => { e.preventDefault(); e.stopPropagation(); back(); };
            document.body.append(exit);
            setTimeout(() => addEventListener('pointerdown', onTap, true), 250);
            sfx.play('select');
          } }, [el('strong', {}, ['👁️ See the whole room'])]);
          const share = el('button', { className: 'game__choice game__choice--primary', type: 'button', onClick: async () => {
            close();
            await new Promise(r => setTimeout(r, 120));
            const url = st.snapshot();
            try {
              const blob = await (await fetch(url)).blob();
              const file = new File([blob], 'my-chitplay-room.jpg', { type: 'image/jpeg' });
              if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'My ChitPlay room', text: `My gaming room on ChitPlay is ${roomLevel().title}!` }); return; }
            } catch { /* cancelled, or this browser can't share files */ }
            const a = document.createElement('a');
            a.href = url; a.download = 'my-chitplay-room.jpg';
            document.body.append(a); a.click(); a.remove();
            showToast('Saved a picture of your room', 2400);
          } }, [el('strong', {}, ['📸 Show off my room'])]);
          const box = el('div', { className: 'myroom', attrs: { role: 'dialog', 'aria-label': 'My Room' } }, [
            el('div', { className: 'myroom__head' }, [el('strong', {}, ['🛋️ My Room']), el('button', { className: 'allgames__close', type: 'button', attrs: { 'aria-label': shell.close }, onClick: close }, ['✕'])]),
            head,
            tabs,
            body,
            el('div', { className: 'myroom__actions' }, [lookAround, share]),
          ]);
          paint();
          document.body.append(box);
        }

        try { if (sessionStorage.getItem('chitplay.openRoom')) { sessionStorage.removeItem('chitplay.openRoom'); setTimeout(() => openMyRoom(), 700); } } catch {}

        /* B: one game: how to play it, and every way of playing it */
        const onlineBtn = el('button', { className: 'game__choice game__choice--icon game__choice--online', type: 'button', onClick: () => leave('online') }, [
          el('span', { className: 'game__choice-ico', html: iconSvg('globe') }),
          el('span', { className: 'game__choice-text' }, [el('strong', {}, [ui.online]), el('span', {}, [ui.onlineSub])]),
        ]);
        const head = el('div', { className: 'game__gamehead' });
        const pick = el('div', { className: 'game__home-pick' }, [head]);
        const go = el('div', { className: 'game__home-go' }, [
          bigPlay('play', shell.guestPlay, ui.playSub, 'play'),
          // strangers from anywhere: random matching on free public tables
          onlineBtn,
          el('div', { className: 'game__tiles game__tiles--three' }, [
            tile('eye', ui.watch, ui.watchSub, 'watch'),
            tile('phone', ui.pass, ui.passSub, 'pass'),
            tile('wifi', ui.nearby, ui.nearbySub, 'nearby'),
          ]),
          rounds,
          seatPicker,
          stylePicker,
          levelPicker,
          rulesBox,
        ]);
        function showList() {
          openedId = null;
          lobbyBack = null;
          sheet.className = 'game__sheet game__sheet--show game__sheet--start game__sheet--list';
          sheet.replaceChildren(listView);
          paintList();
          rankRefresh();
          paintRank();
          checkUnlocks();
        }
        function showGame(id) {
          openedId = id;
          select(id);
          const e = entries().find(x => x.id === id);
          clear(head);
          head.style.setProperty('--accent', e.accent);
          head.append(
            el('button', { className: 'game__gameback', type: 'button', attrs: { 'aria-label': shell.allGames }, html: iconSvg('left'), onClick: () => showList() }),
            el('span', { className: 'game__gamelogo', attrs: { 'aria-hidden': 'true' }, html: logoSvg(e, 64) }),
            el('span', { className: 'game__gamename' }, [el('strong', {}, [e.name]), el('small', {}, [e.blurb])]),
            pinButton(id),
          );
          const st = playStats();
          const bestLine = st.best[id] ? `🏅 Your best: ${st.best[id]}. Can you beat it?` : st.plays[id] ? `🎮 Played ${st.plays[id]} · won ${st.wins[id] || 0}. Go for another win!` : '✨ New for you: give it a try!';
          head.append(el('p', { className: 'game__bestline' }, [bestLine]));
          sheet.className = 'game__sheet game__sheet--show game__sheet--start game__sheet--home';
          sheet.replaceChildren(pick, go, details);
          sheet.scrollTop = 0;
          // the phone's Back button returns to the list, not out of the site
          armBackGuard();
          lobbyBack = () => showList();
        }
        homeLeave = leave;
        paintSeats();
        paintStyles();
        paintLevel();
        paintRules();

        function legalLinks() { return el('nav', { className: 'game__legal', attrs: { 'aria-label': ui.about } }, [
          ['games/', `🎲 ${shell.guides}`], ['about/', ui.about], ['contact/', ui.contact], ['privacy/', ui.privacy], ['terms/', ui.terms],
        ].map(([href, label]) => el('a', { attrs: { href } }, [label]))); }

        function fillDetails() {
          clear(details);
          const table = tableGame();
          if (table) {
            details.append(
              el('h2', { className: 'game__title sr-only' }, [table.name]),
              el('p', { className: 'game__sub' }, [`${table.kind} · ${table.min === table.max ? table.min : `${table.min}–${table.max}`} · ${table.minutes} min`]),
              el('a', { className: 'game__choice game__choice--howto', attrs: { href: `games/${table.slug}/` } }, [el('strong', {}, [`❓ ${ui.howto}`])]),
              legalLinks(),
            );
            return;
          }
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
              el('summary', {}, [el('span', { html: iconSvg('book') }), ui.howto]),
              el('p', { className: 'game__sub' }, [ui.classicRules]),
              el('div', { className: 'game__house' }, [
                el('strong', {}, [ui.houseRules]),
                ...HOUSE_RULES.map(r => {
                  const box = el('input', { attrs: { type: 'checkbox', ...(houseRules().includes(r) ? { checked: 'checked' } : {}) } });
                  box.addEventListener('change', () => {
                    const next = new Set(houseRules());
                    if (box.checked) next.add(r); else next.delete(r);
                    settingsStore.set('houseRules', [...next]);
                    country = oneGame(base);
                    fillDetails();
                  });
                  return el('label', { className: 'game__house-rule' }, [box, el('span', {}, [ui[`house_${r}`]])]);
                }),
              ]),
              el('p', { className: 'game__aka' }, [
                `${(GAME_AKA[base.id] || []).slice(0, 5).join(' · ')} · `,
                el('a', { className: 'game__howto', attrs: { href: 'games/cops-and-robbers/' } }, ['→']),
              ]),
              seoIntro,
            ]),
            // always visible, so visitors and ad-network reviewers can find these pages
            legalLinks(),
          );
        }

        function select(id) {
          chosen = id;
          const table = gameBySlug(id);
          rounds.hidden = !!table;
          paintSeats();
          paintStyles();
          paintLevel();
          paintRules();
          if (table) {
            fillDetails();
            return;
          }
          base = COUNTRIES[id];
          country = oneGame(base);
          ui = uiFor();
          // the start sheet shows instantly; the 3D room catches up when it's loaded
          world?.story?.setCountry(country, { soon: true });
          previewTable();
          // a plain visit keeps its clean / address: analytics counts a rewrite as a second page view
          // the address stays clean: a refresh always comes back to where you were, not to a game page
          loadPack(chatPack());
          fillDetails();
        }

        select(openedId && everyGame.includes(openedId) ? openedId : base.id);
        if (openedId && everyGame.includes(openedId)) showGame(openedId); else showList();
      }
      onModeChange = build;
      build();
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
      const h = match.guesser;
      let standIn = null;
      const done = (idx) => {
        if (busy || !pool.includes(idx)) return;
        cancelLater(standIn);
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
      // friends shouldn't wait forever for a host who walked away
      if (isHost()) {
        const away = () => {
          if (busy) { standIn = later(2000, away); return; }
          const text = fmt(ui.botPlayed, { name: players[h].name });
          showToast(text, 3200);
          tell({ t: 'toast', text, ms: 3200 });
          done(pool[Math.floor(Math.random() * pool.length)]);
        };
        standIn = later(AWAY_SECONDS * 1000, away);
      }
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
      timeout: AWAY_SECONDS * 1000, allowed: allowed.slice(), canCheat: cheatOk,
      fallback: () => {
        const note = fmt(ui.botPlayed, { name: players[seat].name });
        showToast(note, 3200);
        tell({ t: 'toast', text: note, ms: 3200 });
        return fallback();
      },
    }).then((idx) => { showPrompt(''); noteOthers(seat, ''); return idx; });
  }

  async function onGuestMessage(id, msg) {
    const seat = players.findIndex(p => p.remote === id);
    if (msg.t === 'setGame') { if (!net?.public && !matchRunning && COUNTRIES[msg.game]) { changeRoomGame(msg.game); net.repaint?.(); } return; }
    if (msg.t === 'emoji' && seat >= 0) { deliverEmoji(seat, msg.to, msg.i); return; }
    if (msg.t === 'whisper' && seat >= 0) { deliverWhisper(seat, msg.to, msg.line); return; }
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
    const seat = players.findIndex(p => p.remote === id);
    if (seat < 0) return;
    players[seat].remote = null;
    const job = pending.get(seat);
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
    players[seat].remote = id;
    room.send(id, { t: 'start', rejoin: true, game: base.id, rounds: match.rounds, seat, players: seatList() });
    room.send(id, { t: 'story', m: 'begin', a: [] });
    if (dark) room.send(id, { t: 'story', m: dark, a: [dark === 'night'] });
    room.send(id, { t: 'round', text: roundEl.textContent });
    room.send(id, { t: 'scores', totals: match.totals });
    if (net.lastEnd) room.send(id, { t: 'end', ...net.lastEnd });
    else if (match.roles.length && matchRunning) room.send(id, { t: 'peek', slot: match.slotOf(seat) });
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
    country = oneGame(base);
    ui = uiFor();
    net.seat = m.seat;
    players = m.players.map((p, i) => ({
      name: (net?.public && i !== m.seat ? politeName(String(p.name)) : String(p.name)).slice(0, 16), gender: p.gender === 'f' ? 'f' : 'm', look: cleanLook(p.look, p.look?.id),
      color: SHIRTS[i], isHuman: i === m.seat, remote: null, flair: FLAIRS.has(p.flair) ? p.flair : '', bot: p.human === false,
    }));
    profile.noteRivals(m.players.filter((p, i) => i !== m.seat && p.human).map((p, i) => ({ name: net?.public ? politeName(String(p.name)) : p.name, weekly: p.weekly })));
    exitBtn.hidden = false;
    matchRunning = true;
    setMyChit(null);
    setTalkAvailable(true);
    armBackGuard();
    guestTotals = [0, 0, 0, 0];
    clear(sheet); sheet.className = 'game__sheet'; showPrompt('');
    world.story.setCountry(country);
    renderScores();
    keepAwake(true);
  }

  function guestApply(m) {
    const st = world.story;
    switch (m.t) {
      case 'start': guestStart(m); if (m.rejoin) showToast(ui.backNext, 4200); break;
      case 'story': {
        if (m.m === 'setCountry') { st.setCountry(oneGame(COUNTRIES[m.a[0]] || base)); break; }
        if (m.m === 'begin') {
          // the host's own labels say "(You)" about the host, so each phone writes its own
          st.begin(players.map(p => ({ name: p.name, look: p.look, color: p.color, isHuman: p.isHuman, label: `${p.bot ? '🤖 ' : p.flair ? `${p.flair} ` : ''}${p.isHuman ? `${p.name} (${ui.you})` : p.name}` })));
          break;
        }
        if (!chatOn() && (m.m === 'say' || m.m === 'talkTo')) break;
        if (typeof st[m.m] === 'function' && !LOCAL_ONLY.has(m.m)) st[m.m](...(Array.isArray(m.a) ? m.a : []));
        break;
      }
      case 'sfx': audioManager.play(m.n); break;
      case 'fan': if (m.on) audioManager.fanStart(); else audioManager.fanStop(); break;
      case 'round': roundEl.textContent = m.text; break;
      case 'scores': guestTotals = m.totals.slice(); renderScores(m.gains); break;
      case 'toast': showToast(m.text, m.ms || 2600); break;
      case 'note': showPrompt(String(m.text || '')); break;
      case 'peek': humanPeek(m.slot).then(() => { setMyChit(m.slot); net?.room.send({ t: 'peeked' }); }); haptic(25); break;
      case 'newRound': setMyChit(null); break;
      case 'game': changeRoomGame(m.game); break;
      case 'whisper': showWhisper(m.from, m.line); break;
      case 'accuse': guestAccuse(m); break;
      case 'cheatResult': guestAsk?.cheatResult(m); break;
      case 'cheatDone': guestAsk?.cheatDone(); break;
      case 'cancelAsk': guestAsk?.cancel(); break;
      case 'tossAsk': guestToss(m); break;
      case 'tossEnd': guestTossEnd?.(); break;
      case 'pause': holdTimers(!!m.on); if (m.on) showPaused(); else closeOverlay(); break;
      case 'end': setMyChit(null); setRound(`🏆 ${ui.over}`); keepAwake(false); showEnd(m); break;
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
  /**
   * Resolves 'host' (room open, Start pressed), 'guest' (joined; the host drives from here) or 'back'.
   * Opens on the normal menu, on the join page for an invite link (code) or on "Reconnecting…" (rejoin).
   */
  function nearbyFlow({ code: linkCode = null, rejoin = null, scan = false, online = false } = {}) {
    return new Promise((resolve) => {
      const nameInput = nameInputEl();
      const nameNow = () => myName();
      const joinExtras = () => ({ gender: profile.gender, look: profile.look, weekly: profile.week.points, flair: profile.flair });
      const rounds = () => (ROUND_OPTIONS.includes(settingsStore.get('matchRounds')) ? settingsStore.get('matchRounds') : DEFAULT_ROUNDS);
      const big = (label, sub, onClick, primary, iconName = null) => el('button', {
        className: `game__choice${primary ? ' game__choice--primary' : ''}${iconName ? ' game__choice--icon' : ''}`, type: 'button', onClick,
      }, [
        iconName ? el('span', { className: 'game__choice-ico', html: iconSvg(iconName) }) : null,
        el('span', { className: 'game__choice-text' }, [el('strong', {}, [label]), el('span', {}, [sub])]),
      ]);
      const backBtn = (fn) => el('button', { className: 'game__back', type: 'button', onClick: fn }, [el('span', { html: iconSvg('left') }), ui.back]);
      const status = el('p', { className: 'game__netstatus', attrs: { 'aria-live': 'polite' } });
      /** The room's QR code, filling the screen, so friends can scan it from across the table. */
      function showBigQr(code) {
        screen.querySelector('.game__qrbig')?.remove();
        import('../../net/qr.js?v=20261110-0233').then(({ qrSvg }) => {
          const svg = qrSvg(inviteUrl(code), ui.qrLabel);
          if (!svg) return;
          const box = el('button', { className: 'game__qrbig', type: 'button', onClick: () => box.remove() }, [
            el('strong', {}, [ui.scanMe]),
            svg,
            el('span', { className: 'game__code' }, [`${code.slice(0, 3)} ${code.slice(3)}`]),
            el('small', {}, [ui.tapClose]),
          ]);
          screen.append(box);
          box.focus();
        }).catch(() => {});
      }
      const page = (...players) => {
        screen.querySelector('.game__qrbig')?.remove();
        clear(sheet);
        sheet.className = 'game__sheet game__sheet--show game__sheet--start game__sheet--nearby';
        sheet.append(...players.filter(Boolean));
      };

      /** Back never drops the connection; only Disconnect leaves the room. */
      function connectedPage(code, backToRoom, hostRoom) {
        onLobbyPage = false;
        lobbyBack = backToRoom;
        page(
          el('h2', { className: 'game__title' }, [ui.connected]),
          el('p', { className: 'game__sub' }, [fmt(ui.connectedSub, { code: `${code.slice(0, 3)} ${code.slice(3)}` })]),
          big(ui.backToRoom, ui.backToRoomSub, backToRoom, true, 'left'),
          big(ui.disconnect, hostRoom ? ui.disconnectHost : ui.disconnectSub, () => {
            lobbyBack = null;
            clearRejoin();
            net?.room.close();
            net = null;
            keepAwake(false);
            clearUrlJoin();
            resolve('back');
          }),
        );
      }
      const gamePicker = () => null;   // one game: nothing to pick
      let onLobbyPage = false;

      function menu() {
        status.textContent = '';
        page(
          el('h2', { className: 'game__title' }, [ui.nearby]),
          el('p', { className: 'game__sub' }, [ui.nearbySub]),
          el('label', { className: 'game__field' }, [el('span', {}, [ui.yourName]), nameInput]),
          big(ui.host, fmt(ui.hostSub, { game: GAME_NAME_EN[base.id], n: rounds() }), () => hostLobby(), true, 'home'),
          big(ui.scanQr, ui.scanSub, () => joinPage(null, true), false, 'qr'),
          big(ui.join, ui.joinSub, () => joinPage(), false, 'wifi'),
          el('p', { className: 'game__netnote' }, [ui.nearbyNote]),
          backBtn(() => resolve('back')),
        );
      }

      async function hostLobby(publicTable = null) {
        const name = nameNow();
        const codeEl = el('div', { className: 'game__code', attrs: { 'aria-label': ui.codeIs } }, ['······']);
        const list = el('ol', { className: 'game__lobby' });
        const qrBox = el('button', { className: 'game__qr', type: 'button', onClick: () => { if (room.code) showBigQr(room.code); } });
        const inviteSub = el('span', {}, [ui.inviteSub]);
        const inviteBtn = el('button', { className: 'game__choice', type: 'button', onClick: async () => {
          const r = await shareGame({ title: 'ChitPlay', text: fmt(ui.inviteText, { code: room.code }), url: inviteUrl(room.code) });
          if (r === 'copied') inviteSub.textContent = ui.copied;
          else if (r === 'failed') inviteSub.textContent = inviteUrl(room.code);
        } }, [el('strong', {}, [ui.invite]), inviteSub]);
        inviteBtn.hidden = true;
        let publicTimer = 0;
        const startNow = () => {
          if (!room.guests.size || room.locked) return;
          clearInterval(publicTimer);
          if (publicTable) cast = lobbyCast();
          // each friend keeps this seat for the whole room, even if their phone drops
          net.seats = room.list.slice(0, 3).map(g => ({ token: g.token, name: g.name, gender: g.gender, look: g.look, weekly: g.weekly, flair: g.flair }));
          net.name = room.hostLabel;
          room.lock();
          lobbyBack = null;
          // the host goes straight into the game, like everyone else
          clear(sheet);
          sheet.className = 'game__sheet';
          resolve('host');
        };
        const startBtn = big(ui.startNeedOne, GAME_NAME_EN[base.id], startNow, true);
        startBtn.hidden = !!publicTable;   // a public table starts by itself
        startBtn.disabled = true;
        const room = new NearbyHost({
          onChange: () => paint(),
          onMessage: (id, msg) => onGuestMessage(id, msg),
          onLeave: (id, gname) => onGuestLeave(id, gname),
          onRejoin: (id, token) => onGuestBack(id, token),
        });
        room.hostName = name;
        net = { role: 'host', room, name, seats: [], lastEnd: null, repaint: () => paint(), public: !!publicTable };
        // a public table: it starts by itself when it's full, or soon after somebody sits down
        const PUBLIC_WAIT_MS = 25000;
        let deadline = 0, lastGuests = 0, openedAt = 0;
        // computer players who sat down while we waited, in order; they leave again for real players
        const lobbyBots = [];
        const lobbyCast = () => {
          const extra = makeCast();
          const g = room.guests.size;
          return [0, 1, 2, 3].map(i => (i >= g && i < 3 && lobbyBots[i - g]) || extra[i]);
        };
        const pubSub = el('p', { className: 'game__sub' });
        const leavePublic = () => { clearInterval(publicTimer); lobbyBack = null; room.close(); net = null; keepAwake(false); };
        const soloBtn = big(ui.onlineSolo, ui.onlineSoloSub, () => { leavePublic(); resolve('solo'); }, false, 'play');
        soloBtn.hidden = true;
        const startsIn = () => Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        const tickPublic = () => {
          if (net?.room !== room || room.locked) { clearInterval(publicTimer); return; }
          const g = room.guests.size;
          // someone just sat down at an almost-due table: give the next one a moment
          if (g > lastGuests && startsIn() < 6) deadline = Date.now() + 8000;
          lastGuests = g;
          // a real player takes the seat of a computer player
          while (g + lobbyBots.length > 3) lobbyBots.pop();
          // seats fill one by one, so the table is full by the time the wait is over
          const total = Math.max(1, deadline - openedAt);
          const due = Math.min(3 - g, Math.floor(((Date.now() - openedAt) / total) * 3.4));
          while (lobbyBots.length < due) {
            const taken = [room.hostLabel, ...room.list.map(x => x.name), ...lobbyBots.map(b => b.name)];
            const b = pickOpponents(1, taken)[0];
            lobbyBots.push({ ...b, look: randomLook(b.gender, country.theme.skins[lobbyBots.length % country.theme.skins.length]), flair: RANKS[1 + Math.floor(Math.random() * 5)].icon });
          }
          const left = startsIn();
          if (g >= 3) { startNow(); return; }
          if (left === 0) {
            if (g >= 1) { startNow(); return; }
            // nobody real came: the same table plays on this phone
            cast = lobbyCast();
            leavePublic();
            resolve('solo');
            return;
          }
          pubSub.textContent = fmt(ui.onlineStarting, { n: left });
          soloBtn.hidden = true;
          paint();
        };
        armBackGuard();
        const paint = () => {
          if (room.locked) return;   // the lobby is over: never paint it on friends' phones mid-match
          subEl.textContent = fmt(ui.hostSub, { game: GAME_NAME_EN[base.id], n: rounds() });
          clear(list);
          const g = room.list;
          list.append(el('li', { className: 'game__lobby-me' }, [`⭐ ${room.hostLabel} ${ui.youHost}`]));
          for (let i = 0; i < 3; i++) {
            const bot = publicTable && !g[i] ? lobbyBots[i - g.length] : null;
            list.append(el('li', { className: g[i] || bot ? 'on' : '' }, [g[i] ? `✅ ${g[i].name}` : bot ? `🤖 ${bot.name}` : (i === g.length ? (publicTable ? ui.onlineSeat : ui.waiting) : ui.bot)]));
          }
          const n = g.length + 1;
          startBtn.disabled = g.length === 0;
          startBtn.querySelector('strong').textContent = g.length ? fmt(ui.startN, { n }) : ui.startNeedOne;
          if (g.length) haptic(15);
          room.broadcast({ t: 'lobby', host: room.hostLabel, game: base.id, rounds: rounds(), players: [room.hostLabel, ...g.map(x => x.name), ...(publicTable ? lobbyBots.map(b => `🤖 ${b.name}`) : [])], ...(publicTable ? { startsIn: startsIn() } : {}) });
        };
        const subEl = el('p', { className: 'game__sub' });
        const showLobby = () => {
          lobbyBack = null;
          if (publicTable) {
            page(
              el('h2', { className: 'game__title' }, [ui.onlineTitle]),
              pubSub,
              list,
              status,
              startBtn,
              soloBtn,
              el('p', { className: 'game__netnote' }, [ui.onlineNote]),
              backBtn(() => { leavePublic(); resolve('back'); }),
            );
            lobbyBack = () => { leavePublic(); resolve('back'); };
            return;
          }
          page(
            el('h2', { className: 'game__title' }, [ui.host]),
            subEl,
            gamePicker(),
            el('p', { className: 'game__codelabel' }, [ui.codeIs]),
            codeEl,
            qrBox,
            el('p', { className: 'game__netnote' }, [ui.codeHelp]),
            inviteBtn,
            list,
            status,
            startBtn,
            backBtn(() => {
              // before the room exists there is nothing to stay connected to
              if (!room.code) { room.close(); net = null; menu(); return; }
              connectedPage(room.code, showLobby, true);
            }),
          );
          lobbyBack = () => (room.code ? connectedPage(room.code, showLobby, true) : null);
        };
        if (!publicTable) {
          showLobby();
          paint();
          status.textContent = ui.connecting;
        }
        try {
          room.country = detected.id;
          const code = await room.open(publicTable);
          if (net?.room !== room) return 'cancelled';   // Back was pressed while connecting
          if (publicTable) {
            openedAt = Date.now();
            deadline = openedAt + PUBLIC_WAIT_MS;
            showLobby();
            keepAwake(true);
            tickPublic();
            publicTimer = setInterval(tickPublic, 1000);
            return 'open';
          }
          codeEl.textContent = `${code.slice(0, 3)} ${code.slice(3)}`;
          status.textContent = '';
          inviteBtn.hidden = false;
          keepAwake(true);
          import('../../net/qr.js?v=20261110-0233').then(({ qrSvg }) => {
            const svg = qrSvg(inviteUrl(code), ui.qrLabel);
            if (svg) qrBox.append(svg);
          }).catch(() => {});   // no QR: the link and the code still work
          return 'open';
        } catch (e) {
          if (net?.room !== room) return 'cancelled';
          room.close();
          net = null;
          // a public table that somebody else already hosts: the search joins it instead
          if (publicTable) return e?.type === 'unavailable-id' ? 'taken' : 'failed';
          status.textContent = ui[nearbyError(e)];
          codeEl.textContent = '✕';
          return 'failed';
        }
      }

      /**
       * Online: random players. Table 1 first: host it if it's free, join it if somebody waits there,
       * try the next one if it's full or already playing.
       */
      async function publicSearch() {
        let cancelled = false;
        const searchStatus = el('p', { className: 'game__netstatus', attrs: { 'aria-live': 'polite' } });
        const cancel = () => { cancelled = true; lobbyBack = null; net?.room.close(); net = null; resolve('back'); };
        page(
          el('h2', { className: 'game__title' }, [ui.onlineTitle]),
          el('p', { className: 'game__sub' }, [ui.onlineSearching]),
          el('div', { className: 'game__spinner', attrs: { 'aria-hidden': 'true' } }),
          searchStatus,
          el('label', { className: 'game__field' }, [el('span', {}, [ui.yourName]), nameInput]),
          el('p', { className: 'game__netnote' }, [ui.onlineNote]),
          backBtn(cancel),
        );
        armBackGuard();
        lobbyBack = cancel;
        audioManager.unlock();
        // 1. look at every table: who is waiting, and where they're from
        const home = detected.id;
        searchStatus.textContent = fmt(ui.onlineCountry, { country: COUNTRIES[home]?.name || home });
        const codes = Array.from({ length: PUBLIC_TABLES }, (_, i) => publicCode(i + 1));
        let seen = [];
        try { seen = await peekTables(codes); } catch { seen = []; }
        if (cancelled || !alive) return;
        // 2. sit with players from your own country first, then with anyone waiting
        const waiting = seen.filter(t => !t.locked && t.seats < 3)
          .sort((a, b) => (b.country === home) - (a.country === home) || b.seats - a.seats);
        for (const t of waiting) {
          searchStatus.textContent = t.country === home ? fmt(ui.onlineCountry, { country: COUNTRIES[home]?.name || home }) : ui.onlineWorld;
          if ((await joinPublic(t.code)) === 'joined' || cancelled) return;
        }
        // 3. nobody waiting: open the first free table, so the next player finds you
        searchStatus.textContent = ui.onlineWorld;
        const busy = new Set(seen.map(t => t.code));
        for (const code of codes.filter(c => !busy.has(c))) {
          if (cancelled || !alive) return;
          const hosted = await hostLobby(code);
          if (hosted === 'open' || cancelled || hosted === 'cancelled') return;
          if (hosted === 'failed') break;   // no connection at all
          if ((await joinPublic(code)) === 'joined' || cancelled) return;   // someone took it a moment ago
        }
        if (cancelled || !alive) return;
        lobbyBack = null;
        page(
          el('h2', { className: 'game__title' }, [ui.onlineTitle]),
          el('p', { className: 'game__sub' }, [ui.onlineNoTable]),
          big(ui.onlineRetry, ui.onlineSearching, () => publicSearch(), true, 'globe'),
          big(ui.onlineSolo, ui.onlineSoloSub, () => resolve('solo'), false, 'play'),
          backBtn(() => resolve('back')),
        );
      }
      async function joinPublic(code) {
        const name = nameNow();
        const token = newToken();
        const room = guestRoom(code, token, name);
        net = { role: 'guest', room, seat: -1, public: true };
        try {
          const lobby = await room.join(code, name, token, joinExtras());
          if (net?.room !== room) return 'cancelled';
          saveRejoin({ code, token, name });
          waitingPaint(lobby);
          keepAwake(true);
          haptic([20, 40, 20]);
          return 'joined';
        } catch (e) {
          if (net?.room === room) net = null;
          return e?.type || 'failed';
        }
      }

      /** A friend's room: keeps playing what the host sends; a dropped connection tries to come back. */
      function guestRoom(code, token, name) {
        let started = false;
        guestCode = code;
        return new NearbyGuest({
          onMessage: (m) => {
            if (m.t === 'lobby') { if (!started && !m.rejoin) { lastLobby = m; if (onLobbyPage) waitingPaint(m); } return; }
            if (m.t === 'start' && !started) { started = true; lobbyBack = null; resolve('guest'); }
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
          el('button', { className: 'game__back', type: 'button', onClick: leave }, [ui.disconnect]),
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

      function joinPage(prefill = null, autoScan = false) {
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
            // that code belongs to one of the other games: its page takes over
            if (lobby.arcade) { room.close(); net = null; location.href = `play/?join=${code}`; return; }
            saveRejoin({ code, token, name });
            clearUrlJoin();
            if (!lobby.rejoin) waitingPaint(lobby);
            keepAwake(true);
            haptic([20, 40, 20]);
          } catch (e) {
            if (net?.room !== room) return;
            net = null;
            status.textContent = ui[nearbyError(e)];
            busy = false;
            go.disabled = false;
          }
        }
        /* Scan the host's QR code: live camera where the browser allows it, a photo or screenshot everywhere */
        const liveCamera = () => !!navigator.mediaDevices?.getUserMedia && window.isSecureContext !== false;
        // loaded now, because phones only open the photo picker straight after a tap
        const scanner = import('../../net/qr-scan.js?v=20261110-0233');
        let scanMod = null;
        scanner.then(m => { scanMod = m; }).catch(() => {});
        const scanBox = el('div', { className: 'game__scan' });
        let camera = null;
        let photoOnly = !liveCamera();
        const useCode = (code) => {
          const shown = `${code.slice(0, 3)} ${code.slice(3)}`;
          codeInput.value = shown;
          haptic([20, 30, 20]);
          closeScan();
          connect();
          status.textContent = fmt(ui.scanFound, { code: shown });
        };
        const sayOther = () => { if (status.textContent !== ui.scanOther) status.textContent = ui.scanOther; };
        function closeScan() {
          camera?.stop();
          camera = null;
          lobbyBack = null;
          clear(scanBox);
          paintScanBtn();
          scanBox.append(scanBtn);
        }
        const photoInput = el('input', { attrs: { type: 'file', accept: 'image/*', 'aria-label': ui.scanPhoto } });
        photoInput.hidden = true;
        photoInput.addEventListener('change', async () => {
          const file = photoInput.files?.[0];
          if (!file) return;
          status.textContent = ui.scanReading;
          try {
            const { codeFromPhoto } = await scanner;
            const found = await codeFromPhoto(file);
            if (found.code) { photoInput.value = ''; useCode(found.code); return; }
            status.textContent = found.other ? ui.scanOther : ui.scanNoCode;
          } catch { status.textContent = ui.scanNoCode; }
          photoInput.value = '';
        });
        const pickPicture = (fromCamera) => {
          if (fromCamera) photoInput.setAttribute('capture', 'environment');
          else photoInput.removeAttribute('capture');
          photoInput.click();
        };
        async function openCamera() {
          const { startCameraScan } = scanMod || await scanner;
          const video = el('video', { className: 'game__scan-video', attrs: { playsinline: '', muted: '' } });
          let lightOn = false;
          const light = el('button', { className: 'game__scan-light', type: 'button', onClick: () => {
            lightOn = !lightOn;
            light.classList.toggle('game__scan-light--on', lightOn);
            camera?.setTorch(lightOn);
          } }, [ui.scanLight]);
          light.hidden = true;
          clear(scanBox);
          scanBox.append(
            el('div', { className: 'game__scanview' }, [video, el('div', { className: 'game__scanframe', attrs: { 'aria-hidden': 'true' } }, [el('i')]), light]),
            el('p', { className: 'game__netnote' }, [ui.scanHint]),
            el('button', { className: 'game__back', type: 'button', onClick: closeScan }, [ui.scanCancel]),
          );
          status.textContent = '';
          // the phone's Back closes the camera, not the game
          armBackGuard();
          lobbyBack = closeScan;
          const mine = startCameraScan(video, useCode, sayOther);
          camera = mine;
          try {
            const info = await mine.ready;
            if (camera === mine && info?.torch) light.hidden = false;
          } catch (e) {
            if (camera !== mine) return;
            photoOnly = true;
            closeScan();
            status.textContent = e?.name === 'NotAllowedError' ? ui.scanDenied : ui.scanNoCamera;
          }
        }
        const scanBtn = el('button', {
          className: 'game__choice game__choice--primary', type: 'button',
          onClick: () => { if (photoOnly) pickPicture(true); else openCamera().catch(() => { status.textContent = ui.scanNoCamera; }); },
        }, [el('strong', {}), el('span', {})]);
        function paintScanBtn() {
          scanBtn.querySelector('strong').textContent = photoOnly ? ui.scanPhoto : ui.scanQr;
          scanBtn.querySelector('span').textContent = photoOnly ? ui.scanPhotoSub : ui.scanHint;
        }
        paintScanBtn();
        scanBox.append(scanBtn);
        page(
          el('h2', { className: 'game__title' }, [ui.join]),
          scanBox,
          el('button', { className: 'game__back', type: 'button', onClick: () => pickPicture(false) }, [ui.scanGallery]),
          photoInput,
          // an invite link skips the menu, so the name is asked here
          prefill ? el('label', { className: 'game__field' }, [el('span', {}, [ui.yourName]), nameInput]) : null,
          el('label', { className: 'game__field' }, [el('span', {}, [ui.enterCode]), codeInput]),
          status,
          go,
          backBtn(() => { camera?.stop(); camera = null; lobbyBack = null; net?.room.close(); net = null; clearUrlJoin(); menu(); }),
        );
        if (autoScan && !photoOnly) openCamera().catch(() => { status.textContent = ui.scanNoCamera; });
        else setTimeout(() => (prefill ? nameInput : codeInput).focus(), 60);
      }

      let lastLobby = null, guestCode = '';
      function waitingPaint(m) {
        lastLobby = m;
        onLobbyPage = true;
        armBackGuard();
        const g = COUNTRIES[m.game] ? m.game : base.id;
        const goBack = () => connectedPage(guestCode, () => waitingPaint(lastLobby), false);
        lobbyBack = goBack;
        // set before the picker is built, so it shows the game the room is on
        if (g !== base.id) changeRoomGame(g);
        const pub = isPublicCode(guestCode);
        const shown = (n) => (pub ? politeName(n) : n);
        page(
          el('h2', { className: 'game__title' }, [pub ? fmt(ui.onlineJoined, { host: shown(m.host) }) : fmt(ui.joined, { host: m.host })]),
          el('p', { className: 'game__sub' }, [fmt(ui.hostSub, { game: GAME_NAME_EN[g], n: m.rounds })]),
          pub ? null : gamePicker(),
          el('ol', { className: 'game__lobby' }, m.players.map((n, i) => el('li', { className: 'on' }, [`${i === 0 ? '⭐' : '✅'} ${shown(n)}`]))),
          el('p', { className: 'game__netstatus' }, [pub && Number.isFinite(m.startsIn) ? fmt(ui.onlineStarting, { n: m.startsIn }) : ui.waitStart]),
          !pub && m.players.length < 4 && guestCode ? big(ui.showQr, ui.showQrSub, () => showBigQr(guestCode), false, 'qr') : null,
          backBtn(goBack),
        );
        // the room behind the sheet shows the game the host picked
      }

      if (rejoin) rejoinPage(rejoin);
      else if (linkCode) joinPage(linkCode);
      else if (scan) joinPage(null, true);
      else if (online) publicSearch();
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
    setRound(fmt(ui.roundOf, { n: round, m: match.rounds }));
    // after a refresh the round is replayed with the very same chits (no re-rolling roles)
    if (!resume) match.startRound();
    saveGame('inRound');
    const name = (i) => players[i].name;

    if (R.finalDouble && match.isFinal) {
      players.forEach((_, i) => S().emote(i, '✨', 2.5));
      await narrate('doubleRound', {}, { wait: 2200 });
    }

    setMyChit(null);
    tell({ t: 'newRound' });
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
      if (players[i].isHuman) {
        if (playMode === 'pass') await passPhone(i, ui.passChit);
        await humanPeek(match.slotOf(i));
        if (playMode !== 'pass') setMyChit(match.slotOf(i));
      }
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

    // Only the finder says who they are; everyone else keeps a straight face
    S().investigate(g, guesserRole.acc);
    S().emote(g, '😎', 1.8);
    await sayWait(g, 'announce');
    maybeBotWhisper(g);
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
    let finderHasPhone = false;
    const handToFinder = async () => {
      if (playMode !== 'pass' || !local || finderHasPhone) return;
      finderHasPhone = true;
      await passPhone(g, fmt(ui.passFind, { name: '{name}', thief: country.roles.thief.name }));
    };
    if (R.check) {
      await handToFinder();   // the night check is secret
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
      await handToFinder();
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
    S().effect('royal', match.seatOf('king'));
    await sleep(1500);

    // Reactions
    others(g, thief).forEach(i => act(i, 'clap', null, 'happy'));
    if (res.correct) {
      act(g, 'jump', '🎉');
      act(thief, 'cry', '😭');
      S().look(thief, null);
      S().effect('siren', g);
      later(450, () => { if (alive) S().effect('cuffs', thief); });
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
      S().effect('smoke', thief);
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
    if (lang !== 'en') {
      if (await useLanguage(lang)) { ui = uiFor(); document.documentElement.lang = LANGUAGE_TAGS[lang] || 'en'; } else lang = 'en';
      if (!alive) return;
    }
    paintHud();
    // the 3D room loads in the background; the start screen doesn't wait for it
    worldReady = loadWorld().then((w) => {
      world = w;
      if (w?.story && alive && !match) { w.story.setCountry(country); previewTable(); }
      syncCalm();
      return w;
    });
    loadPack('english');               // every language falls back to it for rule-specific moments
    loadPack(chatPack());

    // an invite link, or a friend's phone coming back after a reload, goes straight to Nearby Play
    if (pendingStart) {
      const p = pendingStart;
      pendingStart = null;
      base = COUNTRIES[p.game] || base;
      country = oneGame(base);
      ui = uiFor();
      await ensureWorld();
      await startMatch(p.mode);
      return;
    }
    const urlJoin = readUrlJoin();
    const ticket = loadRejoin();
    // after a reload the phone goes straight back; after ✕ the player chooses (the Rejoin button)
    let nearbyStart = ticket && (urlJoin === ticket.code || (!urlJoin && !ticket.left)) ? { rejoin: ticket } : urlJoin ? { code: urlJoin } : null;
    // the Scan button on another page sends you here
    if (new URLSearchParams(location.search).has('scan')) {
      nearbyStart = { scan: true };
      try { history.replaceState(null, '', location.pathname); } catch {}
    }
    if (nearbyStart?.rejoin) {
      // a reload has no tap to unlock sound yet: the first touch does it
      screen.addEventListener('pointerdown', () => audioManager.unlock(), { once: true });
    }

    const saved = nearbyStart ? null : loadSave();
    const fromUrl = readUrlGame();
    // a link to a game opens it once; after that the address goes back to plain, so a refresh doesn't reopen it
    if (new URLSearchParams(location.search).has('game')) {
      cameFromGameLink = !!fromUrl;
      try { const u = new URL(location.href); u.searchParams.delete('game'); history.replaceState(null, '', u); } catch {}
    }
    if (saved && (!fromUrl || fromUrl.country.id === saved.country)) {
      base = COUNTRIES[saved.country];
      country = oneGame(base);
      ui = uiFor();
      setRound(fmt(ui.roundOf, { n: saved.match.round, m: saved.match.rounds }));
      await ensureWorld();
      await startMatch(['watch', 'pass'].includes(saved.playMode) ? saved.playMode : 'play', saved);
      return;
    }
    if (fromUrl) {
      base = fromUrl.country;
      country = oneGame(base);
      ui = uiFor();
    }

    let pm;
    for (;;) {
      pm = nearbyStart ? 'nearby' : await chooseSetup();
      if (!alive) return;
      if (pm === 'scan') {
        nearbyStart = { scan: true };
        pm = 'nearby';
      }
      if (pm === 'online') {
        nearbyStart = { online: true };
        pm = 'nearby';
      }
      if (pm === 'rejoin') {
        const back = loadRejoin();
        if (!back) continue;
        nearbyStart = { rejoin: back };
        pm = 'nearby';
      }
      if (pm === 'pass') {
        const table = await passSetup();
        if (!alive) return;
        if (!table) continue;
        lastPassTable = table;
        break;
      }
      if (pm !== 'nearby') break;
      const r = await nearbyFlow(nearbyStart || {});
      nearbyStart = null;
      if (!alive) return;
      if (r === 'solo') { clear(sheet); sheet.className = 'game__sheet'; pm = 'play'; break; }   // nobody online: the same table plays on this phone
      if (r === 'host') break;           // room full enough and Start pressed
      if (r === 'guest') return;         // a friend's phone: the host drives from here
    }
    await ensureWorld();
    await startMatch(pm);
  }

  async function startMatch(pm, saved = null) {
    playMode = pm;
    matchRunning = true;
    armBackGuard();
    clearSave();
    exitBtn.hidden = false;
    if (saved) {
      players = saved.players.map((p, i) => ({
        name: String(p.name).slice(0, 16), gender: p.gender === 'f' ? 'f' : 'm', look: cleanLook(p.look, p.look?.id),
        color: SHIRTS[i], isHuman: !!p.isHuman,
      }));
      match = Match.restore(country, saved.match);
    } else {
      const human = pm === 'play' || pm === 'nearby';
      // new strangers at the table every match; the ones on the start screen play the first one
      const table = cast || makeCast();
      cast = null;
      players = table.map((p, i) => ({ name: p.name, gender: p.gender, look: { ...p.look, skin: country.theme.skins[i % country.theme.skins.length] }, color: SHIRTS[i], isHuman: false, remote: null, flair: p.flair || '', brag: p.brag || null }));
      if (pm === 'pass') {
        (lastPassTable || []).forEach((t, k) => {
          const seat = (HUMAN_SEAT + k) % 4;
          players[seat] = { ...players[seat], name: t.name, gender: t.gender, look: t.look, isHuman: true };
        });
        players.forEach((p, i) => {   // nobody sitting in shares a name with someone holding the phone
          if (!p.isHuman && players.some((o, j) => j !== i && o.isHuman && o.name.toLowerCase() === p.name.toLowerCase())) {
            p.name = pickOpponents(1, players.map(o => o.name))[0].name;
          }
        });
      } else if (human) players[HUMAN_SEAT] = { ...players[HUMAN_SEAT], name: myName(), gender: profile.gender, look: profile.look, isHuman: true, weekly: net ? profile.week.points : null, flair: profile.flair };
      // Nearby: friends take seats 0, 1, 2 in the order they joined; empty seats stay computer players
      if (pm === 'nearby' && isHost()) {
        players[HUMAN_SEAT].name = net.name;   // the name the friends already saw in the lobby
        profile.noteRivals(net.seats.map(s => ({ name: s.name, weekly: s.weekly })));
        net.lastEnd = null;
        const online = net.room.list;
        net.seats.forEach((s, k) => {
          // a friend who is away keeps name and seat; a computer player sits in until they're back
          players[k] = { name: s.name, gender: s.gender, look: s.look, color: SHIRTS[k], isHuman: false, remote: online.find(g => g.token === s.token)?.id || null, weekly: s.weekly ?? 0, flair: FLAIRS.has(s.flair) ? s.flair : '' };
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
      match = new Match(country, 4, rounds, { humanSeat: pm === 'play' || pm === 'nearby' ? HUMAN_SEAT : -1 });
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
    setMyChit(null);
    setTalkAvailable(pm === 'play' || pm === 'nearby');
    sfx.fanStart();
    renderScores();

    S().setCountry(country);
    S().begin(players.map(p => ({
      name: p.name, look: p.look, color: p.color, isHuman: p.isHuman,
      label: `${net && !p.isHuman && !p.remote ? '🤖 ' : p.flair ? `${p.flair} ` : ''}${isMe(p) && p.name !== ui.you ? `${p.name} (${ui.you})` : p.name}`,
    })));
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
      await maybeBrag(0.85);
      S().clearTalk();
    }

    for (let r = first; r <= match.rounds; r++) {
      await playRound(r, { resume: resumeRound && r === first });
      if (r < match.rounds) {
        if (r >= 2) await maybeBrag(0.3);
        await sayWait(pickOne([0, 1, 2, 3]), 'nextRound');
        renderScores();
      }
    }
    clearSave();    // the match is finished: a refresh now goes back to the start screen

    // Game over
    const w = match.winner();
    setRound(`🏆 ${ui.over}`);
    S().celebrate(w);
    S().effect('confetti');
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
    // on a shared phone the profile belongs to the seat that holds it
    const me = playMode === 'pass' ? HUMAN_SEAT : players.findIndex(p => p.isHuman);
    matchRunning = false;
    setTalkAvailable(false);
    let progress = null;
    if (me >= 0) {
      progress = profile.recordMatch({
        mode: net ? 'nearby' : 'local', won: w === me, score: totals[me], catches: catches?.[me] || 0, escapes: escapes?.[me] || 0,
        cheats: cheats?.[me] || 0, caught: caughtCheats?.[me] || 0, game, rounds, online: !!net?.public,
      });
      progress.challenges.forEach((c, i) => later(1200 + i * 2200, () => showToast(fmt(ui.challengeDone, { text: challengeText(c), coins: c.coins }), 2600)));
      progress.unlocked.forEach((h, i) => later(1500 + (progress.challenges.length + i) * 2200, () => showToast(fmt(ui.unlockedHat, { name: lookName(h.id, h.label) }), 3200)));
      if (progress.rankedUp) { sfx.play('victory'); showToast(fmt(ui.rankUp, { icon: progress.after.icon, title: rankTitle(progress.after) }), 4200); }
    }
    const lastPlace = order[order.length - 1];
    const MEDALS = ['🥇', '🥈', '🥉', '4'];
    const standings = el('ol', { className: 'game__standings' }, order.map((seat, place) => el('li', {
      className: `game__standing${isMe(players[seat]) ? ' game__standing--me' : ''}`,
      style: { '--chip': players[seat].color },
    }, [
      el('span', { className: 'game__medal' }, [MEDALS[place]]),
      el('strong', {}, [isMe(players[seat]) ? `${players[seat].name} (${ui.you})` : players[seat].name]),
      el('span', { className: 'game__pts' }, [String(totals[seat])]),
    ])));
    const awardRow = awards.length ? el('div', { className: 'game__awards' }, awards.map(a => el('span', { className: 'game__award' }, [
      el('strong', {}, [ui[a.id]]),
      el('span', {}, [`${players[a.seat].name} · ${fmt(ui[`${a.id}Sub`], { n: a.count })}`]),
    ]))) : null;
    const shareMsg = el('span', {}, [ui.shareSub]);
    const shareBtn = el('button', {
      className: 'game__choice game__choice--icon', type: 'button',
      onClick: async () => {
        const url = new URL(location.href);
        url.search = `?game=${GAME_SLUGS[game]}`; url.hash = '';
        const score = me >= 0 ? totals[me] : totals[w];
        const text = fmt(me < 0 ? ui.sharePlay : w === me ? ui.shareWon : ui.shareScore, { score, game: GAME_NAME_EN[game] });
        const r = await shareGame({ title: `${GAME_NAME_EN[game]} – ChitPlay`, text, url: url.toString() });
        if (r === 'copied') shareMsg.textContent = ui.copied;
        else if (r === 'failed') shareMsg.textContent = url.toString();   // at least show the link to copy by hand
      },
    }, [el('span', { className: 'game__choice-ico', html: iconSvg('share') }), el('span', { className: 'game__choice-text' }, [el('strong', {}, [ui.share]), shareMsg])]);

    clear(sheet);
    sheet.className = 'game__sheet game__sheet--show game__sheet--start';
    sheet.append(
      el('h2', { className: 'game__title' }, [isMe(players[w]) ? ui.youWon : fmt(ui.won, { name: players[w].name })]),
      el('p', { className: 'game__sub' }, [`${fmt(ui.hostSub, { game: GAME_NAME_EN[game], n: rounds })}${net ? ` · ${ui.nearbyPts}` : ''}`]),
      standings,
      ...(awardRow ? [awardRow] : []),
      ...(net ? [el('label', { className: 'game__row-field' }, [el('span', {}, [ui.gameLabel]), gameSelect()])] : []),
      ...(progress ? [el('div', { className: 'game__progress' }, [
        el('strong', {}, [`${progress.after.icon} ${rankTitle(progress.after)}`]),
        el('div', { className: 'game__bar' }, [el('span', { style: { width: `${Math.round(progress.after.progress * 100)}%` } })]),
        el('span', {}, [[
          fmt(ui.gained, { n: progress.gained.toLocaleString('en') }),
          fmt(ui.coinsGained, { n: progress.coinsEarned }),
          progress.place ? fmt(ui.hallPlace, { n: progress.place }) : '',
          ...progress.newBadges.map(b => fmt(ui.newBadge, { icon: b.icon, name: badgeText(b).name })),
        ].filter(Boolean).join(' · ')]),
      ])] : []),
      el('div', { className: 'game__forfeit' }, [
        el('strong', {}, [fmt(ui.forfeit, { name: players[lastPlace].name })]),
        el('span', {}, [fmt(ui.forfeitLine, { name: isMe(players[lastPlace]) ? ui.you : players[lastPlace].name, text: pickOne(forfeits()) })]),
      ]),
      guest
        ? el('p', { className: 'game__stats' }, [ui.waitHostAgain])
        : el('button', {
          className: 'game__choice game__choice--primary game__choice--icon', type: 'button',
          onClick: () => { sheet.className = 'game__sheet'; startMatch(playMode).catch(onError); },
        }, [el('span', { className: 'game__choice-ico', html: iconSvg('restart') }), el('span', { className: 'game__choice-text' }, [el('strong', {}, [ui.again]), el('span', {}, [net ? ui.againNearby : ui.againSub])])]),
      el('button', {
        className: 'game__choice game__choice--icon', type: 'button',
        onClick: () => { clearRejoin(); transition(GAME_PHASES.HOME); },
      }, [
        el('span', { className: 'game__choice-ico', html: iconSvg(net ? 'exit' : 'home') }),
        el('span', { className: 'game__choice-text' }, net
          ? [el('strong', {}, [ui.disconnect]), el('span', {}, [guest ? ui.disconnectSub : ui.disconnectHost])]
          : [el('strong', {}, [ui.change]), el('span', {}, [ui.changeSub])]),
      ]),
      shareBtn,
    );
  }

  /* ─── Who sits at the table ─────────────────────────────── */
  function makeCast() {
    const skins = country.theme.skins;
    // the hats you haven't got yet: a computer player may be wearing one, and tell you how they got it
    const missing = FANCY_HATS.filter(h => !profile.owns(h.id));
    return pickOpponents(4, [myName()]).map((o, i) => {
      const look = randomLook(o.gender, skins[i % skins.length]);
      let brag = null;
      if (missing.length && Math.random() < 0.4) {
        const hat = missing.splice(Math.floor(Math.random() * missing.length), 1)[0];
        look.headwear = hat.id;
        look.id = 'custom';
        brag = { hat: hat.id };
      }
      // their rank: usually somewhere in the middle of the ladder
      const r = brag?.hat && FANCY_HATS.find(h => h.id === brag.hat).rank != null
        ? FANCY_HATS.find(h => h.id === brag.hat).rank
        : 1 + Math.floor(Math.random() * 6);
      return { ...o, look, flair: RANKS[Math.min(r, RANKS.length - 1)].icon, brag };
    });
  }
  /** Something a computer player has that you don't, and how they got it (null if you have it all). */
  function bragFor(seat) {
    const p = players[seat];
    if (!p) return null;
    const hat = p.brag?.hat && FANCY_HATS.find(h => h.id === p.brag.hat);
    const options = [];
    if (hat && !profile.owns(hat.id)) {
      options.push(() => (hat.rank != null
        ? fmt(ui.brag_hat, { item: lookName(hat.id, hat.label), rank: rankTitle({ ...RANKS[hat.rank], index: hat.rank }) })
        : fmt(ui.brag_buy, { item: lookName(hat.id, hat.label) })));
    }
    const lockedEmoji = SPECIAL_EMOJIS.filter(e => !profile.owns(e.id));
    if (lockedEmoji.length) {
      const e = pickOne(lockedEmoji);
      options.push(() => { S().throwEmoji(seat, null, e.symbol); return fmt(ui.brag_emoji, { emoji: e.symbol, how: emojiHow(e) }); });
    }
    if (!profile.daily.bonus) options.push(() => fmt(ui.brag_daily, { n: DAILY_BONUS }));
    if (profile.login.day < 7) options.push(() => fmt(ui.brag_streak, { n: 7 }));
    return options.length ? pickOne(options) : null;
  }
  /** Now and then a computer player shows off something you could earn too. */
  async function maybeBrag(chance) {
    if (playMode === 'watch' || playMode === 'pass' || Math.random() > chance) return;
    const bots = players.map((_, i) => i).filter(i => isBot(i));
    const withHat = bots.filter(i => players[i].brag?.hat && !profile.owns(players[i].brag.hat));
    const seat = withHat.length ? pickOne(withHat) : bots.length ? pickOne(bots) : -1;
    const line = seat >= 0 ? bragFor(seat) : null;
    if (!line || !chatOn()) return;
    const text = line();
    S().say(seat, text);
    act(seat, 'show', null, 'happy');
    await sleep(Math.min(4200, 1400 + text.length * 45));
  }
  /** How a special emoji is unlocked, in words. */
  function emojiHow(e) {
    if (e.badge) { const b = BADGES.find(x => x.id === e.badge); return fmt(ui.unlockBadge, { name: badgeText(b).name, hint: badgeText(b).hint }); }
    if (e.rank != null) return fmt(ui.unlockRank, { title: rankTitle({ ...RANKS[e.rank], index: e.rank }) });
    if (e.login) return ui.unlockLogin;
    return fmt(ui.unlockCoins, { n: e.price });
  }
  function seatList() {
    return players.map(x => ({ name: x.name, gender: x.gender, look: x.look, human: !!(x.isHuman || x.remote || x.weekly != null), weekly: x.weekly ?? null, flair: x.flair || '' }));
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

  const isMe = (p) => playMode !== 'pass' && !!p.isHuman;
  let matchRunning = false;

  /* ─── Single phone: the screen hides everything while it changes hands ─── */
  function passPhone(seat, label) {
    return new Promise((resolve) => {
      const name = players[seat].name;
      const cover = el('div', { className: 'game__pass' }, [
        el('div', { className: 'game__pass-card' }, [
          el('span', { className: 'game__pass-icon', attrs: { 'aria-hidden': 'true' }, html: iconSvg('phone') }),
          el('h2', { className: 'game__title' }, [fmt(ui.passTo, { name })]),
          el('p', { className: 'game__sub' }, [ui.passHide]),
          el('button', {
            className: 'game__choice game__choice--primary', type: 'button',
            onClick: () => { haptic(15); sfx.play('select'); cover.remove(); resolve(); },
          }, [el('strong', {}, [fmt(label, { name })])]),
        ]),
      ]);
      screen.append(cover);
    });
  }
  /** Who's holding the phone? Resolves with [{ name, gender, look }], or null for Back. */
  function passSetup() {
    return new Promise((resolve) => {
      let count = lastPassTable?.length || 4;
      const strangers = pickOpponents(3, [myName()]);
      const names = [myName(), ...strangers.map(o => o.name)];
      (lastPassTable || []).forEach((t, i) => { if (i) names[i] = t.name; });
      const fields = el('div', { className: 'game__custom' });
      const counts = el('div', { className: 'game__rounds' });
      const paint = () => {
        clear(fields);
        for (let i = 0; i < count; i++) {
          const input = el('input', {
            className: 'game__input', value: names[i],
            attrs: { type: 'text', maxlength: '12', 'aria-label': fmt(ui.passName, { n: i + 1 }), autocomplete: 'off' },
          });
          input.addEventListener('input', () => { input.value = cleanName(input.value); names[i] = input.value; });
          fields.append(el('label', { className: 'game__row-field' }, [el('span', {}, [fmt(ui.passName, { n: i + 1 })]), input]));
        }
        [...counts.querySelectorAll('.game__pill')].forEach(b => b.classList.toggle('game__pill--on', b.dataset.n === String(count)));
      };
      counts.append(el('span', {}, [ui.passCount]), ...[2, 3, 4].map(n => el('button', {
        className: 'game__pill', type: 'button', attrs: { 'data-n': String(n) },
        onClick: () => { count = n; paint(); },
      }, [String(n)])));
      clear(sheet);
      sheet.className = 'game__sheet game__sheet--show game__sheet--start game__sheet--nearby';
      sheet.append(
        el('h2', { className: 'game__title' }, [ui.pass]),
        el('p', { className: 'game__sub' }, [ui.passHelp]),
        counts,
        fields,
        el('button', {
          className: 'game__choice game__choice--primary', type: 'button',
          onClick: () => {
            const clean = names.slice(0, count).map((n, i) => cleanName(n).trim() || fmt(ui.passName, { n: i + 1 }));
            const lower = clean.map(n => n.toLowerCase());
            const table = clean.map((n, i) => ({
              // two people called Asha become Asha 1 and Asha 2, as in Nearby Play
              name: lower.filter(x => x === lower[i]).length > 1 ? `${n.slice(0, 10)} ${i + 1}` : n,
              gender: i === 0 ? profile.gender : strangers[i - 1].gender,
              look: i === 0 ? profile.look : randomLook(strangers[i - 1].gender, country.theme.skins[i % country.theme.skins.length]),
            }));
            clear(sheet); sheet.className = 'game__sheet';
            resolve(table);
          },
        }, [el('strong', {}, [ui.passStart])]),
        el('button', { className: 'game__back', type: 'button', onClick: () => resolve(null) }, [el('span', { html: iconSvg('left') }), ui.back]),
      );
      paint();
    });
  }

  /* ─── Choosing the game for a Nearby room ─────────────── */
  function gameSelect() {
    const select = el('select', {
      className: 'game__select game__gameselect', attrs: { 'aria-label': ui.gameLabel },
      onChange: (e) => {
        const id = e.target.value;
        if (net?.role === 'guest') net.room.send({ t: 'setGame', game: id });
        else { changeRoomGame(id); net?.repaint?.(); }
      },
    }, COUNTRY_ORDER.map(id => el('option', { attrs: { value: id } }, [GAME_NAME_EN[id]])));
    select.value = base.id;
    return select;
  }
  function changeRoomGame(id) {
    if (!COUNTRIES[id] || id === base.id) return;
    base = COUNTRIES[id];
    country = oneGame(base);
    ui = uiFor();
    world?.story?.setCountry(country);
    loadPack(chatPack());
    document.querySelectorAll('.game__gameselect').forEach((s) => { s.value = id; });
    if (isHost()) net.room.broadcast({ t: 'game', game: id });
    showToast(fmt(ui.gameChanged, { game: GAME_NAME_EN[id] }), 2200);
  }

  /* ─── Emojis for the table, private lines for one person ─ */
  const mySeat = () => (net?.role === 'guest' ? net.seat : players.findIndex(p => p.isHuman));
  // in the player's own language the thief keeps this game's own name (Chor, Dorobō…)
  const talkVars = () => ({ thief: (lang !== 'en' ? ROLE_LATIN[base.id]?.[3] : null) || country.roles.thief.name });
  const lastSent = new Map();
  /** One message a moment per seat, however fast someone taps. */
  function allowed(seat) {
    const now = Date.now();
    if (now - (lastSent.get(seat) || 0) < 700) return false;
    lastSent.set(seat, now);
    return true;
  }
  const validSeat = (s) => Number.isInteger(s) && s >= 0 && s < players.length;
  const isBot = (s) => !players[s].isHuman && !players[s].remote;

  function setTalkAvailable(on) {
    talkBtn.hidden = !on;
    quickBar.hidden = !on;
    if (!on) closeTalk();
  }
  function closeTalk() {
    talkPanel.hidden = true;
    talkBtn.classList.remove('game__talkbtn--open');
    clear(talkPanel);
  }
  function toggleTalk(to = null) {
    if (!talkPanel.hidden && to == null) { closeTalk(); return; }
    openTalk(to);
  }
  let talkTab = 'emoji';
  /** Opens on what you used last; sending anything closes it, and the same button opens it again. */
  function openTalk(to) {
    const me = mySeat();
    const seats = players.map((_, i) => i).filter(i => i !== me);
    let tab = validSeat(to) ? 'msg' : talkTab;
    let target = validSeat(to) && to !== me ? to : null;   // null: everyone (emoji only)
    const body = el('div', { className: 'game__talk-body' });
    const tabs = el('div', { className: 'game__talk-tabs', attrs: { role: 'tablist' } });
    const tabBtn = (id, iconName, label) => el('button', {
      className: 'game__talktab', type: 'button', attrs: { role: 'tab', 'data-tab': id },
      onClick: () => { tab = id; talkTab = id; paint(); },
    }, [el('span', { html: iconSvg(iconName) }), label]);
    tabs.append(tabBtn('emoji', 'smile', ui.talkEmoji), tabBtn('msg', 'chatDots', ui.talkMsg));

    function paint() {
      [...tabs.children].forEach((b) => {
        const on = b.dataset.tab === tab;
        b.classList.toggle('game__talktab--on', on);
        b.setAttribute('aria-selected', String(on));
      });
      clear(body);
      // a private line always goes to one person
      if (tab === 'msg' && target == null) target = seats[0];
      const chips = el('div', { className: 'game__talk-people' }, [
        ...(tab === 'emoji' ? [[null, ui.talkEveryone]] : []),
        ...seats.map(s => [s, players[s].name]),
      ].map(([s, label]) => el('button', {
        className: `game__seg-btn${s === target ? ' game__seg-btn--on' : ''}`, type: 'button',
        style: s == null ? {} : { '--chip': players[s].color },
        onClick: () => { target = s; paint(); },
      }, [label])));
      body.append(el('span', { className: 'game__talk-label' }, [ui.talkTo]), chips);
      if (tab === 'emoji') {
        body.append(el('div', { className: 'game__talk-emojis' }, [
          ...TALK_EMOJIS.map((e, i) => el('button', {
            className: 'game__talk-emoji', type: 'button', attrs: { 'aria-label': e },
            onClick: () => { sendEmoji(target, i); closeTalk(); },
          }, [e])),
          ...SPECIAL_EMOJIS.map((e, k) => {
            const mine = profile.owns(e.id);
            return el('button', {
              className: `game__talk-emoji game__talk-emoji--special${mine ? '' : ' game__talk-emoji--locked'}`, type: 'button',
              attrs: { 'aria-label': mine ? e.symbol : `${e.symbol} 🔒 ${emojiHow(e)}`, title: mine ? '' : emojiHow(e) },
              onClick: () => {
                if (!mine) { showToast(fmt(ui.lockedEmoji, { emoji: e.symbol, how: emojiHow(e) }), 3200); return; }
                sendEmoji(target, TALK_EMOJIS.length + k);
                closeTalk();
              },
            }, [e.symbol, mine ? null : el('small', {}, ['🔒'])]);
          }),
        ]));
      } else {
        body.append(
          el('p', { className: 'game__netnote' }, [fmt(ui.talkPrivateHelp, { name: players[target].name })]),
          el('div', { className: 'game__talk-lines' }, Array.from({ length: TALK_LINE_COUNT }, (_, i) => el('button', {
            className: 'game__talk-line', type: 'button',
            onClick: () => { sendWhisper(target, i); closeTalk(); },
          }, [talkLine(i, talkVars())]))),
        );
      }
    }
    clear(talkPanel);
    talkPanel.hidden = false;
    talkBtn.classList.add('game__talkbtn--open');
    talkPanel.append(
      el('div', { className: 'game__talk-head' }, [
        tabs,
        el('button', { className: 'game__talk-close', type: 'button', attrs: { 'aria-label': ui.backToGame }, html: iconSvg('close'), onClick: closeTalk }),
      ]),
      body,
    );
    paint();
  }
  function sendEmoji(to, i) {
    if (net?.role === 'guest') net.room.send({ t: 'emoji', to, i });
    else deliverEmoji(mySeat(), to, i);
    const done = profile.track('emojis').completed;
    done.forEach(c => later(2200, () => showToast(fmt(ui.challengeDone, { text: challengeText(c), coins: c.coins }), 2600)));
    haptic(10);
  }
  /** Everyone at the table sees it fly: from the sender's head to whoever it was meant for. */
  function deliverEmoji(from, to, i) {
    if (!isTalkEmoji(i) || !validSeat(from) || !allowed(from)) return;
    const target = validSeat(to) && to !== from ? to : null;
    const symbol = ALL_EMOJIS[i];
    S().throwEmoji(from, target, symbol);
    S().emojiPop(symbol, players[from].name);
    sfx.play('select');
    if (target != null) S().look(from, target);
    const text = target != null
      ? fmt(ui.emojiTo, { from: players[from].name, emoji: symbol, to: players[target].name })
      : fmt(ui.emojiAll, { from: players[from].name, emoji: symbol });
    showToast(text, 2000);
    tell({ t: 'toast', text, ms: 2000 });
    // computer players sometimes throw one back
    const bots = players.map((_, s) => s).filter(s => s !== from && isBot(s));
    if (bots.length && Math.random() < 0.45) {
      const who = target != null && isBot(target) ? target : pickOne(bots);
      later(1000 + Math.random() * 1000, () => { if (alive && matchRunning) S().throwEmoji(who, from, Math.random() < 0.25 ? pickOne(SPECIAL_EMOJIS).symbol : pickOne(TALK_EMOJIS)); });
    }
  }
  function sendWhisper(to, line) {
    if (net?.role === 'guest') net.room.send({ t: 'whisper', to, line });
    else deliverWhisper(mySeat(), to, line);
    showToast(fmt(ui.talkSent, { name: players[to].name }), 2200);
    haptic(10);
  }
  /** The host's phone only passes it along: nothing appears on any screen but the recipient's. */
  function deliverWhisper(from, to, line) {
    if (!validSeat(from) || !validSeat(to) || from === to || !talkLine(line) || !allowed(from)) return;
    if (players[to].isHuman) showWhisper(from, line);
    else if (players[to].remote) tellSeat(to, { t: 'whisper', from, line });
    else if (Math.random() < 0.75) {
      // a computer player answers, truthfully or not
      later(1200 + Math.random() * 1500, () => { if (alive && matchRunning) deliverWhisper(to, from, pickLine()); });
    }
  }
  const pickLine = () => Math.floor(Math.random() * TALK_LINE_COUNT);
  function showWhisper(from, line) {
    const text = talkLine(line, talkVars());
    if (!text || !players[from]) return;
    clear(whisperEl);
    whisperEl.hidden = false;
    whisperEl.append(
      el('small', {}, [fmt(ui.talkFrom, { name: players[from].name })]),
      el('span', {}, [text]),
      el('button', { className: 'game__talk-reply', type: 'button', onClick: () => { whisperEl.hidden = true; openTalk(from); } }, [ui.talkReply]),
    );
    haptic([15, 30, 15]);
    audioManager.play('select');
    clearTimeout(whisperEl._t);
    whisperEl._t = setTimeout(() => { whisperEl.hidden = true; }, 7000);
  }
  /** Sometimes a computer player tries to get into a real player's head. */
  function maybeBotWhisper(g) {
    if (playMode === 'pass' || playMode === 'watch' || Math.random() > 0.45) return;
    const bots = players.map((_, s) => s).filter(isBot);
    const people = players.map((_, s) => s).filter(s => !isBot(s));
    if (!bots.length || !people.length) return;
    const to = people.includes(g) ? g : pickOne(people);
    later(1500 + Math.random() * 2500, () => { if (alive && matchRunning) deliverWhisper(pickOne(bots), to, pickLine()); });
  }

  /* ─── The phone's Back gesture opens the menu; it doesn't throw you out of a game ─── */
  let backGuard = false;
  let lobbyBack = null;
  function armBackGuard() {
    if (backGuard) return;
    backGuard = true;
    try { history.pushState({ chitplay: 'guard' }, ''); } catch { backGuard = false; }
  }
  const onPopState = () => {
    if (!alive || !backGuard) return;
    backGuard = false;
    if (!overlay.hidden && !paused) closeOverlay();
    else if (lobbyBack) lobbyBack();
    else if (!exitBtn.hidden && overlay.hidden) openMenu();
    if (match || net) armBackGuard();
  };
  window.addEventListener('popstate', onPopState);

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
      el('span', { className: 'game__avatar', html: faceHtml(portraitSvg(profile.look)) }),
      el('div', { className: 'game__card-text' }, [
        el('strong', {}, [profile.name]),
        el('span', {}, [`${rank.icon} ${rankTitle(rank)}`]),
        el('span', { className: 'game__card-points' }, [
          `${ui.localPts}: ${st.local.points.toLocaleString('en')} · ${ui.nearbyPts}: ${st.nearby.points.toLocaleString('en')}`,
        ]),
      ]),
    ]);
  };
  const menuBtn = (label, onClick, cls = '', iconName = null) => el('button', { className: `game__choice game__choice--row ${cls}`, type: 'button', onClick }, [
    iconName ? el('span', { className: 'game__choice-ico', html: iconSvg(iconName) }) : null,
    el('strong', {}, [label]),
  ]);
  function openMenu() {
    if (isSolo()) holdTimers(true);
    closeTalk();
    clear(overlay);
    overlay.hidden = false;
    screen.classList.add('game--overlay');
    overlay.append(el('div', { className: 'game__panel' }, [
      el('h2', { className: 'game__title' }, [ui.menuTitle]),
      scoreCard(),
      canPause() ? menuBtn(ui.pause, () => pauseGame(), 'game__choice--primary', 'pause') : null,
      isSolo() && match ? menuBtn(ui.restart, () => {
        clearSave();
        pendingStart = { mode: playMode, game: base.id };
        holdTimers(false);
        transition(GAME_PHASES.HOME);
      }, '', 'restart') : null,
      menuBtn(net ? ui.disconnect : ui.quit, quitGame, '', 'exit'),
      menuBtn(ui.profile, () => openProfile({ fromMenu: true }), '', 'user'),
      el('button', {
        className: 'game__back', type: 'button',
        onClick: () => { closeOverlay(); if (isSolo()) holdTimers(false); },
      }, [el('span', { html: iconSvg('left') }), ui.backToGame]),
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
      }, 'game__choice--primary', 'play'),
      menuBtn(ui.quit, quitGame, '', 'exit'),
    ].filter(Boolean)));
  }

  /* ─── Language: one tap on the globe, available everywhere ── */
  async function changeLanguage(id) {
    if (!isLanguage(id) || id === lang) return true;
    if (!(await useLanguage(id))) return false;
    lang = id;
    settingsStore.set('chatLang', id);
    ui = uiFor();
    // the one game takes this language's name, room and voices (not mid-match, not in a room)
    if (!match && !net) {
      base = editionFor(id);
      country = oneGame(base);
      world?.story?.setCountry(country);
      cast = null;
      previewTable();
    }
    document.documentElement.lang = LANGUAGE_TAGS[id] || 'en';
    await loadPack(chatPack());
    paintHud();
    if (!match) setRound('CHITPLAY');
    else if (matchRunning) setRound(fmt(ui.roundOf, { n: match.round, m: match.rounds }));
    onModeChange?.();
    return true;
  }
  function openLanguage() {
    const inMatch = !!match && matchRunning;
    const hold = inMatch && isSolo() && !paused;
    if (hold) holdTimers(true);
    closeTalk();
    clear(overlay);
    overlay.hidden = false;
    screen.classList.add('game--overlay');
    const finish = () => {
      closeOverlay();
      if (hold) holdTimers(false);
    };
    overlay.append(el('div', { className: 'game__panel game__panel--lang' }, [
      el('div', { className: 'game__panel-head' }, [
        el('span', { className: 'game__panel-ico', html: iconSvg('globe') }),
        el('h2', { className: 'game__title' }, [ui.language]),
        el('button', { className: 'game__panel-close', type: 'button', attrs: { 'aria-label': ui.backToGame }, html: iconSvg('close'), onClick: finish }),
      ]),
      el('p', { className: 'game__netnote' }, [ui.languageHelp]),
      el('div', { className: 'game__langs', attrs: { role: 'radiogroup', 'aria-label': ui.language } }, LANGUAGES.map(l => el('button', {
        className: `game__langopt${l.id === lang ? ' game__langopt--on' : ''}`, type: 'button',
        attrs: { role: 'radio', 'aria-checked': String(l.id === lang) },
        onClick: async () => {
          haptic(10);
          const ok = await changeLanguage(l.id);
          finish();
          if (!ok) showToast(ui.errNetwork, 2600);
        },
      }, [el('span', {}, [l.label]), l.id === lang ? el('span', { html: iconSvg('check') }) : null]))),
    ]));
  }

  /* ─── Profile ─────────────────────────────────────────── */
  let profileTab = 'character';
  /** A row of seven days: what each visit gives, today's highlighted. */
  function loginRow() {
    const l = profile.login;
    return el('div', { className: 'game__loginrow' }, l.rewards.map((c, i) => el('span', {
      className: `game__loginday${i + 1 < l.day || (l.claimed && i + 1 === l.day) ? ' game__loginday--done' : ''}${i + 1 === l.day ? ' game__loginday--today' : ''}`,
    }, [el('small', {}, [fmt(ui.loginDay, { n: i + 1 })]), el('strong', {}, [i === 6 ? `${c}+🌈` : String(c)])])));
  }
  function openLoginReward(onDone) {
    clear(overlay);
    overlay.hidden = false;
    screen.classList.add('game--overlay');
    const l = profile.login;
    overlay.append(el('div', { className: 'game__panel game__panel--login' }, [
      el('h2', { className: 'game__title' }, [ui.loginTitle]),
      el('p', { className: 'game__sub' }, [fmt(ui.loginSub, { n: l.day })]),
      loginRow(),
      el('button', {
        className: 'game__choice game__choice--primary', type: 'button',
        onClick: () => {
          const got = profile.claimLogin();
          closeOverlay();
          if (got) {
            sfx.play('victory'); haptic([20, 40, 20]);
            showToast(fmt(ui.loginGot, { n: got.coins }), 2600);
            if (got.rainbow) later(2800, () => showToast(ui.rainbowUnlocked, 3600));
          }
          onDone?.();
        },
      }, [el('strong', {}, [fmt(ui.loginCollect, { n: l.coins })])]),
    ]));
  }
  /** The words of a daily challenge, in the player's language. */
  function challengeText(c) {
    return fmt(ui[`ch_${c.key}`] || c.id, { n: c.n });
  }
  const HAT_NAMES = Object.fromEntries([...FANCY_HATS, ...PREMIUM_COLORS, ...SPECIAL_EMOJIS].map(x => [x.id, x.name || x.symbol || x.label || 'this item']));
  function openProfile({ fromMenu = false, tab = null } = {}) {
    if (tab) profileTab = tab;
    const inMatch = !!match && !!players.length;
    // a live preview only on your own seat, and only when nobody else is watching that seat
    const canPreview = !net && (!inMatch || playMode === 'play');
    if (inMatch && isSolo() && !paused) holdTimers(true);
    closeTalk();
    clear(overlay);
    overlay.hidden = false;
    screen.classList.add('game--overlay', ...(canPreview ? ['game--profile'] : []));

    const applyLook = (look) => {
      const saved = profile.setLook(look);
      if (canPreview) world?.story?.setLook(HUMAN_SEAT, { ...saved, gender: profile.gender });
      paintPicker();
      paintProfileBtn();
    };
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
      filterPresets();
    });
    // male characters under Male, female under Female
    const filterPresets = () => [...presetGrid.children].forEach((c) => { c.hidden = c.dataset.gender !== profile.gender; });
    const photoInput = el('input', { attrs: { type: 'file', accept: 'image/*', 'aria-label': 'Choose a photo' } });
    photoInput.hidden = true;
    const photoNote = el('small', { className: 'game__netnote' }, ['Your photo stays on this phone. Other players see your character.']);
    const photoRow = el('div', { className: 'game__photo' }, [
      el('button', { className: 'game__choice', type: 'button', onClick: () => photoInput.click() }, [el('strong', {}, ['📷 Use my photo'])]),
      el('button', { className: 'game__back', type: 'button', onClick: () => { clearPhoto(); paintProfileBtn(); rankRefresh?.(); showToast('Photo removed', 1500); } }, ['Remove photo']),
      photoInput, photoNote,
    ]);
    photoInput.addEventListener('change', async () => {
      try { await setPhotoFromFile(photoInput.files?.[0]); paintProfileBtn(); rankRefresh?.(); showToast('Profile photo saved', 1600); } catch { showToast('That picture could not be used', 2000); }
      photoInput.value = '';
    });
    const row = (label, control) => el('label', { className: 'game__row-field' }, [el('span', {}, [label]), control]);

    /* character */
    const presetGrid = el('div', { className: 'game__presets', attrs: { role: 'listbox', 'aria-label': ui.character } });
    function paintPicker() {
      [...presetGrid.children].forEach(c => c.classList.toggle('game__preset--on', c.dataset.id === profile.look.id));
    }
    PRESETS.forEach((p) => {
      const name = lookName(p.id, p.label);
      presetGrid.append(el('button', {
        className: 'game__preset', type: 'button', attrs: { 'data-id': p.id, 'aria-label': name, title: name },
        onClick: () => {
          profile.setGender(p.gender);
          genderSeg.paintValue(p.gender);
          applyLook(lookOf(p.id));
          refreshCustom();
        },
      }, [el('span', { className: 'game__preset-face', html: portraitSvg(lookOf(p.id)) }), el('small', {}, [name])]));
      presetGrid.lastChild.dataset.gender = p.gender;
    });
    filterPresets();

    // the colours you can wear: the usual ones, and the special ones you bought
    const clothColours = () => [...CLOTH_COLORS, ...PREMIUM_COLORS.filter(c => profile.owns(c.id)).map(c => c.hex)];

    /* rewards: today's challenges, this week, and what coins and ranks unlock */
    const rewardsBox = el('div', { className: 'game__rewards' });
    function paintRewards() {
      clear(rewardsBox);
      const d = profile.daily;
      const hrs = Math.floor(d.endsIn / 3600000), mins = Math.floor((d.endsIn % 3600000) / 60000);
      const wk = profile.week;
      const me = { name: `${myName()} (${ui.you})`, points: wk.points, me: true };
      const table = [me, ...wk.rivals].sort((a, b) => b.points - a.points).slice(0, 10);
      const item = (face, title, sub, action) => el('div', { className: 'game__shopitem' }, [
        el('span', { className: 'game__shopitem-face', html: face }),
        el('span', { className: 'game__shopitem-text' }, [el('strong', {}, [title]), sub ? el('small', {}, [sub]) : null]),
        action,
      ]);
      const buyBtn = (id, price) => el('button', {
        className: 'game__buy', type: 'button', attrs: { 'aria-label': `${ui.buy} ${price}` },
        onClick: async () => {
          const what = HAT_NAMES?.[id] || 'this';
          if (!(await confirmSpend({ what, price, coins: profile.coins }))) return;
          if (!profile.buy(id)) { showToast(ui.notEnough, 1800); return; }
          sfx.play('confirm'); haptic([15, 30, 15]);
          showToast(ui.bought, 1600);
          paintRewards(); refreshCustom(); rankRefresh?.();
        },
      }, [el('span', { html: iconSvg('coin') }), String(price)]);
      rewardsBox.append(
        el('div', { className: 'game__coinbar' }, [el('span', { html: iconSvg('coin') }), el('strong', {}, [String(profile.coins)]), el('span', {}, [ui.coins])]),
        el('h3', { className: 'game__h3' }, [ui.loginTitle]),
        loginRow(),
        el('h3', { className: 'game__h3' }, [ui.dailyTitle]),
        el('ol', { className: 'game__daily' }, d.items.map(c => el('li', { className: c.done ? 'game__daily--done' : '' }, [
          el('span', { className: 'game__daily-text' }, [challengeText(c)]),
          el('span', { className: 'game__bar' }, [el('span', { style: { width: `${Math.round((c.progress / c.n) * 100)}%` } })]),
          el('small', {}, [c.done ? `✓ +${c.coins}` : `${c.progress}/${c.n} · +${c.coins}`]),
        ]))),
        el('p', { className: 'game__netnote' }, [`${d.bonus ? '✓ ' : ''}${fmt(ui.dailyBonus, { n: d.bonusCoins })} · ${fmt(ui.dailyNew, { h: hrs, m: mins })}`]),
        el('h3', { className: 'game__h3' }, [ui.weekTitle]),
        el('ol', { className: 'game__hall game__week' }, table.map(r => el('li', { className: r.me ? 'game__week--me' : '' }, [
          el('strong', {}, [r.points.toLocaleString('en')]), el('span', {}, [r.name]),
        ]))),
        el('p', { className: 'game__netnote' }, [wk.rivals.length ? ui.weekNote : ui.weekEmpty]),
        el('h3', { className: 'game__h3' }, [ui.hats]),
        el('div', { className: 'game__shop' }, FANCY_HATS.map((h) => {
          const name = lookName(h.id, h.label);
          const face = portraitSvg({ ...profile.look, headwear: h.id, id: 'custom' });
          const wearing = profile.look.headwear === h.id;
          if (profile.owns(h.id)) {
            return item(face, name, wearing ? ui.wearing : ui.owned, el('button', {
              className: `game__buy${wearing ? ' game__buy--on' : ''}`, type: 'button',
              onClick: () => { applyLook({ ...profile.look, headwear: wearing ? 'none' : h.id, id: 'custom' }); refreshCustom(); paintRewards(); },
            }, [wearing ? ui.takeOff : ui.wear]));
          }
          if (h.rank != null) return item(face, name, fmt(ui.needRank, { title: rankTitle({ ...RANKS[h.rank], index: h.rank }) }), el('span', { className: 'game__lock', html: '🔒' }));
          return item(face, name, ui.forCoins, buyBtn(h.id, h.price));
        })),
        el('h3', { className: 'game__h3' }, ['🏆 Achievements']),
        el('p', { className: 'game__netnote' }, [`${achievementList().filter(a => a.done).length} / ${ACHIEVEMENTS.length}`]),
        el('div', { className: 'game__achievements' }, achievementList().map(a => el('div', { className: `achv achv--${a.tier}${a.done ? ' achv--done' : ''}` }, [
          el('span', { className: 'achv__icon' }, [a.done ? a.icon : '🔒']),
          el('span', { className: 'achv__text' }, [el('small', { className: 'achv__tier', style: { color: TIERS[a.tier].color } }, [TIERS[a.tier].name]), el('strong', {}, [a.name]), el('small', {}, [`${a.hint} · +${a.coins} coins`])]),
        ]))),
        el('h3', { className: 'game__h3' }, [ui.specialEmojis]),
        el('div', { className: 'game__shop' }, SPECIAL_EMOJIS.map((e) => {
          const face = `<span class="game__shopemoji">${e.symbol}</span>`;
          if (profile.owns(e.id)) return item(face, e.symbol, ui.emojiOwned, null);
          return item(face, e.symbol, emojiHow(e), e.price != null ? buyBtn(e.id, e.price) : el('span', { className: 'game__lock', html: '🔒' }));
        })),
        el('h3', { className: 'game__h3' }, [ui.colours]),
        el('div', { className: 'game__shop' }, PREMIUM_COLORS.map((c) => {
          const face = `<span class="game__swatch game__swatch--big" style="background:${c.hex}"></span>`;
          const name = lookName(c.id, c.label);
          return profile.owns(c.id) ? item(face, name, ui.colourOwned, null) : item(face, name, ui.forCoins, buyBtn(c.id, c.price));
        })),
        el('p', { className: 'game__netnote' }, [ui.coinsNote]),
      );
    }
    paintRewards();

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
    const choose = (list, key) => el('select', {
      className: 'game__select', attrs: { 'aria-label': key },
      onChange: (e) => applyLook({ ...profile.look, [key]: e.target.value, id: 'custom' }),
    }, list.map(o => el('option', { attrs: { value: o.id, ...(profile.look[key] === o.id ? { selected: 'selected' } : {}) } }, [lookName(o.id, o.label)])));
    function refreshCustom() {
      clear(customBox);
      const bindi = el('input', { attrs: { type: 'checkbox', ...(profile.look.bindi ? { checked: 'checked' } : {}) } });
      bindi.addEventListener('change', () => applyLook({ ...profile.look, bindi: bindi.checked, id: 'custom' }));
      customBox.append(
        row(ui.age, choose(AGES, 'age')), row(ui.hair, choose(HAIR_STYLES, 'hair')),
        row(ui.hairColor, swatches(HAIR_COLORS, 'hairColor')), row(ui.skin, swatches(SKIN_TONES, 'skin')),
        row(ui.eyes, swatches(EYE_COLORS, 'eyes')), row(ui.outfit, choose(OUTFITS, 'outfit')),
        row(ui.color1, swatches(clothColours(), 'color')), row(ui.color2, swatches(clothColours(), 'color2')),
        row(ui.pants, swatches(PANTS_COLORS, 'pants')), row(ui.glasses, choose(GLASSES, 'glasses')),
        row(ui.facial, choose(FACIAL, 'facial')), row(ui.headwear, choose([...HEADWEAR, ...FANCY_HATS.filter(h => profile.owns(h.id))], 'headwear')),
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
          el('strong', {}, [`${rank.icon} ${rankTitle(rank)}`]),
          el('div', { className: 'game__bar' }, [el('span', { style: { width: `${Math.round(rank.progress * 100)}%` } })]),
          el('span', {}, [rank.next ? fmt(ui.nextRank, { pts: num(rank.next.at - all.points), title: rankTitle({ ...rank.next, index: rank.index + 1 }) }) : ui.topRank]),
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
          const t = badgeText(b);
          return el('span', { className: `game__badge${on ? ' game__badge--on' : ''}`, attrs: { title: `${t.name}: ${t.hint}` } }, [
            el('b', {}, [b.icon]), el('small', {}, [t.name]),
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
        rankRefresh?.();
        showToast(ui.resetDone, 1800);
      },
    }, [ui.resetScore]);

    /* settings */
    const currentGraphics = world?.story?.graphics || settingsStore.get('graphics') || 'low';
    const graphics = el('select', {
      className: 'game__select', attrs: { 'aria-label': ui.graphics },
      onChange: (e) => { settingsStore.set('graphics', e.target.value); world?.story?.setGraphics(e.target.value); },
    }, [['low', ui.gLow], ['auto', ui.gAuto], ['medium', ui.gMedium], ['high', ui.gHigh], ['ultra', ui.gUltra]].map(([v, label]) => (
      el('option', { attrs: { value: v, ...(currentGraphics === v ? { selected: 'selected' } : {}) } }, [label])
    )));
    const languageSelect = el('select', {
      className: 'game__select', attrs: { 'aria-label': ui.language },
      onChange: async (e) => {
        await changeLanguage(e.target.value);
        // the panel is written in the old language: draw it again in the new one
        openProfile({ fromMenu });
      },
    }, LANGUAGES.map(l => el('option', { attrs: { value: l.id, ...(l.id === lang ? { selected: 'selected' } : {}) } }, [l.label])));
    /* the daily reminder: asks the browser's permission only when you switch it on */
    const reminderRow = () => {
      const s = reminderSettings();
      const box = el('input', { attrs: { type: 'checkbox', role: 'switch', ...(s.on ? { checked: 'checked' } : {}) } });
      const time = el('input', { className: 'game__reminder-time', attrs: { type: 'time', value: s.time, 'aria-label': 'Reminder time' } });
      const note = el('p', { className: 'game__netnote' }, [reminderSupported() ? 'While ChitPlay is open, or around this time on an installed app in Chrome.' : 'This browser can’t show reminders.']);
      box.addEventListener('change', async () => {
        const on = await setReminder(box.checked, lang, time.value);
        box.checked = on;
        if (box.checked !== on || (!on && Notification?.permission === 'denied')) note.textContent = 'Notifications are blocked in your browser’s settings.';
      });
      time.addEventListener('change', () => { if (box.checked) setReminder(true, lang, time.value); else setReminder(false, lang, time.value); });
      return el('div', { className: 'game__reminder' }, [el('label', { className: 'game__switch' }, [el('span', { className: 'game__switch-ico' }, ['🔔']), el('span', {}, ['Daily reminder']), box]), time, note]);
    };
    const toggle = (iconName, iconOff, label, isOn, set) => {
      const ico = el('span', { className: 'game__switch-ico' });
      const input = el('input', { attrs: { type: 'checkbox', role: 'switch', ...(isOn() ? { checked: 'checked' } : {}) } });
      const paint = () => { ico.innerHTML = iconSvg(input.checked ? iconName : iconOff); };
      input.addEventListener('change', () => { set(input.checked); paint(); });
      paint();
      return el('label', { className: 'game__switch' }, [ico, el('span', {}, [label]), input, el('i', { attrs: { 'aria-hidden': 'true' } })]);
    };
    const settingsBox = el('div', { className: 'game__custom' }, [
      row(ui.language, languageSelect),
      el('p', { className: 'game__netnote' }, [ui.languageHelp]),
      row(ui.graphics, graphics),
      el('p', { className: 'game__netnote' }, [ui.graphicsHelp]),
      toggle('sound', 'soundOff', ui.soundLabel, soundOn, setSound),
      toggle('chat', 'chatOff', ui.chatLabel, chatOn, setChat),
      reminderRow(),
    ]);

    /* one thing at a time: the panel never grows, only the tab's own content scrolls */
    const TABS = [
      ['character', 'user', ui.character, () => [photoRow, genderSeg, presetGrid]],
      ['look', 'palette', ui.custom, () => [customBox]],
      ['rewards', 'gift', ui.rewards, () => { paintRewards(); return [rewardsBox]; }],
      ['score', 'trophy', ui.score, () => {
        const st = playStats();
        const top = Object.entries(st.plays).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const most = el('div', { className: 'game__most' }, [el('h3', { className: 'game__h3' }, ['🎮 Most played']), ...(top.length ? top.map(([slug, n]) => { const g = gameBySlug(slug); return el('div', { className: 'game__mostrow' }, [el('span', { html: g ? logoSvg(g, 36) : '' }), el('strong', {}, [g?.name || slug]), el('small', {}, [`${n} played · ${st.wins[slug] || 0} won${st.best[slug] ? ` · best ${st.best[slug]}` : ''}`])]); }) : [el('p', { className: 'game__netnote' }, ['Play a few games and they show up here.'])])]);
        return [most, scoreBox, resetBtn];
      }],
      ['settings', 'sliders', ui.settings, () => [settingsBox]],
    ];
    const tabBody = el('div', { className: 'game__tabbody', attrs: { role: 'tabpanel' } });
    const tabBar = el('div', { className: 'game__tabs', attrs: { role: 'tablist' } }, TABS.map(([id, iconName, label]) => el('button', {
      className: 'game__tab', type: 'button', attrs: { role: 'tab', 'data-tab': id, title: label },
      onClick: () => { profileTab = id; showTab(); },
    }, [el('span', { html: iconSvg(iconName) }), el('small', {}, [label])])));
    function showTab() {
      [...tabBar.children].forEach((b) => {
        const on = b.dataset.tab === profileTab;
        b.classList.toggle('game__tab--on', on);
        b.setAttribute('aria-selected', String(on));
      });
      clear(tabBody);
      tabBody.append(...TABS.find(t => t[0] === profileTab)[3]());
      tabBody.scrollTop = 0;
    }

    const finish = () => {
      screen.classList.remove('game--profile');
      world?.story?.portrait(null);
      previewTable();
      if (fromMenu) { openMenu(); return; }
      closeOverlay();
      if (inMatch && isSolo()) holdTimers(false);
      rankRefresh?.();
    };
    const panel = el('div', { className: 'game__panel game__panel--profile' }, [
      el('div', { className: 'game__pfhead' }, [
        el('label', { className: 'game__pfname' }, [el('small', {}, [ui.yourName]), nameInputEl()]),
        el('button', { className: 'game__panel-close', type: 'button', attrs: { 'aria-label': ui.done }, html: iconSvg('close'), onClick: finish }),
      ]),
      tabBar,
      tabBody,
      el('button', { className: 'game__choice game__choice--primary game__choice--done', type: 'button', onClick: finish }, [el('strong', {}, [ui.done])]),
    ]);
    overlay.append(panel);
    // the character stands in whatever part of the screen the panel leaves free
    if (canPreview) world?.story?.portrait(HUMAN_SEAT, panel);
    showTab();
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
      sfx.fanStop();
      keepAwake(false);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('popstate', onPopState);
      clearTimeout(whisperEl._t);
      onModeChange = null;
      hudObserver.disconnect();
      calmObserver.disconnect();
      document.removeEventListener('pointerdown', onOutsideTap, true);
      world?.story?.setCalm(false);
      net?.room.close();
      net = null;
      world?.story?.end();
    },
  };
}
