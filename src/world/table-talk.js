/**
 * What players can send each other during a match. Phones exchange only an index
 * into these lists, never free text, so nobody can send anything unpleasant.
 * A private line may be a bluff, but no line says which role the sender holds:
 * apart from the finder, nobody at the table tells who they are.
 */
export const TALK_EMOJIS = ['😂', '🤣', '😜', '🤫', '😎', '🤡', '🙄', '😱', '🥶', '🤔', '😈', '👀', '🙏', '🔥', '💀', '🐔', '🍌', '👋'];

const LINES = [
  ['Bro, I’m not the {thief}, I swear!', 'Bhai, main {thief} nahi hoon, kasam se!'],
  ['Don’t pick me, we’re friends!', 'Mujhe mat pakadna, dost hain hum!'],
  ['I’m watching you 👀', 'Main tujhe dekh raha hoon 👀'],
  ['I know who it is. Ask me later 😏', 'Mujhe pata hai kaun hai. Baad me poochna 😏'],
  ['Trust me on this one.', 'Is baar mujhpe bharosa kar.'],
  ['Someone here is lying, and it isn’t me.', 'Yahan koi jhooth bol raha hai, par main nahi.'],
  ['Don’t tell anyone, but I’m scared 😅', 'Kisi ko batana mat, mujhe darr lag raha hai 😅'],
  ['Are you the {thief}? Your face says yes.', 'Tu {thief} hai kya? Tera chehra to bol raha hai.'],
  ['Let’s team up this round.', 'Is round me team bana lete hain.'],
  ['I saw something. Keep it between us.', 'Maine kuch dekha hai. Hum dono tak rakhna.'],
  ['Stop laughing, you’ll give it away!', 'Hansna band kar, pakda jayega!'],
  ['I’ll buy you samosas if you save me 🥟', 'Bacha le, samosa khilaunga 🥟'],
  ['Swear on your homework you’re innocent.', 'Homework ki kasam kha ki tu nirdosh hai.'],
  ['You’re sweating. Why are you sweating?', 'Tujhe paseena kyun aa raha hai?'],
  ['Don’t look at me, look over there!', 'Mujhe mat dekh, udhar dekh!'],
  ['I’m innocent, the others are the problem.', 'Main to seedha hoon, baaki sab gadbad hain.'],
  ['Why are you so quiet today? Suspicious.', 'Aaj itna chup kyun hai? Shak ho raha hai.'],
  ['I’ll remember this next round 😤', 'Agle round me dekh lunga 😤'],
  ['That was a good bluff. Respect.', 'Kya bluff maara. Respect.'],
  ['Nice try, I’m not falling for it.', 'Achhi koshish, main phansne wala nahi.'],
  ['Pssst… it’s definitely not me.', 'Psst… pakka main nahi hoon.'],
  ['You can trust me. Probably 😇', 'Mujhpe bharosa kar sakta hai. Shayad 😇'],
  ['Please, I can’t lose another round!', 'Please yaar, ek aur round nahi haar sakta!'],
  ['If I go down, you’re coming with me.', 'Main gaya to tujhe bhi le jaunga.'],
];
export const TALK_LINE_COUNT = LINES.length;

/** The text of a line in this language pack; null for anything that isn't a real line. */
export function talkLine(index, lang, vars = {}) {
  const pair = Number.isInteger(index) ? LINES[index] : null;
  if (!pair) return null;
  return pair[lang === 'hinglish' ? 1 : 0].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
export const isTalkEmoji = (i) => Number.isInteger(i) && i >= 0 && i < TALK_EMOJIS.length;
