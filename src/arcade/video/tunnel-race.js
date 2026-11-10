/**
 * Tunnel Race: a paper plane flying down a tunnel that never ends. Steer round the inside of the
 * tunnel to slip past the walls, collect gems, and keep going: it gets a little faster as you go.
 *
 * The tunnel comes in levels: first plain walls and gaps, then twin walls on both sides, then walls
 * that turn as they come at you. Every new level opens with a ring of gems all the way round.
 *
 * Angles are in radians round the tunnel; distance is in tunnel units.
 */
import { H, levelTag, r1, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261110-1504';

export const LEVEL_D = 360;
export const STAGES = ['Paper tunnel', 'Twin walls', 'Turning walls', 'Spin cycle'];
export const levelOf = (d) => 1 + Math.floor(d / LEVEL_D);
export const stageName = (level) => STAGES[Math.min(level, STAGES.length) - 1];

export const AHEAD = 60;
const TAU = Math.PI * 2;
const PLANE = 0.16;                       // half the plane's width, as an angle
export const speedAt = (d) => Math.min(30, 12 + d * 0.006);
const angDiff = (a, b) => { let x = (a - b) % TAU; if (x > Math.PI) x -= TAU; if (x < -Math.PI) x += TAU; return x; };
const r3 = (v) => Math.round(v * 1000) / 1000;

/** Does this obstacle touch a plane at angle a? */
export function blocks(o, a) {
  const d = Math.abs(angDiff(a, o.c));
  if (o.k === 'wall') return d < o.w / 2 + PLANE;
  if (o.k === 'gap') return d > o.w / 2 - PLANE;
  return d < o.w / 2 + PLANE || Math.abs(angDiff(a, o.c + Math.PI)) < o.w / 2 + PLANE;   // 'twin'
}
function spawn(s) {
  const lvl = Math.min(1, s.d / 2600), level = s.level || 1;
  // a new level: a ring of gems all the way round, and a little room before the next wall
  if (s.ring) {
    s.ring = false;
    for (let k = 0; k < 8; k++) s.gems.push({ z: r1(s.at), a: r3((k * TAU) / 8) });
    s.at += 10;
    return;
  }
  const roll = rnd(s);
  const c = r3(rnd(s) * TAU);
  let o;
  if (roll < 0.5 || (level < 2 && roll >= 0.85)) o = { k: 'wall', c, w: r3(1.1 + lvl * 1.2 + rnd(s) * 0.4) };
  else if (roll < 0.85) o = { k: 'gap', c, w: r3(Math.max(1.4, 2.9 - lvl * 1.2 - rnd(s) * 0.3)) };
  else o = { k: 'twin', c, w: r3(0.8 + lvl * 0.7) };
  o.z = r1(s.at);
  // from level 3 some walls turn as they come
  if (level >= 3 && rnd(s) < Math.min(0.6, 0.3 + (level - 3) * 0.1)) o.sp = r3((rnd(s) < 0.5 ? -1 : 1) * Math.min(1.2, 0.45 + (level - 3) * 0.15));
  s.obs.push(o);
  if (!o.sp && rnd(s) < 0.5) {
    // a gem sits where the plane can get through
    const open = o.k === 'gap' ? o.c : o.k === 'wall' ? o.c + Math.PI : o.c + Math.PI / 2;
    s.gems.push({ z: r1(o.z + 4), a: r3(open) });
  }
  s.at += Math.max(7, 13 - lvl * 5);
}

export default {
  hint: 'Drag left or right',
  pad: [['l', '◀'], ['r', '▶']],
  analog: 'x',
  init({ n, seed }) {
    const s = { n, seed, t: 0, d: 0, at: 26, obs: [], gems: [], ev: [], level: 1, levelAt: -999, ring: false,
      planes: seats(n).map(i => ({ a: r3(Math.PI * 1.5 + (i - (n - 1) / 2) * 0.55), w: 0, alive: true, score: 0, gems: 0, popAt: -999 })) };
    while (s.at < AHEAD) spawn(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    const from = s.d;
    s.d = Math.round((from + speedAt(from) * TICK) * 100) / 100;
    if (levelOf(s.d) > s.level) {
      s.level = levelOf(s.d);
      s.levelAt = s.t;
      s.ring = true;
      s.ev.push({ k: 'level', seat: -1, level: s.level, name: stageName(s.level) });
    }
    s.obs.forEach((o) => { if (o.sp) o.c = r3(((o.c + o.sp * TICK) % TAU + TAU) % TAU); });
    while (s.at < s.d + AHEAD) spawn(s);
    s.obs = s.obs.filter(o => o.z > s.d - 3);
    s.gems = s.gems.filter(g => g.z > s.d - 3 && !g.got);
    s.planes.forEach((p, i) => {
      if (!p.alive) return;
      const inp = inputs[i] || {};
      const x = Number.isFinite(inp.x) ? Math.max(-1, Math.min(1, inp.x)) : (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
      p.w += (x * 3.4 - p.w) * 0.2;
      p.a = r3(((p.a + p.w * TICK) % TAU + TAU) % TAU);
      for (const o of s.obs) {
        if (o.z > from && o.z <= s.d && blocks(o, p.a)) { p.alive = false; s.ev.push({ k: 'crash', seat: i }); return; }
        if (o.z > from && o.z <= s.d) s.ev.push({ k: 'pass', seat: i });
      }
      for (const g of s.gems) {
        if (!g.got && g.z > from && g.z <= s.d && Math.abs(angDiff(p.a, g.a)) < 0.42) { g.got = true; p.gems += 1; p.popAt = s.t; s.ev.push({ k: 'star', seat: i }); }
      }
      p.score = Math.floor(s.d / 6) + p.gems * 10;
    });
  },
  revive(s, seat) {
    Object.assign(s.planes[seat], { alive: true, w: 0 });
    s.obs = s.obs.filter(o => o.z > s.d + 16);
  },
  over(s) {
    if (s.planes.some(p => p.alive)) return null;
    const scores = s.planes.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // steers for the open side of whatever is next, but reacts late: at speed it can't save every one
  bot(s, seat) {
    const p = s.planes[seat];
    if (!p?.alive) return {};
    const look = 14 + ((seat * 5 + Math.floor(s.t / 120)) % 4) * 2;
    const o0 = s.obs.find(x => x.z > s.d && x.z < s.d + look);
    if (!o0) return { x: 0 };
    // a turning wall: aim for where it will be when it gets here
    const o = o0.sp ? { ...o0, c: o0.c + o0.sp * ((o0.z - s.d) / speedAt(s.d)) } : o0;
    let target;
    if (o.k === 'gap') target = o.c;
    else if (o.k === 'twin') target = [o.c + Math.PI / 2, o.c - Math.PI / 2].sort((u, v) => Math.abs(angDiff(p.a, u)) - Math.abs(angDiff(p.a, v)))[0];
    else target = Math.abs(angDiff(p.a, o.c)) > o.w / 2 + 0.5 ? p.a : o.c + Math.sign(angDiff(p.a, o.c) || 1) * (o.w / 2 + 0.55);
    return { x: Math.max(-1, Math.min(1, angDiff(target, p.a) * 2.4)) };
  },
  hud(g, s, names) {
    scoreBar(g, s.planes.map((p, i) => [names[i] || `P${i + 1}`, p.alive ? p.score : `${p.score} ✕`, SEAT_COLORS[i]]));
    // a gem just taken: +10 rising over that player's score
    const w = W / s.n;
    s.planes.forEach((p, i) => {
      const age = s.t - p.popAt;
      if (age < 0 || age >= 40) return;
      g.save(); g.globalAlpha = 1 - age / 40;
      g.font = '900 26px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; g.fillStyle = '#7dffe3';
      const y = 74 - age * 0.6;
      g.strokeText('+10', w * (i + 0.5), y); g.fillText('+10', w * (i + 0.5), y);
      g.restore();
    });
    levelTag(g, s.level, stageName(s.level), s.t - s.levelAt, H - 18);
  },
  // without 3D: the same tunnel, seen as rings coming at you
  draw(g, s, names) {
    g.fillStyle = '#0b0420'; g.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2 + 14, twist = 0;
    for (let k = 30; k >= 0; k--) {
      const z = k * 2 + (2 - (s.d % 2));
      const r = 900 / (z + 3);
      g.strokeStyle = `rgba(150, 190, 255, ${0.15 + 0.5 / (1 + z / 10)})`;
      g.lineWidth = Math.max(1, 6 / (1 + z / 8));
      g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    }
    [...s.obs].reverse().forEach((o) => {
      const z = o.z - s.d;
      if (z < 0 || z > AHEAD) return;
      const r = 900 / (z + 3);
      g.fillStyle = `rgba(255, ${o.k === 'gap' ? 70 : 140}, 60, ${Math.min(0.85, 1.6 - z / AHEAD)})`;
      const sector = (a0, len) => { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, a0 + twist, a0 + len + twist); g.closePath(); g.fill(); };
      if (o.k === 'wall') sector(o.c - o.w / 2, o.w);
      else if (o.k === 'gap') sector(o.c + o.w / 2, TAU - o.w);
      else { sector(o.c - o.w / 2, o.w); sector(o.c + Math.PI - o.w / 2, o.w); }
    });
    s.planes.forEach((p, i) => {
      const r = 900 / 3 * 0.78;
      const x = cx + Math.cos(p.a + twist) * Math.min(r, 170), y = cy + Math.sin(p.a + twist) * Math.min(r, 170);
      g.fillStyle = p.alive ? SEAT_COLORS[i] : '#555';
      g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x - 12, y + 10); g.lineTo(x + 12, y + 10); g.closePath(); g.fill();
    });
    this.hud(g, s, names);
  },
};
