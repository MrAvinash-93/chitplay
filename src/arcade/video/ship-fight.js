/**
 * Ship Fight: two little ships on one stretch of sea, cannons firing non-stop, rocks between them.
 * Steer to dodge and line up your shots; sink the other ship three times to win. Crates heal or give a
 * triple shot. Each round is a little different: one more rock every round, and from round three the
 * crates come twice as often.
 */
import { H, r1, rnd, scoreBar, SEAT_COLORS, TICK, W } from './lib.js?v=20261110-1351';

const SPEED = 170, SHOT = 320, HP = 5, COOL = 42, TOP = 42, ROUND_WINS = 3, STORM_AT = 60 * 45;
function newRound(s) {
  s.ships = [{ x: 70, y: 200, hp: HP, cool: 0, triple: 0, hurt: 0 }, { x: W - 70, y: 200, hp: HP, cool: 0, triple: 0, hurt: 0 }];
  s.shots = [];
  s.crate = null;
  s.round = (s.wins ? s.wins[0] + s.wins[1] : 0) + 1;
  s.crateIn = s.round >= 3 ? 150 : 300;
  s.pause = 90;
  s.clock = 0;
  s.rocks = [];
  const rocks = Math.min(7, 3 + s.round);
  for (let i = 0; i < rocks; i++) s.rocks.push({ x: r1(220 + rnd(s) * 200), y: r1(TOP + 30 + ((i + rnd(s)) / rocks) * (H - TOP - 60)), r: r1(14 + rnd(s) * 12) });
}
const hit = (a, b, d) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < d * d;

export default {
  // the cannons fire on their own, again and again: steering and dodging is the whole game
  hint: 'Drag to sail',
  pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶']],
  analog: 'xy',
  init({ seed }) {
    const s = { n: 2, seed, t: 0, wins: [0, 0], ev: [], done: false };
    newRound(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    if (s.pause > 0) { s.pause -= 1; return; }
    // a round can't go on for ever: after a while a storm wears both ships down
    s.clock += 1;
    if (s.clock > STORM_AT && (s.clock - STORM_AT) % 300 === 0) {
      const worse = s.ships[0].hp === s.ships[1].hp ? Math.floor(rnd(s) * 2) : (s.ships[0].hp < s.ships[1].hp ? 0 : 1);
      s.ships[worse].hp -= 1;
      s.ships[worse].hurt = 14;
    }
    s.ships.forEach((p, i) => {
      if (p.hp <= 0) return;
      const inp = inputs[i] || {};
      const min = i === 0 ? 30 : W / 2 + 40, max = i === 0 ? W / 2 - 40 : W - 30;
      const ix = Number.isFinite(inp.x) ? Math.max(-1, Math.min(1, inp.x)) : (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
      const iy = Number.isFinite(inp.y) ? Math.max(-1, Math.min(1, inp.y)) : (inp.d ? 1 : 0) - (inp.u ? 1 : 0);
      const nx = Math.max(min, Math.min(max, p.x + ix * SPEED * TICK));
      const ny = Math.max(TOP + 16, Math.min(H - 16, p.y + iy * SPEED * TICK));
      if (!s.rocks.some(k => hit({ x: nx, y: ny }, k, k.r + 14))) { p.x = r1(nx); p.y = r1(ny); }
      if (p.cool > 0) p.cool -= 1;
      if (p.hurt > 0) p.hurt -= 1;
      if (p.cool <= 0) {
        const dir = i === 0 ? 1 : -1;
        (p.triple > 0 ? [-55, 0, 55] : [0]).forEach(vy => s.shots.push({ x: p.x + dir * 20, y: p.y, vx: dir * SHOT, vy, o: i }));
        if (p.triple > 0) p.triple -= 1;
        p.cool = COOL;
        s.ev.push({ k: 'fire', seat: i });
      }
      if (s.crate && hit(p, s.crate, 26)) {
        if (s.crate.kind === 0) p.hp = Math.min(HP, p.hp + 2); else p.triple = 5;
        s.ev.push({ k: 'star', seat: i });
        s.crate = null;
        s.crateIn = s.round >= 3 ? 180 : 360;
      }
    });
    if (!s.crate && --s.crateIn <= 0) s.crate = { x: r1(W / 2 - 120 + rnd(s) * 240), y: r1(TOP + 30 + rnd(s) * (H - TOP - 60)), kind: rnd(s) < 0.5 ? 0 : 1 };
    s.shots = s.shots.filter((b) => {
      b.x = r1(b.x + b.vx * TICK);
      b.y = r1(b.y + b.vy * TICK);
      if (b.x < -10 || b.x > W + 10 || b.y < TOP || b.y > H) return false;
      if (s.rocks.some(k => hit(b, k, k.r + 4))) return false;
      const foe = s.ships[1 - b.o];
      if (foe.hp > 0 && hit(b, foe, 20)) {
        foe.hp -= 1;
        foe.hurt = 14;
        s.ev.push({ k: 'hit', seat: b.o, victim: 1 - b.o });
        return false;
      }
      return true;
    });
    const dead = s.ships.findIndex(p => p.hp <= 0);
    if (dead >= 0) {
      const w = 1 - dead;
      s.wins[w] += 1;
      s.ev.push({ k: 'round', seat: w, victim: dead });
      if (s.wins[w] >= ROUND_WINS) s.done = true; else newRound(s);
    }
  },
  over: (s) => (s.done ? { scores: s.wins.slice(), winners: [s.wins[0] > s.wins[1] ? 0 : 1] } : null),
  bot(s, seat) {
    const me = s.ships[seat], foe = s.ships[1 - seat];
    if (!me || !foe) return {};
    const inp = {};
    const alert = Math.floor(s.t / 50 + seat * 3) % 5 < 2;
    const danger = alert ? s.shots.find(b => b.o !== seat && Math.abs(b.x - me.x) < 120 && Math.abs(b.y - me.y) < 24) : null;
    const wobble = Math.sin(s.t / 37 + seat) * 26;
    const aim = danger ? me.y + (danger.y >= me.y ? -40 : 40) : foe.y + wobble;
    if (me.y < aim - 6) inp.d = true;
    if (me.y > aim + 6) inp.u = true;
    if (s.crate && !danger && Math.abs(s.crate.x - me.x) < 90) { if (s.crate.x > me.x + 6) inp.r = true; if (s.crate.x < me.x - 6) inp.l = true; }
    inp.a = Math.abs(foe.y - me.y) < 46 && s.t % 3 === 0;
    return inp;
  },
  hud(g, s, names) {
    scoreBar(g, s.ships.map((p, i) => [`${names[i] || `P${i + 1}`} ${'♥'.repeat(Math.max(0, p.hp))}`, `${s.wins[i]} / ${ROUND_WINS}`, SEAT_COLORS[i]]));
    if (s.pause > 0) { g.fillStyle = '#fff'; g.font = '800 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`Round ${s.wins[0] + s.wins[1] + 1}`, W / 2, 86); }
  },
  draw(g, s, names) {
    g.fillStyle = '#17689c'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255, 255, 255, .13)'; g.lineWidth = 2;
    for (let y = 56; y < H; y += 34) {
      g.beginPath();
      for (let x = -20; x < W + 20; x += 20) g.lineTo(x, y + Math.sin((x + s.t * 1.4 + y) / 26) * 4);
      g.stroke();
    }
    g.setLineDash([8, 10]); g.strokeStyle = 'rgba(255,255,255,.28)';
    g.beginPath(); g.moveTo(W / 2, TOP); g.lineTo(W / 2, H); g.stroke(); g.setLineDash([]);
    if (s.clock > STORM_AT) { g.fillStyle = `rgba(40, 40, 70, ${0.25 + 0.1 * Math.sin(s.t / 9)})`; g.fillRect(0, 0, W, H); }
    s.rocks.forEach((k) => {
      g.fillStyle = '#6f6a5f'; g.beginPath(); g.arc(k.x, k.y, k.r, 0, 7); g.fill();
      g.fillStyle = '#928c7e'; g.beginPath(); g.arc(k.x - k.r * 0.25, k.y - k.r * 0.3, k.r * 0.55, 0, 7); g.fill();
    });
    if (s.crate) {
      g.fillStyle = '#a9713a'; g.fillRect(s.crate.x - 13, s.crate.y - 13, 26, 26);
      g.strokeStyle = '#5a3a1a'; g.strokeRect(s.crate.x - 13, s.crate.y - 13, 26, 26);
      g.font = '18px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(s.crate.kind === 0 ? '❤️' : '💥', s.crate.x, s.crate.y + 1);
    }
    s.ships.forEach((p, i) => {
      if (p.hp <= 0) return;
      const dir = i === 0 ? 1 : -1;
      g.save();
      g.translate(p.x, p.y);
      g.scale(dir, 1);
      g.fillStyle = p.hurt % 4 > 1 ? '#fff' : SEAT_COLORS[i];
      g.strokeStyle = '#10222e'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(26, 0); g.lineTo(6, -13); g.lineTo(-22, -13); g.lineTo(-22, 13); g.lineTo(6, 13); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#e9e2cf'; g.fillRect(-14, -7, 16, 14);
      g.fillStyle = '#333'; g.fillRect(4, -3, 16, 6);
      g.restore();
      for (let h = 0; h < 5; h++) { g.fillStyle = h < p.hp ? '#5be37d' : 'rgba(0,0,0,.45)'; g.fillRect(p.x - 21 + h * 9, p.y - 26, 7, 5); }
    });
    g.fillStyle = '#1b1b1b';
    s.shots.forEach((b) => { g.beginPath(); g.arc(b.x, b.y, 5, 0, 7); g.fill(); });
    scoreBar(g, s.ships.map((_, i) => [names[i] || `P${i + 1}`, `${s.wins[i]} / ${ROUND_WINS}`, SEAT_COLORS[i]]));
    if (s.pause > 0) { g.fillStyle = '#fff'; g.font = '800 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`Round ${s.wins[0] + s.wins[1] + 1}`, W / 2, 86); }
  },
};
