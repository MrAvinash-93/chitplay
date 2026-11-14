import { H, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1459';

const LEFT = 38, RIGHT = W - 38, TOP = 48, BOTTOM = H - 24;
const DURATION = 60 * 75, HIDE_TICKS = 60 * 5, TAG_DISTANCE = 28;
// tag games: "it" counts to three before giving chase, so everyone gets a fair start
const HEAD_START = 60 * 3;
const FOUND_DISTANCE = 60;
const SEARCH_TICKS = 170;   // how long a computer seeker spends on one hiding place
export const TAG_COVER = [[100, 92], [540, 92], [300, 180], [140, 310], [500, 310], [320, 340], [62, 205], [578, 205]];
const COVER = TAG_COVER;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const unit = (x, y) => { const d = Math.hypot(x, y) || 1; return [x / d, y / d]; };

function finish(s, winners, reason) {
  if (s.done) return;
  s.done = true;
  s.result = { scores: s.players.map(p => p.score), winners, reason };
  s.ev.push({ k: 'round', seat: winners.length === 1 ? winners[0] : -1, victim: -1 });
}

function move(p, input, speed) {
  let x = clamp(Number.isFinite(input.x) ? input.x : 0, -1, 1);
  let y = clamp(Number.isFinite(input.y) ? input.y : 0, -1, 1);
  [x, y] = unit(x, y);
  const boost = input.a ? 1.35 : 1;
  p.vx = x * speed * boost; p.vy = y * speed * boost;
  p.x = clamp(p.x + p.vx * TICK, LEFT, RIGHT);
  p.y = clamp(p.y + p.vy * TICK, TOP, BOTTOM);
}

function nearest(seat, players, accept) {
  const from = players[seat];
  let found = null, best = Infinity;
  players.forEach((p, i) => {
    if (i === seat || !accept(p, i)) return;
    const d = dist(from, p);
    if (d < best) { found = p; best = d; }
  });
  return found;
}

function seekerSignal(s) {
  if (s.mode !== 'lapa-chupi' || s.phase !== 'seek') return null;
  const seeker = s.players[s.it];
  if (!seeker) return null;
  let closest = Infinity;
  s.players.forEach((p, i) => {
    if (i !== s.it && p.alive && p.hidden) closest = Math.min(closest, dist(seeker, p));
  });
  if (!Number.isFinite(closest)) return { level: 0, label: 'NO HIDERS IN COVER' };
  if (closest <= 150) return { level: 3, label: 'HOT · CHECK NEARBY COVER' };
  if (closest <= 280) return { level: 2, label: 'WARM · CLOSING IN' };
  return { level: 1, label: 'COLD · SWEEP THE YARD' };
}

function drawSeekerSignal(g, signal) {
  if (!signal) return;
  const left = W / 2 - 126;
  const tint = signal.level === 3 ? '#ff725e' : signal.level === 2 ? '#ffd166' : signal.level === 1 ? '#83d7ff' : '#a9bd9c';
  g.save();
  g.fillStyle = 'rgba(10, 6, 3, .72)';
  g.fillRect(left, 103, 252, 34);
  g.font = '800 12px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = tint;
  g.fillText(`HIDER SIGNAL · ${signal.label}`, W / 2, 114);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = i < signal.level ? tint : 'rgba(255,255,255,.2)';
    g.fillRect(W / 2 - 31 + i * 22, 126, 16, 4);
  }
  g.restore();
}

/** The order a computer seeker checks the hiding places in: different each match, the same on every phone. */
function searchOrder(seed) {
  const order = COVER.map((_, i) => i);
  let x = (Math.abs(Math.floor(Number(seed) || 0)) * 2654435761) >>> 0 || 1;
  for (let i = order.length - 1; i > 0; i--) {
    x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
    const j = x % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function botMove(s, seat) {
  const p = s.players[seat], target = s.players[s.it];
  if (s.mode === 'lapa-chupi') {
    if (seat === s.it) {
      const seen = nearest(seat, s.players, q => q.alive && !q.hidden);
      if (seen) return { x: clamp((seen.x - p.x) / 80, -1, 1), y: clamp((seen.y - p.y) / 80, -1, 1), a: dist(p, seen) < 120 && p.breath > 0.3 };
      // check the hiding places one by one, in an order of its own each match, and look round each for a moment
      const order = searchOrder(s.seed);
      const waypoint = COVER[order[Math.floor(s.phaseTicks / SEARCH_TICKS) % order.length]];
      return { x: clamp((waypoint[0] - p.x) / 60, -1, 1), y: clamp((waypoint[1] - p.y) / 60, -1, 1) };
    }
    // a hider stays in their place until the seeker has seen them; only then do they run
    if (s.phase === 'hide' || !p.found) {
      // each hider takes its own place, the far ones first, away from where the seeker counts
      const den = { x: W / 2, y: BOTTOM - 14 };   // where the seeker counted, not where they are now
      const hiders = s.players.map((_, i) => i).filter(i => i !== s.it);
      const far = COVER.slice().sort((a, b) => Math.hypot(b[0] - den.x, b[1] - den.y) - Math.hypot(a[0] - den.x, a[1] - den.y));
      const cover = far[(hiders.indexOf(seat) + Math.abs(Math.floor(Number(s.seed) || 0))) % far.length];
      const d = Math.hypot(cover[0] - p.x, cover[1] - p.y);
      return d > 32 ? { x: clamp((cover[0] - p.x) / 70, -1, 1), y: clamp((cover[1] - p.y) / 70, -1, 1), a: true } : {};
    }
    return flee(p, target);
  }
  if (s.mode === 'baraf-pani') {
    if (seat === s.it) {
      const victim = nearest(seat, s.players, q => q.seat !== s.it && !q.frozen);
      return victim ? chase(p, victim) : {};
    }
    // free a frozen friend ("pani!") only when you'll get there well before the tagger does
    const friend = nearest(seat, s.players, q => q.frozen && q.seat !== s.it);
    if (friend && dist(p, friend) < 160 && dist(target, friend) > dist(p, friend) + 50) {
      return { x: clamp((friend.x - p.x) / 65, -1, 1), y: clamp((friend.y - p.y) / 65, -1, 1), a: p.breath > 0.3 };
    }
    return flee(p, target);
  }
  if (seat === s.it) {
    const victim = nearest(seat, s.players, () => true);
    return victim ? chase(p, victim) : {};
  }
  return flee(p, target);
}

function scores(s) {
  if (s.mode === 'pakda-padi') return s.players.map(p => Math.max(0, Math.floor((s.duration - p.itTicks) / 60)));
  // freeze tag is won as a side (the tagger, or the runners still free): the winners score 1
  if (s.mode === 'baraf-pani' && s.result) return s.players.map((_, i) => (s.result.winners.includes(i) ? 1 : 0));
  return s.players.map(p => p.score);
}

/** A runner's way out: away from the tagger, away from the walls, and a little to the side, never into a corner. */
/**
 * A runner's way out, as playground runners do it: circle round the middle of the yard, the way that
 * leads away from the tagger, and never into a corner. Close to the tagger, also step straight away.
 */
function flee(p, from) {
  // the loop: an oval round the middle, a different size for each runner so they don't bunch up
  const k = 0.85 + ((p.seat * 7) % 5) * 0.05;
  const cx = W / 2, cy = (TOP + BOTTOM) / 2, ax = 200 * k, ay = 112 * k;
  const ex = (p.x - cx) / ax, ey = (p.y - cy) / ay, r = Math.hypot(ex, ey) || 0.001;
  // the two ways round the loop; take the one heading away from the tagger
  // go round the way that keeps the tagger on the far side of the loop; with the tagger still in the
  // middle, or right across from you, keep going the way you were going
  p.spin = p.spin || (p.seat % 2 ? 1 : -1);
  const fx = (from.x - cx) / ax, fy = (from.y - cy) / ay;
  if (Math.hypot(fx, fy) > 0.3) {
    const gap = Math.atan2(ex * fy - ey * fx, ex * fx + ey * fy);   // > 0: the tagger is ahead, going the + way round
    if (Math.abs(gap) < 2.5) p.spin = gap > 0 ? -1 : 1;
  }
  const [tx, ty] = unit(-ey / r * ax * p.spin, ex / r * ay * p.spin);
  // drift back onto the loop
  const back = clamp((1 - r) * 1.6, -1, 1);
  let x = tx + back * ex / r, y = ty + back * ey / r;
  const d = dist(p, from);
  if (d < 110) { const [ux, uy] = unit(p.x - from.x, p.y - from.y); x += ux * (110 - d) / 60; y += uy * (110 - d) / 60; }
  [x, y] = unit(x, y);
  return { x, y, a: d < 90 && (p.breath ?? 1) > 0.2 };
}

/** A tagger cuts across to where the runner is going, not where they are, and saves the sprint for the last dash. */
function chase(p, q) {
  const d = dist(p, q), lead = Math.min(0.6, d / 260);
  const [x, y] = unit(q.x + q.vx * lead - p.x, q.y + q.vy * lead - p.y);
  return { x, y, a: d < 110 && p.breath > 0.3 };
}

function rulesResult(s, timeUp = false) {
  if (s.mode === 'lapa-chupi') {
    const hiders = s.players.map((p, i) => p.alive && i !== s.it ? i : -1).filter(i => i >= 0);
    // whoever stayed hidden to the end outscores any number of finds the seeker made
    if (timeUp) hiders.forEach((i) => { s.players[i].score = s.n; });
    return hiders.length ? hiders : [s.it];
  }
  if (s.mode === 'baraf-pani') {
    const free = s.players.map((p, i) => !p.frozen && i !== s.it ? i : -1).filter(i => i >= 0);
    return timeUp && free.length ? free : [s.it];
  }
  const values = scores(s), best = Math.max(...values);
  return values.map((value, i) => value === best ? i : -1).filter(i => i >= 0);
}

/* ─── the flat (2D) picture: a schoolyard seen from above ─── */
const yards = new Map();
const SKINS = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d'];
const HAIR = ['#1c1410', '#3b2414', '#1c1410', '#5a3a1e'];
const rounded = (g, x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
/** The ground, drawn once per game and kept: mown grass, or a frosty yard for freeze tag. */
function yardPicture(mode) {
  if (yards.has(mode)) return yards.get(mode);
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = W * 2; c.height = H * 2;
  const g = c.getContext('2d');
  g.scale(2, 2);
  const ice = mode === 'baraf-pani';
  let seed = mode.length * 97;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = ice ? '#8cc6db' : '#5f8f43'; g.fillRect(0, 0, W, H);
  // the yard: stripes like a freshly mown field, or packed snow with a blue sheen
  const x0 = LEFT - 14, y0 = TOP - 16, w = RIGHT - LEFT + 28, h = BOTTOM - TOP + 30;
  for (let i = 0; i < 12; i++) {
    g.fillStyle = ice ? (i % 2 ? '#e4f6fb' : '#d8f0f7') : (i % 2 ? '#7fb85a' : '#74ad50');
    g.fillRect(x0 + (w / 12) * i, y0, w / 12 + 1, h);
  }
  for (let i = 0; i < 420; i++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * h;
    if (ice) { g.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.5})`; g.fillRect(x, y, 1.5, 1.5); }
    else { g.strokeStyle = `rgba(${rnd() < 0.5 ? '40,90,30' : '170,215,120'},${0.35 + rnd() * 0.3})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y - 3 - rnd() * 3); g.stroke(); }
  }
  // the chalk line round the yard and the circle in the middle, a bit smudged like the real thing
  g.strokeStyle = ice ? 'rgba(80,140,170,.55)' : 'rgba(255,250,225,.85)'; g.lineWidth = 3; g.setLineDash([14, 3]);
  rounded(g, LEFT - 6, TOP - 6, RIGHT - LEFT + 12, BOTTOM - TOP + 12, 14); g.stroke();
  g.setLineDash([]);
  g.beginPath(); g.arc(W / 2, (TOP + BOTTOM) / 2, 34, 0, Math.PI * 2); g.stroke();
  const shade = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.28)');
  g.fillStyle = shade; g.fillRect(0, 0, W, H);
  yards.set(mode, c);
  return c;
}
/** A hiding place: a bush, a block of ice, or a bench, each with its shadow. */
function drawCover(g, mode, x, y, i) {
  g.save();
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(x + 5, y + 8, 28, 15, 0, 0, Math.PI * 2); g.fill();
  if (mode === 'baraf-pani') {
    const grad = g.createLinearGradient(x - 24, y - 18, x + 24, y + 18);
    grad.addColorStop(0, '#f4fdff'); grad.addColorStop(1, '#8fd0e6');
    g.fillStyle = grad; g.strokeStyle = 'rgba(70,140,170,.8)'; g.lineWidth = 2;
    rounded(g, x - 24, y - 17, 48, 34, 7); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 16, y - 10); g.lineTo(x - 2, y - 10); g.stroke();
  } else if (mode === 'lapa-chupi' || i % 2 === 0) {
    // a round bush: three overlapping clumps, darker underneath, a light catch on top
    [[-12, 4, 15], [12, 3, 15], [0, -6, 17]].forEach(([dx, dy, r]) => {
      const leaf = g.createRadialGradient(x + dx - 5, y + dy - 6, 2, x + dx, y + dy, r);
      leaf.addColorStop(0, mode === 'lapa-chupi' ? '#7cc35e' : '#6fb956'); leaf.addColorStop(1, '#2f6a2c');
      g.fillStyle = leaf; g.beginPath(); g.arc(x + dx, y + dy, r, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = 'rgba(255,255,255,.25)'; [[-6, -12], [8, -4], [-14, 0]].forEach(([dx, dy]) => { g.beginPath(); g.arc(x + dx, y + dy, 2.2, 0, Math.PI * 2); g.fill(); });
  } else {
    // a school bench: two planks on dark legs
    g.fillStyle = '#4a2f1b'; [[-20, -12], [16, -12], [-20, 8], [16, 8]].forEach(([dx, dy]) => g.fillRect(x + dx, y + dy, 5, 5));
    g.fillStyle = '#a8703f'; g.fillRect(x - 25, y - 10, 50, 9); g.fillRect(x - 25, y + 2, 50, 9);
    g.fillStyle = 'rgba(255,230,190,.35)'; g.fillRect(x - 25, y - 10, 50, 2); g.fillRect(x - 25, y + 2, 50, 2);
  }
  g.restore();
}
/** A child seen from above: shadow, shoulders in their colour, head and hair, facing the way they run. */
function drawKid(g, s, p, i, name) {
  const it = i === s.it, moving = Math.hypot(p.vx, p.vy) > 5;
  const face = moving ? Math.atan2(p.vy, p.vx) : -Math.PI / 2;
  g.save();
  g.translate(p.x, p.y);
  if (it) { g.fillStyle = 'rgba(255,214,60,.28)'; g.beginPath(); g.arc(0, 4, 24, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(3, 8, 15, 8, 0, 0, Math.PI * 2); g.fill();
  g.rotate(face + Math.PI / 2);
  // arms swing while running
  const swing = moving ? Math.sin((s.t + i * 9) * 0.5) * 5 : 0;
  g.fillStyle = SKINS[i % 4];
  g.beginPath(); g.arc(-13, swing, 4, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(13, -swing, 4, 0, Math.PI * 2); g.fill();
  const color = p.frozen ? '#9fe4fb' : SEAT_COLORS[i];
  const shirt = g.createLinearGradient(-13, -8, 13, 8);
  shirt.addColorStop(0, '#ffffff'); shirt.addColorStop(0.2, color); shirt.addColorStop(1, color);
  g.fillStyle = shirt; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5;
  g.beginPath(); g.ellipse(0, 1, 13, 9, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = SKINS[i % 4]; g.beginPath(); g.arc(0, -1, 7.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = HAIR[i % 4]; g.beginPath(); g.arc(0, -1, 7.5, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill();
  if (it) { g.fillStyle = '#ffd23f'; g.strokeStyle = '#8a6400'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, -1, 7.8, Math.PI, Math.PI * 2); g.closePath(); g.fill(); g.stroke(); g.fillRect(-3, -12, 6, 4); }
  g.restore();
  // frozen: a see-through block of ice round them, with a sparkle
  if (p.frozen) {
    g.save();
    g.fillStyle = 'rgba(190,240,255,.45)'; g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2;
    rounded(g, p.x - 18, p.y - 18, 36, 36, 8); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.font = '700 12px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('❄', p.x + 12, p.y - 12);
    g.restore();
  }
  // name tag, and how much breath is left after a sprint
  g.save();
  g.font = '800 10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'bottom';
  const label = it ? `${name} · IT` : name;
  const tw = g.measureText(label).width + 10;
  g.fillStyle = it ? 'rgba(120,85,0,.85)' : 'rgba(10,6,3,.62)';
  rounded(g, p.x - tw / 2, p.y - 36, tw, 14, 7); g.fill();
  g.fillStyle = it ? '#ffe9a0' : '#fff'; g.fillText(label, p.x, p.y - 23.5);
  if ((p.breath ?? 1) < 0.98 && !p.frozen) {
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(p.x - 12, p.y + 17, 24, 4);
    g.fillStyle = p.breath < 0.25 ? '#ff7a5a' : '#8ff0ff'; g.fillRect(p.x - 12, p.y + 17, 24 * p.breath, 4);
  }
  g.restore();
}
function drawYard(g, s, names) {
  const pic = yardPicture(s.mode);
  if (pic) g.drawImage(pic, 0, 0, W, H);
  else { g.fillStyle = '#7fb963'; g.fillRect(0, 0, W, H); }
  COVER.forEach(([x, y], i) => drawCover(g, s.mode, x, y, i));
  // the ones further down the yard are drawn last, so they stand in front
  s.players
    .map((p, i) => [p, i])
    .filter(([p]) => p.alive && !p.hidden && Number.isFinite(p.x) && Number.isFinite(p.y))
    .sort(([a], [b]) => a.y - b.y)
    .forEach(([p, i]) => drawKid(g, s, p, i, names?.[i] || `P${i + 1}`));
}

export function makeTagGame(mode) {
  const lapa = mode === 'lapa-chupi', freeze = mode === 'baraf-pani';
  const duration = lapa ? DURATION : freeze ? DURATION : 60 * 60;
  const label = lapa ? 'HIDE & SEEK' : freeze ? 'FREEZE TAG' : 'TAG';
  return {
    hint: lapa ? 'Hide behind cover, or find and tag the hiders.' : freeze ? 'The tagger freezes players. Tag a frozen teammate to free them.' : 'Run, dodge and pass the tag before time runs out.',
    analog: true,
    pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶'], ['a', 'Sprint']],
    init({ n, seed }) {
      // who is "it" changes from match to match, as when the playground counts out "eeny meeny"
      const it = Math.abs(Math.floor(Number(seed) || 0)) % n;
      const cx = W / 2, cy = (TOP + BOTTOM) / 2;
      const runners = seats(n).filter(i => i !== it);
      const players = seats(n).map((seat) => {
        // "it" starts in the middle; everyone else stands round them, a fair run away
        const k = runners.indexOf(seat);
        const angle = k / runners.length * Math.PI * 2 + Math.PI / 4;
        const den = mode === 'lapa-chupi' ? [cx, BOTTOM - 14] : [cx, cy];   // hide and seek: the seeker counts by the wall
        const [x, y] = seat === it ? den : [cx + Math.cos(angle) * 190, cy + Math.sin(angle) * 120];
        return {
          seat, x: Math.round(x), y: Math.round(y),
          vx: 0, vy: 0, alive: true, frozen: false, hidden: false, hideTicks: 0,
          found: false, score: 0, itTicks: 0, breath: 1,
        };
      });
      return {
        n, seed, mode, label, t: 0, ev: [], players, it, duration,
        left: duration, phase: lapa ? 'hide' : 'play', phaseTicks: 0,
        tagCooldown: 0, done: false, result: null,
      };
    },
    step(s, inputs) {
      if (s.done) return;
      s.t += 1; s.left = Math.max(0, s.left - 1); s.phaseTicks += 1;
      if (s.tagCooldown > 0) s.tagCooldown -= 1;
      if (s.phase === 'hide' && s.phaseTicks >= HIDE_TICKS) {
        s.phase = 'seek'; s.phaseTicks = 0;
        s.ev.push({ k: 'level', seat: -1, level: 1, name: 'Seek!' });
      }
      s.players.forEach((p, i) => {
        if (!p.alive || p.frozen) { p.vx = 0; p.vy = 0; return; }
        // hide and seek: the seeker stays put, eyes shut, while the others hide
        if (s.phase === 'hide' && i === s.it) { p.vx = 0; p.vy = 0; return; }
        const input = inputs[i] || {};
        if (s.mode !== 'lapa-chupi' && i === s.it && s.t <= HEAD_START) { p.vx = 0; p.vy = 0; return; }
        // one on one, "it" must corner the runner (a touch slower); against a team that frees each other, a touch faster
        const speed = i === s.it ? (s.mode === 'lapa-chupi' ? 142 : s.n === 2 ? 137 : s.n === 3 ? 132 : 136) : 140;
        // a sprint lasts about a second and a half, then you're out of breath until you've walked a while
        const sprint = !!input.a && (p.breath ?? 1) > 0.04;
        p.breath = clamp((p.breath ?? 1) + (sprint ? -1 / 90 : 1 / 260), 0, 1);
        move(p, { ...input, a: sprint }, speed);
      });

      if (s.mode === 'lapa-chupi' && s.phase === 'seek') {
        const seeker = s.players[s.it];
        s.players.forEach((p, i) => {
          if (i === s.it || !p.alive) return;
          const nearCover = COVER.some(([x, y]) => Math.hypot(p.x - x, p.y - y) < 38);
          const still = Math.hypot(p.vx, p.vy) < 20;
          p.hideTicks = nearCover && still ? p.hideTicks + 1 : 0;
          const distance = dist(p, seeker);
          if (distance < FOUND_DISTANCE) { p.found = true; p.hidden = false; p.hideTicks = 0; }
          else p.hidden = p.hideTicks >= 32 && !p.found;
          if (distance <= TAG_DISTANCE) {
            p.alive = false; p.hidden = false; seeker.score += 1;
            s.ev.push({ k: 'tag', seat: s.it, victim: i });
          }
        });
        if (s.players.every((p, i) => i === s.it || !p.alive)) finish(s, [s.it], 'found-everyone');
      } else if (s.mode === 'baraf-pani') {
        const tagger = s.players[s.it];
        s.players.forEach((p, i) => {
          if (i === s.it || p.frozen) return;
          if (s.tagCooldown <= 0 && dist(p, tagger) <= TAG_DISTANCE) {
            p.frozen = true; p.score = 0; s.tagCooldown = 42;
            s.ev.push({ k: 'freeze', seat: s.it, victim: i });
          }
        });
        s.players.forEach((p, i) => {
          if (i === s.it || p.frozen) return;
          const friend = s.players.find((q, j) => j !== i && j !== s.it && q.frozen && dist(p, q) <= 34);
          if (friend) { friend.frozen = false; friend.score += 1; s.ev.push({ k: 'thaw', seat: i, victim: friend.seat }); }
        });
        if (s.players.every((p, i) => i === s.it || p.frozen)) finish(s, [s.it], 'all-frozen');
      } else if (s.mode === 'pakda-padi') {
        s.players[s.it].itTicks += 1;
        if (s.tagCooldown <= 0) {
          const tagger = s.players[s.it];
          // no tag-backs: whoever just passed you the tag is safe from you for two seconds
          const victim = nearest(s.it, s.players, q => !(q.seat === s.back && s.t < s.backUntil));
          if (victim && dist(victim, tagger) <= TAG_DISTANCE) {
            tagger.score += 1; s.back = tagger.seat; s.backUntil = s.t + 120; s.it = victim.seat; s.tagCooldown = 35;
            s.ev.push({ k: 'tag', seat: tagger.seat, victim: victim.seat });
          }
        }
      }

      if (!s.done && s.left <= 0) finish(s, rulesResult(s, true), 'time');
    },
    over(s) { return s.done ? { scores: scores(s), winners: s.result.winners.slice(), endless: false } : null; },
    bot(s, seat) {
      const p = s.players[seat];
      if (!p?.alive || (p.frozen && s.mode !== 'baraf-pani')) return {};
      if (s.mode === 'lapa-chupi' && s.phase === 'hide' && seat === s.it) return {};
      return botMove(s, seat);
    },
    publicState(s, viewerSeat) {
      if (s.mode !== 'lapa-chupi') return s;
      return {
        ...s,
        isSeeker: viewerSeat === s.it,
        seekSignal: viewerSeat === s.it ? seekerSignal(s) : null,
        players: s.players.map((p, i) => {
          const concealed = i !== viewerSeat && i !== s.it && p.alive && p.hidden && !p.found;
          return concealed ? { ...p, x: null, y: null, vx: 0, vy: 0, hideTicks: 0 } : { ...p };
        }),
        result: s.result ? { ...s.result, scores: s.result.scores.slice(), winners: s.result.winners.slice() } : null,
        ev: s.ev.map(event => ({ ...event })),
      };
    },
    hud(g, s, names) {
      const rows = s.players.map((p, i) => {
        let status;
        if (i === s.it) status = 'IT';
        else if (s.mode === 'lapa-chupi') status = !p.alive ? 'FOUND' : p.hidden ? 'HIDDEN' : p.found ? 'SEEN' : 'HIDE';
        else if (s.mode === 'baraf-pani') status = p.frozen ? 'FROZEN' : 'RUN';
        else status = `${Math.ceil(p.itTicks / 60)}s IT`;
        return [names[i] || `P${i + 1}`, status, SEAT_COLORS[i]];
      });
      scoreBar(g, rows);
      g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 5;
      const counting = s.mode !== 'lapa-chupi' && s.t <= HEAD_START;
      const message = s.phase === 'hide' ? `HIDE · ${Math.ceil((HIDE_TICKS - s.phaseTicks) / 60)}s`
        : counting ? `${names[s.it] || 'IT'} COUNTS · ${Math.max(1, Math.ceil((HEAD_START - s.t) / 60))}… RUN!`
        : s.mode === 'lapa-chupi' ? `SEEK · ${Math.ceil(s.left / 60)}s`
          : s.mode === 'baraf-pani' ? `FREEZE TAG · ${Math.ceil(s.left / 60)}s`
            : `${label} · ${Math.ceil(s.left / 60)}s`;
      g.font = '900 25px system-ui, sans-serif';
      g.strokeText(message, W / 2, 60); g.fillText(message, W / 2, 60);
      g.font = '700 14px system-ui, sans-serif'; g.fillStyle = '#ffe49a';
      const isSeeker = s.isSeeker ?? true;
      const sub = s.mode === 'lapa-chupi' ? s.phase === 'hide'
        ? 'Stop near cover and stay still to hide'
        : isSeeker ? 'Search the yard · the signal gets warmer as you get closer'
          : 'Stay hidden by cover · avoid the seeker'
        : s.mode === 'baraf-pani' ? 'Tag frozen friends to free them'
          : 'Avoid the player marked IT';
      g.lineWidth = 4; g.strokeStyle = 'rgba(20,12,4,.75)'; g.strokeText(sub, W / 2, 91);   // readable on snow as well as grass
      g.fillText(sub, W / 2, 91);
      if (s.mode === 'lapa-chupi' && s.phase === 'seek' && isSeeker) {
        drawSeekerSignal(g, s.seekSignal ?? seekerSignal(s));
      }
      g.restore();
    },
    draw(g, s, names) {
      drawYard(g, s, names);
      this.hud(g, s, names);
    },
  };
}
