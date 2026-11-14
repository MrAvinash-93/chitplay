/**
 * Crazy Eights: match the top card by suit or rank, an eight is wild and names a new suit. No match?
 * Draw one; play it if you can, otherwise pass. First with an empty hand wins the round. The others
 * score their leftover cards against them, and the lowest penalty total after 3 rounds wins.
 *
 * House rules from the big family of these games (off by default):
 *  - twos:  a 2 makes the next player draw two, unless they pass it on with a 2 of their own
 *  - jacks: a jack skips the next player
 *  - aces:  an ace turns the direction round (with two players, you go again)
 */
import { best, seatsOf, shuffle, turnLine, strip, who } from '../lib.js?v=20261114-1435';
import { newPack, rankOf, sortHand, SUIT_ICON, SUIT_NAME, SUITS, suitOf, showCard } from '../cards.js?v=20261114-1435';

const ROUNDS = 3;
export const RULES = [
  ['twos', 'Twos pick up two', 'A 2 makes the next player draw two, unless they pass it on with a 2.'],
  ['jacks', 'Jacks skip', 'A jack skips the next player.'],
  ['aces', 'Aces turn round', 'An ace turns the direction round. With two players, you go again.'],
];
const rule = (s, k) => !!s.rules?.[k];
const nextOf = (s, from, k = 1) => ((from + (s.dir || 1) * k) % s.n + s.n * 4) % s.n;
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
  s.dir = 1;
  s.owe = 0;
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
  rounds: ROUNDS,   // shown at the top of the screen: Round 2/ROUNDS
  init({ n, rng, opts }) {
    const s = { n, rules: Object.fromEntries(RULES.map(([k]) => [k, !!opts?.rules?.[k]])), round: 1, pen: seatsOf(n).map(() => 0), done: false, between: false, summary: null };
    deal(s, rng);
    return s;
  },
  active: (s) => (s.done ? [] : s.between ? [0] : [s.p]),
  moves(s, seat) {
    if (s.between) return [{ next: 1 }];
    const list = [];
    // twos are coming: pass them on with a 2, or pick them up
    if (s.owe > 0) {
      s.hands[seat].forEach((c) => { if (rankOf(c) === '2') list.push({ c }); });
      list.push({ take: 1 });
      return list;
    }
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
    if (m.take) {
      const n = s.owe;
      for (let i = 0; i < n; i++) {
        if (!s.stock.length) { if (s.pile.length < 2) break; const top = s.pile.pop(); s.stock = shuffle(s.pile, rng); s.pile = [top]; }
        s.hands[seat].push(s.stock.pop());
      }
      s.owe = 0;
      s.passes = 0;
      s.p = nextOf(s, seat);
      return [{ k: 'draw', seat }, { k: 'stuck', seat, n }];
    }
    if (m.draw) {
      if (!s.stock.length) { const top = s.pile.pop(); s.stock = shuffle(s.pile, rng); s.pile = [top]; }
      s.hands[seat].push(s.stock.pop());
      s.drew = true;
      return [{ k: 'draw', seat }];
    }
    if (m.pass) {
      s.drew = false;
      s.passes += 1;
      s.p = nextOf(s, seat);
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
    s.p = nextOf(s, seat);
    const events = [{ k: 'card', seat }];
    if (!s.hands[seat].length) { events.push({ k: 'capture', seat }); endRound(s, seat); return events; }
    const r = rankOf(m.c);
    if (r === '2' && rule(s, 'twos')) { s.owe += 2; events.push({ k: 'point', seat, at: s.p }); }
    else if (r === 'J' && rule(s, 'jacks')) { events.push({ k: 'skip', seat, victim: s.p }); s.p = nextOf(s, seat, 2); }
    else if (r === 'A' && rule(s, 'aces')) {
      if (s.n === 2) s.p = seat;
      else { s.dir = -s.dir; s.p = nextOf(s, seat); }
      events.push({ k: 'skip', seat });
    }
    return events;
  },
  result(s) {
    if (!s.done) return null;
    const low = Math.min(...s.pen);
    return { scores: s.pen.slice(), winners: seatsOf(s.n).filter(p => s.pen[p] === low), lowWins: true, note: 'Lowest penalty points win.' };
  },
  view: (s, seat) => ({
    n: s.n, rules: s.rules, owe: s.owe, dir: s.dir, round: s.round, pen: s.pen, top: s.pile[s.pile.length - 1], by: s.by, suit: s.suit, p: s.p, drew: s.drew, between: s.between, summary: s.summary, done: s.done,
    stock: s.stock.length, counts: s.hands.map(h => h.length), hand: seat >= 0 ? sortHand(s.hands[seat]) : [],
  }),
  bot(s, seat, rng, moves) {
    if (moves[0].next) return moves[0];
    if (s.owe > 0) return moves.find(m => m.c) || moves.find(m => m.take);
    const hand = s.hands[seat];
    const count = (suit) => hand.filter(c => suitOf(c) === suit && rankOf(c) !== '8').length;
    const plays = moves.filter(m => m.c);
    if (plays.length) {
      return best(plays, (m) => {
        if (m.as) return count(m.as) - (hand.length > 2 ? 12 : 0);   // an eight is worth saving
        // the specials hurt most when the next player is nearly out
        const close = s.hands[nextOf(s, seat)].length <= 2;
        const r = rankOf(m.c);
        const special = (r === '2' && rule(s, 'twos')) || (r === 'J' && rule(s, 'jacks')) || (r === 'A' && rule(s, 'aces'));
        return handValue([m.c]) + count(suitOf(m.c)) + (special ? (close ? 30 : 3) : 0);
      }, rng);
    }
    return moves.find(m => m.draw) || moves[0];
  },
  ui(v, ctx) {
    const lead = `Round ${v.round} of ${ROUNDS} · suit ${SUIT_ICON[v.suit]} · eights are wild`;
    const players = strip(ctx, ['#d32f2f', '#2e7dd1', '#f2b705', '#2e9e4f'], p => `${v.counts[p]} 🂠 · ${v.pen[p]} pen${v.counts[p] === 1 ? ' ☝️' : ''}`);
    if (v.between) {
      return {
        title: `${who(ctx, v.summary.winner)} won the round`,
        players,
        lead: `Penalties: ${seatsOf(v.n).map(p => `${ctx.names[p]} ${v.pen[p]}`).join(' · ')}`,
        buttons: ctx.active.includes(ctx.me) ? [{ label: 'Next round', i: 0, primary: true }] : [],
      };
    }
    const buttons = ctx.legal.map((m, i) => {
      if (m.take) return { label: `Pick up ${v.owe}`, i, primary: true };
      if (m.draw) return { label: 'Draw a card', i };
      if (m.pass) return { label: 'Pass', i };
      if (m.as) return { label: `${showCard(m.c)} → ${SUIT_NAME[m.as]}`, i, card: m.c };
      return { label: showCard(m.c), i, card: m.c };
    });
    const owing = v.owe > 0 && ctx.active.includes(ctx.me);
    return { title: owing ? `Pick up ${v.owe}, or pass it on with a 2` : turnLine(ctx, 'play a matching card'), lead: `${v.owe > 0 ? `Twos: +${v.owe} · ` : ''}${v.dir < 0 ? '↺ · ' : ''}${lead}`, players, hand: v.hand, buttons, compact: true };
  },
};
