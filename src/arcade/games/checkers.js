/**
 * Checkers (English draughts) on 8×8. Seat 0 starts at the bottom and moves first.
 * Pieces: 0 / 1 are men, 2 / 3 are kings (piece % 2 is the owner). Captures are compulsory; a jump
 * continues with the same piece while it can; reaching the far row ends the turn with a crown.
 * No moves left loses. 40 moves each without a capture or a man moving is a draw.
 */
import { searchMove, turnLine, strip, who } from '../lib.js?v=20261114-1146';

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
    let v = 0, mine = 0, theirs = 0;
    const mineAt = [], theirsAt = [];
    s.b.forEach((x, i) => {
      if (x < 0) return;
      const y = (i - (i % 8)) / 8;
      const worth = isKing(x) ? 30 : 10 + (owner(x) === 0 ? 7 - y : y);
      if (owner(x) === s.p) { v += worth; mine += isKing(x) ? 3 : 2; mineAt.push(i); } else { v -= worth; theirs += isKing(x) ? 3 : 2; theirsAt.push(i); }
    });
    // the endgame, as a strong player plays it: ahead, trade down and close in; behind, keep away
    const lead = mine - theirs, left = mineAt.length + theirsAt.length;
    if (lead && left <= 12) {
      const [hunters, prey] = lead > 0 ? [mineAt, theirsAt] : [theirsAt, mineAt];
      const gap = (a, b) => Math.max(Math.abs((a % 8) - (b % 8)), Math.abs(((a - (a % 8)) / 8) - ((b - (b % 8)) / 8)));
      const chase = hunters.reduce((t, h) => t + Math.min(...prey.map(q => gap(h, q))), 0);
      // the side behind is safest in the middle and in the double corners; drive it to the edges
      const edge = prey.reduce((t, q) => { const x = q % 8, y = (q - x) / 8; return t + Math.min(x, 7 - x, y, 7 - y); }, 0);
      v += Math.sign(lead) * ((24 - left) * 1.5 - chase * 1.6 - edge * 2);
    }
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
  // looks further ahead once the board empties out, where the endgame is won or drawn
  bot(s, seat, rng, moves) { const left = s.b.filter(x => x >= 0).length; return searchMove({ b: s.b, p: seat, chain: s.chain }, left <= 5 ? 8 : left <= 7 ? 7 : left <= 10 ? 6 : 4, search, rng, moves); },
  ui(v, ctx) {
    const pieces = [0, 1].map(p => v.b.filter(x => x >= 0 && owner(x) === p));
    const kings = pieces.map(l => l.filter(isKing).length);
    const mine = ctx.active.includes(ctx.me);
    const mustTake = mine && ctx.legal.some(m => m.x != null);
    const lead = v.chain >= 0 ? (mine ? '⚔️ Keep jumping with the same piece!' : `${who(ctx, v.p)} is jumping again…`)
      : mustTake ? '⚔️ You must capture: the glowing pieces can jump.'
        : (v.quiet || 0) >= 50 ? `No capture for a while: a draw in ${Math.ceil((80 - v.quiet) / 2)} more moves each.`
          : 'Reach the far row to crown a king 👑. Kings move both ways.';
    return {
      title: turnLine(ctx, v.chain >= 0 ? 'keep jumping' : 'tap a piece, then a square'),
      lead,
      players: strip(ctx, ['#d32f2f', '#f7f0e0'], p => `${pieces[p].length} left${kings[p] ? ` · ${kings[p]} 👑` : ''} · took ${12 - pieces[1 - p].length}`),
    };
  },
};
