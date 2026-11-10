/**
 * Pig, the dice game of nerve. Roll as often as you like, adding to this turn's total; a 1 loses
 * the turn's total. Hold to bank it. First to 50 wins. Points have no value outside the game.
 */
import { leaders, roll, seatsOf, turnLine } from '../lib.js?v=20261110-1548';

export const TARGET = 50;

export default {
  init: ({ n }) => ({ n, bank: seatsOf(n).map(() => 0), run: 0, p: 0, shown: 1, rollId: 0, done: false }),
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s) => (s.run > 0 ? [{ roll: 1 }, { hold: 1 }] : [{ roll: 1 }]),
  apply(s, seat, m, rng) {
    const next = () => { s.run = 0; s.p = (seat + 1) % s.n; };
    if (m.hold) {
      s.bank[seat] += s.run;
      const events = [{ k: 'bank', seat }];
      if (s.bank[seat] >= TARGET) s.done = true;
      next();
      return events;
    }
    const die = roll(rng);
    s.shown = die;
    s.rollId += 1;
    if (die === 1) { next(); return [{ k: 'roll', seat, n: 1 }, { k: 'bust', seat }]; }
    s.run += die;
    return [{ k: 'roll', seat, n: die }];
  },
  result: (s) => (s.done ? { scores: s.bank.slice(), winners: leaders(s.bank) } : null),
  bot(s, seat, rng, moves) {
    if (moves.length === 1) return moves[0];
    const top = Math.max(...s.bank.filter((_, i) => i !== seat));
    if (s.bank[seat] + s.run >= TARGET) return { hold: 1 };
    const stop = top >= TARGET - 10 ? 28 : top > s.bank[seat] + 15 ? 24 : 17;
    return s.run >= stop ? { hold: 1 } : { roll: 1 };
  },
  ui(v, ctx) {
    const mine = ctx.active.includes(ctx.me);
    return {
      title: turnLine(ctx, 'roll, or hold what you have'),
      lead: `This turn: ${v.run} · first to ${TARGET} · ${seatsOf(v.n).map(p => `${ctx.names[p]} ${v.bank[p]}`).join(' · ')}`,
      buttons: mine ? ctx.legal.map((m, i) => ({ label: m.roll ? '🎲 Roll' : `Hold ${v.run}`, i, primary: !!m.roll })) : [],
    };
  },
};
