/**
 * Knife Throw: a wooden target spins; tap to throw a knife into it. Every knife has to land between
 * the ones already there; touch one and the run is over. Throw all of a level's knives to break the
 * target and go up a level: faster spins, changes of direction, knives already in the way. Every
 * fifth level is a boss target. Apples on the rim are worth a bonus. Endless: how far can you get?
 *
 * Angles are measured in the target's own frame. A knife always arrives at the bottom of the screen.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261110-0911';

const TAU = Math.PI * 2;
const FLY = 7;                 // ticks a knife is in the air
const GAP = 0.2;               // how close two knives can be, in radians
export const LEVEL_TICKS = 60 * 20;   // twenty seconds a level: nobody can stall a table for ever
const r3 = (v) => Math.round(v * 1000) / 1000;
const norm = (a) => ((a % TAU) + TAU) % TAU;
const diff = (a, b) => { let d = norm(a - b); if (d > Math.PI) d -= TAU; return d; };
export const knivesFor = (level) => 6 + Math.min(4, Math.floor(level / 2));
export const isBoss = (level) => level % 5 === 0;
/** How fast the target turns at this moment, in radians a second. */
export function spinAt(level, t) {
  const base = 1.5 + Math.min(2.2, level * 0.14);
  if (isBoss(level)) return base * 1.15 * Math.sign(Math.sin(t / 95)) * (0.6 + 0.4 * Math.abs(Math.sin(t / 37)));
  if (level % 3 === 2) return base * (0.55 + 0.45 * Math.sin(t / 60));                    // speeds up and slows down
  if (level % 3 === 0) return base * (Math.floor(t / 150) % 2 ? -1 : 1);                   // changes direction
  return base;
}
function setLevel(s, p) {
  p.knives = knivesFor(p.level);
  p.stuck = [];
  p.apples = [];
  p.lt = 0;
  // knives already stuck in it, more on later levels
  const pre = Math.min(5, Math.floor((p.level - 1) / 1.5));
  for (let i = 0; i < pre; i++) {
    let a = 0;
    for (let k = 0; k < 20; k++) { a = r3(rnd(s) * TAU); if (p.stuck.every(x => Math.abs(diff(a, x)) > GAP * 2)) break; }
    p.stuck.push(a);
  }
  if (rnd(s) < 0.7) {
    let a = r3(rnd(s) * TAU);
    for (let k = 0; k < 20 && p.stuck.some(x => Math.abs(diff(a, x)) < GAP * 2); k++) a = r3(rnd(s) * TAU);
    p.apples.push(a);
  }
}
const arriving = (p) => norm(-Math.PI / 2 - p.rot);

export default {
  hint: 'Tap to throw',
  pad: [['a', '🔪 Throw']],
  tapToPlay: true,
  init({ n, seed }) {
    const s = { n, seed, t: 0, ev: [], players: seats(n).map(() => ({ level: 1, rot: 0, alive: true, score: 0, fly: 0, was: false, hitAt: null, lt: 0 })) };
    s.players.forEach(p => setLevel(s, p));
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    s.players.forEach((p, i) => {
      if (!p.alive) return;
      p.lt += 1;
      if (p.lt > LEVEL_TICKS) { p.alive = false; p.hitAt = null; s.ev.push({ k: 'crash', seat: i, slow: true }); return; }
      p.rot = r3(norm(p.rot + spinAt(p.level, p.lt) * TICK));
      const pressed = !!inputs[i]?.a;
      if (pressed && !p.was && p.fly === 0 && p.knives > 0) { p.fly = FLY; s.ev.push({ k: 'flap', seat: i }); }
      p.was = pressed;
      if (p.fly > 0 && --p.fly === 0) {
        const a = arriving(p);
        if (p.stuck.some(x => Math.abs(diff(a, x)) < GAP)) { p.alive = false; p.hitAt = r3(a); s.ev.push({ k: 'crash', seat: i }); return; }
        p.stuck.push(r3(a));
        p.knives -= 1;
        p.score += 1;
        s.ev.push({ k: 'pass', seat: i });
        const apple = p.apples.findIndex(x => Math.abs(diff(a, x)) < 0.26);
        if (apple >= 0) { p.apples.splice(apple, 1); p.score += 5; s.ev.push({ k: 'star', seat: i }); }
        if (p.knives === 0) {
          p.score += p.level * 2;
          s.ev.push({ k: 'round', seat: i, level: p.level });
          p.level += 1;
          setLevel(s, p);
        }
      }
    });
  },
  revive(s, seat) {
    const p = s.players[seat];
    p.alive = true;
    if (p.hitAt != null) p.stuck = p.stuck.filter(x => Math.abs(diff(x, p.hitAt)) > 0.5);
    p.fly = 0;
    p.lt = 0;
  },
  over(s) {
    if (s.players.some(p => p.alive)) return null;
    const scores = s.players.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // throws when the spot that will be at the bottom on arrival is clear, and gets less exact as it climbs
  bot(s, seat) {
    const p = s.players[seat];
    if (!p?.alive || p.fly > 0) return {};
    const ahead = norm(-Math.PI / 2 - (p.rot + spinAt(p.level, p.lt) * TICK * FLY));
    const margin = GAP + 0.08 - Math.min(0.12, p.level * 0.012) + Math.sin(s.t / 17 + seat) * 0.05;
    const clear = p.stuck.every(x => Math.abs(diff(ahead, x)) > margin);
    return { a: clear && (s.t + seat * 3) % 9 === 0 };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [`${names[i] || `P${i + 1}`} L${p.level}`, p.alive ? p.score : `${p.score} ✕`, SEAT_COLORS[i]]));
    // the knives left this level, along the bottom
    s.players.forEach((p, i) => {
      const w = W / s.n, x0 = i * w + 14;
      for (let k = 0; k < p.knives; k++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x0 + k * 11, H - 30, 5, 20); g.fillStyle = '#3a2412'; g.fillRect(x0 + k * 11, H - 14, 5, 8); }
      if (p.alive) { const left = 1 - p.lt / LEVEL_TICKS; g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x0, H - 46, w - 28, 5); g.fillStyle = left > 0.3 ? '#7dff9a' : '#ff6b5b'; g.fillRect(x0, H - 46, (w - 28) * Math.max(0, left), 5); }
      if (isBoss(p.level) && p.alive) { g.fillStyle = '#ff6b5b'; g.font = '800 15px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText('BOSS', x0, H - 52); }
    });
  },
  draw(g, s, names) {
    g.fillStyle = '#1b1430'; g.fillRect(0, 0, W, H);
    s.players.forEach((p, i) => {
      const cx = (W / s.n) * (i + 0.5), cy = 170, r = Math.min(90, (W / s.n) * 0.32);
      g.save(); g.translate(cx, cy); g.rotate(-p.rot);
      g.fillStyle = isBoss(p.level) ? '#7a4a8a' : '#9c6b3e'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
      g.strokeStyle = '#6b4223'; g.lineWidth = 3; [0.35, 0.65].forEach(k => { g.beginPath(); g.arc(0, 0, r * k, 0, TAU); g.stroke(); });
      p.apples.forEach((a) => { g.fillStyle = '#e53935'; g.beginPath(); g.arc(Math.cos(a) * (r + 8), -Math.sin(a) * (r + 8), 8, 0, TAU); g.fill(); });
      p.stuck.forEach((a) => { g.strokeStyle = '#e8eef3'; g.lineWidth = 4; g.beginPath(); g.moveTo(Math.cos(a) * r, -Math.sin(a) * r); g.lineTo(Math.cos(a) * (r + 34), -Math.sin(a) * (r + 34)); g.stroke(); });
      g.restore();
      const y = p.fly > 0 ? cy + r + 34 + (p.fly / FLY) * 90 : H - 70;
      if (p.alive && p.knives > 0) { g.fillStyle = '#e8eef3'; g.fillRect(cx - 3, y, 6, 32); g.fillStyle = '#3a2412'; g.fillRect(cx - 4, y + 32, 8, 14); }
    });
    this.hud(g, s, names);
  },
};
