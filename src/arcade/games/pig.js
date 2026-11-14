/**
 * Pig, the dice game of nerve. Roll as often as you like, adding to this turn's total; a 1 loses
 * the turn's total. Hold to bank it. Quick games go to 50, classic ones to 100. Points have no value
 * outside the game.
 *
 * Fair to the last player: when somebody reaches the target, everyone after them in the round still
 * gets one more turn to beat it, so nobody wins just by going first.
 *
 * Two dice (a mode): roll a pair. A single 1 loses the turn's total as usual; two 1s lose everything
 * you have banked too. Doubles must be rolled again.
 */
import { leaders, roll, seatsOf, turnLine, strip, who } from '../lib.js?v=20261114-1448';

export const TARGET = 50;
const targetOf = (s) => (s.style === 'classic' || s.style === 'two' ? 100 : TARGET);

export default {
  init: ({ n, opts }) => ({
    n, style: ['classic', 'two'].includes(opts?.style) ? opts.style : 'quick',
    bank: seatsOf(n).map(() => 0), run: 0, p: 0, shown: 1, shown2: 1, rollId: 0, done: false, last: -1, must: false, note: null,
  }),
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s) => (s.run > 0 && !s.must ? [{ roll: 1 }, { hold: 1 }] : [{ roll: 1 }]),
  apply(s, seat, m, rng) {
    const goal = targetOf(s);
    const next = () => {
      s.run = 0;
      s.must = false;
      s.p = (seat + 1) % s.n;
      // the last turn of the final round is over
      if (s.last >= 0 && s.p === s.last) s.done = true;
    };
    if (m.hold) {
      s.bank[seat] += s.run;
      s.note = null;
      const events = [{ k: 'bank', seat }];
      if (s.bank[seat] >= goal && s.last < 0) {
        // everyone else gets one more go to catch up
        s.last = seat;
        s.note = { seat, kind: 'final' };
        if (s.n === 1) s.done = true;
      }
      next();
      return events;
    }
    s.note = s.last >= 0 ? s.note : null;
    s.rollId += 1;
    if (s.style === 'two') {
      const a = roll(rng), b = roll(rng);
      s.shown = a; s.shown2 = b;
      if (a === 1 && b === 1) { s.bank[seat] = 0; s.note = { seat, kind: 'wipe' }; next(); return [{ k: 'roll', seat, n: a }, { k: 'bust', seat }]; }
      if (a === 1 || b === 1) { next(); return [{ k: 'roll', seat, n: a }, { k: 'bust', seat }]; }
      s.run += a + b;
      s.must = a === b;
      // the thrown die shows the first; the second lands beside it
      return [{ k: 'roll', seat, n: a }];
    }
    const die = roll(rng);
    s.shown = die;
    if (die === 1) { next(); return [{ k: 'roll', seat, n: 1 }, { k: 'bust', seat }]; }
    s.run += die;
    return [{ k: 'roll', seat, n: die }];
  },
  result: (s) => (s.done ? { scores: s.bank.slice(), winners: leaders(s.bank), note: `First to ${targetOf(s)}, and everyone got the same number of turns.` } : null),
  bot(s, seat, rng, moves) {
    if (moves.length === 1) return moves[0];
    const goal = targetOf(s);
    const top = Math.max(...s.bank.filter((_, i) => i !== seat));
    // the final round: hold only once ahead of the leader (or there's nothing left to lose)
    if (s.last >= 0) return s.bank[seat] + s.run > top ? { hold: 1 } : { roll: 1 };
    if (s.bank[seat] + s.run >= goal) return { hold: 1 };
    const scale = goal / 50;
    const stop = (top >= goal - 10 * scale ? 28 : top > s.bank[seat] + 15 * scale ? 24 : 17) * (s.style === 'two' ? 0.85 : 1) * Math.min(1.25, scale);
    return s.run >= stop ? { hold: 1 } : { roll: 1 };
  },
  ui(v, ctx) {
    const mine = ctx.active.includes(ctx.me);
    const goal = targetOf(v);
    const nameOf = (p) => (p === ctx.me && !ctx.pass ? 'You' : ctx.names[p]);
    const n = v.note;
    const says = !n ? '' : n.kind === 'wipe' ? `${nameOf(n.seat)} rolled two 1s: the whole bank is gone!`
      : `${nameOf(n.seat)} reached ${goal}! Everyone else has one last turn to beat ${v.bank[n.seat]}.`;
    return {
      title: turnLine(ctx, v.must ? 'doubles: roll again' : 'roll, or hold what you have'),
      lead: `${says ? `${says} · ` : ''}This turn: ${v.run} · first to ${goal}${v.run ? ` · hold now and you'd have ${v.bank[v.p] + v.run}` : ''}`,
      players: strip(ctx, ['#d32f2f', '#2e7dd1', '#f2b705', '#2e9e4f'], p => `🏦 ${v.bank[p]}`),
      buttons: mine ? ctx.legal.map((m, i) => ({ label: m.roll ? '🎲 Roll' : `Hold ${v.run}`, i, primary: !!m.roll })) : [],
    };
  },
};
