/**
 * Dots and Boxes on a 5×5 grid of boxes. Draw a line on your turn. The player who closes a box owns
 * it and draws again. All lines drawn: most boxes wins.
 */
import { best, seatsOf, turnLine, strip, who } from '../lib.js?v=20261114-1549';

export const N = 5;
// lines: horizontal h(x,y) for x<N, y<=N, then vertical v(x,y) for x<=N, y<N
const H = (x, y) => x + y * N;
const V = (x, y) => (N * (N + 1)) + x + y * (N + 1);
export const LINES = 2 * N * (N + 1);
const sides = (x, y) => [H(x, y), H(x, y + 1), V(x, y), V(x + 1, y)];
export const BOX_SIDES = [];
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) BOX_SIDES.push(sides(x, y));
const count = (lines, box) => BOX_SIDES[box].filter(e => lines[e] >= 0).length;

export default {
  init: ({ n }) => ({ n, lines: Array(LINES).fill(-1), boxes: Array(N * N).fill(-1), p: 0, done: false }),
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s) => s.lines.map((v, e) => (v < 0 ? { e } : null)).filter(Boolean),
  apply(s, seat, m) {
    s.lines[m.e] = seat;
    let closed = 0;
    BOX_SIDES.forEach((list, box) => {
      if (s.boxes[box] < 0 && list.includes(m.e) && count(s.lines, box) === 4) { s.boxes[box] = seat; closed += 1; }
    });
    if (!closed) s.p = (seat + 1) % s.n;
    s.done = s.lines.every(v => v >= 0);
    return closed ? [{ k: 'capture', seat }] : [{ k: 'place', seat }];
  },
  result(s) {
    if (!s.done) return null;
    const scores = seatsOf(s.n).map(p => s.boxes.filter(b => b === p).length);
    const top = Math.max(...scores);
    const winners = seatsOf(s.n).filter(p => scores[p] === top);
    return { scores, winners: winners.length === s.n ? [] : winners };
  },
  // takes every box it can, and avoids drawing the third side of a box while there's a choice
  bot(s, seat, rng, moves) {
    return best(moves, (m) => {
      let v = 0;
      BOX_SIDES.forEach((list, box) => {
        if (!list.includes(m.e)) return;
        const c = count(s.lines, box);
        if (c === 3) v += 100;
        if (c === 2) v -= 20;
      });
      return v;
    }, rng);
  },
  ui(v, ctx) {
    const left = v.boxes.filter(b => b < 0).length;
    const mine = ctx.active.includes(ctx.me);
    let lead = `${left} box${left === 1 ? '' : 'es'} left · close a box and draw again`;
    if (mine) {
      const ready = BOX_SIDES.some((_, bx) => v.boxes[bx] < 0 && count(v.lines, bx) === 3);
      // a safe line puts no box on three sides
      const safe = v.lines.some((x, e) => x < 0 && !BOX_SIDES.some((sides, bx) => sides.includes(e) && count(v.lines, bx) === 2));
      if (ready) lead = `💡 A box is ready to close: take it, then draw again! · ${left} left`;
      else if (!safe) lead = `Careful: every line now gives a box away. Give the fewest. · ${left} left`;
    }
    return {
      title: turnLine(ctx, 'tap a line between two dots'),
      lead,
      players: strip(ctx, ['#d32f2f', '#2e7dd1', '#f2b705', '#2e9e4f'], p => `${v.boxes.filter(b => b === p).length} ▢`),
    };
  },
};
