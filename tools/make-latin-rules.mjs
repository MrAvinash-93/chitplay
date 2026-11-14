/**
 * The game shows some languages in Latin letters (Russian as "russian_latin"), while their search pages
 * use the language's own script. This writes the game's rules file from the same text the search pages
 * use, so there is only one translation to keep up to date:
 *
 *     node tools/make-latin-rules.mjs
 *
 * Russian follows the spelling the rest of the game uses: е → e, й → i, ы → y, х → kh, щ → shch, ь dropped.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ru from './guides/ru.mjs';
import ko from './guides/ko.mjs';
import ne from './guides/ne.mjs';

const RU = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
export function latinRussian(text) {
  return text.replace(/[Ѐ-ӿ]/g, (ch) => {
    const low = ch.toLowerCase(), out = RU[low] ?? ch;
    return ch === low ? out : out.charAt(0).toUpperCase() + out.slice(1);
  }).replace(/«|»/g, '"');
}
/**
 * Korean Revised Romanization, as the game's own Korean is written ("batgi", "wanseong"): each Hangul
 * syllable is split into its letters; a final consonant before a vowel-initial syllable carries over
 * (선을 → seoneul, 길을 → gireul), and ㄹ+ㄹ is "ll". Finer sound changes are left out.
 */
const KO_INITIAL = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const KO_VOWEL = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const KO_FINAL = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
// the same final when the next syllable starts with a vowel: it is said as the next syllable's first sound
const KO_CARRY = ['', 'g', 'kk', 'ks', 'n', 'nj', 'n', 'd', 'r', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'r', 'm', 'b', 'ps', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', ''];
const hangul = (ch) => { const c = ch.charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 ? { i: Math.floor(c / 588), v: Math.floor((c % 588) / 28), f: c % 28 } : null; };
export function latinKorean(text) {
  const chars = [...text];
  let out = '';
  chars.forEach((ch, k) => {
    const s = hangul(ch);
    if (!s) { out += ch; return; }
    const next = hangul(chars[k + 1] || '');
    const prev = hangul(chars[k - 1] || '');
    // a carried-over final already became this syllable's first sound; ㄹ after ㄹ is "l"
    let first = KO_INITIAL[s.i];
    if (prev && s.i === 11 && prev.f) first = '';
    if (prev && prev.f === 8 && s.i === 5) first = 'l';
    let last = KO_FINAL[s.f];
    if (s.f && next && next.i === 11) last = KO_CARRY[s.f];
    out += first + KO_VOWEL[s.v] + last;
  });
  return out.replace(/«|»/g, '"');
}
/**
 * Roman Nepali, as the game writes it ("linus", "Jahaa ko pani"): each Devanagari consonant carries
 * its "a" unless a vowel sign or a halant follows; a word's last "a" is not said ("khel", "samay"),
 * except after a joined consonant ("jitchha", "hunchha") and in one-letter words ("chha", "ra").
 */
const NE_CONS = { 'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng', 'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny', 'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n', 'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'w', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h' };
const NE_VOWEL = { 'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri' };
const NE_SIGN = { 'ा': 'aa', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri' };
const NE_HALANT = '्';
export function latinNepali(text) {
  return text.replace(/[ऀ-ॿ]+/g, (word) => {
    const ch = [...word];
    let out = '', syllables = 0;
    ch.forEach((c, k) => {
      const next = ch[k + 1];
      if (NE_CONS[c]) {
        syllables += 1;
        out += NE_CONS[c];
        if (next === NE_HALANT || NE_SIGN[next]) return;
        const last = !ch.slice(k + 1).some(x => NE_CONS[x] || NE_VOWEL[x] || NE_SIGN[x]);
        const joined = ch[k - 1] === NE_HALANT;
        if (!last || joined || syllables === 1 && !ch.slice(0, k).some(x => NE_VOWEL[x])) out += 'a';
      } else if (NE_VOWEL[c]) { syllables += 1; out += NE_VOWEL[c]; }
      else if (NE_SIGN[c]) out += NE_SIGN[c];
      else if (c === 'ं') out += k === ch.length - 1 ? '' : 'n';
      else if (c === 'ः') out += 'h';
      else if (c === 'ँ' || c === NE_HALANT || c === '़') out += '';
      else if (c === '।') out += '.';
      else out += c;
    });
    return out;
  }).replace(/।/g, '.');
}
const deep = (v, f) => (typeof v === 'string' ? f(v) : Array.isArray(v) ? v.map(x => deep(x, f)) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x, f)])));

// only when run from the command line: tests import latinRussian without touching any file
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const jobs = [
    ['russian_latin', ru, latinRussian, 'Kak igrat v kazhduyu igru, po-russki latinitsei', 'ru'],
    ['korean_roman', ko, latinKorean, 'Geim-mada haneun bangbeop, romaja-ro', 'ko'],
    ['nepali', ne, latinNepali, 'Harek khel kasari khelne, Roman Nepali-ma', 'ne'],
  ];
  for (const [name, source, convert, title, code] of jobs) {
    const file = fileURLToPath(new URL(`../src/arcade/rules-i18n/${name}.js`, import.meta.url));
    writeFileSync(file, `/** ${title}. Made by tools/make-latin-rules.mjs from tools/guides/${code}.mjs: edit that file, not this one. */\nexport default ${JSON.stringify(deep(source, convert), null, 1)};\n`);
    console.log('wrote', file);
  }
}
