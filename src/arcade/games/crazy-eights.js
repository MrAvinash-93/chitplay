/**
 * Crazy Eights: match the top card by suit or rank, an eight is wild and names a new suit. No match?
 * Draw one; play it if you can, otherwise pass. First with an empty hand wins the round. The others
 * score their leftover cards against them, and the lowest penalty total after 3 rounds wins.
 */
import { best, seatsOf, shuffle, turnLine } from '../lib.js?v=20261110-1436';
import { newPack, rankOf, sortHand, SUIT_ICON, SUIT_NAME, SUITS, suitOf, showCard } from '../cards.js?v=20261110-1436';

const ROUNDS = 3;
const handValue = (hand) => hand.reduce((sum, c) => {
  const r = rankOf(c);
  return sum + (r === '8' ? 50 : 'JQK'.includes(r) ? 10 : r === 'A' ? 1 : Number(r));
}, 0);
function deal(s, rng) {
  const pack = newPack(rng);
  const size = s.n === 2 ? 7 : 5;
  s.hands = seatsOf(s.n).map(() => pack.splice(0, size));
  // the first card to start the pile is never an eight
  let i = pack.findIndex(c => rankOf(c) !== '8');
  s.pile = pack.splice(i, 1);
  s.stock = pack;
  s.suit = suitOf(s.pile[0]);
  s.drew = false;
  s.passes = 0;
  s.p = (s.round - 1) % s.n;
}
const fits = (s, c) => rankOf(c) === '8' || suitOf(c) === s.suit || rankOf(c) === rankOf(s.pile[s.pile.length - 1]);

function endRound(s, seat) {
  seatsOf(s.n).forEach((p) => { s.pen[p] += handValue(s.hands[p]); });
  s.summary = { winner: seat };
  if (s.round >= ROUNDS) s.done = true;
  else s.between = true;
}

export default {
  init({ n, rng }) {
    const s = { n, round: 1, pen: seatsOf(n).map(() => 0), done: false, between: false, summary: null };
    deal(s, rng);
    return s;
  },
  active: (s) => (s.done ? [] : s.between ? [0] : [s.p]),
  moves(s, seat) {
    if (s.between) return [{ next: 1 }];
    const list = [];
    s.hands[seat].forEach((c) => {
      if (!fits(s, c)) return;
      if (rankOf(c) === '8') SUITS.forEach(as => list.push({ c, as }));
      else list.push({ c });
    });
    if (!s.drew && (s.stock.length || s.pile.length > 1)) list.push({ draw: 1 });
    if (s.drew || !list.length) list.push({ pass: 1 });
    return list;
  },
  apply(s, seat, m, rng) {
    if (m.next) { s.round += 1; s.between = false; s.summary = null; deal(s, rng); return [{ k: 'deal', seat }]; }
    if (m.draw) {
      if (!s.stock.length) { const top = s.pile.pop(); s.stock = shuffle(s.pile, rng); s.pile = [top]; }
      s.hands[seat].push(s.stock.pop());
      s.drew = true;
      return [{ k: 'draw', seat }];
    }
    if (m.pass) {
      s.drew = false;
      s.passes += 1;
      s.p = (seat + 1) % s.n;
      // everyone stuck with nothing left to draw: the lowest hand takes the round
      if (s.passes >= s.n && !s.stock.length && s.pile.length <= 1) {
        const low = best(seatsOf(s.n), p => -handValue(s.hands[p]), rng);
        endRound(s, low);
      }
      return [{ k: 'pass', seat }];
    }
    s.hands[seat] = s.hands[seat].filter(c => c !== m.c);
    s.pile.push(m.c);
    s.by = seat;
    s.suit = m.as || suitOf(m.c);
    s.drew = false;
    s.passes = 0;
    s.p = (seat + 1) % s.n;
    const events = [{ k: 'card', seat }];
    if (!s.hands[seat].length) { events.push({ k: 'capture', seat }); endRound(s, seat); }
    return events;
  },
  result(s) {
    if (!s.done) return null;
    const low = Math.min(...s.pen);
    return { scores: s.pen.slice(), winners: seatsOf(s.n).filter(p => s.pen[p] === low), lowWins: true, note: 'Lowest penalty points win.' };
  },
  view: (s, seat) => ({
    n: s.n, round: s.round, pen: s.pen, top: s.pile[s.pile.length - 1], by: s.by, suit: s.suit, p: s.p, drew: s.drew, between: s.between, summary: s.summary, done: s.done,
    stock: s.stock.length, counts: s.hands.map(h => h.length), hand: seat >= 0 ? sortHand(s.hands[seat]) : [],
  }),
  bot(s, seat, rng, moves) {
    if (moves[0].next) return moves[0];
    const hand = s.hands[seat];
    const count = (suit) => hand.filter(c => suitOf(c) === suit && rankOf(c) !== '8').length;
    const plays = moves.filter(m => m.c);
    if (plays.length) {
      return best(plays, (m) => {
        if (m.as) return count(m.as) - (hand.length > 2 ? 12 : 0);   // an eight is worth saving
        return handValue([m.c]) + count(suitOf(m.c));
      }, rng);
    }
    return moves.find(m => m.draw) || moves[0];
  },
  ui(v, ctx) {
    const lead = `Round ${v.round} of ${ROUNDS} · suit ${SUIT_ICON[v.suit]} · ${seatsOf(v.n).map(p => `${ctx.names[p]} ${v.counts[p]}🂠`).join(' · ')}`;
    if (v.between) {
      return {
        title: `${ctx.names[v.summary.winner]} wins the round`,
        lead: `Penalties: ${seatsOf(v.n).map(p => `${ctx.names[p]} ${v.pen[p]}`).join(' · ')}`,
        buttons: ctx.active.includes(ctx.me) ? [{ label: 'Next round', i: 0, primary: true }] : [],
      };
    }
    const buttons = ctx.legal.map((m, i) => {
      if (m.draw) return { label: 'Draw a card', i };
      if (m.pass) return { label: 'Pass', i };
      if (m.as) return { label: `${showCard(m.c)} → ${SUIT_NAME[m.as]}`, i, card: m.c };
      return { label: showCard(m.c), i, card: m.c };
    });
    return { title: turnLine(ctx, 'play a matching card'), lead, hand: v.hand, buttons, compact: true };
  },
};
