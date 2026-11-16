/**
 * Pen Fight: the last-bench desk duel. Players take turns: one flick each turn, pull back and let go.
 * Knock the other pen off the desk to win the round; send your own pen off and you lose it. Too soft
 * and nothing happens, too hard and your own pen sails off the edge: power against aim. First to three.
 */
import { H, r1, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261116-1239';

export const LAUNCH_TICKS = 480;          // eight seconds to aim and flick on your turn
export const ROUND_WINS = 3;
const RESULT_TICKS = 100, SIM_TICKS = 300, PEN_RADIUS = 24, PEN_HALF = 38, MAX_FLICKS = 10;
const LEFT = 58, RIGHT = W - 58, TOP = 68, BOTTOM = H - 36;
const CX = W / 2, CY = 214;
const FRICTION = 1.55;                      // per second: a full flick slides about 400 px
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function resetRound(s) {
  s.round += 1;
  s.phaseTicks = 0;
  s.simTicks = 0;
  s.lastRound = null;
  s.notice = null;
  s.flicks = 0;
  // the player who lost the last round starts the next one (the first round alternates)
  s.turn = s.nextStarter ?? ((s.round - 1) % 2);
  s.pens = seats(s.n).map((seat) => ({
    seat, startX: seat ? CX + 120 : CX - 120,
    x: seat ? CX + 120 : CX - 120, y: CY + (seat ? -10 : 10),
    vx: 0, vy: 0, angle: seat ? Math.PI : 0, spin: 0,
    power: 0, hits: 0, alive: true, actionWas: false, fell: 0,
  }));
  startTurn(s);
}
function startTurn(s) {
  s.phase = 'launch';
  s.launchLeft = LAUNCH_TICKS;
  s.phaseTicks = 0;
}

function finishRound(s, winner, reason) {
  const loser = winner < 0 ? -1 : 1 - winner;
  if (winner >= 0) {
    s.wins[winner] += 1;
    if (s.wins[winner] >= ROUND_WINS) s.done = true;
    s.nextStarter = loser;
  } else {
    s.emptyRounds += 1;
    if (s.emptyRounds >= 4) s.done = true;
  }
  s.lastRound = { winner, loser, reason };
  s.phase = 'result';
  s.phaseTicks = 0;
  s.ev.push({ k: 'round', seat: winner, victim: loser });
}

function launch(s, i, swipe) {
  const p = s.pens[i];
  if (s.phase !== 'launch' || i !== s.turn || !p?.alive) return false;
  let dx = Number.isFinite(swipe?.x) ? clamp(swipe.x, -1, 1) : (i ? -1 : 1);
  let dy = Number.isFinite(swipe?.y) ? clamp(swipe.y, -1, 1) : 0;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return false;
  dx /= length; dy /= length;
  const power = clamp(Number.isFinite(swipe?.power) ? swipe.power : 0.48, 0.12, 1);
  const speed = 140 + power * 520;
  p.power = power;
  p.spin = (s.t % 2 ? -1 : 1) * (1 + power * 4);
  p.vx = r1(dx * speed);
  p.vy = r1(dy * speed);
  p.angle = Math.atan2(dy, dx);
  s.flicks += 1;
  s.phase = 'flick'; s.simTicks = 0; s.phaseTicks = 0;
  s.ev.push({ k: 'fire', seat: i });
  return true;
}

function onDesk(p) {
  // a pen falls once its middle is past the edge (half of it hanging over still holds)
  return p.x > LEFT && p.x < RIGHT && p.y > TOP && p.y < BOTTOM;
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
  // the flicked pen hands most of its speed on: a clean hit sends the other one flying
  const impulse = -(1 + 0.62) * relative * 0.5;
  a.vx -= impulse * nx; a.vy -= impulse * ny;
  b.vx += impulse * nx; b.vy += impulse * ny;
  a.spin += (nx - ny) * 3; b.spin -= (nx - ny) * 3;
  const attacker = s.turn, victim = 1 - attacker;
  s.pens[attacker].hits += 1;
  if (Math.abs(impulse) > 40) s.ev.push({ k: 'hit', seat: attacker, victim });
}
/** Ten flicks and both pens still on: the pen nearer the middle of the desk takes the round. */
function settle(s) {
  const [a, b] = s.pens.map(centreDistance);
  finishRound(s, Math.abs(a - b) < 6 ? -1 : a < b ? 0 : 1, 'centre');
}
const moving = (p) => p.alive && Math.hypot(p.vx, p.vy) > 6;

/**
 * Where a flick would send your pen, worked out with the same sliding as the real thing: the line the
 * player sees while dragging. Stops at the other pen (a hit) or at the desk's edge (your pen falls off).
 */
export function aimPreview(s, seat, aim) {
  const p = s.pens?.[seat], foe = s.pens?.[1 - seat];
  if (!p?.alive || s.phase !== 'launch' || s.turn !== seat || !aim) return null;
  const len = Math.hypot(aim.x, aim.y);
  if (len < 0.01) return null;
  const dx = aim.x / len, dy = aim.y / len;
  const power = clamp(aim.power, 0.12, 1);
  let v = 140 + power * 520, x = p.x, y = p.y;
  const path = [[x, y]];
  let end = 'stop';
  for (let t = 0; t < SIM_TICKS && v > 6; t++) {
    x += dx * v * TICK; y += dy * v * TICK;
    v *= 1 - FRICTION * TICK;
    if (t % 3 === 0) path.push([x, y]);
    if (foe?.alive && Math.hypot(foe.x - x, foe.y - y) < PEN_RADIUS * 2) { end = 'hit'; break; }
    if (!onDesk({ x, y })) { end = 'off'; break; }
  }
  path.push([x, y]);
  return { x0: p.x, y0: p.y, x1: x, y1: y, path, end, power, seat };
}
/** The aim line on the flat picture: dots along the slide, a ring where it ends. */
export function drawAim(g, a) {
  if (!a) return;
  const color = a.end === 'off' ? '#ff4d4d' : a.end === 'hit' ? '#ffd23f' : '#ffffff';
  g.save();
  g.fillStyle = color;
  a.path.forEach(([x, y], k) => { if (k % 2) return; g.globalAlpha = 0.35 + 0.65 * (k / a.path.length); g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill(); });
  g.globalAlpha = 1; g.strokeStyle = color; g.lineWidth = 3;
  g.beginPath(); g.arc(a.x1, a.y1, a.end === 'hit' ? 16 : 12, 0, Math.PI * 2); g.stroke();
  g.restore();
}
const centreDistance = (p) => Math.hypot(p.x - CX, (p.y - CY) * 1.6);

export default {
  hint: 'Your turn: drag toward the other pen. The dotted line shows where yours will slide; let go to flick. Knock the other pen off the desk, but keep yours on!',
  swipe: true,
  // power comes from how far you drag, not how fast, and the line shows the slide before you let go
  aim: true,
  aimPreview,
  drawAim,
  swipeHint: 'Drag toward your rival, let go to flick',
  swipeSub: 'Longer drag = more power · the line shows where it stops',
  pad: [['a', 'Flick']],
  init({ n, seed }) {
    const s = { n, seed, t: 0, ev: [], wins: seats(n).map(() => 0), round: 0, emptyRounds: 0, done: false, nextStarter: null };
    resetRound(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    s.pens.forEach((p, i) => {
      const input = inputs[i] || {};
      let swipe = input.swipe;
      if (!swipe && input.a && !p.actionWas && i === s.turn) {
        const foe = s.pens[1 - i];
        const dx = foe ? foe.x - p.x : (i ? -1 : 1), dy = foe ? foe.y - p.y : 0;
        const d = Math.hypot(dx, dy) || 1;
        swipe = { x: dx / d, y: dy / d, power: 0.55 };
      }
      p.actionWas = !!input.a;
      if (swipe && i !== s.turn && s.phase === 'launch') s.notice = { seat: i, until: s.t + 60, text: 'WAIT FOR YOUR TURN' };
      if (swipe) launch(s, i, swipe);
    });

    if (s.phase === 'launch') {
      s.launchLeft -= 1;
      if (s.launchLeft <= 0) {
        // the time ran out: the turn passes
        s.notice = { seat: s.turn, until: s.t + 70, text: 'TOO SLOW · TURN PASSED' };
        s.flicks += 1;
        s.turn = 1 - s.turn;
        if (s.flicks >= MAX_FLICKS) settle(s); else startTurn(s);
      }
      return;
    }
    if (s.phase === 'flick') {
      s.simTicks += 1;
      s.phaseTicks += 1;
      s.pens.forEach((p) => {
        if (!p.alive) { p.fell += 1; return; }
        p.x += p.vx * TICK; p.y += p.vy * TICK;
        p.vx *= 1 - FRICTION * TICK; p.vy *= 1 - FRICTION * TICK;
        p.angle += p.spin * TICK;
        p.spin *= 1 - 2.2 * TICK;
        if (!onDesk(p)) { p.alive = false; s.ev.push({ k: 'crash', seat: p.seat }); }
        p.x = r1(p.x); p.y = r1(p.y); p.vx = r1(p.vx); p.vy = r1(p.vy);
      });
      collide(s);
      if (s.pens.some(moving) && s.simTicks < SIM_TICKS) return;
      // everything has stopped: who is still on the desk?
      const alive = s.pens.filter(p => p.alive);
      if (alive.length === 1) finishRound(s, alive[0].seat, s.pens[s.turn].alive ? 'knocked' : 'self-out');
      else if (!alive.length) finishRound(s, 1 - s.turn, 'self-out');   // both off: the flicker went too hard
      else {
        s.pens.forEach((p) => { p.vx = 0; p.vy = 0; p.spin = 0; });
        s.turn = 1 - s.turn;
        if (s.flicks >= MAX_FLICKS) settle(s); else startTurn(s);
      }
      return;
    }
    if (s.phase === 'result' && !s.done) {
      s.phaseTicks += 1;
      s.pens.forEach((p) => { if (!p.alive) p.fell += 1; });
      if (s.notice && s.t > s.notice.until) s.notice = null;
      if (s.phaseTicks >= RESULT_TICKS) resetRound(s);
    }
  },
  over(s) {
    return s.done ? { scores: s.wins.slice(), winners: s.wins.map((v, i) => v === Math.max(...s.wins) ? i : -1).filter(i => i >= 0) } : null;
  },
  bot(s, seat) {
    const p = s.pens[seat];
    if (s.phase !== 'launch' || s.turn !== seat || !p?.alive || s.launchLeft > LAUNCH_TICKS - 70 - (seat * 13 + s.round * 7) % 40) return {};
    const foe = s.pens[1 - seat];
    const dx = foe.x - p.x, dy = foe.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    // enough speed to reach the other pen and still hit hard, with a small human wobble
    const wobble = Math.sin(s.t * 0.37 + seat * 2.1 + s.flicks) * 0.16;
    const near = Math.min(foe.x - 58, 582 - foe.x, foe.y - 68, 364 - foe.y);
    // near the edge it goes for the knock-out; otherwise a measured push that keeps its own pen safe
    const need = (d * FRICTION + (near < 90 ? 230 : 120) - 140) / 520;
    const power = clamp(need + Math.cos(s.t * 0.21 + seat * 1.7) * 0.13, 0.15, 0.95);
    const ang = Math.atan2(dy, dx) + wobble;
    return { swipe: { x: Math.cos(ang), y: Math.sin(ang), power } };
  },
  hud(g, s, names) {
    scoreBar(g, s.wins.map((v, i) => [names[i] || `P${i + 1}`, `${v}/${ROUND_WINS}`, SEAT_COLORS[i]]));
    g.save();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 5;
    let text = '';
    const who = (i) => String(names[i] || `P${i + 1}`).toUpperCase();   // the banner is in capitals, the name too
    if (s.notice && s.t <= s.notice.until) text = s.notice.text;
    else if (s.phase === 'launch') text = `${who(s.turn)}'S FLICK · ${Math.ceil(s.launchLeft / 60)}s`;
    else if (s.phase === 'flick') text = 'FLICK!';
    else if (s.lastRound?.winner < 0) text = 'A DRAW · NEXT ROUND';
    else if (s.lastRound?.reason === 'self-out') text = `${who(s.lastRound.loser)} FLICKED OFF THE DESK!`;
    else if (s.lastRound?.reason === 'centre') text = `${who(s.lastRound.winner)} IS NEARER THE MIDDLE`;
    else if (s.lastRound?.winner >= 0) text = `${who(s.lastRound.winner)} KNOCKS IT OFF!`;
    g.font = '900 26px system-ui, sans-serif';
    g.strokeText(text, W / 2, 60); g.fillText(text, W / 2, 60);
    if (s.phase === 'launch' || s.phase === 'flick') {
      g.font = '700 14px system-ui, sans-serif'; g.fillStyle = '#e7eefb';
      g.fillText(`Round ${s.round} · flick ${Math.min(s.flicks + (s.phase === 'launch' ? 1 : 0), MAX_FLICKS)} of ${MAX_FLICKS}`, W / 2, 90);
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
      if (!p.alive && p.fell > 30) return;
      if (p.alive && s.phase === 'launch' && i === s.turn) {
        g.save(); g.strokeStyle = SEAT_COLORS[i]; g.globalAlpha = 0.55 + 0.35 * Math.sin(s.t * 0.15); g.lineWidth = 4;
        g.beginPath(); g.arc(p.x, p.y, PEN_HALF + 10, 0, Math.PI * 2); g.stroke(); g.restore();
      }
      g.save(); g.translate(p.x, p.y); g.rotate(p.angle);
      if (!p.alive) { const k = Math.max(0.2, 1 - p.fell / 30); g.scale(k, k); g.globalAlpha = k; }
      g.fillStyle = '#141414'; g.fillRect(-PEN_HALF - 2, -7, PEN_HALF * 2 + 4, 14);
      g.fillStyle = SEAT_COLORS[i]; g.fillRect(-PEN_HALF, -5, PEN_HALF * 2 - 7, 10);
      g.fillStyle = '#d7e2ea'; g.fillRect(-PEN_HALF + 7, -4, 5, 8);
      g.fillStyle = '#f2d8a4'; g.beginPath(); g.moveTo(PEN_HALF, -5); g.lineTo(PEN_HALF + 11, 0); g.lineTo(PEN_HALF, 5); g.fill();
      g.restore();
    });
    this.hud(g, s, names);
  },
};
