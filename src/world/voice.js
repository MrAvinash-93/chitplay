/**
 * Kid voices via the browser's built-in speech synthesis (offline-capable on
 * most devices). Each seat gets its own voice + a child-like pitch, in the
 * country's language. Falls back to silence (the cartoon blips still play)
 * when no matching voice is installed.
 */
const STRIP = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}‍️]/gu;
const FEMALE = /female|woman|girl|zira|aria|jenny|neerja|swara|sonia|libby|maisie|katja|amala|denise|eloise|francisca|thalita|dalia|svetlana|dariya|heera|kalpana|samantha|victoria|karen|moira|tessa|monica|paulina|luciana|amelie|anna|milena|nanami|sunhi|xiaoxiao|xiaoyi|hiruni|nabanita|tanishaa|uzma|hemkala|elvira|helena|seraphina|vivienne|marta|lucia/i;
const QUALITY = /natural|neural|online|google|premium|enhanced/i;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// pitch / rate / volume offsets per emotion
const EMOTION = {
  neutral: { p: 0, r: 0 },
  happy:   { p: 0.08, r: 0.05 },
  excited: { p: 0.16, r: 0.12 },
  sad:     { p: -0.22, r: -0.16 },
  angry:   { p: -0.08, r: 0.1 },
  scared:  { p: 0.2, r: 0.16 },
  whisper: { p: -0.04, r: -0.1, v: 0.6 },
  sly:     { p: -0.06, r: -0.05, v: 0.85 },
};

// seats 1 and 3 are girls in the room (plaits and bob)
const GIRL_SEATS = new Set([1, 3]);
const PITCH = [1.45, 1.75, 1.35, 1.65];
const RATE = [1.04, 1.08, 1.0, 1.06];

class VoiceBox {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.enabled = true;
    this.voices = [];
    this.seatVoices = [null, null, null, null];
    this.langList = ['en-US'];
    this.pending = 0;
    if (this.synth) {
      const load = () => { this.voices = this.synth.getVoices() || []; this.assign(); };
      load();
      this.synth.addEventListener?.('voiceschanged', load);
    }
  }

  get available() { return !!this.synth && this.seatVoices.some(Boolean); }

  setEnabled(on) {
    this.enabled = !!on;
    if (!on) this.stop();
  }

  setLanguages(list) {
    this.langList = list?.length ? list : ['en-US'];
    this.assign();
  }

  assign() {
    if (!this.voices.length) return;
    const norm = (l) => (l || '').toLowerCase().replace('_', '-');
    let pool = [];
    for (const lang of this.langList) {
      const l = norm(lang);
      pool = this.voices.filter(v => norm(v.lang) === l);
      if (!pool.length) pool = this.voices.filter(v => norm(v.lang).startsWith(l.split('-')[0] + '-') && l.split('-')[0] !== 'en');
      if (pool.length) break;
    }
    if (!pool.length) { this.seatVoices = [null, null, null, null]; return; }
    const rank = (v) => (QUALITY.test(v.name) ? 0 : 1) + (v.localService ? 0 : 0.1);
    pool.sort((a, b) => rank(a) - rank(b));
    const girls = pool.filter(v => FEMALE.test(v.name));
    const boys = pool.filter(v => !FEMALE.test(v.name));
    this.seatVoices = [0, 1, 2, 3].map(seat => {
      const list = GIRL_SEATS.has(seat) ? (girls.length ? girls : pool) : (boys.length ? boys : pool);
      return list[Math.floor(seat / 2) % list.length] || pool[0];
    });
  }

  /** Which voices are in use (for a hint on the start screen). */
  describe() {
    const names = [...new Set(this.seatVoices.filter(Boolean).map(v => v.name))];
    return { names, natural: names.some(n => QUALITY.test(n)) };
  }

  /** Speak a line with an emotion; resolves when finished (or immediately if silent). */
  speak(seat, text, emotion = 'neutral') {
    if (!this.enabled || !this.synth || !this.seatVoices[seat]) return Promise.resolve(false);
    const clean = String(text).replace(STRIP, '').replace(/…/g, ', ').replace(/\s+/g, ' ').trim();
    if (!clean) return Promise.resolve(false);
    // never let a backlog build up — the scene would fall out of sync
    if (this.pending >= 2) return Promise.resolve(false);
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(clean);
      const v = this.seatVoices[seat];
      u.voice = v;
      u.lang = v.lang;
      // neural voices already sound human — push them less towards "kid" pitch
      const natural = QUALITY.test(v.name);
      const base = PITCH[seat] ?? 1.5;
      const e = EMOTION[emotion] || EMOTION.neutral;
      const jitter = (Math.random() - 0.5) * 0.08;
      u.pitch = clamp((natural ? 1 + (base - 1) * 0.45 : base) + e.p + jitter, 0.5, 2);
      u.rate = clamp((RATE[seat] ?? 1.05) + e.r + jitter / 2, 0.6, 1.6);
      u.volume = e.v ?? 1;
      this.pending += 1;
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        this.pending = Math.max(0, this.pending - 1);
        resolve(true);
      };
      u.onend = done;
      u.onerror = done;
      setTimeout(done, 1500 + clean.length * 120);
      try { this.synth.speak(u); } catch { done(); }
    });
  }

  stop() {
    try { this.synth?.cancel(); } catch {}
    this.pending = 0;
  }
}

export const voiceBox = new VoiceBox();
