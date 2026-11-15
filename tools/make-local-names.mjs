/**
 * Every game's name in every language the app speaks, for the games list, a game's page and its top
 * bar (src/arcade/local-names.js). The names come from the language pages (tools/seo-langs*.mjs), so
 * the app and the site say the same thing. Where the app writes a language in Latin letters (Japanese
 * romaji, Korean, Chinese pinyin, Russian, Urdu, Nepali, Bangla), the name is written that way too.
 *
 *   node tools/make-local-names.mjs
 */
import { writeFileSync } from 'node:fs';
import { LANG_PAGES } from './seo-langs.mjs';
import { MORE_LANG_PAGES } from './seo-langs-more.mjs';

const byCode = Object.fromEntries([...LANG_PAGES, ...MORE_LANG_PAGES].map(L => [L.code, L]));
const names = (code) => Object.fromEntries(Object.entries(byCode[code].names).map(([slug, v]) => [slug, v[0]]));

// a short name for the small tiles: the part before a bracket, when the whole would be long
const short = (n) => {
  const s = String(n).replace(/（/g, ' (').replace(/）/g, ')').trim();
  return s.length > 18 && s.includes(' (') ? s.slice(0, s.indexOf(' (')) : s;
};

/* ─── Russian: Cyrillic to Latin ─── */
const RU = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const ru = (s) => [...s].map((c) => { const l = c.toLowerCase(); const t = RU[l]; if (t === undefined) return c; return c !== l && t ? t[0].toUpperCase() + t.slice(1) : t; }).join('');

/* ─── Korean: Hangul to the Revised Romanization ─── */
const KI = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const KV = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const KF = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
const ko = (s) => [...s].map((c) => {
  const code = c.codePointAt(0) - 0xac00;
  if (code < 0 || code > 11171) return c;
  return KI[Math.floor(code / 588)] + KV[Math.floor((code % 588) / 28)] + KF[code % 28];
}).join('').replace(/lr/g, 'll').replace(/^./, m => m.toUpperCase()).replace(/ (.)/g, (m, x) => ` ${x.toUpperCase()}`);

/* ─── Devanagari (Nepali) and Bengali to Latin letters, the way names are written in chat ─── */
function brahmic(s, table) {
  const { cons, vowels, signs, virama, extra } = table;
  // letters with a dot below come as two code points: join them; drop invisible joiners
  s = s.replace(/‍|‌/g, '')
    .replace(/ড়/g, 'ড়').replace(/ঢ়/g, 'ঢ়').replace(/য়/g, 'য়')
    .replace(/ड़/g, 'ड़').replace(/ढ़/g, 'ढ़').replace(/क़/g, 'क़').replace(/ज़/g, 'ज़').replace(/फ़/g, 'फ़');
  let out = '';
  const chars = [...s];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i], next = chars[i + 1];
    if (cons[c] !== undefined) {
      // ya after a joined consonant (ya-phala, as in ম্যা) sounds like y, not j
      out += c === 'য' && chars[i - 1] === virama ? 'y' : cons[c];
      if (next === virama) { i++; continue; }
      if (signs[next] !== undefined) { out += signs[next]; i++; continue; }
      // the vowel every consonant carries, dropped at the end of a word
      const end = !next || /[\s()\-,]/.test(next) || extra[next] !== undefined;
      out += end ? '' : table.inherent;
      continue;
    }
    if (vowels[c] !== undefined) { out += vowels[c]; continue; }
    if (extra[c] !== undefined) { out += extra[c]; continue; }
    if (c === virama) continue;
    out += c;
  }
  return out.replace(/(^|[\s(])([a-z])/g, (m, a, b) => a + b.toUpperCase());
}
const DEVA = {
  cons: { क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'ng', च: 'ch', छ: 'chh', ज: 'j', झ: 'jh', ञ: 'n', ट: 't', ठ: 'th', ड: 'd', ढ: 'dh', ण: 'n', त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n', प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm', य: 'y', र: 'r', ल: 'l', व: 'w', श: 'sh', ष: 'sh', स: 's', ह: 'h', 'ड़': 'r', 'ढ़': 'rh', 'क़': 'k', 'ज़': 'z', 'फ़': 'f' },
  vowels: { अ: 'a', आ: 'aa', इ: 'i', ई: 'i', उ: 'u', ऊ: 'u', ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au', ऋ: 'ri' },
  signs: { 'ा': 'aa', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri', 'ॉ': 'o' },
  virama: '्', inherent: 'a', extra: { 'ं': 'n', 'ँ': 'n', 'ः': 'h', '़': '', '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' },
};
const BENG = {
  cons: { ক: 'k', খ: 'kh', গ: 'g', ঘ: 'gh', ঙ: 'ng', চ: 'ch', ছ: 'chh', জ: 'j', ঝ: 'jh', ঞ: 'n', ট: 't', ঠ: 'th', ড: 'd', ঢ: 'dh', ণ: 'n', ত: 't', থ: 'th', দ: 'd', ধ: 'dh', ন: 'n', প: 'p', ফ: 'f', ব: 'b', ভ: 'bh', ম: 'm', য: 'j', র: 'r', ল: 'l', শ: 'sh', ষ: 'sh', স: 's', হ: 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', ৎ: 't' },
  vowels: { অ: 'o', আ: 'a', ই: 'i', ঈ: 'i', উ: 'u', ঊ: 'u', এ: 'e', ঐ: 'oi', ও: 'o', ঔ: 'ou', ঋ: 'ri' },
  signs: { 'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', 'ৃ': 'ri' },
  virama: '্', inherent: 'o', extra: { 'ং': 'ng', 'ঁ': 'n', 'ঃ': 'h', '়': '' },
};

/* ─── Japanese and Chinese: written out by hand (kanji have no rule) ─── */
const JA = {
  'flying-chit': 'Furaingu Chitto', 'tunnel-race': 'Tonneru Reesu', 'turbo-tunnel': 'Taabo Tonneru', 'unblock-puzzle': 'Dasshutsu Pazuru', bingo: 'Bingo', 'fast-typing': 'Taipingu Hayauchi', 'word-guess': 'Tango Ate', 'number-memory': 'Suuji Kioku', 'stroop-test': 'Sutoruupu Tesuto', 'reaction-time': 'Hannou Sokudo', 'hoop-flick': 'Fuupu Furikku', 'ghost-hostel': 'Obake Ryou', 'pin-spin': 'Pin Supin', 'ship-fight': 'Shippu Faito', 'bull-fight': 'Buru Faito', 'road-dash': 'Roodo Dasshu', 'spin-duel': 'Beegoma Taiketsu', 'pen-fight': 'Pen Faito', 'lapa-chupi': 'Kakurenbo', 'baraf-pani': 'Koori-oni', 'pakda-padi': 'Onigokko', 'backyard-rally': 'Uraniwa Rarii', 'hungry-snake': 'Hangurii SunEeku', ludo: 'Rudoo', carrom: 'Kyaromu', chess: 'Chesu', 'snakes-and-ladders': 'Hebi to Hashigo', 'color-clash': 'Karaa Kurasshu', 'call-break': 'Kooru Bureiku', 'crazy-eights': 'Kureijii Eito', checkers: 'Chekkaa', 'four-in-a-row': 'Yonmoku Narabe', 'tic-tac-toe': 'Sanmoku Narabe', reversi: 'Ribaashi', 'dots-and-boxes': 'Dotto & Bokkusu', mancala: 'Mankara', 'nine-mens-morris': 'Nain Menzu Morisu', 'memory-match': 'Shinkei Suijaku', yacht: 'Yotto', pig: 'Piggu', 'who-is-the-spy': 'Waado Urufu', werewolf: 'Jinrou', 'truth-or-dare': 'Shinjitsu ka Chousen ka', 'riddle-chits': 'Nazonazo Kami', 'majority-vote': 'Tasuuketsu Geemu', consequences: 'Origami Monogatari',
};
JA['hungry-snake'] = 'Hangurii Sunekku';
const ZH = {
  'flying-chit': 'Feixiang Zhitiao', 'tunnel-race': 'Suidao Jingsu', 'turbo-tunnel': 'Wolun Suidao', 'unblock-puzzle': 'Tingchechang Jiesuo', bingo: 'Binguo', 'fast-typing': 'Kuaisu Dazi', 'word-guess': 'Cai Danci', 'number-memory': 'Shuzi Jiyi', 'stroop-test': 'Siteluupu Ceshi', 'reaction-time': 'Fanying Sudu', 'hoop-flick': 'Tanzhi Toulan', 'ghost-hostel': 'Gui Sushe', 'pin-spin': 'Zhuanpan Chazhen', 'ship-fight': 'Haizhan', 'bull-fight': 'Douniu', 'road-dash': 'Gonglu Chongci', 'spin-duel': 'Tuoluo Duizhan', 'pen-fight': 'Tanbi Dazhan', 'lapa-chupi': 'Zhuo Micang', 'baraf-pani': 'Bingdong Ren', 'pakda-padi': 'Zhuaren Youxi', 'backyard-rally': 'Houyuan Duida', 'hungry-snake': 'Tanchishe', ludo: 'Feixingqi', carrom: 'Kelangqi', chess: 'Guoji Xiangqi', 'snakes-and-ladders': 'She Ti Qi', 'color-clash': 'Yanse Dazhan', 'call-break': 'Jiaopai', 'crazy-eights': 'Fengkuang Ba Dian', checkers: 'Guoji Tiaoqi', 'four-in-a-row': 'Si Zi Qi', 'tic-tac-toe': 'Jingziqi', reversi: 'Heibaiqi', 'dots-and-boxes': 'Dian Ge Qi', mancala: 'Boqi', 'nine-mens-morris': 'Jiu Zi Qi', 'memory-match': 'Jiyi Fanpai', yacht: 'Kuaiting Touzi', pig: 'Zhu Touzi', 'who-is-the-spy': 'Shei Shi Wodi', werewolf: 'Langrensha', 'truth-or-dare': 'Zhenxinhua Damaoxian', 'riddle-chits': 'Caimi Zhitiao', 'majority-vote': 'Duoshupai Toupiao', consequences: 'Zhezhi Jielong',
};

const OUT = {};
const put = (lang, map) => { for (const [slug, n] of Object.entries(map)) (OUT[slug] ||= {})[lang] = short(n); };
put('hindi', names('hi'));
put('hinglish', names('hi-Latn'));
put('urdu', names('hi-Latn'));       // Roman Urdu reads like Hinglish
for (const [code, lang] of [['es', 'spanish'], ['pt', 'portuguese'], ['fr', 'french'], ['de', 'german'], ['id', 'indonesian'], ['tr', 'turkish'], ['it', 'italian']]) put(lang, names(code));
put('russian_latin', Object.fromEntries(Object.entries(names('ru')).map(([k, v]) => [k, ru(v)])));
put('korean_roman', Object.fromEntries(Object.entries(names('ko')).map(([k, v]) => [k, ko(v)])));
put('nepali', Object.fromEntries(Object.entries(names('ne')).map(([k, v]) => [k, brahmic(v, DEVA)])));
put('bangla', { ...Object.fromEntries(Object.entries(names('bn')).map(([k, v]) => [k, brahmic(v, BENG)])), werewolf: 'Werewolf' });
// (a loanword spelt the way it sounds reads badly back in Latin letters)
OUT.werewolf.nepali = 'Werewolf';
put('romaji', JA);
put('pinyin', ZH);

const body = `/**
 * Every game's name in each language of the app (made by tools/make-local-names.mjs from the language
 * pages; run it again after changing a name there). English names live in the catalog.
 */
export const LOCAL_NAMES = ${JSON.stringify(OUT, null, 1)};
`;
writeFileSync(new URL('../src/arcade/local-names.js', import.meta.url), body);
console.log(`Local names: ${Object.keys(OUT).length} games × ${new Set(Object.values(OUT).flatMap(o => Object.keys(o))).size} languages`);
for (const lang of ['hindi', 'nepali', 'bangla', 'korean_roman', 'russian_latin', 'romaji', 'pinyin']) console.log(lang.padEnd(13), ['ludo', 'chess', 'call-break', 'tic-tac-toe', 'memory-match', 'werewolf'].map(s => OUT[s][lang]).join(' | '));
