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
import { H, r1, scoreBar, SEAT_COLORS, TICK, W } from './lib.js?v=20261115-1055';

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
  // a village ring seen from above: the crowd, the fence, the sand, and two bulls with horns
  draw(g, s, names) {
    const TAU = Math.PI * 2;
    g.fillStyle = '#3d2a1a'; g.fillRect(0, 0, W, H);
    // the crowd on the stands: rows of heads, the same every frame
    for (let row = 0; row < 3; row++) {
      const r = RING + 32 + row * 16;
      const n = Math.floor((TAU * r) / 13);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + row * 0.2;
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r * 0.98;
        if (y < 36) continue;
        const hue = (k * 47 + row * 91) % 360;
        const bob = Math.sin(s.t / 9 + k) * (s.pause > 0 ? 1.5 : 0.4);
        g.fillStyle = `hsl(${hue}, 45%, 45%)`; g.beginPath(); g.arc(x, y + bob, 5, 0, TAU); g.fill();
        g.fillStyle = '#e0b48a'; g.beginPath(); g.arc(x, y + bob - 1, 2.6, 0, TAU); g.fill();
      }
    }
    // the fence: red and white boards all round
    for (let k = 0; k < 36; k++) {
      g.strokeStyle = k % 2 ? '#f4efe6' : '#c0392b'; g.lineWidth = 9;
      g.beginPath(); g.arc(CX, CY, RING + 12, (k / 36) * TAU, ((k + 1) / 36) * TAU); g.stroke();
    }
    // the sand: what is left of the ring is bright; the part that has closed in is dark and churned
    g.fillStyle = '#7a5532'; g.beginPath(); g.arc(CX, CY, RING + 6, 0, TAU); g.fill();
    const sand = g.createRadialGradient(CX - 30, CY - 40, 10, CX, CY, s.ring);
    sand.addColorStop(0, '#f2dcab'); sand.addColorStop(1, '#d6b47a');
    g.fillStyle = sand; g.beginPath(); g.arc(CX, CY, s.ring, 0, TAU); g.fill();
    g.fillStyle = 'rgba(120,80,40,.18)';
    for (let k = 0; k < 40; k++) {
      const a = k * 2.399, d = Math.sqrt(k / 40) * s.ring * 0.95;
      g.beginPath(); g.arc(CX + Math.cos(a) * d, CY + Math.sin(a) * d, 2 + (k % 3), 0, TAU); g.fill();
    }
    g.strokeStyle = s.ring < RING - 2 ? '#ff6b57' : '#fff'; g.lineWidth = 4;
    g.beginPath(); g.arc(CX, CY, s.ring, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.arc(CX, CY, 28, 0, TAU); g.stroke();
    s.bulls.forEach((b, i) => {
      // dust behind a charging bull
      if (b.charge > 0) {
        for (let k = 1; k <= 5; k++) {
          g.fillStyle = `rgba(210,180,130,${0.45 - k * 0.07})`;
          g.beginPath(); g.arc(b.x - Math.cos(b.dir) * k * 11, b.y - Math.sin(b.dir) * k * 11, 9 + k * 2, 0, TAU); g.fill();
        }
      }
      g.save(); g.translate(b.x, b.y); g.rotate(b.dir);
      const flash = b.stun > 0 && b.stun % 6 < 3;
      const hide = flash ? '#fff' : (i ? '#2d211b' : '#6e4225');
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(3, 4, BODY + 6, BODY - 2, 0, 0, TAU); g.fill();
      // tail
      g.strokeStyle = hide; g.lineWidth = 3; g.beginPath(); g.moveTo(-BODY - 2, 0); g.quadraticCurveTo(-BODY - 12, Math.sin(s.t / 6 + i) * 6, -BODY - 16, Math.sin(s.t / 6 + i) * 9); g.stroke();
      // body
      const body = g.createRadialGradient(-4, -6, 3, 0, 0, BODY + 6);
      body.addColorStop(0, flash ? '#fff' : (i ? '#4a372d' : '#94603a')); body.addColorStop(1, hide);
      g.fillStyle = body; g.beginPath(); g.ellipse(-2, 0, BODY + 4, BODY - 5, 0, 0, TAU); g.fill();
      // the cloth on its back, in the player's colour
      g.fillStyle = SEAT_COLORS[i]; g.beginPath(); g.ellipse(-4, 0, 9, BODY - 7, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5; g.stroke();
      // head, ears and the horns
      g.fillStyle = hide; g.beginPath(); g.ellipse(BODY + 2, 0, 11, 10, 0, 0, TAU); g.fill();
      g.fillStyle = flash ? '#fff' : '#d9a38a'; g.beginPath(); g.ellipse(BODY + 10, 0, 5, 6.5, 0, 0, TAU); g.fill();
      g.fillStyle = hide; g.beginPath(); g.ellipse(BODY - 2, -12, 4, 2.5, -0.5, 0, TAU); g.ellipse(BODY - 2, 12, 4, 2.5, 0.5, 0, TAU); g.fill();
      g.strokeStyle = '#f6efdc'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(BODY + 2, -8); g.quadraticCurveTo(BODY + 8, -20, BODY + 18, -17); g.stroke();
      g.beginPath(); g.moveTo(BODY + 2, 8); g.quadraticCurveTo(BODY + 8, 20, BODY + 18, 17); g.stroke();
      g.restore();
      // dazed: little stars over its head
      if (b.stun > 0) {
        g.fillStyle = '#ffd23f'; g.font = '700 13px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let k = 0; k < 3; k++) { const a = s.t / 8 + (k * TAU) / 3; g.fillText('★', b.x + Math.cos(a) * 16, b.y - 26 + Math.sin(a) * 5); }
      }
    });
    this.hud(g, s, names);
  },
};
