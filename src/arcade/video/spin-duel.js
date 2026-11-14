/**
 * Spin Duel: launch a schoolyard spinning top with one fast swipe. Both players get three seconds;
 * the tops then battle in a shallow arena. First to three round wins takes the match.
 */
import { H, r1, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1448';

export const LAUNCH_TICKS = 180;
export const ARENA_RADIUS = 142;
export const ROUND_WINS = 3;
const TOP_RADIUS = 19, SPIN_TICKS = 600, RESULT_TICKS = 90;
const CX = W / 2, CY = 220;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function resetRound(s) {
  s.round += 1;
  s.phase = 'launch';
  s.launchLeft = LAUNCH_TICKS;
  s.phaseTicks = 0;
  s.simTicks = 0;
  s.lastRound = null;
  s.notice = null;
  s.tops = seats(s.n).map((seat) => ({
    seat, x: CX + (seat === 0 ? -58 : 58), y: CY, vx: 0, vy: 0,
    angle: seat ? Math.PI : 0, spin: 0, spinDir: seat ? -1 : 1,
    power: 0, launched: false, alive: true, actionWas: false,
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
  const p = s.tops[i];
  if (s.phase !== 'launch' || p.launched) return false;
  let dx = Number.isFinite(swipe?.x) ? clamp(swipe.x, -1, 1) : (i ? -1 : 1);
  let dy = Number.isFinite(swipe?.y) ? clamp(swipe.y, -1, 1) : 0;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return false;
  dx /= length; dy /= length;
  const power = clamp(Number.isFinite(swipe?.power) ? swipe.power : 0.48, 0.12, 1);
  const speed = 120 + power * 290;
  p.launched = true;
  p.power = power;
  p.spin = 0.28 + power * 0.68;
  p.spinDir = dx * dy >= 0 ? 1 : -1;
  p.vx = r1(dx * speed);
  p.vy = r1(dy * speed);
  p.angle = Math.atan2(dy, dx);
  s.ev.push({ k: 'fire', seat: i });
  return true;
}

function winnerBySpin(s) {
  const score = (p) => p.spin * 0.75 + p.power * 0.12
    + (ARENA_RADIUS - Math.hypot(p.x - CX, p.y - CY)) / ARENA_RADIUS * 0.13;
  const a = score(s.tops[0]), b = score(s.tops[1]);
  return Math.abs(a - b) < 0.035 ? -1 : a > b ? 0 : 1;
}

function moveTop(s, p) {
  if (!p.alive || !p.launched) return;
  const ox = p.x - CX, oy = p.y - CY, radius = Math.hypot(ox, oy) || 1;
  p.vx += (-oy / radius) * p.spin * 30 * p.spinDir * TICK;
  p.vy += (ox / radius) * p.spin * 30 * p.spinDir * TICK;
  p.x += p.vx * TICK;
  p.y += p.vy * TICK;
  const dx = p.x - CX, dy = p.y - CY, distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance, ny = dy / distance;
  const radialSpeed = p.vx * nx + p.vy * ny;
  if (distance > ARENA_RADIUS - TOP_RADIUS && radialSpeed > 230) {
    p.alive = false;
    s.ev.push({ k: 'crash', seat: p.seat });
  } else if (distance > ARENA_RADIUS - TOP_RADIUS) {
    p.x = CX + nx * (ARENA_RADIUS - TOP_RADIUS);
    p.y = CY + ny * (ARENA_RADIUS - TOP_RADIUS);
    if (radialSpeed > 0) {
      p.vx -= nx * radialSpeed * 1.72;
      p.vy -= ny * radialSpeed * 1.72;
      p.spin = Math.max(0, p.spin - radialSpeed * 0.00008);
    }
  }
  p.vx *= 1 - 1.35 * TICK;
  p.vy *= 1 - 1.35 * TICK;
  p.spin = Math.max(0, p.spin - (0.038 + Math.hypot(p.vx, p.vy) * 0.000018) * TICK);
  p.angle += p.spin * p.spinDir * (11 + p.power * 8) * TICK;
  p.x = r1(p.x); p.y = r1(p.y); p.vx = r1(p.vx); p.vy = r1(p.vy);
  if (p.spin < 0.055 && Math.hypot(p.vx, p.vy) < 12) p.alive = false;
}

function collide(s) {
  const [a, b] = s.tops;
  if (!a?.alive || !b?.alive) return;
  const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy) || 0.001;
  if (distance >= TOP_RADIUS * 2) return;
  const nx = dx / distance, ny = dy / distance;
  const overlap = TOP_RADIUS * 2 - distance;
  a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
  const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (relative >= 0) return;
  const impulse = -(1 + 0.78) * relative * 0.5;
  a.vx -= impulse * nx; a.vy -= impulse * ny;
  b.vx += impulse * nx; b.vy += impulse * ny;
  a.spin = Math.max(0, a.spin - impulse * 0.00038);
  b.spin = Math.max(0, b.spin - impulse * 0.00038);
  if (s.t - s.lastHitAt > 12) {
    s.lastHitAt = s.t;
    s.hitAt = s.t;
    s.hitX = (a.x + b.x) * 0.5;
    s.hitY = (a.y + b.y) * 0.5;
    const victim = a.spin < b.spin ? 0 : b.spin < a.spin ? 1 : (a.power < b.power ? 0 : 1);
    s.ev.push({ k: 'hit', victim, seat: 1 - victim });
  }
}

export default {
  hint: 'Swipe fast on the arena in 3 seconds. Faster swipe means a stronger launch.',
  swipe: true,
  swipeHint: 'Swipe toward the other top',
  pad: [['a', 'Launch']],
  init({ n, seed }) {
    const s = { n, seed, t: 0, ev: [], wins: seats(n).map(() => 0), round: 0, emptyRounds: 0, done: false, lastHitAt: -99 };
    resetRound(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    s.tops.forEach((p, i) => {
      const input = inputs[i] || {};
      let swipe = input.swipe;
      if (!swipe && input.a && !p.actionWas) {
        const target = s.tops[1 - i];
        const dx = target ? target.x - p.x : (i ? -1 : 1);
        const dy = target ? target.y - p.y : 0;
        const d = Math.hypot(dx, dy) || 1;
        swipe = { x: dx / d, y: dy / d, power: 0.48 };
      }
      p.actionWas = !!input.a;
      if (swipe && !launch(s, i, swipe) && s.phase !== 'launch') s.notice = { seat: i, until: s.t + 75 };
    });

    if (s.phase === 'launch') {
      s.launchLeft -= 1;
      if (s.launchLeft <= 0) {
        const launched = s.tops.filter(p => p.launched);
        if (launched.length === 0) finishRound(s, -1, 'missed');
        else if (launched.length === 1) finishRound(s, launched[0].seat, 'missed');
        else { s.phase = 'spin'; s.phaseTicks = 0; s.simTicks = 0; }
      }
      return;
    }
    if (s.phase === 'spin') {
      s.simTicks += 1;
      s.phaseTicks += 1;
      s.tops.forEach(p => moveTop(s, p));
      collide(s);
      const alive = s.tops.filter(p => p.alive);
      if (alive.length < 2) finishRound(s, alive[0]?.seat ?? -1, 'knockout');
      else if (s.simTicks >= SPIN_TICKS) finishRound(s, winnerBySpin(s), 'spin-down');
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
    const p = s.tops[seat];
    if (s.phase !== 'launch' || !p || p.launched || s.launchLeft > (seat ? 82 : 106)) return {};
    const foe = s.tops[1 - seat];
    const dx = (foe?.x ?? CX) - p.x, dy = (foe?.y ?? CY) - p.y + Math.sin(s.round + seat) * 16;
    const d = Math.hypot(dx, dy) || 1;
    const power = 0.5 + ((s.round + seat) % 3) * 0.075;
    return { swipe: { x: dx / d, y: dy / d, power } };
  },
  hud(g, s, names) {
    scoreBar(g, s.wins.map((v, i) => [names[i] || `P${i + 1}`, `${v}/${ROUND_WINS}`, SEAT_COLORS[i]]));
    g.save();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 5;
    let text = '';
    if (s.phase === 'launch') text = `${Math.ceil(s.launchLeft / 60)}s · SWIPE NOW`;
    else if (s.phase === 'spin') text = 'TOPS IN THE ARENA!';
    else if (s.notice && s.t <= s.notice.until) text = 'TOO LATE · RETRY NEXT ROUND';
    else if (s.lastRound?.winner < 0) text = 'BOTH MISSED · TRY AGAIN';
    else if (s.lastRound?.reason === 'missed') text = `${names[s.lastRound.winner] || 'Opponent'} WINS · MISSED SWIPE`;
    else if (s.lastRound?.winner >= 0) text = `${names[s.lastRound.winner] || 'Player'} WINS THE ROUND`;
    g.font = '900 27px system-ui, sans-serif';
    g.strokeText(text, W / 2, 61); g.fillText(text, W / 2, 61);
    if (s.phase === 'launch') {
      s.tops.forEach((p, i) => {
        const x = i ? W - 105 : 105;
        g.font = '800 14px system-ui, sans-serif'; g.fillStyle = p.launched ? '#9bffb5' : '#ffe59a';
        g.fillText(p.launched ? 'LOCKED IN' : 'WAITING', x, 94);
      });
    } else if (s.phase === 'spin') {
      g.font = '700 15px system-ui, sans-serif'; g.fillStyle = '#e7eefb';
      g.fillText(`Round ${s.round} · ${Math.max(0, Math.ceil((SPIN_TICKS - s.simTicks) / 60))}s`, W / 2, 91);
    }
    g.restore();
  },
  draw(g, s, names) {
    const wood = g.createLinearGradient(0, 40, W, H);
    wood.addColorStop(0, '#725034'); wood.addColorStop(0.5, '#3e291b'); wood.addColorStop(1, '#805a36');
    g.fillStyle = wood; g.fillRect(0, 34, W, H - 34);
    g.strokeStyle = 'rgba(240,190,120,.16)'; g.lineWidth = 2;
    for (let y = 52; y < H; y += 34) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y - 9, W * 0.7, y + 9, W, y); g.stroke(); }
    const bowl = g.createRadialGradient(CX, CY - 16, 20, CX, CY, ARENA_RADIUS + 8);
    bowl.addColorStop(0, '#7b8795'); bowl.addColorStop(0.76, '#374250'); bowl.addColorStop(1, '#202732');
    g.fillStyle = bowl; g.beginPath(); g.arc(CX, CY, ARENA_RADIUS + 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d7e1eb'; g.lineWidth = 8; g.beginPath(); g.arc(CX, CY, ARENA_RADIUS, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.beginPath(); g.arc(CX, CY, ARENA_RADIUS * 0.56, 0, Math.PI * 2); g.stroke();
    s.tops.forEach((p, i) => {
      if (!p.alive) return;
      g.save(); g.translate(p.x, p.y); g.rotate(p.angle);
      g.fillStyle = SEAT_COLORS[i]; g.shadowColor = SEAT_COLORS[i]; g.shadowBlur = 18;
      g.beginPath(); g.moveTo(20, 0); g.lineTo(-8, -15); g.lineTo(-3, 0); g.lineTo(-8, 15); g.closePath(); g.fill();
      g.shadowBlur = 0; g.fillStyle = '#ffe8a0'; g.beginPath(); g.arc(0, 0, 7, 0, Math.PI * 2); g.fill();
      g.restore();
    });
    this.hud(g, s, names);
  },
};
