/**
 * Mancala (the common six-pit, four-seed rules). Pits 0–5 are seat 0's, 6 is its store; pits 7–12
 * are seat 1's, 13 its store. Sow to the right, skipping the other player's store. The last seed in
 * your own store gives another turn; in an empty pit of yours it captures the seeds opposite.
 */
import { searchMove, turnLine, strip, who } from '../lib.js?v=20261114-1146';

const STORE = [6, 13];
const mine = (p) => (p === 0 ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);
function sow(pos, pit) {
  const b = pos.b.slice(), p = pos.p;
  let n = b[pit], at = pit;
  b[pit] = 0;
  while (n > 0) {
    at = (at + 1) % 14;
    if (at === STORE[1 - p]) continue;
    b[at] += 1;
    n -= 1;
  }
  let captured = 0;
  if (at !== STORE[p] && mine(p).includes(at) && b[at] === 1 && b[12 - at] > 0) {
    captured = b[12 - at] + 1;
    b[STORE[p]] += captured;
    b[at] = 0;
    b[12 - at] = 0;
  }
  const again = at === STORE[p];
  return { b, p: again ? p : 1 - p, captured, again };
}
const empty = (b, p) => mine(p).every(i => b[i] === 0);
function sweep(b) {
  if (!empty(b, 0) && !empty(b, 1)) return false;
  [0, 1].forEach(p => mine(p).forEach((i) => { b[STORE[p]] += b[i]; b[i] = 0; }));
  return true;
}
const search = {
  moves: (s) => (empty(s.b, 0) || empty(s.b, 1) ? [] : mine(s.p).filter(i => s.b[i] > 0)),
  play: sow,
  same: (a, b) => a.p === b.p,
  score: (s) => s.b[STORE[s.p]] - s.b[STORE[1 - s.p]],
};

export default {
  init() { const b = Array(14).fill(4); b[6] = 0; b[13] = 0; return { b, p: 0, done: false }; },
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s, seat) => mine(seat).filter(i => s.b[i] > 0).map(pit => ({ pit })),
  apply(s, seat, m) {
    const r = sow({ b: s.b, p: seat }, m.pit);
    s.b = r.b;
    s.p = r.p;
    const events = [{ k: 'place', seat }];
    if (r.captured) events.push({ k: 'capture', seat });
    if (r.again) events.push({ k: 'again', seat });
    if (sweep(s.b)) s.done = true;
    return events;
  },
  result(s) {
    if (!s.done) return null;
    const a = s.b[6], b = s.b[13];
    return { scores: [a, b], winners: a === b ? [] : [a > b ? 0 : 1], note: a === b ? 'Level on seeds: a draw.' : '' };
  },
  bot(s, seat, rng, moves) {
    const pit = searchMove({ b: s.b, p: seat }, 6, search, rng, moves.map(m => m.pit));
    return { pit };
  },
  ui(v, ctx) {
    const turn = ctx.active.includes(ctx.me);
    let lead = 'Last seed in your store: go again. In an empty pit of yours: take the seeds opposite.';
    if (turn) {
      const tips = [];
      mine(ctx.me).forEach((pit) => {
        if (!v.b[pit]) return;
        const r = sow({ b: v.b, p: ctx.me }, pit);
        if (r.again) tips.push(`the pit with ${v.b[pit]} gives you another turn`);
        else if (r.captured) tips.push(`the pit with ${v.b[pit]} captures ${r.captured}`);
      });
      if (tips.length) lead = `💡 ${tips.slice(0, 2).join(' · ')}`;
    }
    return {
      title: turnLine(ctx, 'tap one of your pits'),
      lead,
      players: strip(ctx, ['#e0a050', '#6fa8dc'], p => `🏺 ${v.b[STORE[p]]} · ${mine(p).reduce((t, i) => t + v.b[i], 0)} in pits`),
    };
  },
};
