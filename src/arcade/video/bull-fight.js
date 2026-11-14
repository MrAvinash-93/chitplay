/**
 * Bull Fight: two bulls in a round sand ring, like a wrestling match. Steer your bull, and charge to
 * hit the other one hard. Whoever is pushed out of the ring loses the round; first to three rounds
 * wins. After a while the ring starts to shrink, so a round can never go on for ever. Every round
 * starts on a slightly smaller ring than the one before.
 * Nobody gets hurt: it is a pushing contest, like the village bull games where bulls lock horns.
 *
 * Easy to play: a charge turns itself towards the other bull if it is roughly in front, the charge
 * comes back quickly, and near the edge the hooves grip the sand, so a bull doesn't slide out on its
 * own: it has to be pushed.
 */
import { H, r1, scoreBar, SEAT_COLORS, TICK, W } from './lib.js?v=20261114-1459';

export const CX = W / 2, CY = 221, RING = 165, BODY = 24;
const ACCEL = 700, DRAG = 3.6, CHARGE = 330, CHARGE_TICKS = 16, ROUND_WINS = 3, SHRINK_AT = 60 * 25;
export const COOL = 55;
export const AIM_CONE = 0.9;       // a charge turns towards the other bull if it is within this angle of the way you face
export const GRIP = 30;            // this close to the edge, the hooves grip
/** The rim of the ring, how far a bull is from it (negative once it is over). */
export const edgeGap = (s, b) => s.ring - Math.hypot(b.x - CX, b.y - CY);
function newRound(s) {
  s.bulls = [
    { x: CX - 90, y: CY, vx: 0, vy: 0, dir: 0, charge: 0, cool: 30, stun: 0 },
    { x: CX + 90, y: CY, vx: 0, vy: 0, dir: Math.PI, charge: 0, cool: 30, stun: 0 },
  ];
  s.round = (s.wins ? s.wins[0] + s.wins[1] : 0) + 1;
  s.ring = RING - Math.min(40, (s.round - 1) * 10);
  s.clock = 0;
  s.pause = 90;
}
const r3 = (v) => Math.round(v * 1000) / 1000;

export default {
  hint: 'Drag to move, tap to charge',
  pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶'], ['a', '🐂 Charge']],
  analog: 'xy',
  init({ seed }) {
    const s = { n: 2, seed, t: 0, wins: [0, 0], ev: [], done: false };
    newRound(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    if (s.pause > 0) { s.pause -= 1; return; }
    s.clock += 1;
    if (s.clock > SHRINK_AT) s.ring = r1(Math.max(70, s.ring - 0.12));
    s.bulls.forEach((b, i) => {
      const inp = inputs[i] || {};
      const ix = Number.isFinite(inp.x) ? Math.max(-1, Math.min(1, inp.x)) : (inp.r ? 1 : 0) - (inp.l ? 1 : 0);
      const iy = Number.isFinite(inp.y) ? Math.max(-1, Math.min(1, inp.y)) : (inp.d ? 1 : 0) - (inp.u ? 1 : 0);
      if (b.cool > 0) b.cool -= 1;
      if (b.stun > 0) b.stun -= 1;
      if (b.charge > 0) b.charge -= 1;
      else if (b.stun <= 0) {
        b.vx += ix * ACCEL * TICK;
        b.vy += iy * ACCEL * TICK;
        if (Math.hypot(ix, iy) > 0.2) b.dir = r3(Math.atan2(iy, ix));
        if (inp.a && b.cool <= 0) {
          // aim assist: if the other bull is roughly ahead and in reach, the charge goes straight at it
          const foe = s.bulls[1 - i], to = Math.atan2(foe.y - b.y, foe.x - b.x);
          const off = Math.abs(((to - b.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (off < AIM_CONE && Math.hypot(foe.x - b.x, foe.y - b.y) < 240) b.dir = r3(to);
          b.charge = CHARGE_TICKS;
          b.cool = COOL;
          b.vx = Math.cos(b.dir) * CHARGE;
          b.vy = Math.sin(b.dir) * CHARGE;
          s.ev.push({ k: 'fire', seat: i });
        }
      }
      const drag = b.charge > 0 ? 0.6 : DRAG;
      b.vx *= Math.max(0, 1 - drag * TICK);
      b.vy *= Math.max(0, 1 - drag * TICK);
      // near the edge the hooves grip: sliding outwards slows down, unless it was a hit
      if (b.stun <= 0 && edgeGap(s, b) < GRIP) {
        const ox = (b.x - CX), oy = (b.y - CY), ol = Math.hypot(ox, oy) || 1;
        const out = (b.vx * ox + b.vy * oy) / ol;
        if (out > 0) { b.vx -= (ox / ol) * out * 0.12; b.vy -= (oy / ol) * out * 0.12; }
      }
      b.x = r1(b.x + b.vx * TICK);
      b.y = r1(b.y + b.vy * TICK);
      b.vx = r1(b.vx); b.vy = r1(b.vy);
    });
    // horns meet: a charging bull sends the other one flying
    const [a, b] = s.bulls;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d < BODY * 2 && d > 0) {
      const nx = dx / d, ny = dy / d, push = (BODY * 2 - d) / 2;
      a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rel > 0) {
        const hitA = a.charge > 0 ? 1.15 : 0.8, hitB = b.charge > 0 ? 1.15 : 0.8;
        a.vx -= nx * rel * hitB; a.vy -= ny * rel * hitB;
        b.vx += nx * rel * hitA; b.vy += ny * rel * hitA;
        if (a.charge > 0 && b.charge <= 0) { b.stun = 24; s.ev.push({ k: 'hit', seat: 0, victim: 1 }); }
        else if (b.charge > 0 && a.charge <= 0) { a.stun = 24; s.ev.push({ k: 'hit', seat: 1, victim: 0 }); }
        else s.ev.push({ k: 'pass', seat: 0 });
        a.charge = 0; b.charge = 0;
      }
    }
    const out = s.bulls.findIndex(x => Math.hypot(x.x - CX, x.y - CY) > s.ring + BODY * 0.4);
    if (out >= 0) {
      const w = 1 - out;
      s.wins[w] += 1;
      s.ev.push({ k: 'round', seat: w, victim: out });
      if (s.wins[w] >= ROUND_WINS) s.done = true; else newRound(s);
    }
  },
  over: (s) => (s.done ? { scores: s.wins.slice(), winners: [s.wins[0] > s.wins[1] ? 0 : 1] } : null),
  // circles to get the other bull between itself and the edge, charges when lined up; keeps off the edge itself
  bot(s, seat) {
    const me = s.bulls[seat], foe = s.bulls[1 - seat];
    if (!me || !foe || s.pause > 0) return {};
    // now and then it stops to paw the ground: a moment to get round it
    if ((s.t + seat * 71) % 330 < 34) return {};
    const fromC = Math.hypot(me.x - CX, me.y - CY);
    if (fromC > s.ring * 0.72) return { x: (CX - me.x) / fromC, y: (CY - me.y) / fromC };
    // aim at a point just behind the foe, as seen from the centre, so the hit pushes outwards
    const fx = foe.x - CX, fy = foe.y - CY, fl = Math.hypot(fx, fy) || 1;
    const tx = foe.x - (fx / fl) * 40, ty = foe.y - (fy / fl) * 40;
    const ax = tx - me.x, ay = ty - me.y, al = Math.hypot(ax, ay) || 1;
    const toFoe = Math.atan2(foe.y - me.y, foe.x - me.x);
    let diff = Math.abs(((toFoe - me.dir + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    const near = Math.hypot(foe.x - me.x, foe.y - me.y) < 150;
    const wobble = Math.sin(s.t / 33 + seat) * 0.25;
    return { x: ax / al + wobble, y: ay / al - wobble, a: near && diff < 0.35 && s.t % 6 === 0 };
  },
  hud(g, s, names) {
    const dots = (w) => '●'.repeat(w) + '○'.repeat(Math.max(0, ROUND_WINS - w));
    scoreBar(g, s.bulls.map((_, i) => [names[i] || `P${i + 1}`, dots(s.wins[i]), SEAT_COLORS[i]]));
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // between rounds: which round, and what is at stake
    if (s.pause > 0) {
      const a = Math.min(1, s.pause / 20);
      const sub = s.wins[0] === ROUND_WINS - 1 && s.wins[1] === ROUND_WINS - 1 ? 'Final round!' : Math.max(...s.wins) === ROUND_WINS - 1 ? 'Match point!' : s.round > 1 ? 'A smaller ring' : 'Push the other bull out';
      g.save(); g.globalAlpha = a;
      g.fillStyle = 'rgba(10,6,3,.55)'; g.fillRect(0, 62, W, 78);
      g.fillStyle = '#ffd23f'; g.font = '900 40px system-ui, sans-serif'; g.fillText(`ROUND ${s.round}`, W / 2, 90);
      g.fillStyle = '#fff'; g.font = '700 19px system-ui, sans-serif'; g.fillText(sub, W / 2, 122);
      g.restore();
    }
    // each bull's charge: a bar that says READY when it can go
    s.bulls.forEach((b, i) => {
      const ready = b.cool <= 0, x = i ? W - 152 : 12, y = H - 26;
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y, 140, 16);
      g.fillStyle = ready ? (Math.floor(s.t / 10) % 2 ? '#7dff9a' : '#b8ffca') : SEAT_COLORS[i];
      g.fillRect(x, y, 140 * (1 - b.cool / COOL), 16);
      g.fillStyle = ready ? '#10301a' : '#fff'; g.font = '800 12px system-ui, sans-serif';
      g.fillText(ready ? 'CHARGE READY!' : 'charging up…', x + 70, y + 8.5);
      // too close to the edge: a warning over that bull's bar
      if (s.pause <= 0 && edgeGap(s, b) < GRIP) { g.fillStyle = '#ff6b5b'; g.font = '900 15px system-ui, sans-serif'; g.fillText('⚠ EDGE!', x + 70, y - 12); }
    });
    if (s.clock > SHRINK_AT && s.pause <= 0) { g.fillStyle = '#ffd27a'; g.font = '800 18px system-ui, sans-serif'; g.fillText('The ring is shrinking!', W / 2, H - 18); }
  },
  draw(g, s, names) {
    g.fillStyle = '#6b4a2b'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#e2c28a'; g.beginPath(); g.arc(CX, CY, s.ring, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke();
    s.bulls.forEach((b, i) => {
      g.save(); g.translate(b.x, b.y); g.rotate(b.dir);
      g.fillStyle = b.stun > 0 && b.stun % 6 < 3 ? '#fff' : (i ? '#3a2a22' : '#7a4a2a');
      g.beginPath(); g.ellipse(0, 0, BODY + 4, BODY - 4, 0, 0, 7); g.fill();
      g.fillStyle = SEAT_COLORS[i]; g.fillRect(-6, -BODY + 4, 12, BODY * 2 - 8);
      g.strokeStyle = '#f4ead5'; g.lineWidth = 5; g.beginPath(); g.moveTo(BODY, -8); g.lineTo(BODY + 12, -18); g.moveTo(BODY, 8); g.lineTo(BODY + 12, 18); g.stroke();
      g.restore();
    });
    this.hud(g, s, names);
  },
};
