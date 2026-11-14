/**
 * The TV games: played on a big TV in the 3D room, with the players sitting in front of it holding
 * controllers. One person, a computer player, two people on one keyboard or two gamepads, or friends
 * on their own phones (the host's phone runs the game, the others show it and send their buttons).
 */
import { hintsLeft, showHint } from './hint.js?v=20261114-1515';
import { is2d } from './view-mode.js?v=20261114-1515';
import { adBreak } from './ad-breaks.js?v=20261114-1515';
import { resultAd } from './ads.js?v=20261114-1515';
import { W, H, TICK } from './video/lib.js?v=20261114-1515';
import { NearbyHost, nearbyError, peekTables, PUBLIC_TABLES, tableCode } from '../net/nearby.js?v=20261114-1515';
import { bestOf, gameFinished, holdPopups, popup, rankProgress } from './achievements.js?v=20261114-1515';
import { MOMENT, linesFor } from './talk.js?v=20261114-1515';
import { clearSaved, isReload, loadSaved, saveGame } from './resume.js?v=20261114-1515';
import { ask, confirmSpend } from './dialog.js?v=20261114-1515';
import { hotPrompt, resultImage, shareResult, suggestionRow } from './share.js?v=20261114-1515';
import { profile } from '../persistence/profile-store.js?v=20261114-1515';
import { reminderSettings, reminderSupported, setReminder } from './reminder.js?v=20261114-1515';

const V = '?v=20261114-1515';
const SEND_EVERY = 3;
const PUBLIC_WAIT_MS = 15000;
// the TV's picture: sharper on a computer, and sharper still on a big monitor where it is shown large
// on a phone the picture follows the screen's sharpness too (a retina phone at 1 looked soft and jagged),
// held back on phones with little memory so the game stays smooth
const SCALE = matchMedia('(pointer: fine)').matches ? (Math.max(screen.width, screen.height) >= 1600 ? 2 : 1.5)
  : ((window.devicePixelRatio || 1) >= 2 && (navigator.deviceMemory || 4) >= 4 ? 2 : (window.devicePixelRatio || 1) >= 1.5 ? 1.5 : 1);       // ticks between pictures sent to friends: twenty a second
const KEYS = [
  { KeyW: 'u', KeyS: 'd', KeyA: 'l', KeyD: 'r', Space: 'a', KeyF: 'a' },
  { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', Enter: 'a', KeyL: 'a' },
];

export async function runTv(ctx) {
  const { game, mode, world, h, btn, show, topBar, say, LANG, myName, myLook, localName, localLook, audio, emojis } = ctx;
  const haptic = ctx.haptic || (() => {});
  /** A fanfare if someone on this phone won, a shrug if they all lost. */
  const music = ctx.music || (() => {});
  const endSound = (res, seats) => { music(false); const w = res?.winners || []; audio(w.length && seats.length && !seats.some(x => w.includes(x)) ? 'lose' : 'victory'); haptic(w.length && seats.length && !seats.some(x => w.includes(x)) ? 'lose' : 'win'); };
  const logic = (await import(`./video/${game.slug}.js${V}`)).default;
  // games answered on a keypad or with answer buttons need room under the TV for every key (arcade.css)
  document.body.classList.toggle('tv-keys', !!(logic.keypad || logic.choices));
  const story = world?.story || null;
  const lines = linesFor(game.slug, LANG);

  /* the screen itself: on the TV in the room, and on its own when a phone wants it bigger */
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE; canvas.height = H * SCALE;
  canvas.className = `tvcanvas${logic.swipe ? ' tvcanvas--swipe' : ''}`;
  const g = canvas.getContext('2d');
  let r3 = null, view = null;
  try {
    const THREE = await import('../vendor/three.chitplay.min.js');
    const { createView } = await import(`./video/views.js${V}`);
    view = createView(game.slug);
    if (view) {
      r3 = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      r3.setPixelRatio(1);
      r3.setSize(W * SCALE, H * SCALE, false);
      r3.outputColorSpace = THREE.SRGBColorSpace;
      view.camera.aspect = W / H;
      view.camera.updateProjectionMatrix();
      // real shadows on the ground, where the phone has the power for them (the same phones that get the sharp picture)
      if (SCALE >= 1.5) { r3.shadowMap.enabled = true; r3.shadowMap.type = THREE.PCFSoftShadowMap ?? 2; }
    }
  } catch (e) { console.warn('[tv] no 3D, using the flat picture', e); view = null; r3 = null; }
  const bigBox = h('div', { class: 'tvbig', hidden: true });
  document.body.append(bigBox);
  // big on a computer, and on a phone held sideways, where the TV in the room would be too small to play
  let big = !story || matchMedia('(pointer: fine) and (min-width: 900px)').matches || matchMedia('(orientation: landscape) and (max-height: 560px)').matches;
  if (big) document.body.classList.add('tv-full');
  const setBig = (on) => {
    big = on;
    document.body.classList.toggle('tv-full', on);
    bigBox.hidden = !on;
    if (on) bigBox.append(canvas);
    story?.tvShow?.(!on);
  };
  // 2D: the flat picture, full screen, with no room behind it; back in 3D it goes where it was
  let bigIn3d = big;
  setBig(is2d() ? true : big);
  const onView = () => {
    if (is2d()) { bigIn3d = big; setBig(true); } else setBig(bigIn3d);
    // a game steered the other way in 2D gets its stick turned to match
    if (logic.flatAxis && document.querySelector('.tvpanel .stick')) { if (guestLink) guestPanel(); else playPanel(); }
    paint();
  };
  addEventListener('chitplay:view', onView);

  let players = [];       // { name, look, kind: 'me' | 'local' | 'bot' | 'guest', token }
  let state = null;
  let result = null;
  let loop = 0;
  let countdown = 0;
  let waitingFirst = false;
  let room = null;
  let tick = 0;
  const held = [{}, {}, {}, {}];
  const padHeld = [{}, {}, {}, {}];
  const guestHeld = new Map();
  const localSeats = () => players.map((p, i) => (p.kind === 'me' || p.kind === 'local' ? i : -1)).filter(i => i >= 0);
  const panelNow = () => document.querySelector('#party .panel');
  function shareState(countdown = 0) {
    if (!room || !state) return;
    if (typeof logic.publicState !== 'function') {
      room.broadcast({ t: 's', s: state, c: countdown });
      return;
    }
    room.guests.forEach((guest) => {
      const seat = players.findIndex(p => p.token === guest.token);
      room.send(guest.id, { t: 's', s: logic.publicState(state, seat), c: countdown });
    });
  }

  /* ─── the people in front of the TV ─── */
  function sit() {
    if (!story) return;
    story.begin([0, 1, 2, 3].map(k => (players[k]
      ? { name: players[k].name, look: players[k].look, color: '#d4a017', isHuman: false, label: players[k].name }
      : { name: '', look: players[0].look, color: '#d4a017', isHuman: false, label: '', hidden: true })));
    story.tvMode(true, { canvas, panel: panelNow(), players: players.length });
    story.tvShow?.(!big);
  }
  const seatAct = (seat, pose, emoji) => {
    if (!story || !players[seat]) return;
    if (pose) story.pose(seat, pose);
    if (emoji) story.emote(seat, emoji, 1.8);
  };
  let chatAt = 0;
  function botSays(seat, when) {
    if (players[seat]?.kind !== 'bot' || Date.now() - chatAt < 4000 || Math.random() > 0.5) return;
    chatAt = Date.now();
    const list = MOMENT[when];
    const text = lines[list[Math.floor(Math.random() * list.length)]];
    if (text) story?.say(seat, text);
    room?.broadcast({ t: 'say', seat, text });
  }
  function react(events) {
    for (const ev of events) {
      switch (ev.k) {
        case 'flap': if (story && Math.random() < 0.5) story.reachOut(ev.seat); audio('flap'); break;
        // cannons fire all the time: a soft puff only for the people playing here
        case 'fire': if (game.slug === 'bull-fight') { audio('whoosh'); seatAct(ev.seat, null, '💨'); } else if (game.slug === 'spin-duel' || game.slug === 'pen-fight') { if (localSeats().includes(ev.seat)) { audio('whoosh'); haptic('tap'); } } else if (localSeats().includes(ev.seat)) audio('flap'); break;
        case 'pass': audio('select'); break;
        case 'star': audio(ev.combo > 2 ? 'combo' : 'score'); if (ev.combo > 2) seatAct(ev.seat, 'cheer', '🔥'); else seatAct(ev.seat, 'clap', '⭐'); botSays(ev.seat, 'good'); break;
        case 'hit': audio('wrong'); if (localSeats().includes(ev.victim)) haptic('hit'); seatAct(ev.victim, null, '😵'); botSays(ev.victim, 'bad'); break;
        // the playground shouts: "Baraf!" from the tagger, a groan from whoever is caught, "Pani!" from a rescue
        case 'tag': case 'freeze': audio('wrong'); if (localSeats().includes(ev.victim)) haptic('hit'); seatAct(ev.victim, null, ev.k === 'freeze' ? '🧊' : '🏃'); botSays(ev.seat, 'good'); botSays(ev.victim, 'bad'); break;
        case 'thaw': audio('confirm'); if (localSeats().includes(ev.victim)) haptic('win'); seatAct(ev.victim, 'cheer', '💧'); botSays(ev.seat, 'good'); break;
        // Ghost Hostel
        case 'wake': audio('wrong'); story?.emojiPop('👻', 'The ghost is awake!'); break;
        case 'rage': audio('wrong'); story?.emojiPop('😡', 'Angry ghost! Hold on till sunrise'); break;
        case 'banish': audio('achieve'); story?.emojiPop('🌀', 'The ghost is blown away!'); break;
        case 'bang': if (Math.random() < 0.2) seatAct(ev.seat, null, '😨'); if (localSeats().includes(ev.seat)) audio('select'); break;
        case 'buy': if (localSeats().includes(ev.seat)) audio('confirm'); seatAct(ev.seat, 'clap', { bed: '🛏️', door: '🚪', fan: '🌀', fix: '🔧' }[ev.item] || null); break;
        case 'nope': if (localSeats().includes(ev.seat)) audio('wrong'); break;
        case 'round': if (game.slug === 'ghost-hostel') { audio('wrong'); story?.emojiPop('👻', 'Ghost level ' + ev.level + '!'); break; }
        if (game.slug === 'pin-spin') { audio('achieve'); seatAct(ev.seat, 'cheer', '📌'); if (ev.level % 5 === 4) story?.emojiPop('🟥', 'Big board next!'); break; }
          audio('confirm'); seatAct(ev.seat, 'cheer', '🎉'); seatAct(ev.victim, 'facepalm', null); botSays(ev.seat, 'good'); setTimeout(() => { seatAct(ev.seat, 'hold'); seatAct(ev.victim, 'hold'); }, 1400); break;
        // a new level in the endless games: a fanfare, and the players cheer (the TV shows the banner)
        case 'level': audio('achieve'); if (ev.seat >= 0) seatAct(ev.seat, 'cheer', '⬆️'); else players.forEach((_, i) => seatAct(i, 'cheer', i === 0 ? '⬆️' : null)); break;
        case 'crash': audio('crash'); if (localSeats().includes(ev.seat)) haptic('hit'); seatAct(ev.seat, 'facepalm', '😱'); botSays(ev.seat, 'bad'); break;
        default:
      }
    }
  }

  /* ─── what's being pressed: keyboard, gamepads, touch ─── */
  const onKey = (down) => (e) => {
    if (e.target?.matches?.('input, textarea, select')) return;
    const seatsHere = localSeats();
    for (let k = 0; k < 2; k++) {
      const key = KEYS[k][e.code];
      if (!key) continue;
      e.preventDefault();
      // alone, both sides of the keyboard work; two people get one side each
      const seat = seatsHere.length > 1 ? seatsHere[k] : seatsHere[0];
      if (seat != null) held[seat][key] = down;
      if (down && !e.repeat && result && key === 'a') rematchKey();
      if (down) firstPress();
    }
  };
  const downKey = onKey(true), upKey = onKey(false);
  addEventListener('keydown', downKey);
  addEventListener('keyup', upKey);
  function readPads() {
    const seatsHere = localSeats();
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    seatsHere.forEach((seat, n) => {
      const p = pads[n];
      padHeld[seat] = {};
      if (!p) return;
      const b = (i) => !!p.buttons[i]?.pressed;
      const x = p.axes[0] || 0, y = p.axes[1] || 0;
      padHeld[seat] = { a: b(0) || b(1) || b(2) || b(3) || b(7), u: b(12) || y < -0.5, d: b(13) || y > 0.5, l: b(14) || x < -0.5, r: b(15) || x > 0.5 };
      if (Math.abs(x) > 0.15 || Math.abs(y) > 0.15) { padHeld[seat].x = x; padHeld[seat].y = y; }
      if (padHeld[seat].a) { firstPress(); if (result) rematchKey(); }
    });
  }
  /*
   * A game whose left-right runs up and down the flat picture (Road Dash: in 3D the lanes run left to
   * right behind the rickshaw, in 2D they are stacked top to bottom) is steered with up and down in 2D.
   * Each phone does this for its own view, before its input is used or sent.
   */
  const turned = () => is2d() && logic.flatAxis === 'y';
  const turn = (o) => {
    if (!turned()) return o;
    return { ...o, l: !!(o.l || o.u), r: !!(o.r || o.d), u: false, d: false };
  };
  const inputOf = (seat) => {
    const a = held[seat] || {}, b = padHeld[seat] || {};
    const o = turn({ a: a.a || b.a, u: a.u || b.u, d: a.d || b.d, l: a.l || b.l, r: a.r || b.r });
    if (a.swipe) { o.swipe = a.swipe; delete a.swipe; }
    if (a.drag) { o.drag = a.drag; delete a.drag; }
    if (logic.analog) {
      o.x = Number.isFinite(a.x) ? a.x : Number.isFinite(b.x) ? b.x : (o.r ? 1 : 0) - (o.l ? 1 : 0);
      o.y = Number.isFinite(a.y) ? a.y : Number.isFinite(b.y) ? b.y : (o.d ? 1 : 0) - (o.u ? 1 : 0);
    }
    return o;
  };
  /*
   * Reaction games (logic.signal): every phone times its own players, from the moment the signal was
   * drawn on this screen to the moment of the tap, and sends that time with the tap. A slow network then
   * delays when the time arrives, never the time itself. A tap before the signal is sent as a false start.
   */
  const reflex = typeof logic.signal === 'function' ? { seen: new Map(), lastTap: 0, out: new Map() } : null;
  if (reflex) {
    const mark = (e) => { reflex.lastTap = Number.isFinite(e.timeStamp) && e.timeStamp > 0 ? e.timeStamp : performance.now(); };
    addEventListener('pointerdown', mark, true);
    addEventListener('keydown', (e) => { if (!e.repeat) mark(e); }, true);
  }
  /** Called after a frame is drawn: remember when this screen first showed each round's signal. */
  function reflexSeen() {
    if (!reflex || !state) return;
    const sig = logic.signal(state);
    if (sig?.go && !reflex.seen.has(sig.round)) reflex.seen.set(sig.round, performance.now());
    // a new question: whatever was typed for the last one is cleared
    if (keypad && sig && sig.round !== keypad.round) { keypad.round = sig.round; keypad.buf.clear(); paintKeypads(); }
  }
  /**
   * The timing fields for one seat's input; a new press is timed once and then carried until the next.
   * In a game with answer buttons (logic.choices) the press also says which answer it was (pick).
   */
  const CHOICE_KEYS = (logic.choices || [['a']]).map(c => c[0]);
  function reflexStamp(seat, input) {
    if (!reflex || !state) return {};
    const pick = CHOICE_KEYS.find(k => input?.[k]) || null;
    let o = reflex.out.get(seat) || {};
    const sig = logic.signal(state);
    // taps during the countdown before the game are someone trying the button, not a false start
    if (countdown > 0) { reflex.out.set(seat, { down: !!pick }); return {}; }
    if (pick && !o.down && sig) {
      const now = performance.now();
      const at = now - reflex.lastTap < 120 ? reflex.lastTap : now;
      const seen = reflex.seen.get(sig.round);
      o = sig.go && seen != null ? { rr: sig.round, rt: Math.max(0, Math.round(at - seen)), pick } : { early: sig.round };
    }
    o.down = !!pick;
    reflex.out.set(seat, o);
    return { rr: o.rr, rt: o.rt, early: o.early, pick: o.pick };
  }
  /*
   * Typed answers (logic.keypad = 'digits' or 'letters'): each phone keeps what its own player types and
   * sends the whole answer at once on OK, timed from when the question showed on that screen. Nothing
   * typed travels until it is sent, so quick typing never loses a key on a slow network.
   */
  const keypad = logic.keypad ? { buf: new Map(), sent: new Map(), round: null, views: new Map() } : null;
  const KEYPAD_MAX = 24;
  const keypadOk = (ch) => (logic.keypad === 'digits' ? /^[0-9]$/.test(ch) : /^[a-z]$/i.test(ch));
  const keypadSeatHere = () => (guestLink ? guestSeat : localSeats()[0]);
  function paintKeypads() {
    if (!keypad) return;
    keypad.views.forEach((view, seat) => {
      const sent = keypad.sent.get(seat);
      const done = sent && sent.rr === keypad.round;
      view.textContent = done ? `✓ ${sent.ans}` : (keypad.buf.get(seat) || '');
      view.classList.toggle('keypad__show--sent', !!done);
    });
  }
  function keypadType(seat, ch) {
    if (!keypad || seat == null || seat < 0 || !state) return;
    const sig = logic.signal?.(state);
    const sent = keypad.sent.get(seat);
    if (sent && sig && sent.rr === sig.round) return;            // one answer per question
    let b = keypad.buf.get(seat) || '';
    if (ch === 'back') b = b.slice(0, -1);
    else if (ch === 'ok') {
      if (!b || !sig?.go) return;
      const seen = reflex?.seen.get(sig.round);
      keypad.sent.set(seat, { rr: sig.round, ans: b, rt: seen != null ? Math.max(0, Math.round(performance.now() - seen)) : 0 });
      b = '';
      audio('select');
      if (guestLink) guestSendInput();
    } else if (keypadOk(ch) && b.length < KEYPAD_MAX) b += logic.keypad === 'letters' ? ch.toUpperCase() : ch;
    keypad.buf.set(seat, b);
    paintKeypads();
  }
  const keypadFields = (seat) => { const s = keypad?.sent.get(seat); return s ? { rr: s.rr, ans: s.ans, rt: s.rt } : {}; };
  if (keypad) {
    addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable]')) return;
      const ch = e.key === 'Backspace' ? 'back' : e.key === 'Enter' ? 'ok' : e.key.length === 1 ? e.key : null;
      if (!ch || (ch.length === 1 && !keypadOk(ch))) return;
      e.preventDefault();
      keypadType(keypadSeatHere(), ch);
    });
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function bindSwipe(element, seatFor) {
    if (!logic.swipe) return () => {};
    let pointerId = null, start = null;
    const down = (e) => {
      if (pointerId != null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      pointerId = e.pointerId;
      start = { x: e.clientX, y: e.clientY, at: performance.now(), eligible: countdown === 0 && !result };
      element.setPointerCapture?.(pointerId);
      element.classList.add('swipe--on');
    };
    const finish = (e) => {
      if (e.pointerId !== pointerId) return;
      const from = start, dx = e.clientX - from.x, dy = e.clientY - from.y;
      const distance = Math.hypot(dx, dy), elapsed = performance.now() - from.at;
      pointerId = null; start = null;
      element.classList.remove('swipe--on');
      if (!from.eligible || countdown > 0 || result || elapsed > 3000 || distance < 18) return;
      const speed = distance / Math.max(1, elapsed);
      const swipe = {
        x: Math.round(dx / distance * 1000) / 1000,
        y: Math.round(dy / distance * 1000) / 1000,
        power: Math.round(clamp(speed / 1.25, 0.12, 1) * 1000) / 1000,
      };
      const seat = seatFor();
      if (!Number.isInteger(seat) || seat < 0) return;
      if (guestLink) {
        guestHeld.set('swipe', swipe);
        guestSendInput();
        guestHeld.delete('swipe');
      } else {
        held[seat].swipe = swipe;
        firstPress();
      }
    };
    const cancel = (e) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null; start = null;
      element.classList.remove('swipe--on');
    };
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', cancel);
    return () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointerup', finish);
      element.removeEventListener('pointercancel', cancel);
    };
  }
  const swipeCanvasCleanup = bindSwipe(canvas, () => guestLink ? guestSeat : localSeats()[0]);
  /*
   * Drag on the TV picture (logic.drag): press on something, let go somewhere else. The two points are
   * sent in the picture's own units (W × H), so every screen size means the same thing. A game showing
   * more than one board here says whose board a point is on (logic.dragSeat).
   */
  const dragCleanup = (() => {
    if (!logic.drag) return () => {};
    let from = null;
    const at = (e) => { const r = canvas.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) / r.width * W), y: Math.round((e.clientY - r.top) / r.height * H) }; };
    const down = (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); from = { ...at(e), id: e.pointerId }; canvas.setPointerCapture?.(e.pointerId); };
    const up = (e) => {
      if (!from || e.pointerId !== from.id) return;
      const to = at(e), drag = { x0: from.x, y0: from.y, x1: to.x, y1: to.y, n: guestLink ? 1 : Math.min(2, localSeats().length) };
      from = null;
      if (countdown > 0 || result || !state) return;
      if (guestLink) { guestHeld.set('drag', drag); guestSendInput(); guestHeld.delete('drag'); return; }
      const here = localSeats();
      const seat = logic.dragSeat ? logic.dragSeat(state, drag.x0, drag.y0, here) : here[0];
      if (Number.isInteger(seat) && held[seat]) { held[seat].drag = drag; firstPress(); }
    };
    const cancel = () => { from = null; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    if (logic.drag) canvas.style.touchAction = 'none';
    return () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel); };
  })();
  function firstPress() { if (waitingFirst) { waitingFirst = false; countdown = 0; } }
  // tap anywhere on the room or the TV: the first player's main button, in one-button games
  const oneButton = logic.pad.length === 1;
  const tapDown = (e) => {
    if (!oneButton || logic.swipe || e.target.closest?.('.panel, .bar, .sheet, a, button')) return;
    const seat = localSeats()[0];
    if (seat != null) { held[seat].a = true; firstPress(); }
  };
  const tapUp = () => { const seat = localSeats()[0]; if (seat != null && oneButton && !logic.swipe) held[seat].a = false; };
  addEventListener('pointerdown', tapDown);
  addEventListener('pointerup', tapUp);

  /** A thumb stick: drag it any way. Arrow keys and gamepads do the same. */
  function stick(seat, axes) {
    const knob = h('span', { class: 'stick__knob' });
    const base = h('div', { class: `stick stick--${axes}`, role: 'application', 'aria-label': 'Joystick: drag to steer' }, [knob]);
    let id = null;
    const set = (x, y, release) => {
      if (axes === 'x') y = 0;
      if (axes === 'y') x = 0;
      knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`;
      let l = x < -0.35, r = x > 0.35, u = y < -0.35, d = y > 0.35;
      // four-way games take the stronger direction only
      if (!logic.analog && axes === 'xy') { if (Math.abs(x) > Math.abs(y)) u = d = false; else l = r = false; }
      const v = { l, r, u, d };
      if (logic.analog && !release) { v.x = Math.round(x * 100) / 100; v.y = Math.round(y * 100) / 100; }
      if (guestLink) {
        Object.entries(v).forEach(([k, val]) => guestHeld.set(k, val));
        if (release) { guestHeld.delete('x'); guestHeld.delete('y'); }
        guestSendInput();
        return;
      }
      Object.assign(held[seat], v);
      if (release) { delete held[seat].x; delete held[seat].y; } else firstPress();
    };
    const move = (e) => {
      if (e.pointerId !== id) return;
      const b = base.getBoundingClientRect();
      let x = (e.clientX - (b.left + b.width / 2)) / (b.width / 2.4), y = (e.clientY - (b.top + b.height / 2)) / (b.height / 2.4);
      const len = Math.hypot(x, y);
      if (len > 1) { x /= len; y /= len; }
      set(x, y, false);
    };
    base.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; base.setPointerCapture?.(id); base.classList.add('stick--on'); move(e); });
    base.addEventListener('pointermove', move);
    const up = (e) => { if (e.pointerId !== id) return; id = null; base.classList.remove('stick--on'); set(0, 0, true); };
    base.addEventListener('pointerup', up);
    base.addEventListener('pointercancel', up);
    return base;
  }
  function padFor(seat, label) {
    // a keypad for typed answers: what you type shows above it, OK sends it
    if (keypad) {
      const view = h('output', { class: 'keypad__show', 'aria-live': 'polite' });
      keypad.views.set(seat, view);
      const key = (ch, text, extra = '') => h('button', { type: 'button', class: `keypad__key${extra}`, 'aria-label': ch === 'back' ? 'Delete' : ch === 'ok' ? 'Send answer' : text,
        onpointerdown: (e) => { e.preventDefault(); keypadType(seat, ch); } }, [text]);
      const rows = logic.keypad === 'digits'
        ? ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => key(d, d)).concat([key('back', '⌫', ' keypad__key--soft'), key('0', '0'), key('ok', '✓', ' keypad__key--ok')])
        // a phone keyboard's rows: the second and third start half a key in
        : 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('').map(c => key(c, c, c === 'A' || c === 'Z' ? ' keypad__key--indent' : '')).concat([key('back', '⌫', ' keypad__key--soft'), key('ok', '✓', ' keypad__key--ok')]);
      setTimeout(paintKeypads);
      return h('div', { class: `pad pad--keypad pad--keypad-${logic.keypad}`, 'data-seat': seat }, [
        label ? h('span', { class: 'pad__who' }, [label]) : null, view, h('div', { class: 'keypad' }, rows),
      ]);
    }
    // answer buttons (a Stroop-style quiz): big coloured buttons, each held like a key while pressed
    if (logic.choices) {
      const press = (key, on) => (e) => {
        e.preventDefault();
        if (guestLink) { guestHeld.set(key, on); guestSendInput(); return; }
        held[seat][key] = on;
        if (on) firstPress();
      };
      return h('div', { class: 'pad pad--choices', 'data-seat': seat }, [
        label ? h('span', { class: 'pad__who' }, [label]) : null,
        ...logic.choices.map(([key, text, color, hint]) => h('button', { type: 'button', class: 'choicebtn', style: `--choice:${color}`, 'aria-label': text,
          onpointerdown: press(key, true), onpointerup: press(key, false), onpointercancel: press(key, false), onpointerleave: press(key, false), oncontextmenu: (e) => e.preventDefault() },
        [h('strong', {}, [text]), hint ? h('small', {}, [hint]) : null])),
      ]);
    }
    const dirs = logic.pad.map(p => p[0]).filter(k => 'udlr'.includes(k));
    let axes = logic.analog === true ? 'xy' : logic.analog || (dirs.includes('l') ? (dirs.includes('u') ? 'xy' : 'x') : 'y');
    if (turned() && axes === 'x') axes = 'y';   // see turn(): the same steering, shown the way the picture runs
    const action = logic.pad.find(p => p[0] === 'a');
    const set = (on) => (e) => {
      e.preventDefault();
      if (guestLink) { guestHeld.set('a', on); guestSendInput(); return; }
      held[seat].a = on;
      if (on) firstPress();
    };
    return h('div', { class: `pad${dirs.length && action ? ' pad--both' : ''}${logic.swipe ? ' pad--swipe' : ''}`, 'data-seat': seat }, [
      label ? h('span', { class: 'pad__who' }, [label]) : null,
      dirs.length ? stick(seat, axes) : null,
      logic.swipe ? (() => {
        const zone = h('div', { class: 'swipe-zone', role: 'application', 'aria-label': logic.swipeHint || 'Swipe quickly to launch' }, [
          h('strong', {}, [logic.swipeHint || 'Swipe quickly to launch']),
          h('small', {}, ['Fast swipe = more power']),
        ]);
        bindSwipe(zone, () => seat);
        return zone;
      })() : null,
      action ? h('button', { type: 'button', class: 'padbtn padbtn--a', 'aria-label': action[1], onpointerdown: set(true), onpointerup: set(false), onpointercancel: set(false), onpointerleave: set(false), oncontextmenu: (e) => e.preventDefault() }, [action[1]]) : null,
    ]);
  }
  /* troll bar: emojis in front of everyone */
  let emojiAt = 0;
  let emojiTo = null;
  function trollRow() {
    const me = guestLink ? guestSeat : (localSeats()[0] ?? 0);
    const others = players.map((p, i) => (i === me ? null : i)).filter(i => i != null);
    if (emojiTo != null && !others.includes(emojiTo)) emojiTo = null;
    const order = [null, ...others];
    const nameOf = (i) => (i == null ? '👥 All' : players[i]?.name || '');
    const who = h('button', { type: 'button', class: 'chatrow__to', 'aria-label': `Send to: ${nameOf(emojiTo)}. Tap to change.`, onclick: (e) => {
      emojiTo = order[(order.indexOf(emojiTo) + 1) % order.length];
      e.currentTarget.firstChild.textContent = nameOf(emojiTo);
      e.currentTarget.setAttribute('aria-label', `Send to: ${nameOf(emojiTo)}. Tap to change.`);
    } }, [h('span', {}, [nameOf(emojiTo)]), h('b', { 'aria-hidden': 'true' }, ['▾'])]);
    // and a message: one of the game's ready-made lines, said by your character for everyone to see
    const msgBtn = h('button', { type: 'button', class: 'chatbtn', 'aria-label': say.chat, title: say.chat, onclick: () => openTalk() }, ['💬']);
    return h('div', { class: 'chatrow' }, [who, trollButtons(), msgBtn]);
  }
  function openTalk() {
    document.querySelector('.sheet')?.remove();
    const close = () => sheet.remove();
    const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': say.chat, onclick: (e) => { if (e.target === sheet) close(); } }, [
      h('div', { class: 'sheet__box' }, [
        h('div', { class: 'talklines' }, lines.map((line, i) => h('button', { type: 'button', class: 'btn', onclick: () => { close(); sendLine(i); } }, [line]))),
        btn(say.close, close),
      ]),
    ]);
    document.body.append(sheet);
  }
  let lineAt = 0;
  function sendLine(i) {
    if (!lines[i] || Date.now() - lineAt < 1200) return;
    lineAt = Date.now();
    if (guestLink) { guestLink.send({ t: 'talk', line: i }); return; }
    const me = localSeats()[0] ?? 0;
    story?.say(me, lines[i]);
    room?.broadcast({ t: 'say', seat: me, text: lines[i] });
  }
  function trollButtons() {
    return h('div', { class: 'troll', role: 'group', 'aria-label': say.chat }, emojis().map(e => h('button', {
      type: 'button', 'aria-label': e,
      onclick: () => {
        if (Date.now() - emojiAt < 500) return;
        emojiAt = Date.now();
        if (guestLink) { guestLink.send({ t: 'emoji', e, to: emojiTo }); return; }
        const me = localSeats()[0] ?? 0;
        showEmoji(me, e, emojiTo);
        room?.broadcast({ t: 'emoji', seat: me, e, to: emojiTo });
        const bot = players.findIndex(p => p.kind === 'bot');
        if (bot >= 0 && Math.random() < 0.5) setTimeout(() => { const back = emojis()[Math.floor(Math.random() * 10)]; showEmoji(bot, back); room?.broadcast({ t: 'emoji', seat: bot, e: back }); }, 1100);
      },
    }, [e])));
  }
  function showEmoji(seat, e, to = null) {
    if (!story) return;
    const target = Number.isInteger(to) && players[to] && to !== seat ? to : null;
    if (players[seat]) story.throwEmoji(seat, target, e);
    story.emojiPop(e, target != null ? `${players[seat]?.name || ''} → ${players[target].name}` : players[seat]?.name || '');
  }
  function bigToggle() {
    if (!story) return null;
    return h('button', { type: 'button', class: 'btn bigbtn', onclick: () => {
      setBig(!big);
      if (!big) story.tvCanvasBack(canvas);
    } }, ['⛶ Bigger screen']);
  }
  function hint() {
    if (matchMedia('(pointer: coarse)').matches) return null;
    const twoHere = localSeats().length > 1;
    if (keypad) return h('p', { class: 'lead keyhint' }, [logic.keypad === 'digits' ? 'Keys: type the digits · Backspace deletes · Enter sends' : 'Keys: type the letters · Backspace deletes · Enter sends']);
    if (logic.choices) return h('p', { class: 'lead keyhint' }, [`Keys: ${logic.choices.map(c => `${c[3] || c[0]} ${c[1]}`).join(' · ')}`]);
    const a = logic.pad.map(p => p[0]);
    const k1 = a.length === 1 ? 'Space' : `W A S D${a.includes('a') ? ' + Space' : ''}`;
    const k2 = a.length === 1 ? 'Enter' : `arrows${a.includes('a') ? ' + Enter' : ''}`;
    return h('p', { class: 'lead keyhint' }, [twoHere ? `${players[localSeats()[0]].name}: ${k1} · ${players[localSeats()[1]].name}: ${k2} · gamepads work too` : `Keys: ${k1} or ${k2} · gamepads work too`]);
  }
  function controlHint() {
    if (localSeats().length !== 1 || !hintsLeft(game.slug, 2)) return;
    setTimeout(() => {
      const stickEl = document.querySelector('.tvpanel .stick');
      const a = document.querySelector('.tvpanel .padbtn--a');
      const tip = turned() && logic.flatHint ? logic.flatHint : logic.hint;
      if (tip && (stickEl || a)) showHint(game.slug, stickEl || a, tip, { drag: !!stickEl, max: 2 });
      else if (stickEl) showHint(game.slug, stickEl, 'Drag to steer', { drag: true, max: 2 });
      else if (a) showHint(game.slug, a, logic.tapToPlay ? 'Tap here, or anywhere on the TV' : `Tap to ${(logic.pad.find(p => p[0] === 'a')?.[1] || 'play').replace(/^\P{L}+/u, '').toLowerCase()}`, { max: 2 });
    }, 700);
  }
  function playPanel() {
    const seatsHere = localSeats();
    const twoHere = seatsHere.length > 1;
    show(topBar(game), h('section', { class: 'panel panel--tight tvpanel' }, [
      hint(),
      h('div', { class: `pads${twoHere ? ' pads--two' : ''}` }, seatsHere.length
        ? seatsHere.map(seat => padFor(seat, twoHere ? players[seat].name : ''))
        : [h('p', { class: 'lead' }, ['The computer players are at it. Sit back and watch.'])]),
      bigToggle(),
      players.length > 1 || room ? trollRow() : null,
    ]));
    story?.tvPanel(panelNow());
  }

  /* ─── the game ─── */
  function start(resumeState = null) {
    music(true);
    state = resumeState || logic.init({ n: players.length, seed: (Math.random() * 2 ** 31) | 0 });
    result = null;
    tick = 0;
    if (!resumeState) revives = 0;
    toldBest = false; medalsTold = 0; bestAtStart = bestOf(game.slug); liveShown = 0; ctx.refreshBest?.();
    holdPopups(true);
    waitingFirst = !resumeState && !!logic.tapToPlay && players.length === 1 && players[0].kind === 'me';
    countdown = waitingFirst ? 1 : 150;
    sit();
    if (!resumeState) controlHint();
    players.forEach((_, i) => seatAct(i, 'hold'));
    room?.broadcast({ t: 'tv', game: game.slug, players: players.map(({ name, look }) => ({ name, look })) });
    room?.guests.forEach((guest) => {
      const seat = players.findIndex(p => p.token === guest.token);
      room.send(guest.id, { t: 'seat', seat });
    });
    shareState(countdown);
    playPanel();
    cancelAnimationFrame(loop);
    last = performance.now();
    acc = 0;
    loop = requestAnimationFrame(frame);
  }
  let last = 0, acc = 0, paused = false;
  // the pause menu: alone the game stops where it is; with people on other phones it can't, so it goes on
  window.__tvOnline = false;
  addEventListener('chitplay:pause', (e) => { if (!room && !guestLink) paused = !!e.detail?.on; });
  function frame(now) {
    loop = requestAnimationFrame(frame);
    window.__tvOnline = !!(room || guestLink);
    if (paused) { last = now; readPads(); paint(); return; }
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    readPads();
    while (acc >= TICK && !result) {
      acc -= TICK;
      if (countdown > 0) {
        if (!waitingFirst) countdown -= 1;
        if (room && countdown % 12 === 0) shareState(countdown);
        continue;
      }
      const inputs = players.map((p, i) => {
        if (p.kind === 'bot' || (p.kind === 'guest' && !guestLive(p))) return logic.bot(state, i);
        if (p.kind !== 'guest') { const own = inputOf(i); return reflex ? { ...own, ...(keypad ? keypadFields(i) : reflexStamp(i, own)) } : own; }
        const input = guestInputs.get(p.token) || {};
        if (input.swipe || input.drag) guestInputs.set(p.token, { ...input, swipe: null, drag: null });
        return input;
      });
      logic.step(state, inputs);
      tick += 1;
      if (state.ev.length) {
        const ev = state.ev.splice(0);
        react(ev);
        room?.broadcast({ t: 'ev', ev });
      }
      if (room && tick % SEND_EVERY === 0) shareState();
      milestones();
      if (!room && !guestLink && tick % 120 === 0) saveGame(game.slug, { tv: true, players: players.map(({ name, kind, look }) => ({ name, kind, look })), state, revives });
      const over = logic.over(state);
      if (over) {
        result = over;
        if (canRevive()) { offerRevive(); break; }
        shareState();
        room?.broadcast({ t: 'over', result });
        finish();
      }
    }
    paint();
  }
  /*
   * Shadows for any 3D view: its sun casts them, solid things cast them and the ground takes them.
   * Looked over now and then, because things keep arriving (traffic, coins, rocks).
   */
  let shadeTick = 0;
  function shadeScene(scene) {
    scene.traverse((o) => {
      if (o.userData.shaded) return;
      o.userData.shaded = true;
      if (o.isDirectionalLight) {
        o.castShadow = true;
        o.shadow.mapSize.set(1024, 1024);
        Object.assign(o.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 40 });
        o.shadow.camera.updateProjectionMatrix();
        o.shadow.bias = -0.0006; o.shadow.normalBias = 0.02;
      } else if (o.isMesh) {
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        const lit = !!m && !m.isMeshBasicMaterial;
        o.receiveShadow = lit;
        o.castShadow = lit && !m.transparent && o.geometry?.type !== 'PlaneGeometry' && o.geometry?.type !== 'CircleGeometry';
        // a material already drawn once has to be rebuilt to start taking shadows
        if (lit) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mm) => { mm.needsUpdate = true; });
      }
    });
  }
  const namesNow = () => players.map(p => p.name);
  let lastPaint = performance.now();
  function paint() {
    if (!state) return;
    const now = performance.now();
    const dt = paused ? 0 : Math.min(0.1, (now - lastPaint) / 1000);   // paused: the picture holds still too
    lastPaint = now;
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    let flat = true;
    if (view && r3 && !is2d()) {
      try {
        // the camera follows this phone's own player: on a friend's phone that is their seat, not the host's
        const mine = guestLink ? guestSeat : players.findIndex(p => p.kind === 'me');
        view.update(state, dt, Math.min(1, acc / TICK), mine >= 0 ? mine : 0);
        if (r3.shadowMap.enabled && (shadeTick++ % 30 === 0)) shadeScene(view.scene);
        r3.render(view.scene, view.camera);
        g.drawImage(r3.domElement, 0, 0, W, H);
        (logic.hud || (() => {})).call(logic, g, state, namesNow());
        flat = false;
      } catch (e) { console.warn('[tv] 3D frame failed, using the flat picture', e); view = null; }
    }
    // the seats played on this screen, for games with private things to show (a Bingo card)
    if (flat) logic.draw(g, state, namesNow(), guestLink ? [guestSeat] : localSeats());
    reflexSeen();
    // our name, small, in the corner of every TV game: a recording or a copy still says where it's from
    g.save();
    g.globalAlpha = 0.5; g.font = '700 11px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'bottom';
    g.fillStyle = '#000'; g.fillText('chitplay.com', W - 7, H - 5);
    g.fillStyle = '#fff'; g.fillText('chitplay.com', W - 8, H - 6);
    g.restore();
    if (waitingFirst) banner(oneButton ? 'Tap to fly!' : 'Press to start');
    else if (countdown > 0) banner(String(Math.ceil(countdown / 50)));
    story?.tvRefresh();
  }
  function banner(text) {
    g.fillStyle = 'rgba(0, 0, 0, .45)';
    g.fillRect(0, H / 2 - 44, W, 88);
    g.fillStyle = '#fff';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 46px system-ui, sans-serif';
    g.fillText(text, W / 2, H / 2 + 2);
  }

  /* ─── while playing: a new best or a medal shows up, but nothing stops ─── */
  const liveScore = (seat) => (state?.chits || state?.planes || state?.carts || state?.cars || state?.snakes || state?.birds || state?.players)?.[seat]?.score;
  let bestAtStart = 0, toldBest = false, medalsTold = 0, revives = 0, liveShown = 0;
  function milestones() {
    const seat = localSeats()[0];
    if (seat == null || localSeats().length > 1) return;
    const sc = liveScore(seat);
    if (!Number.isFinite(sc)) return;
    // the score, live, in the chip at the top beside the best (table.js liveScore)
    ctx.liveScore?.(sc);
    if (!toldBest && bestAtStart > 0 && sc > bestAtStart) { toldBest = true; popup('🏅', 'New best score!', `You passed ${bestAtStart}. Keep going!`); }
    // past your best: the chip at the top keeps count
    if (bestAtStart > 0 && sc > bestAtStart && sc !== liveShown) { liveShown = sc; ctx.liveBest?.(sc); }
    const medals = game.medals || [];
    const got = medals.filter(m => sc >= m).length;
    if (got > medalsTold) { medalsTold = got; popup(['🥉', '🥈', '🥇', '💎'][got - 1], `${['Bronze', 'Silver', 'Gold', 'Diamond'][got - 1]} medal!`, `${sc} points in ${game.name}`); }
  }
  /* ─── out, but not done: coins buy another go ─── */
  const reviveCost = () => 40 * 2 ** revives;
  const canRevive = () => !!logic.revive && !room && !guestLink && localSeats().length === 1 && players.filter(p => p.kind === 'me').length === 1 && revives < 3;
  function offerRevive() {
    const seat = localSeats()[0];
    const cost = reviveCost();
    let left = 9, timer = 0;
    const end = () => { clearInterval(timer); room?.broadcast({ t: 'over', result }); finish(); };
    const go = async () => {
      clearInterval(timer);
      const yes = await confirmSpend({ what: 'another go', price: cost, coins: profile.coins, icon: '💖' });
      if (!yes || !profile.spend(cost)) { end(); return; }
      revives += 1;
      logic.revive(state, seat);
      result = null;
      countdown = 90;
      audio('confirm');
      playPanel();
    };
    const count = h('small', { class: 'revive__count' }, [`${left}`]);
    show(topBar(game), h('section', { class: 'panel tvpanel revive' }, [
      h('h1', {}, ['😵 You crashed!']),
      h('p', { class: 'lead' }, [`Score ${liveScore(seat) ?? 0}. Carry on from here?`]),
      btn(`💖 Continue for ${cost} coins (you have ${profile.coins})`, go, 'primary'),
      btn('No thanks, see my score', end),
      count,
    ]));
    story?.tvPanel(panelNow());
    timer = setInterval(() => { left -= 1; count.textContent = String(left); if (left <= 0) end(); }, 1000);
  }

  /* ─── the end of a game ─── */
  let againAt = 0;
  function rematchKey() { if (!guestLink && Date.now() > againAt) rematch(); }
  let rematching = false;   // one Play again at a time, even while an ad break is showing
  async function rematch() {
    if (rematching) return;
    rematching = true;
    players = players.map(p => (p.kind === 'guest' && !guestLive(p) ? { ...p, kind: 'bot' } : p));
    // between games only, and only alone: friends on other phones are never kept waiting for an ad
    try { if (!room && !guestLink) await adBreak(`${game.slug}-again`); } finally { rematching = false; }
    start();
  }
  function finish() {
    holdPopups(false);
    clearSaved(game.slug);
    againAt = Date.now() + 700;
    cancelAnimationFrame(loop);
    loop = requestAnimationFrame(frameIdle);
    endSound(result, localSeats());
    (result.winners || []).forEach(w => seatAct(w, 'cheer', '🏆'));
    if ((result.winners || []).length) story?.effect('confetti');
    const seat = localSeats()[0];
    const counted = seat != null && localSeats().length === 1;
    resultPanel(seat, counted, result);
  }
  function frameIdle() { loop = requestAnimationFrame(frameIdle); readPads(); paint(); }
  function resultPanel(seat, counted, r) {
    const names = namesNow();
    const myScore = seat != null ? r.scores[seat] : 0;
    const won = seat != null && (r.winners || []).includes(seat);
    const info = counted || guestLink ? gameFinished({ slug: game.slug, won, score: myScore, endless: !!r.endless, mode: room || guestLink ? 'nearby' : 'local' }) : null;
    ctx.refreshBest?.();
    const medals = game.medals || [];
    const medalNames = ['🥉', '🥈', '🥇', '💎'];
    const got = medals.filter(m => myScore >= m).length;
    const nextMedal = medals[got];
    const lost = seat != null && !won && (r.winners || []).length > 0;
    const title = r.endless && players.length === 1
      ? (info?.newBest ? `🎉 New best: ${myScore}!` : `Game over · ${myScore}`)
      : !(r.winners || []).length ? say.draw : r.winners.length > 1 ? 'A tie at the top!' : won ? `🏆 ${say.youWin}` : `😵 You lost! ${names[r.winners[0]]} wins`;
    const rp = rankProgress();
    const offer = !reminderSettings().asked && reminderSupported() && info;
    show(topBar(game), h('section', { class: 'panel tvpanel' }, [
      h('h1', {}, [title]),
      r.endless && players.length === 1 ? h('p', { class: 'lead' }, [`${got ? `${medalNames[got - 1]} ` : ''}Best: ${info?.best ?? bestOf(game.slug)}${nextMedal ? ` · ${nextMedal - myScore} more for ${medalNames[got]}` : ''}`])
        : h('ol', { class: 'board' }, names.map((n, i) => [n, r.scores[i], i]).sort((a, b) => Number((r.winners || []).includes(b[2])) - Number((r.winners || []).includes(a[2])) || b[1] - a[1]).map(([n, v, i], k) => h('li', { class: (r.winners || []).includes(i) ? 'first' : '' }, [h('span', {}, [`${['🥇', '🥈', '🥉'][k] || k + 1} ${n}`]), h('strong', {}, [String(v)])]))),
      h('div', { class: 'rankline' }, [
        h('span', {}, [`${rp.icon} ${rp.title}`]),
        h('div', { class: 'rankbar' }, [h('i', { style: `width:${Math.round(rp.share * 100)}%` })]),
        info?.coins ? h('small', {}, [`+${info.gained} rank points · +${info.coins} coins`]) : null,
      ]),
      guestLink ? h('p', { class: 'lead' }, ['Waiting for the host to play again…']) : btn(lost || r.endless ? '🔁 Try again' : `🔁 ${say.playAgain}`, () => rematch(), 'primary'),
      btn(won || info?.newBest ? '📤 Share my win' : '📤 Share my score', async () => {
        const pic = resultImage({ picture: canvas, game, headline: won ? 'I won!' : r.endless ? `I scored ${myScore}!` : 'Rematch?', sub: r.endless ? 'Can you beat me?' : names.join(' vs ') });
        await shareResult({ canvas: pic, text: r.endless ? `I scored ${myScore} in ${game.name} on ChitPlay. Can you beat it?` : `${won ? 'I won' : 'I played'} ${game.name} on ChitPlay!`, slug: game.slug });
      }),
      suggestionRow(game.slug, '../', lost || r.endless ? 'Or try another game' : 'Try these next'),
      offer ? btn('🔔 Remind me to play every day', async (e) => {
        const b = e.currentTarget;
        const on = await setReminder(true, LANG);
        b.textContent = on ? '🔔 Daily reminder is on' : 'Reminder not turned on';
        b.disabled = true;
        if (on) popup('🔔', 'Daily reminder is on', 'Change the time in your profile');
      }) : null,
      h('a', { class: 'btn', href: '../', onclick: ctx.leaveAll }, [say.allGames]),
      hotPrompt(game.slug, game.name),
      // the only ad in a game: below every button, once the match is over (src/arcade/ads.js)
      resultAd(),
    ]));
    story?.tvPanel(panelNow());
  }

  /* ─── friends on their own phones ─── */
  const guestInputs = new Map();
  const guestLive = (p) => (room ? [...room.guests.values()].some(g2 => g2.token === p.token) : false);
  let guestLink = null;
  function nearbyLobby(size) {
    show(topBar(game), h('section', { class: 'panel' }, [h('h1', {}, ['Opening a room…'])]));
    const welcomed = new Set();
    const paint2 = () => {
      room.guests.forEach((gu) => { if (!welcomed.has(gu.id)) { welcomed.add(gu.id); room.send(gu.id, { t: 'lobby', arcade: true, video: true, game: game.slug }); } });
      if (state && !result) return;
      const names = [room.hostLabel, ...room.list.map(x => x.name)];
      room.broadcast({ t: 'lobby', arcade: true, video: true, game: game.slug, players: names });
      const link = `${location.origin}${location.pathname}?join=${room.code}`;
      const qr = h('div', { class: 'qr' });
      import(`../net/qr.js${V}`).then(({ qrSvg }) => { const svg = qrSvg(link, 'Scan to join'); if (svg) qr.append(svg); }).catch(() => {});
      show(topBar(game), h('section', { class: 'panel' }, [
        h('h1', {}, ['Friends join with this code']),
        h('p', { class: 'code', 'aria-label': `Room code ${room.code}` }, [`${room.code.slice(0, 3)} ${room.code.slice(3)}`]),
        qr,
        h('h2', {}, [`Players: ${names.length} of ${game.max}`]),
        h('ol', { class: 'names joined' }, names.map((n, i) => h('li', {}, [i ? n : `${n} (host)`]))),
        btn(say.start, () => {
          room.lock();
          players = [{ name: room.hostLabel, kind: 'me', look: myLook() }, ...room.list.map(x => ({ name: x.name, kind: 'guest', token: x.token, look: x.look }))];
          addBots(Math.max(size, game.min));
          start();
        }, 'primary'),
      ]));
    };
    room = makeRoom(paint2);
    room.open(null).then((c) => { if (c) dispatchEvent(new CustomEvent('chitplay:room-open', { detail: { code: c, slug: game.slug } })); return paint2(c); }).catch((e) => {
      const key = nearbyError(e);
      show(topBar(game), h('section', { class: 'panel' }, [h('h1', {}, ['Couldn’t open a room']), h('p', { class: 'lead' }, [key === 'errNetwork' ? 'Check your internet connection and try again.' : 'Something went wrong. Try again.']), btn(say.playAgain, () => nearbyLobby(size), 'primary')]));
    });
  }
  function makeRoom(onChange) {
    const r = new NearbyHost({
      onChange,
      onMessage: (id, msg) => {
        const token = room.guests.get(id)?.token;
        const seat = players.findIndex(p => p.token === token);
        if (msg.t === 'i' && msg.i && typeof msg.i === 'object') {
          const num = (v) => (Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : undefined);
          const swipe = msg.i.swipe && typeof msg.i.swipe === 'object' ? {
            x: num(msg.i.swipe.x), y: num(msg.i.swipe.y),
            power: Number.isFinite(msg.i.swipe.power) ? clamp(msg.i.swipe.power, 0, 1) : undefined,
          } : null;
          const input = { a: !!msg.i.a, u: !!msg.i.u, d: !!msg.i.d, l: !!msg.i.l, r: !!msg.i.r, x: num(msg.i.x), y: num(msg.i.y) };
          // a reaction game's own timing from the friend's phone (see reflexStamp)
          if (Number.isInteger(msg.i.rr) && Number.isFinite(msg.i.rt)) { input.rr = msg.i.rr; input.rt = clamp(Math.round(msg.i.rt), 0, 600000); }
          if (Number.isInteger(msg.i.early)) input.early = msg.i.early;
          if (typeof msg.i.pick === 'string' && CHOICE_KEYS.includes(msg.i.pick)) input.pick = msg.i.pick;
          if (typeof msg.i.ans === 'string') input.ans = msg.i.ans.slice(0, 24).replace(logic.keypad === 'digits' ? /[^0-9]/g : /[^A-Za-z]/g, '');
          if (swipe && Number.isFinite(swipe.x) && Number.isFinite(swipe.y) && Number.isFinite(swipe.power)) input.swipe = swipe;
          const d = msg.i.drag;
          if (logic.drag && d && typeof d === 'object' && ['x0', 'y0', 'x1', 'y1'].every(k => Number.isFinite(d[k]))) input.drag = { x0: clamp(d.x0, 0, W), y0: clamp(d.y0, 0, H), x1: clamp(d.x1, 0, W), y1: clamp(d.y1, 0, H), n: 1 };
          // a drag not yet used survives the next message (a key let go just after it)
          else if (guestInputs.get(token)?.drag) input.drag = guestInputs.get(token).drag;
          guestInputs.set(token, input);
          if (waitingFirst && msg.i.a) firstPress();
        } else if (msg.t === 'emoji' && seat >= 0 && emojis().includes(msg.e)) {
          const to = Number.isInteger(msg.to) && players[msg.to] ? msg.to : null;
          showEmoji(seat, msg.e, to);
          room.broadcast({ t: 'emoji', seat, e: msg.e, to });
        } else if (msg.t === 'talk' && seat >= 0 && Number.isInteger(msg.line) && lines[msg.line]) {
          // only the game's own lines can be sent, never free text
          story?.say(seat, lines[msg.line]);
          room.broadcast({ t: 'say', seat, text: lines[msg.line] });
        }
      },
      onLeave: () => {},
    }, { maxGuests: game.max - 1 });
    r.hostName = myName();
    return r;
  }
  /* strangers online: join a table with people waiting, or open one; nobody comes, the bots play */
  let pubTimer = 0;
  async function online(size) {
    let cancelled = false;
    show(topBar(game), h('section', { class: 'panel' }, [
      h('h1', {}, ['Finding players…']),
      h('p', { class: 'lead' }, ['If nobody turns up in a few seconds, computer players take the seats.']),
      h('div', { class: 'spinner', 'aria-hidden': 'true' }),
      btn('Play now with computer players', () => { cancelled = true; soloStart(size); }),
    ]));
    const codes = Array.from({ length: PUBLIC_TABLES }, (_, i) => tableCode(`tv-${game.slug}`, i + 1));
    let seen = [];
    try { seen = await peekTables(codes); } catch { seen = []; }
    if (cancelled) return;
    for (const t of seen.filter(x => !x.locked && x.seats < game.max - 1)) {
      if (cancelled) return;
      if (ctx.join && (await ctx.join(t.code)) === 'joined') { teardown(); return; }
    }
    for (const code of codes.filter(c => !seen.some(t => t.code === c))) {
      if (cancelled) return;
      const r = makeRoom(() => {});
      room = r;
      try {
        await r.open(code);
        if (cancelled) { r.close(); room = null; return; }
        publicLobby(size);
        return;
      } catch (e) {
        r.close();
        room = null;
        if (e?.type !== 'unavailable-id') break;
        if (ctx.join && (await ctx.join(code)) === 'joined') { teardown(); return; }
      }
    }
    if (!cancelled) soloStart(size);
  }
  function publicLobby(size) {
    let opened = Date.now();
    const total = Math.max(size, game.min, 2);
    const welcomed = new Set();
    const tickLobby = () => {
      if (!room || (state && !result)) { clearInterval(pubTimer); return; }
      room.guests.forEach((gu) => { if (!welcomed.has(gu.id)) { welcomed.add(gu.id); room.send(gu.id, { t: 'lobby', arcade: true, video: true, game: game.slug }); } });
      const left = Math.max(0, Math.ceil((opened + PUBLIC_WAIT_MS - Date.now()) / 1000));
      const names = [room.hostLabel, ...room.list.map(x => x.name)];
      room.broadcast({ t: 'lobby', arcade: true, video: true, game: game.slug, players: names, startsIn: left });
      if (names.length >= game.max || left === 0) {
        clearInterval(pubTimer);
        room.lock();
        players = [{ name: room.hostLabel, kind: 'me', look: myLook() }, ...room.list.map(x => ({ name: x.name, kind: 'guest', token: x.token, look: x.look }))];
        addBots(total);
        start();
        return;
      }
      show(topBar(game), h('section', { class: 'panel' }, [
        h('h1', {}, ['At an online table']),
        h('p', { class: 'lead' }, [`Starting in ${left} seconds…`]),
        h('ol', { class: 'names joined' }, names.map(n => h('li', {}, [n]))),
        btn(say.start, () => { opened -= PUBLIC_WAIT_MS; }, 'primary'),
      ]));
    };
    room.h.onChange = () => {};
    pubTimer = setInterval(tickLobby, 1000);
    tickLobby();
  }
  function soloStart(size) {
    room?.close();
    room = null;
    players = [{ name: myName(), kind: 'me', look: myLook() }];
    addBots(Math.max(size, game.max === 2 && game.min === 2 ? 2 : size));
    start();
  }
  function teardown() {
    cancelAnimationFrame(loop);
    clearInterval(pubTimer);
    removeEventListener('keydown', downKey);
    removeEventListener('keyup', upKey);
    removeEventListener('pointerdown', tapDown);
    removeEventListener('pointerup', tapUp);
    swipeCanvasCleanup();
    dragCleanup();
    removeEventListener('chitplay:view', onView);
    bigBox.remove();
    holdPopups(false);
    room?.close();
    room = null;
    r3?.dispose();
  }
  function addBots(total) {
    const taken = players.map(p => p.name);
    while (players.length < total) {
      const b = localName(taken);
      taken.push(b.name);
      players.push({ name: b.name, kind: 'bot', look: localLook(b.gender) });
    }
  }

  /* a friend's phone: shows the host's game and sends its buttons */
  let guestSeat = -1;
  function guestPanel() {
    show(topBar(game), h('section', { class: 'panel panel--tight tvpanel' }, [h('div', { class: 'pads' }, [padFor(guestSeat, '')]), bigToggle(), trollRow()]));
  }
  function guestSendInput() {
    const i = turn(Object.fromEntries(guestHeld));
    if (reflex && guestSeat >= 0) Object.assign(i, keypad ? keypadFields(guestSeat) : reflexStamp(guestSeat, i));
    guestLink?.send({ t: 'i', i });
  }
  function guestKeys(e, down) {
    for (const map of KEYS) { const key = map[e.code]; if (key) { e.preventDefault(); guestHeld.set(key, down); guestSendInput(); } }
  }
  function guestMode(link) {
    guestLink = link;
    removeEventListener('keydown', downKey);
    removeEventListener('keyup', upKey);
    removeEventListener('pointerdown', tapDown);
    removeEventListener('pointerup', tapUp);
    addEventListener('keydown', (e) => guestKeys(e, true));
    addEventListener('keyup', (e) => guestKeys(e, false));
    addEventListener('pointerdown', (e) => { if (oneButton && !logic.swipe && !e.target.closest?.('.panel, .bar, .sheet, a, button')) { guestHeld.set('a', true); guestSendInput(); } });
    addEventListener('pointerup', () => { if (oneButton && !logic.swipe) { guestHeld.set('a', false); guestSendInput(); } });
    show(topBar(game), h('section', { class: 'panel' }, [h('h1', {}, ['You’re in!']), h('p', { class: 'lead' }, ['Waiting for the host to start.'])]));
    return (m) => {
      if (m.t === 'tv' && Array.isArray(m.players)) {
        players = m.players.slice(0, 4).map((p, i) => ({ name: String(p?.name || `P${i + 1}`).slice(0, 14), look: p?.look || myLook(), kind: 'remote' }));
        result = null;
        sit();
        players.forEach((_, i) => seatAct(i, 'hold'));
        cancelAnimationFrame(loop);
        loop = requestAnimationFrame(frameIdle);
      } else if (m.t === 'seat' && Number.isInteger(m.seat)) {
        guestSeat = m.seat;
        guestPanel();
        story?.tvPanel(panelNow());
      } else if (m.t === 's' && m.s) { state = m.s; countdown = Number(m.c) || 0; }
      else if (m.t === 'ev' && Array.isArray(m.ev)) react(m.ev);
      else if (m.t === 'say' && Number.isInteger(m.seat) && typeof m.text === 'string') story?.say(m.seat, m.text.slice(0, 80));
      else if (m.t === 'emoji' && Number.isInteger(m.seat) && emojis().includes(m.e)) showEmoji(m.seat, m.e, Number.isInteger(m.to) ? m.to : null);
      else if (m.t === 'over' && m.result && Array.isArray(m.result.scores)) {
        result = m.result;
        endSound(result, Number.isInteger(guestSeat) ? [guestSeat] : []);
        resultPanel(guestSeat, true, result);
      }
    };
  }

  addEventListener('pagehide', () => { room?.close(); guestLink?.close(); });

  if (ctx.guest) return guestMode(ctx.guest);

  const size = Math.min(game.max, Math.max(game.min, ctx.size));
  // a game in progress on this phone: back to it after a refresh, or ask if you came another way
  const saved = !['nearby', 'online'].includes(mode) ? loadSaved(game.slug) : null;
  if (saved?.tv && saved.state && Array.isArray(saved.players) && saved.players.length) {
    const carryOn = isReload() || await ask({ icon: '⏯️', title: 'Carry on your game?', body: `You have a game of ${game.name} in progress.`, ok: 'Carry on', cancel: 'Start a new one' });
    if (carryOn) {
      players = saved.players;
      revives = saved.revives || 0;
      start(saved.state);
      story?.emojiPop('⏯️', 'Welcome back: carrying on');
      return null;
    }
    clearSaved(game.slug);
  }
  if (mode === 'nearby') { nearbyLobby(size); return null; }
  if (mode === 'online') { online(size); return null; }
  if (mode === 'pass') {
    players = [{ name: myName(), kind: 'me', look: myLook() }, { name: localName([myName()]).name, kind: 'local', look: localLook('f') }];
  } else if (mode === 'watch') {
    players = [];
    addBots(Math.max(game.min, size, 2));
  } else {
    players = [{ name: myName(), kind: 'me', look: myLook() }];
    addBots(size);
  }
  start();
  return null;
}
