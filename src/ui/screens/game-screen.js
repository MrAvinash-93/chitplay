import { el, clear } from '../../utils/dom.js';
import { GAME_PHASES } from '../../app/config.js?v=20261108-0613';
import { settingsStore } from '../../persistence/settings-store.js?v=20261108-0613';
import { profile, BADGES } from '../../persistence/profile-store.js?v=20261108-0613';
import { audioManager } from '../../audio/audio-manager.js';
import { loadWorld } from '../../world/world-loader.js?v=20261108-0613';
import { COUNTRIES, COUNTRY_ORDER, detectCountryInfo, localize, GAME_SLUGS, GAME_AKA, GAME_NAME_EN, GAME_ICON, ROLE_LATIN } from '../../world/countries.js?v=20261108-0613';
import { Dialogue, loadPack } from '../../world/dialogue.js?v=20261108-0613';
import { Match, CHEAT_PENALTY } from '../../world/match.js?v=20261108-0613';
import { voiceBox } from '../../world/voice.js?v=20261108-0613';
import { NearbyHost, NearbyGuest, nearbyError, isCode, newToken } from '../../net/nearby.js?v=20261108-0613';
import { cleanName, pickOpponents } from '../../world/names.js?v=20261108-0613';
import {
  PRESETS, AGES, HAIR_STYLES, OUTFITS, HEADWEAR, GLASSES, FACIAL, SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTH_COLORS, PANTS_COLORS,
  lookOf, cleanLook, randomLook, portraitSvg,
} from '../../world/character-looks.js?v=20261108-0613';
import { nextCaughtScene, nextCloseCall } from '../../world/cheat-lines.js?v=20261108-0613';
import { TALK_EMOJIS, TALK_LINE_COUNT, talkLine, isTalkEmoji } from '../../world/table-talk.js?v=20261108-0613';
import { LANGUAGES, isLanguage, useLanguage, languageId, strings, forfeits, lookName, rankTitle, badgeText } from '../../i18n/index.js?v=20261108-0613';
import { iconSvg } from '../icons.js?v=20261108-0613';

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
const LANGUAGE_TAGS = { en: 'en', hinglish: 'hi-Latn', urdu: 'ur-Latn', nepali: 'ne-Latn', bangla: 'bn-Latn', romaji: 'ja-Latn', korean_roman: 'ko-Latn', pinyin: 'zh-Latn', russian_latin: 'ru-Latn', german: 'de', french: 'fr', portuguese: 'pt', spanish: 'es' };
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
  const mode = 'en';                        // role names and rules stay in the game's own English text
  // the whole game can be read in the player's language (Latin letters); English by default
  let lang = isLanguage(settingsStore.get('chatLang')) ? settingsStore.get('chatLang') : 'en';
  const chatPack = () => (lang === 'en' ? country.lang : lang);
  let country = localize(base, mode);       // the edition as shown in the current text mode
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
  const paintProfileBtn = () => { profileBtn.innerHTML = portraitSvg(profile.look); };
  const langBtn = el('button', { className: 'game__exit game__langbtn', type: 'button', onClick: () => openLanguage() });
  const paintLangBtn = () => {
    langBtn.innerHTML = iconSvg('globe');
    langBtn.append(el('span', {}, [LANGUAGES.find(l => l.id === lang)?.short || 'EN']));
  };

  /* The three on/off switches: in the top bar, and again in the profile's settings */
  const chatOn = () => settingsStore.get('chatEnabled') !== false;
  const voiceOn = () => settingsStore.get('voiceEnabled') !== false;
  const soundOn = () => !!settingsStore.get('soundEnabled');
  function setChat(next) {
    settingsStore.set('chatEnabled', next);
    showToast(next ? ui.chatOn : ui.chatOff, 1600);
    if (!next) { voiceBox.stop(); world?.story?.clearTalk(); }
    paintSwitches();
  }
  function setSound(next) {
    settingsStore.set('soundEnabled', next);
    audioManager.setEnabled(next);
    if (next) { audioManager.unlock(); sfx.play('select'); }
    paintSwitches();
  }
  function setVoice(next) {
    settingsStore.set('voiceEnabled', next);
    voiceBox.setEnabled(next);
    paintSwitches();
  }
  const chatBtn = iconBtn('chat', () => setChat(!chatOn()));
  const soundBtn = iconBtn('sound', () => setSound(!soundOn()));
  const voiceBtn = iconBtn('mic', () => setVoice(!voiceOn()));
  function paintSwitches() {
    setIcon(chatBtn, chatOn() ? 'chat' : 'chatOff');
    setIcon(soundBtn, soundOn() ? 'sound' : 'soundOff');
    setIcon(voiceBtn, voiceOn() ? 'mic' : 'micOff');
    [[chatBtn, chatOn()], [soundBtn, soundOn()], [voiceBtn, voiceOn()]].forEach(([b, on]) => {
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('game__exit--off', !on);
    });
  }
  voiceBox.setEnabled(voiceOn());

  /* ─── Mobile comfort: rotate to landscape, keep the screen awake, haptics ─── */
  const isTouch = window.matchMedia?.('(pointer: coarse)').matches;
  const isLandscape = () => window.matchMedia('(orientation: landscape)').matches;
  const rotateBtn = iconBtn('rotate', () => toggleLandscape(), 'game__rotate');
  rotateBtn.hidden = !isTouch;

  /* On small screens the switches fold away behind one button, so the top bar never overflows */
  const toolsBox = el('div', { className: 'game__tools' }, [rotateBtn, chatBtn, voiceBtn, soundBtn]);
  const toolsBtn = iconBtn('sliders', () => toolsBox.classList.toggle('game__tools--open'), 'game__toolsbtn');

  /** Every label on the always-visible controls, for the first paint and after a language change. */
  function paintHud() {
    const label = (b, text) => { b.setAttribute('aria-label', text); b.title = text; };
    label(exitBtn, ui.menuTitle);
    label(profileBtn, ui.profile);
    label(langBtn, ui.language);
    label(chatBtn, ui.chatLabel);
    label(soundBtn, ui.soundLabel);
    label(voiceBtn, ui.voiceLabel);
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
    el('div', { className: 'game__top-right' }, [langBtn, toolsBox, toolsBtn, profileBtn]),
  ]);
  // the prompt, the chips and the rotate pill stack at the bottom, so they can never overlap
  const dock = el('div', { className: 'game__dock' }, [prompt, sheet, rotatePill]);
  const screen = el('div', { className: 'screen game', attrs: { 'aria-label': 'CHITPLAY' } }, [
    topBar, myChitEl, talkBtn, whisperEl, toast, dock, talkPanel, rotateHint, overlay,
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

  /* ─── Start sheet: swipe through the games, then play ─── */
  function chooseSetup() {
    return new Promise((resolve) => {
      // a language change rebuilds the sheet in place, on the same game
      let onKey = null;
      function build() {
        if (onKey) document.removeEventListener('keydown', onKey);
        // your pinned games first, then your own country's game
        const order = [...new Set([...profile.pins.filter(id => COUNTRIES[id]), detected.id, ...COUNTRY_ORDER])];
        setRound('CHITPLAY');
        clear(sheet);
        sheet.className = 'game__sheet game__sheet--show game__sheet--start game__sheet--home';

        // 1) The game carousel: one big card per game, swipe (or ‹ ›) to the next
        const cards = new Map();
        const track = el('div', { className: 'game__carousel', attrs: { role: 'listbox', 'aria-label': ui.chooseGame, tabindex: '0' } },
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
              star.innerHTML = iconSvg(on ? 'starOn' : 'star');
              star.classList.toggle('game__star--on', on);
              star.setAttribute('aria-label', on ? ui.pinRemove : ui.pinAdd);
              star.setAttribute('aria-pressed', String(on));
              badge.textContent = on ? ui.pinned : id === detected.id ? ui.yourGame : '';
              badge.hidden = !badge.textContent;
            };
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
          attrs: { 'aria-label': label }, html: iconSvg(dir < 0 ? 'left' : 'right'), onClick: () => step(dir),
        });
        const dots = el('div', { className: 'game__dots', attrs: { 'aria-hidden': 'true' } }, order.map(id => el('span', { attrs: { 'data-id': id } })));
        const carousel = el('div', { className: 'game__carouselwrap' }, [arrow(-1, ui.prevGame), track, arrow(1, ui.nextGame)]);

        // 2) Everything about the chosen game (re-filled on every swipe)
        const details = el('div', { className: 'game__chosen' });

        // 3) Start buttons + options (built once)
        const leave = (value) => {
          audioManager.unlock(); sfx.play('select'); haptic(15);
          // the game you choose moves to the front of your Indoor Games, with a star
          if (value !== 'rejoin' && value !== 'scan') profile.pin(base.id);
          document.removeEventListener('keydown', onKey);
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
          playerFace.innerHTML = portraitSvg(profile.look);
          playerName.textContent = profile.name;
          playerRank.textContent = `${rank.icon} ${fmt(ui.rankLine, {
            title: rankTitle(rank), pts: profile.all.points.toLocaleString('en'),
            streak: profile.streak > 1 ? fmt(ui.streak, { n: profile.streak }) : '',
          })}`;
        };
        rankRefresh();

        const ticket = loadRejoin();
        const pick = el('div', { className: 'game__home-pick' }, [
          el('p', { className: 'game__tagline' }, [ui.tagline]),
          el('h2', { className: 'game__category' }, [ui.indoorTitle]),
          carousel,
          dots,
        ]);
        const go = el('div', { className: 'game__home-go' }, [
          playerCard,
          ...(ticket?.left ? [bigPlay('restart', ui.rejoinBtn, fmt(ui.rejoinSub, { code: ticket.code }), 'rejoin')] : []),
          bigPlay('play', ui.play, ui.playSub, 'play'),
          el('div', { className: 'game__tiles' }, [
            tile('eye', ui.watch, ui.watchSub, 'watch'),
            tile('wifi', ui.nearby, ui.nearbySub, 'nearby'),
            tile('phone', ui.pass, ui.passSub, 'pass'),
            tile('qr', ui.scanJoin, ui.scanSub, 'scan'),
          ]),
          rounds,
        ]);
        sheet.append(pick, go, details);

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
              el('summary', {}, [el('span', { html: iconSvg('book') }), ui.howto]),
              el('p', { className: 'game__sub' }, [country.ruleText]),
              el('p', { className: 'game__aka' }, [
                `${(GAME_AKA[base.id] || []).slice(0, 5).join(' · ')} · `,
                el('a', { className: 'game__howto', attrs: { href: `games/${GAME_SLUGS[base.id]}/` } }, ['→']),
              ]),
              seoIntro,
            ]),
            // always visible, so visitors and ad-network reviewers can find these pages
            el('nav', { className: 'game__legal', attrs: { 'aria-label': ui.about } }, [
              ['about/', ui.about], ['contact/', ui.contact], ['privacy/', ui.privacy], ['terms/', ui.terms],
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
        onKey = (e) => {
          if (e.target?.matches?.('input, select, textarea')) return;
          if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
        };
        document.addEventListener('keydown', onKey);
        requestAnimationFrame(() => centerOn(base.id, false));
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
    if (msg.t === 'setGame') { if (!matchRunning && COUNTRIES[msg.game]) { changeRoomGame(msg.game); net.repaint?.(); } return; }
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
    country = localize(base, mode);
    ui = uiFor();
    net.seat = m.seat;
    players = m.players.map((p, i) => ({
      name: String(p.name).slice(0, 16), gender: p.gender === 'f' ? 'f' : 'm', look: cleanLook(p.look, p.look?.id),
      color: SHIRTS[i], isHuman: i === m.seat, remote: null,
    }));
    voiceBox.setCast(players.map(p => ({ gender: p.gender, age: p.look.age })));
    exitBtn.hidden = false;
    matchRunning = true;
    setMyChit(null);
    setTalkAvailable(true);
    armBackGuard();
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
  function nearbyFlow({ code: linkCode = null, rejoin = null, scan = false } = {}) {
    return new Promise((resolve) => {
      const nameInput = nameInputEl();
      const nameNow = () => myName();
      const joinExtras = () => ({ gender: profile.gender, look: profile.look });
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
        import('../../net/qr.js?v=20261108-0613').then(({ qrSvg }) => {
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
      const gamePicker = () => el('label', { className: 'game__row-field' }, [el('span', {}, [ui.gameLabel]), gameSelect()]);
      let onLobbyPage = false;

      function menu() {
        status.textContent = '';
        page(
          el('h2', { className: 'game__title' }, [ui.nearby]),
          el('p', { className: 'game__sub' }, [ui.nearbySub]),
          el('label', { className: 'game__field' }, [el('span', {}, [ui.yourName]), nameInput]),
          big(ui.host, fmt(ui.hostSub, { game: GAME_NAME_EN[base.id], n: rounds() }), hostLobby, true, 'home'),
          big(ui.scanQr, ui.scanSub, () => joinPage(null, true), false, 'qr'),
          big(ui.join, ui.joinSub, () => joinPage(), false, 'wifi'),
          el('p', { className: 'game__netnote' }, [ui.nearbyNote]),
          backBtn(() => resolve('back')),
        );
      }

      async function hostLobby() {
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
        const startBtn = big(ui.startNeedOne, GAME_NAME_EN[base.id], () => {
          if (!room.guests.size) return;
          // each friend keeps this seat for the whole room, even if their phone drops
          net.seats = room.list.slice(0, 3).map(g => ({ token: g.token, name: g.name, gender: g.gender, look: g.look }));
          net.name = room.hostLabel;
          room.lock();
          lobbyBack = null;
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
        net = { role: 'host', room, name, seats: [], lastEnd: null, repaint: () => paint() };
        armBackGuard();
        const paint = () => {
          if (room.locked) return;   // the lobby is over: never paint it on friends' phones mid-match
          subEl.textContent = fmt(ui.hostSub, { game: GAME_NAME_EN[base.id], n: rounds() });
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
        const subEl = el('p', { className: 'game__sub' });
        const showLobby = () => {
          lobbyBack = null;
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
        showLobby();
        paint();
        status.textContent = ui.connecting;
        try {
          const code = await room.open();
          if (net?.room !== room) return;   // Back was pressed while connecting
          codeEl.textContent = `${code.slice(0, 3)} ${code.slice(3)}`;
          status.textContent = '';
          inviteBtn.hidden = false;
          keepAwake(true);
          import('../../net/qr.js?v=20261108-0613').then(({ qrSvg }) => {
            const svg = qrSvg(inviteUrl(code), ui.qrLabel);
            if (svg) qrBox.append(svg);
          }).catch(() => {});   // no QR: the link and the code still work
        } catch (e) {
          if (net?.room !== room) return;
          room.close();
          net = null;
          status.textContent = ui[nearbyError(e)];
          codeEl.textContent = '✕';
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
        const scanner = import('../../net/qr-scan.js?v=20261108-0613');
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
        page(
          el('h2', { className: 'game__title' }, [fmt(ui.joined, { host: m.host })]),
          el('p', { className: 'game__sub' }, [fmt(ui.hostSub, { game: GAME_NAME_EN[g], n: m.rounds })]),
          gamePicker(),
          el('ol', { className: 'game__lobby' }, m.players.map((n, i) => el('li', { className: 'on' }, [`${i === 0 ? '⭐' : '✅'} ${n}`]))),
          el('p', { className: 'game__netstatus' }, [ui.waitStart]),
          m.players.length < 4 && guestCode ? big(ui.showQr, ui.showQrSub, () => showBigQr(guestCode), false, 'qr') : null,
          backBtn(goBack),
        );
        // the room behind the sheet shows the game the host picked
      }

      if (rejoin) rejoinPage(rejoin);
      else if (linkCode) joinPage(linkCode);
      else if (scan) joinPage(null, true);
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
      await startMatch(['watch', 'pass'].includes(saved.playMode) ? saved.playMode : 'play', saved);
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
      if (pm === 'scan') {
        nearbyStart = { scan: true };
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
      match = Match.restore(base, saved.match);
    } else {
      const human = pm === 'play' || pm === 'nearby';
      // new strangers at the table every match; the ones on the start screen play the first one
      const table = cast || makeCast();
      cast = null;
      players = table.map((p, i) => ({ name: p.name, gender: p.gender, look: { ...p.look, skin: country.theme.skins[i % country.theme.skins.length] }, color: SHIRTS[i], isHuman: false, remote: null }));
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
      } else if (human) players[HUMAN_SEAT] = { ...players[HUMAN_SEAT], name: myName(), gender: profile.gender, look: profile.look, isHuman: true };
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
    setMyChit(null);
    setTalkAvailable(pm === 'play' || pm === 'nearby');
    sfx.fanStart();
    renderScores();

    S().setCountry(country);
    S().begin(players.map(p => ({
      name: p.name, look: p.look, color: p.color, isHuman: p.isHuman,
      label: isMe(p) && p.name !== ui.you ? `${p.name} (${ui.you})` : p.name,
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
    // on a shared phone the profile belongs to the seat that holds it
    const me = playMode === 'pass' ? HUMAN_SEAT : players.findIndex(p => p.isHuman);
    matchRunning = false;
    setTalkAvailable(false);
    let progress = null;
    if (me >= 0) {
      progress = profile.recordMatch({
        mode: net ? 'nearby' : 'local', won: w === me, score: totals[me], catches: catches?.[me] || 0, escapes: escapes?.[me] || 0,
        cheats: cheats?.[me] || 0, caught: caughtCheats?.[me] || 0, game, rounds,
      });
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
    country = localize(base, mode);
    ui = uiFor();
    voiceBox.setLanguages(country.voice);
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
        body.append(el('div', { className: 'game__talk-emojis' }, TALK_EMOJIS.map((e, i) => el('button', {
          className: 'game__talk-emoji', type: 'button', attrs: { 'aria-label': e },
          onClick: () => { sendEmoji(target, i); closeTalk(); },
        }, [e]))));
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
    haptic(10);
  }
  /** Everyone at the table sees it fly: from the sender's head to whoever it was meant for. */
  function deliverEmoji(from, to, i) {
    if (!isTalkEmoji(i) || !validSeat(from) || !allowed(from)) return;
    const target = validSeat(to) && to !== from ? to : null;
    const symbol = TALK_EMOJIS[i];
    S().throwEmoji(from, target, symbol);
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
      later(1000 + Math.random() * 1000, () => { if (alive && matchRunning) S().throwEmoji(who, from, pickOne(TALK_EMOJIS)); });
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
      el('span', { className: 'game__avatar', html: portraitSvg(profile.look) }),
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
  function openProfile({ fromMenu = false } = {}) {
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
      toggle('mic', 'micOff', ui.voiceLabel, voiceOn, setVoice),
      toggle('chat', 'chatOff', ui.chatLabel, chatOn, setChat),
    ]);

    /* one thing at a time: the panel never grows, only the tab's own content scrolls */
    const TABS = [
      ['character', 'user', ui.character, () => [genderSeg, presetGrid]],
      ['look', 'palette', ui.custom, () => [customBox]],
      ['score', 'trophy', ui.score, () => [scoreBox, resetBtn]],
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
      voiceBox.pause(false);
      voiceBox.stop();
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
