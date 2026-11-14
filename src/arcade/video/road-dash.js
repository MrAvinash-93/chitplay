/**
 * Road Dash: an auto-rickshaw on a busy road that never ends. Switch lanes past cows, potholes and
 * buses, collect coins. It keeps getting faster until something stops you.
 *
 * The road comes in levels. The village road has only cows and potholes; the town brings buses; on
 * the highway things come two at a time; in rush hour the other rickshaws race at you. Each new
 * level opens with a coin rush: a few seconds of coins in a zigzag line, and nothing new in the way.
 */
import { H, levelTag, r1, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1549';

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
  flatHint: 'Drag up or down to change lanes',
  pad: [['l', '◀'], ['r', '▶']],
  flatAxis: 'y',   // in 2D the lanes are stacked top to bottom, so up and down change lane there
  init({ n, seed }) {
    return { n, seed, t: 0, dist: 0, next: 30, things: [], coins: [], ev: [], level: 1, levelAt: -999, rush: 0, rushLane: 1,
      carts: seats(n).map(i => ({ l: i % LANES, y: laneY(i % LANES), alive: true, score: 0, coins: 0, popAt: -999, wl: false, wr: false, x: 110 + i * 26 })) };
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
        if (k.l === c.l && Math.abs(k.x - c.x) < 28) { c.coins += 1; c.popAt = s.t; s.ev.push({ k: 'star', seat: i }); return false; }
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
    const alive = s.carts.map((c, i) => c.alive ? i : -1).filter(i => i >= 0);
    if (s.n > 1 && alive.length === 1) return { scores: s.carts.map(c => c.score), winners: alive, endless: true };
    if (alive.length) return null;
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
    // a coin just taken: +5 rising over that player's score
    s.carts.forEach((c, i) => {
      const age = s.t - c.popAt;
      if (age < 0 || age >= 36) return;
      const w = W / s.n;
      g.save(); g.globalAlpha = 1 - age / 36; g.font = '900 26px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; g.fillStyle = '#ffd23f';
      const y = 86 - age * 0.6; g.strokeText('+5', w * (i + 0.5), y); g.fillText('+5', w * (i + 0.5), y);
      g.restore();
    });
    levelTag(g, s.level, s.rush > 0 ? 'Coin rush!' : stageName(s.level), s.t - s.levelAt, 52, `${stageName(s.level)} · coin rush!`);
  },
  draw(g, s, names) {
    const off = s.dist % 64;
    // sky-side verge, the asphalt (a little lighter down the middle), and the edge lines
    g.fillStyle = '#6fa84f'; g.fillRect(0, 0, W, 46);
    const tar = g.createLinearGradient(0, 46, 0, 356);
    tar.addColorStop(0, '#34383f'); tar.addColorStop(0.5, '#41454d'); tar.addColorStop(1, '#30343a');
    g.fillStyle = tar; g.fillRect(0, 46, W, 310);
    // grit and patches in the tar, sliding with the road
    g.fillStyle = 'rgba(255,255,255,.05)';
    for (let k = 0; k < 40; k++) { const x = ((k * 97 - s.dist * 1) % (W + 40) + W + 40) % (W + 40) - 20; g.fillRect(x, 50 + ((k * 53) % 300), 3 + (k % 4), 2); }
    g.fillStyle = 'rgba(0,0,0,.12)';
    for (let k = 0; k < 6; k++) { const x = ((k * 233 - s.dist) % (W + 120) + W + 120) % (W + 120) - 60; g.beginPath(); g.ellipse(x, 80 + ((k * 71) % 260), 40, 9, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#f2d34f'; g.fillRect(0, 46, W, 3); g.fillRect(0, 351, W, 3);
    g.fillStyle = 'rgba(255, 255, 255, .78)';
    for (let l = 1; l < LANES; l++) for (let x = -off; x < W; x += 64) g.fillRect(x, 37 + l * 78, 34, 4);
    // the kerb, painted black and yellow, and the footpath with shops and trees going by
    for (let x = -(s.dist % 40); x < W; x += 40) { g.fillStyle = '#f2c230'; g.fillRect(x, 356, 20, 7); g.fillStyle = '#1c1c1c'; g.fillRect(x + 20, 356, 20, 7); }
    g.fillStyle = '#b9a58a'; g.fillRect(0, 363, W, H - 363);
    const side = (s.dist * 0.6) % 180;
    for (let x = -side - 20; x < W + 180; x += 180) {
      const k = Math.floor((x + s.dist * 0.6) / 180) & 3;
      if (k === 0 || k === 2) {   // a little shop with a striped awning
        const c = k === 0 ? '#d9534f' : '#3a8fd1';
        g.fillStyle = '#e8d8bd'; g.fillRect(x, 372, 70, 28);
        for (let a = 0; a < 7; a++) { g.fillStyle = a % 2 ? '#fff' : c; g.fillRect(x - 4 + a * 11, 366, 11, 8); }
        g.fillStyle = '#5a3a1f'; g.fillRect(x + 26, 382, 18, 18);
      } else {                    // a roadside tree
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x + 34, 397, 22, 4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#6b4423'; g.fillRect(x + 31, 380, 6, 18);
        g.fillStyle = '#3f8a3a'; g.beginPath(); g.arc(x + 34, 376, 15, 0, Math.PI * 2); g.arc(x + 24, 382, 10, 0, Math.PI * 2); g.arc(x + 45, 382, 10, 0, Math.PI * 2); g.fill();
      }
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // coins, with a glint that runs round them
    s.coins.forEach((c) => {
      const X = c.x, Y = laneY(c.l);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(X + 2, Y + 13, 9, 3, 0, 0, Math.PI * 2); g.fill();
      const gold = g.createRadialGradient(X - 4, Y - 4, 1, X, Y, 12);
      gold.addColorStop(0, '#fff6c0'); gold.addColorStop(0.5, '#ffd23f'); gold.addColorStop(1, '#c79a10');
      g.fillStyle = gold; g.strokeStyle = '#8a6a00'; g.lineWidth = 2;
      g.beginPath(); g.arc(X, Y, 11, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#7a5a00'; g.font = '800 13px system-ui, sans-serif'; g.fillText('₹', X, Y + 1);
    });
    // what's in the way: each standing on its own shadow
    s.things.forEach((t) => {
      const Y = laneY(t.l);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(t.x + 3, Y + 22, t.kind === 1 ? 0 : 24, 6, 0, 0, Math.PI * 2); g.fill();
      g.font = '44px system-ui, sans-serif'; g.fillText(THINGS[t.kind], t.x, Y);
    });
    // the players' auto-rickshaws: a coloured body, the yellow canopy, three wheels and a puff of smoke
    s.carts.forEach((c, i) => {
      g.save();
      g.translate(c.x, c.y);
      g.globalAlpha = c.alive ? 1 : 0.5;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 24, 30, 6, 0, 0, Math.PI * 2); g.fill();
      if (c.alive && Math.floor(s.t / 4) % 3 === 0) { g.fillStyle = 'rgba(220,220,220,.5)'; g.beginPath(); g.arc(-36 - (s.t % 12), 12, 5 + (s.t % 12) / 3, 0, Math.PI * 2); g.fill(); }
      // body
      g.fillStyle = SEAT_COLORS[i]; g.strokeStyle = '#151515'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-30, 14); g.lineTo(-30, -2); g.lineTo(14, -2); g.quadraticCurveTo(30, 0, 30, 14); g.closePath(); g.fill(); g.stroke();
      // canopy: yellow roof over black canvas sides
      g.fillStyle = '#1e1e1e'; g.beginPath(); g.moveTo(-28, -2); g.lineTo(-28, -18); g.quadraticCurveTo(-26, -26, -12, -26); g.lineTo(12, -26); g.quadraticCurveTo(18, -24, 20, -2); g.closePath(); g.fill();
      g.fillStyle = '#f5c518'; g.beginPath(); g.moveTo(-30, -18); g.quadraticCurveTo(-28, -30, -12, -30); g.lineTo(13, -30); g.quadraticCurveTo(22, -28, 22, -20); g.lineTo(-30, -20); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(190,230,255,.75)'; g.beginPath(); g.moveTo(10, -18); g.lineTo(18, -18); g.lineTo(21, -4); g.lineTo(10, -4); g.closePath(); g.fill();
      g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(28, 6, 3, 0, Math.PI * 2); g.fill();
      // wheels, with spokes that turn as you drive
      const spin = (s.dist / 8) % (Math.PI * 2);
      [[-18, 18], [20, 18]].forEach(([wx, wy]) => {
        g.fillStyle = '#111'; g.beginPath(); g.arc(wx, wy, 8, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#bbb'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(wx + Math.cos(spin) * 5, wy + Math.sin(spin) * 5); g.lineTo(wx - Math.cos(spin) * 5, wy - Math.sin(spin) * 5);
        g.moveTo(wx + Math.cos(spin + 1.57) * 5, wy + Math.sin(spin + 1.57) * 5); g.lineTo(wx - Math.cos(spin + 1.57) * 5, wy - Math.sin(spin + 1.57) * 5); g.stroke();
      });
      g.restore();
    });
    this.hud(g, s, names);
  },
};

