/**
 * What players can send each other during a match. Phones exchange only an index
 * into these lists, never free text, so nobody can send anything unpleasant.
 * A private line may be a bluff, but no line says which role the sender holds:
 * apart from the finder, nobody at the table tells who they are.
 * The lines themselves live in the language files (src/i18n), so each phone reads
 * a message in its own language.
 */
import { talkText } from '../i18n/index.js?v=20261114-1146';

export const TALK_EMOJIS = ['😂', '🤣', '😜', '🤫', '😎', '🤡', '🙄', '😱', '🥶', '🤔', '😈', '👀', '🙏', '🔥', '💀', '🐔', '🍌', '👋'];
export const TALK_LINE_COUNT = 24;

/**
 * Special emojis you earn. Everybody at the table sees them fly (bigger, with sparkles); only the
 * players who unlocked one can send it, so they show what you've achieved. Phones still send only
 * an index, into TALK_EMOJIS followed by these.
 */
export const SPECIAL_EMOJIS = [
  { id: 'e-siren', symbol: '🚨', badge: 'detective' },
  { id: 'e-fox', symbol: '🦊', badge: 'escape-artist' },
  { id: 'e-trophy', symbol: '🏆', badge: 'ten-wins' },
  { id: 'e-bolt', symbol: '⚡', badge: 'streak-7' },
  { id: 'e-crown', symbol: '👑', rank: 4 },
  { id: 'e-mask', symbol: '🎭', rank: 6 },
  { id: 'e-rainbow', symbol: '🌈', login: 7 },
  { id: 'e-diamond', symbol: '💎', price: 500 },
];
export const ALL_EMOJIS = [...TALK_EMOJIS, ...SPECIAL_EMOJIS.map(e => e.symbol)];
export const isSpecialEmoji = (symbol) => SPECIAL_EMOJIS.some(e => e.symbol === symbol);

/** The text of a line in the current language; null for anything that isn't a real line. */
export function talkLine(index, vars = {}) {
  if (!Number.isInteger(index) || index < 0 || index >= TALK_LINE_COUNT) return null;
  const text = talkText(index);
  return text ? text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : null;
}
export const isTalkEmoji = (i) => Number.isInteger(i) && i >= 0 && i < ALL_EMOJIS.length;
