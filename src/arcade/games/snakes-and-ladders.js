/**
 * Snakes and Ladders, 2 to 4 players, on our own 100-square board. A six rolls again. Square 100
 * needs the exact number: too high and the token stays put.
 *
 * House rules, each chosen before the game (all off by default), the ones most families play by:
 *  - six:    a token needs a 6 to come onto the board
 *  - bounce: a roll past 100 bounces back by the squares left over, instead of staying put
 *  - three:  three sixes in a row send the token back to where that turn began, and the turn ends
 */
import { roll, seatsOf, turnLine, strip, who } from '../lib.js?v=20261114-1146';

export const LADDERS = { 3: 22, 9: 31, 20: 41, 28: 76, 36: 57, 51: 67, 63: 81, 71: 92 };
export const SNAKES = { 26: 7, 39: 18, 47: 25, 58: 40, 66: 44, 83: 61, 89: 68, 95: 74, 98: 79 };
export const RULES = [
  ['six', 'Start with a 6', 'A token needs a 6 to come onto the board.'],
  ['bounce', 'Bounce back', 'Roll past 100 and you bounce back by the squares left over.'],
  ['three', 'Three sixes', 'Three sixes in a row send you back to where your turn began.'],
];
const rule = (s, k) => !!s.rules?.[k];

export default {
  init: ({ n, opts }) => ({
    n, at: seatsOf(n).map(() => 0), p: 0, shown: 1, rollId: 0, won: -1,
    rules: Object.fromEntries(RULES.map(([k]) => [k, !!opts?.rules?.[k]])), sixes: 0, from: 0, note: null,
    climbed: seatsOf(n).map(() => 0), bitten: seatsOf(n).map(() => 0),
  }),
  active: (s) => (s.won >= 0 ? [] : [s.p]),
  moves: () => [{ roll: 1 }],
  apply(s, seat, _m, rng) {
    const die = roll(rng);
    s.shown = die;
    s.rollId += 1;
    s.note = null;
    if (!s.sixes) s.from = s.at[seat];
    s.sixes = die === 6 ? s.sixes + 1 : 0;
    const pass = () => { s.sixes = 0; s.p = (seat + 1) % s.n; };
    // three sixes: back to where this turn began
    if (rule(s, 'three') && s.sixes === 3) {
      s.at[seat] = s.from;
      s.note = { seat, kind: 'three' };
      pass();
      return [{ k: 'roll', seat, n: die, steps: 0 }, { k: 'forfeit', seat }];
    }
    // still off the board: only a six brings the token on, to square 1
    if (rule(s, 'six') && s.at[seat] === 0) {
      if (die !== 6) { s.note = { seat, kind: 'wait' }; pass(); return [{ k: 'roll', seat, n: die, steps: 0 }]; }
      s.at[seat] = 1;
      s.note = { seat, kind: 'on' };
      return [{ k: 'roll', seat, n: die, steps: 1 }];
    }
    let to = s.at[seat] + die;
    if (to > 100 && rule(s, 'bounce')) { to = 200 - to; s.note = { seat, kind: 'bounce' }; }
    const events = [{ k: 'roll', seat, n: die, steps: to <= 100 ? die : 0 }];
    if (to <= 100) {
      s.at[seat] = to;
      if (LADDERS[to]) { s.at[seat] = LADDERS[to]; if (s.climbed) s.climbed[seat] += 1; events.push({ k: 'ladder', seat }); }
      else if (SNAKES[to]) { s.at[seat] = SNAKES[to]; if (s.bitten) s.bitten[seat] += 1; events.push({ k: 'snake', seat }); }
    } else s.note = { seat, kind: 'over' };
    if (s.at[seat] === 100) { s.won = seat; return events; }
    if (die !== 6) pass();
    return events;
  },
  result: (s) => (s.won < 0 ? null : { scores: s.at.slice(), winners: [s.won], note: 'Scores are the squares reached.' }),
  bot: (s, seat, rng, moves) => moves[0],
  ui(v, ctx) {
    const nameOf = (p) => (p === ctx.me && !ctx.pass ? 'You' : ctx.names[p]);
    const n = v.note;
    const says = !n ? '' : n.kind === 'three' ? `${nameOf(n.seat)} rolled three sixes: back to ${v.at[n.seat] || 'the start'}.`
      : n.kind === 'wait' ? `${nameOf(n.seat)} needs a 6 to start.`
        : n.kind === 'on' ? `${nameOf(n.seat)} is on the board! Roll again.`
          : n.kind === 'bounce' ? `${nameOf(n.seat)} bounced back off 100.`
            : n.kind === 'over' ? `${nameOf(n.seat)} needs exactly ${100 - v.at[n.seat]} to finish.` : '';
    const mine = ctx.active.includes(ctx.me);
    return {
      title: turnLine(ctx, 'roll the die'),
      lead: mine ? `${says ? `${says} ` : ''}Tap the die to roll.` : says || 'Ladders lift you up, snakes slide you down. Land exactly on 100 to win.',
      players: strip(ctx, ['#d32f2f', '#2e7dd1', '#f2b705', '#2e9e4f'], p => `${v.at[p] ? `🏁 ${v.at[p]}` : 'start'}${v.climbed?.[p] ? ` · 🪜${v.climbed[p]}` : ''}${v.bitten?.[p] ? ` · 🐍${v.bitten[p]}` : ''}`),
      buttons: mine ? [{ label: '🎲 Roll', i: 0, primary: true }] : [],
    };
  },
};
