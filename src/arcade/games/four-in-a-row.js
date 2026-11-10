/** Four in a Row: drop discs into a 7×6 upright grid; four in a line wins. */
import { searchMove, turnLine } from '../lib.js?v=20261110-1534';

export const COLS = 7, ROWS = 6;
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const at = (b, c, r) => (c >= 0 && c < COLS && r >= 0 && r < ROWS ? b[c + r * COLS] : -2);
function lineFrom(b, c, r) {
  const p = at(b, c, r);
  if (p < 0) return null;
  for (const [dc, dr] of DIRS) {
    const cells = [];
    for (let n = 0; n < 4 && at(b, c + dc * n, r + dr * n) === p; n++) cells.push((c + dc * n) + (r + dr * n) * COLS);
    if (cells.length === 4) return cells;
  }
  return null;
}
function findLine(b) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const l = lineFrom(b, c, r); if (l) return l; }
  return null;
}
const open = (b) => { const l = []; for (let c = 0; c < COLS; c++) if (b[c + (ROWS - 1) * COLS] < 0) l.push(c); return l; };
const drop = (b, c, p) => { const x = b.slice(); for (let r = 0; r < ROWS; r++) if (x[c + r * COLS] < 0) { x[c + r * COLS] = p; break; } return x; };

// the search: position { b, p }, scored for the player to move
const COL_VALUE = [0, 1, 2, 3, 2, 1, 0];
const search = {
  moves: (s) => (findLine(s.b) ? [] : open(s.b)),
  play: (s, c) => ({ b: drop(s.b, c, s.p), p: 1 - s.p }),
  same: () => false,
  order: (list) => list.slice().sort((a, b) => COL_VALUE[b] - COL_VALUE[a]),
  score(s, depth) {
    if (findLine(s.b)) return -1000 - depth;   // the player who just moved has won
    let v = 0;
    s.b.forEach((x, i) => { if (x >= 0) v += (x === s.p ? 1 : -1) * COL_VALUE[i % COLS]; });
    return v;
  },
};

export default {
  init: () => ({ b: Array(COLS * ROWS).fill(-1), p: 0, line: null, done: false }),
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s) => open(s.b).map(c => ({ c })),
  apply(s, seat, m) {
    s.b = drop(s.b, m.c, seat);
    s.line = findLine(s.b);
    s.done = !!s.line || !open(s.b).length;
    s.p = 1 - seat;
    return [{ k: 'place', seat }, ...(s.line ? [{ k: 'line', seat }] : [])];
  },
  result(s) {
    if (!s.done) return null;
    if (!s.line) return { scores: [0, 0], winners: [], note: 'The grid is full: a draw.' };
    const w = s.b[s.line[0]];
    return { scores: w === 0 ? [1, 0] : [0, 1], winners: [w] };
  },
  bot(s, seat, rng) { return { c: searchMove({ b: s.b, p: seat }, 5, search, rng) }; },
  ui: (v, ctx) => ({ title: turnLine(ctx, 'tap a column'), lead: `${ctx.names[0]} red · ${ctx.names[1]} yellow` }),
};
