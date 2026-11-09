/**
 * Hungry Snake: eat the samosas, grow longer, don't hit a wall, yourself or anyone else. It speeds
 * up as you eat. Endless alone; with others, the last snake alive also scores a bonus.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, W } from './lib.js?v=20261110-0233';

export const COLS = 32, ROWS = 18;
const CELL = 20, TOP = 40;
const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const START = [[4, 4, 'r'], [27, 13, 'l'], [27, 4, 'l'], [4, 13, 'r']];
const key = (x, y) => x + y * COLS;
function placeFood(s) {
  for (let t = 0; t < 200; t++) {
    const x = Math.floor(rnd(s) * COLS), y = Math.floor(rnd(s) * ROWS);
    if (!s.snakes.some(n => n.body.some(([a, b]) => a === x && b === y))) { s.food = [x, y]; return; }
  }
}
export default {
  hint: 'Drag to turn',
  pad: [['u', '▲'], ['d', '▼'], ['l', '◀'], ['r', '▶']],
  init({ n, seed }) {
    const s = { n, seed, t: 0, wait: 0, ev: [], food: [16, 9], eaten: 0,
      snakes: seats(n).map((i) => {
        const [x, y, d] = START[i];
        const [dx] = DIRS[d];
        return { body: [[x, y], [x - dx, y], [x - dx * 2, y]], d, next: d, alive: true, score: 0 };
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
    if (++s.wait < Math.max(4, 10 - Math.floor(s.eaten / 6))) return;
    s.wait = 0;
    const heads = s.snakes.map((n) => {
      if (!n.alive) return null;
      n.d = n.next;
      const [dx, dy] = DIRS[n.d];
      return [n.body[0][0] + dx, n.body[0][1] + dy];
    });
    const full = new Set();
    s.snakes.forEach(n => { if (n.alive) n.body.slice(0, -1).forEach(([x, y]) => full.add(key(x, y))); });
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
        s.eaten += 1;
        s.ev.push({ k: 'star', seat: i, score: n.score });
        placeFood(s);
      } else n.body.pop();
    });
  },
  over(s) {
    const alive = s.snakes.filter(n => n.alive).length;
    if (s.n === 1 ? alive : alive > 1) return null;
    if (s.n > 1 && alive === 1) s.snakes.find(n => n.alive).score += 3;
    const scores = s.snakes.map(n => n.score), top = Math.max(...scores);
    return { scores, winners: s.n > 1 ? seats(s.n).filter(i => scores[i] === top) : (top > 0 ? [0] : []), endless: true };
  },
  // heads for the food, and turns away from anything right in front of it
  bot(s, seat) {
    const n = s.snakes[seat];
    if (!n?.alive) return {};
    const taken = new Set();
    s.snakes.forEach(o => { if (o.alive) o.body.forEach(([x, y]) => taken.add(key(x, y))); });
    const safe = (k) => {
      const [dx, dy] = DIRS[k];
      const x = n.body[0][0] + dx, y = n.body[0][1] + dy;
      return x >= 0 && x < COLS && y >= 0 && y < ROWS && !taken.has(key(x, y));
    };
    const [fx, fy] = s.food, [hx, hy] = n.body[0];
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
  },
  draw(g, s, names) {
    g.fillStyle = '#20301f'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      g.fillStyle = (x + y) % 2 ? '#3f7a3b' : '#467f40';
      g.fillRect(x * CELL, TOP + y * CELL, CELL, CELL);
    }
    g.font = '19px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#e9a23b';
    g.beginPath(); g.moveTo(s.food[0] * CELL + 10, TOP + s.food[1] * CELL + 2); g.lineTo(s.food[0] * CELL + 18, TOP + s.food[1] * CELL + 17); g.lineTo(s.food[0] * CELL + 2, TOP + s.food[1] * CELL + 17); g.closePath(); g.fill();
    g.strokeStyle = '#7a4a10'; g.lineWidth = 2; g.stroke();
    s.snakes.forEach((n, i) => {
      g.globalAlpha = n.alive ? 1 : 0.35;
      n.body.forEach(([x, y], k) => {
        g.fillStyle = k === 0 ? '#fff' : SEAT_COLORS[i];
        g.fillRect(x * CELL + 1, TOP + y * CELL + 1, CELL - 2, CELL - 2);
        if (k === 0) { g.fillStyle = SEAT_COLORS[i]; g.fillRect(x * CELL + 4, TOP + y * CELL + 4, CELL - 8, CELL - 8); g.fillStyle = '#111'; g.fillRect(x * CELL + 6, TOP + y * CELL + 7, 3, 3); g.fillRect(x * CELL + 11, TOP + y * CELL + 7, 3, 3); }
      });
      g.globalAlpha = 1;
    });
    scoreBar(g, s.snakes.map((n, i) => [names[i] || `P${i + 1}`, n.alive ? n.score : `${n.score} ✕`, SEAT_COLORS[i]]));
  },
};
