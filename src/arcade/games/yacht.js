/**
 * Yacht, the traditional five-dice game. Up to three rolls a turn, keeping the dice you like, then
 * score in one category you haven't used. Twelve turns each; the highest total wins.
 */
import { best, leaders, roll, seatsOf, turnLine } from '../lib.js?v=20261110-1351';

export const CATEGORIES = [
  ['ones', 'Ones'], ['twos', 'Twos'], ['threes', 'Threes'], ['fours', 'Fours'], ['fives', 'Fives'], ['sixes', 'Sixes'],
  ['choice', 'Choice'], ['four', 'Four of a kind'], ['full', 'Full house'], ['small', 'Little straight'], ['big', 'Big straight'], ['yacht', 'Yacht'],
];
const sum = (d) => d.reduce((a, b) => a + b, 0);
export function points(cat, dice) {
  const n = [0, 0, 0, 0, 0, 0, 0];
  dice.forEach((v) => { n[v] += 1; });
  const face = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].indexOf(cat);
  if (face >= 0) return n[face + 1] * (face + 1);
  const sorted = dice.slice().sort().join('');
  switch (cat) {
    case 'choice': return sum(dice);
    case 'four': { const v = n.findIndex(c => c >= 4); return v > 0 ? v * 4 : 0; }
    case 'full': return n.includes(3) && n.includes(2) ? sum(dice) : 0;
    case 'small': return sorted === '12345' ? 30 : 0;
    case 'big': return sorted === '23456' ? 30 : 0;
    case 'yacht': return n.includes(5) ? 50 : 0;
    default: return 0;
  }
}
const total = (card) => Object.values(card).reduce((a, b) => a + b, 0);

export default {
  init: ({ n }) => ({ n, cards: seatsOf(n).map(() => ({})), dice: [1, 2, 3, 4, 5], keep: [false, false, false, false, false], spins: [0, 0, 0, 0, 0], left: 3, p: 0, done: false }),
  active: (s) => (s.done ? [] : [s.p]),
  moves(s, seat) {
    const list = [];
    if (s.left > 0) list.push({ roll: 1 });
    if (s.left < 3) {
      if (s.left > 0) s.dice.forEach((_, h) => list.push({ h }));
      CATEGORIES.forEach(([cat]) => { if (s.cards[seat][cat] == null) list.push({ cat }); });
    }
    return list;
  },
  apply(s, seat, m, rng) {
    if (m.h != null) { s.keep[m.h] = !s.keep[m.h]; return []; }
    if (m.roll) {
      s.dice = s.dice.map((v, i) => (s.keep[i] ? v : roll(rng)));
      s.spins = s.spins.map((n, i) => (s.keep[i] ? n : n + 1));
      s.left -= 1;
      return [{ k: 'roll', seat }];
    }
    const got = points(m.cat, s.dice);
    s.cards[seat][m.cat] = got;
    s.keep = [false, false, false, false, false];
    s.left = 3;
    s.p = (seat + 1) % s.n;
    s.done = s.cards.every(c => Object.keys(c).length === CATEGORIES.length);
    return [{ k: got ? 'bank' : 'bust', seat }];
  },
  result(s) {
    if (!s.done) return null;
    const scores = s.cards.map(total);
    return { scores, winners: leaders(scores) };
  },
  bot(s, seat, rng, moves) {
    const free = CATEGORIES.map(c => c[0]).filter(c => s.cards[seat][c] == null);
    // worth of a category, compared with what's usually possible there
    const AVERAGE = { ones: 2, twos: 5, threes: 8, fours: 12, fives: 15, sixes: 18, choice: 22, four: 12, full: 10, small: 8, big: 8, yacht: 6 };
    const gain = (c, d = s.dice) => points(c, d) - AVERAGE[c];
    if (s.left === 3) return { roll: 1 };
    if (s.left === 0) return { cat: best(free, c => gain(c), rng) };
    // settle if there's a very good score already
    const top = best(free, c => gain(c), rng);
    if (gain(top) >= 14) return { cat: top };
    // keep the most common face (the higher one when level): set keeps to that, one tap at a time
    const n = [0, 0, 0, 0, 0, 0, 0];
    s.dice.forEach((v) => { n[v] += 1; });
    const face = best([1, 2, 3, 4, 5, 6], v => n[v] * 10 + v, rng);
    const wrong = s.dice.findIndex((v, i) => s.keep[i] !== (v === face));
    return wrong >= 0 ? { h: wrong } : { roll: 1 };
  },
  ui(v, ctx) {
    const mine = ctx.active.includes(ctx.me);
    const buttons = [];
    if (mine) {
      ctx.legal.forEach((m, i) => {
        if (m.roll) buttons.push({ label: `🎲 Roll (${v.left} left)`, i, primary: true });
        if (m.cat) { const [, name] = CATEGORIES.find(c => c[0] === m.cat); buttons.push({ label: `${name}: ${points(m.cat, v.dice)}`, i }); }
      });
    }
    return {
      title: turnLine(ctx, v.left === 3 ? 'roll the dice' : 'tap dice to keep them, roll, or score'),
      lead: `${seatsOf(v.n).map(p => `${ctx.names[p]} ${total(v.cards[p])}`).join(' · ')}`,
      buttons,
      compact: true,
    };
  },
};
