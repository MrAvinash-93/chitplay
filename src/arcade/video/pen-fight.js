/**
 * Pen Fight: a quick school-desk flick duel. Swipe toward the other pen; knock it off the desk or
 * outlast it. Both players get three seconds to make one flick, and the match is first to three.
 */
import { H, r1, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1604';

export const LAUNCH_TICKS = 180;
export const ROUND_WINS = 3;
const RESULT_TICKS = 90, SIM_TICKS = 360, PEN_RADIUS = 24, PEN_HALF = 38;
const LEFT = 58, RIGHT = W - 58, TOP = 68, BOTTOM = H - 36;
const CX = W / 2, CY = 214;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function resetRound(s) {
  s.round += 1;
  s.phase = 'launch';
  s.launchLeft = LAUNCH_TICKS;
  s.phaseTicks = 0;
  s.simTicks = 0;
  s.lastRound = null;
  s.notice = null;
  s.pens = seats(s.n).map((seat) => ({
    seat, startX: seat ? CX + 130 : CX - 130,
    x: seat ? CX + 130 : CX - 130, y: CY + (seat ? -7 : 7),
    vx: 0, vy: 0, angle: seat ? Math.PI : 0, spin: 0,
    power: 0, balance: 1, hits: 0, launched: false, alive: true, actionWas: false,
  }));
}

function finishRound(s, winner, reason) {
  const loser = winner < 0 ? -1 : 1 - winner;
  if (winner >= 0) {
    s.wins[winner] += 1;
    s.emptyRounds = 0;
    if (s.wins[winner] >= ROUND_WINS) s.done = true;
  } else {
    s.emptyRounds += 1;
    if (s.emptyRounds >= 3) s.done = true;
  }
  s.lastRound = { winner, loser, reason };
  s.phase = 'result';
  s.phaseTicks = 0;
  s.ev.push({ k: 'round', seat: winner, victim: loser });
}

function launch(s, i, swipe) {
  const p = s.pens[i];
  if (s.phase !== 'launch' || p.launched) return false;
  let dx = Number.isFinite(swipe?.x) ? clamp(swipe.x, -1, 1) : (i ? -1 : 1);
  let dy = Number.isFinite(swipe?.y) ? clamp(swipe.y, -1, 1) : 0;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return false;
  dx /= length; dy /= length;
  const power = clamp(Number.isFinite(swipe?.power) ? swipe.power : 0.48, 0.12, 1);
  const speed = 155 + power * 365;
  p.launched = true;
  p.power = power;
  p.balance = 1;
  p.spin = 2 + power * 5;
  p.vx = r1(dx * speed);
  p.vy = r1(dy * speed);
  p.angle = Math.atan2(dy, dx);
  s.ev.push({ k: 'fire', seat: i });
  return true;
}

function performanceOf(p, seat) {
  const progress = seat ? p.startX - p.x : p.x - p.startX;
  return p.balance * 0.38 + p.power * 0.16 + p.hits * 0.14 + progress * 0.001 + Math.hypot(p.vx, p.vy) * 0.0002;
}

function onDesk(p) {
  const dx = Math.cos(p.angle) * PEN_HALF, dy = Math.sin(p.angle) * PEN_HALF;
  return p.x - Math.abs(dx) > LEFT && p.x + Math.abs(dx) < RIGHT
    && p.y - Math.abs(dy) > TOP && p.y + Math.abs(dy) < BOTTOM;
}

function collide(s) {
  const [a, b] = s.pens;
  if (!a?.alive || !b?.alive) return;
  const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 0.001;
  if (distance >= PEN_RADIUS * 2) return;
  const nx = dx / distance, ny = dy / distance;
  const overlap = PEN_RADIUS * 2 - distance;
  a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
  const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (relative >= 0) return;
  const impulse = -(1 + 0.68) * relative * 0.5;
  a.vx -= impulse * nx; a.vy -= impulse * ny;
  b.vx += impulse * nx; b.vy += impulse * ny;
  const attacker = a.power === b.power
    ? (Math.hypot(a.vx, a.vy) >= Math.hypot(b.vx, b.vy) ? 0 : 1)
    : a.power > b.power ? 0 : 1;
  const victim = 1 - attacker;
  s.pens[attacker].hits += 1;
  s.pens[victim].balance = Math.max(0, s.pens[victim].balance - impulse * 0.00062);
  if (s.pens[victim].balance <= 0.08) s.pens[victim].alive = false;
  s.ev.push({ k: 'hit', seat: attacker, victim });
}

export default {
  hint: 'Swipe toward the other pen in 3 seconds. A faster flick hits harder.',
  swipe: true,
  swipeHint: 'Swipe toward your rival',
  pad: [['a', 'Flick']],
  init({ n, seed }) {
    const s = { n, seed, t: 0, ev: [], wins: seats(n).map(() => 0), round: 0, emptyRounds: 0, done: false };
    resetRound(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    s.pens.forEach((p, i) => {
      const input = inputs[i] || {};
      let swipe = input.swipe;
      if (!swipe && input.a && !p.actionWas) {
        const foe = s.pens[1 - i];
        const dx = foe ? foe.x - p.x : (i ? -1 : 1);
        const d = Math.hypot(dx, 0) || 1;
        swipe = { x: dx / d, y: 0, power: 0.48 };
      }
      p.actionWas = !!input.a;
      if (swipe && !launch(s, i, swipe) && s.phase !== 'launch') s.notice = { seat: i, until: s.t + 75 };
    });

    if (s.phase === 'launch') {
      s.launchLeft -= 1;
      if (s.launchLeft <= 0) {
        const launched = s.pens.filter(p => p.launched);
        if (launched.length === 0) finishRound(s, -1, 'missed');
        else if (launched.length === 1) finishRound(s, launched[0].seat, 'missed');
        else { s.phase = 'flick'; s.phaseTicks = 0; s.simTicks = 0; }
      }
      return;
    }
    if (s.phase === 'flick') {
      s.simTicks += 1;
      s.phaseTicks += 1;
      s.pens.forEach((p) => {
        if (!p.alive) return;
        p.x += p.vx * TICK; p.y += p.vy * TICK;
        p.vx *= 1 - 1.8 * TICK; p.vy *= 1 - 1.8 * TICK;
        p.angle += p.spin * TICK * 0.15;
        p.spin *= 1 - 1.2 * TICK;
        if (!onDesk(p)) { p.alive = false; s.ev.push({ k: 'crash', seat: p.seat }); }
        p.x = r1(p.x); p.y = r1(p.y); p.vx = r1(p.vx); p.vy = r1(p.vy);
      });
      collide(s);
      const alive = s.pens.filter(p => p.alive);
      if (alive.length < 2) finishRound(s, alive[0]?.seat ?? -1, 'off-desk');
      else if (s.simTicks >= SIM_TICKS) {
        const a = performanceOf(s.pens[0], 0), b = performanceOf(s.pens[1], 1);
        finishRound(s, Math.abs(a - b) < 0.075 ? -1 : a > b ? 0 : 1, 'settled');
      }
      return;
    }
    if (s.phase === 'result' && !s.done) {
      s.phaseTicks += 1;
      if (s.notice && s.t > s.notice.until) s.notice = null;
      if (s.phaseTicks >= RESULT_TICKS) resetRound(s);
    }
  },
  over(s) {
    return s.done ? { scores: s.wins.slice(), winners: s.wins.map((v, i) => v === Math.max(...s.wins) ? i : -1).filter(i => i >= 0) } : null;
  },
  bot(s, seat) {
    const p = s.pens[seat];
    if (s.phase !== 'launch' || !p || p.launched || s.launchLeft > (seat ? 78 : 104)) return {};
    const foe = s.pens[1 - seat];
    const dx = (foe?.x ?? CX) - p.x, dy = Math.sin(s.round * 1.3 + seat) * 0.045;
    const d = Math.hypot(dx, dy) || 1;
    return { swipe: { x: dx / d, y: dy / d, power: 0.56 + ((s.round + seat) % 3) * 0.08 } };
  },
  hud(g, s, names) {
    scoreBar(g, s.wins.map((v, i) => [names[i] || `P${i + 1}`, `${v}/${ROUND_WINS}`, SEAT_COLORS[i]]));
    g.save();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 5;
    let text = '';
    if (s.phase === 'launch') text = `${Math.ceil(s.launchLeft / 60)}s · SWIPE TOWARD YOUR RIVAL`;
    else if (s.phase === 'flick') text = 'PENS COLLIDING!';
    else if (s.notice && s.t <= s.notice.until) text = 'TOO LATE · RETRY NEXT ROUND';
    else if (s.lastRound?.winner < 0) text = 'BOTH MISSED · TRY AGAIN';
    else if (s.lastRound?.reason === 'missed') text = `${names[s.lastRound.winner] || 'Opponent'} WINS · MISSED FLICK`;
    else if (s.lastRound?.winner >= 0) text = `${names[s.lastRound.winner] || 'Player'} WINS THE ROUND`;
    g.font = '900 26px system-ui, sans-serif';
    g.strokeText(text, W / 2, 60); g.fillText(text, W / 2, 60);
    if (s.phase === 'launch') {
      s.pens.forEach((p, i) => {
        g.font = '800 14px system-ui, sans-serif'; g.fillStyle = p.launched ? '#9bffb5' : '#ffe59a';
        g.fillText(p.launched ? 'READY' : 'WAITING', i ? W - 104 : 104, 92);
      });
    } else if (s.phase === 'flick') {
      g.font = '700 15px system-ui, sans-serif'; g.fillStyle = '#e7eefb';
      g.fillText(`Round ${s.round} · ${Math.max(0, Math.ceil((SIM_TICKS - s.simTicks) / 60))}s`, W / 2, 90);
    }
    g.restore();
  },
  draw(g, s, names) {
    const wood = g.createLinearGradient(0, 40, W, H);
    wood.addColorStop(0, '#7b5737'); wood.addColorStop(0.5, '#533920'); wood.addColorStop(1, '#8a6340');
    g.fillStyle = wood; g.fillRect(0, 34, W, H - 34);
    g.strokeStyle = 'rgba(245,207,150,.22)'; g.lineWidth = 2;
    for (let y = 52; y < H; y += 38) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 9, W * 0.7, y - 9, W, y); g.stroke(); }
    g.fillStyle = 'rgba(15,10,7,.25)'; g.fillRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP);
    g.strokeStyle = '#e8d0a8'; g.lineWidth = 3; g.strokeRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP);
    g.setLineDash([8, 10]); g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(CX, TOP); g.lineTo(CX, BOTTOM); g.stroke(); g.setLineDash([]);
    s.pens.forEach((p, i) => {
      if (!p.alive) return;
      g.save(); g.translate(p.x, p.y); g.rotate(p.angle);
      g.fillStyle = '#141414'; g.fillRect(-PEN_HALF - 2, -7, PEN_HALF * 2 + 4, 14);
      g.fillStyle = SEAT_COLORS[i]; g.fillRect(-PEN_HALF, -5, PEN_HALF * 2 - 7, 10);
      g.fillStyle = '#d7e2ea'; g.fillRect(-PEN_HALF + 7, -4, 5, 8);
      g.fillStyle = '#f2d8a4'; g.beginPath(); g.moveTo(PEN_HALF, -5); g.lineTo(PEN_HALF + 11, 0); g.lineTo(PEN_HALF, 5); g.fill();
      g.restore();
    });
    this.hud(g, s, names);
  },
};
