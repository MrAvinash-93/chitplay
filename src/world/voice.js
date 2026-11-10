/**
 * Character voices via the browser's built-in speech synthesis (offline-capable on
 * most devices). Each seat gets its own voice and a pitch for its age, in the
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

// pitch and pace by age and gender, so a grandfather doesn't sound like a schoolchild
const PITCH = { child: { m: 1.45, f: 1.7 }, teen: { m: 1.1, f: 1.4 }, adult: { m: 0.92, f: 1.2 }, elder: { m: 0.78, f: 1.05 } };
const RATE = { child: 1.06, teen: 1.04, adult: 1, elder: 0.9 };

class VoiceBox {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.enabled = true;
    this.voices = [];
    this.seatVoices = [null, null, null, null];
    this.cast = [{ gender: 'm', age: 'adult' }, { gender: 'f', age: 'adult' }, { gender: 'm', age: 'teen' }, { gender: 'f', age: 'teen' }];
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

  /** Who sits in each seat: [{ gender, age }] */
  setCast(list) {
    if (list?.length === 4) { this.cast = list; this.assign(); }
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
      const list = this.cast[seat]?.gender === 'f' ? (girls.length ? girls : pool) : (boys.length ? boys : pool);
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
      // neural voices already sound human — push them less towards a character pitch
      const natural = QUALITY.test(v.name);
      const who = this.cast[seat] || { gender: 'm', age: 'adult' };
      const base = PITCH[who.age]?.[who.gender] ?? 1.1;
      const e = EMOTION[emotion] || EMOTION.neutral;
      const jitter = (Math.random() - 0.5) * 0.08;
      u.pitch = clamp((natural ? 1 + (base - 1) * 0.45 : base) + e.p + jitter, 0.5, 2);
      u.rate = clamp((RATE[who.age] ?? 1) + e.r + jitter / 2, 0.6, 1.6);
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

  pause(on) {
    try { if (on) this.synth?.pause(); else this.synth?.resume(); } catch {}
  }

  stop() {
    try { this.synth?.cancel(); } catch {}
    this.pending = 0;
  }
}

export const voiceBox = new VoiceBox();

/**
 * The voices to look for, in order, for a chat language. Languages written in Latin letters
 * (Hinglish, Roman Urdu, Romaji…) read best with an Indian or US English voice, not a voice for
 * the script they normally use.
 */
const VOICE_LANGS = {
  en: ['en-IN', 'en-US', 'en-GB'], hindi: ['hi-IN', 'en-IN'], hinglish: ['en-IN', 'hi-IN', 'en-US'], urdu: ['en-IN', 'en-US'],
  nepali: ['en-IN', 'en-US'], bangla: ['en-IN', 'en-US'], romaji: ['en-US', 'en-GB'], korean_roman: ['en-US', 'en-GB'],
  pinyin: ['en-US', 'en-GB'], russian_latin: ['en-US', 'en-GB'], german: ['de-DE', 'de-AT'], french: ['fr-FR', 'fr-CA'],
  portuguese: ['pt-BR', 'pt-PT'], spanish: ['es-ES', 'es-MX', 'es-US'], indonesian: ['id-ID'], turkish: ['tr-TR'], italian: ['it-IT'],
};
const FROM_BROWSER = { hi: 'hindi', ur: 'urdu', ne: 'nepali', bn: 'bangla', ja: 'romaji', ko: 'korean_roman', zh: 'pinyin', ru: 'russian_latin', de: 'german', fr: 'french', pt: 'portuguese', es: 'spanish', id: 'indonesian', ms: 'indonesian', tr: 'turkish', it: 'italian' };
export function voiceLangsFor(id) {
  const lang = VOICE_LANGS[id] ? id : (FROM_BROWSER[String(typeof navigator !== 'undefined' ? navigator.language : '').slice(0, 2).toLowerCase()] || 'en');
  const list = VOICE_LANGS[lang] || VOICE_LANGS.en;
  // an English speaker's own accent first, when the browser says which
  const own = typeof navigator !== 'undefined' ? navigator.language : '';
  return lang === 'en' && /^en-/i.test(own) ? [own, ...list.filter(l => l.toLowerCase() !== own.toLowerCase())] : list;
}
