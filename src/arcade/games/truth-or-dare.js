/**
 * Truth or Dare: friendly prompts only. Choose, then do it (or skip, no penalty). A computer player
 * answers with a little act in the room. Nothing is typed, so nothing personal can be shared with
 * strangers on an online table.
 */
import { leaders, pick, seatsOf, shuffle, turnLine, strip } from '../lib.js?v=20261114-1604';
import { DARES, TRUTHS } from '../content.js?v=20261114-1604';

export default {
  init: ({ n, rng, opts }) => ({ n, turn: 0, total: n * (Number(opts?.turns) || 3), scores: seatsOf(n).map(() => 0), bags: { truth: shuffle(TRUTHS, rng), dare: shuffle(DARES, rng) }, kind: null, text: '', done: false }),
  active: (s) => (s.done ? [] : [s.turn % s.n]),
  moves: (s) => (s.kind ? [{ done: 1 }, { skip: 1 }] : [{ pick: 'truth' }, { pick: 'dare' }]),
  apply(s, seat, m, rng) {
    if (m.pick) {
      if (!s.bags[m.pick].length) s.bags[m.pick] = shuffle(m.pick === 'truth' ? TRUTHS : DARES, rng);
      s.kind = m.pick;
      s.text = s.bags[m.pick].pop();
      return [{ k: 'prompt', seat, kind: m.pick }];
    }
    if (m.done) s.scores[seat] += 1;
    s.kind = null;
    s.text = '';
    s.turn += 1;
    s.done = s.turn >= s.total;
    return [{ k: m.done ? 'bank' : 'laugh', seat }];
  },
  result: (s) => (s.done ? { scores: s.scores.slice(), winners: leaders(s.scores), note: 'One point for every truth told and every dare done.' } : null),
  // the prompt bags are only the host's business
  view: (s) => ({ n: s.n, turn: s.turn, total: s.total, scores: s.scores, kind: s.kind, text: s.text, done: s.done }),
  bot(s, seat, rng, moves) {
    if (moves[0].pick) return pick(moves, rng);
    return rng() < 0.85 ? { done: 1 } : { skip: 1 };
  },
  ui(v, ctx) {
    const mine = ctx.active.includes(ctx.me);
    const who = ctx.names[ctx.active[0]] || '';
    const lead = `Turn ${Math.min(v.turn + 1, v.total)} of ${v.total}${v.n <= 6 ? ' · every prompt can be skipped' : ` · ${seatsOf(v.n).map(p => `${ctx.names[p]} ${v.scores[p]}`).join(' · ')}`}`;
    const players = (v.n <= 6 ? strip(ctx, ['#d32f2f', '#2e7dd1', '#f2b705', '#2e9e4f', '#8e44ad', '#e67e22'], p => `${v.scores[p]} ⭐`) : undefined);
    if (!v.kind) return { title: mine ? 'Your turn: truth or dare?' : `${who}: truth or dare?`, lead, players, buttons: mine ? [{ label: 'Truth', i: 0, primary: true }, { label: 'Dare', i: 1, primary: true }] : [] };
    return {
      title: `${mine ? 'You' : who} · ${v.kind === 'truth' ? 'Truth' : 'Dare'}`,
      prompt: v.text,
      lead,
      players,
      buttons: mine ? [{ label: v.kind === 'truth' ? 'Answered (+1)' : 'Done (+1)', i: 0, primary: true }, { label: 'Skip, no worries', i: 1 }] : [],
    };
  },
  chit: (v) => (v.kind ? { text: v.text, label: v.kind === 'truth' ? 'TRUTH' : 'DARE' } : null),
};
