/**
 * Call Break, the South Asian trick-taking game, for exactly four. Spades are always trumps. Each
 * player calls how many tricks they'll win. You must follow suit and beat the best card if you can;
 * with none of the suit you must trump (and over-trump if you can). Make your call: score the call,
 * plus 0.1 per extra trick. Miss it: lose the call. Five rounds. Points have no value.
 */
import { best, turnLine, seatsOf } from '../lib.js?v=20261110-1415';
import { newPack, power, rankOf, sortHand, showCard, suitOf } from '../cards.js?v=20261110-1415';

const ROUNDS = 5;
const TRUMP = 'S';
const round1 = (x) => Math.round(x * 10) / 10;
function deal(s, rng) {
  const pack = newPack(rng);
  s.hands = seatsOf(4).map(i => pack.slice(i * 13, i * 13 + 13));
  s.bids = [null, null, null, null];
  s.won = [0, 0, 0, 0];
  s.trick = [];
  s.lastTrick = null;
  s.p = (s.round - 1) % 4;
  s.phase = 'bid';
}
const beats = (a, b, lead) => {
  const sa = suitOf(a), sb = suitOf(b);
  if (sa === sb) return power(a) > power(b);
  if (sa === TRUMP) return true;
  if (sb === TRUMP) return false;
  return sa === lead && sb !== lead;
};
const winnerCard = (trick) => {
  const lead = suitOf(trick[0].c);
  return trick.reduce((top, t) => (beats(t.c, top.c, lead) ? t : top));
};
function playable(s, seat) {
  const hand = s.hands[seat];
  if (!s.trick.length) return hand;
  const lead = suitOf(s.trick[0].c);
  const top = winnerCard(s.trick).c;
  const follow = hand.filter(c => suitOf(c) === lead);
  if (follow.length) {
    const higher = suitOf(top) === lead ? follow.filter(c => power(c) > power(top)) : [];
    return higher.length ? higher : follow;
  }
  const trumps = hand.filter(c => suitOf(c) === TRUMP);
  if (trumps.length) {
    const over = suitOf(top) === TRUMP ? trumps.filter(c => power(c) > power(top)) : trumps;
    return over.length ? over : hand;
  }
  return hand;
}
const handStrength = (hand) => {
  let v = 0;
  hand.forEach((c) => {
    const r = rankOf(c);
    if (r === 'A') v += 1;
    else if (r === 'K') v += suitOf(c) === TRUMP ? 1 : 0.7;
    else if (r === 'Q' && suitOf(c) === TRUMP) v += 0.7;
    else if (suitOf(c) === TRUMP) v += 0.35;
  });
  return Math.max(1, Math.min(8, Math.round(v)));
};

export default {
  init({ rng }) {
    const s = { round: 1, scores: [0, 0, 0, 0], done: false, between: false };
    deal(s, rng);
    return s;
  },
  active: (s) => (s.done ? [] : s.between ? [0] : [s.p]),
  moves(s, seat) {
    if (s.between) return [{ next: 1 }];
    if (s.phase === 'bid') return [1, 2, 3, 4, 5, 6, 7, 8].map(bid => ({ bid }));
    return playable(s, seat).map(c => ({ c }));
  },
  apply(s, seat, m, rng) {
    if (m.next) { s.round += 1; s.between = false; deal(s, rng); return [{ k: 'deal', seat }]; }
    if (m.bid) {
      s.bids[seat] = m.bid;
      s.p = (seat + 1) % 4;
      if (s.bids.every(b => b != null)) s.phase = 'play';
      return [{ k: 'bid', seat, n: m.bid }];
    }
    s.hands[seat] = s.hands[seat].filter(c => c !== m.c);
    s.trick.push({ seat, c: m.c });
    const events = [{ k: 'card', seat }];
    if (s.trick.length < 4) { s.p = (seat + 1) % 4; return events; }
    const w = winnerCard(s.trick).seat;
    s.won[w] += 1;
    s.lastTrick = { cards: s.trick, w };
    s.trick = [];
    s.p = w;
    events.push({ k: 'trick', seat: w });
    if (!s.hands[w].length) {
      seatsOf(4).forEach((p) => {
        const got = s.won[p], bid = s.bids[p];
        s.scores[p] = round1(s.scores[p] + (got >= bid ? bid + (got - bid) * 0.1 : -bid));
      });
      if (s.round >= ROUNDS) s.done = true; else s.between = true;
    }
    return events;
  },
  result(s) {
    if (!s.done) return null;
    const top = Math.max(...s.scores);
    return { scores: s.scores.slice(), winners: seatsOf(4).filter(p => s.scores[p] === top) };
  },
  view: (s, seat) => ({
    round: s.round, scores: s.scores, bids: s.bids, won: s.won, trick: s.trick, lastTrick: s.lastTrick, p: s.p, phase: s.phase, between: s.between, done: s.done,
    counts: s.hands.map(h => h.length), hand: seat >= 0 ? sortHand(s.hands[seat]) : [],
  }),
  bot(s, seat, rng, moves) {
    if (moves[0].next) return moves[0];
    if (moves[0].bid) return { bid: handStrength(s.hands[seat]) };
    if (!s.trick.length) {
      // lead the top card if it's likely to win, otherwise something low
      return best(moves, m => (rankOf(m.c) === 'A' ? 20 : -power(m.c)) + (suitOf(m.c) === TRUMP ? -6 : 0), rng);
    }
    const top = winnerCard(s.trick).c;
    const lead = suitOf(s.trick[0].c);
    const wins = moves.filter(m => beats(m.c, top, lead));
    // win as cheaply as possible; if you can't, throw the lowest
    if (wins.length) return best(wins, m => -power(m.c), rng);
    return best(moves, m => -power(m.c) - (suitOf(m.c) === TRUMP ? 20 : 0), rng);
  },
  ui(v, ctx) {
    const line = seatsOf(4).map(p => `${ctx.names[p]} ${v.won[p]}/${v.bids[p] ?? '?'}`).join(' · ');
    if (v.between) {
      return { title: `Round ${v.round} done`, lead: `Scores: ${seatsOf(4).map(p => `${ctx.names[p]} ${v.scores[p]}`).join(' · ')}`, buttons: ctx.active.includes(ctx.me) ? [{ label: 'Next round', i: 0, primary: true }] : [] };
    }
    const bidding = v.phase === 'bid';
    const buttons = ctx.legal.map((m, i) => (m.bid ? { label: String(m.bid), i } : { label: showCard(m.c), i, card: m.c }));
    return { title: turnLine(ctx, bidding ? 'call your tricks' : 'play a card'), lead: `Round ${v.round} of ${ROUNDS} · ${line}`, hand: v.hand, buttons, compact: true };
  },
};
