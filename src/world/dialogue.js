/**
 * No-repeat dialogue engine.
 *
 * Each language pack has `lines[key]` (core lines) and `prefixes` (short
 * interjections). A spoken line is an optional prefix + a core line, with
 * {placeholders} filled in. Within one match:
 *   - a final sentence is never spoken twice (exact-string guarantee),
 *   - unused core lines are always preferred over reused ones,
 *   - if a key is truly exhausted the player stays quiet instead of repeating.
 *
 * Lines spoken before the result are role-neutral, so a bluffing thief sounds
 * exactly like the royals and nothing leaks.
 */
// Language packs are loaded on demand: a player only downloads the lines of
// the language they are actually playing in.
const V = '?v=20261110-1427';
const LOADERS = {
  english: () => import(`./lines/english.js${V}`),
  japanese: () => import(`./lines/japanese.js${V}`),
  korean: () => import(`./lines/korean.js${V}`),
  chinese: () => import(`./lines/chinese.js${V}`),
  american: () => import(`./lines/american.js${V}`),
  british: () => import(`./lines/british.js${V}`),
  // the player's own language, always written in Latin letters
  hinglish: () => import(`./lines/hinglish.js${V}`),
  urdu: () => import(`./lines/urdu.js${V}`),
  nepali: () => import(`./lines/nepali.js${V}`),
  bangla: () => import(`./lines/bangla.js${V}`),
  romaji: () => import(`./lines/romaji.js${V}`),
  korean_roman: () => import(`./lines/korean_roman.js${V}`),
  pinyin: () => import(`./lines/pinyin.js${V}`),
  russian_latin: () => import(`./lines/russian_latin.js${V}`),
  german: () => import(`./lines/german.js${V}`),
  french: () => import(`./lines/french.js${V}`),
  portuguese: () => import(`./lines/portuguese.js${V}`),
  spanish: () => import(`./lines/spanish.js${V}`),
};

/** Languages a player can pick for the players' chat (text). Voices always stay English. */
export const CHAT_LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'urdu', label: 'Roman Urdu' },
  { id: 'nepali', label: 'Roman Nepali' },
  { id: 'bangla', label: 'Roman Bangla' },
  { id: 'romaji', label: 'Japanese (Romaji)' },
  { id: 'korean_roman', label: 'Korean (Romanized)' },
  { id: 'pinyin', label: 'Chinese (Pinyin)' },
  { id: 'russian_latin', label: 'Russian (Latin)' },
  { id: 'german', label: 'Deutsch' },
  { id: 'french', label: 'Français' },
  { id: 'portuguese', label: 'Português' },
  { id: 'spanish', label: 'Español' },
];
const BLUFF_KEYS = new Set(['nervous', 'plead', 'alibi', 'accusedReply']);
const ROLE_CLAIM = /\{(king|queen|det|guesser)\}/;
const PACKS = {};
const EMPTY = { prefixes: [], lines: {} };

/** Download a language pack (cached). Safe to call many times. */
export async function loadPack(lang) {
  if (PACKS[lang]) return PACKS[lang];
  const loader = LOADERS[lang] || LOADERS.english;
  try {
    PACKS[lang] = (await loader()).default;
  } catch (e) {
    console.warn('[Dialogue] could not load', lang, e);
    if (lang !== 'english') return loadPack('english');
    PACKS[lang] = EMPTY;
  }
  return PACKS[lang];
}
export const LANGS = Object.keys(LOADERS);
// German capitalises nouns, so a prefixed line must keep its first letter as is
const KEEP_CASE = new Set(['german']);

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Dialogue {
  constructor(lang, roleNames = {}, fallbackLang = 'english') {
    this.lang = lang;
    this.fallbackLang = fallbackLang;
    this.keepCase = KEEP_CASE.has(lang);
    this.roleNames = roleNames;
    this.spoken = new Set();       // exact sentences already said
    this.coreUses = new Map();     // `${key}|${core}` -> count
  }

  // call loadPack(lang) first; until it arrives the players simply stay quiet
  get pack() { return PACKS[this.lang] || PACKS.english || EMPTY; }

  /** What has been said so far (saved with the match so a refresh doesn't repeat lines). */
  exportSpoken() { return [...this.spoken]; }
  importSpoken(list) { (list || []).forEach(t => this.spoken.add(t)); }

  /** Clear memory for a fresh match. */
  reset() {
    this.spoken.clear();
    this.coreUses.clear();
  }

  has(key) { return !!this.pack.lines[key]?.length; }

  fill(text, vars) {
    const all = { ...this.roleNames, ...vars };
    return text.replace(/\{(\w+)\}/g, (_, k) => all[k] ?? '');
  }

  /** "Arre" + "Kone wali" → "Arre kone wali" (keeps names, "I" and !/? endings intact). */
  join(prefix, core) {
    const keepCase = this.keepCase || /[!?]$/.test(prefix) || /^(\{|I\b|I’)/.test(core) || !/^\p{L}/u.test(core);
    const sep = this.pack.joiner ?? ' ';
    return `${prefix}${sep}${keepCase ? core : core[0].toLowerCase() + core.slice(1)}`;
  }

  /** Returns a never-before-spoken line for `key`, or null if none is left. */
  line(key, vars = {}) {
    // a language without this moment (e.g. a game-specific rule) borrows it from the
    // game's own English pack, then from international English
    const own = this.pack.lines[key]?.length ? this.pack : null;
    const usePack = own || [PACKS[this.fallbackLang], PACKS.english].find(p => p?.lines[key]?.length) || null;
    if (!usePack) return null;
    if (usePack !== this.pack) return this.lineFrom(usePack, key, vars, false);
    return this.lineFrom(usePack, key, vars, this.keepCase);
  }

  lineFrom(pack, key, vars, keepCase) {
    const saved = this.keepCase;
    this.keepCase = keepCase;
    try { return this.pick(pack, key, vars); } finally { this.keepCase = saved; }
  }

  pick(pack, key, vars) {
    // nobody but the finder says who they are, not even as a bluff
    const cores = BLUFF_KEYS.has(key) ? pack.lines[key]?.filter(c => !ROLE_CLAIM.test(c)) : pack.lines[key];
    if (!cores?.length) return null;
    const prefixes = pack.prefixes || [];
    // least-used cores first, random order within the same use count
    const ordered = shuffled(cores).sort((a, b) =>
      (this.coreUses.get(`${key}|${a}`) || 0) - (this.coreUses.get(`${key}|${b}`) || 0));
    for (const core of ordered) {
      const uses = this.coreUses.get(`${key}|${core}`) || 0;
      // a fresh core is said plainly (or with a prefix sometimes); a reused
      // core must get a prefix it has never had before
      const withPrefix = shuffled(prefixes).map(p => ({ p, raw: this.join(p, core) }));
      const plain = { p: null, raw: core };
      const options = uses === 0
        ? (Math.random() < 0.35 && prefixes.length ? [...withPrefix, plain] : [plain, ...withPrefix])
        : withPrefix;
      for (const { p, raw } of options) {
        const text = this.fill(raw, vars);
        if (!this.spoken.has(text)) {
          this.spoken.add(text);
          this.coreUses.set(`${key}|${core}`, uses + 1);
          // the pieces, for pre-recorded audio: interjection clip + line clip
          this.last = { key, prefix: p, core: this.fill(core, vars), text };
          return text;
        }
      }
    }
    return null;
  }
}
