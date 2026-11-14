/**
 * Hungry Snake: eat the samosas, grow longer, don't hit a wall, yourself or anyone else. It speeds
 * up as you eat. Endless alone; with others, the last snake alive also scores a bonus.
 *
 * Every six samosas is a new level: the snakes speed up, a short brick wall goes up somewhere on the
 * field (away from every snake's head), and a golden samosa appears for a few seconds: three points.
 */
import { H, levelTag, rnd, scoreBar, SEAT_COLORS, seats, W } from './lib.js?v=20261114-1428';

export const COLS = 32, ROWS = 18;
const CELL = 20, TOP = 40;
const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const START = [[4, 4, 'r'], [27, 13, 'l'], [27, 4, 'l'], [4, 13, 'r']];
const key = (x, y) => x + y * COLS;
export const PER_LEVEL = 6, GOLD_TICKS = 60 * 7, MAX_WALLS = 18;
export const STAGES = ['Open field', 'First bricks', 'Brick maze', 'Fast and tight'];
export const levelOf = (eaten) => 1 + Math.floor(eaten / PER_LEVEL);
export const stageName = (level) => STAGES[Math.min(level, STAGES.length) - 1];
const isWall = (s, x, y) => (s.walls || []).some(([a, b]) => a === x && b === y);
const taken = (s, x, y) => isWall(s, x, y) || s.snakes.some(n => n.body.some(([a, b]) => a === x && b === y)) || (s.gold && s.gold.x === x && s.gold.y === y);
/** A free cell, and if asked, well away from every snake's head. */
function freeCell(s, room = 0) {
  for (let t = 0; t < 200; t++) {
    const x = Math.floor(rnd(s) * COLS), y = Math.floor(rnd(s) * ROWS);
    if (taken(s, x, y) || (s.food && s.food[0] === x && s.food[1] === y)) continue;
    if (room && s.snakes.some(n => n.alive && Math.abs(n.body[0][0] - x) + Math.abs(n.body[0][1] - y) < room)) continue;
    return [x, y];
  }
  return null;
}
function placeFood(s) {
  const c = freeCell(s);
  if (c) s.food = c;
}
/** A short line of bricks, three long, that touches nothing and keeps off the edges. */
function addWall(s) {
  if (s.walls.length >= MAX_WALLS) return;
  for (let t = 0; t < 40; t++) {
    const at = freeCell(s, 6);
    if (!at) return;
    const across = rnd(s) < 0.5;
    const cells = [0, 1, 2].map(k => (across ? [at[0] + k, at[1]] : [at[0], at[1] + k]));
    if (cells.some(([x, y]) => x < 1 || x >= COLS - 1 || y < 1 || y >= ROWS - 1 || taken(s, x, y) || (s.food[0] === x && s.food[1] === y))) continue;
    s.walls.push(...cells);
    return;
  }
}

/* the flat picture */
let fieldPicture = null;
/** A colour made lighter (k > 0) or darker (k < 0). */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return `rgb(${c.map(v => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))).join(',')})`;
}

export default {
  hint: 'Drag to turn',
  pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶']],
  init({ n, seed }) {
    const s = { n, seed, t: 0, wait: 0, ev: [], food: [16, 9], eaten: 0, level: 1, levelAt: -999, walls: [], gold: null,
      snakes: seats(n).map((i) => {
        const [x, y, d] = START[i];
        const [dx] = DIRS[d];
        return { body: [[x, y], [x - dx, y], [x - dx * 2, y]], d, next: d, alive: true, score: 0, pop: 0, popAt: -999 };
      }) };
    placeFood(s);
    return s;
  },
  step(s, inputs) {
    s.t += 1;
    // the last key pressed that doesn't turn a snake back on itself
    s.snakes.forEach((n, i) => {
      if (!n.alive) return;
      const inp = inputs[i] || {};
      ['u', 'd', 'l', 'r'].forEach((k) => {
        if (!inp[k]) return;
        const [dx, dy] = DIRS[k], [cx, cy] = DIRS[n.d];
        if (dx !== -cx || dy !== -cy) n.next = k;
      });
    });
    if (s.gold && --s.gold.ttl <= 0) s.gold = null;
    if (++s.wait < Math.max(4, 10 - (s.level - 1))) return;
    s.wait = 0;
    const heads = s.snakes.map((n) => {
      if (!n.alive) return null;
      n.d = n.next;
      const [dx, dy] = DIRS[n.d];
      return [n.body[0][0] + dx, n.body[0][1] + dy];
    });
    const full = new Set();
    s.snakes.forEach(n => { if (n.alive) n.body.slice(0, -1).forEach(([x, y]) => full.add(key(x, y))); });
    s.walls.forEach(([x, y]) => full.add(key(x, y)));
    s.snakes.forEach((n, i) => {
      const h = heads[i];
      if (!h) return;
      const twin = heads.some((o, j) => o && j !== i && o[0] === h[0] && o[1] === h[1]);
      if (h[0] < 0 || h[0] >= COLS || h[1] < 0 || h[1] >= ROWS || full.has(key(h[0], h[1])) || twin) {
        n.alive = false;
        s.ev.push({ k: 'crash', seat: i });
        return;
      }
      n.body.unshift(h);
      if (h[0] === s.food[0] && h[1] === s.food[1]) {
        n.score += 1;
        n.pop = 1; n.popAt = s.t;
        s.eaten += 1;
        s.ev.push({ k: 'star', seat: i, score: n.score });
        placeFood(s);
      } else if (s.gold && h[0] === s.gold.x && h[1] === s.gold.y) {
        n.score += 3;
        n.pop = 3; n.popAt = s.t;
        s.gold = null;
        s.ev.push({ k: 'star', seat: i, score: n.score, combo: 3 });
      } else n.body.pop();
    });
    if (levelOf(s.eaten) > s.level) {
      s.level = levelOf(s.eaten);
      s.levelAt = s.t;
      addWall(s);
      const g = freeCell(s, 4);
      if (g) s.gold = { x: g[0], y: g[1], ttl: GOLD_TICKS };
      s.ev.push({ k: 'level', seat: -1, level: s.level, name: stageName(s.level) });
    }
  },
  over(s) {
    const alive = s.snakes.map((n, i) => n.alive ? i : -1).filter(i => i >= 0);
    if (s.n > 1 && alive.length === 1) {
      return { scores: s.snakes.map((n, i) => n.score + (i === alive[0] ? 3 : 0)), winners: alive, endless: true };
    }
    if (alive.length) return null;
    const scores = s.snakes.map(n => n.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // heads for the food, and turns away from anything right in front of it
  bot(s, seat) {
    const n = s.snakes[seat];
    if (!n?.alive) return {};
    const block = new Set();
    s.snakes.forEach(o => { if (o.alive) o.body.forEach(([x, y]) => block.add(key(x, y))); });
    s.walls.forEach(([x, y]) => block.add(key(x, y)));
    const safe = (k) => {
      const [dx, dy] = DIRS[k];
      const x = n.body[0][0] + dx, y = n.body[0][1] + dy;
      return x >= 0 && x < COLS && y >= 0 && y < ROWS && !block.has(key(x, y));
    };
    const [hx, hy] = n.body[0];
    // the golden samosa, if it is close enough to reach in time
    const goGold = s.gold && Math.abs(s.gold.x - hx) + Math.abs(s.gold.y - hy) < 12;
    const [fx, fy] = goGold ? [s.gold.x, s.gold.y] : s.food;
    const wish = [];
    if (fx > hx) wish.push('r');
    if (fx < hx) wish.push('l');
    if (fy > hy) wish.push('d');
    if (fy < hy) wish.push('u');
    const [cx, cy] = DIRS[n.d];
    const options = [...wish, n.d, 'u', 'r', 'd', 'l'].filter((k) => { const [dx, dy] = DIRS[k]; return !(dx === -cx && dy === -cy) && safe(k); });
    return options.length ? { [options[0]]: true } : {};
  },
  hud(g, s, names) {
    scoreBar(g, s.snakes.map((n, i) => [names[i] || `P${i + 1}`, n.alive ? n.score : `${n.score} ✕`, SEAT_COLORS[i]]));
    // a samosa just eaten: +1 (or +3 for a golden one) rising over that player's score
    s.snakes.forEach((n, i) => {
      const age = s.t - n.popAt;
      if (age < 0 || age >= 36) return;
      const w = W / s.n;
      g.save(); g.globalAlpha = 1 - age / 36; g.font = `900 ${n.pop >= 3 ? 30 : 24}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; g.fillStyle = n.pop >= 3 ? '#ffd23f' : '#fff';
      const y = 70 - age * 0.5; g.strokeText(`+${n.pop}`, w * (i + 0.5), y); g.fillText(`+${n.pop}`, w * (i + 0.5), y);
      g.restore();
    });
    levelTag(g, s.level, stageName(s.level), s.t - s.levelAt, H - 14);
  },
  draw(g, s, names) {
    // the field: drawn once and kept (soft chequered grass, tufts and a darker edge)
    if (!fieldPicture && typeof document !== 'undefined') {
      fieldPicture = document.createElement('canvas');
      fieldPicture.width = W * 2; fieldPicture.height = H * 2;
      const f = fieldPicture.getContext('2d');
      f.scale(2, 2);
      f.fillStyle = '#1d2c1b'; f.fillRect(0, 0, W, H);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        f.fillStyle = (x + y) % 2 ? '#4d8a44' : '#559349';
        f.fillRect(x * CELL, TOP + y * CELL, CELL, CELL);
      }
      let seed = 5;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 700; i++) {
        const x = rnd() * W, y = TOP + rnd() * ROWS * CELL;
        f.strokeStyle = `rgba(${rnd() < 0.5 ? '30,70,25' : '150,205,110'},${0.3 + rnd() * 0.3})`; f.lineWidth = 1;
        f.beginPath(); f.moveTo(x, y); f.lineTo(x + (rnd() - 0.5) * 3, y - 2 - rnd() * 3); f.stroke();
      }
      const v = f.createRadialGradient(W / 2, TOP + ROWS * CELL / 2, 120, W / 2, TOP + ROWS * CELL / 2, W * 0.6);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.3)');
      f.fillStyle = v; f.fillRect(0, TOP, W, ROWS * CELL);
    }
    if (fieldPicture) g.drawImage(fieldPicture, 0, 0, W, H);
    else { g.fillStyle = '#4d8a44'; g.fillRect(0, 0, W, H); }
    const cx = (x) => x * CELL + CELL / 2, cy = (y) => TOP + y * CELL + CELL / 2;
    // a samosa: golden pastry with a crimped edge and a little shadow
    const samosa = (x, y, gold) => {
      const X = cx(x), Y = cy(y);
      g.save();
      if (gold) { g.fillStyle = 'rgba(255,215,64,.35)'; g.beginPath(); g.arc(X, Y, 14 + Math.sin(s.t / 6) * 2, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(X + 2, Y + 8, 9, 3.5, 0, 0, Math.PI * 2); g.fill();
      const crust = g.createLinearGradient(X, Y - 9, X, Y + 8);
      crust.addColorStop(0, gold ? '#fff2a8' : '#f6c36a'); crust.addColorStop(1, gold ? '#e0a400' : '#b8701f');
      g.fillStyle = crust; g.strokeStyle = gold ? '#8a6400' : '#6e3d0c'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(X, Y - 9); g.quadraticCurveTo(X + 3, Y - 4, X + 9, Y + 7); g.quadraticCurveTo(X, Y + 9, X - 9, Y + 7); g.quadraticCurveTo(X - 3, Y - 4, X, Y - 9); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(110,60,15,.55)'; g.beginPath(); g.moveTo(X - 6, Y + 6); g.lineTo(X + 6, Y + 6); g.stroke();
      g.restore();
    };
    samosa(s.food[0], s.food[1], false);
    if (s.gold && (s.gold.ttl > 90 || Math.floor(s.t / 6) % 2)) samosa(s.gold.x, s.gold.y, true);
    // brick walls, each with its shadow and mortar lines
    s.walls.forEach(([x, y]) => {
      const X = x * CELL, Y = TOP + y * CELL;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X + 3, Y + 4, CELL, CELL);
      g.fillStyle = '#a4563a'; g.fillRect(X, Y, CELL, CELL);
      g.strokeStyle = '#e8d6c0'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(X, Y + 7); g.lineTo(X + CELL, Y + 7); g.moveTo(X, Y + 14); g.lineTo(X + CELL, Y + 14);
      g.moveTo(X + 10, Y); g.lineTo(X + 10, Y + 7); g.moveTo(X + 5, Y + 7); g.lineTo(X + 5, Y + 14); g.moveTo(X + 15, Y + 7); g.lineTo(X + 15, Y + 14); g.moveTo(X + 10, Y + 14); g.lineTo(X + 10, Y + CELL); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(X, Y, CELL, 2);
    });
    // the snakes: one smooth round body, darker underneath, a stripe pattern, then the head
    s.snakes.forEach((n, i) => {
      if (!n.body.length) return;
      g.save();
      g.globalAlpha = n.alive ? 1 : 0.35;
      g.lineCap = 'round'; g.lineJoin = 'round';
      const path = (dx = 0, dy = 0) => {
        g.beginPath();
        n.body.forEach(([x, y], k) => {
          const prev = n.body[k - 1];
          if (k === 0 || !prev || Math.abs(prev[0] - x) + Math.abs(prev[1] - y) > 1) g.moveTo(cx(x) + dx, cy(y) + dy);
          else g.lineTo(cx(x) + dx, cy(y) + dy);
        });
      };
      const color = SEAT_COLORS[i];
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 16; path(2, 3); g.stroke();
      g.strokeStyle = shade(color, -0.35); g.lineWidth = 17; path(); g.stroke();
      g.strokeStyle = color; g.lineWidth = 13; path(); g.stroke();
      g.strokeStyle = shade(color, 0.35); g.lineWidth = 4; path(-2, -2); g.stroke();
      // a darker band every few segments, like the markings on a real snake
      g.fillStyle = shade(color, -0.25);
      n.body.forEach(([x, y], k) => { if (k > 1 && k % 3 === 0) { g.beginPath(); g.arc(cx(x), cy(y), 4, 0, Math.PI * 2); g.fill(); } });
      // the head, looking the way it is going
      const [hx, hy] = n.body[0], next = n.body[1] || [hx - 1, hy];
      let dx = hx - next[0], dy = hy - next[1];
      if (Math.abs(dx) + Math.abs(dy) !== 1) { dx = 1; dy = 0; }
      const X = cx(hx), Y = cy(hy);
      g.fillStyle = color; g.strokeStyle = shade(color, -0.4); g.lineWidth = 2;
      g.beginPath(); g.ellipse(X + dx * 2, Y + dy * 2, dx ? 11 : 9, dy ? 11 : 9, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      const px = -dy, py = dx;   // across the head
      [-1, 1].forEach((side) => {
        const ex = X + dx * 4 + px * 4.5 * side, ey = Y + dy * 4 + py * 4.5 * side;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, 3.4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#111'; g.beginPath(); g.arc(ex + dx * 1.2, ey + dy * 1.2, 1.7, 0, Math.PI * 2); g.fill();
      });
      if (n.alive && Math.floor((s.t + i * 7) / 9) % 4 === 0) {
        g.strokeStyle = '#e0303a'; g.lineWidth = 1.6;
        const tx = X + dx * 12, ty = Y + dy * 12;
        g.beginPath(); g.moveTo(X + dx * 10, Y + dy * 10); g.lineTo(tx, ty); g.lineTo(tx + dx * 3 + px * 2, ty + dy * 3 + py * 2); g.moveTo(tx, ty); g.lineTo(tx + dx * 3 - px * 2, ty + dy * 3 - py * 2); g.stroke();
      }
      g.restore();
    });
    this.hud(g, s, names);
  },
};

