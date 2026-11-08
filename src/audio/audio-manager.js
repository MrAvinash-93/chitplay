import { settingsStore } from '../persistence/settings-store.js?v=20261108-0613';

/**
 * Web Audio API sound manager. All sounds are synthesized — no external files.
 * Respects the user's sound preference and browser autoplay policies.
 */

class AudioManager {
  #ctx = null;
  #enabled = null;
  #unlocked = false;

  #ensureContext() {
    if (this.#ctx) return this.#ctx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.#ctx = new Ctx();
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
    if (!this.#enabled) this.fanStop();
  }

  async unlock() {
    if (this.#unlocked) return;
    const ctx = this.#ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    this.#unlocked = true;
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
    src.connect(lp).connect(g).connect(ctx.destination);
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

  #noise({ dur = 0.08, gain = 0.04, freq = 2500, q = 0.9, delay = 0, type = 'bandpass', attack = 0 }) {
    const ctx = this.#ensureContext();
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    if (attack) {
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gain, now + attack);
    } else {
      g.gain.setValueAtTime(gain, now);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  #tone({ freq = 440, to, dur = 0.1, type = 'sine', gain = 0.08, attack = 0.005, release = 0.08, delay = 0 }) {
    const ctx = this.#ensureContext();
    if (!ctx || !this.enabled) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, now + attack + dur + release);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + attack + dur + release);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + attack + dur + release + 0.05);
  }

  #chord(freqs, opts = {}) {
    freqs.forEach((f, i) => this.#tone({ ...opts, freq: f, delay: (opts.delay || 0) + i * 0.04 }));
  }

  play(name) {
    if (!this.enabled) return;
    this.unlock();
    switch (name) {
      case 'button':
        this.#tone({ freq: 660, dur: 0.04, type: 'triangle', gain: 0.05 });
        break;
      case 'select':
        this.#tone({ freq: 520, dur: 0.06, type: 'sine', gain: 0.07 });
        this.#tone({ freq: 780, dur: 0.06, type: 'sine', gain: 0.04, delay: 0.03 });
        break;
      case 'confirm':
        this.#chord([523.25, 659.25, 783.99], { dur: 0.12, type: 'sine', gain: 0.06 });
        break;
      case 'chit-unfold':
        this.#tone({ freq: 220, dur: 0.35, type: 'sawtooth', gain: 0.03 });
        this.#tone({ freq: 440, dur: 0.3, type: 'sine', gain: 0.04, delay: 0.1 });
        this.#tone({ freq: 660, dur: 0.25, type: 'triangle', gain: 0.05, delay: 0.22 });
        break;
      case 'reveal':
        this.#chord([392, 523.25, 659.25, 783.99], { dur: 0.25, type: 'sine', gain: 0.06 });
        break;
      case 'correct':
        this.#chord([523.25, 659.25, 783.99, 1046.5], { dur: 0.18, type: 'triangle', gain: 0.07 });
        break;
      case 'wrong':
        this.#tone({ freq: 220, dur: 0.25, type: 'sawtooth', gain: 0.06 });
        this.#tone({ freq: 185, dur: 0.3, type: 'sawtooth', gain: 0.05, delay: 0.12 });
        break;
      case 'score':
        this.#tone({ freq: 880, dur: 0.06, type: 'square', gain: 0.03 });
        this.#tone({ freq: 1174.66, dur: 0.08, type: 'square', gain: 0.03, delay: 0.05 });
        break;
      case 'victory':
        this.#chord([523.25, 659.25, 783.99, 1046.5], { dur: 0.3, type: 'triangle', gain: 0.07 });
        this.#chord([659.25, 830.61, 987.77, 1318.51], { dur: 0.4, type: 'triangle', gain: 0.06, delay: 0.2 });
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
        this.#noise({ dur: 2.8, gain: 0.22, freq: 160, q: 0.6, type: 'lowpass', attack: 0.15, delay: 0.1 });
        this.#noise({ dur: 2.0, gain: 0.12, freq: 90, q: 0.8, type: 'lowpass', attack: 0.4, delay: 0.9 });
        break;
      case 'rain':
        for (let i = 0; i < 4; i++) this.#noise({ dur: 1.6, gain: 0.025, freq: 5000, q: 0.3, type: 'highpass', attack: 0.4, delay: i * 1.1 });
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
      case 'power-on':
        // tubelight starter: tik… tik… then the hum
        [0, 0.22, 0.55].forEach(d => this.#noise({ dur: 0.02, gain: 0.09, freq: 3200, q: 3, delay: d }));
        this.#tone({ freq: 100, dur: 0.6, type: 'sine', gain: 0.03, delay: 0.62, release: 0.3 });
        this.#chord([523.25, 783.99], { dur: 0.12, type: 'triangle', gain: 0.04, delay: 0.7 });
        break;
      default:
        break;
    }
  }
}

export const audioManager = new AudioManager();