/**
 * Riddle Chits: a riddle on a chit, four answers to pick from, everyone answers in secret. Right
 * scores 2, or 1 if you took the hint. Then the answer is shown and the next chit opens.
 */
import { leaders, seatsOf, shuffle, turnLine, strip } from '../lib.js?v=20261114-1538';
import { RIDDLES } from '../content.js?v=20261114-1538';

function open(s, rng) {
  const [q, answer, hint] = s.deck[s.at];
  const decoys = shuffle(RIDDLES.filter(r => r[1] !== answer), rng).slice(0, 3).map(r => r[1]);
  s.q = q; s.answer = answer; s.hintText = hint;
  s.options = shuffle([answer, ...decoys], rng);
  s.picks = seatsOf(s.n).map(() => null);
  s.hinted = seatsOf(s.n).map(() => false);
  s.reveal = false;
}

export default {
  secret: true,
  init({ n, rng, opts }) {
    const s = { n, deck: shuffle(RIDDLES, rng).slice(0, Number(opts?.rounds) || 8), at: 0, scores: seatsOf(n).map(() => 0), done: false };
    open(s, rng);
    return s;
  },
  active: (s) => (s.done ? [] : s.reveal ? [0] : seatsOf(s.n).filter(p => s.picks[p] == null)),
  moves(s, seat) {
    if (s.reveal) return [{ next: 1 }];
    const list = s.options.map(a => ({ a }));
    if (!s.hinted[seat]) list.push({ hint: 1 });
    return list;
  },
  apply(s, seat, m, rng) {
    if (m.hint) { s.hinted[seat] = true; return []; }
    if (m.next) {
      s.at += 1;
      if (s.at >= s.deck.length) s.done = true; else open(s, rng);
      return [{ k: 'deal', seat }];
    }
    s.picks[seat] = m.a;
    const events = [];
    if (s.picks.every(Boolean)) {
      s.reveal = true;
      seatsOf(s.n).forEach((p) => {
        if (s.picks[p] === s.answer) { s.scores[p] += s.hinted[p] ? 1 : 2; events.push({ k: 'bank', seat: p }); } else events.push({ k: 'laugh', seat: p });
      });
    }
    return events;
  },
  result: (s) => (s.done ? { scores: s.scores.slice(), winners: leaders(s.scores), note: 'Two points for a right answer, one with a hint.' } : null),
  view(s, seat) {
    return {
      n: s.n, at: s.at, total: s.deck.length, q: s.q, options: s.options, scores: s.scores, reveal: s.reveal, done: s.done,
      answer: s.reveal ? s.answer : null, picks: s.reveal ? s.picks : null, answered: s.picks?.map(Boolean),
      hint: seat >= 0 && s.hinted[seat] ? s.hintText : '',
    };
  },
  bot(s, seat, rng, moves) {
    if (moves[0].next) return moves[0];
    return { a: rng() < 0.55 ? s.answer : s.options[Math.floor(rng() * s.options.length)] };
  },
  ui(v, ctx) {
    const lead = `Riddle ${v.at + 1} of ${v.total}${v.n <= 6 ? ' · 2 points, or 1 with a hint' : ` · ${seatsOf(v.n).map(p => `${ctx.names[p]} ${v.scores[p]}`).join(' · ')}`}`;
    const mine = ctx.active.includes(ctx.me);
    // who has answered: a tick, never the answer itself until the reveal
    const players = (v.n <= 6 ? strip(ctx, ['#d32f2f', '#2e7dd1', '#f2b705', '#2e9e4f', '#8e44ad', '#e67e22'], p => `${v.scores[p]} pts${v.reveal ? (v.picks[p] === v.answer ? ' · ✅' : ' · ❌') : ctx.active.includes(p) ? ' · …' : ' · ✓'}`) : undefined);
    if (v.reveal) {
      return {
        title: `Answer: ${v.answer}`, prompt: v.q, lead, players,
        list: seatsOf(v.n).map(p => `${ctx.names[p]}: ${v.picks[p]} ${v.picks[p] === v.answer ? '✅' : '❌'}`),
        buttons: mine ? [{ label: 'Next riddle', i: 0, primary: true }] : [],
      };
    }
    return {
      title: mine ? 'Pick the answer' : 'Waiting for answers…', prompt: v.q, lead, players, hint: v.hint,
      buttons: mine ? ctx.legal.map((m, i) => (m.hint ? { label: 'Show a hint (−1 point)', i } : { label: m.a, i })) : [],
    };
  },
  chit: (v) => ({ text: v.q, label: v.reveal ? `Answer: ${v.answer}` : `Riddle ${v.at + 1}` }),
};
