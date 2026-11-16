/**
 * Tunnel Race: a paper plane flying down a tunnel that never ends. Steer round the inside of the
 * tunnel to slip past the walls, collect gems, and keep going: it gets a little faster as you go.
 *
 * The tunnel comes in levels: first plain walls and gaps, then twin walls on both sides, then walls
 * that turn as they come at you. Every new level opens with a ring of gems all the way round.
 *
 * What makes a run worth chasing: gems in a row build a combo (each gem is worth 10 × the combo, up to
 * ×5; a gem that flies past you breaks it), slipping by a wall with almost no room is a close call
 * (+5), and now and then a power-up floats in the tunnel: a shield that takes one crash for you, or a
 * magnet that pulls in every gem near your side of the tunnel for ten seconds.
 *
 * Angles are in radians round the tunnel; distance is in tunnel units.
 */
import { H, levelTag, r1, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261116-1137';

export const LEVEL_D = 360;
export const STAGES = ['Paper tunnel', 'Twin walls', 'Turning walls', 'Spin cycle'];
export const levelOf = (d) => 1 + Math.floor(d / LEVEL_D);
export const stageName = (level) => STAGES[Math.min(level, STAGES.length) - 1];

export const AHEAD = 60;
const TAU = Math.PI * 2;
const PLANE = 0.16;                       // half the plane's width, as an angle
const CLOSE = 0.14;                       // a wall passed with less room than this is a close call
const MAGNET_TICKS = 60 * 10;
export const POWERUPS = ['shield', 'magnet'];
export const speedAt = (d) => Math.min(30, 12 + d * 0.006);
const angDiff = (a, b) => { let x = (a - b) % TAU; if (x > Math.PI) x -= TAU; if (x < -Math.PI) x += TAU; return x; };
const r3 = (v) => Math.round(v * 1000) / 1000;

function drawLevelCue(g, s) {
  const since = s.t - s.levelAt;
  levelTag(g, s.level, stageName(s.level), 120, H - 18);
  if (since < 0 || since >= 120) return;

  const label = `LEVEL ${s.level} UP · ${stageName(s.level)}`;
  g.save();
  g.globalAlpha = since < 15 ? since / 15 : since > 95 ? (120 - since) / 25 : 1;
  g.font = '800 14px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const width = Math.min(W - 20, g.measureText(label).width + 24);
  const left = (W - width) / 2, top = 39;
  g.fillStyle = 'rgba(10, 6, 3, .82)';
  g.fillRect(left, top, width, 24);
  g.strokeStyle = '#7dffe3'; g.lineWidth = 1;
  g.strokeRect(left + 0.5, top + 0.5, width - 1, 23);
  g.fillStyle = '#fff';
  g.fillText(label, W / 2, top + 12);
  g.restore();
}

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
    // a gem sits where the plane can get through; now and then it is a power-up instead
    const open = o.k === 'gap' ? o.c : o.k === 'wall' ? o.c + Math.PI : o.c + Math.PI / 2;
    const roll = rnd(s);
    s.gems.push(roll < 0.07 ? { z: r1(o.z + 4), a: r3(open), p: POWERUPS[roll < 0.035 ? 0 : 1] } : { z: r1(o.z + 4), a: r3(open) });
  }
  s.at += Math.max(7, 13 - lvl * 5);
}

export default {
  hint: 'Drag to steer or use the arrow keys',
  pad: [['l', '◀'], ['r', '▶']],
  analog: 'x',
  init({ n, seed }) {
    const s = { n, seed, t: 0, d: 0, at: 26, obs: [], gems: [], ev: [], level: 1, levelAt: -999, ring: false,
      planes: seats(n).map(i => ({ a: r3(Math.PI * 1.5 + (i - (n - 1) / 2) * 0.55), w: 0, alive: true, score: 0, gems: 0, popAt: -999, pop: 10, combo: 0, bonus: 0, shield: false, magnet: 0, safeT: 0, closeAt: -999 })) };
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
      const x = Number.isFinite(inp.x) ? Math.max(-1, Math.min(1, inp.x)) : (inp.r || inp.u ? 1 : 0) - (inp.l || inp.d ? 1 : 0);
      p.w += (x * 3.4 - p.w) * 0.2;
      p.a = r3(((p.a + p.w * TICK) % TAU + TAU) % TAU);
      if (p.safeT > 0) p.safeT -= 1;
      for (const o of s.obs) {
        if (!(o.z > from && o.z <= s.d)) continue;
        if (blocks(o, p.a)) {
          if (p.safeT > 0) continue;
          // the shield takes the hit: a moment to get clear, then it's gone
          if (p.shield) { p.shield = false; p.safeT = 50; s.ev.push({ k: 'hit', seat: i, victim: i }); continue; }
          p.alive = false; s.ev.push({ k: 'crash', seat: i }); return;
        }
        s.ev.push({ k: 'pass', seat: i });
        // how much room was left: almost none is a close call
        const room = o.k === 'gap' ? o.w / 2 - PLANE - Math.abs(angDiff(p.a, o.c))
          : o.k === 'wall' ? Math.abs(angDiff(p.a, o.c)) - o.w / 2 - PLANE
            : Math.min(Math.abs(angDiff(p.a, o.c)), Math.abs(angDiff(p.a, o.c + Math.PI))) - o.w / 2 - PLANE;
        if (room >= 0 && room < CLOSE) { p.bonus = (p.bonus || 0) + 5; p.closeAt = s.t; s.ev.push({ k: 'star', seat: i, combo: 2 }); }
      }
      const reach = p.magnet > s.t ? 1.1 : 0.42;
      for (const g of s.gems) {
        if (g.got || !(g.z > from && g.z <= s.d)) continue;
        if (Math.abs(angDiff(p.a, g.a)) < reach) {
          g.got = true; p.popAt = s.t;
          if (g.p === 'shield') { p.shield = true; p.pop = 0; s.ev.push({ k: 'star', seat: i, combo: 3 }); }
          else if (g.p === 'magnet') { p.magnet = s.t + MAGNET_TICKS; p.pop = 0; s.ev.push({ k: 'star', seat: i, combo: 3 }); }
          else { p.gems += 1; p.combo = Math.min(5, (p.combo || 0) + 1); p.pop = 10 * p.combo; p.bonus = (p.bonus || 0) + p.pop; s.ev.push({ k: 'star', seat: i, combo: p.combo }); }
        } else if (!g.p && Math.abs(angDiff(p.a, g.a)) < 1.2) p.combo = 0;   // a gem that went by on your side breaks the combo
      }
      p.score = Math.floor(s.d / 6) + (p.bonus || 0);
    });
  },
  revive(s, seat) {
    Object.assign(s.planes[seat], { alive: true, w: 0, combo: 0, safeT: 60 });
    s.obs = s.obs.filter(o => o.z > s.d + 16);
  },
  over(s) {
    const alive = s.planes.map((p, i) => p.alive ? i : -1).filter(i => i >= 0);
    // stars for how deep into the tunnel the run went: level 2, 3 and 4 (the Spin cycle) each add one
    const stars = { got: Math.max(0, Math.min(3, (s.level || 1) - 1)), of: 3, level: s.level || 1, name: stageName(s.level || 1) };
    if (s.n > 1 && alive.length === 1) return { scores: s.planes.map(p => p.score), winners: alive, endless: true, stars };
    if (alive.length) return null;
    const scores = s.planes.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true, stars };
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
      const cx = w * (i + 0.5);
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5;
      const age = s.t - p.popAt;
      if (age >= 0 && age < 40 && p.pop > 0) {
        g.globalAlpha = 1 - age / 40; g.font = `900 ${p.combo > 1 ? 28 : 24}px system-ui, sans-serif`; g.fillStyle = p.combo > 2 ? '#ffd23f' : '#7dffe3';
        const y = 74 - age * 0.6, text = `+${p.pop}${p.combo > 1 ? ` ×${p.combo}` : ''}`;
        g.strokeText(text, cx, y); g.fillText(text, cx, y);
      }
      const close = s.t - p.closeAt;
      if (close >= 0 && close < 45) { g.globalAlpha = 1 - close / 45; g.font = '900 18px system-ui, sans-serif'; g.fillStyle = '#ff9a5a'; g.strokeText('CLOSE CALL +5', cx, 100 - close * 0.3); g.fillText('CLOSE CALL +5', cx, 100 - close * 0.3); }
      g.globalAlpha = 1; g.font = '800 14px system-ui, sans-serif'; g.lineWidth = 4;
      const held = [p.shield ? '🛡️' : '', p.magnet > s.t ? `🧲${Math.ceil((p.magnet - s.t) / 60)}s` : '', p.combo > 1 ? `💎×${p.combo}` : ''].filter(Boolean).join('  ');
      if (held && p.alive) { g.strokeText(held, cx, 50); g.fillStyle = '#fff'; g.fillText(held, cx, 50); }
      g.restore();
    });
    drawLevelCue(g, s);
  },
  // without 3D: the same tunnel, seen from inside, the rings rushing at you
  draw(g, s, names) {
    const cx = W / 2, cy = H / 2 + 14;
    const R = 170;                                   // where the planes fly, round the tunnel wall
    const rAt = (z) => 900 / (z + 3);
    const hue = [262, 200, 320, 28][(Math.min(s.level, 4) - 1)];   // each stage its own colour
    // the far end glows; the walls darken towards you
    const sky = g.createRadialGradient(cx, cy, 4, cx, cy, W * 0.62);
    sky.addColorStop(0, `hsl(${hue}, 90%, 72%)`);
    sky.addColorStop(0.08, `hsl(${hue}, 70%, 34%)`);
    sky.addColorStop(0.45, `hsl(${hue}, 60%, 13%)`);
    sky.addColorStop(1, '#05020c');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // panels of the tunnel wall, alternating, so the speed shows
    for (let k = 26; k >= 0; k--) {
      const z = k * 2 + (2 - (s.d % 2));
      const r0 = rAt(z + 2), r1 = rAt(z);
      if (r0 > W) continue;
      const light = (Math.floor(s.d / 2) + k) % 2 === 0;
      g.fillStyle = `hsla(${hue}, 55%, ${light ? 26 : 19}%, ${Math.min(1, 0.25 + 1.2 / (1 + z / 12))})`;
      g.beginPath(); g.arc(cx, cy, Math.min(r1, W), 0, TAU); g.arc(cx, cy, r0, 0, TAU, true); g.fill();
      g.strokeStyle = `hsla(${hue}, 90%, 78%, ${0.08 + 0.45 / (1 + z / 8)})`;
      g.lineWidth = Math.max(1, 4 / (1 + z / 8));
      g.beginPath(); g.arc(cx, cy, r1, 0, TAU); g.stroke();
    }
    // light streaks along the wall
    g.save();
    g.strokeStyle = `hsla(${hue}, 100%, 85%, .22)`; g.lineWidth = 1.5;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU + 0.2;
      const z = ((k * 7 - s.d * 1.5) % 40 + 40) % 40;
      const ra = rAt(z + 6), rb = rAt(z);
      g.beginPath(); g.moveTo(cx + Math.cos(a) * ra, cy + Math.sin(a) * ra); g.lineTo(cx + Math.cos(a) * rb, cy + Math.sin(a) * rb); g.stroke();
    }
    g.restore();
    // a slab on the wall, from the wall in towards the middle, lit on its edge
    const slab = (r, a0, len, near) => {
      const inner = r * 0.5;
      g.beginPath(); g.arc(cx, cy, r, a0, a0 + len); g.arc(cx, cy, inner, a0 + len, a0, true); g.closePath();
      const grad = g.createRadialGradient(cx, cy, inner, cx, cy, r);
      grad.addColorStop(0, `rgba(255, 120, 60, ${0.35 * near})`);
      grad.addColorStop(1, `rgba(255, 70, 40, ${0.95 * near})`);
      g.fillStyle = grad; g.fill();
      g.strokeStyle = `rgba(255, 220, 160, ${0.9 * near})`; g.lineWidth = Math.max(1, r / 60); g.stroke();
    };
    const items = [...s.obs.map(o => ({ o, z: o.z - s.d })), ...s.gems.filter(x => !x.got).map(gm => ({ gm, z: gm.z - s.d }))]
      .filter(x => x.z >= 0 && x.z <= AHEAD).sort((a, b) => b.z - a.z);
    for (const it of items) {
      const r = rAt(it.z);
      const near = Math.max(0.15, Math.min(1, 1.6 - it.z / AHEAD));
      if (it.o) {
        const o = it.o;
        if (o.k === 'wall') slab(r, o.c - o.w / 2, o.w, near);
        else if (o.k === 'gap') slab(r, o.c + o.w / 2, TAU - o.w, near);
        else { slab(r, o.c - o.w / 2, o.w, near); slab(r, o.c + Math.PI - o.w / 2, o.w, near); }
        if (o.sp) {   // a turning wall: little arrows show which way
          g.fillStyle = `rgba(255, 255, 255, ${0.7 * near})`; g.font = `900 ${Math.max(9, r / 9)}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(o.sp > 0 ? '↻' : '↺', cx + Math.cos(o.c) * r * 0.75, cy + Math.sin(o.c) * r * 0.75);
        }
      } else {
        // a gem near the wall, where a plane can fly through it
        const gr = Math.min(r, R * 1.4) * (r > R ? 1 : 0.92);
        const x = cx + Math.cos(it.gm.a) * gr, y = cy + Math.sin(it.gm.a) * gr;
        const size = Math.max(2.5, Math.min(13, r / 14));
        const spin = 0.6 + 0.4 * Math.sin(s.t / 6 + it.gm.a * 3);
        g.save(); g.globalAlpha = near;
        const col = it.gm.p === 'shield' ? '#5aa9ff' : it.gm.p === 'magnet' ? '#ff6b57' : '#7dffe3';
        g.shadowColor = col; g.shadowBlur = size * 1.6;
        g.fillStyle = col;
        g.beginPath(); g.moveTo(x, y - size); g.lineTo(x + size * spin, y); g.lineTo(x, y + size); g.lineTo(x - size * spin, y); g.closePath(); g.fill();
        g.restore();
      }
    }
    // the planes: paper planes round the wall, nose pointing down the tunnel
    s.planes.forEach((p, i) => {
      const x = cx + Math.cos(p.a) * R, y = cy + Math.sin(p.a) * R;
      g.save();
      g.translate(x, y);
      g.rotate(p.a + Math.PI / 2 + Math.max(-0.5, Math.min(0.5, p.w * 0.12)));
      const c = p.alive ? SEAT_COLORS[i] : '#666';
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
      g.fillStyle = '#fbf6ea';
      g.beginPath(); g.moveTo(0, 16); g.lineTo(-17, -12); g.lineTo(0, -5); g.lineTo(17, -12); g.closePath(); g.fill();
      g.shadowColor = 'transparent';
      g.fillStyle = 'rgba(0,0,0,.13)';
      g.beginPath(); g.moveTo(0, 16); g.lineTo(0, -5); g.lineTo(17, -12); g.closePath(); g.fill();
      g.strokeStyle = c; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, 16); g.lineTo(0, -5); g.stroke();
      g.restore();
      if (!p.alive) { g.font = '900 18px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('✕', x, y); }
      if (p.alive && (p.shield || p.safeT > 0)) { g.strokeStyle = p.safeT > 0 && Math.floor(s.t / 4) % 2 ? 'rgba(90,169,255,.3)' : 'rgba(90,169,255,.85)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 24, 0, TAU); g.stroke(); }
    });
    // a soft vignette round the edge of the screen
    const vig = g.createRadialGradient(cx, cy, H * 0.45, cx, cy, W * 0.62);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = vig; g.fillRect(0, 0, W, H);
    this.hud(g, s, names);
  },
};
