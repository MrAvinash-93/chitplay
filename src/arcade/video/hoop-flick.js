/**
 * Hoop Flick: pull back and let go to throw the ball into the next hoop. Through the hoop without
 * touching the rim is a swish: swishes in a row build a combo. Then the next hoop appears on the
 * other side, higher or lower, and later on the hoops start to move. Miss once and it's over.
 * Endless. 1 or 2 players, each on their own half of the court.
 *
 * Every five baskets is a new level: first the hoops stand still, then they slide from side to
 * side, then a wind blows across the court (the arrow shows which way and how hard), then both.
 *
 * Side view, in screen pixels: x to the right, y down. Gravity pulls down (+y).
 */
import { H, levelTag, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1334';

export const PER_LEVEL = 5;
export const STAGES = ['Still hoops', 'Moving hoops', 'Windy court', 'Wind and moving hoops'];
export const levelOf = (made) => 1 + Math.floor(made / PER_LEVEL);
export const stageName = (level) => STAGES[Math.min(level, STAGES.length) - 1];
/** How far a hoop slides, and how hard the wind blows (pixels a second, each second), at a level. */
export function courtAt(level) {
  return {
    move: level === 2 ? 22 : level >= 4 ? Math.min(60, 22 + (level - 4) * 8) : 0,
    wind: level >= 3 ? Math.min(240, 90 + (level - 3) * 30) : 0,
  };
}

export const G = 1100, MAX = 1050;
const BALL = 13, RIM = 30, SHOT_TICKS = 60 * 12;
const r1 = (v) => Math.round(v * 10) / 10;
export const laneOf = (s, i) => ({ x0: (W / s.n) * i, w: W / s.n });
function placeHoop(s, p, side) {
  const { x0, w } = laneOf(s, p.i);
  const x = x0 + (side < 0 ? w * 0.24 : w * 0.76);
  const y = 130 + rnd(s) * 170;
  const court = courtAt(p.level || 1);
  const wind = court.wind ? r1((rnd(s) < 0.5 ? -1 : 1) * court.wind * (0.6 + rnd(s) * 0.4)) : 0;
  return { x: r1(x), y: r1(y), side, move: court.move, ph: r1(rnd(s) * 6), wind };
}
function rest(s, p, hoop) {
  p.ball = { x: hoop.x, y: hoop.y - 4, vx: 0, vy: 0 };
  p.flying = false;
  p.home = hoop;
  p.next = placeHoop(s, p, -hoop.side);
  p.clock = 0;
}
const hoopX = (s, h) => h.x + (h.move ? Math.sin(s.t / 60 + h.ph) * h.move : 0);

export default {
  hint: 'Pull back, then let go',
  pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶'], ['a', '🏀 Shoot']],
  analog: 'xy',
  init({ n, seed }) {
    const s = { n, seed, t: 0, ev: [], players: [] };
    s.players = seats(n).map((i) => ({ i, alive: true, score: 0, pop: 0, popAt: -999, made: 0, level: 1, levelAt: -999, combo: 0, aimX: 0.4, aimY: 0.7, pulled: false, was: false, touched: false, clock: 0 }));
    s.players.forEach((p) => { const { x0, w } = laneOf(s, p.i); rest(s, p, { x: r1(x0 + w * 0.24), y: 270, side: -1, move: 0, ph: 0, wind: 0 }); });
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    s.players.forEach((p, i) => {
      if (!p.alive) return;
      const inp = inputs[i] || {};
      if (!p.flying) {
        p.clock += 1;
        if (p.clock > SHOT_TICKS) { p.alive = false; s.ev.push({ k: 'crash', seat: i }); return; }
        let fire = false;
        if (Number.isFinite(inp.ang)) { p.aimX = Math.cos(inp.ang) * inp.pow; p.aimY = Math.sin(inp.ang) * inp.pow; fire = !!inp.a; }
        // arrow keys arrive as whole numbers (-1, 0, 1); a stick or gamepad never does
        else if (Number.isFinite(inp.x) && !(Number.isInteger(inp.x) && Number.isInteger(inp.y)) && (Math.abs(inp.x) > 0.08 || Math.abs(inp.y) > 0.08)) {
          // the stick is the pull: drag back, the ball goes the other way
          p.aimX = -inp.x; p.aimY = inp.y; p.pulled = Math.hypot(inp.x, inp.y) > 0.25;
        } else if (p.pulled && !inp.x && !inp.y) { fire = true; p.pulled = false; }   // let go of the stick: throw
        else {
          // keys: left/right turn the aim, up/down change the power
          const a = Math.atan2(p.aimY, p.aimX), pw = Math.hypot(p.aimX, p.aimY) || 0.7;
          const na = a + ((inp.l ? 1 : 0) - (inp.r ? 1 : 0)) * 1.6 * TICK, np = Math.max(0.25, Math.min(1, pw + ((inp.u ? 1 : 0) - (inp.d ? 1 : 0)) * 0.6 * TICK));
          p.aimX = Math.cos(na) * np; p.aimY = Math.sin(na) * np;
        }
        if (inp.a && !p.was) fire = true;
        p.was = !!inp.a;
        if (fire) {
          p.ball.vx = p.aimX * MAX; p.ball.vy = -p.aimY * MAX;   // aimY up is positive; screen y goes down
          p.flying = true; p.touched = false;
          s.ev.push({ k: 'flap', seat: i });
        }
        return;
      }
      const b = p.ball;
      b.vy += G * TICK;
      b.vx += (p.next.wind || 0) * TICK;
      b.x += b.vx * TICK; b.y += b.vy * TICK;
      const { x0, w } = laneOf(s, p.i);
      if (b.x < x0 + BALL) { b.x = x0 + BALL; b.vx = Math.abs(b.vx) * 0.7; }
      if (b.x > x0 + w - BALL) { b.x = x0 + w - BALL; b.vx = -Math.abs(b.vx) * 0.7; }
      const h = p.next, hx = hoopX(s, h);
      // the rim: two hard points either side of the hoop
      [hx - RIM, hx + RIM].forEach((rx) => {
        const dx = b.x - rx, dy = b.y - h.y, d = Math.hypot(dx, dy);
        if (d < BALL + 3 && d > 0) {
          const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          if (dot < 0) { b.vx -= 1.6 * dot * nx; b.vy -= 1.6 * dot * ny; p.touched = true; }
          b.x = rx + nx * (BALL + 3); b.y = h.y + ny * (BALL + 3);
        }
      });
      // through the hoop, going down
      const prevY = b.y - b.vy * TICK;
      if (b.vy > 0 && prevY < h.y && b.y >= h.y && Math.abs(b.x - hx) < RIM - 4) {
        const swish = !p.touched;
        p.combo = swish ? p.combo + 1 : 0;
        const pts = swish ? 1 + Math.min(4, p.combo) : 1;
        p.score += pts;
        p.pop = pts; p.popAt = s.t;
        p.made += 1;
        s.ev.push({ k: 'star', seat: i, combo: swish ? p.combo : 0 });
        if (levelOf(p.made) > p.level) {
          p.level = levelOf(p.made);
          p.levelAt = s.t;
          s.ev.push({ k: 'level', seat: i, level: p.level, name: stageName(p.level) });
        }
        rest(s, p, { ...h, x: hx, move: 0, wind: 0 });
        return;
      }
      if (b.y > H + 40) { p.alive = false; p.combo = 0; s.ev.push({ k: 'crash', seat: i }); }
      b.x = r1(b.x); b.y = r1(b.y); b.vx = r1(b.vx); b.vy = r1(b.vy);
    });
  },
  revive(s, seat) { const p = s.players[seat]; p.alive = true; rest(s, p, p.home); },
  over(s) {
    const alive = s.players.map((p, i) => p.alive ? i : -1).filter(i => i >= 0);
    if (s.n > 1 && alive.length === 1) return { scores: s.players.map(p => p.score), winners: alive, endless: true };
    if (alive.length) return null;
    const scores = s.players.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // works out the throw that drops the ball into the hoop, then misjudges it a little
  bot(s, seat) {
    const p = s.players[seat];
    if (!p?.alive || p.flying || p.clock < 30) return {};
    const h = p.next, T = 0.85 + ((s.t + seat * 7) % 9) * 0.02;
    const tx = h.x + (h.move ? Math.sin((s.t + T * 60) / 60 + h.ph) * h.move : 0), ty = h.y - 6;   // where the hoop will be when the ball gets there
    // the wind pushes the ball sideways all the way: allow for it
    const vx = (tx - p.ball.x - 0.5 * (h.wind || 0) * T * T) / T, vy = (ty - p.ball.y - 0.5 * G * T * T) / T;
    const err = 1 + (Math.sin(s.t / 13 + seat) * (0.012 + Math.min(0.035, p.score * 0.0012)));
    const ang = Math.atan2(-vy * err, vx * err), pow = Math.min(1, Math.hypot(vx, vy) * err / MAX);
    return { ang, pow, a: true };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [names[i] || `P${i + 1}`, p.alive ? p.score : `${p.score} ✕`, SEAT_COLORS[i]]));
    s.players.forEach((p) => {
      const { x0, w } = laneOf(s, p.i);
      if (p.combo > 1 && p.alive) { g.fillStyle = '#ffd23f'; g.font = '900 26px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(`SWISH ×${p.combo}`, x0 + w / 2, 72); }
      // the points a basket just gave, rising over the court
      const age = s.t - p.popAt;
      if (age >= 0 && age < 45) { g.save(); g.globalAlpha = 1 - age / 45; g.font = '900 30px system-ui, sans-serif'; g.textAlign = 'center'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 5; g.fillStyle = '#fff'; const y = 170 - age * 0.7; g.strokeText(`+${p.pop}`, x0 + w / 2, y); g.fillText(`+${p.pop}`, x0 + w / 2, y); g.restore(); }
      // the wind: an arrow along the top of this player's half
      if (p.alive && p.next.wind) {
        const dir = Math.sign(p.next.wind), len = 18 + Math.abs(p.next.wind) / 6, cx = x0 + w / 2, y = 122;
        g.strokeStyle = '#bfe9ff'; g.fillStyle = '#bfe9ff'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(cx - (dir * len) / 2, y); g.lineTo(cx + (dir * len) / 2, y); g.stroke();
        g.beginPath(); g.moveTo(cx + (dir * len) / 2 + dir * 10, y); g.lineTo(cx + (dir * len) / 2 - dir * 2, y - 8); g.lineTo(cx + (dir * len) / 2 - dir * 2, y + 8); g.closePath(); g.fill();
        g.font = '700 14px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('Wind', cx, y - 16);
      }
      if (s.n === 1) levelTag(g, p.level, stageName(p.level), s.t - p.levelAt);
      else { g.fillStyle = '#ffd23f'; g.font = '800 14px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(`Level ${p.level}`, x0 + w / 2, 50); }
      if (p.alive && !p.flying) {
        const left = 1 - p.clock / SHOT_TICKS;
        if (left < 0.5) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x0 + 10, H - 12, w - 20, 5); g.fillStyle = '#ff6b5b'; g.fillRect(x0 + 10, H - 12, (w - 20) * left, 5); }
      }
    });
  },
  draw(g, s, names) {
    g.fillStyle = '#20324a'; g.fillRect(0, 0, W, H);
    s.players.forEach((p, i) => {
      const { x0 } = laneOf(s, p.i);
      if (i) { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x0, 40, 2, H); }
      [p.home, p.next].forEach((h, k) => { const hx = k ? hoopX(s, h) : h.x; g.strokeStyle = '#ff7a1a'; g.lineWidth = 5; g.beginPath(); g.moveTo(hx - RIM, h.y); g.lineTo(hx + RIM, h.y); g.stroke(); });
      if (!p.flying && p.alive) { g.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 1; k < 9; k++) { const t = k * 0.07; g.beginPath(); g.arc(p.ball.x + p.aimX * MAX * t + 0.5 * (p.next.wind || 0) * t * t, p.ball.y - p.aimY * MAX * t + 0.5 * G * t * t, 3, 0, 7); g.fill(); } }
      g.fillStyle = p.alive ? '#e8742a' : '#777'; g.beginPath(); g.arc(p.ball.x, p.ball.y, BALL, 0, 7); g.fill();
    });
    this.hud(g, s, names);
  },
};
