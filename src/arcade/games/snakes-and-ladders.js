/**
 * Snakes and Ladders, 2 to 4 players, on our own 100-square board. A six rolls again. Square 100
 * needs the exact number: too high and the token stays put.
 */
import { roll, seatsOf, turnLine } from '../lib.js?v=20261110-1410';

export const LADDERS = { 3: 22, 9: 31, 20: 41, 28: 76, 36: 57, 51: 67, 63: 81, 71: 92 };
export const SNAKES = { 26: 7, 39: 18, 47: 25, 58: 40, 66: 44, 83: 61, 89: 68, 95: 74, 98: 79 };

export default {
  init: ({ n }) => ({ n, at: seatsOf(n).map(() => 0), p: 0, shown: 1, rollId: 0, won: -1 }),
  active: (s) => (s.won >= 0 ? [] : [s.p]),
  moves: () => [{ roll: 1 }],
  apply(s, seat, _m, rng) {
    const die = roll(rng);
    s.shown = die;
    s.rollId += 1;
    const events = [{ k: 'roll', seat, n: die, steps: s.at[seat] + die <= 100 ? die : 0 }];
    const to = s.at[seat] + die;
    if (to <= 100) {
      s.at[seat] = to;
      if (LADDERS[to]) { s.at[seat] = LADDERS[to]; events.push({ k: 'ladder', seat }); }
      else if (SNAKES[to]) { s.at[seat] = SNAKES[to]; events.push({ k: 'snake', seat }); }
    }
    if (s.at[seat] === 100) { s.won = seat; return events; }
    if (die !== 6) s.p = (seat + 1) % s.n;
    return events;
  },
  result: (s) => (s.won < 0 ? null : { scores: s.at.slice(), winners: [s.won], note: 'Scores are the squares reached.' }),
  bot: (s, seat, rng, moves) => moves[0],
  ui(v, ctx) {
    return {
      title: turnLine(ctx, 'roll the die'),
      lead: seatsOf(v.n).map(p => `${ctx.names[p]} ${v.at[p] || 'start'}`).join(' · '),
      buttons: ctx.active.includes(ctx.me) ? [{ label: '🎲 Roll', i: 0, primary: true }] : [],
    };
  },
};
