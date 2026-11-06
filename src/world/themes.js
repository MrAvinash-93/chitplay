/**
 * Per-country room textures: floor, mat, wall, calendar and a flag pennant.
 * All procedural (canvas), so the game stays offline and asset-free.
 */
import * as THREE from '../vendor/three.chitplay.min.js';

const TAU = Math.PI * 2;

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let textureScale = 2;
let maxAnisotropy = 8;
/** 2 = 1024 px floors and mats, 4 = 2048 px. All numbers below are in the 512 px layout. */
export function setTextureDetail(scale, anisotropy) {
  textureScale = scale;
  if (anisotropy) maxAnisotropy = anisotropy;
}

let grainTile = null;
function grain() {
  if (grainTile) return grainTile;
  grainTile = document.createElement('canvas');
  grainTile.width = grainTile.height = 256;
  const g = grainTile.getContext('2d');
  const image = g.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : 255;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = Math.random() * 16;
  }
  g.putImageData(image, 0, 0);
  return grainTile;
}

function tex(w, h, draw, { repeat, grainy = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w * textureScale;
  c.height = h * textureScale;
  const g = c.getContext('2d');
  g.scale(textureScale, textureScale);
  draw(g, w, h);
  if (grainy) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = g.createPattern(grain(), 'repeat');
    g.fillRect(0, 0, c.width, c.height);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = maxAnisotropy;
  return t;
}

function blotches(g, w, h, r, n, light, dark, maxR = 60) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = 8 + r() * maxR;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, r() < 0.5 ? light : dark);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

function specks(g, w, h, r, n, color) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = color(r());
    g.fillRect(r() * w, r() * h, 1 + (r() < 0.2 ? 1 : 0), 1);
  }
}

/* ─── Floors ──────────────────────────────────────────────── */
export function floorTexture(kind) {
  const r = rng(7);
  return tex(512, 512, (g, w, h) => {
    const grid = (color, n = 4, lw = 2) => {
      g.strokeStyle = color;
      g.lineWidth = lw;
      for (let k = 0; k <= n; k++) {
        g.beginPath(); g.moveTo(k * w / n, 0); g.lineTo(k * w / n, h); g.stroke();
        g.beginPath(); g.moveTo(0, k * h / n); g.lineTo(w, k * h / n); g.stroke();
      }
    };
    if (kind === 'terrazzo') {
      g.fillStyle = '#9c9a8a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1800; i++) {
        const c = ['#b9b6a6', '#85836f', '#aaa289', '#8f9a88', '#77766a'][Math.floor(r() * 5)];
        g.fillStyle = c;
        g.beginPath(); g.arc(r() * w, r() * h, 0.8 + r() * 1.8, 0, TAU); g.fill();
      }
      grid('rgba(40,40,30,.5)');
    } else if (kind === 'mud') {
      g.fillStyle = '#9c6a45'; g.fillRect(0, 0, w, h);
      blotches(g, w, h, r, 220, 'rgba(190,140,95,.18)', 'rgba(80,45,25,.2)', 70);
      g.strokeStyle = 'rgba(70,40,20,.18)';
      for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(r() * w, r() * h, 20 + r() * 50, 0, Math.PI * r()); g.stroke(); }
    } else if (kind === 'wood') {
      for (let y = 0; y < h; y += 32) {
        g.fillStyle = ['#8a5a32', '#7d5030', '#93633a', '#845632'][(y / 32) % 4];
        g.fillRect(0, y, w, 32);
        g.strokeStyle = 'rgba(40,20,8,.35)';
        g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
        for (let k = 0; k < 6; k++) {
          g.strokeStyle = `rgba(50,25,10,${0.08 + r() * 0.1})`;
          g.beginPath(); g.moveTo(0, y + 4 + r() * 24);
          g.bezierCurveTo(w * 0.3, y + r() * 32, w * 0.6, y + r() * 32, w, y + 4 + r() * 24);
          g.stroke();
        }
        g.fillStyle = 'rgba(30,15,5,.4)';
        g.fillRect(((y * 7) % w), y, 2, 32);
      }
    } else if (kind === 'jangpan') {
      // glossy yellow oiled-paper floor of a Korean ondol room
      g.fillStyle = '#d9a84e'; g.fillRect(0, 0, w, h);
      blotches(g, w, h, r, 160, 'rgba(240,200,120,.18)', 'rgba(150,100,40,.16)', 60);
      grid('rgba(120,80,30,.35)', 8, 1.5);
    } else if (kind === 'parquet') {
      // Soviet herringbone parquet
      g.fillStyle = '#7a4a26'; g.fillRect(0, 0, w, h);
      const bw = 32, bh = 96;
      for (let y = -bh; y < h + bh; y += bw) for (let x = -bh; x < w + bh; x += bw * 2) {
        g.save();
        g.translate(x + ((y / bw) % 2) * bw, y);
        g.rotate((Math.floor(y / bw) % 2 ? 1 : -1) * Math.PI / 4);
        g.fillStyle = ['#8a5a30', '#7d4f2a', '#946436', '#6f4424'][Math.floor(r() * 4)];
        g.fillRect(0, 0, bw, bh / 2);
        g.strokeStyle = 'rgba(40,20,8,.45)'; g.lineWidth = 1.5; g.strokeRect(0, 0, bw, bh / 2);
        g.restore();
      }
    } else if (kind === 'tiles') {
      // patterned cement tiles (ladrilho / azulejo style)
      const n = 8, s = w / n;
      for (let ty = 0; ty < n; ty++) for (let tx = 0; tx < n; tx++) {
        const x = tx * s, y = ty * s;
        g.fillStyle = '#e8dcc0'; g.fillRect(x, y, s, s);
        g.fillStyle = '#b5523a';
        g.beginPath(); g.moveTo(x + s / 2, y + 8); g.lineTo(x + s - 8, y + s / 2); g.lineTo(x + s / 2, y + s - 8); g.lineTo(x + 8, y + s / 2); g.fill();
        g.fillStyle = '#2f6a7a';
        g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.16, 0, TAU); g.fill();
        g.fillStyle = '#e8dcc0';
        g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.07, 0, TAU); g.fill();
        [[0, 0], [s, 0], [0, s], [s, s]].forEach(([cx, cy]) => { g.fillStyle = '#2f6a7a'; g.beginPath(); g.arc(x + cx, y + cy, s * 0.14, 0, TAU); g.fill(); });
      }
      grid('rgba(80,60,40,.45)', 8, 1.5);
      specks(g, w, h, r, 1500, v => `rgba(80,60,40,${v * 0.08})`);
    } else if (kind === 'carpet') {
      g.fillStyle = '#6f4a3a'; g.fillRect(0, 0, w, h);
      specks(g, w, h, r, 9000, v => (v < 0.5 ? 'rgba(140,100,80,.25)' : 'rgba(40,25,18,.25)'));
    } else {
      // red oxide
      g.fillStyle = '#7a281b'; g.fillRect(0, 0, w, h);
      blotches(g, w, h, r, 260, 'rgba(170,70,45,.16)', 'rgba(70,20,12,.18)');
      specks(g, w, h, r, 1800, v => `rgba(255,220,200,${v * 0.06})`);
      grid('rgba(35,8,4,.55)');
    }
  }, { repeat: [5, 5] });
}

/* ─── Mats ────────────────────────────────────────────────── */
export function matTexture(kind) {
  const r = rng(11);
  return tex(512, 342, (g, w, h) => {
    const border = (outer, inner, lw = 18) => {
      g.strokeStyle = outer; g.lineWidth = lw; g.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
      if (inner) { g.strokeStyle = inner; g.lineWidth = 3; g.strokeRect(lw + 2, lw + 2, w - 2 * lw - 4, h - 2 * lw - 4); }
    };
    const weaveRows = (bands, bh = 10, cw = 6) => {
      for (let y = 0, row = 0; y < h; y += bh, row++) {
        g.fillStyle = bands[row % bands.length];
        g.fillRect(0, y, w, bh);
        for (let x = (row % 2) * cw; x < w; x += cw * 2) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x, y, cw, bh); }
        g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, y, w, 1);
      }
    };
    if (kind === 'tatami') {
      g.fillStyle = '#b9b56f'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(80,80,30,${0.08 + r() * 0.12})`; g.fillRect(x, 0, 1, h); }
      g.fillStyle = '#2f3a2a';
      g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(w / 2 - 1, 16, 2, h - 32);
    } else if (kind === 'yo') {
      // quilted Korean floor bedding with flowers
      g.fillStyle = '#e9c1c8'; g.fillRect(0, 0, w, h);
      for (let y = 30; y < h; y += 46) for (let x = 30 + ((y / 46) % 2) * 23; x < w; x += 46) {
        g.fillStyle = ['#c84a6a', '#4a8ac8', '#e8a03a'][Math.floor(r() * 3)];
        for (let p = 0; p < 5; p++) { g.beginPath(); g.arc(x + Math.cos(p * TAU / 5) * 6, y + Math.sin(p * TAU / 5) * 6, 5, 0, TAU); g.fill(); }
        g.fillStyle = '#f7e27a'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
      }
      border('#3a6a9a', '#f3d4da', 16);
    } else if (kind === 'rug') {
      g.fillStyle = '#b05a2a'; g.fillRect(0, 0, w, h);
      const rings = ['#d98a3a', '#7a3a1a', '#e8c27a', '#5a6a3a', '#c86a30'];
      for (let i = 0; i < 10; i++) {
        g.fillStyle = rings[i % rings.length];
        g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - i * 22, h / 2 - i * 15, 0, 0, TAU); g.fill();
      }
      specks(g, w, h, r, 3000, v => `rgba(0,0,0,${v * 0.12})`);
    } else if (kind === 'tartan') {
      g.fillStyle = '#7a1a22'; g.fillRect(0, 0, w, h);
      const stripe = (pos, size, color, vertical) => {
        g.fillStyle = color;
        if (vertical) g.fillRect(pos, 0, size, h); else g.fillRect(0, pos, w, size);
      };
      for (let i = 0; i < w; i += 64) {
        stripe(i, 18, 'rgba(20,40,30,.55)', true); stripe(i + 26, 4, 'rgba(240,210,80,.5)', true);
        stripe(i, 18, 'rgba(20,40,30,.55)', false); stripe(i + 26, 4, 'rgba(240,210,80,.5)', false);
      }
      border('#3a0d10', '#d9b44a', 14);
    } else if (kind === 'bamboo') {
      for (let y = 0; y < h; y += 14) {
        g.fillStyle = ['#d8c27a', '#cbb36a', '#e0cc88'][(y / 14) % 3];
        g.fillRect(0, y, w, 14);
        g.fillStyle = 'rgba(90,70,20,.35)'; g.fillRect(0, y, w, 1.5);
        for (let x = r() * 60; x < w; x += 60 + r() * 40) { g.fillStyle = 'rgba(110,85,30,.4)'; g.fillRect(x, y, 3, 14); }
      }
      border('#5a4520', null, 10);
    } else if (kind === 'dari') {
      weaveRows(['#7a1f2b', '#7a1f2b', '#e2b04a', '#1f3f6b', '#7a1f2b', '#7a1f2b', '#f3e6c8', '#2a6a4a']);
      g.fillStyle = 'rgba(243,230,200,.55)';
      for (let x = 60; x < w; x += 90) {
        g.beginPath(); g.moveTo(x, h / 2 - 40); g.lineTo(x + 30, h / 2); g.lineTo(x, h / 2 + 40); g.lineTo(x - 30, h / 2); g.fill();
      }
      border('#3a0d14', '#e2b04a');
    } else if (kind === 'shitalpati') {
      // Bangladeshi cool-mat with a woven red/green pattern
      weaveRows(['#d8c27a', '#cdb46c', '#d8c27a', '#cdb46c'], 8, 6);
      g.strokeStyle = 'rgba(160,40,40,.75)'; g.lineWidth = 5;
      for (let x = 70; x < w - 40; x += 90) { g.beginPath(); g.moveTo(x, h / 2 - 50); g.lineTo(x + 30, h / 2); g.lineTo(x, h / 2 + 50); g.lineTo(x - 30, h / 2); g.closePath(); g.stroke(); }
      g.strokeStyle = 'rgba(30,110,60,.7)'; g.lineWidth = 4;
      g.strokeRect(36, 36, w - 72, h - 72);
      border('#8a5a2a', '#1e6e3c', 14);
    } else if (kind === 'carpetwall') {
      // the classic Soviet red patterned carpet
      g.fillStyle = '#7a1418'; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      for (let i = 0; i < 6; i++) {
        g.strokeStyle = ['#d9a441', '#1f2a5a', '#e8dcc0', '#d9a441', '#3a6a3a', '#e8dcc0'][i];
        g.lineWidth = 6;
        g.beginPath(); g.moveTo(cx, cy - 140 + i * 22); g.lineTo(cx + 200 - i * 30, cy); g.lineTo(cx, cy + 140 - i * 22); g.lineTo(cx - 200 + i * 30, cy); g.closePath(); g.stroke();
      }
      for (let y = 30; y < h; y += 50) for (let x = 30; x < w; x += 50) {
        if (Math.abs(x - cx) / 200 + Math.abs(y - cy) / 140 < 1) continue;
        g.fillStyle = '#d9a441'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
      }
      border('#2a0a0c', '#d9a441', 16);
    } else if (kind === 'sarape') {
      const bands = ['#c8272d', '#f28a2a', '#f2c12e', '#2a9a5a', '#2a6ac8', '#8a2a9a', '#f2c12e', '#f28a2a', '#c8272d', '#1a1a1a', '#f3e6c8'];
      for (let x = 0, i = 0; x < w; x += 14, i++) {
        g.fillStyle = bands[i % bands.length];
        g.fillRect(x, 0, 14, h);
        g.fillStyle = 'rgba(0,0,0,.12)';
        for (let y = (i % 2) * 6; y < h; y += 12) g.fillRect(x, y, 14, 6);
      }
      g.fillStyle = '#f3e6c8';
      for (let y = 0; y < h; y += 10) { g.fillRect(0, y, 6, 4); g.fillRect(w - 6, y, 6, 4); }
    } else if (kind === 'gundri') {
      weaveRows(['#c9a25a', '#b8914e', '#c9a25a', '#a8803e'], 8, 5);
      border('#6a4a22', '#e0c070', 14);
    } else {
      weaveRows(['#cfa865', '#9a3326', '#cfa865', '#cfa865', '#2e6a43', '#cfa865', '#d8b14a', '#cfa865', '#28457a', '#cfa865']);
      specks(g, w, h, r, 900, v => `rgba(60,30,10,${v * 0.12})`);
      border('#6e1f18', '#d8b14a');
    }
  });
}

/* ─── Walls ───────────────────────────────────────────────── */
export function wallTexture([top, dado, line]) {
  const r = rng(21);
  return tex(512, 256, (g, w, h) => {
    const split = h * 0.68;
    g.fillStyle = top; g.fillRect(0, 0, w, split);
    g.fillStyle = dado; g.fillRect(0, split, w, h - split);
    g.fillStyle = line; g.fillRect(0, split - 3, w, 4);
    blotches(g, w, split, r, 70, 'rgba(140,110,70,.1)', 'rgba(120,90,60,.08)', 40);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = 'rgba(230,220,200,.6)';
      g.fillRect(r() * w, split + 6 + r() * (h - split - 10), 2 + r() * 6, 1 + r() * 3);
    }
  }, { repeat: [3, 1] });
}

/* ─── Calendar ────────────────────────────────────────────── */
export function calendarTexture(month, accent = '#c8272d') {
  return tex(192, 288, (g, w, h) => {
    g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, w, h);
    const pic = h * 0.56;
    const sky = g.createLinearGradient(0, 0, 0, pic);
    sky.addColorStop(0, '#ff8a3d'); sky.addColorStop(0.55, '#ffd27a'); sky.addColorStop(1, '#ffb066');
    g.fillStyle = sky; g.fillRect(8, 8, w - 16, pic - 8);
    g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(w * 0.62, pic * 0.48, 18, 0, TAU); g.fill();
    g.fillStyle = '#7a4a7e';
    g.beginPath(); g.moveTo(8, pic * 0.72);
    g.lineTo(w * 0.3, pic * 0.38); g.lineTo(w * 0.5, pic * 0.62); g.lineTo(w * 0.72, pic * 0.42); g.lineTo(w - 8, pic * 0.7);
    g.lineTo(w - 8, pic); g.lineTo(8, pic); g.fill();
    g.fillStyle = '#3d6f8f'; g.fillRect(8, pic * 0.8, w - 16, pic * 0.2);
    g.fillStyle = accent;
    g.font = 'bold 20px sans-serif';
    g.textAlign = 'center';
    g.fillText(month, w / 2, pic + 26);
    g.font = '11px monospace';
    for (let d = 1; d <= 30; d++) {
      const col = d % 7, row = Math.floor(d / 7);
      g.fillStyle = col === 0 ? accent : '#333';
      g.fillText(String(d), 18 + col * 26, pic + 50 + row * 18);
    }
  });
}

/* ─── Flags (simplified pennants for the wall) ────────────── */
function star(g, cx, cy, R, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? R * 0.42 : R;
    const a = rot + (i * Math.PI) / 5;
    g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  g.closePath();
  g.fill();
}

export function flagTexture(id) {
  return tex(192, 128, (g, w, h) => drawFlag(g, w, h, id), { nearest: false });
}

/** PNG data URL of the flag, for UI buttons (Windows has no flag emoji). */
const flagUrls = {};
export function flagDataURL(id) {
  if (!flagUrls[id]) {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 64;
    const g = c.getContext('2d');
    g.scale(0.5, 0.5);
    drawFlag(g, 192, 128, id);
    flagUrls[id] = c.toDataURL('image/png');
  }
  return flagUrls[id];
}

function drawFlag(g, w, h, id) {
    g.clearRect(0, 0, w, h);
    if (id === 'IN') {
      ['#ff9933', '#ffffff', '#138808'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / 3, w, h / 3); });
      g.strokeStyle = '#000080'; g.lineWidth = 2;
      g.beginPath(); g.arc(w / 2, h / 2, 16, 0, TAU); g.stroke();
      for (let i = 0; i < 24; i++) { const a = i * TAU / 24; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a) * 16, h / 2 + Math.sin(a) * 16); g.lineWidth = 0.8; g.stroke(); }
    } else if (id === 'PK') {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w * 0.25, h);
      g.fillStyle = '#01411c'; g.fillRect(w * 0.25, 0, w * 0.75, h);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(w * 0.6, h * 0.52, 30, 0, TAU); g.fill();
      g.fillStyle = '#01411c'; g.beginPath(); g.arc(w * 0.65, h * 0.45, 26, 0, TAU); g.fill();
      g.fillStyle = '#fff'; star(g, w * 0.7, h * 0.38, 10, -0.3);
    } else if (id === 'NP') {
      g.fillStyle = '#003893';
      g.beginPath(); g.moveTo(10, 4); g.lineTo(130, 60); g.lineTo(52, 60); g.lineTo(130, 124); g.lineTo(10, 124); g.closePath(); g.fill();
      g.fillStyle = '#dc143c';
      g.beginPath(); g.moveTo(16, 16); g.lineTo(112, 56); g.lineTo(40, 56); g.lineTo(112, 118); g.lineTo(16, 118); g.closePath(); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(40, 40, 9, 0, Math.PI); g.fill();
      star(g, 40, 96, 12, 0);
    } else if (id === 'JP') {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#bc002d'; g.beginPath(); g.arc(w / 2, h / 2, 34, 0, TAU); g.fill();
    } else if (id === 'KR') {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(w / 2, h / 2, 26, Math.PI, TAU); g.fill();
      g.fillStyle = '#0047a0'; g.beginPath(); g.arc(w / 2, h / 2, 26, 0, Math.PI); g.fill();
      g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(w / 2 - 13, h / 2, 13, 0, Math.PI); g.fill();
      g.fillStyle = '#0047a0'; g.beginPath(); g.arc(w / 2 + 13, h / 2, 13, Math.PI, TAU); g.fill();
      g.fillStyle = '#000';
      [[30, 22, -0.6], [w - 30, 22, 0.6], [30, h - 22, 0.6], [w - 30, h - 22, -0.6]].forEach(([x, y, a]) => {
        g.save(); g.translate(x, y); g.rotate(a);
        for (let k = -1; k <= 1; k++) g.fillRect(-14, k * 6 - 2, 28, 4);
        g.restore();
      });
    } else if (id === 'US') {
      for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#fff' : '#b22234'; g.fillRect(0, i * h / 13, w, h / 13 + 1); }
      g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, w * 0.42, h * 7 / 13);
      g.fillStyle = '#fff';
      for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) { g.beginPath(); g.arc(8 + x * 12.5, 7 + y * 13, 2.2, 0, TAU); g.fill(); }
    } else if (id === 'UK') {
      g.fillStyle = '#012169'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#fff'; g.lineWidth = 22;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
      g.strokeStyle = '#c8102e'; g.lineWidth = 8;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
      g.fillStyle = '#fff'; g.fillRect(w / 2 - 18, 0, 36, h); g.fillRect(0, h / 2 - 18, w, 36);
      g.fillStyle = '#c8102e'; g.fillRect(w / 2 - 11, 0, 22, h); g.fillRect(0, h / 2 - 11, w, 22);
    } else if (id === 'CN') {
      g.fillStyle = '#de2910'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffde00';
      star(g, 34, 34, 20);
      [[66, 14], [78, 28], [78, 46], [66, 60]].forEach(([x, y], i) => star(g, x, y, 6, i * 0.4));
    } else if (id === 'BD') {
      g.fillStyle = '#006a4e'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f42a41'; g.beginPath(); g.arc(w * 0.45, h / 2, 38, 0, TAU); g.fill();
    } else if (id === 'RU') {
      ['#ffffff', '#0039a6', '#d52b1e'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / 3, w, h / 3 + 1); });
    } else if (id === 'DE') {
      ['#000000', '#dd0000', '#ffce00'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / 3, w, h / 3 + 1); });
    } else if (id === 'FR') {
      ['#0055a4', '#ffffff', '#ef4135'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * w / 3, 0, w / 3 + 1, h); });
    } else if (id === 'BR') {
      g.fillStyle = '#009c3b'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffdf00'; g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w - 14, h / 2); g.lineTo(w / 2, h - 10); g.lineTo(14, h / 2); g.closePath(); g.fill();
      g.fillStyle = '#002776'; g.beginPath(); g.arc(w / 2, h / 2, 30, 0, TAU); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2 + 10, h / 2 + 60, 70, Math.PI * 1.22, Math.PI * 1.62); g.stroke();
    } else if (id === 'MX') {
      ['#006847', '#ffffff', '#ce1126'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * w / 3, 0, w / 3 + 1, h); });
      g.fillStyle = '#8a5a2a'; g.beginPath(); g.ellipse(w / 2, h / 2, 14, 18, 0, 0, TAU); g.fill();
      g.strokeStyle = '#2a7a3a'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2 + 4, 20, 0.2, Math.PI - 0.2); g.stroke();
    }
}

export const BALL_COLORS = {
  cricket: { body: '#8e1b14', seam: '#eadcc2', r: 0.075 },
  baseball: { body: '#f2efe6', seam: '#c8272d', r: 0.075 },
  pingpong: { body: '#ff8a2a', seam: '#ff8a2a', r: 0.04 },
  football: { body: '#f4f4f0', seam: '#1a1a1a', r: 0.11 },
};
