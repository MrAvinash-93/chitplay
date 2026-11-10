/**
 * Backyard Rally: bat and tennis ball in the backyard. Keep the rally going: the ball
 * speeds up with every hit. First to seven points wins.
 */
import { H, r1, scoreBar, SEAT_COLORS, rnd, TICK, W } from './lib.js?v=20261110-1448';

export const TOP = 42, BAT = 66, WIN = 7;
const SPEED = 300;
function serve(s, to) {
  const a = (rnd(s) - 0.5) * 0.9;
  s.ball = { x: W / 2, y: r1(TOP + 60 + rnd(s) * (H - TOP - 120)), vx: to * 235 * Math.cos(a), vy: 235 * Math.sin(a) };
  s.pause = 60;
  s.rally = 0;
}
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
    g.fillStyle = '#3d7a46'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 8; i++) if (i % 2) g.fillRect(i * 80, TOP, 80, H);
    g.strokeStyle = 'rgba(255, 255, 255, .55)'; g.lineWidth = 3;
    g.strokeRect(4, TOP + 2, W - 8, H - TOP - 6);
    g.setLineDash([12, 12]); g.beginPath(); g.moveTo(W / 2, TOP); g.lineTo(W / 2, H); g.stroke(); g.setLineDash([]);
    s.bats.forEach((y, i) => {
      const x = i === 0 ? 34 : W - 34;
      g.fillStyle = '#7b4a26'; g.fillRect(x - (i === 0 ? 16 : -6), y - 4, 10, 8);
      g.fillStyle = SEAT_COLORS[i]; g.fillRect(x - 6, y - BAT / 2, 12, BAT);
      g.strokeStyle = '#111'; g.lineWidth = 2; g.strokeRect(x - 6, y - BAT / 2, 12, BAT);
    });
    const b = s.ball;
    g.fillStyle = '#d7f24f'; g.beginPath(); g.arc(b.x, b.y, 8, 0, 7); g.fill();
    g.strokeStyle = '#6d8a12'; g.lineWidth = 2; g.stroke();
    scoreBar(g, s.points.map((v, i) => [names[i] || `P${i + 1}`, v, SEAT_COLORS[i]]));
    if (s.rally > 2) { g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '800 26px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`Rally ${s.rally}`, W / 2, 66); }
  },
};
