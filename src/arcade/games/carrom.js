/**
 * Carrom for two, with a little physics. Seat 0 plays the white coins, seat 1 the black. Put a coin
 * of yours in a pocket and you shoot again. The queen must be "covered": sink one of your own coins
 * on the same or the next shot, or she returns to the centre. Sinking the striker is a foul: one of
 * your pocketed coins comes back and your turn ends. Sink all your coins, once the queen is covered,
 * to win: you score 1 for each coin the other player has left, plus 3 for holding the queen.
 *
 * Coordinates: the board is -1…1 on both axes. Seat 0 shoots from the near baseline (y = +0.72)
 * towards -y; seat 1 from the far one. The physics is in plain JS so the host alone decides.
 */
import { best, turnLine } from '../lib.js?v=20261110-1351';

export const WALL = 1;
export const R = 0.052;           // a coin's radius
export const STRIKER_R = 0.066;
export const POCKET_R = 0.098;
export const BASE_Y = 0.72;
export const BASE_X = 0.62;       // how far along the baseline the striker may sit
export const POCKETS = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) => [x * (WALL - 0.045), y * (WALL - 0.045)]);
const MAX_SPEED = 3.6;
const FRICTION = 0.76;            // loss of speed per second, in units/s²
const WALL_BOUNCE = 0.74;
const COIN_BOUNCE = 0.94;
const DT = 1 / 120;
const SAMPLE = 6;                 // keep every 6th step (20 frames a second) for the animation

function rack() {
  const coins = [{ id: 'q', x: 0, y: 0 }];
  const gap = R * 2.04;
  const ids = { w: 0, b: 0 };
  // an inner ring of six, then an outer ring of twelve, alternating colours
  const put = (color, x, y) => { ids[color] += 1; coins.push({ id: `${color}${ids[color]}`, x, y }); };
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; put(i % 2 ? 'b' : 'w', Math.cos(a) * gap, Math.sin(a) * gap); }
  for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * Math.PI * 2; put(i % 2 ? 'w' : 'b', Math.cos(a) * gap * 2, Math.sin(a) * gap * 2); }
  return coins;
}
const colorOf = (id) => id[0];
const mineColor = (seat) => (seat === 0 ? 'w' : 'b');
const baseY = (seat) => (seat === 0 ? BASE_Y : -BASE_Y);

/** Play one shot out. Returns where everything ended, what sank, and frames to animate. */
export function simulate(coins, seat, shot) {
  const bodies = coins.map(c => ({ ...c, vx: 0, vy: 0, r: R, sunk: false }));
  const speed = shot.p * MAX_SPEED;
  const striker = { id: 'S', x: shot.x, y: baseY(seat), vx: Math.cos(shot.a) * speed, vy: Math.sin(shot.a) * speed, r: STRIKER_R, sunk: false };
  bodies.push(striker);
  const frames = [];
  const sunk = [];
  let touched = false;
  const limit = 120 * 14;
  for (let n = 0; n < limit; n++) {
    let moving = false;
    for (const b of bodies) {
      if (b.sunk) continue;
      const v = Math.hypot(b.vx, b.vy);
      if (v > 0) {
        const nv = Math.max(0, v - FRICTION * DT);
        const k = v ? nv / v : 0;
        b.vx *= k; b.vy *= k;
        b.x += b.vx * DT; b.y += b.vy * DT;
        if (nv > 0) moving = true;
      }
      if (Math.abs(b.x) > WALL - b.r) { b.x = Math.sign(b.x) * (WALL - b.r); b.vx *= -WALL_BOUNCE; }
      if (Math.abs(b.y) > WALL - b.r) { b.y = Math.sign(b.y) * (WALL - b.r); b.vy *= -WALL_BOUNCE; }
      for (const [px, py] of POCKETS) {
        if (Math.hypot(b.x - px, b.y - py) < POCKET_R) { b.sunk = true; b.vx = 0; b.vy = 0; sunk.push(b.id); break; }
      }
    }
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.sunk) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b.sunk) continue;
        const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const massA = a.id === 'S' ? 1.6 : 1, massB = b.id === 'S' ? 1.6 : 1;
        const overlap = (min - d) / 2;
        a.x -= nx * overlap; a.y -= ny * overlap;
        b.x += nx * overlap; b.y += ny * overlap;
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel <= 0) continue;
        const imp = (1 + COIN_BOUNCE) * rel / (1 / massA + 1 / massB);
        a.vx -= (imp / massA) * nx; a.vy -= (imp / massA) * ny;
        b.vx += (imp / massB) * nx; b.vy += (imp / massB) * ny;
        if (a.id === 'S' || b.id === 'S') touched = true;
        moving = true;
      }
    }
    if (n % SAMPLE === 0) frames.push(bodies.map(b => (b.sunk ? null : [Math.round(b.x * 1000), Math.round(b.y * 1000)])));
    if (!moving) break;
  }
  frames.push(bodies.map(b => (b.sunk ? null : [Math.round(b.x * 1000), Math.round(b.y * 1000)])));
  const left = bodies.filter(b => !b.sunk && b.id !== 'S').map(({ id, x, y }) => ({ id, x, y }));
  return { left, sunk, frames, ids: bodies.map(b => b.id), touched };
}

/** A free spot near the centre for a coin that comes back. */
function freeSpot(coins, rng) {
  for (let i = 0; i < 80; i++) {
    const a = rng() * Math.PI * 2, d = i * 0.012;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    if (coins.every(c => Math.hypot(c.x - x, c.y - y) > R * 2.1)) return { x, y };
  }
  return { x: 0, y: 0 };
}
const count = (coins, color) => coins.filter(c => colorOf(c.id) === color).length;
const finishable = (coins) => !coins.some(c => c.id === 'q');

export default {
  init: () => ({ coins: rack(), p: 0, queen: -1, cover: -1, won: -1, shot: 0, frames: null, ids: null, note: '', scoreOut: null, turns: 0 }),
  active: (s) => (s.won >= 0 ? [] : [s.p]),
  moves: () => [{ aim: 1 }],
  // the shot is free-form: tidied up and kept within the rules here
  check(s, seat, m) {
    const x = Number(m?.x), a = Number(m?.a), p = Number(m?.p);
    if (![x, a, p].every(Number.isFinite)) return null;
    return { x: Math.max(-BASE_X, Math.min(BASE_X, x)), a, p: Math.max(0.1, Math.min(1, p)) };
  },
  apply(s, seat, m, rng) {
    const r = simulate(s.coins, seat, m);
    s.coins = r.left;
    s.shot += 1;
    s.turns += 1;
    s.frames = r.frames;
    s.ids = r.ids;
    const mine = mineColor(seat), foe = seat === 0 ? 'b' : 'w';
    const gotMine = r.sunk.filter(id => colorOf(id) === mine).length;
    const gotQueen = r.sunk.includes('q');
    const foul = r.sunk.includes('S');
    const events = [{ k: 'shot', seat }];
    s.note = '';
    const putBack = (id) => { const at = freeSpot(s.coins, rng); s.coins.push({ id, ...at }); };
    // the queen: covered now, or waiting one more shot
    if (gotQueen && !foul) {
      if (gotMine) { s.queen = seat; s.note = 'Queen pocketed and covered!'; events.push({ k: 'capture', seat }); }
      else { s.cover = seat; s.note = 'Queen pocketed: cover her on your next shot.'; }
    } else if (gotQueen) putBack('q');
    else if (s.cover === seat) {
      if (gotMine && !foul) { s.queen = seat; s.note = 'Queen covered!'; events.push({ k: 'capture', seat }); }
      else { putBack('q'); s.note = 'Not covered: the queen goes back.'; }
      s.cover = -1;
    }
    let again = (gotMine > 0 || (gotQueen && !foul)) && !foul;
    if (foul) {
      s.note = 'Foul: the striker went in. One of your coins comes back.';
      events.push({ k: 'foul', seat });
      if (count(s.coins, mine) < 9) {
        const ids = new Set(s.coins.map(c => c.id));
        for (let i = 1; i <= 9; i++) if (!ids.has(`${mine}${i}`)) { putBack(`${mine}${i}`); break; }
      }
      if (s.cover === seat) { putBack('q'); s.cover = -1; }
    }
    // the last coin can't be sunk before the queen is dealt with: it comes back
    [mine, foe].forEach((color) => {
      if (!count(s.coins, color) && !finishable(s.coins)) {
        for (let i = 1; i <= 9; i++) { if (!s.coins.some(c => c.id === `${color}${i}`)) { putBack(`${color}${i}`); break; } }
        s.note = 'The queen must go before the last coin: it comes back.';
      }
    });
    // a long game: after 80 shots the player with fewer coins left takes it
    const myLeft = count(s.coins, mine), foeLeft = count(s.coins, foe);
    const over = (myLeft === 0 || foeLeft === 0) && s.cover < 0 && finishable(s.coins);
    if (over || s.turns >= 80) {
      const zero = myLeft === 0 ? seat : foeLeft === 0 ? 1 - seat : (myLeft < foeLeft ? seat : foeLeft < myLeft ? 1 - seat : seat);
      s.won = zero;
      const rest = count(s.coins, zero === 0 ? 'b' : 'w');
      s.scoreOut = zero === 0 ? [rest + (s.queen === 0 ? 3 : 0), 0] : [0, rest + (s.queen === 1 ? 3 : 0)];
      return events;
    }
    if (!again) s.p = 1 - seat;
    return events;
  },
  result: (s) => (s.won < 0 ? null : { scores: s.scoreOut, winners: [s.won], note: 'One point for each coin the loser has left, three for the queen.' }),
  // takes the shot a simple ghost-coin aim thinks is best, with a human-sized wobble
  bot(s, seat, rng) {
    const color = mineColor(seat);
    const targets = s.coins.filter(c => colorOf(c.id) === color || (c.id === 'q' && s.queen < 0));
    const options = [];
    const sy = baseY(seat);
    for (const c of targets) {
      for (const [px, py] of POCKETS) {
        const dx = px - c.x, dy = py - c.y, d = Math.hypot(dx, dy);
        // the "ghost": where the striker must be at the moment it hits, to send the coin to the pocket
        const gx = c.x - (dx / d) * (R + STRIKER_R), gy = c.y - (dy / d) * (R + STRIKER_R);
        for (let k = -3; k <= 3; k++) {
          const sx = (k / 3) * BASE_X;
          const toGhost = Math.hypot(gx - sx, gy - sy);
          const cos = ((gx - sx) * dx + (gy - sy) * dy) / (toGhost * d);
          if (cos < 0.35) continue;
          options.push({ x: sx, a: Math.atan2(gy - sy, gx - sx), p: Math.min(1, 0.42 + (toGhost + d) * 0.22), value: cos * 2 - d * 0.4 + (c.id === 'q' ? 0.35 : 0) });
        }
      }
    }
    const blast = { x: (rng() - 0.5) * BASE_X, a: seat === 0 ? -Math.PI / 2 : Math.PI / 2, p: 0.85 };
    if (!options.length) return blast;
    const top = best(options, o => o.value, rng);
    return { x: top.x, a: top.a + (rng() - 0.5) * 0.06, p: top.p };
  },
  ui(v, ctx) {
    const left = [count(v.coins, 'w'), count(v.coins, 'b')];
    return {
      title: turnLine(ctx, 'aim and shoot'),
      lead: `${ctx.names[0]} ⚪ ${left[0]} · ${ctx.names[1]} ⚫ ${left[1]}${v.note ? ` · ${v.note}` : ''}`,
      aim: ctx.active.includes(ctx.me),
    };
  },
};
