/**
 * Nine Men's Morris: place nine pieces, then move them, making lines of three ("mills") to take
 * the other player's pieces. Down to two pieces, or with no move, you lose. With three pieces left
 * yours may fly to any free point. 50 moves each without a capture is a draw.
 */
import { best, turnLine } from '../lib.js?v=20261110-1153';

// 24 points: three squares, numbered clockwise from the top-left of each
export const POINTS = 24;
export const LINKS = [
  [1, 7], [0, 2, 9], [1, 3], [2, 4, 11], [3, 5], [4, 6, 13], [5, 7], [6, 0, 15],
  [9, 15], [8, 10, 1, 17], [9, 11], [10, 12, 3, 19], [11, 13], [12, 14, 5, 21], [13, 15], [14, 8, 7, 23],
  [17, 23], [16, 18, 9], [17, 19], [18, 20, 11], [19, 21], [20, 22, 13], [21, 23], [22, 16, 15],
];
const MILLS = [];
for (let ring = 0; ring < 3; ring++) {
  const o = ring * 8;
  MILLS.push([o, o + 1, o + 2], [o + 2, o + 3, o + 4], [o + 4, o + 5, o + 6], [o + 6, o + 7, o]);
}
[1, 3, 5, 7].forEach(k => MILLS.push([k, k + 8, k + 16]));

const inMill = (b, c) => b[c] >= 0 && MILLS.some(m => m.includes(c) && m.every(x => b[x] === b[c]));
const countOf = (b, p) => b.filter(v => v === p).length;
const newMill = (b, c) => MILLS.some(m => m.includes(c) && m.every(x => b[x] === b[c]));
function removable(b, foe) {
  const all = b.map((v, i) => (v === foe ? i : -1)).filter(i => i >= 0);
  const open = all.filter(c => !inMill(b, c));
  return open.length ? open : all;
}
function legal(s, p) {
  if (s.take) return removable(s.b, 1 - p).map(x => ({ x }));
  if (s.left[p] > 0) return s.b.map((v, t) => (v < 0 ? { t } : null)).filter(Boolean);
  const mine = s.b.map((v, i) => (v === p ? i : -1)).filter(i => i >= 0);
  const list = [];
  const fly = mine.length === 3;
  for (const f of mine) {
    const targets = fly ? s.b.map((v, i) => (v < 0 ? i : -1)).filter(i => i >= 0) : LINKS[f].filter(t => s.b[t] < 0);
    targets.forEach(t => list.push({ f, t }));
  }
  return list;
}
function closes(s, p, m) {
  const b = s.b.slice();
  if (m.f != null) b[m.f] = -1;
  b[m.t] = p;
  return newMill(b, m.t);
}

export default {
  init: () => ({ b: Array(POINTS).fill(-1), left: [9, 9], p: 0, take: false, quiet: 0, winner: -1, done: false, last: null }),
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s, seat) => legal(s, seat),
  apply(s, seat, m) {
    const events = [];
    if (m.x != null) {
      s.b[m.x] = -1;
      s.take = false;
      s.quiet = 0;
      events.push({ k: 'capture', seat });
    } else {
      if (m.f != null) s.b[m.f] = -1; else s.left[seat] -= 1;
      s.b[m.t] = seat;
      s.last = m.t;
      s.quiet += 1;
      events.push({ k: 'place', seat });
      // a mill with none of their pieces on the board yet takes nothing
      if (newMill(s.b, m.t)) {
        events.push({ k: 'line', seat });
        if (countOf(s.b, 1 - seat) > 0) { s.take = true; return events; }
      }
    }
    const foe = 1 - seat;
    s.p = foe;
    if ((s.left[foe] === 0 && countOf(s.b, foe) < 3) || !legal(s, foe).length) { s.done = true; s.winner = seat; }
    else if (s.quiet >= 100) s.done = true;
    return events;
  },
  result(s) {
    if (!s.done) return null;
    if (s.winner < 0) return { scores: [0, 0], winners: [], note: '50 moves each without a capture: a draw.' };
    return { scores: s.winner === 0 ? [1, 0] : [0, 1], winners: [s.winner] };
  },
  bot(s, seat, rng, moves) {
    const foe = 1 - seat;
    return best(moves, (m) => {
      if (m.x != null) return (inMill(s.b, m.x) ? 0 : 5) + LINKS[m.x].length;
      let v = LINKS[m.t].length;
      if (closes(s, seat, m)) v += 100;
      if (closes(s, foe, { t: m.t })) v += 40;    // blocks a mill
      if (m.f != null && inMill(s.b, m.f)) v += 6; // opening a mill to close it again
      return v;
    }, rng);
  },
  ui(v, ctx) {
    const on = [0, 1].map(p => countOf(v.b, p));
    const verb = v.take ? 'take one of their pieces' : v.left[ctx.me] > 0 ? 'place a piece' : 'tap a piece, then a point';
    return { title: turnLine(ctx, verb), lead: `${ctx.names[0]} ⚪ ${on[0]}+${v.left[0]} · ${ctx.names[1]} ⚫ ${on[1]}+${v.left[1]}` };
  },
};
