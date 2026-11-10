/**
 * Majority Vote: everyone secretly picks what they think most of the table will pick. One point for
 * being with the majority (two answers level both count).
 */
import { leaders, pick, seatsOf, shuffle } from '../lib.js?v=20261110-1402';
import { MAJORITY } from '../content.js?v=20261110-1402';

function open(s) { const [q, choices] = s.deck[s.at]; s.q = q; s.choices = choices; s.picks = seatsOf(s.n).map(() => null); s.reveal = false; }
function winnersOf(s) {
  const tally = s.choices.map(c => s.picks.filter(x => x === c).length);
  const most = Math.max(...tally);
  return s.choices.filter((_, i) => tally[i] === most);
}

export default {
  secret: true,
  init({ n, rng, opts }) {
    const s = { n, deck: shuffle(MAJORITY, rng).slice(0, Number(opts?.rounds) || 6), at: 0, scores: seatsOf(n).map(() => 0), done: false };
    open(s);
    return s;
  },
  active: (s) => (s.done ? [] : s.reveal ? [0] : seatsOf(s.n).filter(p => s.picks[p] == null)),
  moves: (s) => (s.reveal ? [{ next: 1 }] : s.choices.map(c => ({ c }))),
  apply(s, seat, m) {
    if (m.next) { s.at += 1; if (s.at >= s.deck.length) s.done = true; else open(s); return [{ k: 'deal', seat }]; }
    s.picks[seat] = m.c;
    const events = [];
    if (s.picks.every(Boolean)) {
      s.reveal = true;
      const won = winnersOf(s);
      seatsOf(s.n).forEach((p) => {
        const hit = won.includes(s.picks[p]);
        if (hit) s.scores[p] += 1;
        events.push({ k: hit ? 'bank' : 'laugh', seat: p });
      });
    }
    return events;
  },
  result: (s) => (s.done ? { scores: s.scores.slice(), winners: leaders(s.scores), note: 'One point each time you picked with the majority.' } : null),
  view(s) {
    return { n: s.n, at: s.at, total: s.deck.length, q: s.q, choices: s.choices, scores: s.scores, reveal: s.reveal, done: s.done,
      tally: s.reveal ? s.choices.map(c => s.picks.filter(x => x === c).length) : null, won: s.reveal ? winnersOf(s) : null };
  },
  // bots lean towards the first answers, like people do, which gives the table something to read
  bot(s, seat, rng, moves) { return rng() < 0.5 ? moves[0] : pick(moves, rng); },
  ui(v, ctx) {
    const lead = `Question ${v.at + 1} of ${v.total} · ${seatsOf(v.n).map(p => `${ctx.names[p]} ${v.scores[p]}`).join(' · ')}`;
    const mine = ctx.active.includes(ctx.me);
    if (v.reveal) {
      return {
        title: `Most picked: ${v.won.join(' and ')}`, prompt: v.q, lead,
        bars: v.choices.map((c, i) => ({ label: c, n: v.tally[i], of: v.n, win: v.won.includes(c) })),
        buttons: mine ? [{ label: 'Next question', i: 0, primary: true }] : [],
      };
    }
    return { title: mine ? 'What will most players pick?' : 'Waiting for votes…', prompt: v.q, lead, buttons: mine ? ctx.legal.map((m, i) => ({ label: m.c, i })) : [] };
  },
  chit: (v) => ({ text: v.q, label: `Question ${v.at + 1}` }),
};
