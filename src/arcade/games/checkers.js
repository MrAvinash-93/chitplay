/**
 * Checkers (English draughts) on 8×8. Seat 0 starts at the bottom and moves first.
 * Pieces: 0 / 1 are men, 2 / 3 are kings (piece % 2 is the owner). Captures are compulsory; a jump
 * continues with the same piece while it can; reaching the far row ends the turn with a crown.
 * No moves left loses. 40 moves each without a capture or a man moving is a draw.
 */
import { searchMove, turnLine } from '../lib.js?v=20261110-1422';

const owner = (x) => x % 2;
const isKing = (x) => x >= 2;
function steps(piece) {
  const fwd = owner(piece) === 0 ? -1 : 1;      // seat 0 climbs towards row 0
  return isKing(piece) ? [[1, 1], [-1, 1], [1, -1], [-1, -1]] : [[1, fwd], [-1, fwd]];
}
function jumpsFrom(b, f) {
  const x = f % 8, y = (f - x) / 8, list = [];
  for (const [dx, dy] of steps(b[f])) {
    const mx = x + dx, my = y + dy, tx = x + 2 * dx, ty = y + 2 * dy;
    if (tx < 0 || tx > 7 || ty < 0 || ty > 7) continue;
    const mid = b[mx + my * 8];
    if (mid >= 0 && owner(mid) !== owner(b[f]) && b[tx + ty * 8] < 0) list.push({ f, t: tx + ty * 8, x: mx + my * 8 });
  }
  return list;
}
function stepsFrom(b, f) {
  const x = f % 8, y = (f - x) / 8, list = [];
  for (const [dx, dy] of steps(b[f])) {
    const tx = x + dx, ty = y + dy;
    if (tx >= 0 && tx <= 7 && ty >= 0 && ty <= 7 && b[tx + ty * 8] < 0) list.push({ f, t: tx + ty * 8 });
  }
  return list;
}
function legal(b, p, chain = -1) {
  if (chain >= 0) return jumpsFrom(b, chain);
  const jumps = [], plain = [];
  b.forEach((v, f) => { if (v >= 0 && owner(v) === p) { jumps.push(...jumpsFrom(b, f)); plain.push(...stepsFrom(b, f)); } });
  return jumps.length ? jumps : plain;
}
/** The move on a board: returns the new board and who is next. */
function play(pos, m) {
  const b = pos.b.slice();
  const piece = b[m.f];
  b[m.f] = -1;
  let next = piece;
  const y = (m.t - (m.t % 8)) / 8;
  const crowned = !isKing(piece) && ((owner(piece) === 0 && y === 0) || (owner(piece) === 1 && y === 7));
  if (crowned) next = piece + 2;
  b[m.t] = next;
  if (m.x != null) b[m.x] = -1;
  const again = m.x != null && !crowned && jumpsFrom(b, m.t).length > 0;
  return { b, p: again ? pos.p : 1 - pos.p, chain: again ? m.t : -1, crowned };
}
const search = {
  moves: (s) => legal(s.b, s.p, s.chain),
  play,
  same: (a, b) => a.p === b.p,
  order: (list) => list,
  score(s, depth) {
    if (!legal(s.b, s.p, s.chain).length) return -1000 - depth;
    let v = 0;
    s.b.forEach((x, i) => {
      if (x < 0) return;
      const y = (i - (i % 8)) / 8;
      const worth = isKing(x) ? 30 : 10 + (owner(x) === 0 ? 7 - y : y);
      v += owner(x) === s.p ? worth : -worth;
    });
    return v;
  },
};

export default {
  init() {
    const b = Array(64).fill(-1);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 0) continue;
      if (y < 3) b[x + y * 8] = 1;
      if (y > 4) b[x + y * 8] = 0;
    }
    return { b, p: 0, chain: -1, quiet: 0, done: false, winner: -1, last: null };
  },
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s, seat) => legal(s.b, seat, s.chain),
  apply(s, seat, m) {
    const man = s.b[m.f] < 2;
    const r = play(s, m);
    s.b = r.b; s.p = r.p; s.chain = r.chain;
    s.quiet = m.x != null || man ? 0 : s.quiet + 1;
    s.last = m;
    const events = [{ k: m.x != null ? 'capture' : 'move', seat }];
    if (r.crowned) events.push({ k: 'crown', seat });
    if (!legal(s.b, s.p, s.chain).length) { s.done = true; s.winner = seat; }
    else if (s.quiet >= 80) s.done = true;
    return events;
  },
  result(s) {
    if (!s.done) return null;
    if (s.winner < 0) return { scores: [0, 0], winners: [], note: '40 moves each without progress: a draw.' };
    return { scores: s.winner === 0 ? [1, 0] : [0, 1], winners: [s.winner] };
  },
  bot(s, seat, rng, moves) { return searchMove({ b: s.b, p: seat, chain: s.chain }, 4, search, rng, moves); },
  ui(v, ctx) {
    const men = [0, 1].map(p => v.b.filter(x => x >= 0 && owner(x) === p).length);
    return { title: turnLine(ctx, v.chain >= 0 ? 'keep jumping' : 'tap a piece, then a square'), lead: `${ctx.names[0]} ${men[0]} · ${ctx.names[1]} ${men[1]}${ctx.me >= 0 && ctx.legal.some(m => m.x != null) ? ' · you must capture' : ''}` };
  },
};
