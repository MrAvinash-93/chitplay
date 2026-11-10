/**
 * Ludo, for 2 to 4. Each seat has four tokens, each with a position counted from its own start:
 * -1 in the yard, 0–50 round the track, 51–55 up the home column, 56 home.
 * A six brings a token out and rolls again; so do a capture and a token reaching home. Three sixes
 * in a row lose the turn. Start squares and star squares are safe. Home needs the exact number.
 *
 * House rules, each chosen before the game (all off by default):
 *  - block:   two tokens of one colour on the same track square make a blockade nobody can pass or land on
 *  - capture: a token can only go up its home path once its player has captured; until then it goes
 *             round again (straight on to its own start square)
 *  - quick:   everyone starts with one token already out
 */
import { best, leaders, roll, seatsOf, turnLine } from '../lib.js?v=20261110-1351';

export const HOME = 56;
export const STARTS = [0, 13, 26, 39];
export const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];
export const COLORS = ['#d32f2f', '#2e9e4f', '#f2b705', '#2e7dd1'];
export const COLOR_NAMES = ['Red', 'Green', 'Yellow', 'Blue'];
export const RULES = [
  ['block', 'Blockades', 'Two of your tokens on one square block everyone else.'],
  ['capture', 'Capture to go home', 'A token can only go up its home path after you have captured one.'],
  ['quick', 'Quick start', 'Everyone starts with one token already out.'],
];
// with two players they sit opposite each other
export const quarter = (s, seat) => (s.n === 2 ? seat * 2 : seat);
export const square = (s, seat, pos) => (pos < 0 || pos > 50 ? -1 : (STARTS[quarter(s, seat)] + pos) % 52);
const rule = (s, k) => !!s.rules?.[k];
const mayGoHome = (s, seat) => !rule(s, 'capture') || s.caps[seat] > 0;

/** Where a token ends up with this die, or null if it can't move. Tidy with every house rule. */
export function destination(s, seat, t, die = s.die) {
  const pos = s.t[seat][t];
  if (pos === HOME || die == null) return null;
  if (pos < 0) return die === 6 && !blockedAt(s, seat, square(s, seat, 0)) ? 0 : null;
  let to = pos + die;
  // without a capture yet, a token on the track goes round again instead of up the home path
  if (pos <= 50 && to > 50 && !mayGoHome(s, seat)) to -= 51;
  if (to > HOME) return null;
  // a blockade stops everyone else, on the way and where they'd land
  if (rule(s, 'block') && pos <= 50) {
    for (let k = 1; k <= die; k++) {
      const step = to < pos ? (pos + k > 50 ? pos + k - 51 : pos + k) : pos + k;
      if (step <= 50 && blockedAt(s, seat, square(s, seat, step))) return null;
    }
  }
  return to;
}
/** A rival blockade on this track square? */
function blockedAt(s, seat, sq) {
  if (!rule(s, 'block') || sq < 0) return false;
  return seatsOf(s.n).some(o => o !== seat && s.t[o].filter(p => square(s, o, p) === sq).length >= 2);
}
function legal(s, seat) {
  if (s.die == null) return [{ roll: 1 }];
  return s.t[seat].map((_, t) => (destination(s, seat, t) == null ? null : { t })).filter(Boolean);
}
/** Score mode: how the points work, and how long a game lasts. */
export const SCORE = { step: 1, capture: 20, home: 30, finish: 50, rounds: 15 };
function nextSeat(s) {
  s.p = (s.p + 1) % s.n;
  s.sixes = 0;
  s.die = null;
  if (s.p === 0) {
    s.round += 1;
    if (s.style === 'score' && s.round > SCORE.rounds) s.ended = true;
  }
}
export const victims = (s, seat, sq) => {
  if (sq < 0 || SAFE.includes(sq)) return [];
  const hit = [];
  seatsOf(s.n).forEach((o) => {
    if (o === seat) return;
    const there = s.t[o].map((pos, k) => (square(s, o, pos) === sq ? k : -1)).filter(k => k >= 0);
    // a blockade can't be captured
    if (rule(s, 'block') && there.length >= 2) return;
    there.forEach(k => hit.push([o, k]));
  });
  return hit;
};
const home = (s, seat) => s.t[seat].filter(p => p === HOME).length;
/** How many rival tokens could land on this square next turn (1 to 6 squares behind it). */
export function threat(s, seat, sq) {
  if (sq < 0 || SAFE.includes(sq)) return 0;
  let n = 0;
  seatsOf(s.n).forEach((o) => {
    if (o === seat) return;
    s.t[o].forEach((pos) => {
      const at = square(s, o, pos);
      if (at < 0) return;
      const gap = (sq - at + 52) % 52;
      if (gap >= 1 && gap <= 6) n += 1;
    });
  });
  return n;
}

/** What a token's move will do, in a few words a new player can use to choose. */
function describe(v, seat, t) {
  const pos = v.t[seat][t];
  const to = destination(v, seat, t);
  if (pos < 0) return { text: 'Bring a token out', tag: '' };
  if (to === HOME) return { text: `Token ${t + 1}: reaches home! 🏠`, tag: '' };
  const sq = square(v, seat, to);
  if (victims(v, seat, sq).length) return { text: `Token ${t + 1}: captures a rival ⚔️`, tag: '' };
  if (to > 50) return { text: `Token ${t + 1}: up the home path`, tag: 'safe' };
  if (to < pos) return { text: `Token ${t + 1}: goes round again`, tag: threat(v, seat, sq) ? 'risky' : '' };
  if (SAFE.includes(sq)) return { text: `Token ${t + 1}: safe square ⭐`, tag: 'safe' };
  if (rule(v, 'block') && v.t[seat].some((p, k) => k !== t && square(v, seat, p) === sq)) return { text: `Token ${t + 1}: makes a blockade 🧱`, tag: 'safe' };
  return { text: `Token ${t + 1}: move ${v.die}`, tag: threat(v, seat, sq) ? 'risky' : '' };
}

export default {
  // with two players they sit opposite each other, next to their own corners
  places: (n) => (n === 2 ? [0, -1, 1, -1] : null),
  init({ n, opts }) {
    const rules = Object.fromEntries(RULES.map(([k]) => [k, !!opts?.rules?.[k]]));
    return {
      n, style: opts?.style === 'score' ? 'score' : 'normal', rules,
      points: seatsOf(n).map(() => 0), caps: seatsOf(n).map(() => 0), sixesRolled: seatsOf(n).map(() => 0),
      round: 1, ended: false, t: seatsOf(n).map(() => (rules.quick ? [0, -1, -1, -1] : [-1, -1, -1, -1])),
      p: 0, die: null, sixes: 0, shown: 1, rollId: 0, won: -1, note: null,
    };
  },
  active: (s) => (s.won >= 0 || s.ended ? [] : [s.p]),
  moves: (s, seat) => legal(s, seat),
  apply(s, seat, m, rng) {
    const events = [];
    if (m.roll) {
      s.note = null;
      s.die = roll(rng);
      s.shown = s.die;
      s.rollId += 1;
      s.sixes = s.die === 6 ? s.sixes + 1 : 0;
      if (s.die === 6) s.sixesRolled[seat] += 1;
      events.push({ k: 'roll', seat, n: s.die });
      if (s.sixes === 3) { s.note = { seat, kind: 'forfeit' }; events.push({ k: 'forfeit', seat }); nextSeat(s); return events; }
      if (!legal(s, seat).length) { s.note = { seat, kind: 'stuck', n: s.die }; events.push({ k: 'stuck', seat }); nextSeat(s); }
      return events;
    }
    const die = s.die;
    const from = s.t[seat][m.t];
    const to = destination(s, seat, m.t);
    s.t[seat][m.t] = to;
    const steps = from < 0 ? 1 : die;
    s.points[seat] += steps * SCORE.step;
    events.push({ k: 'move', seat, steps });
    s.note = null;
    let bonus = die === 6;
    const hit = victims(s, seat, square(s, seat, to));
    if (hit.length) {
      hit.forEach(([o, k]) => { s.t[o][k] = -1; });
      s.points[seat] += SCORE.capture * hit.length;
      s.caps[seat] += hit.length;
      bonus = true;
      s.note = { seat, kind: 'capture', victim: hit[0][0] };
      events.push({ k: 'capture', seat, victim: hit[0][0] });
    }
    if (rule(s, 'block') && to <= 50 && s.t[seat].filter(p => p === to).length === 2) events.push({ k: 'block', seat });
    if (to === HOME) {
      bonus = true;
      s.points[seat] += SCORE.home;
      s.note = { seat, kind: 'home' };
      events.push({ k: 'home', seat });
      if (home(s, seat) === 4) { s.points[seat] += SCORE.finish; s.won = seat; s.die = null; return events; }
    }
    s.die = null;
    if (!bonus) nextSeat(s);
    return events;
  },
  result(s) {
    if (s.won < 0 && !s.ended) return null;
    if (s.style === 'score') return { scores: s.points.slice(), winners: leaders(s.points), note: s.won >= 0 ? `${SCORE.finish} bonus points for finishing first.` : `${SCORE.rounds} rounds played: most points wins.` };
    return { scores: seatsOf(s.n).map(p => home(s, p)), winners: [s.won], note: 'Scores are tokens brought home.' };
  },
  // weighs every move: captures, getting home, safety, blockades, and what it leaves exposed
  bot(s, seat, rng, moves) {
    if (moves[0].roll) return moves[0];
    return best(moves, (m) => {
      const pos = s.t[seat][m.t];
      const to = destination(s, seat, m.t);
      const sq = square(s, seat, to);
      let v = (to < pos ? to + 51 : to) * 0.25;
      if (victims(s, seat, sq).length) v += s.style === 'score' ? 90 : rule(s, 'capture') && !s.caps[seat] ? 110 : 60;
      if (to === HOME) v += 45;
      if (pos < 0) v += 30;
      if (to > 50) v += 14;
      if (sq >= 0 && SAFE.includes(sq)) v += 12;
      v -= threat(s, seat, sq) * 16;                                     // walking into danger
      if (pos >= 0 && pos <= 50) v += threat(s, seat, square(s, seat, pos)) * 13; // getting out of it
      if (rule(s, 'block') && to <= 50 && s.t[seat].some((p, k) => k !== m.t && p === to)) v += 18;
      return v + rng() * 2;
    }, rng);
  },
  ui(v, ctx) {
    const mine = ctx.active.includes(ctx.me);
    const rolling = v.die == null;
    const who = ctx.active[0];
    const colorOf = (p) => COLOR_NAMES[quarter(v, p)];
    const nameOf = (p) => (p === ctx.me && !ctx.pass ? 'You' : ctx.names[p]);
    const players = seatsOf(v.n).map(p => ({ name: nameOf(p), color: COLORS[quarter(v, p)], text: v.style === 'score' ? `${v.points[p]} pts` : `${home(v, p)}/4 🏠${rule(v, 'capture') ? (v.caps[p] ? ' ⚔️' : ' 🔒') : ''}`, on: p === who }));
    let title;
    if (mine) title = `${ctx.pass ? `${ctx.names[who]} (${colorOf(who)})` : `You are ${colorOf(who)}`}: ${rolling ? 'roll the die' : `you rolled ${v.die}`}`;
    else title = `${ctx.names[who]} (${colorOf(who)}) ${rolling ? 'is rolling…' : `rolled ${v.die}`}`;
    const n = v.note;
    const says = !n ? '' : n.kind === 'stuck' ? `${nameOf(n.seat)} rolled ${n.n}: no token can move. ${v.t[n.seat].every(x => x < 0) ? 'A 6 brings a token out.' : ''}`
      : n.kind === 'forfeit' ? `${nameOf(n.seat)} rolled three sixes: turn lost.`
        : n.kind === 'capture' ? `${nameOf(n.seat)} sent ${nameOf(n.victim)}’s token back! Roll again.`
          : `${nameOf(n.seat)} brought a token home! Roll again.`;
    const round = v.style === 'score' ? `Round ${Math.min(v.round, SCORE.rounds)} of ${SCORE.rounds}` : '';
    const lock = rule(v, 'capture') && ctx.me >= 0 && !v.caps[ctx.me] ? 'Capture a token to open your home path 🔒' : '';
    const panel = { title, die: v.die ?? v.shown, players, lead: says || round || lock, compact: true, buttons: [] };
    if (!mine) return panel;
    if (rolling) {
      panel.buttons = [{ label: '🎲 Roll the die', i: 0, primary: true, wide: true }];
      return panel;
    }
    // tokens in the same place make the same move: one choice for each place
    const seen = new Map();
    ctx.legal.forEach((m, i) => { const pos = v.t[ctx.me][m.t]; if (!seen.has(pos)) seen.set(pos, i); });
    panel.buttons = [...seen.values()].map((i) => {
      const d = describe(v, ctx.me, ctx.legal[i].t);
      return { label: `${d.text}${d.tag === 'risky' ? ' · ⚠️ risky' : ''}`, i, wide: true };
    });
    // only one thing you can do: the game does it for you
    if (seen.size === 1) { panel.auto = [...seen.values()][0]; panel.buttons = []; }
    else panel.lead = says || 'Tap a glowing token, or choose here. The ring shows where it lands.';
    if (v.style === 'score') panel.buttons = panel.buttons.map((b) => {
      const pos = v.t[ctx.me][ctx.legal[b.i].t];
      const to = destination(v, ctx.me, ctx.legal[b.i].t);
      const hits = victims(v, ctx.me, square(v, ctx.me, to)).length;
      const gain = (pos < 0 ? 1 : v.die) + hits * SCORE.capture + (to === HOME ? SCORE.home : 0);
      return { ...b, label: `${b.label} (+${gain})` };
    });
    return panel;
  },
};
