/**
 * Color Clash: a colour-matching card game for 2 to 4, with our own deck. Play a card that matches
 * the colour or the number of the top card. Skip, Turn Around and +2 cards change the turn; a
 * Rainbow card can go on anything and picks the colour; Rainbow +4 does the same and the next
 * player draws four. First to empty their hand wins the round and scores the cards left in the
 * other hands. First to 150 points, or the best after five rounds, wins.
 *
 * A card is a string: colour letter + value. Colours R G B Y; values 0–9, S (skip), T (turn
 * around), D (draw two). Rainbows are 'W' and 'W4'.
 */
import { best, seatsOf, shuffle, turnLine } from '../lib.js?v=20261110-1207';

export const COLOURS = ['R', 'G', 'B', 'Y'];
export const COLOUR_NAME = { R: 'Red', G: 'Green', B: 'Blue', Y: 'Yellow' };
const TARGET = 150, MAX_ROUNDS = 5;
export const valueOf = (c) => (c[0] === 'W' ? c : c.slice(1));
export const colourOf = (c) => (c[0] === 'W' ? null : c[0]);
export const label = (c) => ({ S: '⊘', T: '⇄', D: '+2', W: 'Rainbow', W4: '+4' }[valueOf(c)] ?? valueOf(c));
const points = (c) => (c[0] === 'W' ? 50 : /\d/.test(valueOf(c)) ? Number(valueOf(c)) : 20);
const handPoints = (h) => h.reduce((t, c) => t + points(c), 0);
function newDeck(rng) {
  const d = [];
  COLOURS.forEach((k) => {
    d.push(`${k}0`);
    for (let n = 1; n <= 9; n++) d.push(`${k}${n}`, `${k}${n}`);
    ['S', 'T', 'D'].forEach(v => d.push(`${k}${v}`, `${k}${v}`));
  });
  for (let i = 0; i < 4; i++) d.push('W', 'W4');
  return shuffle(d, rng);
}
function deal(s, rng) {
  const deck = newDeck(rng);
  s.hands = seatsOf(s.n).map(() => deck.splice(0, 7));
  // the first card is a plain number
  const i = deck.findIndex(c => /^[RGBY]\d$/.test(c));
  s.pile = deck.splice(i, 1);
  s.stock = deck;
  s.colour = colourOf(s.pile[0]);
  s.dir = 1;
  s.p = (s.round - 1) % s.n;
  s.drew = false;
  s.by = null;
}
const next = (s, from, steps = 1) => ((from + s.dir * steps) % s.n + s.n * 4) % s.n;
const fits = (s, c) => c[0] === 'W' || colourOf(c) === s.colour || valueOf(c) === valueOf(s.pile[s.pile.length - 1]);
function draw(s, seat, k, rng) {
  for (let i = 0; i < k; i++) {
    if (!s.stock.length) {
      if (s.pile.length < 2) return;
      const top = s.pile.pop();
      s.stock = shuffle(s.pile, rng);
      s.pile = [top];
    }
    s.hands[seat].push(s.stock.pop());
  }
}

export default {
  init({ n, rng }) {
    const s = { n, round: 1, pts: seatsOf(n).map(() => 0), done: false, between: false, summary: null };
    deal(s, rng);
    return s;
  },
  active: (s) => (s.done ? [] : s.between ? [0] : [s.p]),
  moves(s, seat) {
    if (s.between) return [{ next: 1 }];
    const list = [];
    new Set(s.hands[seat]).forEach((c) => {
      if (!fits(s, c)) return;
      if (c[0] === 'W') COLOURS.forEach(as => list.push({ c, as }));
      else list.push({ c });
    });
    if (!s.drew) list.push({ draw: 1 });
    else list.push({ pass: 1 });
    return list;
  },
  apply(s, seat, m, rng) {
    if (m.next) { s.round += 1; s.between = false; s.summary = null; deal(s, rng); return [{ k: 'deal', seat }]; }
    if (m.draw) { draw(s, seat, 1, rng); s.drew = true; return [{ k: 'draw', seat }]; }
    if (m.pass) { s.drew = false; s.p = next(s, seat); return [{ k: 'pass', seat }]; }
    const h = s.hands[seat];
    h.splice(h.indexOf(m.c), 1);
    s.pile.push(m.c);
    s.by = seat;
    s.colour = m.as || colourOf(m.c);
    s.drew = false;
    const v = valueOf(m.c);
    const events = [{ k: 'card', seat }];
    if (!h.length) {
      const won = seatsOf(s.n).reduce((t, p) => t + (p === seat ? 0 : handPoints(s.hands[p])), 0);
      s.pts[seat] += won;
      s.summary = { winner: seat, won };
      events.push({ k: 'capture', seat });
      if (s.pts[seat] >= TARGET || s.round >= MAX_ROUNDS) s.done = true; else s.between = true;
      return events;
    }
    if (h.length === 1) events.push({ k: 'last', seat });
    if (v === 'T') s.dir = -s.dir;
    if (v === 'S' || (v === 'T' && s.n === 2)) { s.p = next(s, seat, 2); events.push({ k: 'skip', seat, victim: next(s, seat) }); return events; }
    if (v === 'D' || v === 'W4') {
      const victim = next(s, seat);
      draw(s, victim, v === 'D' ? 2 : 4, rng);
      s.p = next(s, seat, 2);
      events.push({ k: 'capture', seat, victim });
      return events;
    }
    s.p = next(s, seat);
    return events;
  },
  result(s) {
    if (!s.done) return null;
    const top = Math.max(...s.pts);
    return { scores: s.pts.slice(), winners: seatsOf(s.n).filter(p => s.pts[p] === top), note: 'Points are the cards left in the other players’ hands.' };
  },
  view: (s, seat) => ({
    n: s.n, round: s.round, pts: s.pts, top: s.pile[s.pile.length - 1], colour: s.colour, dir: s.dir, p: s.p, drew: s.drew, by: s.by,
    between: s.between, summary: s.summary, done: s.done, stock: s.stock.length, counts: s.hands.map(x => x.length), hand: seat >= 0 ? s.hands[seat].slice().sort() : [],
  }),
  // plays a matching colour first, saves rainbows, and hits the next player when they're close to winning
  bot(s, seat, rng, moves) {
    if (moves[0].next) return moves[0];
    const hand = s.hands[seat];
    const count = (k) => hand.filter(c => colourOf(c) === k).length;
    const danger = s.hands[next(s, seat)].length <= 2;
    const plays = moves.filter(m => m.c);
    if (!plays.length) return moves.find(m => m.draw) || moves.find(m => m.pass);
    return best(plays, (m) => {
      const v = valueOf(m.c);
      let score = points(m.c) * 0.1;
      if (m.c[0] === 'W') score = (hand.length <= 2 || danger ? 30 : -20) + count(m.as) * 3;
      else if (['S', 'T', 'D'].includes(v)) score += danger ? 25 : 4;
      if (colourOf(m.c) === s.colour) score += 2;
      return score + rng();
    }, rng);
  },
  ui(v, ctx) {
    const mine = ctx.active.includes(ctx.me);
    const line = seatsOf(v.n).map(p => `${ctx.names[p]} ${v.counts[p]}🂠 · ${v.pts[p]}`).join(' · ');
    if (v.between) {
      return { title: `${ctx.names[v.summary.winner]} wins round ${v.round} (+${v.summary.won})`, lead: line, buttons: mine ? [{ label: 'Next round', i: 0, primary: true }] : [] };
    }
    const tint = (c) => (c[0] === 'W' ? 'w' : c[0].toLowerCase());
    const buttons = [];
    const playable = new Set();
    ctx.legal.forEach((m, i) => {
      if (m.draw) buttons.push({ label: 'Draw a card', i });
      else if (m.pass) buttons.push({ label: 'Pass', i });
      else if (m.as) { buttons.push({ label: `${label(m.c)} → ${COLOUR_NAME[m.as]}`, i, card: m.c, tint: m.as.toLowerCase() }); playable.add(m.c); }
      else { buttons.push({ label: label(m.c), i, card: m.c, tint: tint(m.c) }); playable.add(m.c); }
    });
    return {
      title: turnLine(ctx, 'match the colour or the number'),
      lead: `Colour: ${COLOUR_NAME[v.colour]} · Round ${v.round} of ${MAX_ROUNDS} · first to ${TARGET} · ${line}`,
      buttons, compact: true,
      tiles: v.hand.filter(c => !playable.has(c)).map(c => ({ label: label(c), tint: tint(c) })),
    };
  },
};
