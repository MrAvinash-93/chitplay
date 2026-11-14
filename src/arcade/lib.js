/**
 * Shared helpers for the table games. A game is plain logic and plain data: no DOM, no 3D, no
 * network. Its state can be copied as JSON, so the host's phone can send it to everyone, and a test
 * can play thousands of matches between bots. Every game module exports an object with:
 *
 *   init({ n, rng, opts, names })       the starting state for n seats
 *   active(s)                           the seats that may move now ([] when the game is over)
 *   moves(s, seat)                      the legal moves for that seat, as plain data
 *   apply(s, seat, move, rng)           change the state; returns events for the room to react to
 *   result(s)                           null, or { scores, winners, note } when it's over
 *   bot(s, seat, rng, moves)            the move a computer player makes
 *   ui(view, ctx)                       what the panel under the board shows
 *   view(s, seat)                       optional: the state with other players' secrets taken out
 *   check(s, seat, move)                optional: for free-form moves, the tidied move or null
 */
export const int = (n, rng = Math.random) => Math.floor(rng() * n);
export const pick = (list, rng = Math.random) => list[int(list.length, rng)];
export function shuffle(list, rng = Math.random) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = int(i + 1, rng); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const clone = (x) => JSON.parse(JSON.stringify(x));
export const seatsOf = (n) => Array.from({ length: n }, (_, i) => i);
export const roll = (rng = Math.random) => 1 + int(6, rng);

/** The best item by score; ties are broken at random, so bots don't all play the same game. */
export function best(list, score, rng = Math.random) {
  let top = -Infinity, found = [];
  for (const x of list) {
    const v = score(x);
    if (v > top) { top = v; found = [x]; } else if (v === top) found.push(x);
  }
  return pick(found, rng);
}

/** Everyone who has the top score (nobody if all are level and `draw` says that's a draw). */
export function leaders(scores) {
  const top = Math.max(...scores);
  return scores.map((v, i) => (v === top ? i : -1)).filter(i => i >= 0);
}

/** Depth-limited game-tree search for two-player games with no hidden cards. */
export function negamax(state, depth, alpha, beta, g) {
  const list = g.moves(state);
  if (depth === 0 || !list.length) return g.score(state, depth);
  let top = -Infinity;
  for (const m of g.order ? g.order(list, state) : list) {
    const next = g.play(state, m);
    const v = g.same(next, state) ? negamax(next, depth - 1, alpha, beta, g) : -negamax(next, depth - 1, -beta, -alpha, g);
    if (v > top) top = v;
    if (top > alpha) alpha = top;
    if (alpha >= beta) break;
  }
  return top;
}
/** The move a negamax search likes best. */
export function searchMove(state, depth, g, rng, moves = g.moves(state)) {
  return best(moves, (m) => {
    const next = g.play(state, m);
    return g.same(next, state) ? negamax(next, depth - 1, -Infinity, Infinity, g) : -negamax(next, depth - 1, -Infinity, Infinity, g);
  }, rng);
}

/** "Your turn" or "Asha's turn", the line most panels start with. */
export function turnLine(ctx, verb = '') {
  const a = ctx.active;
  if (!a.length) return '';
  if (a.includes(ctx.me)) return verb ? `Your turn: ${verb}` : 'Your turn';
  return a.length === 1 ? `${ctx.names[a[0]]}’s turn` : 'Waiting for the others…';
}
export const scoreList = (scores, ctx) => scores.map((v, i) => [ctx.names[i], v]);
/**
 * The players' strip under the board: each name in that player's colour on the board, what they
 * have, and a glow on whoever's turn it is. `text(seat)` says what each one has.
 */
export function strip(ctx, colors, text) {
  return ctx.names.map((n, p) => ({ name: p === ctx.me && !ctx.pass ? 'You' : n, color: colors[p % colors.length], text: String(text(p)), on: ctx.active.includes(p) }));
}
/** "You" or the player's name, for the lines under the board. */
export const who = (ctx, p) => (p === ctx.me && !ctx.pass ? 'You' : ctx.names[p]);
