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
 *  - places:  with three or four players the game goes on after the winner, for second and third place
 */
import { best, leaders, roll, seatsOf, turnLine } from '../lib.js?v=20261116-0000';

export const HOME = 56;
export const STARTS = [0, 13, 26, 39];
export const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];
export const COLORS = ['#d32f2f', '#2e9e4f', '#f2b705', '#2e7dd1'];
export const COLOR_NAMES = ['Red', 'Green', 'Yellow', 'Blue'];
export const RULES = [
  ['block', 'Blockades', 'Two of your tokens on one square block everyone else.'],
  ['capture', 'Capture to go home', 'A token can only go up its home path after you have captured one.'],
  ['quick', 'Quick start', 'Everyone starts with one token already out.'],
  ['places', 'Play on for places', 'After the winner, the others play on for second and third place.'],
];
// which corner each player has. The first player (you, on your own phone) gets the corner nearest
// you, bottom left (Blue); the rest follow round the board clockwise. With two, they sit opposite.
export const quarter = (s, seat) => (s.n === 2 ? [3, 1][seat] : (seat + 3) % 4);
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
/** Score mode: how the points work, and how long a game lasts (a clock: most points when it runs out). */
export const SCORE = { step: 1, capture: 20, home: 30, finish: 50, rounds: 15, minutes: 5 };
/** With people: a turn left alone is played by the computer; the third time, that player is out (offline). */
export const LIFELINES = 3;
/** 10 Moves mode: every player rolls this many times (sixes and bonus rolls count too); most points wins. */
export const MOVES = 10;
/** The modes where squares, captures and tokens home score points. */
export const counts = (s) => s.style === 'score' || s.style === 'moves';
const spent = (s, seat) => s.style === 'moves' && (s.used?.[seat] || 0) >= MOVES;
const finished = (s, seat) => !!s.order?.includes(seat) || !!s.out?.includes(seat);
const inGame = (s) => seatsOf(s.n).filter(p => !finished(s, p));
function nextSeat(s) {
  // players who have finished sit out the rest
  const was = s.p;
  // 10 Moves: once everyone still playing has had their 10, the game is over
  if (s.style === 'moves' && inGame(s).every(p => spent(s, p))) { s.ended = true; s.die = null; s.sixes = 0; return; }
  do s.p = (s.p + 1) % s.n; while ((finished(s, s.p) || spent(s, s.p)) && inGame(s).length > 0);
  s.sixes = 0;
  s.die = null;
  // back round to the start of the table: a new round (even when the first seat has finished)
  if (s.p <= was) {
    s.round += 1;
    // (a game saved before the clock came in still ends after its rounds)
    if (s.style === 'score' && !s.limitMs && s.round > SCORE.rounds) s.ended = true;
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
  if (to === HOME) return { text: 'Reaches home! 🏠', tag: '' };
  const sq = square(v, seat, to);
  if (victims(v, seat, sq).length) return { text: 'Captures a rival ⚔️', tag: '' };
  if (to > 50) return { text: 'Up the home path', tag: 'safe' };
  if (to < pos) return { text: 'Goes round again', tag: threat(v, seat, sq) ? 'risky' : '' };
  if (SAFE.includes(sq)) return { text: 'To a safe square ⭐', tag: 'safe' };
  if (rule(v, 'block') && v.t[seat].some((p, k) => k !== t && square(v, seat, p) === sq)) return { text: 'Makes a blockade 🧱', tag: 'safe' };
  return { text: `Move ${v.die} squares`, tag: threat(v, seat, sq) ? 'risky' : '' };
}

export default {
  rounds: SCORE.rounds,   // in Score mode only
  // with two players they sit opposite each other, next to their own corners
  // each player sits by their own coloured corner: with two, in opposite corners
  // each player sits by their own corner: corner k is place k in the room
  places: (n) => [0, 1, 2, 3].map(k => seatsOf(n).find(seat => quarter({ n }, seat) === k) ?? -1),
  init({ n, opts, names }) {
    const rules = Object.fromEntries(RULES.map(([k]) => [k, !!opts?.rules?.[k]]));
    return {
      n, names: Array.isArray(names) ? names.slice(0, n) : null, style: ['score', 'moves'].includes(opts?.style) ? opts.style : 'normal', rules, used: seatsOf(n).map(() => 0),
      points: seatsOf(n).map(() => 0), caps: seatsOf(n).map(() => 0), sixesRolled: seatsOf(n).map(() => 0),
      round: 1, ended: false, order: [], // 10 Moves: every token starts on the board, so each of the ten rolls counts
      t: seatsOf(n).map(() => (opts?.style === 'moves' ? [0, 0, 0, 0] : rules.quick ? [0, -1, -1, -1] : [-1, -1, -1, -1])),
      p: 0, die: null, sixes: 0, shown: 1, rollId: 0, won: -1, note: null,
      strikes: seatsOf(n).map(() => 0), out: [],
      // Score mode is played against a clock; the host's phone sets when it ends (deadline)
      limitMs: opts?.style === 'score' ? SCORE.minutes * 60000 : 0, deadline: 0, timeUp: false,
    };
  },
  /** The clock ran out (Score mode): the game ends, most points wins. */
  /**
   * Playing the computer, the only person at the table used up their three lifelines: the game is over
   * and they lose. The computer player furthest ahead takes it.
   */
  concede(s, seat) {
    s.conceded = seat;
    if (s.won >= 0 || s.ended) return [];
    const left = seatsOf(s.n).filter(p => p !== seat && !(s.out || []).includes(p));
    const ahead = (p) => s.t[p].reduce((a, x) => a + (x === HOME ? 60 : x < 0 ? 0 : x + 1), 0) + (counts(s) ? s.points[p] * 1000 : 0);
    s.won = left.length ? left.reduce((a, b) => (ahead(b) > ahead(a) ? b : a)) : -1;
    if (counts(s)) s.ended = true;
    s.conceded = seat; s.die = null;
    return [{ k: 'offline', seat }];
  },
  timeUp(s) {
    if (s.style !== 'score' || s.ended || s.won >= 0) return [];
    s.ended = true; s.timeUp = true; s.die = null;
    return [{ k: 'timeup', seat: -1 }];
  },
  /**
   * A turn played by the computer for a person who let the time run out: one lifeline gone. The third
   * time, that player is taken out of the game (offline); the others play on, or the last one left wins.
   */
  strike(s, seat) {
    if (!Array.isArray(s.strikes)) s.strikes = seatsOf(s.n).map(() => 0);
    if (!Array.isArray(s.out)) s.out = [];
    if (finished(s, seat)) return [];
    s.strikes[seat] += 1;
    if (s.strikes[seat] < LIFELINES) return [{ k: 'strike', seat, left: LIFELINES - s.strikes[seat] }];
    s.out.push(seat);
    s.note = { seat, kind: 'offline' };
    const events = [{ k: 'offline', seat }];
    const left = inGame(s);
    if (left.length <= 1) {
      if (counts(s)) s.ended = true;
      else s.won = left.length ? left[0] : -1;
      if (left.length) s.order = [...(s.order || []).filter(p => !s.out.includes(p)), left[0]];
      s.die = null;
      return events;
    }
    if (s.p === seat) nextSeat(s);
    return events;
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
      if (s.style === 'moves') { if (!Array.isArray(s.used)) s.used = seatsOf(s.n).map(() => 0); s.used[seat] += 1; }
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
      if (home(s, seat) === 4) {
        if (!s.order?.length) s.points[seat] += SCORE.finish;
        // playing on for places: the game ends when only one player is left out
        if (rule(s, 'places') && s.n > 2) {
          s.order.push(seat);
          s.note = { seat, kind: 'place', place: s.order.length };
          if (s.order.length >= s.n - 1) {
            s.order.push(seatsOf(s.n).find(p => !s.order.includes(p)));
            s.won = s.order[0];
            s.die = null;
            return events;
          }
          nextSeat(s);
          return events;
        }
        s.won = seat; s.die = null; return events;
      }
    }
    s.die = null;
    // 10 Moves: a bonus roll is a move too, so after your tenth there is none
    if (bonus && spent(s, seat)) bonus = false;
    if (!bonus) nextSeat(s);
    return events;
  },
  result(s) {
    if (s.won < 0 && !s.ended) return null;
    const gone = (s.out || []).map(p => s.names?.[p] || `Player ${p + 1}`);
    const offline = gone.length ? (Number.isInteger(s.conceded) ? ` ${gone.join(', ')} missed three turns and lost.` : ` ${gone.join(', ')} went offline and left the game.`) : '';
    if (Number.isInteger(s.conceded) && s.won >= 0 && !counts(s)) return { scores: seatsOf(s.n).map(p => (p === s.won ? 1 : 0)), winners: [s.won], note: `${s.names?.[s.conceded] || 'You'} missed three turns and lost.` };
    if (counts(s)) {
      // players who went offline can't win; among the rest, most points
      const live = seatsOf(s.n).filter(p => !(s.out || []).includes(p));
      const top = Math.max(...live.map(p => s.points[p]));
      const winners = live.filter(p => s.points[p] === top);
      return { scores: s.points.slice(), winners, note: (s.won >= 0 ? `${SCORE.finish} bonus points for finishing first.` : s.timeUp ? `Time's up: most points wins.` : s.style === 'moves' ? `${MOVES} moves each: most points wins.` : s.limitMs ? 'Most points wins.' : `${SCORE.rounds} rounds played: most points wins.`) + offline };
    }
    if (s.won >= 0 && (s.out || []).length && !(s.order || []).length) return { scores: seatsOf(s.n).map(p => (p === s.won ? 1 : 0)), winners: [s.won], note: `Last player left in the game.${offline}` };
    if (s.order?.length >= s.n) {
      const places = ['1st', '2nd', '3rd', '4th'];
      return { scores: seatsOf(s.n).map(p => s.n - s.order.indexOf(p)), winners: [s.order[0]], note: `Finishing order: ${s.order.map((p, i) => `${places[i]} ${s.names?.[p] || `Player ${p + 1}`}`).join(', ')}.` };
    }
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
      if (victims(s, seat, sq).length) v += counts(s) ? 90 : rule(s, 'capture') && !s.caps[seat] ? 110 : 60;
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
    const gone = (p) => (v.out || []).includes(p);
    // lifelines (with people): a hollow heart for each turn the computer had to play
    const hearts = (p) => (v.strikes?.[p] ? ` ${'❤️'.repeat(Math.max(0, LIFELINES - v.strikes[p]))}${'🤍'.repeat(Math.min(LIFELINES, v.strikes[p]))}` : '');
    const players = seatsOf(v.n).map(p => ({ name: nameOf(p), color: COLORS[quarter(v, p)], text: gone(p) ? '📴 offline' : `${counts(v) ? `${v.points[p]} pts${v.style === 'moves' ? ` · ${Math.max(0, MOVES - (v.used?.[p] || 0))} left` : ''}` : `${home(v, p)}/4 🏠${rule(v, 'capture') ? (v.caps[p] ? ' ⚔️' : ' 🔒') : ''}`}${hearts(p)}`, on: p === who }));
    let title;
    if (mine) title = `${ctx.pass ? `${ctx.names[who]} (${colorOf(who)})` : `You are ${colorOf(who)}`}: ${rolling ? 'roll the die' : `you rolled ${v.die}`}`;
    else title = `${ctx.names[who]} (${colorOf(who)}) ${rolling ? 'is rolling…' : `rolled ${v.die}`}`;
    const n = v.note;
    const says = !n ? '' : n.kind === 'stuck' ? `${nameOf(n.seat)} rolled ${n.n}: no token can move. ${v.t[n.seat].every(x => x < 0) ? 'A 6 brings a token out.' : ''}`
      : n.kind === 'forfeit' ? `${nameOf(n.seat)} rolled three sixes: turn lost.`
        : n.kind === 'offline' ? `${nameOf(n.seat)} missed three turns: offline, out of the game.`
        : n.kind === 'capture' ? `${nameOf(n.seat)} sent ${nameOf(n.victim)}’s token back! Roll again.`
          : n.kind === 'place' ? `${nameOf(n.seat)} finished ${['first 🥇', 'second 🥈', 'third 🥉'][n.place - 1] || ''}! The others play on.`
            : `${nameOf(n.seat)} brought a token home! Roll again.`;
    const myLeft = ctx.me >= 0 ? Math.max(0, MOVES - (v.used?.[ctx.me] || 0)) : MOVES;
    const round = v.style === 'moves' ? (ctx.me >= 0 && !ctx.pass ? `${myLeft} of your ${MOVES} moves left · most points wins` : `${MOVES} moves each · most points wins`) : v.style === 'score' ? (v.limitMs ? `Most points in ${Math.round(v.limitMs / 60000)} minutes wins` : `Round ${Math.min(v.round, SCORE.rounds)} of ${SCORE.rounds}`) : '';
    const lock = rule(v, 'capture') && ctx.me >= 0 && !v.caps[ctx.me] ? 'Capture a token to open your home path 🔒' : '';
    // your three lifelines: green, and red for each turn the computer had to play for you
    const livesOf = ctx.pass ? who : ctx.me;
    const lives = livesOf >= 0 && !gone(livesOf) ? { lost: Math.min(LIFELINES, v.strikes?.[livesOf] || 0), of: LIFELINES } : null;
    const panel = { title, die: v.die ?? v.shown, players, lead: says || round || lock, compact: true, buttons: [], lives };
    if (!mine) return panel;
    if (rolling) {
      panel.lead = `${says ? `${says} ` : ''}Tap the die to roll.${v.style === 'moves' ? ` ${myLeft === 1 ? 'Your last move!' : `${myLeft} moves left.`}` : ''}`;
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
    // you move your own token, even when only one can go: the game never plays your turn for you
    panel.lead = says || (seen.size === 1 ? 'Only one token can move: tap it.' : 'Tap a raised token. The ring shows where it lands.');
    if (counts(v)) panel.buttons = panel.buttons.map((b) => {
      const pos = v.t[ctx.me][ctx.legal[b.i].t];
      const to = destination(v, ctx.me, ctx.legal[b.i].t);
      const hits = victims(v, ctx.me, square(v, ctx.me, to)).length;
      const gain = (pos < 0 ? 1 : v.die) + hits * SCORE.capture + (to === HOME ? SCORE.home : 0);
      return { ...b, label: `${b.label} (+${gain})` };
    });
    return panel;
  },
};
