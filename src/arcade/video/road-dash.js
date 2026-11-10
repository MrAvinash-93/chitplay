/**
 * Road Dash: an auto-rickshaw on a busy road that never ends. Switch lanes past cows, potholes and
 * buses, collect coins. It keeps getting faster until something stops you.
 *
 * The road comes in levels. The village road has only cows and potholes; the town brings buses; on
 * the highway things come two at a time; in rush hour the other rickshaws race at you. Each new
 * level opens with a coin rush: a few seconds of coins in a zigzag line, and nothing new in the way.
 */
import { H, levelTag, r1, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261110-1415';

export const LANES = 4;
export const LEVEL_DIST = 4000;
export const STAGES = ['Village road', 'Town road', 'Highway', 'Rush hour'];
export const levelOf = (dist) => 1 + Math.floor(dist / LEVEL_DIST);
export const stageName = (level) => STAGES[Math.min(level, STAGES.length) - 1];
const RUSH = 150;
const laneY = (l) => 76 + l * 78;
const THINGS = ['🐄', '🕳️', '🚌', '🛺'];
/** Which things can be on the road, how often two come at once, and how fast rickshaws race at you. */
export function trafficAt(level) {
  return {
    kinds: level <= 1 ? [0, 1] : level === 2 ? [0, 1, 2] : [0, 1, 2, 3],
    pair: level <= 1 ? 0 : level === 2 ? 0.2 : Math.min(0.6, 0.38 + (level - 3) * 0.06),
    racer: level >= 4 ? Math.min(170, 70 + (level - 4) * 20) : 0,
  };
}
function spawn(s) {
  // a coin rush: just coins, weaving across the lanes
  if (s.rush > 0) {
    s.rushLane = Math.max(0, Math.min(LANES - 1, s.rushLane + (rnd(s) < 0.5 ? -1 : 1)));
    s.coins.push({ x: W + 40, l: s.rushLane });
    return;
  }
  const tr = trafficAt(s.level);
  const free = Math.floor(rnd(s) * LANES);
  const count = rnd(s) < tr.pair ? 2 : 1;
  const used = new Set([free]);
  for (let i = 0; i < count; i++) {
    let l = Math.floor(rnd(s) * LANES);
    if (used.has(l)) l = (l + 1) % LANES;
    if (used.has(l)) continue;
    used.add(l);
    const kind = tr.kinds[Math.floor(rnd(s) * tr.kinds.length)];
    s.things.push(kind === 3 && tr.racer ? { x: W + 40, l, kind, v: tr.racer } : { x: W + 40, l, kind });
  }
  if (rnd(s) < 0.6) s.coins.push({ x: W + 40 + rnd(s) * 60, l: free });
}
export const speedOf = (dist) => Math.min(520, 210 + dist * 0.045);
export default {
  hint: 'Drag left or right to change lanes',
  pad: [['l', '◀'], ['r', '▶']],
  init({ n, seed }) {
    return { n, seed, t: 0, dist: 0, next: 30, things: [], coins: [], ev: [], level: 1, levelAt: -999, rush: 0, rushLane: 1,
      carts: seats(n).map(i => ({ l: i % LANES, y: laneY(i % LANES), alive: true, score: 0, coins: 0, wl: false, wr: false, x: 110 + i * 26 })) };
  },
  step(s, inputs) {
    s.t += 1;
    const v = speedOf(s.dist);
    s.dist += v * TICK;
    if (levelOf(s.dist) > s.level) {
      s.level = levelOf(s.dist);
      s.levelAt = s.t;
      s.rush = RUSH;
      s.rushLane = Math.floor(rnd(s) * LANES);
      s.ev.push({ k: 'level', seat: -1, level: s.level, name: stageName(s.level) });
    }
    if (s.rush > 0) s.rush -= 1;
    if (--s.next <= 0) { spawn(s); s.next = s.rush > 0 ? 13 : Math.max(18, 56 - Math.floor(s.dist / 260)); }
    s.things.forEach((t) => { t.x = r1(t.x - (v + (t.v || 0)) * TICK); });
    s.coins.forEach((c) => { c.x = r1(c.x - v * TICK); });
    s.things = s.things.filter(t => t.x > -50);
    s.coins = s.coins.filter(c => c.x > -30);
    s.carts.forEach((c, i) => {
      if (!c.alive) { c.x -= v * TICK; return; }
      const inp = inputs[i] || {};
      if (inp.l && !c.wl && c.l > 0) { c.l -= 1; s.ev.push({ k: 'flap', seat: i }); }
      if (inp.r && !c.wr && c.l < LANES - 1) { c.l += 1; s.ev.push({ k: 'flap', seat: i }); }
      c.wl = !!inp.l; c.wr = !!inp.r;
      c.y = r1(c.y + (laneY(c.l) - c.y) * 0.24);
      c.score = Math.floor(s.dist / 40) + c.coins * 5;
      s.coins = s.coins.filter((k) => {
        if (k.l === c.l && Math.abs(k.x - c.x) < 28) { c.coins += 1; s.ev.push({ k: 'star', seat: i }); return false; }
        return true;
      });
      if (s.things.some(t => Math.abs(laneY(t.l) - c.y) < 26 && Math.abs(t.x - c.x) < 34)) { c.alive = false; s.ev.push({ k: 'crash', seat: i }); }
    });
  },
  revive(s, seat) {
    const c = s.carts[seat];
    Object.assign(c, { alive: true, x: 110 + seat * 26 });
    s.things = s.things.filter(t => t.x > c.x + 300);
  },
  over(s) {
    if (s.carts.some(c => c.alive)) return null;
    const scores = s.carts.map(c => c.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // looks ahead down its lane and moves to the nearest clear one; goes for the coins in a coin rush
  bot(s, seat) {
    const c = s.carts[seat];
    if (!c?.alive) return {};
    const v = speedOf(s.dist);
    const clear = (l) => !s.things.some(t => t.l === l && t.x > c.x - 44 && t.x - c.x < 90 + (v + (t.v || 0)) * 0.34);
    if (s.t % 4) return {};
    if (!clear(c.l)) {
      if (c.l > 0 && clear(c.l - 1)) return { l: true };
      if (c.l < LANES - 1 && clear(c.l + 1)) return { r: true };
      return {};
    }
    const coin = s.coins.find(k => k.x > c.x + 20 && k.x - c.x < 160);
    if (coin && coin.l !== c.l && (s.t + seat * 8) % 12 === 0) {
      const to = c.l + Math.sign(coin.l - c.l);
      if (clear(to)) return coin.l < c.l ? { l: true } : { r: true };
    }
    return {};
  },
  hud(g, s, names) {
    scoreBar(g, s.carts.map((c, i) => [names[i] || `P${i + 1}`, c.alive ? c.score : `${c.score} ✕`, SEAT_COLORS[i]]));
    levelTag(g, s.level, s.rush > 0 ? 'Coin rush!' : stageName(s.level), s.t - s.levelAt, 52, `${stageName(s.level)} · coin rush!`);
  },
  draw(g, s, names) {
    g.fillStyle = '#6fa84f'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3b3f46'; g.fillRect(0, 42, W, H - 42);
    g.fillStyle = '#e7e2d2'; g.fillRect(0, 42, W, 4); g.fillRect(0, H - 4, W, 4);
    g.fillStyle = 'rgba(255, 255, 255, .7)';
    const off = s.dist % 64;
    for (let l = 1; l < LANES; l++) for (let x = -off; x < W; x += 64) g.fillRect(x, 37 + l * 78, 34, 4);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    s.coins.forEach((c) => {
      g.fillStyle = '#ffd23f'; g.strokeStyle = '#8a6a00'; g.lineWidth = 2;
      g.beginPath(); g.arc(c.x, laneY(c.l), 11, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#8a6a00'; g.font = '800 13px system-ui, sans-serif'; g.fillText('₹', c.x, laneY(c.l) + 1);
    });
    g.font = '44px system-ui, sans-serif';
    s.things.forEach(t => g.fillText(THINGS[t.kind], t.x, laneY(t.l)));
    s.carts.forEach((c, i) => {
      g.save();
      g.translate(c.x, c.y);
      g.globalAlpha = c.alive ? 1 : 0.5;
      g.fillStyle = SEAT_COLORS[i]; g.strokeStyle = '#111'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-28, 16); g.lineTo(-28, -8); g.quadraticCurveTo(-24, -22, -2, -22); g.lineTo(14, -22); g.lineTo(28, 2); g.lineTo(28, 16); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#ffe9a8'; g.fillRect(-20, -14, 14, 13); g.fillRect(0, -15, 12, 13);
      g.fillStyle = '#111'; g.beginPath(); g.arc(-18, 18, 7, 0, 7); g.arc(18, 18, 7, 0, 7); g.fill();
      g.restore();
    });
    this.hud(g, s, names);
  },
};
