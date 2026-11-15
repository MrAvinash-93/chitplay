/**
 * Turbo Tunnel: race cars down a round tunnel that never ends. The cars drive on the whole inside of
 * the tunnel, floor, walls and roof, so you steer round it to get past what is in the way.
 *
 * Every level brings something new: cones and barriers, then slow traffic and oil, then cars coming
 * the wrong way and trucks, then turning laser gates, then rocks falling from the roof, and at last
 * everything at once, faster. Coins, nitro pads and shields help along the way.
 *
 * Fair by design: the tunnel is built in rows, and every row keeps a clear way through that can be
 * reached in time from the way through the row before. Moving cars are placed so that they reach the
 * row exactly when you do, so that promise holds for them too. The car's hit box is a little smaller
 * than the car you see, so a graze that looks clean is clean.
 *
 * Angles are in radians round the tunnel; distance is in tunnel units.
 */
import { H, levelTag, r1, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261116-0000';

const TAU = Math.PI * 2;
export const LEVEL_D = 460;
export const STAGES = ['City tunnel', 'Traffic', 'Wrong way', 'Laser gates', 'Cave-in', 'Turbo night'];
export const levelOf = (d) => 1 + Math.floor(d / LEVEL_D);
export const stageName = (level) => STAGES[Math.min(level, STAGES.length) - 1];
export const AHEAD = 72;
/** Half the car's width (as an angle) and its length, for hitting things. */
export const CAR = 0.1;
export const CAR_LEN = 1.2;
const STEER = 2.9;                        // fastest turn round the tunnel, radians a second
export const speedAt = (d) => Math.min(36, 14 + d * 0.006);
export const turnTo = (a, b) => { let x = (a - b) % TAU; if (x > Math.PI) x -= TAU; else if (x < -Math.PI) x += TAU; return x; };
const wrap = (a) => ((a % TAU) + TAU) % TAU;
const r3 = (v) => Math.round(v * 1000) / 1000;

/** What each kind of thing is: half its width, its length, does it end the run, and its speed share. */
export const KINDS = {
  cone: { hw: 0.085, len: 0.5, lethal: true },
  barrier: { hw: 0.3, len: 0.6, lethal: true },
  car: { hw: 0.13, len: 1.7, lethal: true, f: 0.45 },
  oncoming: { hw: 0.13, len: 1.7, lethal: true, f: -0.45 },
  truck: { hw: 0.16, len: 3.2, lethal: true, f: 0.3 },
  gate: { hw: 0, len: 0.35, lethal: true },
  rock: { hw: 0.17, len: 0.9, lethal: true },
  oil: { hw: 0.22, len: 1.6, lethal: false },
  boost: { hw: 0.14, len: 1.2, lethal: false },
  shield: { hw: 0.12, len: 0.8, lethal: false },
};
/** Where a thing is now: moving cars drive along the tunnel and reach their row as you do. */
export const zOf = (o, d) => (o.f ? o.z + o.f * (d - o.z) : o.z);
/** A laser gate turns as you come at it; its gap ends up exactly on the way through. */
export const gateAt = (o, d) => wrap(o.c + (o.sp || 0) * (o.z - d) * -1);

/** Is a car at angle a, at distance d, touching this thing? */
export function touches(o, a, d) {
  const k = KINDS[o.k];
  const dz = zOf(o, d) - d;
  if (Math.abs(dz) >= (k.len + CAR_LEN) / 2) return false;
  if (o.k === 'gate') return Math.abs(turnTo(a, gateAt(o, d))) > o.w - CAR;
  return Math.abs(turnTo(a, o.c)) < (o.w || k.hw) + CAR;
}

/** The next row of the tunnel, with a clear way through that can be reached from the last one. */
function spawn(s) {
  const level = s.level || 1, stage = Math.min(level, STAGES.length);
  const lvl = Math.min(1, s.at / 3200);
  const Z = r1(s.at);
  // a new level: a free row with a ring of coins all the way round
  if (s.ring) {
    s.ring = false;
    for (let k = 0; k < 10; k++) s.items.push({ k: 'coin', z: Z, c: r3((k * TAU) / 10) });
    s.at += 14;
    return;
  }
  const gapZ = Z - s.lastZ;
  const reach = Math.max(0.25, Math.min(1.3, STEER * (gapZ / speedAt(s.lastZ)) * 0.5));
  const before = s.safe;
  const safe = r3(wrap(before + (rnd(s) * 2 - 1) * reach));
  const gh = Math.max(0.38, 0.75 - lvl * 0.3 - (stage >= 6 ? 0.04 : 0));   // half the way through
  const put = (k, ow, extra = {}) => {
    const span = Math.PI - gh - ow;
    if (span <= 0.05) return;
    const side = rnd(s) < 0.5 ? -1 : 1;
    const c = r3(wrap(safe + side * (gh + ow + rnd(s) * span)));
    s.obs.push({ k, z: Z, c, ...(ow !== KINDS[k].hw ? { w: r3(ow) } : {}), ...extra });
  };
  const roll = rnd(s);
  // the laser gate: from level 4, every few rows a ring of laser with one gap, turning as you come
  if (stage >= 4 && roll < (stage === 4 ? 0.34 : 0.2)) {
    const sp = r3((rnd(s) < 0.5 ? -1 : 1) * Math.min(0.05, 0.022 + (level - 4) * 0.006));
    s.obs.push({ k: 'gate', z: Z, c: safe, w: r3(gh), sp });
  } else {
    const count = 1 + Math.floor(rnd(s) * Math.min(4, 1 + stage * 0.6));
    for (let q = 0; q < count; q++) {
      const pick = rnd(s);
      if (stage >= 5 && pick < 0.25) put('rock', KINDS.rock.hw, { drop: 1 });
      else if (stage >= 3 && pick < 0.42) { const kind = rnd(s) < 0.4 ? 'truck' : 'oncoming'; put(kind, KINDS[kind].hw, kind === 'truck' ? { tint: Math.floor(rnd(s) * 3) } : {}); }
      else if (stage >= 2 && pick < 0.62) put('car', KINDS.car.hw, { tint: Math.floor(rnd(s) * 6) });
      else if (pick < 0.82) put('barrier', 0.22 + rnd(s) * 0.18 + lvl * 0.1);
      else {
        // a little group of cones side by side
        const n = 2 + Math.floor(rnd(s) * 3), ow = 0.085 + (n - 1) * 0.09;
        const span = Math.PI - gh - ow;
        if (span > 0.05) {
          const side = rnd(s) < 0.5 ? -1 : 1, mid = wrap(safe + side * (gh + ow + rnd(s) * span));
          for (let k = 0; k < n; k++) s.obs.push({ k: 'cone', z: Z, c: r3(wrap(mid - ow + 0.085 + k * 0.18)) });
        }
      }
    }
    // oil on the road from level 2, never on the way through
    if (stage >= 2 && rnd(s) < 0.22) put('oil', KINDS.oil.hw);
  }
  // help along the way: a nitro pad or a shield sits right on the way through, between rows
  const helper = rnd(s);
  const midZ = r1(s.lastZ + gapZ * 0.55), midA = r3(wrap(before + turnTo(safe, before) * 0.8));
  if (helper < 0.07) s.obs.push({ k: 'boost', z: midZ, c: midA });
  else if (helper < 0.1 && level >= 2) s.obs.push({ k: 'shield', z: midZ, c: midA });
  else if (helper < 0.55) {
    // a line of coins: they swing over to the new way through early, then follow it in
    [0.3, 0.5, 0.7].forEach((t, i) => s.items.push({ k: 'coin', z: r1(s.lastZ + gapZ * t), c: r3(wrap(before + turnTo(safe, before) * [0.7, 1, 1][i])) }));
  }
  s.safe = safe;
  s.lastZ = Z;
  // the racing line: where the sure way through each row is, drawn faintly on the road
  s.path.push([Z, safe]);
  s.at += Math.max(9, 17 - lvl * 7 - (stage >= 6 ? 1 : 0));
}

const playerOf = (i, n) => ({ a: r3(Math.PI * 1.5 + (i - (n - 1) / 2) * 0.5), w: 0, alive: true, pts: 0, coins: 0, bonus: 0, score: 0,
  popAt: -999, pop: 0, slip: 0, nitro: 0, shield: false, safeT: 0 });

export default {
  hint: 'Drag left or right to steer round the tunnel',
  pad: [['l', '◀'], ['r', '▶']],
  analog: 'x',
  init({ n, seed }) {
    const s = { n, seed, t: 0, d: 0, at: 40, lastZ: 0, safe: r3(Math.PI * 1.5), obs: [], items: [], path: [], ev: [], level: 1, levelAt: -999, ring: false,
      cars: seats(n).map(i => playerOf(i, n)) };
    while (s.at < AHEAD) spawn(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    const from = s.d, v = speedAt(from);
    s.d = Math.round((from + v * TICK) * 100) / 100;
    if (levelOf(s.d) > s.level) {
      s.level = levelOf(s.d);
      s.levelAt = s.t;
      s.ring = true;
      s.ev.push({ k: 'level', seat: -1, level: s.level, name: stageName(s.level) });
    }
    while (s.at < s.d + AHEAD) spawn(s);
    s.obs = s.obs.filter(o => o.z > s.d - 6 && !o.gone);
    s.items = s.items.filter(c => c.z > s.d - 3 && !c.got);
    s.path = s.path.filter(([z]) => z > s.d - 6);
    s.cars.forEach((p, i) => {
      if (!p.alive) return;
      const inp = inputs[i] || {};
      const x = Number.isFinite(inp.x) ? Math.max(-1, Math.min(1, inp.x)) : (inp.r || inp.u ? 1 : 0) - (inp.l || inp.d ? 1 : 0);
      // on oil the car answers the wheel slowly and slides a little
      const grip = p.slip > 0 ? 0.06 : 0.24;
      p.w += (x * STEER - p.w) * grip;
      if (p.slip > 0) { p.w += (p.slip % 2 ? 0.02 : 0.025) * (p.slipDir || 1); p.slip -= 1; }
      p.a = r3(wrap(p.a + p.w * TICK));
      p.w = r3(p.w);
      if (p.nitro > 0) p.nitro -= 1;
      if (p.safeT > 0) p.safeT -= 1;
      p.pts = Math.round((p.pts + (v * TICK) / 5 * (p.nitro > 0 ? 2 : 1)) * 100) / 100;
      for (const o of s.obs) {
        const k = KINDS[o.k];
        if (!touches(o, p.a, s.d)) {
          // just past it, and only just: a close call is worth a little
          if (k.lethal && o.z > from && o.z <= s.d) {
            const clear = o.k === 'gate' ? (o.w - CAR) - Math.abs(turnTo(p.a, gateAt(o, s.d))) : Math.abs(turnTo(p.a, o.c)) - ((o.w || k.hw) + CAR);
            if (clear >= 0 && clear < 0.1) {
              // close calls in a row (within three seconds) are worth more each time: 5, 10, 15…
              p.chain = s.t - (p.closeAt ?? -999) < 180 ? Math.min(5, (p.chain || 0) + 1) : 1;
              p.closeAt = s.t;
              p.bonus += 5 * p.chain; p.popAt = s.t; p.pop = 5 * p.chain; p.popKind = 'close';
              s.ev.push({ k: 'pass', seat: i, near: true });
            }
          }
          continue;
        }
        const bit = 1 << i;
        if (o.k === 'oil') { if (!(o.hit & bit)) { o.hit = (o.hit || 0) | bit; p.slip = 42; p.slipDir = p.w >= 0 ? 1 : -1; s.ev.push({ k: 'hit', seat: i, victim: i }); } continue; }
        if (o.k === 'boost') { if (!(o.hit & bit)) { o.hit = (o.hit || 0) | bit; p.nitro = 180; s.ev.push({ k: 'star', seat: i, combo: 3 }); } continue; }
        if (o.k === 'shield') { if (!o.gone) { o.gone = true; p.shield = true; s.ev.push({ k: 'star', seat: i }); } continue; }
        if (p.safeT > 0 || (o.hit & bit)) continue;
        if (p.shield) {
          // the shield takes the hit: the thing is knocked aside for this car, and a moment to get clear
          p.shield = false; p.safeT = 50; o.hit = (o.hit || 0) | bit;
          s.ev.push({ k: 'hit', seat: i, victim: i });
          continue;
        }
        p.alive = false;
        s.ev.push({ k: 'crash', seat: i });
        break;
      }
      if (!p.alive) return;
      for (const c of s.items) {
        if (c.got) continue;
        if (Math.abs(c.z - s.d) < 0.9 && Math.abs(turnTo(p.a, c.c)) < 0.3) {
          // coins in a row build a streak: each one is worth 10 × the streak, up to ×5
          c.got = true; p.coins += 1; p.streak = Math.min(5, (p.streak || 0) + 1);
          p.bonus += 10 * (p.streak - 1); p.popAt = s.t; p.pop = 10 * p.streak; p.popKind = 'coin';
          s.ev.push({ k: 'star', seat: i, combo: p.streak });
        } else if (c.z < s.d - 0.9 && !c.passed?.[i] && Math.abs(turnTo(p.a, c.c)) < 1.0) { (c.passed ||= {})[i] = true; p.streak = 0; }   // one missed on your side ends it
      }
      p.score = Math.floor(p.pts) + p.coins * 10 + p.bonus;
    });
  },
  revive(s, seat) {
    Object.assign(s.cars[seat], { alive: true, w: 0, slip: 0, safeT: 90 });
    s.obs = s.obs.filter(o => o.z > s.d + 18);
  },
  over(s) {
    const alive = s.cars.map((p, i) => p.alive ? i : -1).filter(i => i >= 0);
    if (s.n > 1 && alive.length === 1) return { scores: s.cars.map(p => p.score), winners: alive, endless: true };
    if (alive.length) return null;
    const scores = s.cars.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // a fair computer driver: it sees what's coming and picks the nearest clear angle, but it looks only
  // so far ahead and now and then misreads a row, more often the faster it gets
  bot(s, seat) {
    const p = s.cars[seat];
    if (!p?.alive) return {};
    const look = 16 + ((seat * 7 + Math.floor(s.t / 150)) % 4) * 3;
    const rows = [...new Set(s.obs.filter(o => KINDS[o.k].lethal && o.z > s.d - 0.6 && o.z < s.d + look).map(o => o.z))].sort((u, v) => u - v).slice(0, 2);
    // a quiet hash of the row and the seat: whether this driver misreads it (no shared random numbers used)
    const misread = (z) => { const hsh = Math.sin(z * 12.9898 + seat * 78.233) * 43758.5453; return (hsh - Math.floor(hsh)) < Math.min(0.16, 0.016 + (s.level - 1) * 0.011); };
    const blocked = (a) => rows.some((z, ri) => !misread(z) && s.obs.some(o => o.z === z && KINDS[o.k].lethal && (o.k === 'gate'
      ? Math.abs(turnTo(a, o.c)) > o.w - CAR - 0.06
      : Math.abs(turnTo(a, o.c)) < (o.w || KINDS[o.k].hw) + CAR + 0.08 - ri * 0.03)));
    let target = p.a;
    // mostly it drives the racing line, like a player who reads the tunnel well
    const line = s.path.find(([z]) => z > s.d - 0.4 && z < s.d + look);
    if (line && misread(line[0])) target = p.a + Math.sin(line[0] * 3.1 + seat) * 0.5;   // a wrong guess about the way through
    else if (line) target = line[1];
    else if (blocked(p.a)) {
      let best = null;
      for (let q = 1; q <= 36 && best == null; q++) for (const sgn of [1, -1]) { const a = p.a + sgn * q * 0.06; if (!blocked(a)) { best = a; break; } }
      target = best ?? p.a;
    } else {
      const coin = s.items.find(c => c.z > s.d + 1 && c.z < s.d + 12);
      if (coin && !blocked(coin.c) && (seat + Math.floor(s.t / 90)) % 3 !== 0) target = coin.c;
    }
    return { x: Math.max(-1, Math.min(1, turnTo(target, p.a) * 3)) };
  },
  hud(g, s, names) {
    scoreBar(g, s.cars.map((p, i) => [`${p.shield ? '🛡' : ''}${names[i] || `P${i + 1}`}`, p.alive ? p.score : `${p.score} ✕`, SEAT_COLORS[i]]));
    const w = W / s.n;
    s.cars.forEach((p, i) => {
      const age = s.t - p.popAt;
      if (age >= 0 && age < 40) {
        g.save(); g.globalAlpha = 1 - age / 40;
        g.font = '900 24px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; g.fillStyle = p.popKind === 'close' ? '#ff9f43' : '#ffd23f';
        const y = 74 - age * 0.6, text = p.popKind === 'close' ? `Close call +${p.pop}${p.chain > 1 ? ` ×${p.chain}` : ''}` : `+${p.pop}${p.streak > 1 ? ` ×${p.streak}` : ''}`;
        g.strokeText(text, w * (i + 0.5), y); g.fillText(text, w * (i + 0.5), y);
        g.restore();
      }
      if (p.alive && p.nitro > 0) {
        g.save(); g.font = '900 15px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = Math.floor(s.t / 8) % 2 ? '#7df9ff' : '#ffffff';
        g.fillText(`NITRO ×2 · ${Math.ceil(p.nitro / 60)}`, w * (i + 0.5), 46);
        g.restore();
      }
    });
    levelTag(g, s.level, stageName(s.level), s.t - s.levelAt, 52, stageName(s.level));
  },
  // without 3D: the same tunnel seen head on, rings coming at you
  // without 3D: the road tunnel from behind your car, the asphalt rushing past, lamps on the walls
  draw(g, s, names) {
    const cx = W / 2, cy = H / 2 + 14, me = s.cars[0], rot = me ? -(me.a - Math.PI / 2) : 0;
    const rOf = (z) => 900 / (z + 3);
    const night = Math.min(s.level, STAGES.length) >= 6;
    const sky = g.createRadialGradient(cx, cy, 2, cx, cy, W * 0.62);
    sky.addColorStop(0, night ? '#7b6cff' : '#ffe2a6'); sky.addColorStop(0.07, night ? '#2a2060' : '#7a5a2c');
    sky.addColorStop(0.4, night ? '#100c22' : '#1d1912'); sky.addColorStop(1, '#050507');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // the road surface: bands of asphalt, light and dark, rushing at you
    for (let k = 28; k >= 0; k--) {
      const z = k * 2.4 + (2.4 - (s.d % 2.4));
      const r0 = rOf(z + 2.4), r1 = Math.min(rOf(z), W);
      if (r0 > W) continue;
      const near = 1 / (1 + z / 12);
      g.fillStyle = (Math.floor(s.d / 2.4) + k) % 2 ? `rgba(58,58,66,${0.35 + near * 0.6})` : `rgba(44,44,52,${0.35 + near * 0.6})`;
      g.beginPath(); g.arc(cx, cy, r1, 0, TAU); g.arc(cx, cy, r0, 0, TAU, true); g.fill();
      // lamps round the wall every other ring
      if (k % 2 === 0) {
        for (let l = 0; l < 6; l++) {
          const a = (l / 6) * TAU + rot + 0.26;
          const lx = cx + Math.cos(a) * r1, ly = cy + Math.sin(a) * r1;
          g.fillStyle = night ? `rgba(140,200,255,${0.25 + near * 0.7})` : `rgba(255,200,110,${0.25 + near * 0.7})`;
          g.beginPath(); g.arc(lx, ly, Math.max(1, 5 * near), 0, TAU); g.fill();
        }
      }
    }
    // lane lines: dashes running along the tunnel, turning with your car
    for (let l = 0; l < 8; l++) {
      const a = (l / 8) * TAU + rot;
      for (let k = 0; k < 12; k++) {
        const z0 = k * 5 - (s.d % 5), z1 = z0 + 2;
        if (z0 < 0) continue;
        const ra = rOf(z1), rb = Math.min(rOf(z0), W);
        g.strokeStyle = `rgba(255,255,255,${0.12 + 0.5 / (1 + z0 / 8)})`; g.lineWidth = Math.max(1, 4 / (1 + z0 / 6));
        g.beginPath(); g.moveTo(cx + Math.cos(a) * ra, cy + Math.sin(a) * ra); g.lineTo(cx + Math.cos(a) * rb, cy + Math.sin(a) * rb); g.stroke();
      }
    }
    const colour = { cone: '#ff8a1a', barrier: '#e8e8e8', car: '#4aa3ff', oncoming: '#ffef5a', truck: '#b06cff', gate: '#ff2a55', rock: '#9b7653', oil: '#202020', boost: '#3df5ff', shield: '#7dff8a' };
    const along = [...s.obs].map(o => ({ o, z: zOf(o, s.d) - s.d })).filter(x => x.z > -0.5 && x.z < AHEAD).sort((u, v) => v.z - u.z);
    along.forEach(({ o, z }) => {
      const r = rOf(Math.max(0, z)), r2 = rOf(Math.max(0, z) + 1.2);
      const fade = Math.min(1, 1.6 - z / AHEAD);
      g.globalAlpha = Math.max(0, fade);
      const band = (c, hw, inset = 0) => { g.beginPath(); g.arc(cx, cy, r - inset, c - hw + rot, c + hw + rot); g.arc(cx, cy, r2 + inset, c + hw + rot, c - hw + rot, true); g.closePath(); g.fill(); };
      const glow = o.k === 'gate' || o.k === 'boost' || o.k === 'shield';
      if (glow) { g.shadowColor = colour[o.k]; g.shadowBlur = 14; }
      g.fillStyle = colour[o.k];
      if (o.k === 'gate') { const c = gateAt(o, s.d); band(c + Math.PI, Math.PI - o.w); }
      else band(o.c, o.w || KINDS[o.k].hw);
      g.shadowBlur = 0;
      // the near face of anything solid is a shade darker: it reads as a block, not a stripe
      if (!glow && o.k !== 'oil') { g.fillStyle = 'rgba(0,0,0,.28)'; band(o.c, (o.w || KINDS[o.k].hw) * 0.92, (r - r2) * 0.55); }
      // vehicles get headlights (coming at you) or tail lights (going your way)
      if (o.k === 'car' || o.k === 'truck' || o.k === 'oncoming') {
        const lamp = o.k === 'oncoming' ? '#fffbe0' : '#ff3b3b';
        [-0.5, 0.5].forEach((f) => {
          const a = o.c + rot + f * (o.w || KINDS[o.k].hw), lr = (r + r2) / 2;
          g.fillStyle = lamp; g.beginPath(); g.arc(cx + Math.cos(a) * lr, cy + Math.sin(a) * lr, Math.max(1.5, (r - r2) * 0.22), 0, TAU); g.fill();
        });
      }
      g.globalAlpha = 1;
    });
    s.items.forEach((c) => {
      const z = c.z - s.d; if (z < 0 || z > AHEAD) return;
      const r = rOf(z) * 0.9, size = Math.max(2, 14 / (1 + z / 6));
      const x = cx + Math.cos(c.c + rot) * r, y = cy + Math.sin(c.c + rot) * r;
      g.shadowColor = '#ffd23f'; g.shadowBlur = size;
      g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(x, y, size * (0.55 + 0.45 * Math.abs(Math.sin(s.t / 8 + c.c))), size, 0, 0, TAU); g.fill();
      g.shadowBlur = 0;
    });
    s.cars.forEach((p, i) => {
      // a little in from the edge, so the whole car shows at the bottom of the screen
      const r = Math.min(rOf(0) * 0.86, 158), x = cx + Math.cos(p.a + rot) * r, y = cy + Math.sin(p.a + rot) * r;
      g.save(); g.translate(x, y); g.rotate(p.a + rot - Math.PI / 2);
      g.globalAlpha = p.alive ? (p.safeT > 0 && Math.floor(s.t / 4) % 2 ? 0.4 : 1) : 0.35;
      g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, 3, 17, 22, 0, 0, TAU); g.fill();
      // wheels, body, roof, windscreen, lights
      g.fillStyle = '#111'; g.fillRect(-15, -14, 5, 9); g.fillRect(10, -14, 5, 9); g.fillRect(-15, 4, 5, 9); g.fillRect(10, 4, 5, 9);
      const body = g.createLinearGradient(-12, 0, 12, 0);
      body.addColorStop(0, SEAT_COLORS[i]); body.addColorStop(0.5, '#ffffff'); body.addColorStop(0.55, SEAT_COLORS[i]); body.addColorStop(1, SEAT_COLORS[i]);
      g.fillStyle = body;
      g.beginPath(); g.moveTo(-12, 14); g.lineTo(-12, -14); g.quadraticCurveTo(-12, -20, -6, -20); g.lineTo(6, -20); g.quadraticCurveTo(12, -20, 12, -14); g.lineTo(12, 14); g.closePath(); g.fill();
      g.fillStyle = 'rgba(20,30,45,.85)'; g.fillRect(-8, -9, 16, 12);
      g.fillStyle = 'rgba(190,230,255,.7)'; g.fillRect(-8, -12, 16, 4);
      g.fillStyle = '#ff2d2d'; g.fillRect(-11, 12, 5, 3); g.fillRect(6, 12, 5, 3);
      if (p.nitro > 0) { g.fillStyle = '#3df5ff'; g.beginPath(); g.moveTo(-6, 15); g.lineTo(0, 28 + (s.t % 4) * 2); g.lineTo(6, 15); g.fill(); }   // nitro: a blue flame
      if (p.shield) { g.strokeStyle = '#7dff8a'; g.lineWidth = 2; g.beginPath(); g.arc(0, -3, 24, 0, TAU); g.stroke(); }
      g.restore();
    });
    const vig = g.createRadialGradient(cx, cy, H * 0.45, cx, cy, W * 0.62);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.5)');
    g.fillStyle = vig; g.fillRect(0, 0, W, H);
    this.hud(g, s, names);
  },
};
