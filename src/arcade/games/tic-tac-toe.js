/** Tic-Tac-Toe (noughts and crosses): three in a line on a 3×3 grid. */
import { best, turnLine } from '../lib.js?v=20261110-1448';

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const winner = (b) => LINES.find(([x, y, z]) => b[x] >= 0 && b[x] === b[y] && b[y] === b[z]) || null;
const free = (b) => b.map((v, i) => (v < 0 ? i : -1)).filter(i => i >= 0);

function minimax(b, p, me) {
  const w = winner(b);
  if (w) return b[w[0]] === me ? 10 : -10;
  const open = free(b);
  if (!open.length) return 0;
  const vals = open.map((c) => { const x = b.slice(); x[c] = p; return minimax(x, 1 - p, me); });
  return (p === me ? Math.max(...vals) : Math.min(...vals)) * 0.9;
}

export default {
  init: () => ({ b: Array(9).fill(-1), p: 0, line: null, done: false }),
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s) => free(s.b).map(c => ({ c })),
  apply(s, seat, m) {
    s.b[m.c] = seat;
    s.line = winner(s.b);
    s.done = !!s.line || !free(s.b).length;
    s.p = 1 - seat;
    return [{ k: 'place', seat }, ...(s.line ? [{ k: 'line', seat }] : [])];
  },
  result(s) {
    if (!s.done) return null;
    if (!s.line) return { scores: [0, 0], winners: [], note: 'A draw: nobody made a line.' };
    const w = s.b[s.line[0]];
    return { scores: w === 0 ? [1, 0] : [0, 1], winners: [w] };
  },
  // nearly perfect, with the odd slip so a good player can still win
  bot(s, seat, rng, moves) {
    if (rng() < 0.18) return moves[Math.floor(rng() * moves.length)];
    return best(moves, (m) => { const x = s.b.slice(); x[m.c] = seat; return minimax(x, 1 - seat, seat); }, rng);
  },
  ui: (v, ctx) => ({ title: turnLine(ctx, 'tap a square'), lead: `${ctx.names[0]} ✕ · ${ctx.names[1]} ◯` }),
};
