/**
 * Flying Chit: a folded paper chit with wings glides through a classroom that goes on for ever.
 * You steer it in every direction. Flying through a bangle keeps it in the air and builds a combo;
 * ceiling fans and stacks of books knock the paper out of it. It never ends: the chit just runs
 * out of lift sooner or later, and the room gets faster and busier the further you get.
 *
 * x and y go from -1 to 1 across the space in front of you; z is distance ahead.
 */
import { H, r1, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261110-0936';

export const AHEAD = 70;
export const speedAt = (d) => Math.min(27, 10 + d * 0.01);
const hoopSize = (d) => Math.max(0.17, 0.34 - d * 0.00007);
const r2 = (v) => Math.round(v * 100) / 100;
function spawn(s) {
  const lvl = Math.min(1, s.d / 1700);
  const x = r2(rnd(s) * 1.8 - 0.9), y = r2(rnd(s) * 1.5 - 0.75);
  s.objs.push({ k: 'hoop', z: r1(s.at), x, y, r: r2(hoopSize(s.d)) });
  // something in the way, more often the further you are
  if (rnd(s) < 0.35 + lvl * 0.45) {
    const k = rnd(s) < 0.5 ? 'fan' : 'book';
    s.objs.push({ k, z: r1(s.at + 3 + rnd(s) * 3), x: r2(Math.max(-0.9, Math.min(0.9, x + (rnd(s) - 0.5) * 1.2))), y: r2(Math.max(-0.75, Math.min(0.75, y + (rnd(s) - 0.5) * 0.9))), r: k === 'fan' ? 0.36 : 0.28 });
  }
  s.at += 8.5 - lvl * 2;
}
export default {
  hint: 'Drag to fly',
  pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶']],
  analog: 'xy',
  init({ n, seed }) {
    const s = { n, seed, t: 0, d: 0, at: 22, objs: [], ev: [],
      chits: seats(n).map(i => ({ x: r2((i - (n - 1) / 2) * 0.35), y: 0, vx: 0, vy: 0, alive: true, score: 0, lift: 1, combo: 0, hit: 0, best: 0 })) };
    while (s.at < AHEAD) spawn(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    const from = s.d;
    s.d = Math.round((s.d + speedAt(s.d) * TICK) * 100) / 100;
    while (s.at < s.d + AHEAD) spawn(s);
    s.objs = s.objs.filter(o => o.z > s.d - 2);
    const drain = 0.05 + Math.min(0.06, s.d * 0.00002);
    s.chits.forEach((c, i) => {
      if (!c.alive) { c.y = r2(Math.max(-1.2, c.y - 0.02)); return; }
      const inp = inputs[i] || {};
      const ix = Number.isFinite(inp.x) ? inp.x : (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
      const iy = Number.isFinite(inp.y) ? -inp.y : (inp.u ? 1 : 0) - (inp.d ? 1 : 0);
      c.vx += (Math.max(-1, Math.min(1, ix)) * 1.9 - c.vx) * 0.16;
      c.vy += (Math.max(-1, Math.min(1, iy)) * 1.9 - c.vy) * 0.16;
      c.x = r2(Math.max(-1, Math.min(1, c.x + c.vx * TICK)));
      c.y = r2(Math.max(-0.85, Math.min(0.85, c.y + c.vy * TICK)));
      c.lift = Math.round((c.lift - drain * TICK) * 1000) / 1000;
      if (c.hit > 0) c.hit -= 1;
      for (const o of s.objs) {
        if (!(o.z > from && o.z <= s.d)) continue;
        const dist = Math.hypot(c.x - o.x, c.y - o.y);
        if (o.k === 'hoop') {
          if (dist < o.r) {
            c.combo += 1;
            c.best = Math.max(c.best, c.combo);
            c.score += Math.min(5, c.combo);
            c.lift = Math.min(1, c.lift + Math.max(0.1, 0.24 - s.d * 0.00005));
            s.ev.push({ k: 'star', seat: i, combo: c.combo });
          } else if (c.combo) { c.combo = 0; s.ev.push({ k: 'miss', seat: i }); }
        } else if (dist < o.r + 0.1 && c.hit <= 0) {
          c.lift -= 0.34;
          c.combo = 0;
          c.hit = 40;
          s.ev.push({ k: 'hit', seat: i, victim: i });
        }
      }
      if (c.lift <= 0) { c.lift = 0; c.alive = false; s.ev.push({ k: 'crash', seat: i }); }
    });
  },
  revive(s, seat) {
    const c = s.chits[seat];
    Object.assign(c, { alive: true, lift: 0.6, hit: 90, combo: 0, vx: 0, vy: 0 });
    s.objs = s.objs.filter(o => o.k === 'hoop' || o.z > s.d + 14);
  },
  over(s) {
    if (s.chits.some(c => c.alive)) return null;
    const scores = s.chits.map(c => c.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // heads for the next bangle, swerves round anything in the way, and is never quite exact
  bot(s, seat) {
    const c = s.chits[seat];
    if (!c?.alive) return {};
    const hoop = s.objs.find(o => o.k === 'hoop' && o.z > s.d + 1);
    if (!hoop) return {};
    const wobble = Math.sin(s.t / 23 + seat * 2) * (0.1 + s.d * 0.00008);
    let tx = hoop.x + wobble, ty = hoop.y - wobble * 0.6;
    const block = s.objs.find(o => o.k !== 'hoop' && o.z > s.d && o.z < hoop.z && Math.hypot(o.x - tx, o.y - ty) < o.r + 0.12);
    if (block) { tx += Math.sign(tx - block.x || 1) * 0.35; }
    return { x: Math.max(-1, Math.min(1, (tx - c.x) * 3)), y: Math.max(-1, Math.min(1, -(ty - c.y) * 3)) };
  },
  hud(g, s, names) {
    scoreBar(g, s.chits.map((c, i) => [names[i] || `P${i + 1}`, c.alive ? c.score : `${c.score} ✕`, SEAT_COLORS[i]]));
    // how much lift is left: the chit's wings
    s.chits.forEach((c, i) => {
      const w = (W - 24) / s.n;
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(12 + i * w, 38, w - 12, 7);
      g.fillStyle = c.lift > 0.3 ? '#7dff9a' : '#ff6b5b';
      g.fillRect(12 + i * w, 38, (w - 12) * Math.max(0, c.lift), 7);
      if (c.combo > 1 && c.alive) { g.fillStyle = '#fff'; g.font = '800 22px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(`×${Math.min(5, c.combo)}`, 12 + i * w + (w - 12) / 2, 70); }
    });
  },
  // without 3D: the same space, in perspective
  draw(g, s, names) {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#9fd3ff'); sky.addColorStop(1, '#f4edd8');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const proj = (x, y, z) => { const k = 3 / (z + 3); return [W / 2 + x * 260 * k, H / 2 + 10 - y * 160 * k, k]; };
    [...s.objs].reverse().forEach((o) => {
      const z = o.z - s.d;
      if (z < 0) return;
      const [px, py, k] = proj(o.x, o.y, z);
      if (o.k === 'hoop') { g.strokeStyle = '#e7a800'; g.lineWidth = Math.max(2, 10 * k); g.beginPath(); g.arc(px, py, o.r * 260 * k, 0, 7); g.stroke(); }
      else { g.fillStyle = o.k === 'fan' ? '#555' : '#c0392b'; g.beginPath(); g.arc(px, py, o.r * 230 * k, 0, 7); g.fill(); }
    });
    s.chits.forEach((c, i) => {
      const [px, py] = proj(c.x, c.y, 0.4);
      g.fillStyle = c.alive ? '#fbf3d9' : '#aaa'; g.strokeStyle = SEAT_COLORS[i]; g.lineWidth = 3;
      g.fillRect(px - 16, py - 10, 32, 20); g.strokeRect(px - 16, py - 10, 32, 20);
    });
    this.hud(g, s, names);
  },
};
