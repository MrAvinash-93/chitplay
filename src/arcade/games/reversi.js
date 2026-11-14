/** Reversi: trap the other colour between yours to flip it. Most discs at the end wins. */
import { best, turnLine, strip, who } from '../lib.js?v=20261114-1428';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function flips(b, c, p) {
  if (b[c] >= 0) return [];
  const x = c % 8, y = (c - x) / 8, all = [];
  for (const [dx, dy] of DIRS) {
    const run = [];
    for (let nx = x + dx, ny = y + dy; nx >= 0 && nx < 8 && ny >= 0 && ny < 8; nx += dx, ny += dy) {
      const v = b[nx + ny * 8];
      if (v < 0) { run.length = 0; break; }
      if (v === p) { all.push(...run); run.length = 0; break; }
      run.push(nx + ny * 8);
    }
  }
  return all;
}
const legal = (b, p) => { const l = []; for (let c = 0; c < 64; c++) if (flips(b, c, p).length) l.push(c); return l; };
const count = (b) => [b.filter(v => v === 0).length, b.filter(v => v === 1).length];
const WEIGHT = [
  60, -12, 8, 6, 6, 8, -12, 60, -12, -20, -2, -2, -2, -2, -20, -12, 8, -2, 3, 1, 1, 3, -2, 8, 6, -2, 1, 0, 0, 1, -2, 6,
  6, -2, 1, 0, 0, 1, -2, 6, 8, -2, 3, 1, 1, 3, -2, 8, -12, -20, -2, -2, -2, -2, -20, -12, 60, -12, 8, 6, 6, 8, -12, 60,
];

export default {
  init() { const b = Array(64).fill(-1); b[27] = 1; b[28] = 0; b[35] = 0; b[36] = 1; return { b, p: 0, done: false, passed: false }; },
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s, seat) => legal(s.b, seat).map(c => ({ c })),
  apply(s, seat, m) {
    const turned = flips(s.b, m.c, seat);
    s.b[m.c] = seat;
    s.last = m.c;
    turned.forEach((c) => { s.b[c] = seat; });
    const events = [{ k: 'place', seat }];
    const other = 1 - seat;
    s.passed = false;
    if (legal(s.b, other).length) s.p = other;
    else if (legal(s.b, seat).length) { s.p = seat; s.passed = true; events.push({ k: 'pass', seat: other }); }
    else s.done = true;
    return events;
  },
  result(s) {
    if (!s.done) return null;
    const [a, b] = count(s.b);
    return { scores: [a, b], winners: a === b ? [] : [a > b ? 0 : 1], note: a === b ? 'Level on discs: a draw.' : '' };
  },
  bot(s, seat, rng, moves) {
    return best(moves, (m) => {
      const b = s.b.slice();
      flips(b, m.c, seat).forEach((c) => { b[c] = seat; });
      b[m.c] = seat;
      let v = WEIGHT[m.c] * 2;
      b.forEach((x, i) => { if (x >= 0) v += (x === seat ? 1 : -1) * WEIGHT[i]; });
      v -= legal(b, 1 - seat).length * 2;   // leave the other player few choices
      return v + rng() * 3;
    }, rng);
  },
  ui(v, ctx) {
    const [a, b] = count(v.b);
    const mine = ctx.active.includes(ctx.me);
    const corner = mine && ctx.legal.some(m => [0, 7, 56, 63].includes(m.c));
    const lead = v.passed ? `${who(ctx, 1 - v.p)} had no move: turn skipped.`
      : mine ? `${ctx.legal.length} place${ctx.legal.length === 1 ? '' : 's'} to play${corner ? ' · 💡 a corner is open: corners can never be flipped' : ''}`
        : a === b ? 'Level on discs.' : `${who(ctx, a > b ? 0 : 1)} ahead by ${Math.abs(a - b)}.`;
    return {
      title: turnLine(ctx, 'tap a marked square'),
      lead,
      players: strip(ctx, ['#2a2a2a', '#f3efe4'], p => `${p ? '⚪' : '⚫'} ${p ? b : a}`),
    };
  },
};
