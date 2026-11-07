/**
 * What players can send each other during a match. Phones exchange only an index
 * into these lists, never free text, so nobody can send anything unpleasant.
 * A private line may be a bluff, but no line says which role the sender holds:
 * apart from the finder, nobody at the table tells who they are.
 * The lines themselves live in the language files (src/i18n), so each phone reads
 * a message in its own language.
 */
import { talkText } from '../i18n/index.js?v=20261107-1752';

export const TALK_EMOJIS = ['😂', '🤣', '😜', '🤫', '😎', '🤡', '🙄', '😱', '🥶', '🤔', '😈', '👀', '🙏', '🔥', '💀', '🐔', '🍌', '👋'];
export const TALK_LINE_COUNT = 24;

/** The text of a line in the current language; null for anything that isn't a real line. */
export function talkLine(index, vars = {}) {
  if (!Number.isInteger(index) || index < 0 || index >= TALK_LINE_COUNT) return null;
  const text = talkText(index);
  return text ? text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : null;
}
export const isTalkEmoji = (i) => Number.isInteger(i) && i >= 0 && i < TALK_EMOJIS.length;
