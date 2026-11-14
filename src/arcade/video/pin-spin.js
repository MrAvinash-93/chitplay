/**
 * Pin Spin: a round corkboard spins on the classroom wall; tap to push a pin into it. Every pin has to
 * land between the ones already there; touch one and the run is over. Use up a level's pins to fill
 * the board and go up a level: faster spins, changes of direction, pins already in the way. Every
 * fifth level is a big board that spins in fits and starts. Gold star stickers on the board are worth
 * a bonus. Endless: how far can you get?
 *
 * Angles are measured in the board's own frame. A pin always arrives at the bottom of the screen.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1428';

const TAU = Math.PI * 2;
export const FLY = 7;          // ticks a pin is in the air
export const GAP = 0.2;        // how close two pins can be, in radians
export const LEVEL_TICKS = 60 * 20;   // twenty seconds a level: nobody can stall a table for ever
const r3 = (v) => Math.round(v * 1000) / 1000;
const norm = (a) => ((a % TAU) + TAU) % TAU;
const diff = (a, b) => { let d = norm(a - b); if (d > Math.PI) d -= TAU; return d; };
export const pinsFor = (level) => 6 + Math.min(4, Math.floor(level / 2));
export const isBigBoard = (level) => level % 5 === 0;
/** How fast the board turns at this moment, in radians a second. */
export function spinAt(level, t) {
  const base = 1.5 + Math.min(2.2, level * 0.14);
  if (isBigBoard(level)) return base * 1.15 * Math.sign(Math.sin(t / 95)) * (0.6 + 0.4 * Math.abs(Math.sin(t / 37)));
  if (level % 3 === 2) return base * (0.55 + 0.45 * Math.sin(t / 60));                    // speeds up and slows down
  if (level % 3 === 0) return base * (Math.floor(t / 150) % 2 ? -1 : 1);                   // changes direction
  return base;
}
function setLevel(s, p) {
  p.pins = pinsFor(p.level);
  p.stuck = [];
  p.stars = [];
  p.lt = 0;
  // pins already in it, more on later levels
  const pre = Math.min(5, Math.floor((p.level - 1) / 1.5));
  for (let i = 0; i < pre; i++) {
    let a = 0;
    for (let k = 0; k < 20; k++) { a = r3(rnd(s) * TAU); if (p.stuck.every(x => Math.abs(diff(a, x)) > GAP * 2)) break; }
    p.stuck.push(a);
  }
  if (rnd(s) < 0.7) {
    let a = r3(rnd(s) * TAU);
    for (let k = 0; k < 20 && p.stuck.some(x => Math.abs(diff(a, x)) < GAP * 2); k++) a = r3(rnd(s) * TAU);
    p.stars.push(a);
  }
}
const arriving = (p) => norm(-Math.PI / 2 - p.rot);

/** A five-pointed star, for the flat picture. */
function star(g, x, y, r) {
  g.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath();
}

export default {
  hint: 'Tap to pin',
  pad: [['a', '📌 Pin']],
  tapToPlay: true,
  init({ n, seed }) {
    const s = { n, seed, t: 0, ev: [], players: seats(n).map(() => ({ level: 1, rot: 0, alive: true, score: 0, fly: 0, was: false, hitAt: null, lt: 0, pop: 0, popAt: -999 })) };
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
      if (pressed && !p.was && p.fly === 0 && p.pins > 0) { p.fly = FLY; s.ev.push({ k: 'flap', seat: i }); }
      p.was = pressed;
      if (p.fly > 0 && --p.fly === 0) {
        const a = arriving(p);
        if (p.stuck.some(x => Math.abs(diff(a, x)) < GAP)) { p.alive = false; p.hitAt = r3(a); s.ev.push({ k: 'crash', seat: i }); return; }
        p.stuck.push(r3(a));
        p.pins -= 1;
        p.score += 1;
        p.pop = 1; p.popAt = s.t;
        s.ev.push({ k: 'pass', seat: i });
        const hit = p.stars.findIndex(x => Math.abs(diff(a, x)) < 0.26);
        if (hit >= 0) { p.stars.splice(hit, 1); p.score += 5; p.pop += 5; s.ev.push({ k: 'star', seat: i }); }
        if (p.pins === 0) {
          p.score += p.level * 2;
          p.pop += p.level * 2;
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
    const alive = s.players.map((p, i) => p.alive ? i : -1).filter(i => i >= 0);
    if (s.n > 1 && alive.length === 1) return { scores: s.players.map(p => p.score), winners: alive, endless: true };
    if (alive.length) return null;
    const scores = s.players.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // pins when the spot that will be at the bottom on arrival is clear, and gets less exact as it climbs
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
    // the pins left this level, along the bottom
    s.players.forEach((p, i) => {
      const w = W / s.n, x0 = i * w + 14;
      for (let k = 0; k < p.pins; k++) { g.fillStyle = '#c9ced6'; g.fillRect(x0 + k * 12 + 3, H - 24, 2, 14); g.fillStyle = SEAT_COLORS[i]; g.beginPath(); g.arc(x0 + k * 12 + 4, H - 28, 5, 0, TAU); g.fill(); }
      if (p.alive) { const left = 1 - p.lt / LEVEL_TICKS; g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x0, H - 46, w - 28, 5); g.fillStyle = left > 0.3 ? '#7dff9a' : '#ff6b5b'; g.fillRect(x0, H - 46, (w - 28) * Math.max(0, left), 5); }
      const age = s.t - p.popAt;
      if (age >= 0 && age < 40) { g.save(); g.globalAlpha = 1 - age / 40; g.font = `900 ${p.pop >= 5 ? 32 : 26}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; g.fillStyle = p.pop >= 5 ? '#ffd23f' : '#fff'; const y = 70 - age * 0.5; g.strokeText(`+${p.pop}`, x0 + (w - 28) / 2 + 14, y); g.fillText(`+${p.pop}`, x0 + (w - 28) / 2 + 14, y); g.restore(); }
      if (isBigBoard(p.level) && p.alive) { g.fillStyle = '#ffd23f'; g.font = '800 15px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText('BIG BOARD', x0, H - 52); }
    });
  },
  draw(g, s, names) {
    g.fillStyle = '#20352a'; g.fillRect(0, 0, W, H);
    s.players.forEach((p, i) => {
      const cx = (W / s.n) * (i + 0.5), cy = 170, r = Math.min(90, (W / s.n) * 0.32);
      g.save(); g.translate(cx, cy); g.rotate(-p.rot);
      g.fillStyle = isBigBoard(p.level) ? '#b5341f' : '#c89b62'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
      g.strokeStyle = '#7a5530'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, r - 3, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(90,60,30,.35)'; for (let k = 0; k < 40; k++) { const a = k * 2.4, d = (k * 37) % (r - 10); g.fillRect(Math.cos(a) * d, Math.sin(a) * d, 2, 2); }
      p.stars.forEach((a) => { g.fillStyle = '#ffd23f'; star(g, Math.cos(a) * (r - 18), -Math.sin(a) * (r - 18), 11); g.fill(); });
      p.stuck.forEach((a) => {
        const x = Math.cos(a), y = -Math.sin(a);
        g.strokeStyle = '#c9ced6'; g.lineWidth = 2; g.beginPath(); g.moveTo(x * (r - 6), y * (r - 6)); g.lineTo(x * (r + 22), y * (r + 22)); g.stroke();
        g.fillStyle = SEAT_COLORS[i]; g.beginPath(); g.arc(x * (r + 26), y * (r + 26), 7, 0, TAU); g.fill();
      });
      g.restore();
      const y = p.fly > 0 ? cy + r + 22 + (p.fly / FLY) * 90 : H - 74;
      if (p.alive && p.pins > 0) { g.fillStyle = '#c9ced6'; g.fillRect(cx - 1, y, 2, 24); g.fillStyle = SEAT_COLORS[i]; g.beginPath(); g.arc(cx, y + 28, 8, 0, TAU); g.fill(); }
    });
    this.hud(g, s, names);
  },
};
