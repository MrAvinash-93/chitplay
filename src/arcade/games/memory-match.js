/**
 * Memory Match: turn over two tiles. A pair is yours and you go again; otherwise they turn back and
 * the next player goes. Most pairs wins. Bots remember only some of what they have seen.
 */
import { best, pick, seatsOf, shuffle, turnLine } from '../lib.js?v=20261110-1142';

export const FACES = ['🍎', '🌙', '⭐', '🐟', '🌵', '🎈', '🔔', '🍀', '🎸', '⚓', '🪁', '🧭'];
export const TILES = 24;

export default {
  init: ({ n, rng }) => ({ n, faces: shuffle([...FACES, ...FACES], rng), owner: Array(TILES).fill(-1), up: [], miss: [], p: 0, seen: {}, done: false }),
  active: (s) => (s.done ? [] : [s.p]),
  moves: (s) => s.owner.map((o, t) => (o < 0 && !s.up.includes(t) ? { t } : null)).filter(Boolean),
  apply(s, seat, m, rng) {
    s.miss = [];
    s.up.push(m.t);
    s.seen[m.t] = s.faces[m.t];
    const events = [{ k: 'flip', seat }];
    if (s.up.length === 2) {
      const [a, b] = s.up;
      if (s.faces[a] === s.faces[b]) {
        s.owner[a] = seat;
        s.owner[b] = seat;
        events.push({ k: 'capture', seat });
        s.done = s.owner.every(o => o >= 0);
      } else {
        s.miss = [a, b];       // left face up for everyone to see until the next tap
        s.p = (seat + 1) % s.n;
        events.push({ k: 'miss', seat });
      }
      s.up = [];
    }
    return events;
  },
  result(s) {
    if (!s.done) return null;
    const scores = seatsOf(s.n).map(p => s.owner.filter(o => o === p).length / 2);
    const top = Math.max(...scores);
    const winners = seatsOf(s.n).filter(p => scores[p] === top);
    return { scores, winners: winners.length === s.n ? [] : winners, note: 'Scores are pairs found.' };
  },
  // only the tiles a player could have seen stay in the view; the rest are blanks
  view(s) {
    const shown = new Set([...s.up, ...s.miss]);
    return { n: s.n, owner: s.owner, up: s.up, miss: s.miss, p: s.p, done: s.done, faces: s.faces.map((f, t) => (shown.has(t) || s.owner[t] >= 0 ? f : '')) };
  },
  bot(s, seat, rng, moves) {
    const open = moves.map(m => m.t);
    // a bot recalls about two thirds of the open tiles it has seen
    const memory = open.filter(t => s.seen[t] && ((t * 7 + s.up.length + seat) % 3 !== 0));
    if (s.up.length === 1) {
      const face = s.faces[s.up[0]];
      const match = memory.find(t => s.faces[t] === face);
      if (match != null) return { t: match };
      const unseen = open.filter(t => !s.seen[t]);
      return { t: pick(unseen.length ? unseen : open, rng) };
    }
    const pair = memory.find(a => memory.some(b => b !== a && s.faces[b] === s.faces[a]));
    if (pair != null) return { t: pair };
    return { t: best(open, t => (s.seen[t] ? 0 : 1), rng) };
  },
  ui(v, ctx) {
    return { title: turnLine(ctx, v.up.length ? 'tap the second tile' : 'tap a tile'), lead: seatsOf(v.n).map(p => `${ctx.names[p]} ${v.owner.filter(o => o === p).length / 2}`).join(' · ') };
  },
};
