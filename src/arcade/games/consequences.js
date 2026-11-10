/**
 * Consequences: write a story one folded line at a time, then unfold it. With friends you type your
 * lines. On a table with strangers (and for computer players) lines come from our own list instead,
 * so nobody ever reads something unmoderated from a stranger.
 */
import { pick, seatsOf, shuffle } from '../lib.js?v=20261110-1337';
import { STORY_LINES } from '../content.js?v=20261110-1337';

const clean = (t) => String(t || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);

export default {
  secret: true,
  init({ n, opts, rng }) {
    return {
      n, at: 0, lines: [], typed: !opts?.public, done: false,
      offers: STORY_LINES.map(([, list]) => shuffle(list, rng).slice(0, 3)),
    };
  },
  active: (s) => (s.done ? [] : [s.at % s.n]),
  moves(s) {
    if (s.typed) return [{ text: true }];
    return s.offers[s.at].map(line => ({ line }));
  },
  // a typed line has no fixed list to compare with: tidied here, on the host
  check(s, seat, m) {
    if (s.typed && typeof m?.line === 'string') {
      const line = clean(m.line);
      return line ? { line } : { line: pick(s.offers[s.at]) };
    }
    return null;
  },
  apply(s, seat, m) {
    s.lines.push(m.line);
    s.at += 1;
    s.done = s.at >= STORY_LINES.length;
    return s.done ? [{ k: 'laugh', seat }] : [];
  },
  result: (s) => (s.done ? { scores: seatsOf(s.n).map(() => 0), winners: [], story: s.lines, note: 'The best story wins the room.' } : null),
  view(s, seat) {
    return {
      n: s.n, at: s.at, total: STORY_LINES.length, ask: STORY_LINES[Math.min(s.at, STORY_LINES.length - 1)][0], typed: s.typed, done: s.done,
      offers: s.offers[s.at] || [], lines: s.done ? s.lines : [],
      example: s.at < STORY_LINES.length ? STORY_LINES[s.at][1][0] : '',
      who: s.at % s.n, seat,
    };
  },
  bot: (s, seat, rng) => ({ line: pick(s.offers[s.at], rng) }),
  ui(v, ctx) {
    const mine = ctx.active.includes(ctx.me);
    const title = mine ? v.ask : `${ctx.names[ctx.active[0]]} is writing…`;
    const lead = `Line ${v.at + 1} of ${v.total} · the lines above are folded away`;
    if (!mine) return { title, lead };
    if (v.typed) return { title, lead, input: { placeholder: v.example, button: 'Fold it and pass on' } };
    return { title, lead, buttons: ctx.legal.map((m, i) => ({ label: m.line, i })) };
  },
  chit: (v) => (v.done ? null : { text: v.ask, label: `Line ${v.at + 1} of ${v.total}` }),
};
