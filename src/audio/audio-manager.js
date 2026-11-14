import { settingsStore } from '../persistence/settings-store.js?v=20261114-1435';

/**
 * Web Audio API sound manager. All sounds are synthesized — no external files.
 * Respects the user's sound preference and browser autoplay policies.
 *
 * Everything goes through one master bus with a soft compressor, so ten sounds at once (a capture,
 * a cheer and a dice landing together) stay clean instead of clipping. Physical sounds (wooden
 * pieces, cards, dice) vary a little in pitch every time, the way real ones do, and the same sound
 * fired twice in a few milliseconds plays once.
 */

/** Vibration patterns, in milliseconds (on, off, on…). Short and light: a nudge, never a buzz. */
const HAPTICS = {
  tap: 8,
  move: 12,
  turn: [18, 60, 18],
  capture: [25, 30, 45],
  hit: 40,
  wrong: [14, 40, 14],
  win: [30, 50, 30, 50, 80],
  lose: 70,
  reward: [12, 40, 12, 40, 24],
};

/** How close together the same sound may fire before the second one is dropped. */
const MIN_GAP_MS = { step: 25, 'dice-hit': 60 };

class AudioManager {
  #ctx = null;
  #enabled = null;
  #unlocked = false;
  #bus = null;
  #noiseBuf = null;
  #last = new Map();

  #ensureContext() {
    if (this.#ctx) return this.#ctx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.#ctx = new Ctx({ latencyHint: 'interactive' });
      // master: a little headroom, then a soft compressor so stacked sounds never crackle
      const master = this.#ctx.createGain();
      master.gain.value = 0.9;
      const comp = this.#ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 10;
      comp.ratio.value = 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;
      master.connect(comp).connect(this.#ctx.destination);
      this.#bus = master;
      // one second of noise, made once: every rustle, click and whoosh plays a random slice of it
      const len = this.#ctx.sampleRate;
      this.#noiseBuf = this.#ctx.createBuffer(1, len, this.#ctx.sampleRate);
      const d = this.#noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      // phones suspend audio when the page goes to the background (and iOS "interrupts" it on a call)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.#unlocked && this.#ctx.state !== 'running') this.#ctx.resume().catch(() => {});
      });
    } catch {
      this.#ctx = null;
    }
    return this.#ctx;
  }

  get enabled() {
    if (this.#enabled === null) this.#enabled = settingsStore.get('soundEnabled');
    return this.#enabled;
  }

  setEnabled(v) {
    this.#enabled = !!v;
    if (!this.#enabled) { this.fanStop(); this.musicStop(); }
  }

  /* ─── background music: made on the fly, quiet, and only when the player switches it on ─── */
  #music = null;
  #musicMood = null;

  get musicOn() { return settingsStore.get('musicEnabled') === true; }

  /** Music on or off (a setting, remembered). Turning it on starts the last mood straight away. */
  setMusic(on) {
    settingsStore.set('musicEnabled', !!on);
    if (on) this.musicStart(this.#musicMood || 'calm');
    else this.musicStop();
  }

  /**
   * Starts the background music. 'calm' for board and card games: soft chords and a slow plucked tune.
   * 'arcade' for the TV games: a quicker pulse with a bass line and light hats. Nothing plays until
   * the player has touched the page (browsers' rule), and nothing at all unless music is switched on.
   */
  musicStart(mood = 'calm') {
    this.#musicMood = mood;
    if (!this.enabled || !this.musicOn) return;
    const ctx = this.#ensureContext();
    if (!ctx || !this.#bus) return;
    if (this.#music?.mood === mood) { this.#music.paused = false; return; }
    this.musicStop(0.3);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 2);
    // a gentle low-pass keeps it soft, under the game's own sounds
    const soft = ctx.createBiquadFilter();
    soft.type = 'lowpass'; soft.frequency.value = mood === 'arcade' ? 3200 : 2200;
    soft.connect(out).connect(this.#bus);
    const fast = mood === 'arcade';
    const beat = 60 / (fast ? 118 : 76) / 2;           // an eighth note, in seconds
    // four chords that loop (I – vi – IV – V), each two bars, with a tune picked from its notes
    const roots = [261.63, 220, 174.61, 196];
    const chordOf = (r) => [r, r * 1.25992, r * 1.49831];   // root, major third, fifth (the vi takes its minor feel from the key)
    const scale = [1, 1.12246, 1.25992, 1.49831, 1.68179, 2];   // a pentatonic over the root: never a wrong note
    const m = { mood, ctx, out, soft, step: 0, next: ctx.currentTime + 0.1, paused: false, timer: 0 };
    const note = (freq, at, len, type, gain) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, at);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain, at + Math.min(0.03, len / 4));
      g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      o.connect(g).connect(soft);
      o.start(at); o.stop(at + len + 0.05);
    };
    const hat = (at) => {
      const src = ctx.createBufferSource(); src.buffer = this.#noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.012, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
      src.connect(f).connect(g).connect(soft); src.start(at, Math.random() * 0.9, 0.06);
    };
    // the scheduler: a little ahead of time, so the beat stays steady even when the game is busy
    const tick = () => {
      if (!this.#music || this.#music !== m) return;
      // back from a hidden tab: skip what was missed instead of playing it all at once
      if (m.next < ctx.currentTime - 0.1) m.next = ctx.currentTime + 0.05;
      while (m.next < ctx.currentTime + 0.25) {
        const at = m.next, s = m.step, bar = Math.floor(s / 8), root = roots[Math.floor(bar / 2) % 4];
        if (!m.paused) {
          if (s % 16 === 0) chordOf(root / 2).forEach(f => note(f, at, beat * 15, 'triangle', fast ? 0.016 : 0.02));
          if (fast ? s % 2 === 0 : s % 4 === 0) note(root / 4, at, beat * (fast ? 1.6 : 3.5), fast ? 'square' : 'sine', fast ? 0.018 : 0.03);
          if (fast && s % 2 === 1) hat(at);
          // the tune: a note on most beats, chosen so it walks rather than jumps
          if (s % 2 === 0 && Math.random() < (fast ? 0.75 : 0.55)) {
            m.deg = Math.max(0, Math.min(scale.length - 1, (m.deg ?? 2) + [-1, 0, 1, 1, -1, 2, -2][Math.floor(Math.random() * 7)]));
            note(root * scale[m.deg], at, beat * (fast ? 1.4 : 2.6), 'triangle', fast ? 0.022 : 0.026);
          }
        }
        m.step += 1; m.next += beat;
      }
    };
    m.timer = setInterval(tick, 90);
    this.#music = m;
    tick();
  }

  /** Holds the music while the game is paused, and carries on after. */
  musicPause(on) { if (this.#music) this.#music.paused = !!on; }

  musicStop(fade = 1.2) {
    const m = this.#music;
    if (!m) return;
    this.#music = null;
    clearInterval(m.timer);
    const t = m.ctx.currentTime;
    m.out.gain.cancelScheduledValues(t);
    m.out.gain.setValueAtTime(Math.max(0.0001, m.out.gain.value), t);
    m.out.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    setTimeout(() => { try { m.out.disconnect(); } catch {} }, fade * 1000 + 300);
  }

  async unlock() {
    const ctx = this.#ensureContext();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch {}
    }
    this.#unlocked = true;
  }

  /** A short vibration for something that happened (see HAPTICS). Off when the player turned it off. */
  haptic(kind) {
    const pattern = HAPTICS[kind] ?? kind;
    if (pattern == null || settingsStore.get('hapticsEnabled') === false) return;
    // browsers refuse (and log an error) until the first tap
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try { navigator.vibrate?.(pattern); } catch {}
  }

  #fan = null;

  /** Soft ceiling-fan hum that runs while the power is on. */
  fanStart() {
    const ctx = this.#ensureContext();
    if (!ctx || !this.enabled || this.#fan) return;
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.2);
    // the slow "whoom… whoom" of the blades
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 2.4;
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(lp).connect(g).connect(this.#bus);
    src.start();
    lfo.start();
    this.#fan = { src, lfo, g, ctx };
  }

  fanStop() {
    const f = this.#fan;
    if (!f) return;
    this.#fan = null;
    const t = f.ctx.currentTime;
    f.g.gain.cancelScheduledValues(t);
    f.g.gain.setValueAtTime(f.g.gain.value, t);
    f.g.gain.linearRampToValueAtTime(0, t + 1.5);
    setTimeout(() => { try { f.src.stop(); f.lfo.stop(); } catch {} }, 1700);
  }

  /** Filtered noise: rustles, clicks, knocks and whooshes. `to` sweeps the filter. */
  #noise({ dur = 0.08, gain = 0.04, freq = 2500, to, q = 0.9, delay = 0, type = 'bandpass', attack = 0 }) {
    const ctx = this.#ctx;
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.#noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, now);
    if (to) filter.frequency.exponentialRampToValueAtTime(to, now + dur);
    filter.Q.value = q;
    const g = ctx.createGain();
    if (attack) {
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gain, now + attack);
    } else {
      g.gain.setValueAtTime(gain, now);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(dur, attack + 0.005));
    src.connect(filter).connect(g).connect(this.#bus);
    const len = Math.min(0.95, dur + 0.03);
    src.start(now, Math.random() * (1 - len), len);
  }

  #tone({ freq = 440, to, dur = 0.1, type = 'sine', gain = 0.08, attack = 0.005, release = 0.08, delay = 0 }) {
    const ctx = this.#ctx;
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, now + attack + dur + release);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + attack + dur + release);
    osc.connect(g).connect(this.#bus);
    osc.start(now);
    osc.stop(now + attack + dur + release + 0.05);
  }

  #chord(freqs, opts = {}) {
    freqs.forEach((f, i) => this.#tone({ ...opts, freq: f, delay: (opts.delay || 0) + i * 0.04 }));
  }

  /** A bell: a pure note with a quiet octave and a fifth above, ringing out. */
  #bell(freq, { gain = 0.06, delay = 0, ring = 0.5 } = {}) {
    this.#tone({ freq, dur: 0.02, type: 'sine', gain, attack: 0.003, release: ring, delay });
    this.#tone({ freq: freq * 2, dur: 0.01, type: 'sine', gain: gain * 0.35, attack: 0.002, release: ring * 0.5, delay });
    this.#tone({ freq: freq * 3, dur: 0.01, type: 'sine', gain: gain * 0.12, attack: 0.002, release: ring * 0.3, delay });
  }

  /** A wooden piece set down on a wooden board: a knock with a soft thump under it. */
  #knock(v, { gain = 1, delay = 0 } = {}) {
    this.#noise({ dur: 0.035, gain: 0.14 * gain, freq: 1700 * v, q: 4, delay });
    this.#tone({ freq: 190 * v, to: 120 * v, dur: 0.03, type: 'sine', gain: 0.09 * gain, attack: 0.002, release: 0.05, delay });
    this.#tone({ freq: 950 * v, dur: 0.008, type: 'triangle', gain: 0.03 * gain, attack: 0.001, release: 0.02, delay });
  }

  /** A card sliding off the deck: a quick bright rustle that falls away. */
  #flick(v, { gain = 1, delay = 0 } = {}) {
    this.#noise({ dur: 0.07, gain: 0.08 * gain, freq: 5200 * v, to: 2400 * v, q: 0.7, type: 'bandpass', attack: 0.006, delay });
    this.#noise({ dur: 0.03, gain: 0.04 * gain, freq: 1300 * v, q: 1.2, delay: delay + 0.04 });
  }

  /** Two dice-cubes touching: a hard, short click. */
  #click(v, { gain = 1, delay = 0 } = {}) {
    this.#noise({ dur: 0.018, gain: 0.12 * gain, freq: 3200 * v, q: 6, delay });
    this.#tone({ freq: 1400 * v, dur: 0.006, type: 'triangle', gain: 0.03 * gain, attack: 0.001, release: 0.015, delay });
  }

  play(name) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.#ctx || !this.#bus) return;
    const nowMs = performance.now();
    if (nowMs - (this.#last.get(name) || 0) < (MIN_GAP_MS[name] ?? 30)) return;
    this.#last.set(name, nowMs);
    // real things never sound exactly the same twice
    const v = 0.96 + Math.random() * 0.08;
    switch (name) {
      /* ─── the interface ─── */
      case 'button':
      case 'tap':
        this.#tone({ freq: 1250, to: 900, dur: 0.02, type: 'sine', gain: 0.055, attack: 0.002, release: 0.04 });
        this.#noise({ dur: 0.012, gain: 0.025, freq: 5000, q: 2 });
        break;
      case 'select':
        // a soft, bubbly "pop"
        this.#tone({ freq: 520 * v, to: 860 * v, dur: 0.035, type: 'sine', gain: 0.07, attack: 0.003, release: 0.05 });
        this.#tone({ freq: 1040 * v, dur: 0.02, type: 'sine', gain: 0.025, delay: 0.03, release: 0.05 });
        break;
      case 'pop':
        this.#tone({ freq: 380 * v, to: 1250 * v, dur: 0.05, type: 'sine', gain: 0.07, attack: 0.003, release: 0.05 });
        break;
      case 'open':
        this.#noise({ dur: 0.16, gain: 0.035, freq: 700, to: 2600, q: 0.8, attack: 0.05 });
        this.#tone({ freq: 660, to: 990, dur: 0.06, type: 'sine', gain: 0.03, delay: 0.05 });
        break;
      case 'close':
        this.#noise({ dur: 0.14, gain: 0.03, freq: 2400, to: 700, q: 0.8, attack: 0.02 });
        break;
      case 'confirm':
        this.#chord([523.25, 659.25, 783.99], { dur: 0.1, type: 'sine', gain: 0.06, release: 0.15 });
        break;
      case 'turn':
        // your turn: a clear two-note chime, hard to miss and never harsh
        this.#bell(783.99, { gain: 0.07, ring: 0.35 });
        this.#bell(1174.66, { gain: 0.07, ring: 0.6, delay: 0.11 });
        break;
      case 'tick':
        this.#noise({ dur: 0.012, gain: 0.07, freq: 4800, q: 5 });
        break;
      case 'join':
        this.#tone({ freq: 587.33, dur: 0.05, type: 'sine', gain: 0.06, release: 0.08 });
        this.#tone({ freq: 880, dur: 0.07, type: 'sine', gain: 0.06, delay: 0.08, release: 0.15 });
        break;
      case 'leave':
        this.#tone({ freq: 880, dur: 0.05, type: 'sine', gain: 0.05, release: 0.08 });
        this.#tone({ freq: 587.33, dur: 0.07, type: 'sine', gain: 0.05, delay: 0.08, release: 0.15 });
        break;
      case 'coin':
        this.#tone({ freq: 1567.98, dur: 0.04, type: 'square', gain: 0.025, release: 0.05 });
        this.#tone({ freq: 2093, dur: 0.12, type: 'square', gain: 0.022, delay: 0.06, release: 0.25 });
        break;

      /* ─── things on the table ─── */
      case 'piece':
        this.#knock(v);
        break;
      case 'step':
        this.#knock(v * 1.15, { gain: 0.45 });
        break;
      case 'card':
        this.#flick(v);
        this.#noise({ dur: 0.02, gain: 0.05, freq: 900 * v, q: 1.5, delay: 0.07 });   // and lands
        break;
      case 'deal':
        for (let i = 0; i < 4; i++) this.#flick(0.95 + Math.random() * 0.1, { gain: 0.8, delay: i * 0.075 });
        break;
      case 'flip':
        this.#noise({ dur: 0.05, gain: 0.06, freq: 2600 * v, to: 1400 * v, q: 1, attack: 0.004 });
        this.#tone({ freq: 700 * v, to: 1050 * v, dur: 0.04, type: 'sine', gain: 0.03, delay: 0.02 });
        break;
      case 'dice-throw':
        // shaken in the hand, then let go
        for (let i = 0; i < 5; i++) this.#click(0.9 + Math.random() * 0.25, { gain: 0.5 + Math.random() * 0.3, delay: i * 0.035 + Math.random() * 0.02 });
        this.#noise({ dur: 0.12, gain: 0.025, freq: 1200, q: 0.6, attack: 0.03, delay: 0.16 });
        break;
      case 'dice-hit':
        this.#click(v);
        this.#tone({ freq: 230 * v, dur: 0.02, type: 'sine', gain: 0.06, release: 0.04 });
        break;
      case 'dice-land':
        this.#click(v * 0.9);
        this.#tone({ freq: 170 * v, to: 120, dur: 0.03, type: 'sine', gain: 0.08, release: 0.06 });
        this.#click(v * 1.1, { gain: 0.35, delay: 0.06 });
        this.#click(v * 1.2, { gain: 0.18, delay: 0.1 });
        break;
      case 'clack':
        // the striker hits the coins
        this.#noise({ dur: 0.02, gain: 0.2, freq: 3000 * v, q: 3 });
        this.#tone({ freq: 880 * v, to: 520 * v, dur: 0.02, type: 'triangle', gain: 0.06, attack: 0.001, release: 0.04 });
        break;
      case 'pocket':
        this.#tone({ freq: 190 * v, to: 85, dur: 0.1, type: 'sine', gain: 0.11, attack: 0.003, release: 0.1 });
        this.#noise({ dur: 0.14, gain: 0.05, freq: 650, q: 0.7, type: 'lowpass', delay: 0.02 });
        this.#click(0.7, { gain: 0.35, delay: 0.09 });
        break;
      case 'capture':
        // a thud, the piece knocked off, and a little sparkle for whoever took it
        this.#knock(v * 0.85, { gain: 1.2 });
        this.#tone({ freq: 320, to: 90, dur: 0.16, type: 'triangle', gain: 0.07, delay: 0.03, release: 0.08 });
        this.#noise({ dur: 0.2, gain: 0.04, freq: 1800, to: 500, q: 0.8, delay: 0.03 });
        [1318.51, 1567.98, 2093].forEach((f, i) => this.#tone({ freq: f, dur: 0.03, type: 'sine', gain: 0.03, delay: 0.14 + i * 0.05, release: 0.12 }));
        break;
      case 'climb':
        [523.25, 587.33, 659.25, 783.99, 880, 1046.5].forEach((f, i) => this.#tone({ freq: f, dur: 0.04, type: 'triangle', gain: 0.05, delay: i * 0.055, release: 0.06 }));
        break;
      case 'slide':
        this.#tone({ freq: 880, to: 140, dur: 0.45, type: 'triangle', gain: 0.06, attack: 0.01, release: 0.12 });
        this.#noise({ dur: 0.45, gain: 0.03, freq: 1600, to: 300, q: 0.7, attack: 0.05 });
        break;
      case 'alert':
        this.#tone({ freq: 880, dur: 0.06, type: 'triangle', gain: 0.07, release: 0.06 });
        this.#tone({ freq: 659.25, dur: 0.1, type: 'triangle', gain: 0.07, delay: 0.12, release: 0.1 });
        break;

      /* ─── how it's going ─── */
      case 'chit-unfold':
        this.#noise({ dur: 0.18, gain: 0.04, freq: 3500, to: 1800, q: 0.7, attack: 0.02 });
        this.#tone({ freq: 440, dur: 0.2, type: 'sine', gain: 0.04, delay: 0.1 });
        this.#tone({ freq: 660, dur: 0.2, type: 'triangle', gain: 0.045, delay: 0.22 });
        break;
      case 'reveal':
        this.#chord([392, 523.25, 659.25, 783.99], { dur: 0.2, type: 'sine', gain: 0.055, release: 0.25 });
        break;
      case 'correct':
        this.#chord([523.25, 659.25, 783.99, 1046.5], { dur: 0.14, type: 'triangle', gain: 0.06, release: 0.2 });
        break;
      case 'wrong':
        // "uh-oh": two soft falling notes, not a buzzer
        this.#tone({ freq: 392, dur: 0.08, type: 'triangle', gain: 0.075, release: 0.06 });
        this.#tone({ freq: 293.66, to: 261.63, dur: 0.16, type: 'triangle', gain: 0.07, delay: 0.12, release: 0.14 });
        break;
      case 'score':
        this.#tone({ freq: 880, dur: 0.05, type: 'square', gain: 0.028 });
        this.#tone({ freq: 1174.66, dur: 0.08, type: 'square', gain: 0.028, delay: 0.05 });
        this.#tone({ freq: 1760, dur: 0.02, type: 'sine', gain: 0.03, delay: 0.1, release: 0.2 });
        break;
      case 'victory':
        // up the arpeggio, a full chord, and a shimmer on top
        [523.25, 659.25, 783.99].forEach((f, i) => this.#tone({ freq: f, dur: 0.08, type: 'triangle', gain: 0.07, delay: i * 0.09, release: 0.06 }));
        this.#chord([523.25, 659.25, 783.99, 1046.5], { dur: 0.35, type: 'triangle', gain: 0.06, delay: 0.3, release: 0.5 });
        this.#chord([1046.5, 1318.51, 1567.98], { dur: 0.3, type: 'sine', gain: 0.035, delay: 0.32, release: 0.6 });
        for (let i = 0; i < 7; i++) this.#tone({ freq: 2093 + i * 220, dur: 0.02, type: 'sine', gain: 0.018, delay: 0.4 + i * 0.05, release: 0.1 });
        break;
      case 'lose':
        // gentle and short: a shrug, not a punishment
        [523.25, 466.16, 392, 349.23].forEach((f, i) => this.#tone({ freq: f, dur: i === 3 ? 0.3 : 0.1, type: 'triangle', gain: 0.055, delay: i * 0.16, release: i === 3 ? 0.4 : 0.08 }));
        break;
      case 'draw-game':
        this.#chord([392, 493.88, 587.33], { dur: 0.25, type: 'sine', gain: 0.05, release: 0.35 });
        break;
      case 'paper-toss':
        // chits rustling as they're thrown on the mat
        for (let i = 0; i < 6; i++) {
          this.#noise({ dur: 0.04 + Math.random() * 0.06, gain: 0.05, freq: 2200 + Math.random() * 3000, delay: i * 0.07 + Math.random() * 0.03 });
        }
        break;
      case 'talk': {
        // chatter blips, like old cartoon speech
        const base = 320 + Math.random() * 380;
        for (let i = 0; i < 3; i++) {
          this.#tone({ freq: base * (0.85 + Math.random() * 0.4), dur: 0.035, type: 'triangle', gain: 0.025, delay: i * 0.07 });
        }
        break;
      }
      case 'thunder':
        // sharp crack, then a long rolling rumble
        this.#noise({ dur: 0.35, gain: 0.18, freq: 2500, q: 0.4, type: 'highpass' });
        this.#noise({ dur: 0.9, gain: 0.22, freq: 160, q: 0.6, type: 'lowpass', attack: 0.15, delay: 0.1 });
        this.#noise({ dur: 0.9, gain: 0.12, freq: 90, q: 0.8, type: 'lowpass', attack: 0.3, delay: 0.7 });
        break;
      case 'rain':
        for (let i = 0; i < 4; i++) this.#noise({ dur: 0.9, gain: 0.025, freq: 5000, q: 0.3, type: 'highpass', attack: 0.3, delay: i * 0.8 });
        break;
      case 'crickets':
        for (let n = 0; n < 6; n++) {
          for (let k = 0; k < 4; k++) this.#tone({ freq: 4400 + (n % 2) * 300, dur: 0.012, type: 'sine', gain: 0.012, attack: 0.002, release: 0.01, delay: n * 0.42 + k * 0.035 });
        }
        break;
      case 'power-cut':
        // fan and fridge winding down
        this.#noise({ dur: 0.03, gain: 0.08, freq: 900, q: 2 });
        this.#tone({ freq: 160, to: 35, dur: 0.9, type: 'sawtooth', gain: 0.035, release: 0.2 });
        break;
      case 'siren':
        // a friendly two-tone police siren, three times
        for (let k = 0; k < 3; k++) {
          this.#tone({ freq: 760, to: 980, dur: 0.22, type: 'triangle', gain: 0.05, delay: k * 0.5 });
          this.#tone({ freq: 980, to: 760, dur: 0.22, type: 'triangle', gain: 0.05, delay: k * 0.5 + 0.25 });
        }
        break;
      case 'whoosh':
        this.#noise({ dur: 0.4, gain: 0.09, freq: 700, to: 2200, q: 0.6, type: 'bandpass', attack: 0.08 });
        this.#noise({ dur: 0.3, gain: 0.05, freq: 600, q: 0.8, type: 'bandpass', attack: 0.05, delay: 0.12 });
        break;
      case 'power-on':
        // tubelight starter: tik… tik… then the hum
        [0, 0.22, 0.55].forEach(d => this.#noise({ dur: 0.02, gain: 0.09, freq: 3200, q: 3, delay: d }));
        this.#tone({ freq: 100, dur: 0.6, type: 'sine', gain: 0.03, delay: 0.62, release: 0.3 });
        this.#chord([523.25, 783.99], { dur: 0.12, type: 'triangle', gain: 0.04, delay: 0.7 });
        break;
      case 'crash':
        this.#noise({ dur: 0.5, gain: 0.16, freq: 380, q: 0.7, type: 'lowpass' });
        this.#tone({ freq: 300, to: 60, dur: 0.45, type: 'sawtooth', gain: 0.05 });
        break;
      case 'flap':
        this.#noise({ dur: 0.09, gain: 0.05, freq: 1800 * v, to: 900, q: 0.9, type: 'bandpass' });
        break;
      case 'combo':
        this.#tone({ freq: 988, dur: 0.05, type: 'square', gain: 0.03 });
        this.#tone({ freq: 1319, dur: 0.07, type: 'square', gain: 0.03, delay: 0.05 });
        this.#tone({ freq: 1760, dur: 0.09, type: 'square', gain: 0.025, delay: 0.1 });
        break;
      case 'achieve':
        // a little fanfare with a sparkle on top
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.#tone({ freq: f, dur: 0.12, type: 'triangle', gain: 0.07, delay: i * 0.09 }));
        this.#chord([1046.5, 1318.51, 1567.98], { dur: 0.5, type: 'sine', gain: 0.05, delay: 0.38 });
        for (let i = 0; i < 6; i++) this.#tone({ freq: 2093 + i * 260, dur: 0.03, type: 'sine', gain: 0.02, delay: 0.42 + i * 0.05 });
        break;
      case 'rankup':
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.#tone({ freq: f, dur: 0.16, type: 'triangle', gain: 0.045, delay: i * 0.1 }));
        this.#chord([523.25, 659.25, 783.99, 1046.5], { dur: 0.9, type: 'triangle', gain: 0.06, delay: 0.55 });
        break;
      case 'whoosh-in':
        this.#noise({ dur: 0.9, gain: 0.08, freq: 400, to: 1400, q: 0.5, type: 'bandpass', attack: 0.5 });
        this.#chord([261.63, 392, 523.25], { dur: 0.7, type: 'triangle', gain: 0.05, delay: 0.75 });
        break;
      default:
        break;
    }
  }
}

export const audioManager = new AudioManager();
