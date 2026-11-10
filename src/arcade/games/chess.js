/**
 * Chess: the full rules. Castling, en passant, promotion, check, checkmate, stalemate, the
 * fifty-move rule, threefold repetition and insufficient material. Seat 0 is White.
 * Squares are 0–63, a8 = 0, h1 = 63. A piece is 'P','N','B','R','Q','K' (White) or lower case (Black).
 */
import { best, turnLine } from '../lib.js?v=20261110-1534';

const START = 'rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR';
const isWhite = (c) => c >= 'A' && c <= 'Z';
const colorOf = (c) => (c === '.' ? -1 : isWhite(c) ? 0 : 1);
const X = (s) => s % 8, Y = (s) => (s - (s % 8)) / 8;
const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]], LINE = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function attacked(b, sq, by) {
  const x = X(sq), y = Y(sq);
  const has = (nx, ny, set) => nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && set.includes(b[nx + ny * 8]);
  // pawns: a White pawn attacks upward (towards row 0)
  if (by === 0 ? has(x - 1, y + 1, 'P') || has(x + 1, y + 1, 'P') : has(x - 1, y - 1, 'p') || has(x + 1, y - 1, 'p')) return true;
  const N = by === 0 ? 'N' : 'n', K = by === 0 ? 'K' : 'k';
  for (const [dx, dy] of KNIGHT) if (has(x + dx, y + dy, N)) return true;
  for (const [dx, dy] of [...DIAG, ...LINE]) if (has(x + dx, y + dy, K)) return true;
  const slide = (dirs, set) => {
    for (const [dx, dy] of dirs) {
      for (let nx = x + dx, ny = y + dy; nx >= 0 && nx < 8 && ny >= 0 && ny < 8; nx += dx, ny += dy) {
        const c = b[nx + ny * 8];
        if (c === '.') continue;
        if (set.includes(c)) return true;
        break;
      }
    }
    return false;
  };
  return by === 0 ? slide(DIAG, 'BQ') || slide(LINE, 'RQ') : slide(DIAG, 'bq') || slide(LINE, 'rq');
}
const kingOf = (b, p) => b.indexOf(p === 0 ? 'K' : 'k');
const inCheck = (b, p) => attacked(b, kingOf(b, p), 1 - p);

function pseudo(s, p) {
  const b = s.b, list = [];
  for (let f = 0; f < 64; f++) {
    const c = b[f];
    if (colorOf(c) !== p) continue;
    const x = X(f), y = Y(f), kind = c.toUpperCase();
    const add = (nx, ny) => {
      if (nx < 0 || nx > 7 || ny < 0 || ny > 7) return false;
      const t = nx + ny * 8, o = colorOf(b[t]);
      if (o === p) return false;
      list.push({ f, t });
      return o < 0;
    };
    if (kind === 'P') {
      const dir = p === 0 ? -1 : 1, home = p === 0 ? 6 : 1, last = p === 0 ? 0 : 7;
      const push = (t) => { if (Y(t) === last) 'QRBN'.split('').forEach(q => list.push({ f, t, q })); else list.push({ f, t }); };
      const one = x + (y + dir) * 8;
      if (b[one] === '.') {
        push(one);
        const two = x + (y + 2 * dir) * 8;
        if (y === home && b[two] === '.') list.push({ f, t: two });
      }
      for (const dx of [-1, 1]) {
        const nx = x + dx;
        if (nx < 0 || nx > 7) continue;
        const t = nx + (y + dir) * 8;
        if (colorOf(b[t]) === 1 - p) push(t);
        else if (t === s.ep) list.push({ f, t, ep: 1 });
      }
    } else if (kind === 'N') KNIGHT.forEach(([dx, dy]) => add(x + dx, y + dy));
    else if (kind === 'K') {
      [...DIAG, ...LINE].forEach(([dx, dy]) => add(x + dx, y + dy));
      const rights = s.c[p], home = p === 0 ? 60 : 4, enemy = 1 - p;
      if (f === home && !attacked(b, home, enemy)) {
        if (rights.k && b[home + 1] === '.' && b[home + 2] === '.' && !attacked(b, home + 1, enemy) && !attacked(b, home + 2, enemy)) list.push({ f, t: home + 2, castle: 1 });
        if (rights.q && b[home - 1] === '.' && b[home - 2] === '.' && b[home - 3] === '.' && !attacked(b, home - 1, enemy) && !attacked(b, home - 2, enemy)) list.push({ f, t: home - 2, castle: 1 });
      }
    } else {
      const dirs = kind === 'B' ? DIAG : kind === 'R' ? LINE : [...DIAG, ...LINE];
      for (const [dx, dy] of dirs) for (let n = 1; add(x + dx * n, y + dy * n); n++);
    }
  }
  return list;
}
/** The position after a move (no check for legality here). */
function step(s, m) {
  const b = s.b.slice(), p = colorOf(b[m.f]);
  const piece = b[m.f], taken = b[m.t];
  b[m.f] = '.';
  b[m.t] = m.q ? (p === 0 ? m.q : m.q.toLowerCase()) : piece;
  if (m.ep) b[m.t + (p === 0 ? 8 : -8)] = '.';
  if (m.castle) {
    const short = m.t > m.f;
    b[short ? m.f + 1 : m.f - 1] = b[short ? m.t + 1 : m.t - 2];
    b[short ? m.t + 1 : m.t - 2] = '.';
  }
  const c = [{ ...s.c[0] }, { ...s.c[1] }];
  if (piece.toUpperCase() === 'K') c[p] = { k: false, q: false };
  const rookGone = (sq) => { if (sq === 63) c[0].k = false; if (sq === 56) c[0].q = false; if (sq === 7) c[1].k = false; if (sq === 0) c[1].q = false; };
  rookGone(m.f); rookGone(m.t);
  const double = piece.toUpperCase() === 'P' && Math.abs(m.t - m.f) === 16;
  const pawnOrTake = piece.toUpperCase() === 'P' || taken !== '.';
  return { b, c, ep: double ? (m.f + m.t) / 2 : -1, p: 1 - p, half: pawnOrTake ? 0 : (s.half || 0) + 1 };
}
function legal(s, p) { return pseudo(s, p).filter(m => !inCheck(step(s, m).b, p)); }
const keyOf = (s) => `${s.b.join('')}${s.p}${s.c[0].k ? 'K' : ''}${s.c[0].q ? 'Q' : ''}${s.c[1].k ? 'k' : ''}${s.c[1].q ? 'q' : ''}${s.ep}`;
function deadPosition(b) {
  const rest = b.filter(c => c !== '.' && c.toUpperCase() !== 'K');
  if (!rest.length) return true;
  if (rest.length === 1 && 'BN'.includes(rest[0].toUpperCase())) return true;
  if (rest.every(c => c.toUpperCase() === 'B')) {
    const shade = new Set();
    b.forEach((c, i) => { if (c.toUpperCase() === 'B') shade.add((X(i) + Y(i)) % 2); });
    return shade.size === 1;
  }
  return false;
}

/* the bot: a short look ahead, on material and a little sense of position */
const VALUE = { P: 100, N: 310, B: 325, R: 500, Q: 900, K: 0 };
function evaluate(b, p) {
  let v = 0;
  for (let i = 0; i < 64; i++) {
    const c = b[i];
    if (c === '.') continue;
    const k = c.toUpperCase();
    const x = X(i), y = Y(i);
    let w = VALUE[k];
    const centre = 3.5 - Math.max(Math.abs(x - 3.5), Math.abs(y - 3.5));
    if (k === 'N' || k === 'B') w += centre * 8;
    if (k === 'P') w += (isWhite(c) ? 6 - y : y - 1) * 6 + (x === 3 || x === 4 ? 8 : 0);
    if (k === 'K') w -= centre * 6;
    v += isWhite(c) ? w : -w;
  }
  return p === 0 ? v : -v;
}
function negamaxChess(s, depth, alpha, beta) {
  if (depth === 0) return evaluate(s.b, s.p);
  const list = legal(s, s.p);
  if (!list.length) return inCheck(s.b, s.p) ? -30000 - depth : 0;
  // captures first: it cuts the search a lot
  list.sort((a, b) => (VALUE[s.b[b.t].toUpperCase()] || 0) - (VALUE[s.b[a.t].toUpperCase()] || 0));
  let top = -Infinity;
  for (const m of list) {
    const v = -negamaxChess(step(s, m), depth - 1, -beta, -alpha);
    if (v > top) top = v;
    if (top > alpha) alpha = top;
    if (alpha >= beta) break;
  }
  return top;
}

export default {
  init: () => ({ b: START.split(''), p: 0, c: [{ k: true, q: true }, { k: true, q: true }], ep: -1, half: 0, seen: {}, last: null, end: null }),
  active: (s) => (s.end ? [] : [s.p]),
  moves: (s, seat) => legal(s, seat),
  apply(s, seat, m) {
    const capture = s.b[m.t] !== '.' || !!m.ep;
    const n = step(s, m);
    Object.assign(s, { b: n.b, c: n.c, ep: n.ep, p: n.p, half: n.half, last: { f: m.f, t: m.t } });
    const key = keyOf(s);
    s.seen[key] = (s.seen[key] || 0) + 1;
    const check = inCheck(s.b, s.p);
    const events = [{ k: capture ? 'capture' : 'move', seat }];
    if (check) events.push({ k: 'check', seat });
    if (!legal(s, s.p).length) s.end = check ? { winner: seat, why: 'Checkmate!' } : { winner: -1, why: 'Stalemate: a draw.' };
    else if (deadPosition(s.b)) s.end = { winner: -1, why: 'Not enough pieces left to checkmate: a draw.' };
    else if (s.half >= 100) s.end = { winner: -1, why: 'Fifty moves without a capture or pawn move: a draw.' };
    else if (s.seen[key] >= 3) s.end = { winner: -1, why: 'The same position three times: a draw.' };
    return events;
  },
  result(s) {
    if (!s.end) return null;
    const w = s.end.winner;
    return { scores: w < 0 ? [0, 0] : w === 0 ? [1, 0] : [0, 1], winners: w < 0 ? [] : [w], note: s.end.why };
  },
  // sends only what the board and the panel need: the repetition table can grow long
  view: (s) => ({ b: s.b, p: s.p, last: s.last, end: s.end, check: inCheck(s.b, s.p) }),
  bot(s, seat, rng, moves) {
    const depth = s.b.filter(c => c !== '.').length <= 10 ? 3 : 2;
    return best(moves, m => -negamaxChess(step(s, m), depth - 1, -Infinity, Infinity) + rng() * 14, rng);
  },
  ui: (v, ctx) => ({ title: turnLine(ctx, v.check ? 'you are in check' : 'tap a piece, then a square'), lead: `${ctx.names[0]} White · ${ctx.names[1]} Black${v.check && !ctx.active.includes(ctx.me) ? ' · check!' : ''}` }),
};
