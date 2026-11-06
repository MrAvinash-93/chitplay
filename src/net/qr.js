/**
 * A tiny QR encoder for invite links: byte mode, error correction M, versions 1-9
 * (up to 180 bytes). Loaded only when a Nearby room opens.
 */
const TOTAL = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292];   // codewords per version
const EC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22];            // error codewords per block
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5];
const ALIGN = [0, 0, 18, 22, 26, 30, 34, 22, 24, 26];          // v7+ also has a centre row

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x = (x << 1) ^ (x & 128 ? 0x11d : 0); }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function reedSolomon(data, n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(g.length + 1).fill(0);
    g.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= mul(c, EXP[i]); });
    g = next;
  }
  const out = new Array(n).fill(0);
  for (const d of data) {
    const f = d ^ out.shift();
    out.push(0);
    for (let j = 0; j < n; j++) out[j] ^= mul(g[j + 1], f);
  }
  return out;
}

function codewords(bytes, v) {
  const capacity = TOTAL[v] - EC[v] * BLOCKS[v];
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  put(4, 4);
  put(bytes.length, 8);
  bytes.forEach(b => put(b, 8));
  put(0, Math.min(4, capacity * 8 - bits.length));
  put(0, (8 - bits.length % 8) % 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
  for (let pad = 0xec; data.length < capacity; pad ^= 0xec ^ 0x11) data.push(pad);

  const count = BLOCKS[v];
  const short = Math.floor(capacity / count);
  const longFrom = count - capacity % count;
  const blocks = [];
  for (let b = 0, at = 0; b < count; b++) {
    const len = short + (b >= longFrom ? 1 : 0);
    blocks.push(data.slice(at, at + len));
    at += len;
  }
  const out = [];
  for (let i = 0; i <= short; i++) blocks.forEach(blk => { if (i < blk.length) out.push(blk[i]); });
  const ecs = blocks.map(blk => reedSolomon(blk, EC[v]));
  for (let i = 0; i < EC[v]; i++) ecs.forEach(e => out.push(e[i]));
  return out;
}

const MASKS = [
  (r, c) => (r + c) % 2, (r) => r % 2, (r, c) => c % 3, (r, c) => (r + c) % 3,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2,
  (r, c) => (r * c) % 2 + (r * c) % 3,
  (r, c) => ((r * c) % 2 + (r * c) % 3) % 2,
  (r, c) => ((r + c) % 2 + (r * c) % 3) % 2,
];

/** Runs of one colour and 2x2 blocks: enough to avoid the masks scanners dislike. */
function penalty(m) {
  const n = m.length;
  let score = 0;
  for (let a = 0; a < n; a++) {
    let runR = 1, runC = 1;
    for (let b = 1; b < n; b++) {
      runR = m[a][b] === m[a][b - 1] ? runR + 1 : 1;
      runC = m[b][a] === m[b - 1][a] ? runC + 1 : 1;
      if (runR === 5) score += 3; else if (runR > 5) score++;
      if (runC === 5) score += 3; else if (runC > 5) score++;
      if (a && m[a][b] === m[a][b - 1] && m[a][b] === m[a - 1][b] && m[a][b] === m[a - 1][b - 1]) score += 3;
    }
  }
  return score;
}

/** @returns {boolean[][]|null} rows of dark modules, or null if the text is too long */
export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  let v = 1;
  while (v <= 9 && bytes.length > TOTAL[v] - EC[v] * BLOCKS[v] - 2) v++;
  if (v > 9) return null;

  const n = 17 + 4 * v;
  const grid = Array.from({ length: n }, () => new Array(n).fill(false));
  const fixed = Array.from({ length: n }, () => new Array(n).fill(false));
  const set = (x, y, dark) => { if (x >= 0 && y >= 0 && x < n && y < n) { grid[y][x] = !!dark; fixed[y][x] = true; } };

  for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([cx, cy]) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, d !== 2 && d !== 4);
      }
    }
  });
  if (v > 1) {
    const pos = v >= 7 ? [6, ALIGN[v], 2 * ALIGN[v] - 6] : [6, ALIGN[v]];
    const last = pos.length - 1;
    pos.forEach((cy, a) => pos.forEach((cx, b) => {
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
  }
  const drawFormat = (mask) => {
    const data = mask;   // level M is 00
    let rem = data << 10;
    for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i) => (bits >> i) & 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i));
    set(8, n - 8, true);
  };
  drawFormat(0);
  if (v >= 7) {
    let rem = v;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (v << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = n - 11 + i % 3, b = Math.floor(i / 3), dark = (bits >> i) & 1;
      set(a, b, dark); set(b, a, dark);
    }
  }

  const words = codewords(bytes, v);
  let at = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = ((right + 1) & 2) === 0 ? n - 1 - k : k;
        if (fixed[y][x]) continue;
        if (at < words.length * 8) { grid[y][x] = ((words[at >> 3] >> (7 - (at & 7))) & 1) === 1; at++; }
      }
    }
  }

  let best = null, bestScore = Infinity, bestMask = 0;
  MASKS.forEach((fn, mask) => {
    drawFormat(mask);
    const m = grid.map((row, r) => row.map((dark, c) => (!fixed[r][c] && fn(r, c) === 0 ? !dark : dark)));
    const s = penalty(m);
    if (s < bestScore) { best = m; bestScore = s; bestMask = mask; }
  });
  drawFormat(bestMask);
  return best.map((row, r) => row.map((dark, c) => (fixed[r][c] ? grid[r][c] : dark)));
}

/** A scannable SVG (with its white quiet zone), or null if the text doesn't fit. */
export function qrSvg(text, label = 'QR code') {
  const m = qrMatrix(text);
  if (!m) return null;
  const NS = 'http://www.w3.org/2000/svg';
  const size = m.length + 8;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.setAttribute('shape-rendering', 'crispEdges');
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', size); bg.setAttribute('height', size); bg.setAttribute('fill', '#fff');
  const path = document.createElementNS(NS, 'path');
  let d = '';
  m.forEach((row, y) => row.forEach((dark, x) => { if (dark) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
  path.setAttribute('d', d);
  path.setAttribute('fill', '#000');
  svg.append(bg, path);
  return svg;
}
