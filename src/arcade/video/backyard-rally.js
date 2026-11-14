/**
 * Backyard Rally: bat and tennis ball in the backyard. Keep the rally going: the ball
 * speeds up with every hit. First to seven points wins.
 */
import { H, r1, scoreBar, SEAT_COLORS, rnd, TICK, W } from './lib.js?v=20261114-1428';

export const TOP = 42, BAT = 66, WIN = 7;
const SPEED = 300;
function serve(s, to) {
  const a = (rnd(s) - 0.5) * 0.9;
  s.ball = { x: W / 2, y: r1(TOP + 60 + rnd(s) * (H - TOP - 120)), vx: to * 235 * Math.cos(a), vy: 235 * Math.sin(a) };
  s.pause = 60;
  s.rally = 0;
}
/* the flat picture's ground, drawn once */
let yardPicture = null;

export default {
  hint: 'Drag to move your bat',
  pad: [['u', '▲'], ['d', '▼']],
  init({ seed }) {
    const s = { n: 2, seed, t: 0, bats: [200, 200], points: [0, 0], ev: [], best: 0 };
    serve(s, rnd(s) < 0.5 ? -1 : 1);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    s.bats = s.bats.map((y, i) => Math.max(TOP + BAT / 2, Math.min(H - BAT / 2, y + ((inputs[i]?.d ? 1 : 0) - (inputs[i]?.u ? 1 : 0)) * SPEED * TICK)));
    if (s.pause > 0) { s.pause -= 1; return; }
    const b = s.ball;
    b.x += b.vx * TICK;
    b.y += b.vy * TICK;
    if (b.y < TOP + 7) { b.y = TOP + 7; b.vy = Math.abs(b.vy); }
    if (b.y > H - 7) { b.y = H - 7; b.vy = -Math.abs(b.vy); }
    [[0, 34, 1], [1, W - 34, -1]].forEach(([i, x, dir]) => {
      if (b.vx * dir < 0 && Math.abs(b.x - x) < 11 && Math.abs(b.y - s.bats[i]) < BAT / 2 + 7) {
        const off = (b.y - s.bats[i]) / (BAT / 2);
        const speed = Math.min(640, Math.hypot(b.vx, b.vy) + 22);
        b.vx = dir * speed * Math.cos(off * 0.85);
        b.vy = speed * Math.sin(off * 0.85);
        s.rally += 1;
        s.best = Math.max(s.best, s.rally);
        s.ev.push({ k: 'pass', seat: i });
      }
    });
    if (b.x < -10 || b.x > W + 10) {
      const w = b.x < 0 ? 1 : 0;
      s.points[w] += 1;
      s.ev.push({ k: 'round', seat: w, victim: 1 - w });
      serve(s, w === 0 ? 1 : -1);
    }
  },
  over: (s) => (Math.max(...s.points) >= WIN ? { scores: s.points.slice(), winners: [s.points[0] > s.points[1] ? 0 : 1] } : null),
  // follows the ball, a little late, and slower when the ball is far away
  bot(s, seat) {
    const b = s.ball, y = s.bats[seat];
    const coming = seat === 0 ? b.vx < 0 : b.vx > 0;
    // the faster the rally, the further off it guesses: a good player can always beat it
    const aim = coming ? b.y + Math.sin(s.t / 41 + seat) * (20 + s.rally * 5) : 200;
    if (s.t % 3 === 0 || (!coming && s.t % 2)) return {};
    return { u: y > aim + 10, d: y < aim - 10 };
  },
  hud(g, s, names) {
    scoreBar(g, s.points.map((v, i) => [names[i] || `P${i + 1}`, v, SEAT_COLORS[i]]));
    // match point, and a long rally gets a name
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (s.pause > 0 && Math.max(...s.points) === WIN - 1) { g.fillStyle = '#ffd23f'; g.font = '900 30px system-ui, sans-serif'; g.fillText('MATCH POINT!', W / 2, 110); }
    if (s.rally >= 8) { g.fillStyle = s.rally >= 14 ? '#ff5a4f' : '#ffb03b'; g.font = '900 22px system-ui, sans-serif'; g.fillText(s.rally >= 14 ? '🔥 FIRE RALLY!' : '⚡ SUPER RALLY!', W / 2, 96); }
    if (s.rally > 2) { g.fillStyle = '#fff'; g.font = '800 26px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`Rally ${s.rally}`, W / 2, 66); }
  },
  draw(g, s, names) {
    // the backyard: worn grass with bare earth where everyone stands, drawn once and kept
    if (!yardPicture && typeof document !== 'undefined') {
      yardPicture = document.createElement('canvas');
      yardPicture.width = W * 2; yardPicture.height = H * 2;
      const f = yardPicture.getContext('2d');
      f.scale(2, 2);
      f.fillStyle = '#4f8a3f'; f.fillRect(0, 0, W, H);
      let seed = 3;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      [[60, H / 2 + 20], [W - 60, H / 2 + 20], [W / 2, H / 2 + 30]].forEach(([x, y], k) => {
        const dirt = f.createRadialGradient(x, y, 10, x, y, k === 2 ? 110 : 90);
        dirt.addColorStop(0, 'rgba(176,130,82,.85)'); dirt.addColorStop(1, 'rgba(176,130,82,0)');
        f.fillStyle = dirt; f.fillRect(0, TOP, W, H - TOP);
      });
      for (let i = 0; i < 900; i++) {
        const x = rnd() * W, y = TOP + rnd() * (H - TOP);
        f.strokeStyle = `rgba(${rnd() < 0.5 ? '35,80,30' : '150,200,105'},${0.3 + rnd() * 0.35})`; f.lineWidth = 1;
        f.beginPath(); f.moveTo(x, y); f.lineTo(x + (rnd() - 0.5) * 3, y - 2 - rnd() * 4); f.stroke();
      }
      f.strokeStyle = 'rgba(255,255,240,.6)'; f.lineWidth = 3; f.setLineDash([16, 4]);
      f.strokeRect(6, TOP + 4, W - 12, H - TOP - 10); f.setLineDash([]);
    }
    if (yardPicture) g.drawImage(yardPicture, 0, 0, W, H);
    else { g.fillStyle = '#4f8a3f'; g.fillRect(0, 0, W, H); }
    // the "net": a washing line between two bricks, with clothes pegged on it
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(W / 2 - 2 + 4, TOP + 6, 4, H - TOP - 10);
    g.strokeStyle = '#efe6d2'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2, TOP + 10); g.lineTo(W / 2, H - 10); g.stroke();
    [[TOP + 4], [H - 18]].forEach(([y]) => { g.fillStyle = '#a4563a'; g.fillRect(W / 2 - 9, y, 18, 12); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(W / 2 - 9, y, 18, 2); });
    [[120, '#e86a5c'], [210, '#5aa9e6'], [300, '#f2c94c']].forEach(([y, c]) => {
      if (y > H - 40) return;
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(W / 2 + 3, y + 3, 10, 26);
      g.fillStyle = c; g.fillRect(W / 2 - 5, y, 10, 26);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(W / 2 - 5, y, 3, 26);
    });
    // the bats: round wooden paddles with a coloured rubber face and a handle
    s.bats.forEach((y, i) => {
      const x = i === 0 ? 34 : W - 34, dir = i === 0 ? -1 : 1;
      g.save();
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x + 4, y + 6, 10, BAT / 2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8a5a2b'; g.strokeStyle = '#3d2410'; g.lineWidth = 2;
      g.beginPath(); g.roundRect?.(x + dir * 8 - 5, y - 5, 18 * (dir > 0 ? 1 : 1), 10, 4) ?? g.rect(x + dir * 8 - 5, y - 5, 18, 10); g.fill(); g.stroke();
      const face = g.createLinearGradient(x - 8, 0, x + 8, 0);
      face.addColorStop(0, SEAT_COLORS[i]); face.addColorStop(0.5, '#ffffff'); face.addColorStop(0.62, SEAT_COLORS[i]); face.addColorStop(1, SEAT_COLORS[i]);
      g.fillStyle = '#c99a5c'; g.beginPath(); g.ellipse(x, y, 9, BAT / 2, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = face; g.beginPath(); g.ellipse(x - dir * 1.5, y, 6.5, BAT / 2 - 3, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    });
    // the ball: a fuzzy tennis ball with its seam, a shadow, and a faint trail when it flies fast
    const b = s.ball;
    if (b) {
      const vx = b.vx || 0, vy = b.vy || 0, fast = Math.hypot(vx, vy);
      if (fast > 1) {
        for (let k = 3; k >= 1; k--) { g.fillStyle = `rgba(215,242,79,${0.12 * (4 - k)})`; g.beginPath(); g.arc(b.x - vx * 0.012 * k * 3, b.y - vy * 0.012 * k * 3, 8 - k, 0, Math.PI * 2); g.fill(); }
      }
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(b.x + 4, b.y + 9, 8, 3.5, 0, 0, Math.PI * 2); g.fill();
      const fuzz = g.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, 9);
      fuzz.addColorStop(0, '#f6ffb0'); fuzz.addColorStop(1, '#b9d43a');
      g.fillStyle = fuzz; g.beginPath(); g.arc(b.x, b.y, 8, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(b.x - 7, b.y, 6, -0.9, 0.9); g.stroke();
      g.beginPath(); g.arc(b.x + 7, b.y, 6, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
    }
    scoreBar(g, s.points.map((v, i) => [names[i] || `P${i + 1}`, v, SEAT_COLORS[i]]));
    if (s.rally > 2) { g.fillStyle = 'rgba(255,255,255,.85)'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 4; g.font = '800 26px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText(`Rally ${s.rally}`, W / 2, 66); g.fillText(`Rally ${s.rally}`, W / 2, 66); }
  },
};

