/**
 * The boards, in 3D, on the mat in the room. Each draw() says where everything should be now; pieces
 * of the same kind are matched up with where they were and glide, hop or flip to the new place, so
 * no game has to think about animation. All art here is made in code: no image files to download.
 * A piece the player may tap carries its move's number in userData.pick.
 */
import * as THREE from '../vendor/three.chitplay.min.js';
import { audioManager } from '../audio/audio-manager.js';
import { COLS as FOUR_COLS, ROWS as FOUR_ROWS } from './games/four-in-a-row.js?v=20261114-1515';
import { destination as ludoDestination, COLORS as LUDO_COLORS, HOME as LUDO_HOME, SAFE as LUDO_SAFE, STARTS as LUDO_STARTS, quarter as ludoQuarter } from './games/ludo.js?v=20261114-1515';
import { LADDERS, SNAKES } from './games/snakes-and-ladders.js?v=20261114-1515';
import { N as DOTS_N } from './games/dots-and-boxes.js?v=20261114-1515';
import { BASE_Y as CARROM_BASE, R as COIN_R, STRIKER_R, POCKETS, POCKET_R } from './games/carrom.js?v=20261114-1515';
import { isRed, rankOf, suitOf, SUIT_ICON } from './cards.js?v=20261114-1515';
import { selectedGameCosmetic } from './game-cosmetics.js?v=20261114-1515';

export const PLAYER_COLORS = ['#d32f2f', '#2e7dd1', '#f2b705', '#2e9e4f'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;
const CHESS_BOARD_STYLES = {
  jade: { dark: '#28614f', light: '#d8e8ce', frame: '#174538' },
  ocean: { dark: '#245b78', light: '#d8eaf0', frame: '#153c55' },
};
const CHESS_PIECE_STYLES = {
  classic: { white: '#fffaf0', black: '#17110d', whiteDetail: '#b9a98a', blackDetail: '#4a3a2c', felt: '#1f5a32' },
  royal: { white: '#f2d18a', black: '#35204b', whiteDetail: '#fff0c2', blackDetail: '#df9fff', felt: '#5a321d' },
  neon: { white: '#b9fff4', black: '#351f5e', whiteDetail: '#2ed9cd', blackDetail: '#ff79de', felt: '#103d43' },
};
const LUDO_BOARD_STYLES = {
  classic: { colors: LUDO_COLORS, tokens: ['#9c1212', '#0e5c2c', '#b57a00', '#124b94'], base: '#fbf6e9', border: '#6d5a40', safe: '#b08d3c', frame: '#6b4a2b' },
  candy: { colors: ['#e83973', '#1da878', '#f2a900', '#287ed5'], tokens: ['#a91d4d', '#08764f', '#a76500', '#14519b'], base: '#fff9f3', border: '#57334f', safe: '#7d3b84', frame: '#513252' },
  sunset: { colors: ['#d13a4a', '#16817b', '#ef8b2c', '#6256b5'], tokens: ['#912331', '#0c5d58', '#a95b12', '#403688'], base: '#fff4e8', border: '#62402d', safe: '#a05f32', frame: '#54351f' },
};

/* ─── materials and shapes, shared to stay light ─── */
const mats = new Map();
const mat = (color, roughness = 0.55, metalness = 0.05) => {
  const key = `${color}|${roughness}|${metalness}`;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.5 }));
  return mats.get(key);
};
const geos = new Map();
const geo = (key, make) => { if (!geos.has(key)) geos.set(key, make()); return geos.get(key); };
const cyl = (rt, rb, h, seg = 24) => geo(`c${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
const box = (w, h, d) => geo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
const ball = (r) => geo(`s${r}`, () => new THREE.SphereGeometry(r, 16, 12));
function mesh(g, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  return o;
}
function group(...parts) { const g = new THREE.Group(); g.add(...parts); return g; }
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
/** A flat square board: a block of wood with a picture on top. */
function plate(size, depth, picture, { color = '#5a3a20', thick = 0.05, roughness = 0.75, res = 1024 } = {}) {
  const w = res, h = Math.round(res * (depth / size));
  const top = new THREE.MeshStandardMaterial({ map: canvasTexture(w, h, picture), roughness, envMapIntensity: roughness < 0.5 ? 0.6 : 0.3 });
  const side = mat(color, 0.6);
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, thick, depth), [side, side, top, side, side, side]);
  m.position.y = thick / 2;
  m.receiveShadow = true;
  m.castShadow = true;
  return m;
}
const TOP_Y = 0.05;   // the top of a plate

/* ─── pieces ─── */
/** A flat round piece, standing on y = 0. */
const disc = (color, r = 0.06, h = 0.028) => group(mesh(cyl(r, r, h), mat(color, 0.35), 0, h / 2, 0));
function pawnShape(color, s = 1) {
  const m = mat(color, 0.32);
  return group(mesh(cyl(0.042 * s, 0.056 * s, 0.03 * s), m, 0, 0.015 * s, 0), mesh(cyl(0.02 * s, 0.038 * s, 0.075 * s), m, 0, 0.066 * s, 0), mesh(ball(0.032 * s), m, 0, 0.122 * s, 0));
}
/** A Ludo token with a glossy finish and a white ring round its base. */
function glossyPawn(color, s = 1, finish = 'classic') {
  const surface = finish === 'metallic' ? { roughness: 0.2, metalness: 0.62, ring: '#ffe28a' }
    : finish === 'matte' ? { roughness: 0.7, metalness: 0.02, ring: '#fffaf0' }
      : { roughness: 0.18, metalness: 0.15, ring: '#fbf6e9' };
  const m = new THREE.MeshStandardMaterial({ color, roughness: surface.roughness, metalness: surface.metalness });
  const ringMat = mat(surface.ring, 0.4);
  return group(
    mesh(cyl(0.042 * s, 0.058 * s, 0.03 * s), m, 0, 0.015 * s, 0),
    mesh(cyl(0.059 * s, 0.059 * s, 0.006 * s), ringMat, 0, 0.004 * s, 0),
    mesh(cyl(0.02 * s, 0.038 * s, 0.075 * s), m, 0, 0.066 * s, 0),
    mesh(ball(0.034 * s), m, 0, 0.124 * s, 0),
  );
}
/**
 * Chess pieces in the classic tournament shapes, so each one is known at a glance, from the side or
 * from above: the king is tallest with a cross on top, the queen wears a crown of beads, the bishop
 * a mitre with its slit, the knight is a horse's head, the rook a castle tower and the pawn a small
 * ball. Turned on a lathe like real wooden pieces, with green felt underneath.
 */
const lathe = (key, pts) => geo(`lathe:${key}`, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 32));
/** The turned foot every piece stands on: a wide base, a bead, and the start of the stem. */
const FOOT = [[0, 0], [0.058, 0], [0.058, 0.007], [0.054, 0.012], [0.056, 0.017], [0.05, 0.022], [0.04, 0.026], [0.042, 0.03], [0.034, 0.033]];
const PROFILES = {
  P: [...FOOT, [0.026, 0.045], [0.019, 0.066], [0.03, 0.07], [0.031, 0.074], [0.02, 0.077], [0.016, 0.08]],
  R: [...FOOT, [0.031, 0.05], [0.029, 0.09], [0.04, 0.096], [0.042, 0.106], [0.04, 0.124], [0, 0.124]],
  N: [...FOOT, [0.03, 0.046], [0.032, 0.054], [0.04, 0.058], [0, 0.058]],
  B: [...FOOT, [0.025, 0.06], [0.018, 0.098], [0.031, 0.102], [0.032, 0.107], [0.02, 0.11], [0.018, 0.112]],
  Q: [...FOOT, [0.026, 0.06], [0.017, 0.112], [0.032, 0.118], [0.033, 0.124], [0.022, 0.128], [0.026, 0.134], [0.038, 0.152], [0.034, 0.156], [0, 0.158]],
  K: [...FOOT, [0.027, 0.062], [0.018, 0.122], [0.034, 0.128], [0.035, 0.134], [0.023, 0.138], [0.027, 0.144], [0.036, 0.162], [0.024, 0.168], [0, 0.17]],
};
/** 2D view: the camera looks straight down, so every board piece must read from above. */
export const flat2d = () => document.documentElement.dataset.view === '2d';
/** A carrom coin: turned wood with the grooved rings on top (the striker is plain and glossier). */
const coinFaces = new Map();
function carromCoin(color, r, striker = false) {
  const key = `${color}|${striker}`;
  if (!coinFaces.has(key)) {
    const dark = color === '#2a211c';
    coinFaces.set(key, new THREE.MeshStandardMaterial({
      roughness: striker ? 0.22 : 0.35, envMapIntensity: 0.6,
      map: canvasTexture(128, 128, (g, w) => {
        const c = w / 2;
        const body = g.createRadialGradient(c - 18, c - 22, 6, c, c, c);
        body.addColorStop(0, dark ? '#4a3b33' : '#ffffff'); body.addColorStop(1, color);
        g.fillStyle = body; g.fillRect(0, 0, w, w);
        // a dark edge, so pale coins still stand out on the pale board when seen from above
        g.strokeStyle = dark ? 'rgba(0,0,0,.6)' : 'rgba(95,60,25,.75)'; g.lineWidth = 7; g.beginPath(); g.arc(c, c, c - 4, 0, TAU); g.stroke();
        if (!striker) {
          g.strokeStyle = dark ? 'rgba(0,0,0,.55)' : 'rgba(110,70,30,.5)'; g.lineWidth = 3;
          [0.82, 0.55, 0.28].forEach((k) => { g.beginPath(); g.arc(c, c, c * k, 0, TAU); g.stroke(); });
        } else {
          g.strokeStyle = 'rgba(160,120,60,.35)'; g.lineWidth = 4; g.beginPath(); g.arc(c, c, c * 0.8, 0, TAU); g.stroke();
        }
      }),
    }));
  }
  const h = striker ? 0.024 : 0.022;
  const side = mat(color, 0.4);
  const coin = new THREE.Mesh(cyl(r, r, h), [side, coinFaces.get(key), side]);
  coin.position.y = h / 2;
  coin.castShadow = true;
  return group(coin);
}
/** A chess piece seen from above in 2D: a flat token with the piece's symbol on it. */
function flatChessToken(kind, white, style = 'classic') {
  const palette = CHESS_PIECE_STYLES[style] || CHESS_PIECE_STYLES.classic;
  const fill = white ? palette.white : palette.black, ink = white ? palette.black : palette.white;
  const glyph = `${{ K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' }[kind] || '♟'}︎`;
  const r = (SIZE / 8) * 0.43;
  const face = canvasTexture(256, 256, (g, w, h) => {
    const c = w / 2, R = w / 2 - 6;
    // a turned wooden token: light from the top left, a raised rim, a dished middle
    const body = g.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.1, c, c, R);
    body.addColorStop(0, white ? '#ffffff' : '#5a4a40');
    body.addColorStop(0.55, fill);
    body.addColorStop(1, white ? '#c9bba0' : '#0a0705');
    g.fillStyle = body; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill();
    g.lineWidth = 10; g.strokeStyle = white ? palette.whiteDetail : palette.blackDetail; g.beginPath(); g.arc(c, c, R - 5, 0, TAU); g.stroke();
    g.lineWidth = 3; g.strokeStyle = white ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(c, c, R - 13, Math.PI * 0.95, Math.PI * 1.6); g.stroke();
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = white ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.6)'; g.shadowOffsetY = 3; g.shadowBlur = 4;
    g.scale(2, 2); w /= 2; h /= 2;
    g.font = `${kind === 'P' ? 84 : 100}px "Segoe UI Symbol", "Noto Sans Symbols2", "DejaVu Sans", serif`;
    g.lineWidth = 3; g.strokeStyle = ink; g.lineJoin = 'round';
    // every font puts these symbols a little differently in its line, so measure the drawn shape and
    // put its middle on the middle of the token: the piece sits dead centre in its square
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const box = g.measureText(glyph);
    const left = box.actualBoundingBoxLeft || 0, right = box.actualBoundingBoxRight || box.width;
    const up = box.actualBoundingBoxAscent || 70, down = box.actualBoundingBoxDescent || 0;
    const gx = w / 2 - (right - left) / 2, gy = h / 2 + (up - down) / 2;
    g.strokeText(glyph, gx, gy);
    g.fillText(glyph, gx, gy);
  });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: face, transparent: true }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.022;
  return group(mesh(cyl(r, r, 0.02, 32), mat(fill, 0.5), 0, 0.01, 0), top);
}
// the mitre of the bishop: an egg shape on top of the collar
const MITRE =[[0, 0], [0.022, 0.004], [0.029, 0.018], [0.027, 0.032], [0.018, 0.045], [0.006, 0.052], [0, 0.053]];
function chessPiece(kind, color, style = 'classic') {
  const white = color !== '#17110d';
  const palette = CHESS_PIECE_STYLES[style] || CHESS_PIECE_STYLES.classic;
  const m = mat(white ? palette.white : palette.black, white ? 0.28 : 0.24, 0.04);
  const detail = mat(white ? palette.whiteDetail : palette.blackDetail, 0.4);
  const felt = mat(palette.felt, 0.95);
  const body = mesh(lathe(kind, PROFILES[kind]), m);
  const parts = [body, mesh(cyl(0.057, 0.057, 0.003, 28), felt, 0, -0.0015, 0)];
  if (kind === 'P') parts.push(mesh(ball(0.026), m, 0, 0.1, 0));
  if (kind === 'R') {
    // the castle top: a ring of battlements with gaps between, round a hollow
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      const b = mesh(box(0.019, 0.018, 0.011), m, Math.cos(a) * 0.034, 0.132, Math.sin(a) * 0.034);
      b.rotation.y = Math.PI / 2 - a;      // along the rim, like a wall
      parts.push(b);
    }
    parts.push(mesh(cyl(0.026, 0.026, 0.002, 20), detail, 0, 0.1245, 0));
  }
  if (kind === 'B') {
    const mitre = mesh(lathe('mitre', MITRE), m, 0, 0.11, 0);
    // the slit cut across the mitre, and the bead on top
    const slit = mesh(box(0.004, 0.034, 0.05), detail, 0, 0.14, 0);
    slit.rotation.z = 0.55;
    parts.push(mitre, slit, mesh(ball(0.009), m, 0, 0.168, 0));
  }
  if (kind === 'Q') {
    // the queen must never pass for the rook, from the side or from above: a slim waist, a gold
    // collar, a crown of sharp points leaning outwards (the rook's top is square and flat), and a
    // royal orb standing above the points
    const gold = mat('#d8aa3a', 0.3, 0.55);
    const collar = mesh(geo('qcollar', () => new THREE.TorusGeometry(0.0215, 0.0042, 8, 28)), gold, 0, 0.118, 0);
    collar.rotation.x = Math.PI / 2;
    const rim = mesh(geo('qrim', () => new THREE.TorusGeometry(0.036, 0.0036, 8, 32)), gold, 0, 0.152, 0);
    rim.rotation.x = Math.PI / 2;
    parts.push(collar, rim);
    const point = geo('qpoint', () => new THREE.ConeGeometry(0.0072, 0.03, 10));
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      const p = mesh(point, m, Math.cos(a) * 0.035, 0.168, Math.sin(a) * 0.035);
      // each point leans out from the middle, like the tines of a crown
      p.rotation.set(Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32);
      parts.push(p, mesh(ball(0.0048), gold, Math.cos(a) * 0.04, 0.184, Math.sin(a) * 0.04));
    }
    parts.push(mesh(ball(0.017), m, 0, 0.174, 0), mesh(ball(0.0085), gold, 0, 0.196, 0));
  }
  if (kind === 'K') {
    // a small dome, then the cross: the tallest piece on the board
    parts.push(mesh(ball(0.018), m, 0, 0.172, 0), mesh(box(0.01, 0.042, 0.01), m, 0, 0.205, 0), mesh(box(0.032, 0.01, 0.01), m, 0, 0.212, 0));
  }
  if (kind === 'N') {
    // the horse's head, looking towards the other side of the board (-z)
    const head = new THREE.Group();
    // an arched neck, the head bowed forward, a long nose: the outline everyone knows
    const neck = mesh(box(0.032, 0.066, 0.046), m, 0, 0.03, 0.004);
    neck.rotation.x = -0.32;
    const chest = mesh(box(0.034, 0.03, 0.03), m, 0, 0.012, -0.016);
    const skull = mesh(box(0.03, 0.034, 0.046), m, 0, 0.07, -0.016);
    skull.rotation.x = 0.25;
    const muzzle = mesh(box(0.024, 0.026, 0.05), m, 0, 0.05, -0.05);
    muzzle.rotation.x = 0.75;
    const mane = mesh(box(0.012, 0.08, 0.018), detail, 0, 0.046, 0.028);
    mane.rotation.x = -0.3;
    const ear = (x) => { const e = mesh(geo('ear', () => new THREE.ConeGeometry(0.008, 0.024, 8)), m, x, 0.097, 0.002); e.rotation.x = -0.25; return e; };
    const eye = (x) => mesh(ball(0.0048), detail, x, 0.074, -0.026);
    const nostril = (x) => mesh(ball(0.0035), detail, x, 0.03, -0.072);
    head.add(neck, chest, skull, muzzle, mane, ear(-0.009), ear(0.009), eye(-0.0158), eye(0.0158), nostril(-0.007), nostril(0.007));
    head.position.y = 0.056;
    head.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    parts.push(head);
  }
  return group(...parts);
}
/** A die: 1 on top, 6 below, 2 and 5 front and back, 3 and 4 right and left. */
const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
const dieFaces = new Map();
function dieFace(v, ink = '#2a1a10', paper = '#fbf6e9') {
  const key = v + ink + paper;
  if (!dieFaces.has(key)) {
    dieFaces.set(key, new THREE.MeshStandardMaterial({ roughness: 0.35, envMapIntensity: 0.4, map: canvasTexture(128, 128, (g) => {
      g.fillStyle = paper; g.fillRect(0, 0, 128, 128);
      g.fillStyle = ink;
      PIPS[v].forEach(([x, y]) => { g.beginPath(); g.arc(32 + x * 32, 32 + y * 32, 12, 0, TAU); g.fill(); });
    }) }));
  }
  return dieFaces.get(key);
}
const dieMesh = (size = 0.13) => {
  const m = new THREE.Mesh(box(size, size, size), [3, 4, 1, 6, 2, 5].map(v => dieFace(v)));
  m.castShadow = true;
  return m;
};
export const DIE_TURN = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [-Math.PI / 2, 0, 0], 5: [Math.PI / 2, 0, 0], 3: [0, 0, Math.PI / 2], 4: [0, 0, -Math.PI / 2] };

const cardFaces = new Map();
function cardFace(code) {
  if (!cardFaces.has(code)) {
    const paint = code === 'back'
      ? (g, w, h) => { g.fillStyle = '#7a1f2b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f0c869'; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24); for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(16 + i * 24, 18); g.lineTo(16, 18 + i * 34); g.stroke(); } }
      : (g, w, h) => {
        g.fillStyle = '#fbf8ef'; g.fillRect(0, 0, w, h);
        g.fillStyle = isRed(code) ? '#c62828' : '#17140f';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '800 54px system-ui, sans-serif';
        g.fillText(rankOf(code), w * 0.27, 44);
        g.font = '88px system-ui, "Segoe UI Symbol", sans-serif';
        g.fillText(SUIT_ICON[suitOf(code)], w / 2, h * 0.58);
      };
    cardFaces.set(code, new THREE.MeshStandardMaterial({ map: canvasTexture(192, 270, paint), roughness: 0.55, envMapIntensity: 0.3 }));
  }
  return cardFaces.get(code);
}
function cardMesh(code, w = 0.2) {
  const edge = mat('#ded7c6', 0.7), d = w * 1.4;
  const m = new THREE.Mesh(box(w, 0.006, d), [edge, edge, cardFace(code), cardFace('back'), edge, edge]);
  m.castShadow = true;
  return m;
}
function textSprite(text, { size = 0.09, color = '#fff6dc', bg = 'rgba(30,16,8,.72)' } = {}) {
  const t = canvasTexture(128, 64, (g, w, h) => {
    if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(h / 2, h / 2, h / 2, Math.PI / 2, -Math.PI / 2); g.arc(w - h / 2, h / 2, h / 2, -Math.PI / 2, Math.PI / 2); g.fill(); }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 40px system-ui, sans-serif';
    g.fillText(String(text), w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(size * 2, size, 1);
  s.renderOrder = 5;
  s.userData.ownTexture = true;
  return s;
}

/** Free a label's or a chit's one-off texture; shared materials stay. */
function disposeOwn(obj) {
  obj.traverse((o) => {
    if (!o.userData.ownTexture) return;
    [].concat(o.material).forEach((m) => { m.map?.dispose(); m.dispose(); });
    if (o.isMesh) o.geometry.dispose();
  });
}

const DIE_SIZE = 0.115;
export const STEP_SECONDS = 0.13;   // a Ludo token, one square

/*
 * A soft dark patch right under each piece, where the light can't reach. With it a piece sits on the
 * board instead of floating over it, and when it hops the patch shrinks and fades, so you see it in the air.
 */
let blobTexture = null;
/** How far a piece reaches sideways from its middle (our slim three.js has no Box3 to ask). */
function reachOf(obj) {
  let r = 0;
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    o.geometry.boundingBox || o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox, sx = Math.abs(o.scale.x), sz = Math.abs(o.scale.z);
    const dx = o === obj ? 0 : Math.abs(o.position.x), dz = o === obj ? 0 : Math.abs(o.position.z);
    r = Math.max(r, dx + Math.max(-b.min.x, b.max.x) * sx, dz + Math.max(-b.min.z, b.max.z) * sz);
  });
  return r;
}
function contactShadow(obj) {
  const r = reachOf(obj);
  if (!(r > 0.02 && r < 0.3)) return null;   // big flat things (a chit, a tray) need none
  blobTexture = blobTexture || canvasTexture(64, 64, (g, w) => {
    const grad = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(0.5, 'rgba(0,0,0,.6)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, w);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.7, r * 2.7), new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false, opacity: 0.5 }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

/* ─── the stage: reconciles what should be with what is, and animates the difference ─── */
class Stage {
  constructor(root) {
    this.root = root;
    this.world = new THREE.Group();
    root.add(this.world);
    this.live = [];
    this.want = [];
    this.picks = [];
    this.marks = [];
    this.playing = null;
    this.fx = [];
    this.glows = [];   // rings that pulse while they are switched on (whose turn it is)
  }
  add(obj) { this.world.add(obj); return obj; }
  /** Sparks flying out from a point, in a piece's colour (a capture, a piece reaching home). */
  burst(x, y, z, color = '#ffd23f', n = 14, speed = 0.55) {
    if (reduced) return;
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.012), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false }));
      const a = (k / n) * TAU + Math.random() * 0.4, v = speed * (0.5 + Math.random() * 0.7);
      m.position.set(x, y, z);
      this.world.add(m);
      this.fx.push({ m, vx: Math.cos(a) * v, vy: 0.5 + Math.random() * 0.6, vz: Math.sin(a) * v, life: 0.7, max: 0.7 });
    }
  }
  /** A glowing dot left behind on the board that fades away (a carrom striker's trail). */
  trace(x, z, color = '#fff3b0') {
    if (reduced) return;
    const m = new THREE.Mesh(cyl(0.022, 0.022, 0.003, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false }));
    m.position.set(x, TOP_Y + 0.006, z);
    this.world.add(m);
    this.fx.push({ m, still: true, life: 0.35, max: 0.35 });
  }
  /** A line on the board from one point to another, gone at the next redraw (the last chess move). */
  line(x1, z1, x2, z2, color = '#ffd23f', w = 0.022) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, depthWrite: false });
    const bar = new THREE.Mesh(box(Math.max(0.001, len - 0.05), 0.003, w), mat);
    bar.position.x = (len - 0.05) / 2;
    const head = new THREE.Mesh(new THREE.ConeGeometry(w * 1.6, 0.06, 3), mat);
    head.rotation.z = -Math.PI / 2; head.position.x = len - 0.03; head.scale.z = 0.15;
    g.add(bar, head);
    g.position.set(x1, TOP_Y + 0.007, z1);
    g.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    this.world.add(g);
    this.marks.push(g);
    return g;
  }
  /** A soft ring spreading on the board where a piece has just landed. */
  ripple(x, z, color = '#ffffff') {
    if (reduced) return;
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.005, 6, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, depthWrite: false }));
    m.rotation.x = Math.PI / 2;
    m.position.set(x, TOP_Y + 0.004, z);
    this.world.add(m);
    this.fx.push({ m, ring: true, life: 0.45, max: 0.45 });
  }
  begin() { this.want = []; this.marks.forEach((o) => { this.world.remove(o); }); this.marks = []; this.picks = []; }
  /** Something should be at x,y,z. `kind` says which older piece may become this one. */
  put(kind, make, x, y, z, o = {}) { this.want.push({ kind, make, x, y, z, ...o }); }
  /** A glowing spot on the board that can be tapped. */
  mark(x, z, pick, { r = 0.05, y = TOP_Y + 0.004, color = '#ffe08a', solid = true, pulse = false } = {}) {
    const glow = new THREE.Mesh(cyl(r, r, 0.006, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: solid ? 0.62 : 0 }));
    glow.position.set(x, y, z);
    glow.userData.pick = pick;
    glow.userData.pulse = pulse;
    this.world.add(glow);
    this.marks.push(glow);
    this.picks.push(glow);
    return glow;
  }
  /** An invisible area that can be tapped. */
  area(x, z, w, d, pick, { y = TOP_Y + 0.01, show = false, color = '#ffe08a' } = {}) {
    const a = new THREE.Mesh(box(w, 0.004, d), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: show ? 0.4 : 0, depthWrite: false }));
    a.position.set(x, y, z);
    this.world.add(a);
    this.marks.push(a);
    if (pick != null) { a.userData.pick = pick; this.picks.push(a); }
    return a;
  }
  end() {
    const old = this.live.slice();
    const next = [];
    const claim = (spec, test) => {
      let bestI = -1, bestD = Infinity;
      old.forEach((p, i) => {
        if (!p || p.dying != null || p.kind !== spec.kind || !test(p)) return;
        const d = Math.hypot(p.to[0] - spec.x, p.to[2] - spec.z);
        if (d < bestD) { bestD = d; bestI = i; }
      });
      if (bestI < 0) return null;
      const p = old[bestI];
      old[bestI] = null;
      return p;
    };
    const unmatched = [];
    // first whatever hasn't moved, so a jump doesn't shuffle every piece on the board
    for (const spec of this.want) {
      const p = claim(spec, q => Math.hypot(q.to[0] - spec.x, q.to[2] - spec.z) < 1e-3);
      if (p) next.push(this.#update(p, spec)); else unmatched.push(spec);
    }
    for (const spec of unmatched) {
      const p = claim(spec, () => true);
      if (p) next.push(this.#update(p, spec));
      else next.push(this.#create(spec));
    }
    old.forEach((p) => {
      if (!p) return;
      if (p.dying == null) this.burst(p.obj.position.x, p.obj.position.y + 0.04, p.obj.position.z, colorOf(p.obj), 10, 0.4);
      p.dying = p.dying ?? 0; p.spec = null; next.push(p);
    });
    this.live = next;
    next.forEach((p) => { if (p.spec?.pick != null) { p.obj.userData.pick = p.spec.pick; this.picks.push(p.obj); } else delete p.obj.userData.pick; });
  }
  #create(spec) {
    const obj = spec.make();
    const shadow = contactShadow(obj);
    if (shadow) this.world.add(shadow);
    obj.position.set(spec.x, spec.y + (reduced || spec.noDrop ? 0 : 0.5), spec.z);
    if (spec.from && !reduced) obj.position.set(spec.from[0], spec.y + 0.12, spec.from[1]);
    if (spec.rot) obj.rotation.set(...spec.rot);
    this.world.add(obj);
    spec.update?.(obj);
    return { shadow, kind: spec.kind, obj, spec, to: [spec.x, spec.y, spec.z], from: obj.position.toArray(), t: reduced ? 1 : 0, dur: spec.from ? 0.42 : 0.32, hop: 0, spin: spec.spin, rotFrom: (spec.rot || [0, 0, 0]).slice(), rotTo: (spec.rot || [0, 0, 0]).slice() };
  }
  #update(p, spec) {
    const moved = Math.hypot(p.to[0] - spec.x, p.to[2] - spec.z, p.to[1] - spec.y) > 1e-3;
    const rot = spec.rot || [0, 0, 0];
    const turned = rot.some((v, i) => Math.abs(v - p.rotTo[i]) > 1e-3);
    const spun = spec.spin !== undefined && spec.spin !== p.spin;
    spec.update?.(p.obj);
    if (moved || turned || spun) {
      const dist = Math.hypot(p.to[0] - spec.x, p.to[2] - spec.z);
      p.from = p.obj.position.toArray();
      p.to = [spec.x, spec.y, spec.z];
      p.t = reduced ? 1 : 0;
      p.dur = spun ? 0.6 : Math.min(0.7, 0.26 + dist * 0.5);
      p.hop = spun ? 0.26 : moved ? (spec.hop ?? Math.min(0.2, 0.05 + dist * 0.15)) : (turned ? 0.1 : 0);
      if (moved && p.hop >= 0.5) this.burst(p.from[0], p.from[1] + 0.05, p.from[2], colorOf(p.obj), 14, 0.5);
      p.landing = moved && !spun;
      p.rotFrom = [p.obj.rotation.x, p.obj.rotation.y, p.obj.rotation.z];
      p.rotTo = rot.slice();
      if (spec.route?.length > 1 && !reduced) { p.stepAt = null; p.route = spec.route; p.routeFrom = [p.obj.position.x, p.obj.position.z]; p.routeT = 0; p.routeY = spec.y; p.t = 1; }
      if (spun) {
        p.rotFrom = p.rotFrom.map(v => v - (Math.floor(Math.random() * 2) + 2) * TAU);
        p.spin = spec.spin;
      }
    }
    p.spec = spec;
    return p;
  }
  tick(dt) {
    let dead = false;
    this.clock = (this.clock || 0) + dt;
    if (!reduced) this.marks.forEach((m) => { if (m.userData.pulse) m.material.opacity = 0.5 + 0.4 * Math.sin(this.clock * 5); });
    this.glows.forEach((r) => { r.material.opacity = r.userData.on ? (reduced ? 0.7 : 0.55 + Math.sin(this.clock * 4) * 0.35) : 0; });
    for (const p of this.live) {
      if (p.route && p.dying == null) {
        p.routeT += dt / STEP_SECONDS;
        const at = Math.floor(p.routeT);
        if (at >= p.route.length) { const [x, z] = p.route[p.route.length - 1]; p.obj.position.set(x, p.routeY, z); p.route = null; if (p.landing) { p.landing = false; this.ripple(x, z); audioManager.play('piece'); } continue; }
        if (at !== p.stepAt) { if (p.stepAt != null) audioManager.play('step'); p.stepAt = at; }
        const [fx, fz] = at ? p.route[at - 1] : p.routeFrom;
        const [tx, tz] = p.route[at];
        const k = p.routeT - at;
        p.obj.position.set(fx + (tx - fx) * k, p.routeY + 0.28 * k * (1 - k), fz + (tz - fz) * k);
        continue;
      }
      if (p.dying != null) {
        p.dying += dt;
        const k = Math.max(0, 1 - p.dying / 0.22);
        p.size = p.size || p.obj.scale.clone();
        p.obj.scale.set(p.size.x * k, p.size.y * k, p.size.z * k);
        if (k <= 0) { this.world.remove(p.obj); disposeOwn(p.obj); if (p.shadow) { this.world.remove(p.shadow); p.shadow.material.dispose(); } p.gone = true; dead = true; }
        continue;
      }
      if (p.t >= 1) continue;
      p.t = Math.min(1, p.t + dt / p.dur);
      if (p.t >= 1 && p.landing && !p.route) { p.landing = false; this.ripple(p.to[0], p.to[2]); }
      const e = 1 - (1 - p.t) ** 3;
      const o = p.obj.position;
      o.x = p.from[0] + (p.to[0] - p.from[0]) * e;
      o.z = p.from[2] + (p.to[2] - p.from[2]) * e;
      o.y = p.from[1] + (p.to[1] - p.from[1]) * e + 4 * p.hop * p.t * (1 - p.t);
      p.obj.rotation.set(p.rotFrom[0] + (p.rotTo[0] - p.rotFrom[0]) * e, p.rotFrom[1] + (p.rotTo[1] - p.rotFrom[1]) * e, p.rotFrom[2] + (p.rotTo[2] - p.rotFrom[2]) * e);
    }
    // each piece's soft shadow stays on the board: smaller and fainter while the piece is in the air
    for (const p of this.live) {
      if (!p.shadow) continue;
      const o = p.obj.position, lift = Math.max(0, o.y - TOP_Y), k = 1 / (1 + lift * 7), grow = p.obj.scale.x;
      p.shadow.position.set(o.x, TOP_Y + 0.003, o.z);
      p.shadow.scale.setScalar(grow * (0.65 + 0.35 * k));
      p.shadow.material.opacity = 0.5 * k * grow;
    }
    if (dead) this.live = this.live.filter(p => !p.gone);
    // sparks and ripples
    for (let k = this.fx.length - 1; k >= 0; k--) {
      const f = this.fx[k];
      f.life -= dt;
      if (f.life <= 0) { this.world.remove(f.m); f.m.geometry.dispose(); f.m.material.dispose(); this.fx.splice(k, 1); continue; }
      const t = 1 - f.life / f.max;
      if (f.ring) { f.m.scale.setScalar(1 + t * 2.4); f.m.material.opacity = 0.7 * (1 - t); continue; }
      if (f.still) { f.m.material.opacity = 0.6 * (1 - t); f.m.scale.setScalar(1 - t * 0.5); continue; }
      f.vy -= 2.2 * dt;
      f.m.position.x += f.vx * dt; f.m.position.y = Math.max(TOP_Y + 0.005, f.m.position.y + f.vy * dt); f.m.position.z += f.vz * dt;
      f.m.material.opacity = Math.min(1, f.life / f.max * 1.6);
    }
    this.playing?.(dt);
  }
  dispose() {
    this.root.remove(this.world);
    this.live = [];
    this.picks = [];
    this.fx = [];
  }
}
/** The colour of a piece, from the first coloured mesh in it (for its sparks). */
function colorOf(obj) {
  let c = '#ffd23f';
  obj.traverse?.((o) => { if (c === '#ffd23f' && o.material?.color && !o.material.map) c = '#' + o.material.color.getHexString(); });
  return c;
}

/* ─── pictures for the boards ─── */
function woodPaper(g, w, h, a = '#c49a62', b = '#b48a52') {
  g.fillStyle = a; g.fillRect(0, 0, w, h);
  g.strokeStyle = b; g.lineWidth = 2;
  for (let y = 4; y < h; y += 13) { g.beginPath(); g.moveTo(0, y + Math.sin(y) * 2); g.bezierCurveTo(w * 0.3, y + 5, w * 0.6, y - 5, w, y); g.stroke(); }
}
const SIZE = 1.7;
/** Column/row (0-based from the far left corner) to board x/z, for an n×n grid. */
const cell = (c, r, n, size = SIZE) => [((c + 0.5) / n - 0.5) * size, ((r + 0.5) / n - 0.5) * size];
function chequered(n, dark, light, frame = '#3a2412') {
  return (g, w, h) => {
    g.fillStyle = frame; g.fillRect(0, 0, w, h);
    const s = (w - 40) / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? dark : light; g.fillRect(20 + x * s, 20 + y * s, s, s); }
  };
}

/* ─── one drawing per game ─── */
const twoStep = (ctx, st, onPiece) => { // tap a piece, then where it goes
  if (st.sel != null && !ctx.legal.some(m => m.f === st.sel)) st.sel = null;
  // a hint: its piece is picked up already, so the piece and where it goes both glow
  if (ctx.hinting && ctx.legal.length === 1 && ctx.legal[0].f != null) st.sel = ctx.legal[0].f;
  onPiece(st.sel);
};

/** The player picks the die up, holds it for a moment, and throws it onto the middle of the board. */
function thrower(st, kind, size, spread, value, hand, done, onRelease) {
  const p = st.live.find(x => x.kind === kind);
  const DIE_SIZE = size;
      const rot = DIE_TURN[value];
      const a = Math.random() * TAU, r = 0.05 + Math.random() * 0.13;
      const land = [Math.cos(a) * r, Math.sin(a) * r];
      const restY = TOP_Y + DIE_SIZE / 2;
      if (!p || reduced) { st.dieAt = land; done(); return; }
      const o = p.obj, from = o.position.clone(), spin = [3 + Math.random() * 2, 2 + Math.random() * 2, 2 + Math.random() * 2];
      let t = 0, out = null;
      p.t = 1;
      p.bounced = false;
      st.dieAt = land;
      const settle = () => {
        st.playing = null;
        st.finishThrow = null;
        o.position.set(land[0], restY, land[1]);
        o.rotation.set(rot[0], rot[1], rot[2]);
        p.to = [land[0], restY, land[1]];
        p.from = p.to.slice();
        p.rotTo = rot.slice();
        p.rotFrom = rot.slice();
      };
      st.finishThrow = settle;
      st.playing = (dt) => {
        t += dt;
        if (t < 0.32) {                 // down to the die, and it comes up to the hand
          const h = hand(), k = (t / 0.32) ** 2;
          o.position.set(from.x + (h.x - from.x) * k, from.y + (h.y - from.y) * k, from.z + (h.z - from.z) * k);
          return;
        }
        if (t < 0.64) {                 // held in the hand as the arm comes up
          o.position.copy(hand());
          return;
        }
        if (!out) { out = o.position.clone(); onRelease?.(); }
        const k = Math.min(1, (t - 0.64) / 0.62), e = 1 - (1 - k) ** 2;
        // flies in an arc, with one small bounce before it settles
        if (k >= 0.72 && !p.bounced) { p.bounced = true; audioManager.play('dice-hit'); }
        const arc = k < 0.72 ? 4 * 0.2 * (k / 0.72) * (1 - k / 0.72) + (out.y - restY) * (1 - k / 0.72) : 4 * 0.035 * ((k - 0.72) / 0.28) * (1 - (k - 0.72) / 0.28);
        o.position.set(out.x + (land[0] - out.x) * e, restY + arc, out.z + (land[1] - out.z) * e);
        const left = (1 - k) ** 2;
        o.rotation.set(rot[0] + spin[0] * TAU * left, rot[1] + spin[1] * TAU * left, rot[2] + spin[2] * TAU * left);
        if (k < 1) return;
        audioManager.play('dice-land');
        settle();
        done();
      };
}

const BOARDS = {
  'tic-tac-toe': {
    span: 1.75,
    build(st) {
      st.add(plate(SIZE * 0.86, SIZE * 0.86, (g, w, h) => {
        woodPaper(g, w, h, '#e6cf9f', '#d9bf8a');
        g.strokeStyle = '#5a3a20'; g.lineWidth = 16; g.lineCap = 'round';
        [1, 2].forEach((k) => { const p = (k * w) / 3; g.beginPath(); g.moveTo(p, 40); g.lineTo(p, h - 40); g.moveTo(40, p); g.lineTo(w - 40, p); g.stroke(); });
      }));
    },
    draw(st, v, ctx) {
      const S = SIZE * 0.86;
      v.b.forEach((p, i) => {
        const [x, z] = cell(i % 3, Math.floor(i / 3), 3, S);
        if (p === 0) st.put('x', () => { const m = mat('#c62828', 0.3); const a = mesh(box(0.34, 0.05, 0.06), m); const b = mesh(box(0.34, 0.05, 0.06), m); a.rotation.y = Math.PI / 4; b.rotation.y = -Math.PI / 4; return group(a, b); }, x, TOP_Y + 0.03, z);
        if (p === 1) st.put('o', () => { const t = mesh(geo('o', () => new THREE.TorusGeometry(0.11, 0.032, 12, 32)), mat('#1565c0', 0.3)); t.rotation.x = Math.PI / 2; return group(t); }, x, TOP_Y + 0.035, z);
      });
      v.line?.forEach((c) => { const [x, z] = cell(c % 3, Math.floor(c / 3), 3, S); st.area(x, z, S / 3 - 0.03, S / 3 - 0.03, null, { show: true, color: '#7dff9a', y: TOP_Y + 0.002 }); });
      ctx.legal.forEach((m, i) => { const [x, z] = cell(m.c % 3, Math.floor(m.c / 3), 3, S); st.area(x, z, S / 3 - 0.04, S / 3 - 0.04, i, { show: ctx.mine }); });
    },
  },
  'four-in-a-row': {
    span: 1.9,
    build(st) {
      const rack = plate(SIZE, SIZE * 0.86, (g, w, h) => {
        g.fillStyle = '#1b4fa8'; g.fillRect(0, 0, w, h);
        const sx = w / FOUR_COLS, sy = h / FOUR_ROWS;
        for (let c = 0; c < FOUR_COLS; c++) for (let r = 0; r < FOUR_ROWS; r++) {
          g.fillStyle = '#0c2758'; g.beginPath(); g.arc((c + 0.5) * sx, (r + 0.5) * sy, Math.min(sx, sy) * 0.4, 0, TAU); g.fill();
        }
      }, { color: '#143a80' });
      st.add(rack);
    },
    draw(st, v, ctx) {
      const W = SIZE, D = SIZE * 0.86;
      v.b.forEach((p, i) => {
        if (p < 0) return;
        const c = i % FOUR_COLS, r = (i - c) / FOUR_COLS;
        const x = ((c + 0.5) / FOUR_COLS - 0.5) * W, z = (0.5 - (r + 0.5) / FOUR_ROWS) * D;
        st.put(p === 0 ? 'fr' : 'fy', () => disc(p === 0 ? '#d32f2f' : '#f2b705', 0.092, 0.03), x, TOP_Y, z, { hop: 0.06 });
      });
      v.line?.forEach((i) => {
        const c = i % FOUR_COLS, r = (i - c) / FOUR_COLS;
        st.mark(((c + 0.5) / FOUR_COLS - 0.5) * W, (0.5 - (r + 0.5) / FOUR_ROWS) * D, { none: 1 }, { r: 0.11, y: TOP_Y + 0.002, color: '#7dff9a', pulse: true });
      });
      ctx.legal.forEach((m, i) => {
        const x = ((m.c + 0.5) / FOUR_COLS - 0.5) * W;
        st.area(x, 0, W / FOUR_COLS - 0.015, D, i, { show: false });
        st.mark(x, -D / 2 - 0.07, i, { r: 0.05 });
      });
    },
  },
  reversi: {
    span: 1.9,
    build(st) { st.add(plate(SIZE, SIZE, chequered(8, '#1f7a3f', '#238a48', '#123d20'))); },
    draw(st, v, ctx) {
      const side = mat('#555', 0.5), dark = mat('#191919', 0.35), light = mat('#f3efe4', 0.35);
      v.b.forEach((p, i) => {
        if (p < 0) return;
        const [x, z] = cell(i % 8, Math.floor(i / 8), 8);
        st.put('rv', () => { const m = new THREE.Mesh(cyl(0.082, 0.082, 0.026), [side, dark, light]); m.castShadow = true; return m; }, x, TOP_Y + 0.016, z, { rot: [p === 0 ? 0 : Math.PI, 0, 0], hop: 0.1 });
      });
      if (v.last != null) { const [x, z] = cell(v.last % 8, Math.floor(v.last / 8), 8); st.area(x, z, 0.2, 0.2, null, { show: true, color: '#f7d774', y: TOP_Y + 0.001 }); }
      ctx.legal.forEach((m, i) => { const [x, z] = cell(m.c % 8, Math.floor(m.c / 8), 8); st.mark(x, z, i, { r: 0.036 }); });
    },
  },
  checkers: {
    span: 1.9,
    faces: true,
    build(st) { st.add(plate(SIZE, SIZE, chequered(8, '#3f2a1c', '#c9a26f'))); },
    draw(st, v, ctx) {
      v.b.forEach((p, i) => {
        if (p < 0) return;
        const [x, z] = cell(i % 8, Math.floor(i / 8), 8);
        const color = p % 2 === 0 ? '#d32f2f' : '#f7f0e0';
        const king = p >= 2;
        st.put(`c${p}`, () => (king ? group(disc(color, 0.08, 0.03), mesh(cyl(0.07, 0.07, 0.03), mat(color, 0.35), 0, 0.045, 0), mesh(ball(0.02), mat('#f0c040', 0.3), 0, 0.075, 0)) : disc(color, 0.08, 0.034)), x, TOP_Y, z);
      });
      twoStep(ctx, st, (sel) => {
        const froms = [...new Set(ctx.legal.map(m => m.f))];
        // with a single piece to move (a jump in progress) it's selected already
        const active = sel ?? (froms.length === 1 ? froms[0] : null);
        froms.forEach((f) => { const [x, z] = cell(f % 8, Math.floor(f / 8), 8); st.mark(x, z, { sel: f }, { r: 0.09, y: TOP_Y + 0.002, color: f === active ? '#ffb347' : '#ffe08a' }); });
        ctx.legal.forEach((m, i) => { if (m.f === active) { const [x, z] = cell(m.t % 8, Math.floor(m.t / 8), 8); st.mark(x, z, i, { r: 0.06 }); } });
      });
    },
  },
  chess: {
    span: 1.95,
    faces: true,
    build(st) {
      const board = CHESS_BOARD_STYLES[selectedGameCosmetic('chess', 'board')?.style];
      st.chessPieceStyle = selectedGameCosmetic('chess', 'pieces')?.style || 'classic';
      st.add(plate(SIZE, SIZE, chequered(8, board?.dark || '#6e4426', board?.light || '#c9a26f'), { color: board?.frame || '#5a3a20' }));
    },
    draw(st, v, ctx) {
      v.b.forEach((c, i) => {
        if (c === '.') return;
        const [x, z] = cell(i % 8, Math.floor(i / 8), 8);
        const white = c === c.toUpperCase();
        const kind = c.toUpperCase();
        // knights look outwards, as on a real board, so their horse's head is seen side on
        const turn = kind === 'N' ? (i % 8 < 4 ? Math.PI / 2 : -Math.PI / 2) : white ? 0 : Math.PI;
        // from above, the symbols stand upright for whoever holds the phone
        if (flat2d()) { const up = st.world.rotation.y; st.put(`f${c}`, () => flatChessToken(kind, white, st.chessPieceStyle), x, TOP_Y, z, up ? { rot: [0, up, 0] } : {}); return; }
        st.put(`p${c}`, () => { const g = chessPiece(kind, white ? '#fffaf0' : '#17110d', st.chessPieceStyle); g.rotation.y = turn; return g; }, x, TOP_Y, z, turn ? { rot: [0, turn, 0] } : {});
      });
      if (v.last) {
        [v.last.f, v.last.t].forEach((sq) => { const [x, z] = cell(sq % 8, Math.floor(sq / 8), 8); st.area(x, z, 0.2, 0.2, null, { show: true, color: '#f7d774', y: TOP_Y + 0.001 }); });
        // an arrow from where the last piece came from to where it went
        const [fx, fz] = cell(v.last.f % 8, Math.floor(v.last.f / 8), 8), [tx, tz] = cell(v.last.t % 8, Math.floor(v.last.t / 8), 8);
        st.line(fx, fz, tx, tz, '#ffd23f');
      }
      // in check: the king's square glows red
      if (v.check && !v.end) {
        const k = v.b.indexOf(v.p === 0 ? 'K' : 'k');
        if (k >= 0) { const [x, z] = cell(k % 8, Math.floor(k / 8), 8); st.mark(x, z, undefined, { r: 0.1, y: TOP_Y + 0.002, color: '#ff2a2a', pulse: true }); st.picks.pop(); }
      }
      // checkmate: sparks round the winner's king
      if (v.end && v.end.winner >= 0 && st.chessEnded !== v.end) {
        st.chessEnded = v.end;
        const k = v.b.indexOf(v.end.winner === 0 ? 'K' : 'k');
        if (k >= 0) { const [x, z] = cell(k % 8, Math.floor(k / 8), 8); setTimeout(() => st.burst(x, TOP_Y + 0.15, z, v.end.winner === 0 ? '#fff3c0' : '#ffd23f', 30, 0.7), 500); }
      }
      twoStep(ctx, st, (sel) => {
        [...new Set(ctx.legal.map(m => m.f))].forEach((f) => { const [x, z] = cell(f % 8, Math.floor(f / 8), 8); st.area(x, z, 0.2, 0.2, { sel: f }, { show: f === sel, color: '#ffb347', y: TOP_Y + 0.003 }); });
        if (sel == null) return;
        const seen = new Set();
        ctx.legal.forEach((m, i) => {
          if (m.f !== sel || seen.has(m.t)) return;
          seen.add(m.t);
          const [x, z] = cell(m.t % 8, Math.floor(m.t / 8), 8);
          // a pawn reaching the far side: the panel asks what it becomes
          const promos = ctx.legal.filter(o => o.f === sel && o.t === m.t && o.q);
          st.mark(x, z, promos.length ? { promote: { f: sel, t: m.t } } : i, { r: 0.05, y: TOP_Y + 0.006 });
        });
      });
    },
  },
  'nine-mens-morris': {
    span: 1.85,
    build(st) {
      st.add(plate(SIZE, SIZE, (g, w, h) => {
        woodPaper(g, w, h, '#d9b983', '#ca9f68');
        g.strokeStyle = '#3a2412'; g.lineWidth = 10;
        [0, 1, 2].forEach((ring) => { const m = 90 + ring * 140; g.strokeRect(m, m, w - m * 2, h - m * 2); });
        g.beginPath();
        g.moveTo(w / 2, 90); g.lineTo(w / 2, 370); g.moveTo(w / 2, h - 90); g.lineTo(w / 2, h - 370);
        g.moveTo(90, h / 2); g.lineTo(370, h / 2); g.moveTo(w - 90, h / 2); g.lineTo(w - 370, h / 2);
        g.stroke();
      }));
    },
    point(i) {
      const ring = Math.floor(i / 8), k = i % 8;
      const R = (1 - (90 + ring * 140) / 512) * (SIZE / 2);
      const corners = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
      return [corners[k][0] * R, corners[k][1] * R];
    },
    draw(st, v, ctx) {
      const at = this.point;
      v.b.forEach((p, i) => {
        if (p < 0) return;
        const [x, z] = at(i);
        st.put(`m${p}`, () => disc(p === 0 ? '#f4ead5' : '#2a211c', 0.075, 0.034), x, TOP_Y, z);
      });
      twoStep(ctx, st, (sel) => {
        ctx.legal.forEach((m, i) => {
          if (m.x != null) { const [x, z] = at(m.x); st.mark(x, z, i, { r: 0.09, y: TOP_Y + 0.04, color: '#ff6b5b' }); return; }
          if (m.f == null) { const [x, z] = at(m.t); st.mark(x, z, i, { r: 0.05 }); return; }
          if (m.f === sel) { const [x, z] = at(m.t); st.mark(x, z, i, { r: 0.05 }); }
        });
        [...new Set(ctx.legal.map(m => m.f).filter(f => f != null))].forEach((f) => { const [x, z] = at(f); st.mark(x, z, { sel: f }, { r: 0.09, y: TOP_Y + 0.002, color: f === sel ? '#ffb347' : '#ffe08a' }); });
      });
    },
  },
  mancala: {
    half: [1.01, 0.4],
    span: 1.9,
    pit(i) {
      if (i === 6) return [0.82, 0];
      if (i === 13) return [-0.82, 0];
      if (i < 6) return [(i - 2.5) * 0.235, 0.17];
      return [(9.5 - i) * 0.235, -0.17];
    },
    build(st) {
      const pos = (i) => this.pit(i);
      st.add(plate(1.98, 0.72, (g, w, h) => {
        woodPaper(g, w, h, '#a0713f', '#8d5f30');
        const kx = w / 1.98, kz = h / 0.72;
        for (let i = 0; i < 14; i++) {
          const [x, z] = pos(i);
          const px = (x + 0.99) * kx, pz = (z + 0.36) * kz;
          g.fillStyle = '#4c2f15'; g.beginPath();
          if (i === 6 || i === 13) g.ellipse(px, pz, 0.1 * kx, 0.3 * kz, 0, 0, TAU);
          else g.ellipse(px, pz, 0.095 * kx, 0.13 * kz, 0, 0, TAU);
          g.fill();
        }
      }));
    },
    draw(st, v, ctx) {
      const COLORS = ['#e2574c', '#f2b705', '#2e9e4f', '#2e7dd1', '#b05cc6', '#ef8a3c'];
      v.b.forEach((count, i) => {
        const [x, z] = this.pit(i);
        const store = i === 6 || i === 13;
        for (let k = 0; k < count; k++) {
          const a = k * 2.4, d = Math.min(store ? 0.07 : 0.055, 0.016 * Math.sqrt(k) * 1.9);
          const sx = x + Math.cos(a) * d, sz = z + Math.sin(a) * d * (store ? 2.6 : 1.1);
          const color = COLORS[k % COLORS.length];
          st.put(`seed${color}`, () => mesh(ball(0.022), mat(color, 0.3)), sx, TOP_Y + 0.024 + Math.floor(k / 9) * 0.03, sz, { hop: 0.1 });
        }
        st.put(`lab${i}:${count}`, () => textSprite(count, { size: 0.075 }), x, TOP_Y + 0.17, z + (store ? 0.34 : (i < 6 ? 0.19 : -0.19)), { noDrop: true });
      });
      ctx.legal.forEach((m, i) => { const [x, z] = this.pit(m.pit); st.area(x, z, 0.21, 0.29, i, { show: ctx.mine, color: '#ffe08a', y: TOP_Y + 0.003 }); });
    },
  },
  'dots-and-boxes': {
    span: 1.85,
    build(st) {
      st.add(plate(SIZE, SIZE, (g, w, h) => { g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(70,110,190,.28)'; g.lineWidth = 3; for (let y = 40; y < h; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, { color: '#cfc4a6' }));
      const u = (SIZE * 0.88) / DOTS_N, o = -(SIZE * 0.88) / 2;
      for (let y = 0; y <= DOTS_N; y++) for (let x = 0; x <= DOTS_N; x++) st.add(mesh(cyl(0.018, 0.018, 0.018, 12), mat('#2a2422', 0.4), o + x * u, TOP_Y + 0.009, o + y * u));
    },
    draw(st, v, ctx) {
      const u = (SIZE * 0.88) / DOTS_N, o = -(SIZE * 0.88) / 2, total = DOTS_N * (DOTS_N + 1);
      const where = (e) => (e < total
        ? { x: o + ((e % DOTS_N) + 0.5) * u, z: o + Math.floor(e / DOTS_N) * u, horizontal: true }
        : { x: o + ((e - total) % (DOTS_N + 1)) * u, z: o + (Math.floor((e - total) / (DOTS_N + 1)) + 0.5) * u, horizontal: false });
      v.lines.forEach((p, e) => {
        if (p < 0) return;
        const { x, z, horizontal } = where(e);
        st.put(`l${e}`, () => mesh(horizontal ? box(u - 0.03, 0.014, 0.02) : box(0.02, 0.014, u - 0.03), mat(PLAYER_COLORS[p], 0.4)), x, TOP_Y + 0.008, z, { noDrop: true });
      });
      v.boxes.forEach((p, b) => {
        if (p < 0) return;
        const x = o + ((b % DOTS_N) + 0.5) * u, z = o + (Math.floor(b / DOTS_N) + 0.5) * u;
        st.put(`box${b}`, () => mesh(box(u - 0.05, 0.006, u - 0.05), mat(PLAYER_COLORS[p], 0.7)), x, TOP_Y + 0.003, z, { noDrop: true });
      });
      ctx.legal.forEach((m, i) => {
        const { x, z, horizontal } = where(m.e);
        st.area(x, z, horizontal ? u - 0.05 : 0.09, horizontal ? 0.09 : u - 0.05, i, { show: ctx.mine, color: '#d7c56f', y: TOP_Y + 0.004 });
      });
    },
  },
  ludo: {
    span: 1.85,
    path: [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], [0, 7], [0, 6]],
    colors: LUDO_COLORS,
    // tokens are deeper than the squares they stand on, so a token never melts into its own colour
    pawns: ['#9c1212', '#0e5c2c', '#b57a00', '#124b94'],
    yards: [[0, 0], [9, 0], [9, 9], [0, 9]],
    column(q, k) { return [[1 + k, 7], [7, 1 + k], [13 - k, 7], [7, 13 - k]][q]; },
    build(st) {
      const boardStyle = selectedGameCosmetic('ludo', 'board')?.style || 'classic';
      const palette = LUDO_BOARD_STYLES[boardStyle] || LUDO_BOARD_STYLES.classic;
      const path = this.path, colors = palette.colors, yards = this.yards, column = this.column;
      st.ludoTokenColors = palette.tokens || this.pawns;
      st.ludoTokenStyle = selectedGameCosmetic('ludo', 'pieces')?.style || 'classic';
      st.add(plate(SIZE, SIZE, (g, w) => {
        const u = w / 15;
        g.fillStyle = palette.base; g.fillRect(0, 0, w, w);
        yards.forEach(([x, y], q) => {
          g.fillStyle = colors[q]; g.fillRect(x * u, y * u, 6 * u, 6 * u);
          g.fillStyle = palette.base; g.fillRect((x + 1) * u, (y + 1) * u, 4 * u, 4 * u);
          [[2, 2], [4, 2], [2, 4], [4, 4]].forEach(([a, b]) => { g.fillStyle = colors[q]; g.beginPath(); g.arc((x + a) * u, (y + b) * u, 0.62 * u, 0, TAU); g.fill(); });
          for (let k = 0; k < 5; k++) { const [c, r] = column(q, k); g.fillStyle = colors[q]; g.fillRect(c * u, r * u, u, u); }
          const [sc, sr] = path[LUDO_STARTS[q]];
          g.fillStyle = colors[q]; g.fillRect(sc * u, sr * u, u, u);
        });
        g.strokeStyle = palette.border; g.lineWidth = 2;
        path.forEach(([c, r]) => g.strokeRect(c * u, r * u, u, u));
        LUDO_SAFE.forEach((sq) => {
          if (LUDO_STARTS.includes(sq)) return;
          const [c, r] = path[sq];
          g.fillStyle = palette.safe; g.font = `${u * 0.8}px system-ui, "Segoe UI Symbol", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('★', (c + 0.5) * u, (r + 0.55) * u);
        });
        const m = 7.5 * u;
        [[6, 6, 9, 6], [9, 6, 9, 9], [9, 9, 6, 9], [6, 9, 6, 6]].forEach(([a, b, c, d], i) => {
          g.fillStyle = colors[[1, 2, 3, 0][i]];
          g.beginPath(); g.moveTo(a * u, b * u); g.lineTo(c * u, d * u); g.lineTo(m, m); g.fill();
        });
        // a white arrow on each start square, pointing the way round, and a soft shine over the yards
        yards.forEach((_, q) => {
          const [sc, sr] = path[LUDO_STARTS[q]];
          const [nc, nr] = path[(LUDO_STARTS[q] + 1) % 52];
          const ang = Math.atan2(nr - sr, nc - sc);
          g.save(); g.translate((sc + 0.5) * u, (sr + 0.5) * u); g.rotate(ang);
          g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.moveTo(u * 0.32, 0); g.lineTo(-u * 0.22, -u * 0.24); g.lineTo(-u * 0.22, u * 0.24); g.closePath(); g.fill();
          g.restore();
          const [x, y] = yards[q];
          const shine = g.createRadialGradient((x + 2) * u, (y + 2) * u, u * 0.5, (x + 3) * u, (y + 3) * u, 4 * u);
          shine.addColorStop(0, 'rgba(255,255,255,.18)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = shine; g.fillRect(x * u, y * u, 6 * u, 6 * u);
        });
        // a star in the middle: home
        g.fillStyle = 'rgba(255,255,255,.85)'; g.font = `${u * 1.1}px system-ui, "Segoe UI Symbol", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('★', m, m + u * 0.05);
      }, { color: palette.frame }));
      // the yard of the player whose turn it is glows round its edge
      st.ludoGlow = [0, 1, 2, 3].map((q) => {
        const [x, y] = yards[q];
        const [cx, cz] = cell(x + 2.5, y + 2.5, 15);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.018, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0, depthWrite: false }));   // gold-white: it shows on every colour
        ring.rotation.set(Math.PI / 2, 0, Math.PI / 4);
        ring.scale.set(1.15, 1.15, 1);
        ring.position.set(cx, TOP_Y + 0.006, cz);
        st.add(ring);
        return ring;
      });
      st.glows.push(...st.ludoGlow);
    },
    tokenAt(v, seat, t, pos) {
      const q = ludoQuarter(v, seat);
      let c, r;
      if (pos < 0) { const [yx, yy] = this.yards[q]; const [a, b] = [[2, 2], [4, 2], [2, 4], [4, 4]][t]; c = yx + a - 0.5; r = yy + b - 0.5; }
      else if (pos === LUDO_HOME) { c = 7 + (t % 2 ? 0.2 : -0.2); r = 7 + (t < 2 ? 0.2 : -0.2); }
      else if (pos > 50) { [c, r] = this.column(q, pos - 51); }
      else { [c, r] = this.path[(LUDO_STARTS[q] + pos) % 52]; }
      return cell(c, r, 15);
    },
    draw(st, v, ctx) {
      st.finishThrow?.();
      const spots = new Map();
      const before = st.ludoWas || v.t;
      // whose turn: their yard glows
      st.ludoGlow?.forEach((r, q) => { const on = (ctx.active || []).some(seat => ludoQuarter(v, seat) === q); r.userData.on = on; if (!on) r.material.opacity = 0; });
      // a token that has just reached home: gold sparks in the middle of the board
      v.t.forEach((tokens, seat) => tokens.forEach((pos, t) => { if (pos === LUDO_HOME && before[seat]?.[t] !== LUDO_HOME && st.ludoWas !== v.t) { const [hx, hz] = cell(7, 7, 15); setTimeout(() => st.burst(hx, TOP_Y + 0.08, hz, '#ffd23f', 24, 0.7), 600); } }));
      st.ludoWas = v.t;
      v.t.forEach((tokens, seat) => tokens.forEach((pos, t) => {
        let [x, z] = this.tokenAt(v, seat, t, pos);
        if (pos >= 0 && pos !== LUDO_HOME) {   // tokens sharing a square stand side by side
          const key = `${x.toFixed(3)},${z.toFixed(3)}`;
          const n = spots.get(key) || 0;
          spots.set(key, n + 1);
          x += [0, 0.03, -0.03, 0.03][n]; z += [0, 0.03, 0.03, -0.03][n];
        }
        const q = ludoQuarter(v, seat);
        const move = ctx.legal.findIndex(m => m.t === t);
        const mine = ctx.mine && seat === ctx.me && move >= 0;
        // moving forward: walk the squares in between, so you can follow it and count
        const was = before[seat]?.[t] ?? pos;
        let route;
        if (was >= 0 && pos >= 0 && pos !== was && (pos > was || (pos <= 6 && was >= 45))) {
          // forwards, or round again past its own start (the capture-first rule)
          route = [];
          const steps = pos > was ? pos - was : pos + 51 - was;
          for (let k = 1; k < steps; k++) { const p2 = was + k > 50 && pos < was ? was + k - 51 : was + k; route.push(this.tokenAt(v, seat, t, p2)); }
          route.push([x, z]);
        }
        // captured: a high arc all the way back to the yard
        const sentHome = was >= 0 && pos < 0;
        st.put(`t${seat}.${t}`, () => glossyPawn(st.ludoTokenColors[q], 0.82, st.ludoTokenStyle), x, TOP_Y, z, mine ? { pick: move, hop: 0.12, route } : { hop: sentHome ? 0.7 : 0.12, route });
        // where this move would land: a ring on the board
        if (mine) {
          const to = ludoDestination(v, seat, t);
          if (to != null) { const [lx, lz] = this.tokenAt(v, seat, t, to); st.mark(lx, lz, move, { r: 0.05, y: TOP_Y + 0.003, color: '#ffffff', pulse: true }); }
        }
        if (mine) st.mark(x, z, move, { r: 0.07, y: TOP_Y + 0.002, pulse: true });
        // a number to match its button, once it's on the board
        if (mine && pos >= 0) {
          st.put(`no${t}`, () => textSprite(t + 1, { size: 0.085 }), x, TOP_Y + 0.2, z, { noDrop: true, hop: 0 });
        }
      }));
      const [dx, dz] = st.dieAt || [0, 0];
      const rolling = ctx.mine && v.die == null;
      st.put('die', () => dieMesh(DIE_SIZE), dx, TOP_Y + DIE_SIZE / 2, dz, { rot: DIE_TURN[v.shown || 1], pick: rolling ? 0 : undefined, noDrop: true });
      if (rolling) st.mark(dx, dz, 0, { r: 0.14, y: TOP_Y + 0.002, pulse: true });
    },
    throwDie(st, value, hand, done, onRelease) { thrower(st, 'die', DIE_SIZE, 0, value, hand, done, onRelease); },
  },
  'snakes-and-ladders': {
    throwDie(st, value, hand, done, onRelease) { thrower(st, 'die', DIE_SIZE, 0, value, hand, done, onRelease); },
    span: 1.85,
    square(n) { // 1 at the near left, snaking up to 100 at the far left
      const k = n - 1, row = Math.floor(k / 10), col = row % 2 ? 9 - (k % 10) : k % 10;
      return cell(col, 9 - row, 10);
    },
    build(st) {
      const toPx = (n, w) => { const k = n - 1, row = Math.floor(k / 10), col = row % 2 ? 9 - (k % 10) : k % 10; return [(col + 0.5) * w / 10, (9 - row + 0.5) * w / 10]; };
      st.add(plate(SIZE, SIZE, (g, w) => {
        const u = w / 10;
        const tints = ['#f6e3b4', '#cfe6c4', '#f3c9b5', '#c6d9ee', '#ecd0e6'];
        for (let n = 1; n <= 100; n++) {
          const [x, y] = toPx(n, w);
          g.fillStyle = tints[(n * 7 + Math.floor((n - 1) / 10)) % tints.length]; g.fillRect(x - u / 2, y - u / 2, u, u);
          g.fillStyle = '#4a3a28'; g.font = `800 ${u * 0.27}px system-ui, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'top';
          g.fillText(String(n), x - u * 0.45, y - u * 0.45);
        }
        Object.entries(LADDERS).forEach(([a, b]) => {
          const [x1, y1] = toPx(Number(a), w), [x2, y2] = toPx(b, w);
          const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), nx = (-dy / len) * u * 0.13, ny = (dx / len) * u * 0.13;
          g.strokeStyle = '#7a4f24'; g.lineWidth = u * 0.07; g.lineCap = 'round';
          g.beginPath(); g.moveTo(x1 + nx, y1 + ny); g.lineTo(x2 + nx, y2 + ny); g.moveTo(x1 - nx, y1 - ny); g.lineTo(x2 - nx, y2 - ny); g.stroke();
          g.lineWidth = u * 0.05;
          for (let t = 0.08; t < 1; t += u * 0.42 / len) { const px = x1 + dx * t, py = y1 + dy * t; g.beginPath(); g.moveTo(px + nx, py + ny); g.lineTo(px - nx, py - ny); g.stroke(); }
        });
        Object.entries(SNAKES).forEach(([a, b], i) => {
          const [x1, y1] = toPx(Number(a), w), [x2, y2] = toPx(b, w);
          const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
          const color = ['#2e8b57', '#c0392b', '#6a3fb5', '#d17a10'][i % 4];
          g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = u * 0.17;
          g.beginPath(); g.moveTo(x1, y1);
          const waves = Math.max(2, Math.round(len / (u * 1.1)));
          for (let k = 1; k <= waves; k++) {
            const t0 = (k - 0.5) / waves, t1 = k / waves, off = (k % 2 ? 1 : -1) * u * 0.42;
            g.quadraticCurveTo(x1 + dx * t0 + nx * off, y1 + dy * t0 + ny * off, x1 + dx * t1, y1 + dy * t1);
          }
          g.stroke();
          g.fillStyle = color; g.beginPath(); g.arc(x1, y1, u * 0.19, 0, TAU); g.fill();
          g.fillStyle = '#fff'; [-1, 1].forEach((s) => { g.beginPath(); g.arc(x1 + nx * s * u * 0.08, y1 + ny * s * u * 0.08, u * 0.05, 0, TAU); g.fill(); });
        });
      }, { color: '#6b4a2b' }));
    },
    draw(st, v, ctx) {
      st.finishThrow?.();
      const before = st.snakesWas || v.at;
      st.snakesWas = v.at;
      v.at.forEach((n, seat) => {
        let x, z;
        if (n === 0) { [x, z] = this.square(1); x -= 0.14 + seat * 0.02; z += 0.11 - seat * 0.045; }
        else { [x, z] = this.square(n); x += (seat - (v.n - 1) / 2) * 0.042; z += seat % 2 ? 0.02 : -0.02; }
        // a normal roll walks square by square; a ladder or a snake is one long move
        const was = before[seat] ?? n;
        let route;
        if (n > was && n - was <= 6 && was > 0) {
          route = [];
          for (let k = was + 1; k < n; k++) route.push(this.square(k));
          route.push([x, z]);
        }
        st.put(`s${seat}`, () => pawnShape(PLAYER_COLORS[seat], 0.78), x, TOP_Y, z, { hop: 0.14, route });
      });
      const [dx, dz] = st.dieAt || [0, 0];
      st.put('die', () => dieMesh(DIE_SIZE), dx, TOP_Y + DIE_SIZE / 2, dz, { rot: DIE_TURN[v.shown || 1], pick: ctx.mine ? 0 : undefined, noDrop: true });
      if (ctx.mine) st.mark(dx, dz, 0, { r: 0.14, y: TOP_Y + 0.002, pulse: true });
    },
  },
  'memory-match': {
    half: [0.87, 0.63],
    span: 1.8,
    build(st) { st.add(plate(SIZE, SIZE * 0.72, (g, w, h) => { g.fillStyle = '#2d1f4d'; g.fillRect(0, 0, w, h); }, { color: '#1e1436' })); },
    tileMat(face) {
      this.faces = this.faces || new Map();
      if (!this.faces.has(face)) {
        this.faces.set(face, new THREE.MeshStandardMaterial({ roughness: 0.5, envMapIntensity: 0.3, map: canvasTexture(128, 128, (g) => {
          g.fillStyle = '#fbf6e9'; g.fillRect(0, 0, 128, 128);
          g.font = '82px system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(face, 64, 72);
        }) }));
      }
      return this.faces.get(face);
    },
    backMat() {
      if (!this.back) this.back = new THREE.MeshStandardMaterial({ roughness: 0.5, envMapIntensity: 0.3, map: canvasTexture(128, 128, (g) => { g.fillStyle = '#6a1b9a'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#e8c9ff'; g.lineWidth = 6; g.strokeRect(14, 14, 100, 100); g.fillStyle = '#e8c9ff'; g.font = '800 54px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 68); }) });
      return this.back;
    },
    draw(st, v, ctx) {
      const shown = new Set([...v.up, ...v.miss]);
      const W = SIZE * 0.94, D = SIZE * 0.68, cols = 6, rows = 4;
      v.owner.forEach((owner, t) => {
        if (owner >= 0) return;
        const c = t % cols, r = Math.floor(t / cols);
        const x = ((c + 0.5) / cols - 0.5) * W, z = ((r + 0.5) / rows - 0.5) * D;
        const up = shown.has(t);
        const move = ctx.legal.findIndex(m => m.t === t);
        st.put(`tile${t}`, () => { const e = mat('#ded7c6', 0.7); const m = new THREE.Mesh(box(W / cols - 0.02, 0.02, D / rows - 0.02), [e, e, this.backMat(), this.backMat(), e, e]); m.castShadow = true; return m; },
          x, TOP_Y + 0.012, z, {
            rot: [up ? Math.PI : 0, 0, 0], hop: 0.08, pick: move >= 0 ? move : undefined,
            // the face is painted on the underside, and only when somebody may see it
            update: (m) => { m.material[3] = v.faces[t] ? this.tileMat(v.faces[t]) : this.backMat(); },
          });
      });
    },
  },
  pig: { span: 1.4, tray: true, dice: (v) => (v.style === 'two' ? [{ v: v.shown }, { v: v.shown2 || 1 }] : [{ v: v.shown }]), throwDie(st, value, hand, done, onRelease) { thrower(st, 'dice0', 0.2, 0, value, hand, done, onRelease); } },
  yacht: { span: 1.5, tray: true, dice: (v) => v.dice.map((n, i) => ({ v: n, spin: v.spins[i], keep: v.keep[i] })) },
  'crazy-eights': {
    span: 1.7,
    felt: true,
    draw(st, v, ctx, seatOf) {
      st.put(`card:${v.top}`, () => cardMesh(v.top, 0.24), 0.17, TOP_Y + 0.004, 0, { from: v.by != null && seatOf(v.by) >= 0 ? seatSpot(seatOf(v.by), 0.6) : undefined });
      for (let i = 0; i < Math.min(6, Math.ceil(v.stock / 8)); i++) st.put(`stock${i}`, () => cardMesh('back', 0.24), -0.17, TOP_Y + 0.004 + i * 0.007, -0.002 * i, { rot: [Math.PI, 0, 0], noDrop: true });
      const draw = ctx.legal.findIndex(m => m.draw);
      if (draw >= 0) st.area(-0.17, 0, 0.26, 0.36, draw, { show: true });
      st.put(`suit:${v.suit}`, () => textSprite(SUIT_ICON[v.suit], { size: 0.13, color: v.suit === 'H' || v.suit === 'D' ? '#ff7b72' : '#fff' }), 0.17, TOP_Y + 0.25, -0.26, { noDrop: true });
      opponents(st, v.counts, ctx, seatOf);
    },
  },
  'color-clash': {
    span: 1.7,
    felt: true,
    face(code) {
      this.faces = this.faces || new Map();
      if (!this.faces.has(code)) {
        const COL = { R: '#d32f2f', G: '#2e9e4f', B: '#1e6fd0', Y: '#f2b705' };
        const LBL = { S: '⊘', T: '⇄', D: '+2', W: '★', W4: '+4' };
        const v = code[0] === 'W' ? code : code.slice(1);
        this.faces.set(code, new THREE.MeshStandardMaterial({ roughness: 0.5, envMapIntensity: 0.3, map: canvasTexture(192, 270, (g, w, h) => {
          g.fillStyle = '#fbf8ef'; g.fillRect(0, 0, w, h);
          if (code[0] === 'W') { ['#d32f2f', '#2e9e4f', '#1e6fd0', '#f2b705'].forEach((c, i) => { g.fillStyle = c; g.fillRect(12 + (i % 2) * 84, 12 + Math.floor(i / 2) * 123, 84, 123); }); }
          else { g.fillStyle = COL[code[0]]; g.fillRect(12, 12, w - 24, h - 24); }
          g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w / 2, h / 2, 62, 92, -0.5, 0, Math.PI * 2); g.fill();
          g.fillStyle = code[0] === 'W' ? '#222' : COL[code[0]]; g.font = '900 78px system-ui, "Segoe UI Symbol", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(LBL[v] ?? v, w / 2, h / 2 + 4);
        }) }));
      }
      return this.faces.get(code);
    },
    draw(st, v, ctx, seatOf) {
      const edge = mat('#ded7c6', 0.7);
      const card = (code) => { const m = new THREE.Mesh(box(0.24, 0.006, 0.336), [edge, edge, this.face(code), cardFace('back'), edge, edge]); m.castShadow = true; return m; };
      st.put(`rp:${v.top}`, () => card(v.top), 0.17, TOP_Y + 0.004, 0, { from: v.by != null && seatOf(v.by) >= 0 ? seatSpot(seatOf(v.by), 0.6) : undefined, rot: [0, (v.top.charCodeAt(1) || 3) * 0.07 - 0.2, 0] });
      for (let i = 0; i < Math.min(6, Math.ceil(v.stock / 12)); i++) st.put(`stock${i}`, () => cardMesh('back', 0.24), -0.17, TOP_Y + 0.004 + i * 0.007, -0.002 * i, { rot: [Math.PI, 0, 0], noDrop: true });
      const draw = ctx.legal.findIndex(m => m.draw);
      if (draw >= 0) st.area(-0.17, 0, 0.26, 0.36, draw, { show: true });
      const COLHEX = { R: '#ff6b5b', G: '#5be37d', B: '#59a8ff', Y: '#ffd23f' };
      st.put(`colour:${v.colour}:${v.dir}`, () => textSprite(v.dir > 0 ? '⟳' : '⟲', { size: 0.13, color: COLHEX[v.colour] }), 0.17, TOP_Y + 0.25, -0.26, { noDrop: true });
      opponents(st, v.counts, ctx, seatOf);
    },
  },
  'call-break': {
    span: 1.7,
    felt: true,
    draw(st, v, ctx, seatOf) {
      const cards = v.trick.length ? v.trick : v.lastTrick?.cards || [];
      cards.forEach(({ seat, c }) => {
        const [x, z] = seatSpot(seatOf(seat), 0.22);
        st.put(`card:${c}`, () => cardMesh(c, 0.22), x, TOP_Y + 0.004, z, { rot: [0, (x - z) * 0.3, 0], hop: 0.2, from: seatSpot(seatOf(seat), 0.62) });
      });
      opponents(st, v.counts, ctx, seatOf);
    },
  },
  carrom: {
    half: [0.95, 0.95],
    span: 1.95,
    faces: true,
    build(st) {
      const S = SIZE / 2;
      // a real carrom board: polished light ply, double baselines with red end circles, arrows from
      // the corners, the centre rings with a star, and deep pockets; framed by a raised dark wood rail
      st.add(plate(SIZE + 0.14, SIZE + 0.14, (g, w) => {
        const f = w / (SIZE + 0.14);
        const m = 0.07 * f, inner = SIZE * f, U = inner / 2;
        const P = (v) => m + (v + 1) * U;
        // frame (seen under the rails at the corners) and the playing surface with its grain
        g.fillStyle = '#2b1709'; g.fillRect(0, 0, w, w);
        const ply = g.createLinearGradient(m, m, m + inner, m + inner);
        ply.addColorStop(0, '#f3dfb4'); ply.addColorStop(0.5, '#ecd29f'); ply.addColorStop(1, '#e2c38c');
        g.fillStyle = ply; g.fillRect(m, m, inner, inner);
        let seed = 11;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 90; i++) {
          const y = m + rnd() * inner;
          g.strokeStyle = `rgba(150, 100, 40, ${0.03 + rnd() * 0.05})`; g.lineWidth = 1 + rnd() * 2.5;
          g.beginPath(); g.moveTo(m, y);
          for (let x = 0; x <= inner; x += 40) g.lineTo(m + x, y + Math.sin((x + i * 37) / 90) * 4);
          g.stroke();
        }
        // a soft sheen across the middle, like a freshly powdered board
        const sheen = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, U * 1.1);
        sheen.addColorStop(0, 'rgba(255, 250, 235, .35)'); sheen.addColorStop(1, 'rgba(255, 250, 235, 0)');
        g.fillStyle = sheen; g.fillRect(m, m, inner, inner);
        const ink = '#2d1a10', red = '#b3261e';
        // pockets: a dark rim, then the hole fading into the net
        POCKETS.forEach(([x, y]) => {
          const cx = P(x), cy = P(y), r = POCKET_R * U;
          g.fillStyle = '#5a3a1f'; g.beginPath(); g.arc(cx, cy, r * 1.12, 0, TAU); g.fill();
          const hole = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
          hole.addColorStop(0, '#000'); hole.addColorStop(0.75, '#120a05'); hole.addColorStop(1, '#2a1a0d');
          g.fillStyle = hole; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
        });
        // four baselines: two lines with a red circle at each end
        const half = 0.62, gap = STRIKER_R * 0.95, endR = STRIKER_R * 1.05;
        g.lineCap = 'round';
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([ax, ay]) => {
          const along = (t, off) => (ax === 0 ? [P(t), P(ay * CARROM_BASE + off)] : [P(ax * CARROM_BASE + off), P(t)]);
          g.strokeStyle = ink; g.lineWidth = 6;
          [-gap, gap].forEach((off) => { const [x1, y1] = along(-half, off), [x2, y2] = along(half, off); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); });
          [-half, half].forEach((t) => {
            const [cx, cy] = along(t, 0);
            g.fillStyle = red; g.beginPath(); g.arc(cx, cy, endR * U, 0, TAU); g.fill();
            g.lineWidth = 5; g.strokeStyle = ink; g.stroke();
            g.fillStyle = '#f3dfb4'; g.beginPath(); g.arc(cx, cy, endR * U * 0.45, 0, TAU); g.fill();
          });
        });
        // arrows from each corner towards the middle, with the little arc where they stop
        POCKETS.forEach(([x, y]) => {
          const dx = -Math.sign(x), dy = -Math.sign(y);
          const s0 = 0.16, s1 = 0.62;
          const x1 = P(x + dx * s0), y1 = P(y + dy * s0), x2 = P(x + dx * s1), y2 = P(y + dy * s1);
          g.strokeStyle = ink; g.lineWidth = 6;
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
          const a = Math.atan2(y2 - y1, x2 - x1), hl = 0.06 * U;
          g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - 0.5) * hl, y2 - Math.sin(a - 0.5) * hl); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a + 0.5) * hl, y2 - Math.sin(a + 0.5) * hl); g.stroke();
          g.beginPath(); g.arc(x2 + Math.cos(a) * 0.02 * U, y2 + Math.sin(a) * 0.02 * U, 0.09 * U, a + Math.PI * 0.55, a + Math.PI * 1.45, true); g.stroke();
        });
        // the centre: two rings, a red circle and an eight-pointed star
        const C = P(0);
        g.strokeStyle = ink; g.lineWidth = 6;
        g.beginPath(); g.arc(C, C, 0.32 * U, 0, TAU); g.stroke();
        g.beginPath(); g.arc(C, C, 0.29 * U, 0, TAU); g.stroke();
        g.fillStyle = 'rgba(179, 38, 30, .9)';
        g.beginPath();
        for (let i = 0; i < 16; i++) { const r = (i % 2 ? 0.07 : 0.2) * U, t = (i / 16) * TAU - Math.PI / 2; g.lineTo(C + Math.cos(t) * r, C + Math.sin(t) * r); }
        g.closePath(); g.fill(); g.stroke();
        g.fillStyle = red; g.beginPath(); g.arc(C, C, 0.075 * U, 0, TAU); g.fill(); g.stroke();
      }, { color: '#2a1a0c', roughness: 0.38, res: 2048 }));
      // the raised wooden rail round the edge
      const railW = 0.07, railH = 0.035, len = SIZE + 0.14, wood = mat('#3b2010', 0.32, 0.05);
      [[0, -(S + railW / 2), len, railW], [0, S + railW / 2, len, railW], [-(S + railW / 2), 0, railW, SIZE], [S + railW / 2, 0, railW, SIZE]].forEach(([x, z, sx, sz]) => {
        const rail = mesh(box(sx, railH, sz), wood, x, TOP_Y + railH / 2, z);
        rail.castShadow = true; rail.receiveShadow = true;
        st.add(rail);
      });
      st.scale = S;
      st.aimLine = mesh(box(1, 0.003, 0.012), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.8 }));
      st.aimLine.visible = false;
      st.add(st.aimLine);
      st.aimStriker = mesh(cyl(STRIKER_R * S, STRIKER_R * S, 0.024), mat('#fdf5e0', 0.3));
      st.aimStriker.visible = false;
      st.add(st.aimStriker);
    },
    coin(id) {
      const color = id === 'q' ? '#c2185b' : id[0] === 'w' ? '#f5ecd8' : '#2a211c';
      const r = (id === 'S' ? STRIKER_R : COIN_R) * (SIZE / 2);
      return () => carromCoin(id === 'S' ? '#fdf5e0' : color, r, id === 'S');
    },
    draw(st, v) {
      const S = SIZE / 2;
      const place = (state) => {
        st.begin();
        state.coins.forEach(c => st.put(`coin${c.id}`, this.coin(c.id), c.x * S, TOP_Y, c.y * S, { noDrop: true, hop: 0 }));
        st.end();
      };
      // a shot is playing out: the newest state waits until the coins stop
      if (st.playing) { st.latest = v; return; }
      const fresh = v.frames && st.lastShot != null && v.shot !== st.lastShot;
      st.lastShot = v.shot;
      if (!fresh || reduced) { place(v); return; }
      st.latest = v;
      st.aimStriker.visible = false;
      st.aimLine.visible = false;
      const pieces = new Map(st.live.map(p => [p.kind.slice(4), p]));
      const striker = this.coin('S')();
      st.add(striker);
      let f = 0;
      const pocketed = new Set();
      const coinColor = (id) => (id === 'q' ? '#ff4d8a' : id === 'S' ? '#fff3b0' : String(id)[0] === 'w' ? '#fff6dc' : '#5a4434');
      st.playing = (dt) => {
        f += dt * 20;
        if (striker.visible) st.trace(striker.position.x, striker.position.z, '#fff3b0');
        const at = Math.floor(f);
        const a = v.frames[Math.min(v.frames.length - 1, at)];
        const b = v.frames[Math.min(v.frames.length - 1, at + 1)];
        const k = f - at;
        v.ids.forEach((id, i) => {
          const o = id === 'S' ? striker : pieces.get(id)?.obj;
          if (!o) return;
          if (!a[i]) {
            // in the pocket: a burst of its colour where it went down (gold for the queen)
            if (o.visible && !pocketed.has(id)) { pocketed.add(id); st.burst(o.position.x, TOP_Y + 0.03, o.position.z, id === 'q' ? '#ffd23f' : coinColor(id), id === 'q' ? 24 : 12, 0.45); }
            o.visible = false; return;
          }
          const to = b[i] || a[i];
          o.position.set(((a[i][0] + (to[0] - a[i][0]) * k) / 1000) * S, TOP_Y, ((a[i][1] + (to[1] - a[i][1]) * k) / 1000) * S);
        });
        if (f < v.frames.length - 1) return;
        st.playing = null;
        st.world.remove(striker);
        pieces.forEach((p) => { p.obj.visible = true; p.t = 1; });
        place(st.latest);
        st.onShotDone?.();
      };
    },
    /** While aiming: where the striker sits and the line it will take. */
    aim(st, seat, x, angle, power) {
      const S = SIZE / 2, y = (seat === 0 ? CARROM_BASE : -CARROM_BASE);
      st.aimStriker.visible = true;
      st.aimStriker.position.set(x * S, TOP_Y + 0.012, y * S);
      const len = 0.25 + power * 1.1;
      st.aimLine.visible = true;
      st.aimLine.scale.x = len;
      st.aimLine.position.set(x * S + (Math.cos(angle) * len) / 2, TOP_Y + 0.006, y * S + (Math.sin(angle) * len) / 2);
      st.aimLine.rotation.y = -angle;
    },
    aimOff(st) { st.aimStriker.visible = false; st.aimLine.visible = false; },
  },
};

function seatSpot(actorSeat, r) {
  const a = [[-0.75, -0.65], [0.75, -0.65], [0.75, 0.65], [-0.75, 0.65]][actorSeat] || [0, 0];
  return [a[0] * r / 0.75, a[1] * r / 0.65];
}
/** Face-down hands in front of the other players, with a count. */
function opponents(st, counts, ctx, seatOf) {
  counts.forEach((n, seat) => {
    const k = seatOf(seat);
    if (k < 0 || seat === ctx.me) return;
    const [x, z] = seatSpot(k, 0.6);
    for (let i = 0; i < Math.min(5, n); i++) st.put(`hand${seat}.${i}`, () => cardMesh('back', 0.14), x + i * 0.024, TOP_Y + 0.004 + i * 0.004, z, { rot: [Math.PI, 0, 0.05 * (i - 2)], noDrop: true });
    st.put(`cnt${seat}:${n}`, () => textSprite(n, { size: 0.085 }), x, TOP_Y + 0.14, z, { noDrop: true });
  });
}

const FELT = (g, w, h) => { g.fillStyle = '#1d5e3c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 6; g.strokeRect(28, 28, w - 56, h - 56); };
const TRAY = (g, w, h) => { g.fillStyle = '#7b2d26'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,220,170,.3)'; g.lineWidth = 6; g.strokeRect(24, 24, w - 48, h - 48); };

function drawTray(st, def, v, ctx) {
  st.finishThrow?.();
  const dice = def.dice(v);
  dice.forEach((d, i) => {
    const count = dice.length;
    const x = count === 1 ? (st.dieAt?.[0] ?? 0) : ((i + 0.5) / count - 0.5) * 1.15;
    const z = count === 1 ? (st.dieAt?.[1] ?? 0) : d.keep ? 0.3 : -0.08;
    const move = ctx.legal.findIndex(m => m.h === i);
    st.put(`dice${i}`, () => dieMesh(count === 1 ? 0.2 : 0.17), x, TOP_Y + (count === 1 ? 0.1 : 0.085), z, { rot: DIE_TURN[d.v], spin: d.spin, pick: move >= 0 ? move : undefined, noDrop: true });
    if (d.keep) st.mark(x, z, move >= 0 ? move : { none: 1 }, { r: 0.13, color: '#ffe08a', y: TOP_Y + 0.003 });
  });
}

/** The chit games: one sheet of paper on the mat, showing what the table may all read. */
function chitPicture(text, label) {
  return (g, w, h) => {
    g.fillStyle = '#f3ead2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,110,190,.28)'; g.lineWidth = 3;
    for (let y = 80; y < h; y += 52) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.textAlign = 'center';
    if (label) { g.fillStyle = 'rgba(80,55,30,.6)'; g.font = '700 42px system-ui, sans-serif'; g.fillText(label, w / 2, 60); }
    if (!text) return;
    g.fillStyle = '#3a2a18'; g.textBaseline = 'middle';
    const words = String(text).split(/\s+/);
    let size = 110, lines = [];
    for (; size > 26; size -= 4) {
      g.font = `800 ${size}px system-ui, sans-serif`;
      lines = [];
      let line = '';
      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (g.measureText(next).width > w - 90 && line) { lines.push(line); line = word; } else line = next;
      }
      lines.push(line);
      if (lines.length * size * 1.18 < h - 150 && lines.every(l => g.measureText(l).width <= w - 60)) break;
    }
    const top = h / 2 - ((lines.length - 1) * size * 1.18) / 2 + 24;
    lines.forEach((l, i) => g.fillText(l, w / 2, top + i * size * 1.18));
  };
}
function chitDraw(st, info) {
  const text = info?.text || '', label = info?.label || '';
  const W = 1.0, D = 0.7;
  st.put(`paper:${label}:${text}`, () => {
    const m = plate(W, D, chitPicture(text, label), { color: '#d9ccab', thick: 0.008 });
    m.userData.ownTexture = true;
    return group(m);
  }, 0, 0.012, 0.02, { rot: [0, -0.03, 0] });
}

/**
 * The 3D side of one game. draw(view, ctx) makes the board match the state; pickAt(x, y) says what
 * a tap means: a move's number, or null. Returns null if there's no 3D (the panel still works).
 */
export function createBoard(slug, world, ctxHelpers) {
  const story = world?.story;
  if (!story?.boardRoot) return null;
  const def = BOARDS[slug] || { span: 1.5, chit: true };
  const st = new Stage(story.boardRoot);
  if (def.felt) st.add(plate(SIZE, SIZE * 0.9, FELT, { color: '#3a2412' }));
  if (def.tray) st.add(plate(SIZE * 0.86, SIZE * 0.56, TRAY, { color: '#3a2412' }));
  def.build?.(st);
  let last = 0, raf = 0, stop = false;
  const loop = (now) => {
    if (stop) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.12, (now - last) / 1000 || 0.016);
    last = now;
    st.tick(dt);
  };
  raf = requestAnimationFrame(loop);
  return {
    span: def.span,
    get pickIndices() {
      return new Set(st.picks.map(o => o.userData?.pick).filter(Number.isInteger));
    },
    // how far the board reaches from the middle, across and deep: the players sit clear of it
    half: def.half || (def.tray ? [0.75, 0.5] : def.felt ? [0.87, 0.79] : [0.88, 0.88]),
    stage: st,
    def,
    draw(view, ctx, game) {
      st.world.rotation.y = def.faces && ctx.me === 1 ? Math.PI : 0;
      const seatOf = ctxHelpers.seatOf;
      if (def.chit) {
        st.begin();
        chitDraw(st, game.chit ? game.chit(view) : { text: 'ChitPlay', label: '' });
        st.end();
        return;
      }
      if (slug === 'carrom') { def.draw(st, view, ctx); return; }
      st.begin();
      if (def.tray) drawTray(st, def, view, ctx);
      else def.draw.call(def, st, view, ctx, seatOf);
      st.end();
    },
    /** The move number under a tap; selecting a piece redraws and returns null. */
    /** A spot worth pointing at for a new player: the first tappable mark on the board. */
    hintTarget() { return st.picks.find(o => o.visible !== false && o.material?.opacity > 0) || st.picks[0] || null; },
    pickAt(x, y, redraw, ask) {
      const hit = story.boardAt(x, y, st.picks);
      if (hit == null) return null;
      if (typeof hit === 'number') { st.sel = null; return hit; }
      if (hit.sel != null) { st.sel = st.sel === hit.sel ? null : hit.sel; redraw(); return null; }
      if (hit.promote) { ask(hit.promote); return null; }
      return null;
    },
    throwDie: def.throwDie ? (value, hand, done, onRelease) => def.throwDie(st, value, hand, done, onRelease) : null,
    aim(seat, x, a, p) { if (def.aim) def.aim(st, seat, x, a, p); },
    aimOff() { def.aimOff?.(st); },
    get animating() { return !!st.playing; },
    dispose() {
      stop = true;
      cancelAnimationFrame(raf);
      st.dispose();
    },
  };
}
