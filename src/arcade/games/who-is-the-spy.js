/**
 * Who Is the Spy: everyone has the same secret word except the spy, who has a similar one and
 * doesn't know it. Round the table each player plays a clue card for their word, then everyone
 * votes. Catch the spy and they get one guess at the real word. Works with bots and strangers,
 * because clues are cards rather than speech.
 */
import { best, leaders, pick, seatsOf, shuffle, turnLine } from '../lib.js?v=20261110-1142';
import { SPY_PAIRS, CLUES } from '../content.js?v=20261110-1142';

const ROUNDS = 3;
const cluesFor = (word) => CLUES[word] || [];
function deal(s, rng) {
  const unused = SPY_PAIRS.filter(p => !s.used.includes(p[0]));
  const pair = pick(unused.length ? unused : SPY_PAIRS, rng);
  s.used.push(pair[0]);
  const [common, odd] = rng() < 0.5 ? pair : [pair[1], pair[0]];
  const spyCount = s.n >= 8 ? 2 : 1;
  const spies = shuffle(seatsOf(s.n), rng).slice(0, spyCount);
  s.common = common;
  s.odd = odd;
  s.spies = spies;
  s.words = seatsOf(s.n).map(p => (spies.includes(p) ? odd : common));
  s.hands = s.words.map(w => shuffle(cluesFor(w), rng).slice(0, 3));
  s.seenWord = seatsOf(s.n).map(() => false);
  s.phase = 'read';
  s.clues = seatsOf(s.n).map(() => null);
  s.votes = seatsOf(s.n).map(() => null);
  s.p = (s.round - 1) % s.n;
  s.caught = -1;
  s.options = null;
  s.outcome = '';
  s.accused = null;
}
const pendingVotes = (s) => seatsOf(s.n).filter(p => s.votes[p] == null);

export default {
  secret: true,
  init({ n, rng }) {
    const s = { n, round: 1, used: [], scores: seatsOf(n).map(() => 0), done: false };
    deal(s, rng);
    return s;
  },
  active(s) {
    if (s.done) return [];
    if (s.phase === 'read') return seatsOf(s.n).filter(p => !s.seenWord[p]);
    if (s.phase === 'clue') return [s.p];
    if (s.phase === 'vote') return pendingVotes(s);
    if (s.phase === 'guess') return [s.caught];
    return [0];                  // the summary: the host moves on
  },
  moves(s, seat) {
    if (s.phase === 'read') return [{ ok: 1 }];
    if (s.phase === 'clue') return s.hands[seat].map(clue => ({ clue }));
    if (s.phase === 'vote') return seatsOf(s.n).filter(p => p !== seat).map(vote => ({ vote }));
    if (s.phase === 'guess') return s.options.map(guess => ({ guess }));
    return [{ next: 1 }];
  },
  apply(s, seat, m, rng) {
    if (m.ok) {
      s.seenWord[seat] = true;
      if (s.seenWord.every(Boolean)) s.phase = 'clue';
      return [];
    }
    if (m.clue) {
      s.clues[seat] = m.clue;
      const events = [{ k: 'say', seat, text: m.clue }];
      s.p = (seat + 1) % s.n;
      if (s.clues.every(Boolean)) s.phase = 'vote';
      return events;
    }
    if (m.vote != null) {
      s.votes[seat] = m.vote;
      const events = [{ k: 'point', seat, at: m.vote }];
      if (!pendingVotes(s).length) {
        const tally = seatsOf(s.n).map(p => s.votes.filter(v => v === p).length);
        const top = leaders(tally);
        const accused = top.length === 1 ? top[0] : -1;
        if (accused >= 0 && s.spies.includes(accused)) {
          s.caught = accused;
          s.phase = 'guess';
          const decoys = shuffle(SPY_PAIRS.flat().filter(w => w !== s.common && w !== s.odd), rng).slice(0, 3);
          s.options = shuffle([s.common, ...decoys], rng);
          events.push({ k: 'capture', seat: accused });
        } else {
          s.spies.forEach((p) => { s.scores[p] += 3; });
          s.accused = accused;
          s.outcome = 'The spy scores 3.';
          s.phase = 'summary';
          events.push({ k: 'escape', seat: s.spies[0] });
        }
      }
      return events;
    }
    if (m.guess) {
      if (m.guess === s.common) {
        s.spies.forEach((p) => { s.scores[p] += 2; });
        s.outcome = 'The spy guessed the word: 2 points to the spy.';
      } else {
        seatsOf(s.n).forEach((p) => { if (!s.spies.includes(p)) s.scores[p] += 1; });
        s.outcome = 'Wrong guess: 1 point to everyone else.';
      }
      s.phase = 'summary';
      return [];
    }
    if (s.round >= ROUNDS) { s.done = true; return []; }
    s.round += 1;
    deal(s, rng);
    return [{ k: 'deal', seat }];
  },
  result: (s) => (s.done ? { scores: s.scores.slice(), winners: leaders(s.scores) } : null),
  view(s, seat) {
    const summary = s.phase === 'summary';
    return {
      n: s.n, round: s.round, phase: s.phase, p: s.p, clues: s.clues, scores: s.scores, caught: s.caught, options: s.phase === 'guess' ? s.options : null, outcome: s.outcome, accused: s.accused, done: s.done,
      voted: s.votes.map(v => v != null), votes: summary || s.phase === 'guess' ? s.votes : null,
      word: seat >= 0 ? s.words[seat] : '', reveal: summary ? { common: s.common, odd: s.odd, spies: s.spies } : null,
    };
  },
  // the chit on the mat shows only what the whole table may read, never a word
  chit: (v) => ({ text: v.phase === 'summary' ? `The word was ${v.reveal.common}` : 'Who is the spy?', label: `Round ${v.round}` }),
  bot(s, seat, rng, moves) {
    if (moves[0].ok || moves[0].next) return moves[0];
    if (moves[0].clue) return pick(moves, rng);
    if (moves[0].guess) {
      // what the others' clues point to: the word sharing the most clues with the table
      const said = s.clues.filter(Boolean);
      return best(moves, m => cluesFor(m.guess).filter(c => said.includes(c)).length * 3 + rng(), rng);
    }
    // votes for whoever played a clue that doesn't belong to this bot's word
    const mine = cluesFor(s.words[seat]);
    return best(moves, m => (mine.includes(s.clues[m.vote]) ? 0 : 2) + rng(), rng);
  },
  ui(v, ctx) {
    const mine = ctx.active.includes(ctx.me);
    const lead = `Round ${v.round} of ${ROUNDS} · ${seatsOf(v.n).map(p => `${ctx.names[p]} ${v.scores[p]}`).join(' · ')}`;
    const said = seatsOf(v.n).filter(p => v.clues[p]).map(p => `${ctx.names[p]}: “${v.clues[p]}”`);
    if (v.phase === 'read') {
      return { title: mine ? 'Your secret word' : 'Reading the secret words…', big: mine ? v.word : '', lead: mine ? 'Remember it. You might be the spy without knowing!' : `Waiting for: ${ctx.active.map(p => ctx.names[p]).join(', ')}`, buttons: mine ? [{ label: 'Got it', i: 0, primary: true }] : [] };
    }
    if (v.phase === 'clue') {
      return { title: turnLine(ctx, 'play a clue for your word'), lead: mine ? `Your word: ${v.word}` : lead, list: said, buttons: mine ? ctx.legal.map((m, i) => ({ label: m.clue, i })) : [] };
    }
    if (v.phase === 'vote') {
      return { title: mine ? 'Who is the spy?' : 'Waiting for votes…', lead: mine ? `Your word: ${v.word}` : `Waiting for: ${ctx.active.map(p => ctx.names[p]).join(', ')}`, list: said, buttons: mine ? ctx.legal.map((m, i) => ({ label: ctx.names[m.vote], i })) : [] };
    }
    if (v.phase === 'guess') {
      return { title: `Caught! ${ctx.names[v.caught]} was the spy.`, lead: mine ? 'One last chance: what was everyone else’s word?' : `${ctx.names[v.caught]} gets one guess at the word.`, buttons: mine ? ctx.legal.map((m, i) => ({ label: m.guess, i })) : [] };
    }
    const verdict = v.accused == null ? '' : v.accused < 0 ? 'The vote was tied, so the spy got away. ' : `${ctx.names[v.accused]} wasn’t the spy. `;
    const outcome = verdict + v.outcome;
    return {
      title: `The spy was ${v.reveal.spies.map(p => ctx.names[p]).join(' and ')}`,
      lead: `${outcome} The word was “${v.reveal.common}”; the spy had “${v.reveal.odd}”.`,
      list: [lead],
      buttons: mine ? [{ label: 'Next', i: 0, primary: true }] : [],
    };
  },
};
