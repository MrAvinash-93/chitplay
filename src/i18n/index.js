/**
 * The language the whole game is shown in: menus, profile, messages and the players' chat.
 * English is built in and is the default. Every other language is one small file, fetched
 * only when somebody picks it. Anything a language doesn't have yet falls back to English,
 * so nothing is ever blank.
 */
import EN from './en.js?v=20261110-1453';

const V = '?v=20261110-1453';
const LOADERS = {
  hinglish: () => import(`./hinglish.js${V}`),
  urdu: () => import(`./urdu.js${V}`),
  nepali: () => import(`./nepali.js${V}`),
  bangla: () => import(`./bangla.js${V}`),
  romaji: () => import(`./romaji.js${V}`),
  korean_roman: () => import(`./korean_roman.js${V}`),
  pinyin: () => import(`./pinyin.js${V}`),
  russian_latin: () => import(`./russian_latin.js${V}`),
  german: () => import(`./german.js${V}`),
  french: () => import(`./french.js${V}`),
  portuguese: () => import(`./portuguese.js${V}`),
  spanish: () => import(`./spanish.js${V}`),
  hindi: () => import(`./hindi.js${V}`),
  indonesian: () => import(`./indonesian.js${V}`),
  turkish: () => import(`./turkish.js${V}`),
  italian: () => import(`./italian.js${V}`),
};

/** In the picker, each language under its own name. `short` goes on the button in the top bar. */
export const LANGUAGES = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'hindi', label: 'हिन्दी', short: 'हि' },
  { id: 'hinglish', label: 'Hinglish', short: 'HI' },
  { id: 'urdu', label: 'Roman Urdu', short: 'UR' },
  { id: 'nepali', label: 'Roman Nepali', short: 'NE' },
  { id: 'bangla', label: 'Roman Bangla', short: 'BN' },
  { id: 'romaji', label: 'Nihongo (Romaji)', short: 'JA' },
  { id: 'korean_roman', label: 'Hangugeo (Romanized)', short: 'KO' },
  { id: 'pinyin', label: 'Zhongwen (Pinyin)', short: 'ZH' },
  { id: 'russian_latin', label: 'Russkiy (Latin)', short: 'RU' },
  { id: 'german', label: 'Deutsch', short: 'DE' },
  { id: 'french', label: 'Français', short: 'FR' },
  { id: 'portuguese', label: 'Português', short: 'PT' },
  { id: 'spanish', label: 'Español', short: 'ES' },
  { id: 'indonesian', label: 'Bahasa Indonesia', short: 'ID' },
  { id: 'turkish', label: 'Türkçe', short: 'TR' },
  { id: 'italian', label: 'Italiano', short: 'IT' },
];
export const isLanguage = (id) => LANGUAGES.some(l => l.id === id);

let current = EN;
let currentId = 'en';

/** Switches the game's language. Resolves false (and stays on the old one) if the file can't load. */
export async function useLanguage(id) {
  if (id === currentId) return true;
  if (id === 'en' || !LOADERS[id]) { current = EN; currentId = 'en'; return true; }
  try {
    const pack = (await LOADERS[id]()).default;
    current = {
      ui: { ...EN.ui, ...pack.ui },
      talk: pack.talk || EN.talk,
      forfeits: pack.forfeits || EN.forfeits,
      looks: { ...EN.looks, ...pack.looks },
      ranks: pack.ranks || EN.ranks,
      badges: { ...EN.badges, ...pack.badges },
    };
    currentId = id;
    return true;
  } catch (e) {
    console.warn('[ChitPlay] language not loaded:', id, e);
    return false;
  }
}

export const languageId = () => currentId;
export const strings = () => current.ui;
export const talkText = (i) => current.talk[i] ?? null;
export const forfeits = () => current.forfeits;
/** Names of characters, hair styles, clothes and so on, by their id. */
export const lookName = (id, fallback) => current.looks[id] ?? fallback ?? id;
export const rankTitle = (rank) => current.ranks[rank.index] ?? rank.title;
export const badgeText = (badge) => {
  const b = current.badges[badge.id];
  return { name: b?.[0] ?? badge.name, hint: b?.[1] ?? badge.hint };
};
