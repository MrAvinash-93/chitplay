/**
 * The people around the mat. Each character is one rig (spine, head, two-part
 * arms) driven by named poses plus a little procedural life (breathing, blinks,
 * gaze), dressed by a "look" from character-looks.js: any age, any outfit.
 *
 * A character never knows anyone's role on their own: the world tells them what
 * to show, and only after the result is public.
 */
import * as THREE from '../vendor/three.chitplay.min.js';
import { lookKey, OUTFITS, isFancyHat } from './character-looks.js?v=20261114-1217';

const TAU = Math.PI * 2;
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const UP = new THREE.Vector3(0, 1, 0);

// sh: [[left x, left z], [right x, right z]] shoulder rotations; el: elbow bends.
// Shoulder x < 0 swings the arm forward; z > 0 moves the left hand outward,
// z < 0 moves the right hand outward.
const POSES = {
  idle:     { sh: [[-0.35, 0.12], [-0.35, -0.12]], el: [-1.15, -1.15], lean: 0.08, head: 0.18 },
  reach:    { sh: [[-0.35, 0.12], [-1.15, -0.05]], el: [-1.15, -0.25], lean: 0.42, head: 0.45 },
  peek:     { sh: [[-0.9, -0.15], [-0.95, 0.15]],  el: [-1.75, -1.7],  lean: 0.2,  head: 0.3 },
  hold:     { sh: [[-0.35, 0.12], [-0.6, 0.08]],   el: [-1.15, -1.4],  lean: 0.1,  head: 0.15 },
  think:    { sh: [[-0.4, 0.1],   [-0.85, 0.28]],  el: [-1.4, -2.3],   lean: 0.12, head: 0.02 },
  nervous:  { sh: [[-0.55, -0.1], [-0.55, 0.1]],   el: [-1.4, -1.4],   lean: 0.22, head: 0.28 },
  show:     { sh: [[-0.35, 0.12], [-2.2, -0.1]],   el: [-1.15, -0.2],  lean: -0.02, head: -0.05 },
  cheer:    { sh: [[-2.8, 0.35],  [-2.8, -0.35]],  el: [-0.25, -0.25], lean: -0.08, head: -0.25 },
  sad:      { sh: [[-0.1, 0.08],  [-0.1, -0.08]],  el: [-0.5, -0.5],   lean: 0.45, head: 0.55 },
  facepalm: { sh: [[-0.35, 0.12], [-1.15, 0.38]],  el: [-1.15, -2.35], lean: 0.3,  head: 0.42 },
  point:    { sh: [[-0.35, 0.12], [-1.5, 0]],      el: [-1.15, -0.05], lean: 0.15, head: 0.05 },
  clap:     { sh: [[-1.0, -0.3],  [-1.0, 0.3]],    el: [-1.2, -1.2],   lean: 0,    head: -0.05 },
  throw:    { sh: [[-0.35, 0.12], [-2.7, -0.1]],   el: [-1.15, -0.6],  lean: -0.12, head: 0.05 },
  fling:    { sh: [[-0.35, 0.12], [-1.1, -0.05]],  el: [-1.15, -0.1],  lean: 0.3,  head: 0.25 },
  shrug:    { sh: [[-0.25, 0.55], [-0.25, -0.55]], el: [-1.9, -1.9],   lean: -0.05, head: 0.05 },
  laugh:    { sh: [[-0.5, -0.18], [-0.5, 0.18]],   el: [-1.3, -1.3],   lean: -0.15, head: -0.3 },
  cry:      { sh: [[-1.0, -0.22], [-1.0, 0.22]],   el: [-2.15, -2.15], lean: 0.35, head: 0.42 },
  jump:     { sh: [[-2.9, 0.4],   [-2.9, -0.4]],   el: [-0.15, -0.15], lean: -0.1, head: -0.3 },
  sneaky:   { sh: [[-0.4, 0.05],  [-0.9, 0.25]],   el: [-1.6, -2.2],   lean: 0.3,  head: 0.25 },
  deny:     { sh: [[-0.95, 0.32], [-0.95, -0.32]], el: [-1.65, -1.65], lean: -0.05, head: 0.0 },
  surprised:{ sh: [[-1.5, 0.55],  [-1.5, -0.55]],  el: [-0.7, -0.7],   lean: -0.2, head: -0.2 },
  wave:     { sh: [[-0.35, 0.12], [-2.6, -0.35]],  el: [-1.15, -0.7],  lean: 0,    head: -0.05 },
  // standing up, for the Room Tour: arms hang loose (and swing while walking)
  stand:    { sh: [[-0.08, 0.1],  [-0.08, -0.1]],  el: [-0.25, -0.25], lean: 0,    head: 0.04 },
  dance:    { sh: [[-2.3, 0.45],  [-1.1, -0.6]],   el: [-0.8, -1.5],   lean: -0.05, head: -0.1 },
};

const emojiCache = {};
function emojiTexture(symbol) {
  if (emojiCache[symbol]) return emojiCache[symbol];
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,253,244,.95)';
  g.beginPath(); g.arc(64, 60, 52, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(40, 100); g.lineTo(30, 124); g.lineTo(62, 108); g.fill();
  g.strokeStyle = 'rgba(60,40,20,.35)';
  g.lineWidth = 4;
  g.beginPath(); g.arc(64, 60, 52, 0, TAU); g.stroke();
  g.font = '64px serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(symbol, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  emojiCache[symbol] = t;
  return t;
}



/* ─── Shared helpers ─────────────────────────────────────────────── */
function std(p) {
  return new THREE.MeshStandardMaterial({ roughness: 0.75, envMapIntensity: 0.35, ...p });
}

let textureDetail = 1;
/** 1 = 2048 px clothes and faces (4K), 0.5 = 1024 px. */
export function setCharacterDetail(k) { textureDetail = k; }

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * textureDetail); c.height = Math.round(h * textureDetail);
  const ctx = c.getContext('2d');
  ctx.scale(textureDetail, textureDetail);
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Texture cache with a ceiling; a disposed texture simply re-uploads if it is used again. */
const textures = new Map();
function cachedTexture(key, make) {
  let t = textures.get(key);
  if (t) { textures.delete(key); textures.set(key, t); return t; }
  t = make();
  textures.set(key, t);
  if (textures.size > 40) {
    const [oldKey, old] = textures.entries().next().value;
    textures.delete(oldKey);
    old.dispose();
  }
  return t;
}

/** Bakes many small parts into one geometry, so a hand or a hairdo is a single draw call. */
function merge(parts) {
  const helper = new THREE.Object3D();
  const pos = [], norm = [], uv = [];
  for (const { g, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } of parts) {
    helper.position.set(...p); helper.rotation.set(...r); helper.scale.set(...s);
    helper.updateMatrix();
    const flat = g.index ? g.toNonIndexed() : g.clone();
    flat.applyMatrix4(helper.matrix);
    pos.push(...flat.attributes.position.array);
    norm.push(...flat.attributes.normal.array);
    uv.push(...flat.attributes.uv.array);
    flat.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return out;
}

const geoCache = new Map();
const cachedGeo = (key, make) => {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
};
const ball = (r = 1, a = 14, b = 10) => new THREE.SphereGeometry(r, a, b);

/** A capsule running from point a to point b. */
function limb(a, b, radius, material) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(radius, d.length(), 6, 16), material);
  m.position.copy(A).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}

/* ─── Sculpted geometry ──────────────────────────────────────────── */
function headGeometry() {
  const R = 0.105, W = 72, H = 54;
  // the seam goes down the back of the head, where the hair is
  const g = new THREE.SphereGeometry(R, W, H, -Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const nx = x / R, ny = y / R, nz = z / R, front = Math.max(0, nz);
    let sx = 1, sz = 0.97;
    if (ny < 0) {                     // jaw narrows to a chin
      const t = -ny;
      sx = 1 - 0.3 * t * t;
      sz = 0.97 - 0.12 * t * t;
      if (nz > 0) z += 0.013 * t * front;
    }
    x *= sx; z *= sz;
    y *= ny < 0 ? 1.13 : 0.98;
    z += 0.0045 * Math.exp(-((ny - 0.2) ** 2) / 0.012) * front;                               // brow ridge
    for (const s of [-1, 1]) z -= 0.0062 * Math.exp(-(((nx - s * 0.37) ** 2) + ((ny - 0.02) ** 2)) / 0.018) * front;  // eye sockets
    for (const s of [-1, 1]) { const c = Math.exp(-(((nx - s * 0.55) ** 2) + ((ny + 0.28) ** 2)) / 0.05) * front; z += 0.004 * c; x += s * 0.003 * c; }  // cheeks
    z += 0.004 * Math.exp(-((nx ** 2) + ((ny + 0.82) ** 2)) / 0.03) * front;                  // chin
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let row = 0; row <= H; row++) {   // no visible line where the sphere closes
    const a = row * (W + 1), b = a + W;
    const nx = n.getX(a) + n.getX(b), ny = n.getY(a) + n.getY(b), nz = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(nx, ny, nz) || 1;
    n.setXYZ(a, nx / l, ny / l, nz / l); n.setXYZ(b, nx / l, ny / l, nz / l);
  }
  return g;
}

function noseGeometry() {
  return merge([
    { g: new THREE.CapsuleGeometry(0.0062, 0.026, 6, 12), p: [0, -0.002, 0.0955], r: [-0.3, 0, 0] },
    { g: ball(0.0102, 18, 14), p: [0, -0.02, 0.1025], s: [1, 0.9, 1] },
    { g: ball(0.0058, 12, 10), p: [-0.0096, -0.0235, 0.0965] },
    { g: ball(0.0058, 12, 10), p: [0.0096, -0.0235, 0.0965] },
  ]);
}

function earGeometry() {
  return merge([
    { g: ball(0.021, 16, 12), s: [0.42, 1, 0.72] },
    { g: new THREE.TorusGeometry(0.015, 0.0035, 8, 18), p: [0.006, 0, 0], r: [0, Math.PI / 2, 0], s: [1, 1.2, 1] },
  ]);
}

function handGeometry(side) {
  const parts = [{ g: ball(0.032, 16, 12), p: [0, -0.016, 0], s: [1, 1.12, 0.56] }];
  for (let f = 0; f < 4; f++) {
    const x = (f - 1.5) * 0.0145, len = [0.018, 0.024, 0.026, 0.022][f];
    parts.push({ g: new THREE.CapsuleGeometry(0.0062, len, 4, 8), p: [x, -0.058 - len * 0.1, 0.006], r: [0.42, 0, 0] });
    parts.push({ g: new THREE.CapsuleGeometry(0.0056, len * 0.7, 4, 8), p: [x, -0.08 - len * 0.2, 0.021], r: [1.05, 0, 0] });
  }
  parts.push({ g: new THREE.CapsuleGeometry(0.0072, 0.022, 4, 8), p: [-side * 0.033, -0.022, 0.012], r: [0.5, 0, side * 0.72] });
  return merge(parts);
}

/* ─── Skin, eyes and cloth, painted at high resolution ───────────── */
function faceTexture(look) {
  const elder = look.age === 'elder';
  const adultish = look.age !== 'child';
  return cachedTexture(`face|${look.age}|${look.gender}|${look.facial === 'stubble' ? look.hairColor : ''}`, () => canvasTexture(2048, 1024, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    const X = (u) => w * (0.5 + u), Y = (v) => h * (0.5 - v);       // u, v: across and up the face
    const spot = (x, y, r, color) => {
      const c = g.createRadialGradient(x, y, 0, x, y, r);
      c.addColorStop(0, color); c.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = c; g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    for (const s of [-1, 1]) {
      spot(X(s * 0.085), Y(-0.1), 130, look.gender === 'f' ? 'rgba(240,110,105,.34)' : 'rgba(225,120,100,.2)');   // cheek
      spot(X(s * 0.058), Y(0.035), 90, 'rgba(110,65,50,.2)');                                                    // around the eye
      spot(X(s * 0.11), Y(-0.28), 200, 'rgba(120,70,50,.16)');                                                    // jaw shade
    }
    spot(X(0), Y(-0.17), 66, 'rgba(120,60,50,.14)');     // under the nose
    spot(X(0), Y(0.28), 240, 'rgba(255,245,230,.0)');
    // soft skin grain
    for (let i = 0; i < 26000; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '120,70,50' : '255,240,225'},${Math.random() * 0.035})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    if (look.facial === 'stubble') {
      g.fillStyle = look.hairColor;
      for (let i = 0; i < 9000; i++) {
        const a = Math.random() * TAU, r = Math.random();
        const x = X(Math.cos(a) * 0.15 * r), y = Y(-0.28 + Math.sin(a) * 0.14 * r);
        if (y < Y(-0.14)) continue;
        g.globalAlpha = 0.28 + Math.random() * 0.3;
        g.fillRect(x, y, 2.2, 3.4);
      }
      g.globalAlpha = 1;
    }
    if (adultish) {
      g.strokeStyle = `rgba(95,55,40,${elder ? 0.42 : 0.12})`;
      g.lineWidth = elder ? 3.4 : 2.4;
      for (const s of [-1, 1]) {                   // lines beside the mouth
        g.beginPath(); g.moveTo(X(s * 0.035), Y(-0.17)); g.quadraticCurveTo(X(s * 0.06), Y(-0.24), X(s * 0.05), Y(-0.31)); g.stroke();
      }
    }
    if (elder) {
      g.strokeStyle = 'rgba(95,55,40,.34)';
      g.lineWidth = 3;
      for (let k = 0; k < 3; k++) {                // forehead
        g.beginPath(); g.moveTo(X(-0.075), Y(0.2 + k * 0.05)); g.quadraticCurveTo(X(0), Y(0.215 + k * 0.05), X(0.075), Y(0.2 + k * 0.05)); g.stroke();
      }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {   // crow's feet
        g.beginPath(); g.moveTo(X(s * 0.098), Y(0.035)); g.lineTo(X(s * 0.122), Y(0.012 + k * 0.03)); g.stroke();
      }
    }
  }));
}

function irisTexture(color) {
  return cachedTexture(`iris|${color}`, () => canvasTexture(256, 256, (g, w) => {
    const c = w / 2;
    g.clearRect(0, 0, w, w);
    const base = g.createRadialGradient(c, c, w * 0.12, c, c, c);
    base.addColorStop(0, '#fff');
    base.addColorStop(0.18, color);
    base.addColorStop(0.82, color);
    base.addColorStop(1, '#0a0604');
    g.fillStyle = base;
    g.beginPath(); g.arc(c, c, c - 1, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.3)';
    g.lineWidth = 2;
    for (let i = 0; i < 44; i++) {                 // the fine threads of an iris
      const a = (i / 44) * TAU;
      g.beginPath(); g.moveTo(c + Math.cos(a) * c * 0.42, c + Math.sin(a) * c * 0.42); g.lineTo(c + Math.cos(a) * c * 0.84, c + Math.sin(a) * c * 0.84); g.stroke();
    }
    g.fillStyle = '#060403';
    g.beginPath(); g.arc(c, c, c * 0.42, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.beginPath(); g.arc(c + c * 0.3, c - c * 0.34, c * 0.17, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)';
    g.beginPath(); g.arc(c - c * 0.28, c + c * 0.3, c * 0.08, 0, TAU); g.fill();
  }));
}

function hairTexture(color) {
  return cachedTexture(`hair|${color}`, () => canvasTexture(1024, 1024, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * w, light = Math.random() < 0.5;
      g.strokeStyle = light ? `rgba(255,235,210,${Math.random() * 0.1})` : `rgba(0,0,0,${Math.random() * 0.28})`;
      g.lineWidth = 0.8 + Math.random() * 2.4;
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (Math.random() - 0.5) * 60, h * 0.33, x + (Math.random() - 0.5) * 60, h * 0.66, x + (Math.random() - 0.5) * 30, h); g.stroke();
    }
  }));
}

/** The front of the body is the middle of this canvas; u = 0.5 is the chest. Logical size 512 × 512. */
function outfitTexture(look) {
  const { outfit, color, color2 } = look;
  return cachedTexture(`cloth|${outfit}|${color}|${color2}`, () => canvasTexture(2048, 2048, (g2, w) => {
    g2.scale(w / 512, w / 512);
    const g = g2, cx = 256, W = 512, H = 512;
    g.fillStyle = color; g.fillRect(0, 0, W, H);
    const line = (x1, y1, x2, y2, c, lw = 2) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
    const shade = 'rgba(0,0,0,.24)', white = '#f6f2e8';
    const buttons = (y0, n, step, c = 'rgba(255,255,255,.85)') => { for (let i = 0; i < n; i++) { g.fillStyle = c; g.beginPath(); g.arc(cx, y0 + i * step, 3.4, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 0.8; g.stroke(); } };
    const shirtCollar = (c) => {
      g.fillStyle = c;
      g.beginPath(); g.moveTo(cx - 34, 8); g.lineTo(cx, 46); g.lineTo(cx - 36, 64); g.lineTo(cx - 60, 16); g.fill();
      g.beginPath(); g.moveTo(cx + 34, 8); g.lineTo(cx, 46); g.lineTo(cx + 36, 64); g.lineTo(cx + 60, 16); g.fill();
      g.strokeStyle = shade; g.lineWidth = 1.2;
      g.stroke();
    };
    const tie = (c) => {
      g.fillStyle = c;
      g.beginPath(); g.moveTo(cx - 10, 42); g.lineTo(cx + 10, 42); g.lineTo(cx + 5, 58); g.lineTo(cx + 15, 170); g.lineTo(cx, 192); g.lineTo(cx - 15, 170); g.lineTo(cx - 5, 58); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 4;
      for (let y = 75; y < 180; y += 24) line(cx - 14, y + 7, cx + 14, y - 7, 'rgba(255,255,255,.25)', 4);
    };
    if (outfit === 'tshirt') {
      g.fillStyle = color2;
      g.beginPath(); g.ellipse(cx, 0, 50, 34, 0, 0, TAU); g.fill();
      g.fillStyle = color; g.beginPath(); g.ellipse(cx, 0, 42, 26, 0, 0, TAU); g.fill();
      g.fillStyle = color2;
      for (let i = 0; i < 5; i++) {                  // a star on the chest
        const a = -Math.PI / 2 + (i / 5) * TAU;
        g.beginPath(); g.moveTo(cx, 130); g.lineTo(cx + Math.cos(a - 0.3) * 18, 130 + Math.sin(a - 0.3) * 18); g.lineTo(cx + Math.cos(a) * 46, 130 + Math.sin(a) * 46); g.lineTo(cx + Math.cos(a + 0.3) * 18, 130 + Math.sin(a + 0.3) * 18); g.fill();
      }
    } else if (outfit === 'stripes') {
      g.fillStyle = color2;
      for (let y = 36; y < H; y += 62) g.fillRect(0, y, W, 28);
      g.fillStyle = color; g.beginPath(); g.ellipse(cx, 0, 44, 28, 0, 0, TAU); g.fill();
    } else if (outfit === 'jersey') {
      g.fillStyle = color2;
      g.fillRect(cx - 150, 0, 26, H); g.fillRect(cx + 124, 0, 26, H);
      g.beginPath(); g.moveTo(cx - 38, 0); g.lineTo(cx, 46); g.lineTo(cx + 38, 0); g.lineTo(cx + 26, 0); g.lineTo(cx, 28); g.lineTo(cx - 26, 0); g.fill();
      g.font = '800 130px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('7', cx, 170);
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; g.strokeText('7', cx, 170);
    } else if (outfit === 'school') {
      line(cx, 40, cx, H, shade, 2);
      buttons(84, 6, 62);
      g.strokeStyle = shade; g.lineWidth = 2; g.strokeRect(cx + 40, 110, 62, 70);
      line(cx + 40, 128, cx + 102, 128, shade, 2);
      tie(color2);
      shirtCollar('#ffffff');
      g.fillStyle = '#26262c'; g.fillRect(0, 472, W, 24);          // belt
      g.fillStyle = '#c9b67a'; g.fillRect(cx - 14, 470, 28, 28);
    } else if (outfit === 'check') {
      for (let x = 0; x < W; x += 44) { g.fillStyle = `${color2}38`; g.fillRect(x, 0, 18, H); line(x + 34, 0, x + 34, H, 'rgba(0,0,0,.2)', 1.5); }
      for (let y = 0; y < H; y += 44) { g.fillStyle = `${color2}38`; g.fillRect(0, y, W, 18); line(0, y + 34, W, y + 34, 'rgba(0,0,0,.2)', 1.5); }
      line(cx - 8, 40, cx - 8, H, shade, 2); line(cx + 8, 40, cx + 8, H, shade, 2);
      buttons(84, 6, 62);
      shirtCollar(color);
    } else if (outfit === 'hoodie') {
      g.fillStyle = 'rgba(0,0,0,.14)';
      g.beginPath(); g.moveTo(cx - 90, 420); g.lineTo(cx - 70, 320); g.lineTo(cx + 70, 320); g.lineTo(cx + 90, 420); g.fill();
      line(cx - 70, 320, cx + 70, 320, shade, 3);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 480, W, 32);
      line(cx - 22, 22, cx - 26, 118, color2, 5); line(cx + 22, 22, cx + 26, 118, color2, 5);
      g.fillStyle = color2; g.beginPath(); g.arc(cx - 26, 122, 6, 0, TAU); g.arc(cx + 26, 122, 6, 0, TAU); g.fill();
    } else if (outfit === 'sweater') {
      g.fillStyle = white;
      g.beginPath(); g.moveTo(cx - 44, 0); g.lineTo(cx, 120); g.lineTo(cx + 44, 0); g.fill();
      line(cx - 44, 0, cx, 120, color2, 7); line(cx + 44, 0, cx, 120, color2, 7);
      for (let x = 0; x < W; x += 9) line(x, 0, x, H, 'rgba(0,0,0,.06)', 2);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 462, W, 50);
      for (let x = 0; x < W; x += 7) line(x, 462, x, H, 'rgba(255,255,255,.1)', 2);
    } else if (outfit === 'blazer') {
      g.fillStyle = white;
      g.beginPath(); g.moveTo(cx - 50, 0); g.lineTo(cx, 220); g.lineTo(cx + 50, 0); g.fill();
      tie(color2);
      g.fillStyle = 'rgba(0,0,0,.2)';
      g.beginPath(); g.moveTo(cx - 54, 0); g.lineTo(cx, 224); g.lineTo(cx - 26, 232); g.lineTo(cx - 96, 90); g.lineTo(cx - 72, 74); g.lineTo(cx - 88, 18); g.fill();
      g.beginPath(); g.moveTo(cx + 54, 0); g.lineTo(cx, 224); g.lineTo(cx + 26, 232); g.lineTo(cx + 96, 90); g.lineTo(cx + 72, 74); g.lineTo(cx + 88, 18); g.fill();
      line(cx, 224, cx, H, shade, 2.5);
      buttons(290, 2, 66, '#22222a');
      g.strokeStyle = shade; g.lineWidth = 2; g.strokeRect(cx + 60, 150, 62, 12); g.strokeRect(cx - 118, 368, 76, 14); g.strokeRect(cx + 42, 368, 76, 14);
    } else if (outfit === 'kurta') {
      g.fillStyle = color2; g.fillRect(cx - 13, 14, 26, 170);
      g.fillStyle = 'rgba(255,255,255,.65)';
      for (let y = 30; y < 180; y += 22) { g.beginPath(); g.moveTo(cx, y - 8); g.lineTo(cx + 8, y); g.lineTo(cx, y + 8); g.lineTo(cx - 8, y); g.fill(); }
      g.fillStyle = color2; g.fillRect(cx - 42, 0, 84, 14);
      for (let y = 4; y < H; y += 8) line(0, y, W, y, 'rgba(0,0,0,.022)', 1);
    } else if (outfit === 'frock' || outfit === 'dress') {
      g.fillStyle = color2;
      for (let y = 40; y < H; y += 54) for (let x = (y % 108 ? 0 : 27); x < W; x += 54) { g.beginPath(); g.arc(x, y, outfit === 'frock' ? 8 : 5, 0, TAU); g.fill(); }
      g.fillStyle = color; g.beginPath(); g.ellipse(cx, 0, 54, 42, 0, 0, TAU); g.fill();
      g.strokeStyle = white; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, 0, 54, 42, 0, 0, Math.PI); g.stroke();
      g.fillStyle = color2; g.fillRect(0, 392, W, 26);
    } else if (outfit === 'saree') {
      g.fillStyle = color2; g.beginPath(); g.ellipse(cx, 0, 48, 34, 0, 0, TAU); g.fill();
      g.fillStyle = color; g.beginPath(); g.ellipse(cx, 0, 38, 24, 0, 0, TAU); g.fill();
      g.save();                                         // the pallu falls from one shoulder across the chest
      g.translate(cx + 100, -30); g.rotate(0.62);
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-70, 0, 104, 640);
      g.fillStyle = color2; g.fillRect(-70, 0, 13, 640); g.fillRect(21, 0, 13, 640);
      g.fillStyle = 'rgba(255,255,255,.28)';
      for (let y = 20; y < 640; y += 34) { g.beginPath(); g.arc(-18, y, 5, 0, TAU); g.fill(); }
      g.restore();
    } else if (outfit === 'salwar') {
      g.fillStyle = color2; g.beginPath(); g.moveTo(cx - 40, 0); g.lineTo(cx, 72); g.lineTo(cx + 40, 0); g.fill();
      g.fillStyle = color; g.beginPath(); g.moveTo(cx - 30, 0); g.lineTo(cx, 54); g.lineTo(cx + 30, 0); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(cx - 66 + i * 12, 96 + Math.abs(i - 5.5) * -6, 3, 0, TAU); g.fill(); }
      g.fillStyle = `${color2}aa`;                       // dupatta
      g.save(); g.translate(cx - 110, -20); g.rotate(-0.55); g.fillRect(-26, 0, 58, 620); g.restore();
    }
    // woven look on every fabric
    for (let y = 0; y < H; y += 2.5) { g.fillStyle = `rgba(0,0,0,${0.012 + Math.random() * 0.018})`; g.fillRect(0, y, W, 1); }
    for (let x = 0; x < W; x += 2.5) { g.fillStyle = `rgba(255,255,255,${0.008 + Math.random() * 0.014})`; g.fillRect(x, 0, 1, H); }
  }));
}

/* ─── Hairdos ────────────────────────────────────────────────────── */
function hairGeometry(style) {
  return cachedGeo(`hair|${style}`, () => {
    const sp = (x, y, z, sx, sy, sz, r = [0, 0, 0], d = 14) => ({ g: ball(1, d + 4, d), p: [x, y, z], s: [sx, sy, sz], r });
    const cap = (radius = 0.1135, tilt = -0.56, theta = 0.55) => ({ g: new THREE.SphereGeometry(radius, 36, 22, 0, TAU, 0, Math.PI * theta), p: [0, 0.012, -0.01], r: [tilt, 0, 0] });
    const sideburns = [sp(-0.1, 0.006, 0.026, 0.006, 0.024, 0.012), sp(0.1, 0.006, 0.026, 0.006, 0.024, 0.012)];
    const parts = [];
    switch (style) {
      case 'short':
        parts.push(cap(), ...sideburns);
        parts.push(sp(0, 0.09, 0.062, 0.086, 0.019, 0.034, [0.36, 0, 0], 22));
        break;
      case 'side':
        parts.push(cap(), ...sideburns);
        parts.push(sp(0.02, 0.091, 0.056, 0.08, 0.022, 0.036, [0.32, 0, -0.2], 18));
        parts.push(sp(-0.05, 0.094, 0.044, 0.042, 0.02, 0.034, [0.32, 0, 0.32]));
        break;
      case 'spiky':
        parts.push(cap(), ...sideburns);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * TAU * 2.4, r = 0.015 + (i / 16) * 0.075;
          parts.push({ g: new THREE.ConeGeometry(0.026, 0.078, 8), p: [Math.cos(a) * r, 0.098 - r * 0.28, Math.sin(a) * r - 0.012], r: [Math.sin(a) * r * 8, 0, -Math.cos(a) * r * 8] });
        }
        break;
      case 'curly':
        parts.push(cap(0.11));
        for (let i = 0; i < 46; i++) {
          const a = i * 2.399, y = 0.28 + (i / 46) * 0.72, r = Math.sqrt(1 - y * y);
          const z = Math.sin(a) * r;
          if (z > 0.72 && y < 0.5) continue;       // leave the forehead clear
          parts.push(sp(Math.cos(a) * r * 0.112, y * 0.115 - 0.004, z * 0.112 - 0.008, 0.026, 0.026, 0.026, [0, 0, 0], 9));
        }
        break;
      case 'afro':
        parts.push(sp(0, 0.045, -0.026, 0.158, 0.146, 0.152, [0, 0, 0], 26));
        for (let i = 0; i < 60; i++) {
          const a = i * 2.399, y = -0.25 + (i / 60) * 1.25, r = Math.sqrt(Math.max(0, 1 - y * y));
          if (Math.sin(a) * r > 0.62 && y < 0.42) continue;
          parts.push(sp(Math.cos(a) * r * 0.156, 0.045 + y * 0.145, Math.sin(a) * r * 0.15 - 0.026, 0.021, 0.021, 0.021, [0, 0, 0], 7));
        }
        break;
      case 'buzz':
        parts.push(cap(0.1075, -0.32, 0.53), ...sideburns);
        break;
      case 'balding':
        parts.push(sp(-0.096, -0.002, -0.02, 0.026, 0.05, 0.06), sp(0.096, -0.002, -0.02, 0.026, 0.05, 0.06), sp(0, 0.004, -0.09, 0.08, 0.052, 0.034, [0, 0, 0], 18));
        break;
      case 'bob':
        parts.push(cap(0.115), { g: new THREE.SphereGeometry(0.124, 36, 22, 0, TAU, 0, Math.PI * 0.64), p: [0, 0, -0.028], r: [-0.74, 0, 0] });
        parts.push(sp(-0.102, -0.05, 0.008, 0.03, 0.075, 0.048), sp(0.102, -0.05, 0.008, 0.03, 0.075, 0.048));
        parts.push(sp(0, 0.08, 0.074, 0.09, 0.024, 0.028, [0.3, 0, 0], 22));
        break;
      case 'long':
        parts.push(cap(0.115));
        parts.push(sp(0, -0.09, -0.074, 0.118, 0.2, 0.046, [0.08, 0, 0], 20));
        parts.push(sp(-0.102, -0.09, -0.006, 0.026, 0.15, 0.04, [0, 0, -0.05]), sp(0.102, -0.09, -0.006, 0.026, 0.15, 0.04, [0, 0, 0.05]));
        parts.push(sp(0.034, 0.09, 0.056, 0.058, 0.017, 0.028, [0.3, 0, -0.36]), sp(-0.034, 0.09, 0.056, 0.058, 0.017, 0.028, [0.3, 0, 0.36]));
        break;
      case 'wavy':
        parts.push(cap(0.116));
        for (let i = 0; i < 11; i++) {
          const a = -1.25 + (i / 10) * 2.5;
          for (let k = 0; k < 4; k++) parts.push(sp(Math.sin(a) * (0.112 + (k % 2) * 0.01), -0.008 - k * 0.058, -Math.cos(a) * 0.078 - 0.012, 0.033, 0.043, 0.03));
        }
        parts.push(sp(0.034, 0.09, 0.056, 0.058, 0.017, 0.028, [0.3, 0, -0.36]), sp(-0.034, 0.09, 0.056, 0.058, 0.017, 0.028, [0.3, 0, 0.36]));
        break;
      case 'plaits':
        parts.push(cap(0.114));
        parts.push(sp(0.034, 0.09, 0.056, 0.058, 0.016, 0.027, [0.3, 0, -0.36]), sp(-0.034, 0.09, 0.056, 0.058, 0.016, 0.027, [0.3, 0, 0.36]));
        for (const s of [-1, 1]) for (let k = 0; k < 8; k++) {
          parts.push(sp(s * (0.092 + k * 0.002), -0.042 - k * 0.029, -0.026, 0.0215 - k * 0.0009, 0.021, 0.0215 - k * 0.0009, [0, 0, s * (k % 2 ? 0.4 : -0.4)], 9));
        }
        break;
      case 'ponytail':
        parts.push(cap(0.1145));
        parts.push(sp(0.02, 0.092, 0.054, 0.072, 0.017, 0.028, [0.3, 0, -0.18]));
        for (let k = 0; k < 7; k++) parts.push(sp(0, 0.05 - k * 0.042, -0.112 - Math.sin(k * 0.45) * 0.03, 0.03 - k * 0.0018, 0.036, 0.03 - k * 0.0018));
        break;
      case 'bun':
        parts.push(cap(0.1145));
        parts.push(sp(0.03, 0.091, 0.054, 0.058, 0.016, 0.026, [0.3, 0, -0.3]), sp(-0.03, 0.091, 0.054, 0.058, 0.016, 0.026, [0.3, 0, 0.3]));
        parts.push(sp(0, 0.095, -0.094, 0.05, 0.05, 0.05, [0, 0, 0], 20));
        break;
      default:
        break;
    }
    return parts.length ? merge(parts) : null;
  });
}

function buildAccessories() {
  const acc = {};
  // Sipahi / detective cap
  {
    const g = new THREE.Group();
    const navy = std({ color: '#1f3f8a', roughness: 0.6 });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.1, 0.06, 14), navy);
    top.position.y = 0.1;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.06), std({ color: '#111a33' }));
    brim.position.set(0, 0.075, 0.1);
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.018, 8), std({ color: '#f0c040', metalness: 0.8, roughness: 0.3, envMapIntensity: 1 }));
    badge.position.set(0, 0.1, 0.104);
    g.add(top, brim, badge);
    acc.cap = g;
  }
  // Crown
  {
    const g = new THREE.Group();
    const gold = std({ color: '#f2c12e', metalness: 0.9, roughness: 0.3, envMapIntensity: 1.2 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.05, 12, 1, true), gold);
    band.material.side = THREE.DoubleSide;
    band.position.y = 0.11;
    g.add(band);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      const p = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 4), gold);
      p.position.set(Math.sin(a) * 0.082, 0.155, Math.cos(a) * 0.082);
      g.add(p);
    }
    acc.crown = g;
  }
  // Tiara
  {
    const g = new THREE.Group();
    const silver = std({ color: '#e8d6f0', metalness: 0.8, roughness: 0.3, envMapIntensity: 1.2 });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 5, 16, Math.PI), silver);
    arc.rotation.x = -Math.PI / 2 + 0.5;
    arc.position.set(0, 0.07, 0.0);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.02), std({ color: '#ff4fa3', emissive: '#ff4fa3', emissiveIntensity: 0.4 }));
    gem.position.set(0, 0.12, 0.075);
    g.add(arc, gem);
    acc.tiara = g;
  }
  // Wazir's turban
  {
    const g = new THREE.Group();
    const cloth = std({ color: '#f2efe6', roughness: 0.85 });
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095 - i * 0.012, 0.028, 6, 16), cloth);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.075 + i * 0.03;
      g.add(ring);
    }
    const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.018), std({ color: '#1f9a4a', emissive: '#1f9a4a', emissiveIntensity: 0.4 }));
    jewel.position.set(0, 0.1, 0.11);
    g.add(jewel);
    acc.turban = g;
  }
  // Nepali dhaka topi
  {
    const g = new THREE.Group();
    const c = document.createElement('canvas');
    c.width = 64; c.height = 16;
    const x = c.getContext('2d');
    ['#c8272d', '#1f3f8a', '#f0c23a', '#2c7a4a', '#111'].forEach((col, i) => { x.fillStyle = col; for (let k = i; k < 64; k += 5) x.fillRect(k, 0, 2, 16); });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const topi = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.105, 0.09, 14), std({ map: t, roughness: 0.8 }));
    topi.position.y = 0.11;
    topi.rotation.x = -0.12;
    g.add(topi);
    acc.dhaka = g;
  }
  // Doctor's head mirror band
  {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.012, 5, 20), std({ color: '#f2f2f2' }));
    band.rotation.x = Math.PI / 2 - 0.2;
    band.position.y = 0.05;
    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 14), std({ color: '#dfe4ea', metalness: 1, roughness: 0.15, envMapIntensity: 1.4 }));
    mirror.rotation.x = Math.PI / 2;
    mirror.position.set(0, 0.075, 0.105);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.006), std({ color: '#d62839' }));
    cross.position.set(0, 0.075, 0.11);
    g.add(band, mirror, cross);
    acc.doctor = g;
  }
  // Mayor's top hat
  {
    const g = new THREE.Group();
    const black = std({ color: '#151515', roughness: 0.5 });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.14, 14), black);
    crown.position.y = 0.16;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 16), black);
    brim.position.y = 0.09;
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.077, 0.077, 0.025, 14), std({ color: '#8a1a1a' }));
    ribbon.position.y = 0.11;
    g.add(crown, brim, ribbon);
    acc.tophat = g;
  }
  // Banker's green visor
  {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.01, 5, 20), std({ color: '#1f6b3a' }));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.06;
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.006, 16, 1, false, -Math.PI / 2.4, Math.PI / 1.2),
      std({ color: '#2fa35a', transparent: true, opacity: 0.85 }));
    peak.position.set(0, 0.06, 0.04);
    g.add(band, peak);
    acc.visor = g;
  }
  // Sheriff's cowboy hat
  {
    const g = new THREE.Group();
    const leather = std({ color: '#8a5a2b', roughness: 0.7 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 18), leather);
    brim.position.y = 0.085;
    brim.scale.set(1, 1, 0.85);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.09, 14), leather);
    crown.position.y = 0.13;
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.02, 5), std({ color: '#f0c040', metalness: 0.8, roughness: 0.3, envMapIntensity: 1 }));
    star.position.set(0, 0.13, 0.084);
    g.add(brim, crown, star);
    acc.cowboy = g;
  }
  // British custodian helmet
  {
    const g = new THREE.Group();
    const navy = std({ color: '#141c3a', roughness: 0.55 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), navy);
    dome.scale.set(1, 1.35, 1);
    dome.position.y = 0.12;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), std({ color: '#c0c4cc', metalness: 0.9, roughness: 0.3, envMapIntensity: 1 }));
    knob.position.y = 0.27;
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.025, 8), std({ color: '#c0c4cc', metalness: 0.9, roughness: 0.3, envMapIntensity: 1 }));
    badge.position.set(0, 0.13, 0.108);
    g.add(dome, knob, badge);
    acc.helmet = g;
  }
  // Russian ushanka
  {
    const g = new THREE.Group();
    const fur = std({ color: '#5a4636', roughness: 1 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.118, 16, 10, 0, TAU, 0, Math.PI * 0.5), std({ color: '#3a3a44', roughness: 0.8 }));
    cap.position.y = 0.035;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 8, 20), fur);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.05;
    g.add(cap, band);
    [-1, 1].forEach(s => {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.07), fur);
      flap.position.set(s * 0.11, -0.01, 0);
      g.add(flap);
    });
    acc.ushanka = g;
  }
  // French gendarme kepi
  {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.09, 14), std({ color: '#1a2250', roughness: 0.6 }));
    top.position.y = 0.12;
    top.rotation.x = -0.1;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.101, 0.101, 0.022, 14), std({ color: '#c8272d' }));
    band.position.y = 0.085;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.01, 0.06), std({ color: '#111' }));
    brim.position.set(0, 0.075, 0.1);
    g.add(top, band, brim);
    acc.kepi = g;
  }
  // Beret
  {
    const g = new THREE.Group();
    const beret = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), std({ color: '#1a1a1a', roughness: 0.9 }));
    beret.scale.set(1.05, 0.35, 1.05);
    beret.position.set(0.015, 0.095, -0.01);
    beret.rotation.z = -0.2;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.02, 5), std({ color: '#1a1a1a' }));
    stalk.position.set(0.02, 0.14, -0.01);
    g.add(beret, stalk);
    acc.beret = g;
  }
  // Sombrero
  {
    const g = new THREE.Group();
    const straw = std({ color: '#d9b86a', roughness: 0.9 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.012, 22), straw);
    brim.position.y = 0.085;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.014, 6, 24), std({ color: '#c8272d' }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.09;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 14), straw);
    crown.position.y = 0.16;
    g.add(brim, rim, crown);
    acc.sombrero = g;
  }
  // Cheat's eye mask
  {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.104, 0.02, 6, 20), std({ color: '#111', roughness: 0.5 }));
    band.rotation.x = Math.PI / 2;
    band.scale.set(1, 1, 1.2);
    band.position.y = 0.005;
    g.add(band);
    acc.mask = g;
  }
  Object.values(acc).forEach(g => {
    g.visible = false;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  });
  return acc;
}



/* ─── One character ──────────────────────────────────────────────── */
const AGE_BODY = { child: 1, teen: 1.1, adult: 1.22, elder: 1.18 };
const AGE_HEAD = { child: 1, teen: 0.91, adult: 0.84, elder: 0.85 };

export function createCharacter(scene, look, { seat, paperMaterial, standing = false }) {
  const root = new THREE.Group();
  root.position.set(seat.x, 0, seat.z);
  root.rotation.y = Math.atan2(-seat.x, -seat.z);   // face the centre of the mat
  scene.add(root);

  const shadowy = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  // the rig stays; what it wears is rebuilt by dress()
  const spine = new THREE.Group();
  spine.position.y = 0.11;
  root.add(spine);
  const headPivot = new THREE.Group();
  headPivot.position.y = 0.4;
  spine.add(headPivot);
  const head = new THREE.Group();
  head.position.y = 0.11;
  headPivot.add(head);
  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.135, 0.3, 0);
    spine.add(shoulder);
    const elbow = new THREE.Group();
    elbow.position.y = -0.145;
    shoulder.add(elbow);
    const hand = new THREE.Group();
    hand.position.y = -0.14;
    elbow.add(hand);
    return { side, shoulder, elbow, hand };
  };
  const L = makeArm(1), R = makeArm(-1);

  // A standing character (the player on a Room Tour) has legs that swing from the hips.
  const LEG = 0.34;
  const hips = standing ? [1, -1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.07, 0.1 + LEG, 0); root.add(g); return g; }) : [];
  if (standing) spine.position.y = 0.11 + LEG;
  let walk = 0, walkTarget = 0, stride = 0;

  // Face parts that move with the mood
  const eyes = [], irises = [], brows = [];
  let lipMat = null;
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.052, 0.0955);
  head.add(mouth);
  const MOUTHS = {};
  const showMouth = (name) => Object.entries(MOUTHS).forEach(([k, m]) => { m.visible = k === name; });

  /* ─── Everything that depends on the look ───────────────────── */
  let parts = [], ownMaterials = [];
  let currentKey = '', wear = null;
  let torso = null, baseZ = 0.76;
  const mat = (p) => { const m = std(p); ownMaterials.push(m); return m; };
  const add = (parent, mesh) => { parent.add(mesh); parts.push([parent, mesh]); return mesh; };

  function dress(l) {
    const key = lookKey(l);
    if (key === currentKey) return;
    currentKey = key;
    parts.forEach(([p, m]) => { p.remove(m); if (!m.geometry.userData.shared) m.geometry.dispose(); });
    parts = [];
    ownMaterials.forEach(m => m.dispose());
    ownMaterials = [];
    eyes.length = 0; irises.length = 0; brows.length = 0;
    Object.keys(MOUTHS).forEach(k => delete MOUTHS[k]);

    const female = l.gender === 'f';
    const adult = l.age === 'adult' || l.age === 'elder';
    const info = OUTFITS.find(o => o.id === l.outfit) || OUTFITS[0];
    const shared = (g) => { g.userData.shared = true; return g; };
    const bodyScale = AGE_BODY[l.age] * (female && adult ? 0.96 : 1);
    root.scale.setScalar(bodyScale);
    head.scale.setScalar(AGE_HEAD[l.age]);
    head.position.y = 0.11 - (1 - AGE_HEAD[l.age]) * 0.05;
    headPivot.position.y = adult ? 0.376 : l.age === 'teen' ? 0.383 : 0.392;
    const widen = female ? 0.9 : adult ? 1.06 : 1;
    L.shoulder.position.x = 0.135 * widen; R.shoulder.position.x = -0.135 * widen;

    const skinFlat = mat({ color: l.skin, roughness: 0.58 });
    const skinFace = mat({ color: l.skin, map: faceTexture(l), roughness: 0.56 });
    const cloth = mat({ map: outfitTexture(l), roughness: 0.84 });
    const sleeveColor = l.outfit === 'saree' ? l.color2 : l.color;
    const sleeve = mat({ color: sleeveColor, roughness: 0.84 });
    const pantsMat = mat({ color: l.pants, roughness: 0.86 });
    const hairMat = mat({ map: hairTexture(l.hairColor), roughness: 0.62 });
    const darkMat = new THREE.MeshBasicMaterial({ color: '#190d0a' });
    ownMaterials.push(darkMat);

    // bare feet with ethnic wear, shoes otherwise
    const barefoot = ['kurta', 'saree', 'salwar', 'dress', 'frock'].includes(l.outfit);
    const shoeMat = barefoot ? skinFlat : mat({ color: ['jersey', 'hoodie'].includes(l.outfit) ? '#f2f0ea' : '#2a2320', roughness: 0.5 });

    /* legs: standing straight, or sitting cross-legged */
    if (standing) {
      const longSkirt = info.skirt && l.outfit !== 'frock';
      hips.forEach((hip) => {
        if (!longSkirt) add(hip, shadowy(limb([0, 0, 0], [0, -LEG + 0.05, 0], adult ? 0.05 : 0.046, info.skirt ? skinFlat : pantsMat)));
        const foot = add(hip, shadowy(new THREE.Mesh(shared(cachedGeo('foot', () => ball(1, 16, 12))), shoeMat)));
        foot.scale.set(0.04, 0.03, 0.07);
        foot.position.set(0, -LEG + 0.02, 0.03);
      });
      if (info.skirt) {
        const len = longSkirt ? LEG + 0.08 : LEG * 0.55;
        const skirt = add(root, shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.115, longSkirt ? 0.2 : 0.19, len, 32, 1, true), cloth)));
        skirt.material.side = THREE.DoubleSide;
        skirt.position.y = 0.13 + LEG - len / 2;
      } else {
        const hip = add(root, shadowy(new THREE.Mesh(shared(cachedGeo('hip', () => ball(1, 28, 18))), pantsMat)));
        hip.scale.set(0.135 * widen, 0.085, 0.1);
        hip.position.set(0, 0.095 + LEG, 0);
      }
    } else if (!info.skirt) {
      const hemMat = mat({ color: new THREE.Color(l.pants).multiplyScalar(0.78), roughness: 0.9 });
      for (const s of [-1, 1]) {
        add(root, shadowy(limb([s * 0.075, 0.095, 0.015], [s * 0.245, 0.085, 0.19], adult ? 0.058 : 0.052, pantsMat)));
        const knee = [s * 0.245, 0.075, 0.19], ankle = [-s * 0.045, 0.058 + (s > 0 ? 0.03 : 0), 0.275];
        add(root, shadowy(limb(knee, ankle, adult ? 0.043 : 0.04, pantsMat)));
        // the hem of the trouser leg, a little wider and darker, where the shoe starts
        const dir = new THREE.Vector3(...ankle).sub(new THREE.Vector3(...knee)).normalize();
        const hem = add(root, shadowy(new THREE.Mesh(shared(cachedGeo('hem', () => new THREE.CylinderGeometry(1, 1, 1, 20, 1, true))), hemMat)));
        hem.material.side = THREE.DoubleSide;
        hem.scale.set((adult ? 0.043 : 0.04) + 0.006, 0.022, (adult ? 0.043 : 0.04) + 0.006);
        hem.position.set(...ankle).addScaledVector(dir, 0.006);
        hem.quaternion.setFromUnitVectors(UP, dir);
      }
      add(root, shadowy(new THREE.Mesh(shared(cachedGeo('hip', () => ball(1, 28, 18))), pantsMat))).scale.set(0.135 * widen, 0.085, 0.1);
      parts[parts.length - 1][1].position.set(0, 0.095, 0);
    } else {
      const long = l.outfit !== 'frock';
      const skirt = add(root, shadowy(new THREE.Mesh(shared(cachedGeo(`skirt|${long}`, () => {
        const pts = long
          ? [[0.11, 0.2], [0.14, 0.15], [0.22, 0.1], [0.31, 0.06], [0.355, 0.03], [0.36, 0.008], [0, 0.008]]
          : [[0.11, 0.19], [0.15, 0.14], [0.24, 0.09], [0.31, 0.056], [0.325, 0.03], [0.3, 0.012], [0, 0.012]];
        const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 42, Math.PI);
        const uv = g.attributes.uv, p = g.attributes.position;
        for (let i = 0; i < p.count; i++) uv.setY(i, 0.5 * (p.getY(i) / 0.2));
        g.computeVertexNormals();
        return g;
      })), cloth)));
      skirt.scale.z = 0.86;
      skirt.position.z = 0.05;
    }
    if (l.outfit === 'kurta' || l.outfit === 'salwar') {
      const tunic = add(spine, shadowy(new THREE.Mesh(shared(cachedGeo('tunic', () => {
        const g = new THREE.LatheGeometry([[0.115, 0.04], [0.135, -0.02], [0.17, -0.07], [0.2, -0.095]].map(([x, y]) => new THREE.Vector2(x, y)), 36, Math.PI);
        const uv = g.attributes.uv, p = g.attributes.position;
        for (let i = 0; i < p.count; i++) uv.setY(i, 0.02 + (p.getY(i) + 0.095) * 0.3);
        return g;
      })), cloth)));
      tunic.material.side = THREE.DoubleSide;
      tunic.scale.z = 0.86;
    }
    if (!standing) {
      const sneakers = ['jersey', 'hoodie'].includes(l.outfit);
      const soleMat = barefoot ? null : mat({ color: sneakers ? '#f4f1ea' : '#140e0b', roughness: 0.75 });
      const laceMat = barefoot ? null : mat({ color: sneakers ? '#d6d0c4' : '#4a3b30', roughness: 0.8 });
      // the foot's own frame, and a piece inside it (plain objects, never added to the scene: just the maths)
      const frame = new THREE.Object3D(), local = new THREE.Object3D();
      frame.add(local);
      const unitBall = () => ball(1, 16, 12), unitBox = () => new THREE.BoxGeometry(1, 1, 1);
      // one piece of a shoe, placed in the foot's own frame (every piece is its own mesh, so a change of clothes clears it)
      const piece = (key, make, material, [x, y, z], [sx, sy, sz], rot = [0, 0, 0]) => {
        const m = add(root, shadowy(new THREE.Mesh(shared(cachedGeo(key, make)), material)));
        local.position.set(x, y, z);
        local.rotation.set(rot[0], rot[1], rot[2]);
        local.scale.set(sx, sy, sz);
        frame.updateMatrixWorld(true);
        local.matrixWorld.decompose(m.position, m.quaternion, m.scale);
        return m;
      };
      for (const s of [-1, 1]) {
        // cross-legged, each foot lies in front of the other knee on its outer edge, the sole half turned up
        const at = info.skirt ? [s * 0.2175, 0.036, 0.285] : [-s * 0.1, 0.046 + (s > 0 ? 0.03 : 0), 0.272];
        const turn = info.skirt ? s * 0.7 : -s * 1.2, roll = info.skirt ? s * 0.25 : s * 0.5;
        frame.position.set(...at);
        frame.rotation.set(0, turn, roll, 'YXZ');
        if (barefoot) {
          piece('foot', unitBall, skinFlat, [0, 0, 0], [0.034, 0.024, 0.064]);
          [-0.021, -0.01, 0, 0.0095, 0.018].forEach((x, k) => piece('foot', unitBall, skinFlat, [x * s, 0.004, 0.058 - Math.abs(x) * 0.45], [k === 0 ? 0.0095 : 0.0072 - k * 0.0004, 0.0072, 0.009]));
        } else {
          piece('foot', unitBall, soleMat, [0, -0.013, 0], [0.04, 0.011, 0.073]);                 // the sole
          piece('foot', unitBall, shoeMat, [0, 0.002, -0.004], [0.036, 0.026, 0.064]);            // the upper
          piece('foot', unitBall, shoeMat, [0, -0.002, 0.04], [0.031, 0.02, 0.033]);              // the toe cap
          piece('unitbox', unitBox, laceMat, [0, 0.024, 0.014], [0.016, 0.0045, 0.036], [0.3, 0, 0]); // the laces
          piece('foot', unitBall, darkMat, [0, 0.021, -0.032], [0.021, 0.006, 0.019]);            // the opening at the ankle
        }
      }
    }

    /* torso */
    torso = add(spine, shadowy(new THREE.Mesh(shared(cachedGeo(`torso|${female ? 'f' : 'm'}|${adult ? 'a' : 'y'}`, () => {
      const prof = female
        ? [[0, -0.01], [0.112, -0.01], [0.116, 0.03], [adult ? 0.092 : 0.098, 0.11], [adult ? 0.118 : 0.106, 0.2], [0.116, 0.26], [0.102, 0.31], [0.058, 0.343], [0.04, 0.356]]
        : [[0, -0.01], [0.113, -0.01], [0.116, 0.04], [0.108, 0.12], [adult ? 0.13 : 0.116, 0.21], [adult ? 0.142 : 0.128, 0.27], [adult ? 0.124 : 0.112, 0.316], [0.062, 0.346], [0.043, 0.358]];
      const g = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 44, Math.PI);
      const uv = g.attributes.uv, p = g.attributes.position;
      for (let i = 0; i < p.count; i++) uv.setY(i, clamp((p.getY(i) + 0.01) / 0.368, 0, 1));
      g.computeVertexNormals();
      return g;
    })), cloth)));
    baseZ = female ? 0.78 : 0.74;
    torso.scale.z = baseZ;
    if (['school', 'check'].includes(l.outfit)) {
      const collar = add(spine, new THREE.Mesh(shared(cachedGeo('collar', () => new THREE.TorusGeometry(0.05, 0.012, 8, 28))), mat({ color: l.outfit === 'school' ? '#ffffff' : l.color, roughness: 0.8 })));
      collar.rotation.x = Math.PI / 2 - 0.2;
      collar.position.set(0, 0.34, 0.002);
    }
    if (l.outfit === 'hoodie') {
      const hood = add(spine, shadowy(new THREE.Mesh(shared(cachedGeo('hood', () => new THREE.TorusGeometry(0.066, 0.034, 10, 28))), sleeve)));
      hood.rotation.x = Math.PI / 2 - 0.42;
      hood.position.set(0, 0.345, -0.024);
    }
    const neck = add(headPivot, new THREE.Mesh(shared(cachedGeo('neck', () => new THREE.CylinderGeometry(0.04, 0.047, 0.09, 18))), skinFlat));
    neck.position.y = 0.008;

    /* arms */
    const long = info.sleeve === 'long';
    for (const arm of [L, R]) {
      const r = (female ? 0.033 : adult ? 0.04 : 0.036);
      const upper = add(arm.shoulder, shadowy(new THREE.Mesh(shared(cachedGeo(`upper|${r}`, () => new THREE.CapsuleGeometry(r, 0.105, 6, 16))), sleeve)));
      upper.position.y = -0.07;
      const fr = r * 0.82;
      const fore = add(arm.elbow, shadowy(new THREE.Mesh(shared(cachedGeo(`fore|${fr}`, () => new THREE.CapsuleGeometry(fr, 0.1, 6, 16))), long ? sleeve : skinFlat)));
      fore.position.y = -0.065;
      if (long) {
        const cuff = add(arm.elbow, new THREE.Mesh(shared(cachedGeo(`cuff|${fr}`, () => new THREE.CylinderGeometry(fr + 0.002, fr + 0.002, 0.014, 16))), mat({ color: l.outfit === 'hoodie' ? l.color2 : l.color, roughness: 0.8 })));
        cuff.position.y = -0.128;
      }
      const hand = add(arm.hand, shadowy(new THREE.Mesh(shared(cachedGeo(`hand|${arm.side}`, () => handGeometry(arm.side))), skinFlat)));
      hand.scale.setScalar(female ? 0.92 : adult ? 1.05 : 0.95);
    }

    /* head */
    add(head, shadowy(new THREE.Mesh(shared(cachedGeo('head', headGeometry)), skinFace)));
    add(head, new THREE.Mesh(shared(cachedGeo('nose', noseGeometry)), skinFlat)).scale.set(adult && !female ? 1.1 : 1, adult ? 1.08 : 0.95, 1);
    const scleraMat = mat({ color: '#f8f6f0', roughness: 0.18, envMapIntensity: 0.6 });
    const irisMat = mat({ map: irisTexture(l.eyes), roughness: 0.12, transparent: true, emissive: '#ffffff', emissiveMap: irisTexture(l.eyes), emissiveIntensity: 0.18 });
    const lashMat = mat({ color: l.age === 'elder' ? '#5b4a3f' : '#1a100b', roughness: 0.7 });
    for (const s of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(s * 0.038, 0.004, 0.0845);
      add(head, eye);
      eye.geometry = { dispose() {}, userData: { shared: true } };
      const sclera = new THREE.Mesh(shared(cachedGeo('sclera', () => ball(0.0195, 24, 18))), scleraMat);
      sclera.scale.set(1.16, 1.04, 0.56);
      eye.add(sclera);
      const iris = new THREE.Mesh(shared(cachedGeo('iris', () => new THREE.CircleGeometry(0.0128, 32))), irisMat);
      iris.position.z = 0.0111;
      eye.add(iris);
      const lash = new THREE.Mesh(shared(cachedGeo('lash', () => new THREE.TorusGeometry(0.0224, 0.0018, 8, 22, Math.PI * 0.86))), lashMat);
      lash.position.set(0, -0.003, 0.0046);
      lash.rotation.set(-0.24, 0, Math.PI * 0.07);
      lash.scale.set(1, 0.84, 1);
      if (female) lash.scale.z = 1.5;
      eye.add(lash);
      eyes.push(eye); irises.push(iris);
      const brow = add(head, new THREE.Mesh(shared(cachedGeo(`brow|${female ? 'f' : 'm'}`, () => new THREE.CapsuleGeometry(female ? 0.0028 : 0.0044, 0.027, 4, 10))), mat({ map: hairTexture(l.hairColor), roughness: 0.6 })));
      brow.rotation.z = Math.PI / 2;
      brow.position.set(s * 0.038, 0.0335, 0.0965);
      brow.userData.side = s;
      brows.push(brow);
      const ear = add(head, new THREE.Mesh(shared(cachedGeo('ear', earGeometry)), skinFlat));
      ear.position.set(s * 0.105, -0.008, -0.004);
      ear.rotation.y = s * 0.22;
      if (s < 0) ear.scale.x = -1;
      if (female && adult) {
        add(head, new THREE.Mesh(shared(cachedGeo('earring', () => ball(0.0055, 10, 8))), mat({ color: '#e6bc4a', metalness: 0.9, roughness: 0.25, envMapIntensity: 1 }))).position.set(s * 0.107, -0.034, 0);
      }
    }

    /* mouth: smile, frown, open, flat */
    const lip = female && l.age !== 'child' ? '#a8333f' : '#8a3d35';
    lipMat = mat({ color: lip, roughness: 0.42 });
    const smile = new THREE.Mesh(shared(cachedGeo('smile', () => new THREE.TorusGeometry(0.019, 0.0036, 8, 22, Math.PI))), lipMat);
    smile.rotation.z = Math.PI; smile.position.y = 0.008;
    const frown = new THREE.Mesh(shared(cachedGeo('frown', () => new THREE.TorusGeometry(0.016, 0.0036, 8, 22, Math.PI))), lipMat);
    frown.position.y = -0.008;
    const openM = new THREE.Group();
    const cave = new THREE.Mesh(shared(cachedGeo('cave', () => ball(0.0165, 20, 14))), mat({ color: '#3d1212', roughness: 0.8 }));
    cave.scale.set(1, 0.85, 0.35);
    const teeth = new THREE.Mesh(shared(cachedGeo('teeth', () => new THREE.CapsuleGeometry(0.0028, 0.016, 4, 8))), mat({ color: '#f6f4ec', roughness: 0.25 }));
    teeth.rotation.z = Math.PI / 2; teeth.position.set(0, 0.0072, 0.0048);
    const lipRing = new THREE.Mesh(shared(cachedGeo('lipRing', () => new THREE.TorusGeometry(0.0165, 0.0026, 8, 26))), lipMat);
    lipRing.scale.y = 0.85;
    openM.add(cave, teeth, lipRing);
    const flat = new THREE.Mesh(shared(cachedGeo('flat', () => new THREE.CapsuleGeometry(0.0036, 0.022, 4, 8))), lipMat);
    flat.rotation.z = Math.PI / 2;
    [smile, frown, openM, flat].forEach(m => { add(mouth, m); if (!m.geometry) m.geometry = { dispose() {}, userData: { shared: true } }; });
    Object.assign(MOUTHS, { smile, frown, open: openM, flat });
    openShape = cave;
    showMouth('smile');

    /* hair, unless something covers it */
    const covered = l.headwear === 'hijab' || l.headwear === 'pagri';
    const hatted = l.headwear === 'cap' || l.headwear === 'beanie';
    const flatStyle = hatted && ['short', 'side', 'spiky', 'curly', 'afro', 'bun'].includes(l.hair) ? 'buzz' : l.hair;
    const hairGeo = covered ? null : hairGeometry(flatStyle);
    if (hairGeo) {
      hairGeo.userData.shared = true;
      add(head, shadowy(new THREE.Mesh(hairGeo, hairMat)));
    }
    if (l.hair === 'plaits' && !covered) {
      for (const s of [-1, 1]) {
        add(head, new THREE.Mesh(shared(cachedGeo('ribbon', () => merge([
          { g: ball(1, 10, 8), p: [-0.018, 0, 0], s: [0.018, 0.011, 0.007] }, { g: ball(1, 10, 8), p: [0.018, 0, 0], s: [0.018, 0.011, 0.007] }, { g: ball(0.007, 10, 8) },
        ]))), mat({ color: l.color2, roughness: 0.6 }))).position.set(s * 0.104, -0.262, -0.026);
      }
    }
    if (l.hair === 'ponytail' && !covered) {
      add(head, new THREE.Mesh(shared(cachedGeo('band', () => new THREE.TorusGeometry(0.024, 0.006, 8, 18))), mat({ color: l.color2 }))).position.set(0, 0.058, -0.112);
      parts[parts.length - 1][1].rotation.x = Math.PI / 2;
    }

    /* facial hair */
    if (l.facial === 'moustache' || l.facial === 'beard') {
      const faceHair = mat({ map: hairTexture(l.hairColor), roughness: 0.65 });
      add(head, new THREE.Mesh(shared(cachedGeo('moustache', () => merge([
        { g: ball(1, 14, 10), p: [-0.0145, 0, 0], r: [0, 0, 0.22], s: [0.017, 0.0058, 0.006] },
        { g: ball(1, 14, 10), p: [0.0145, 0, 0], r: [0, 0, -0.22], s: [0.017, 0.0058, 0.006] },
      ]))), faceHair)).position.set(0, -0.0365, 0.1015);
      if (l.facial === 'beard') {
        add(head, new THREE.Mesh(shared(cachedGeo('beard', () => {
          const pts = [];
          for (let i = 0; i < 18; i++) {
            const a = -1.42 + (i / 17) * 2.84;
            pts.push({ g: ball(1, 10, 8), p: [Math.sin(a) * 0.082 * (1 - 0.1 * Math.abs(a)), -0.058 - Math.cos(a) * 0.04, Math.cos(a) * 0.072], s: [0.019, 0.026, 0.018] });
            pts.push({ g: ball(1, 10, 8), p: [Math.sin(a) * 0.062, -0.086 - Math.cos(a) * 0.022, Math.cos(a) * 0.06], s: [0.02, 0.022, 0.017] });
          }
          return merge(pts);
        })), faceHair));
      }
    }

    /* glasses, bindi */
    if (l.glasses !== 'none') {
      const frame = mat({ color: '#17151a', roughness: 0.3, metalness: 0.2 });
      const lens = l.glasses === 'round'
        ? new THREE.TorusGeometry(0.0255, 0.0022, 8, 28)
        : new THREE.TorusGeometry(0.0285, 0.0024, 6, 4);
      const g = add(head, new THREE.Mesh(shared(cachedGeo(`glasses|${l.glasses}`, () => merge([
        { g: lens, p: [-0.038, 0.004, 0.1], r: [0, 0, l.glasses === 'round' ? 0 : Math.PI / 4] },
        { g: lens, p: [0.038, 0.004, 0.1], r: [0, 0, l.glasses === 'round' ? 0 : Math.PI / 4] },
        { g: new THREE.CapsuleGeometry(0.0018, 0.022, 3, 6), p: [0, 0.006, 0.106], r: [0, 0, Math.PI / 2] },
        { g: new THREE.CapsuleGeometry(0.0018, 0.1, 3, 6), p: [-0.075 * (l.glasses === 'round' ? 1 : 1), 0.008, 0.05], r: [Math.PI / 2, 0, 0] },
        { g: new THREE.CapsuleGeometry(0.0018, 0.1, 3, 6), p: [0.075, 0.008, 0.05], r: [Math.PI / 2, 0, 0] },
      ]))), frame));
      g.position.y = 0;
    }
    if (l.bindi) {
      const dot = add(head, new THREE.Mesh(shared(cachedGeo('bindi', () => new THREE.CircleGeometry(0.0052, 16))), mat({ color: '#b3122a', roughness: 0.4 })));
      dot.position.set(0, 0.046, 0.1012);
      dot.rotation.x = -0.34;
    }

    /* headwear from the look */
    wear = null;
    const headCloth = mat({ color: l.headColor, roughness: 0.85 });
    if (l.headwear === 'cap') {
      wear = add(head, shadowy(new THREE.Mesh(shared(cachedGeo('cap-look', () => merge([
        { g: new THREE.SphereGeometry(0.112, 36, 18, 0, TAU, 0, Math.PI * 0.5), p: [0, 0.042, -0.006], r: [-0.14, 0, 0], s: [1, 0.86, 1] },
        { g: ball(1, 26, 12), p: [0, 0.05, 0.106], r: [0.1, 0, 0], s: [0.076, 0.006, 0.058] },
      ]))), mat({ color: l.color2 === '#f4efe4' ? l.color : l.color2, roughness: 0.7 }))));
    } else if (l.headwear === 'beanie') {
      wear = add(head, shadowy(new THREE.Mesh(shared(cachedGeo('beanie', () => merge([
        { g: new THREE.SphereGeometry(0.119, 32, 18, 0, TAU, 0, Math.PI * 0.52), p: [0, 0.026, -0.01], r: [-0.22, 0, 0] },
        { g: new THREE.TorusGeometry(0.111, 0.015, 10, 30), p: [0, 0.042, -0.002], r: [Math.PI / 2 - 0.22, 0, 0] },
      ]))), mat({ color: l.color2 === '#f4efe4' ? l.color : l.color2, roughness: 0.95 }))));
    } else if (l.headwear === 'pagri') {
      wear = add(head, shadowy(new THREE.Mesh(shared(cachedGeo('pagri', () => {
        const rings = [];
        for (let i = 0; i < 4; i++) rings.push({ g: new THREE.TorusGeometry(0.104 - i * 0.007, 0.024, 10, 32), p: [0, 0.05 + i * 0.022, -0.012 - i * 0.004], r: [Math.PI / 2 - 0.3 + (i % 2 ? 0.26 : -0.05), (i % 2 ? 0.16 : -0.16), 0] });
        rings.push({ g: ball(1, 24, 14), p: [0, 0.112, -0.028], s: [0.092, 0.05, 0.09] });
        return merge(rings);
      })), headCloth)));
    } else if (l.headwear === 'hijab') {
      wear = add(head, shadowy(new THREE.Mesh(shared(cachedGeo('hijab', () => merge([
        { g: new THREE.SphereGeometry(0.122, 40, 26, Math.PI / 2 + 0.75, TAU - 1.5), p: [0, -0.002, -0.012], s: [1, 1.08, 1] },
        { g: new THREE.TorusGeometry(0.098, 0.022, 10, 30, Math.PI), p: [0, 0.018, 0.012], r: [-0.5, 0, 0] },
        { g: new THREE.ConeGeometry(0.125, 0.15, 30, 1, true), p: [0, -0.142, -0.012], s: [1, 1, 0.82] },
      ]))), headCloth)));
      headCloth.side = THREE.DoubleSide;
    } else if (l.headwear === 'headband') {
      wear = add(head, new THREE.Mesh(shared(cachedGeo('headband', () => new THREE.TorusGeometry(0.109, 0.01, 8, 34))), headCloth));
      wear.rotation.x = Math.PI / 2 - 0.3;
      wear.position.set(0, 0.046, -0.004);
    }
    // a special hat (earned or bought): the role hats, in a set of its own made only when first needed
    Object.values(lookHats || {}).forEach(g => { g.visible = false; });
    if (isFancyHat(l.headwear)) {
      if (!lookHats) {
        lookHats = buildAccessories();
        Object.values(lookHats).forEach(g => head.add(g));
      }
      wear = lookHats[l.headwear] || null;
    }
    if (wear) wearVisible();
  }
  let lookHats = null;
  let openShape = null;
  let activeAcc = null;
  const wearVisible = () => { if (wear) wear.visible = !activeAcc; };

  // Role headgear (crown, police cap, …)
  const acc = buildAccessories();
  Object.values(acc).forEach(g => head.add(g));

  // Folded chit held in the right hand (never shows a role)
  const heldChit = new THREE.Group();
  {
    const half = new THREE.BoxGeometry(0.06, 0.006, 0.06);
    const a = new THREE.Mesh(half, paperMaterial);
    a.position.x = -0.03;
    a.rotation.z = 0.15;
    const b = new THREE.Mesh(half, paperMaterial);
    b.position.x = 0.03;
    b.rotation.z = -0.15;
    heldChit.add(a, b);
    heldChit.position.set(0, -0.03, 0.03);
    heldChit.rotation.x = 1.2;
    heldChit.visible = false;
    heldChit.traverse(o => { if (o.isMesh) o.castShadow = true; });
    R.hand.add(heldChit);
  }

  // World-space labels live in world-3d.js: these two only hold what they should say
  let openRole = null;
  let nameText = null;

  // Emote bubble above the head (❗ ❓ 💢 😂 😭 …)
  const emoteSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, toneMapped: false, depthTest: false, depthWrite: false }));
  emoteSprite.renderOrder = 11;
  emoteSprite.visible = false;
  // drawn on top of everything, so right in front of the camera (an over-the-shoulder shot) it would
  // cover half the screen: it fades out as the camera comes close
  emoteSprite.onBeforeRender = (renderer, sc, cam) => {
    const d = cam.position.distanceTo(emoteSprite.position);
    emoteSprite.material.opacity = d < 1.1 ? 0 : d < 1.8 ? (d - 1.1) / 0.7 : 1;
  };
  scene.add(emoteSprite);
  let emoteUntil = 0, emoteStart = 0;

  /* ─── Expressions ──────────────────────────────────────── */
  // brow: [y offset, tilt] (tilt > 0 = inner ends down / angry)
  const MOODS = {
    neutral:   { brow: [0, 0],        mouth: 'smile', eye: 1 },
    happy:     { brow: [0.006, -0.1], mouth: 'smile', eye: 0.75 },
    sad:       { brow: [0.002, -0.4], mouth: 'frown', eye: 0.85 },
    angry:     { brow: [-0.004, 0.42], mouth: 'flat', eye: 0.9 },
    surprised: { brow: [0.012, -0.1], mouth: 'open',  eye: 1.25 },
    worried:   { brow: [0.006, -0.32], mouth: 'flat', eye: 1.05 },
    sly:       { brow: [0.002, 0.2],  mouth: 'smile', eye: 0.8, sly: true },
  };
  const POSE_MOOD = {
    cheer: 'happy', jump: 'happy', clap: 'happy', dance: 'happy', laugh: 'happy', show: 'happy', wave: 'happy', throw: 'happy', fling: 'happy',
    sad: 'sad', cry: 'sad', facepalm: 'sad', nervous: 'worried', deny: 'worried', surprised: 'surprised',
    point: 'angry', think: 'sly', peek: 'sly', sneaky: 'sly',
  };
  let moodOverride = null, moodUntil = 0;
  let browY = 0, browTilt = 0, eyeOpen = 1;

  /* ─── Animation state ──────────────────────────────────── */
  const cur = JSON.parse(JSON.stringify(POSES.idle));
  let pose = 'idle';
  let poseSpeed = 7;
  let sequence = [];
  let seqT = 0;
  let lookTarget = null;       // world Vector3 or null
  let yaw = 0, pitch = 0, bounce = 0;
  let blinkAt = 1 + Math.random() * 3;
  let now = 0, talkUntil = 0;
  const seed = Math.random() * TAU;
  const tmp = new THREE.Vector3();
  const local = new THREE.Vector3();

  function setPose(name, speed = 7) {
    if (!POSES[name]) return;
    pose = name;
    poseSpeed = speed;
    sequence = [];
  }

  function play(steps) {
    // steps: [[pose, seconds, speed?], ...]; last pose stays
    sequence = steps.slice();
    seqT = 0;
    const [first, , sp] = sequence[0];
    pose = first;
    poseSpeed = sp || 9;
  }

  function update(dt, time, reduced) {
    now = time;
    const talking = time < talkUntil;
    const moodName = (moodOverride && time < moodUntil) ? moodOverride : (POSE_MOOD[pose] || 'neutral');
    const md = MOODS[moodName] || MOODS.neutral;
    if (talking) {
      const o = Math.abs(Math.sin(time * 15 + seed));
      showMouth(o > 0.35 ? 'open' : md.mouth === 'open' ? 'open' : md.mouth);
      MOUTHS.open.scale.set(1, 0.5 + o * 0.62, 1);
    } else {
      showMouth(md.mouth);
      MOUTHS.open.scale.set(1, 0.9, 1);
    }
    browY = damp(browY, md.brow[0], 10, dt);
    browTilt = damp(browTilt, md.brow[1], 10, dt);
    brows.forEach(b => {
      const s = b.userData.side;
      b.position.y = 0.0335 + browY + (md.sly && s > 0 ? 0.008 : 0);
      b.rotation.z = Math.PI / 2 + s * browTilt * (md.sly && s > 0 ? -0.5 : 1);
    });
    eyeOpen = damp(eyeOpen, md.eye, 10, dt);
    if (sequence.length) {
      seqT += dt;
      if (seqT >= sequence[0][1] && sequence.length > 1) {
        sequence.shift();
        seqT = 0;
        pose = sequence[0][0];
        poseSpeed = sequence[0][2] || 9;
      }
    }
    const tgt = POSES[pose];
    const k = reduced ? 50 : poseSpeed;
    for (let s = 0; s < 2; s++) {
      cur.sh[s][0] = damp(cur.sh[s][0], tgt.sh[s][0], k, dt);
      cur.sh[s][1] = damp(cur.sh[s][1], tgt.sh[s][1], k, dt);
      cur.el[s] = damp(cur.el[s], tgt.el[s], k, dt);
    }
    cur.lean = damp(cur.lean, tgt.lean, k, dt);
    cur.head = damp(cur.head, tgt.head, k, dt);

    const m = reduced ? 0 : 1;
    let clapZ = 0, rub = 0, wave = 0, jitter = 0;
    if (pose === 'clap') clapZ = Math.sin(time * 16 + seed) * 0.18 * m;
    if (pose === 'nervous') { rub = Math.sin(time * 9 + seed) * 0.12 * m; jitter = Math.sin(time * 13 + seed) * 0.05 * m; }
    if (pose === 'cheer' || pose === 'jump') wave = Math.sin(time * 9 + seed) * 0.25 * m;
    if (pose === 'dance') wave = Math.sin(time * 7 + seed) * 0.5 * m;
    let waveR = 0, roll = 0, shake = 0;
    if (pose === 'wave') waveR = Math.sin(time * 10 + seed) * 0.4 * m;
    if (pose === 'laugh') roll = Math.sin(time * 20 + seed) * 0.06 * m;
    if (pose === 'cry') roll = Math.sin(time * 14 + seed) * 0.035 * m;
    if (pose === 'sneaky') roll = 0.22;
    if (pose === 'shrug') roll = Math.sin(time * 1.5) * 0.04 * m;
    if (pose === 'deny') shake = Math.sin(time * 12 + seed) * 0.4 * m;
    if (pose === 'dance') roll = Math.sin(time * 7 + seed) * 0.16 * m;
    const hop = pose === 'jump' ? 0.12 : pose === 'cheer' ? 0.05 : pose === 'dance' ? 0.05 : pose === 'laugh' ? 0.015 : 0;
    const hopSpeed = pose === 'laugh' ? 20 : pose === 'jump' ? 7 : pose === 'dance' ? 7 : 8;
    bounce = damp(bounce, hop ? Math.abs(Math.sin(time * hopSpeed + seed)) * hop * m : 0, 12, dt);

    L.shoulder.rotation.set(cur.sh[0][0] + rub, 0, cur.sh[0][1] - clapZ + wave);
    R.shoulder.rotation.set(cur.sh[1][0] - rub, 0, cur.sh[1][1] + clapZ - wave + waveR);
    L.elbow.rotation.x = cur.el[0];
    R.elbow.rotation.x = cur.el[1];

    const breathe = Math.sin(time * 2.1 + seed) * 0.012 * m;
    spine.rotation.x = cur.lean + breathe;
    spine.rotation.z = damp(spine.rotation.z, roll, 10, dt);
    root.position.y = bounce;
    if (standing) {
      // walking: legs swing from the hips, each arm with the opposite leg, a little bob in every step
      walk = damp(walk, walkTarget, 8, dt);
      if (walk > 0.02) stride += dt * (5 + 5 * walk);
      const sw = Math.sin(stride) * 0.55 * walk * (reduced ? 0.4 : 1);
      hips[0].rotation.x = sw;
      hips[1].rotation.x = -sw;
      L.shoulder.rotation.x -= sw * 0.8;
      R.shoulder.rotation.x += sw * 0.8;
      const sway = pose === 'dance' ? Math.sin(time * 7 + seed) * 0.12 * m : 0;
      hips[0].rotation.z = sway; hips[1].rotation.z = sway;
      root.position.y = bounce + Math.abs(Math.sin(stride)) * 0.022 * walk;
    }
    if (torso) torso.scale.set(1 + breathe * 0.6, 1, baseZ + breathe * 0.6);

    // Head look-at (yaw/pitch relative to the body)
    let ty = Math.sin(time * 0.4 + seed) * 0.15 * m, tp = 0;
    if (lookTarget) {
      local.copy(lookTarget);
      root.worldToLocal(local);
      local.y -= 0.6;
      ty = clamp(Math.atan2(local.x, local.z), -1.2, 1.2);
      tp = clamp(-Math.atan2(local.y, Math.hypot(local.x, local.z)), -0.5, 0.6);
    }
    yaw = damp(yaw, ty + jitter, reduced ? 50 : 4, dt);
    pitch = damp(pitch, tp, reduced ? 50 : 4, dt);
    const nod = talking ? Math.sin(time * 9 + seed) * 0.045 * m : 0;
    const tilt = pose === 'shrug' ? 0.18 : pose === 'think' ? 0.12 : 0;
    headPivot.rotation.set(cur.head * 0.6 + pitch + nod, yaw + shake, Math.sin(time * 0.7 + seed) * 0.04 * m + tilt);
    spine.rotation.y = pose === 'point' ? yaw * 0.6 : yaw * 0.15;

    // The eyes get there before the head does
    const gazeX = clamp((ty - yaw) * 0.012, -0.0048, 0.0048);
    const gazeY = clamp((pitch - tp) * 0.01, -0.0032, 0.0032);
    irises.forEach(i => { i.position.x = gazeX; i.position.y = gazeY; });

    // Blink (and squint / widen with the mood)
    let lid = eyeOpen;
    if (time > blinkAt) {
      if (time - blinkAt < 0.12) lid = 0.12;
      else blinkAt = time + 2 + Math.random() * 3.5;
    }
    if (pose === 'cry' || pose === 'laugh') lid = Math.min(lid, 0.3);
    eyes.forEach(e => (e.scale.y = lid));

    // Emote pops in, bobs, then disappears
    if (emoteSprite.visible) {
      if (time > emoteUntil) emoteSprite.visible = false;
      else {
        head.getWorldPosition(tmp);
        const age = time - emoteStart;
        const pop = Math.min(1, age * 6);
        const s = 0.2 * (pop < 1 ? 0.6 + pop * 0.5 : 1);
        emoteSprite.scale.set(s, s, 1);
        emoteSprite.position.set(tmp.x + 0.14, tmp.y + 0.2 + Math.sin(age * 5) * 0.015 + bounce, tmp.z);
      }
    }
  }


  dress(look);

  return {
    root,
    setPose,
    play,
    update,
    get pose() { return pose; },
    setLook(l) { dress(l); },
    /** A standing character's walking speed, 0 (still) to 1 (full stride). */
    setWalk(v) { walkTarget = clamp(v || 0, 0, 1); },
    talk(sec = 1.4) { talkUntil = now + sec; },
    mood(name, sec = 2.5) { moodOverride = name; moodUntil = now + sec; },
    emote(symbol, sec = 2) {
      if (!symbol) { emoteSprite.visible = false; return; }
      emoteSprite.material.map = emojiTexture(symbol);
      emoteSprite.material.needsUpdate = true;
      emoteSprite.visible = true;
      emoteStart = now;
      emoteUntil = now + sec;
    },
    lookAt(v) { lookTarget = v ? v.clone() : null; },
    headWorld(out = new THREE.Vector3()) { return head.getWorldPosition(out); },
    handWorld(out = new THREE.Vector3()) { return R.hand.getWorldPosition(out); },
    reachPoint(out = new THREE.Vector3()) {
      // where the right hand ends up in the "reach" pose (approx, in world)
      out.set(-0.12, 0.2, 0.42);
      return root.localToWorld(out);
    },
    holdChit(on) { heldChit.visible = !!on; },
    showRole(role) {
      openRole = role || null;
      if (role) heldChit.visible = false;
    },
    get shownRole() { return openRole; },
    setAccessory(name) {
      activeAcc = name || null;
      Object.entries(acc).forEach(([k, g]) => (g.visible = k === name));
      wearVisible();
    },
    setName(text) { nameText = text || null; },
    get name() { return nameText; },
  };
}
