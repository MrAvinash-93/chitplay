/**
 * Flying Chit: a folded paper chit with wings glides through a classroom that goes on for ever.
 * You steer it in every direction. Flying through a bangle keeps it in the air and builds a combo;
 * ceiling fans and stacks of books knock the paper out of it. It never ends: the chit just runs
 * out of lift sooner or later, and the room gets faster and busier the further you get.
 *
 * The classroom comes in levels, morning to night: first only stacks of books, then ceiling fans,
 * then bangles that swing from side to side, then books that drift too, and at night the fans bob
 * up and down. Every new level starts with a big golden bangle: fly through it for ten points and
 * full lift.
 *
 * Fair to play: each bangle is placed where the chit can reach it in time from the one before, so
 * the bangles make a flowing path. Near a bangle the chit is drawn gently towards its middle, a
 * bangle forgives a graze of its edge, and fans and books only hit what really touches them.
 *
 * x and y go from -1 to 1 across the space in front of you; z is distance ahead.
 */
import { H, levelTag, r1, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261116-0815';

export const AHEAD = 70;
export const LEVEL_D = 320;
export const STAGES = ['Morning class', 'Fans on', 'Swinging bangles', 'Paper storm', 'Night class'];
export const levelOf = (d) => 1 + Math.floor(d / LEVEL_D);
export const stageName = (level) => STAGES[Math.min(level, STAGES.length) - 1];
export const speedAt = (d) => Math.min(27, 11.5 + d * 0.009);   // a little quicker from the start
const STEER = 2.1;                 // how fast the chit moves across, in screen widths a second
const hoopSize = (d) => Math.max(0.19, 0.32 - d * 0.00006);   // smaller bangles: a real test of aim
export const GRAZE = 0.05;         // a bangle counts if the chit is this close to inside it
export const HITBOX = 0.8;         // fans and books hit only within this share of their size
const PULL = 0.035;                // how strongly the next bangle draws a chit that is close to it
const r2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Where a moving thing is at tick t: bangles and books swing across, fans bob up and down. */
export function placeAt(o, t) {
  return {
    x: o.sw ? clamp(o.bx + Math.sin(t / 45 + o.ph) * o.sw, -0.95, 0.95) : o.x,
    y: o.bob ? clamp(o.by + Math.sin(t / 38 + o.ph) * o.bob, -0.8, 0.8) : o.y,
  };
}
function spawn(s) {
  const lvl = Math.min(1, s.d / 1700), level = s.level || 1;
  // a new level: one big golden bangle in the middle, with nothing round it
  if (s.gold) {
    s.gold = false;
    // halfway from the last bangle to the middle, so it is always within reach
    s.px = r2((s.px || 0) / 2); s.py = r2((s.py || 0) / 2);
    s.objs.push({ k: 'hoop', gold: true, z: r1(s.at), x: s.px, y: s.py, r: 0.38 });
    s.at += 10;
    return;
  }
  // the next bangle is never further than the chit can fly in the time it has to get there
  const gap = 8.5 - lvl * 2, time = gap / speedAt(s.at);
  const reach = Math.max(0.28, STEER * time * 0.55);
  const x = r2(clamp((s.px || 0) + (rnd(s) * 2 - 1) * reach, -0.85, 0.85));
  const y = r2(clamp((s.py || 0) + (rnd(s) * 2 - 1) * reach * 0.8, -0.7, 0.7));
  s.px = x; s.py = y;
  const hoop = { k: 'hoop', z: r1(s.at), x, y, r: r2(hoopSize(s.d)) };
  // from level 3 some bangles swing from side to side
  if (level >= 3 && rnd(s) < Math.min(0.7, 0.35 + (level - 3) * 0.1)) Object.assign(hoop, { bx: x, sw: r2(0.25 + Math.min(0.25, (level - 3) * 0.05)), ph: r2(rnd(s) * 6) });
  s.objs.push(hoop);
  // something in the way, more often the further you are; no fans in the quiet first level
  if (rnd(s) < 0.35 + lvl * 0.45) {
    const k = level >= 2 && rnd(s) < 0.5 ? 'fan' : 'book';
    // to one side of the bangle, never right behind it
    const a = rnd(s) * Math.PI * 2, far = 0.5 + rnd(s) * 0.35;
    const ox = r2(clamp(x + Math.cos(a) * far, -0.9, 0.9)), oy = r2(clamp(y + Math.sin(a) * far * 0.8, -0.75, 0.75));
    const o = { k, z: r1(s.at + 3 + rnd(s) * 3), x: ox, y: oy, r: k === 'fan' ? 0.36 : 0.28 };
    // the paper storm: books drift across; at night the fans bob up and down
    if (k === 'book' && level >= 4 && rnd(s) < 0.5) Object.assign(o, { bx: ox, sw: 0.3, ph: r2(rnd(s) * 6) });
    if (k === 'fan' && level >= 5 && rnd(s) < 0.6) Object.assign(o, { by: oy, bob: 0.35, ph: r2(rnd(s) * 6) });
    s.objs.push(o);
  }
  s.at += gap;
}
export default {
  hint: 'Drag to fly',
  pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶']],
  analog: 'xy',
  init({ n, seed }) {
    const s = { n, seed, t: 0, d: 0, at: 22, px: 0, py: 0, objs: [], ev: [], level: 1, levelAt: -999, gold: false,
      chits: seats(n).map(i => ({ x: r2((i - (n - 1) / 2) * 0.35), y: 0, vx: 0, vy: 0, alive: true, score: 0, lift: 1, combo: 0, hit: 0, best: 0, hoops: 0, pop: 0, popAt: -999 })) };
    while (s.at < AHEAD) spawn(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    const from = s.d;
    s.d = Math.round((s.d + speedAt(s.d) * TICK) * 100) / 100;
    if (levelOf(s.d) > s.level) {
      s.level = levelOf(s.d);
      s.levelAt = s.t;
      s.gold = true;
      s.ev.push({ k: 'level', seat: -1, level: s.level, name: stageName(s.level) });
    }
    s.objs.forEach((o) => { if (o.sw || o.bob) { const p = placeAt(o, s.t); o.x = r2(p.x); o.y = r2(p.y); } });
    while (s.at < s.d + AHEAD) spawn(s);
    s.objs = s.objs.filter(o => o.z > s.d - 2);
    const drain = 0.05 + Math.min(0.13, s.d * 0.00003);   // lift runs out a little faster: keep threading bangles
    const next = s.objs.find(o => o.k === 'hoop' && o.z > s.d);
    s.chits.forEach((c, i) => {
      if (!c.alive) { c.y = r2(Math.max(-1.2, c.y - 0.02)); return; }
      const inp = inputs[i] || {};
      const ix = Number.isFinite(inp.x) ? inp.x : (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
      const iy = Number.isFinite(inp.y) ? -inp.y : (inp.u ? 1 : 0) - (inp.d ? 1 : 0);
      c.vx = r2(c.vx + (clamp(ix, -1, 1) * STEER - c.vx) * 0.2);
      c.vy = r2(c.vy + (clamp(iy, -1, 1) * STEER - c.vy) * 0.2);
      c.x = r2(clamp(c.x + c.vx * TICK, -1, 1));
      c.y = r2(clamp(c.y + c.vy * TICK, -0.85, 0.85));
      // close to the next bangle: a gentle pull towards its middle
      if (next && next.z - s.d < 14) {
        const dx = next.x - c.x, dy = next.y - c.y;
        if (Math.hypot(dx, dy) < next.r + 0.3) { c.x = r2(c.x + dx * PULL); c.y = r2(c.y + dy * PULL); }
      }
      c.lift = Math.round((c.lift - drain * TICK) * 1000) / 1000;
      if (c.hit > 0) c.hit -= 1;
      for (const o of s.objs) {
        if (!(o.z > from && o.z <= s.d)) continue;
        const dist = Math.hypot(c.x - o.x, c.y - o.y);
        if (o.k === 'hoop') {
          if (dist < o.r + GRAZE && o.gold) {
            c.score += 10;
            c.hoops += 1;
            c.lift = 1;
            c.pop = 10; c.popAt = s.t;
            s.ev.push({ k: 'star', seat: i, combo: 3 });
          } else if (dist < o.r + GRAZE) {
            c.combo += 1;
            c.hoops += 1;
            c.best = Math.max(c.best, c.combo);
            const pts = Math.min(5, c.combo);
            c.score += pts;
            c.pop = pts; c.popAt = s.t;
            c.lift = Math.min(1, c.lift + Math.max(0.12, 0.26 - s.d * 0.00005));
            s.ev.push({ k: 'star', seat: i, combo: c.combo });
          } else if (c.combo && !o.gold) { c.combo = 0; s.ev.push({ k: 'miss', seat: i }); }
        } else if (dist < o.r * HITBOX && c.hit <= 0) {
          c.lift -= 0.3;
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
    const alive = s.chits.map((c, i) => c.alive ? i : -1).filter(i => i >= 0);
    if (s.n > 1 && alive.length === 1) return { scores: s.chits.map(c => c.score), winners: alive, endless: true };
    if (alive.length) return null;
    const scores = s.chits.map(c => c.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // heads for the next bangle, swerves round anything in the way, and is never quite exact
  bot(s, seat) {
    const c = s.chits[seat];
    if (!c?.alive) return {};
    // now and then its mind wanders for a moment, longer the further it gets: it can be beaten
    if ((s.t + seat * 97) % 420 < 24 + Math.min(42, s.d / 60)) return {};
    const hoop0 = s.objs.find(o => o.k === 'hoop' && o.z > s.d + 1);
    if (!hoop0) return {};
    // a moving bangle: aim for where it will be when the chit gets there
    const when = s.t + ((hoop0.z - s.d) / speedAt(s.d)) * 60;
    const hoop = { ...hoop0, ...placeAt(hoop0, when) };
    const wobble = Math.sin(s.t / 23 + seat * 2) * (0.22 + s.d * 0.00012);
    let tx = hoop.x + wobble, ty = hoop.y - wobble * 0.6;
    const block = s.objs.find(o => o.k !== 'hoop' && o.z > s.d && o.z < hoop.z && Math.hypot(o.x - tx, o.y - ty) < o.r + 0.12);
    if (block) { tx += Math.sign(tx - block.x || 1) * 0.35; }
    return { x: clamp((tx - c.x) * 3, -1, 1), y: clamp(-(ty - c.y) * 3, -1, 1) };
  },
  hud(g, s, names) {
    const layout = scoreBar(g, s.chits.map((c, i) => [names[i] || `P${i + 1}`, c.alive ? c.score : `${c.score} ✕`, SEAT_COLORS[i]]));
    const { left, cellWidth, gap } = layout;
    s.chits.forEach((c, i) => {
      const x0 = left + i * (cellWidth + gap), cx = x0 + cellWidth / 2;
      // lift: the chit's wings. It glows red when it is nearly gone
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x0, 38, cellWidth, 8);
      g.fillStyle = c.lift > 0.3 ? '#7dff9a' : (Math.floor(s.t / 8) % 2 ? '#ff6b5b' : '#ffb3a8');
      g.fillRect(x0, 38, cellWidth * Math.max(0, c.lift), 8);
      g.fillStyle = '#fff'; g.font = '800 10px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText('LIFT', x0 + 4, 42.5);
      if (!c.alive) return;
      // the combo, hotter the longer it goes
      if (c.combo > 1) {
        const k = Math.min(5, c.combo), fresh = s.t - c.popAt < 10 ? 1.15 : 1;
        // with several players each combo fits its own score card, so they never run into each other
        const base = s.n > 1 ? Math.min(20 + k * 2, cellWidth / 6.2) : 20 + k * 2;
        g.font = `900 ${Math.round(base * fresh)}px system-ui, sans-serif`; g.textAlign = 'center';
        g.fillStyle = ['#fff', '#fff', '#fff36b', '#ffc23f', '#ff8a3d', '#ff5a4f'][k];
        g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 4;
        const word = s.n > 2 ? `×${k}` : `COMBO ×${k}`;
        g.strokeText(word, cx, 66); g.fillText(word, cx, 66);
      }
      // the points a bangle just gave, rising and fading
      const age = s.t - c.popAt;
      if (age >= 0 && age < 45) {
        g.save();
        g.globalAlpha = 1 - age / 45;
        g.font = `900 ${c.pop >= 10 ? 34 : 28}px system-ui, sans-serif`; g.textAlign = 'center';
        g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 5;
        g.fillStyle = c.pop >= 10 ? '#fff36b' : '#ffffff';
        const y = 112 - age * 0.7;
        g.strokeText(`+${c.pop}`, cx, y); g.fillText(`+${c.pop}`, cx, y);
        g.restore();
      }
    });
    // hit by a fan or books: the edges of the screen flash red for whoever plays on this screen
    const me = s.chits[0];
    if (me && me.hit > 26) {
      const a = (me.hit - 26) / 14 * 0.45;
      const grad = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
      grad.addColorStop(0, 'rgba(255,40,40,0)'); grad.addColorStop(1, `rgba(255,40,40,${a})`);
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
    }
    // how far to the next level, under the level's name
    const into = (s.d % LEVEL_D) / LEVEL_D;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W / 2 - 90, H - 5, 180, 4);
    g.fillStyle = '#ffd23f'; g.fillRect(W / 2 - 90, H - 5, 180 * into, 4);
    levelTag(g, s.level, stageName(s.level), s.t - s.levelAt, H - 19);
  },
  // without 3D: the same classroom, in perspective, morning light to night
  draw(g, s, names) {
    const proj = (x, y, z) => { const k = 3 / (z + 3); return [W / 2 + x * 260 * k, H / 2 + 10 - y * 160 * k, k]; };
    // the time of day follows the level: wall, floor and window colours
    const DAY = [
      { wall: ['#f6e7c8', '#e9d3a6'], floor: ['#b98a5a', '#8a5f38'], win: '#9fd3ff', light: 1 },
      { wall: ['#f3e2bd', '#e2c897'], floor: ['#b0804f', '#7f5631'], win: '#7cc4ff', light: 0.95 },
      { wall: ['#f0d6a8', '#d9b07a'], floor: ['#a5733f', '#734b27'], win: '#ffcf8a', light: 0.85 },
      { wall: ['#d9b48a', '#b98d63'], floor: ['#8a5c34', '#5d3c1f'], win: '#ff9a6b', light: 0.7 },
      { wall: ['#3a3657', '#26233d'], floor: ['#3b2a20', '#22170f'], win: '#1b2a5c', light: 0.45 },
    ][Math.min(s.level, 5) - 1];
    const quad = (pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = fill; g.fill(); };
    const RX = 1.35, FY = -1.05, CY = 1.05, NEAR = -2.2, FAR = 46;
    // walls: the whole screen first, then the floor and ceiling over it
    const wall = g.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, DAY.wall[0]); wall.addColorStop(1, DAY.wall[1]);
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    const fl = g.createLinearGradient(0, H / 2, 0, H);
    fl.addColorStop(0, DAY.floor[1]); fl.addColorStop(1, DAY.floor[0]);
    quad([proj(-RX, FY, NEAR), proj(RX, FY, NEAR), proj(RX, FY, FAR), proj(-RX, FY, FAR)], fl);
    quad([proj(-RX, CY, NEAR), proj(RX, CY, NEAR), proj(RX, CY, FAR), proj(-RX, CY, FAR)], `rgba(${DAY.light < 0.6 ? '20,18,40,.55' : '255,255,255,.6'})`);
    // the side walls a shade darker than the far one, so the room has corners
    for (const side of [-1, 1]) quad([proj(side * RX, FY, NEAR), proj(side * RX, CY, NEAR), proj(side * RX, CY, FAR), proj(side * RX, FY, FAR)], 'rgba(60,35,10,.10)');
    // floor boards rushing past, and the ceiling's light strips
    g.save();
    for (let k = 0; k < 24; k++) {
      const z = k * 2.2 - (s.d % 2.2);
      if (z < -1.5) continue;
      const [x0, y0] = proj(-RX, FY, z), [x1] = proj(RX, FY, z);
      g.strokeStyle = `rgba(0,0,0,${0.18 / (1 + z / 12)})`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
      if (k % 3 === 0) {
        const [a, b] = proj(-0.3, CY, z), [c, d] = proj(0.3, CY, z + 0.8);
        g.fillStyle = `rgba(255,255,240,${(0.75 * DAY.light) / (1 + z / 14)})`;
        g.fillRect(a, b, c - a, Math.max(1, d - b));
      }
    }
    for (const lx of [-1, -0.5, 0, 0.5, 1]) {
      const [a, b] = proj(lx * RX, FY, NEAR), [c, d] = proj(lx * RX, FY, FAR);
      g.strokeStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke();
    }
    // windows passing on the side walls
    for (let k = 0; k < 8; k++) {
      const z = k * 9 + 4 - (s.d % 9);
      if (z < 0.5) continue;
      for (const side of [-1, 1]) {
        const p = [proj(side * RX, 0.6, z), proj(side * RX, 0.6, z + 3.5), proj(side * RX, -0.2, z + 3.5), proj(side * RX, -0.2, z)];
        quad(p, DAY.win);
        g.strokeStyle = `rgba(90,60,30,${0.7 / (1 + z / 20)})`; g.lineWidth = Math.max(1, 4 * p[0][2]);
        g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
      }
    }
    g.restore();
    // the blackboard at the far end
    const [bx0, by0] = proj(-0.7, 0.55, FAR), [bx1, by1] = proj(0.7, -0.15, FAR);
    g.fillStyle = '#7a5230'; g.fillRect(bx0 - 2, by0 - 2, bx1 - bx0 + 4, by1 - by0 + 4);
    g.fillStyle = '#2f4a3a'; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    // what is coming: far things first
    const next = s.objs.find(o => o.k === 'hoop' && o.z > s.d);
    [...s.objs].sort((a, b) => b.z - a.z).forEach((o) => {
      const z = o.z - s.d;
      if (z < -0.5) return;
      const [px, py, k] = proj(o.x, o.y, Math.max(0, z));
      const fade = Math.min(1, (AHEAD - z) / 18);
      g.save(); g.globalAlpha = Math.max(0, fade);
      if (o.k === 'hoop') {
        const r = o.r * 260 * k;
        const lw = Math.max(2, (o.gold ? 15 : 9) * k);
        // a soft shadow on the floor under it
        const [sx, sy] = proj(o.x, FY, Math.max(0, z));
        g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(sx, sy, r * 0.8, r * 0.12, 0, 0, Math.PI * 2); g.fill();
        if (o.gold) { g.shadowColor = '#fff36b'; g.shadowBlur = 18 * k + 6; }
        g.strokeStyle = o.gold ? '#ffd23f' : (o === next ? '#f0a400' : '#d48f00'); g.lineWidth = lw;
        g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.stroke();
        g.shadowBlur = 0;
        // the shine on top of the bangle
        g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(1, lw * 0.3);
        g.beginPath(); g.arc(px, py, r, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
        if (o.gold) { g.fillStyle = 'rgba(255,243,107,.12)'; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill(); }
      } else if (o.k === 'fan') {
        const r = o.r * 230 * k;
        const spin = s.t * 0.35 + o.z;
        g.fillStyle = 'rgba(40,40,48,.25)'; g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#4a4f5a';
        for (let b = 0; b < 3; b++) {
          const a = spin + (b * Math.PI * 2) / 3;
          g.save(); g.translate(px, py); g.rotate(a);
          g.beginPath(); g.ellipse(r * 0.52, 0, r * 0.5, r * 0.14, 0, 0, Math.PI * 2); g.fill();
          g.restore();
        }
        g.fillStyle = '#2b2e35'; g.beginPath(); g.arc(px, py, Math.max(2, r * 0.16), 0, Math.PI * 2); g.fill();
        // the rod up to the ceiling
        const [, ty] = proj(o.x, CY, Math.max(0, z));
        g.strokeStyle = '#2b2e35'; g.lineWidth = Math.max(1, 4 * k); g.beginPath(); g.moveTo(px, py); g.lineTo(px, ty); g.stroke();
      } else {
        // a stack of books, three covers of different colours
        const w = o.r * 230 * k * 1.6, h = w * 0.22;
        ['#c0392b', '#2e86c1', '#27ae60'].forEach((c, n) => {
          const y = py + h * (0.5 - n) * 1.05, x = px - w / 2 + (n % 2 ? w * 0.06 : -w * 0.04);
          g.fillStyle = c; g.fillRect(x, y, w, h);
          g.fillStyle = '#f6efe0'; g.fillRect(x + w * 0.04, y + h * 0.2, w * 0.92, h * 0.25);
        });
      }
      g.restore();
    });
    // the chits: folded paper with flapping wings, a shadow on the floor, a ring where they'll meet the next bangle
    s.chits.forEach((c, i) => {
      const [px, py, k] = proj(c.x, c.y, 0.4);
      if (c.alive && next && i === 0) {
        const [tx, ty, tk] = proj(c.x, c.y, Math.max(0, next.z - s.d));
        const on = Math.hypot(c.x - next.x, c.y - next.y) < next.r + GRAZE;
        g.strokeStyle = on ? 'rgba(80,230,120,.9)' : 'rgba(255,255,255,.55)'; g.lineWidth = 2;
        g.beginPath(); g.arc(tx, ty, Math.max(3, 0.06 * 260 * tk), 0, Math.PI * 2); g.stroke();
      }
      const [sx, sy] = proj(c.x, FY, 0.4);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(sx, sy, 34 * k, 7 * k, 0, 0, Math.PI * 2); g.fill();
      g.save();
      g.translate(px, py);
      g.scale(1.5, 1.5);   // big enough to follow on a phone
      g.rotate(Math.max(-0.4, Math.min(0.4, c.vx * 0.15)));
      if (c.hit > 0 && Math.floor(c.hit / 4) % 2) g.globalAlpha = 0.45;
      const flap = Math.sin(s.t / 4 + i) * 7 * (c.alive ? 1 : 0.2);
      g.fillStyle = c.alive ? '#fffaf0' : '#b9b2a4';
      g.strokeStyle = 'rgba(80,60,40,.45)'; g.lineWidth = 1;
      // wings
      g.beginPath(); g.moveTo(-6, -2); g.lineTo(-30, -8 - flap); g.lineTo(-10, 6); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(6, -2); g.lineTo(30, -8 - flap); g.lineTo(10, 6); g.closePath(); g.fill(); g.stroke();
      // the folded chit
      g.fillStyle = c.alive ? '#fbf3d9' : '#aaa';
      g.fillRect(-14, -9, 28, 18); g.strokeRect(-14, -9, 28, 18);
      g.strokeStyle = 'rgba(80,60,40,.3)'; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.stroke();
      g.fillStyle = SEAT_COLORS[i]; g.fillRect(-14, -9, 28, 4);
      g.restore();
    });
    // night: the room darkens round the edges
    if (DAY.light < 0.8) {
      const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.6);
      v.addColorStop(0, 'rgba(0,0,20,0)'); v.addColorStop(1, `rgba(0,0,20,${(0.8 - DAY.light) * 0.9})`);
      g.fillStyle = v; g.fillRect(0, 0, W, H);
    }
    this.hud(g, s, names);
  },
};
