/**
 * Turbo Tunnel in 3D: race cars on the inside of a lit road tunnel. The camera rides behind the car
 * on this phone and turns with it, so its road is always the floor. Everything that can be hit is
 * drawn exactly as wide as the rules see it (a hair wider for the cars), so what you see is what hits.
 *
 * Placement: a "holder" group turned to an angle round the tunnel has its +y pointing at the middle
 * of the tunnel and its z along it, so anything put on its floor (y = -R) stands on the tunnel wall.
 */
import * as THREE from '../../vendor/three.chitplay.min.js';
import { SEAT_COLORS, TICK } from './lib.js?v=20261114-1515';
import { AHEAD, KINDS, gateAt, speedAt, touches, zOf } from './turbo-tunnel.js?v=20261114-1515';

const TAU = Math.PI * 2;
const R = 3, PZ = -1.2;
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });
const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
const glow = (color, opacity = 0.5) => basic(color, { transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const turnTo = (a, b) => { let x = (a - b) % TAU; if (x > Math.PI) x -= TAU; else if (x < -Math.PI) x += TAU; return x; };
const wrapAngle = (a) => ((a % TAU) + TAU) % TAU;
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function pool(scene, make) {
  const list = [];
  let used = 0;
  return {
    begin() { used = 0; },
    next() { if (used >= list.length) { const m = make(); scene.add(m); list.push(m); } const m = list[used++]; m.visible = true; return m; },
    end() { for (let i = used; i < list.length; i++) list[i].visible = false; },
  };
}
/** A group turned to angle a round the tunnel, holding one thing on the tunnel floor there. */
function holder(child, lift = 0) {
  const g = new THREE.Group();
  child.position.y = -R + lift;
  g.add(child);
  g.userData.child = child;
  return g;
}
const place = (g, a, z) => { g.rotation.z = a + Math.PI / 2; g.position.z = z; return g; };

// every level has its own light: sodium lamps, cool white, amber, magenta lasers, dust, neon night
const MOODS = [
  { bg: '#06080f', tube: '#9aa3b5', lamp: '#ffd998' },
  { bg: '#060a14', tube: '#8b9ab8', lamp: '#cfe8ff' },
  { bg: '#100709', tube: '#ad958f', lamp: '#ffb27a' },
  { bg: '#0b0520', tube: '#7a73ad', lamp: '#ff6bd8' },
  { bg: '#140d06', tube: '#a89070', lamp: '#ffcf6b' },
  { bg: '#02101a', tube: '#5a8eac', lamp: '#62f3ff' },
];
const TRAFFIC = ['#e9eef5', '#2b2f36', '#c0392b', '#2e86c1', '#f1c40f', '#7f8c8d'];
const TRUCKS = ['#e67e22', '#16a085', '#8e44ad'];

/** The pool of light a headlight throws on the road: bright at the car, fading out ahead and to the sides. */
let beamTexture = null;
const beamTex = () => beamTexture || (beamTexture = canvasTex(64, 128, (g, w, h) => {
  const fade = g.createLinearGradient(0, h, 0, 0);
  fade.addColorStop(0, 'rgba(255,255,255,.9)'); fade.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = fade; g.beginPath(); g.moveTo(w * 0.3, h); g.lineTo(0, 0); g.lineTo(w, 0); g.lineTo(w * 0.7, h); g.fill();
}));
/** A low sports car: forward is -z, its wheels on y = 0. */
function raceCar(color, { lamps = '#fff3c4', oncoming = false } = {}) {
  const g = new THREE.Group();
  const paint = std(color, { roughness: 0.25, metalness: 0.5 });
  const trim = std('#16181d', { roughness: 0.6 });
  const glass = std('#a9dcff', { roughness: 0.06, metalness: 0.4, transparent: true, opacity: 0.75 });
  const body = box(0.58, 0.16, 1.2, paint); body.position.y = 0.18;
  const nose = box(0.54, 0.09, 0.32, paint); nose.position.set(0, 0.15, -0.72); nose.rotation.x = 0.12;
  const skirt = box(0.62, 0.05, 1.3, trim); skirt.position.y = 0.1;
  const cabin = box(0.44, 0.15, 0.56, paint); cabin.position.set(0, 0.33, 0.06);
  const screen = box(0.42, 0.13, 0.02, glass); screen.position.set(0, 0.33, -0.24); screen.rotation.x = -0.5;
  const back = box(0.42, 0.11, 0.02, glass); back.position.set(0, 0.33, 0.35); back.rotation.x = 0.45;
  const sides = [-1, 1].map((k) => { const s = box(0.012, 0.09, 0.42, glass); s.position.set(k * 0.222, 0.34, 0.05); return s; });
  const stripe = box(0.12, 0.006, 1.22, basic('#ffffff')); stripe.position.set(0, 0.263, 0);
  const wing = box(0.6, 0.025, 0.14, trim); wing.position.set(0, 0.4, 0.56);
  const posts = [-1, 1].map((k) => { const p = box(0.03, 0.12, 0.05, trim); p.position.set(k * 0.2, 0.32, 0.56); return p; });
  const lampMat = basic(lamps), tailMat = basic('#ff2a2a');
  const heads = [-1, 1].map((k) => { const l = box(0.12, 0.04, 0.02, lampMat); l.position.set(k * 0.19, 0.17, -0.885); return l; });
  const tails = [-1, 1].map((k) => { const l = box(0.14, 0.04, 0.02, tailMat); l.position.set(k * 0.19, 0.2, 0.605); return l; });
  const tyre = new THREE.CylinderGeometry(0.115, 0.115, 0.09, 14), tyreMat = std('#0d0d0d', { roughness: 0.9 }), rim = std('#c9ced6', { metalness: 0.8, roughness: 0.3 });
  const wheels = [[-0.3, -0.42], [0.3, -0.42], [-0.3, 0.4], [0.3, 0.4]].map(([x, z]) => {
    const w = new THREE.Group();
    const t = new THREE.Mesh(tyre, tyreMat); t.rotation.z = Math.PI / 2;
    const r = box(0.092, 0.1, 0.1, rim);
    w.add(t, r); w.position.set(x, 0.115, z);
    return w;
  });
  // the beam of the headlights on the road ahead, and the nitro flames out of the back
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.4), basic(lamps, { map: beamTex(), transparent: true, opacity: oncoming ? 0.55 : 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.rotation.x = -Math.PI / 2; beam.position.set(0, 0.02, -2.0);
  const flameMat = glow('#5ff3ff', 0.85);
  const flames = [-1, 1].map((k) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.42, 8), flameMat); f.rotation.x = Math.PI / 2; f.position.set(k * 0.14, 0.14, 0.86); f.visible = false; return f; });
  g.add(body, nose, skirt, cabin, screen, back, ...sides, stripe, wing, ...posts, ...heads, ...tails, ...wheels, beam, ...flames);
  if (oncoming) g.rotation.y = Math.PI;
  g.userData = { wheels, flames, paint, beam };
  return g;
}
/** A box truck: cab in front, a tall trailer behind, about three times a car's length. */
function truck(color) {
  const g = new THREE.Group();
  const paint = std(color, { roughness: 0.4, metalness: 0.2 });
  const trailer = box(0.66, 0.66, 2.3, std('#e8e6e1', { roughness: 0.7 })); trailer.position.set(0, 0.52, 0.42);
  const band = box(0.67, 0.12, 2.31, paint); band.position.set(0, 0.42, 0.42);
  const cab = box(0.64, 0.5, 0.7, paint); cab.position.set(0, 0.42, -1.12);
  const glass = box(0.56, 0.18, 0.02, std('#a9dcff', { roughness: 0.1, metalness: 0.4 })); glass.position.set(0, 0.56, -1.475);
  const tails = [-1, 1].map((k) => { const t = box(0.1, 0.06, 0.02, basic('#ff2a2a')); t.position.set(k * 0.26, 0.24, 1.575); return t; });
  const tyre = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 12), tyreMat = std('#0d0d0d', { roughness: 0.9 });
  const wheels = [-1.2, -0.1, 0.9, 1.25].flatMap(z => [-1, 1].map((k) => { const w = new THREE.Mesh(tyre, tyreMat); w.rotation.z = Math.PI / 2; w.position.set(k * 0.32, 0.13, z); return w; }));
  g.add(trailer, band, cab, glass, ...tails, ...wheels);
  return g;
}
/**
 * A curved slab: the part of the tunnel's cross-section between two radii, from angle -hw to +hw, and
 * depth long. Group 0 is its front and back (the faces you drive at), group 1 its top and ends.
 */
function annularPrism(hw, rIn, rOut, depth) {
  const segs = Math.max(3, Math.ceil(hw * 24));
  const pos = [], uv = [], idx = [], z0 = -depth / 2, z1 = depth / 2;
  const v = (x, y, z, u, w) => { pos.push(x, y, z); uv.push(u, w); return pos.length / 3 - 1; };
  const front = [], back = [];
  // front and back faces: a fan of quads between the two radii; their uv is the face's own x, y
  for (const [z, list] of [[z1, front], [z0, back]]) {
    for (let k = 0; k <= segs; k++) {
      const a = -hw + (2 * hw * k) / segs, c = Math.cos(a), s = Math.sin(a);
      list.push([v(c * rIn, s * rIn, z, c * rIn / 1.2, s * rIn / 1.2), v(c * rOut, s * rOut, z, c * rOut / 1.2, s * rOut / 1.2)]);
    }
  }
  for (let k = 0; k < segs; k++) {
    const [a0, b0] = front[k], [a1, b1] = front[k + 1];
    idx.push(a0, b0, a1, b0, b1, a1);          // facing +z, towards the driver
    const [c0, d0] = back[k], [c1, d1] = back[k + 1];
    idx.push(c0, c1, d0, d0, c1, d1);          // facing -z
  }
  const caps = idx.length;
  // the top (inner curve, facing the middle of the tunnel) and the two ends
  const top = [];
  for (let k = 0; k <= segs; k++) {
    const a = -hw + (2 * hw * k) / segs, c = Math.cos(a), s = Math.sin(a);
    top.push([v(c * rIn, s * rIn, z0, k / segs, 0), v(c * rIn, s * rIn, z1, k / segs, 1)]);
  }
  for (let k = 0; k < segs; k++) { const [p0, q0] = top[k], [p1, q1] = top[k + 1]; idx.push(p0, q0, p1, q0, q1, p1); }
  for (const a of [-hw, hw]) {
    const c = Math.cos(a), s = Math.sin(a), flip = a > 0;
    const i0 = v(c * rIn, s * rIn, z0, 0, 0), i1 = v(c * rOut, s * rOut, z0, 1, 0), i2 = v(c * rIn, s * rIn, z1, 0, 1), i3 = v(c * rOut, s * rOut, z1, 1, 1);
    if (flip) idx.push(i0, i2, i1, i1, i2, i3); else idx.push(i0, i1, i2, i1, i3, i2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.addGroup(0, caps, 0);
  geo.addGroup(caps, idx.length - caps, 1);
  geo.computeVertexNormals();
  return geo;
}
/** A barrier: a slab of the tunnel's cross-section, exactly as wide (as an angle) as the rules say. */
const arcGeos = new Map();
function arcSlab(hw, depth, height) {
  const key = `${hw.toFixed(3)}|${depth}|${height}`;
  if (!arcGeos.has(key)) arcGeos.set(key, annularPrism(hw, R - height, R * 0.998, depth));
  return arcGeos.get(key);
}
/** The laser wall of a gate: everything round the tunnel except the gap (the gap is at angle 0). */
const gateGeos = new Map();
function gateGeo(w) {
  const key = w.toFixed(3);
  if (!gateGeos.has(key)) {
    const len = TAU - 2 * w;
    const sheet = annularPrism(Math.PI - w, R * 0.5, R * 0.995, 0.04);
    sheet.rotateZ(Math.PI);
    gateGeos.set(key, { sheet, edge: new THREE.TorusGeometry(R * 0.97, 0.05, 6, 64, len) });
  }
  return gateGeos.get(key);
}

export function turboView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(MOODS[0].bg);
  scene.fog = new THREE.Fog(MOODS[0].bg, 18, 66);
  const camera = new THREE.PerspectiveCamera(68, 1.6, 0.1, 140);
  scene.add(new THREE.HemisphereLight('#ffffff', '#30384a', 1.25));
  const key = new THREE.DirectionalLight('#ffffff', 0.8); key.position.set(0, 0, 5); scene.add(key);

  // the tunnel: concrete panels round it, a solid line along each lane, and tiled kerbs where lanes meet
  const tubeTex = canvasTex(1024, 64, (g, w, h) => {
    const lanes = 8, lw = w / lanes;
    for (let k = 0; k < lanes; k++) {
      const shade = g.createLinearGradient(k * lw, 0, (k + 1) * lw, 0);
      shade.addColorStop(0, '#3d424a'); shade.addColorStop(0.5, '#4d535c'); shade.addColorStop(1, '#383c44');
      g.fillStyle = shade; g.fillRect(k * lw, 0, lw, h);
      g.fillStyle = 'rgba(255,255,255,.04)';
      for (let q = 0; q < 40; q++) g.fillRect(k * lw + ((q * 37) % lw), (q * 13) % h, 2, 2);
      g.fillStyle = '#f2f2ea'; g.fillRect(k * lw - 2, 0, 4, h);
    }
  }, [1, 1]);
  const tubeMat = basic('#ffffff', { map: tubeTex, side: THREE.BackSide });
  tubeMat.color.set(MOODS[0].tube);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 150, 64, 1, true), tubeMat);
  tube.rotation.x = Math.PI / 2; tube.position.z = -60;
  scene.add(tube);
  // dashes down the middle of each lane: they rush past and give the speed
  const dashMat = basic('#fff7d6');
  const dashes = pool(scene, () => holder(box(0.05, 0.01, 1.1, dashMat), 0.004));
  // rings of lamps along the roof and the walls
  const lampMat = basic(MOODS[0].lamp);
  const ringMat = glow(MOODS[0].lamp, 0.28);
  const lamps = pool(scene, () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(R * 0.992, 0.035, 4, 72), ringMat));
    for (let k = 0; k < 8; k++) {
      const a = (k + 0.5) * TAU / 8;
      const l = box(0.34, 0.05, 0.12, lampMat); l.position.set(Math.cos(a) * (R - 0.03), Math.sin(a) * (R - 0.03), 0); l.rotation.z = a + Math.PI / 2;
      g.add(l);
    }
    return g;
  });
  // overhead signs with our name, hanging from the roof above your car
  const signTex = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = '#0d3b2e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f2f2ea'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#ffffff'; g.font = '900 62px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('CHITPLAY', w / 2, h / 2 - 12);
    g.font = '700 26px system-ui, sans-serif'; g.fillStyle = '#ffd23f';
    g.fillText('chitplay.com · Turbo Tunnel', w / 2, h / 2 + 34);
  });
  const signs = pool(scene, () => {
    const g = new THREE.Group();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), basic('#ffffff', { map: signTex }));
    const arm = box(0.05, 0.6, 0.05, std('#555b66')); arm.position.y = 0.55;
    g.add(face, arm);
    return g;
  });

  // what's on the road
  const coneMat = std('#ff7a1a', { roughness: 0.5, emissive: '#5a2000' }), coneBand = basic('#ffffff');
  const cones = pool(scene, () => {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 14), coneMat); c.position.y = 0.3;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.135, 0.07, 14), coneBand); band.position.y = 0.33;
    const foot = box(0.42, 0.04, 0.42, std('#222')); foot.position.y = 0.02;
    g.add(c, band, foot);
    return holder(g);
  });
  const stripeTex = canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d62828';
    for (let k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32 + 16, 0); g.lineTo(k * 32 + 16 + h, h); g.lineTo(k * 32 + h, h); g.fill(); }
  }, [2.5, 2.5]);
  const barrierMats = [std('#ffffff', { map: stripeTex, roughness: 0.45, emissive: '#2a0000' }), std('#c02424', { roughness: 0.5, emissive: '#300000' })];
  const barriers = pool(scene, () => new THREE.Mesh(arcSlab(0.3, 0.6, 0.62), barrierMats));
  const blink = basic('#ffcc33');
  const barrierLamps = pool(scene, () => holder(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), blink), 0.68));
  const carPools = TRAFFIC.map(c => pool(scene, () => holder(raceCar(c))));
  const oncomingPool = pool(scene, () => holder(raceCar('#f5f5f0', { lamps: '#ffffff', oncoming: true })));
  const truckPools = TRUCKS.map(c => pool(scene, () => holder(truck(c))));
  const rockMat = std('#7a5c3e', { roughness: 0.95, flatShading: true });
  const rocks = pool(scene, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7, 5), rockMat); m.scale.set(1, 0.82, 1.1); return m; });
  const warnMat = glow('#ff3030', 0.55);
  const warns = pool(scene, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 4, 28), warnMat); m.rotation.x = -Math.PI / 2; return holder(m, 0.03); });
  const oilMat = std('#0b0b0d', { roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.92 });
  const oils = pool(scene, () => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 24), oilMat); m.rotation.x = -Math.PI / 2; return holder(m, 0.012); });
  const boostTex = canvasTex(64, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#3ff2ff';
    for (let k = 0; k < 3; k++) { const y = 10 + k * 40; g.beginPath(); g.moveTo(4, y + 30); g.lineTo(w / 2, y); g.lineTo(w - 4, y + 30); g.lineTo(w - 16, y + 34); g.lineTo(w / 2, y + 14); g.lineTo(16, y + 34); g.fill(); }
  });
  const boostMat = basic('#ffffff', { map: boostTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const boosts = pool(scene, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.3), boostMat); m.rotation.x = -Math.PI / 2; return holder(m, 0.015); });
  const shieldMat = std('#7dff8a', { emissive: '#1f8a33', metalness: 0.3, roughness: 0.2 });
  const shields = pool(scene, () => holder(new THREE.Mesh(new THREE.OctahedronGeometry(0.24), shieldMat), 0.5));
  const coinMat = std('#ffd23f', { metalness: 0.75, roughness: 0.25, emissive: '#5a4200' });
  const coins = pool(scene, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 18), coinMat); m.rotation.x = Math.PI / 2; return holder(m, 0.42); });
  const gateSheetMat = glow('#ff2a55', 0.22), gateEdgeMat = glow('#ff6b8a', 0.95);
  const gates = pool(scene, () => { const g = new THREE.Group(); const sheet = new THREE.Mesh(gateGeo(0.5).sheet, gateSheetMat); const edge = new THREE.Mesh(gateGeo(0.5).edge, gateEdgeMat); g.add(sheet, edge); g.userData = { sheet, edge }; return g; });
  // the racing line: faint arrows on the road through each row's sure way
  const lineTex = canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, 46); g.lineTo(w / 2, 18); g.lineTo(w - 10, 46); g.stroke(); });
  const lineMat = basic('#9dffb0', { map: lineTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = pool(scene, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), lineMat); m.rotation.x = -Math.PI / 2; return holder(m, 0.02); });
  // the next thing your car would hit glows red underneath
  const dangerMat = glow('#ff2020', 0.5);
  const dangers = pool(scene, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), dangerMat); m.rotation.x = -Math.PI / 2; return holder(m, 0.03); });

  // the players' cars, a shield bubble, and sparks
  const cars = [], shown = [];
  const bubbleMat = glow('#7dff8a', 0.22);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 12), bubbleMat);
  bubble.scale.set(0.8, 0.6, 1.25);
  scene.add(bubble);
  const sparks = [];
  const spark = pool(scene, () => new THREE.Mesh(new THREE.OctahedronGeometry(0.05), basic('#ffffff', { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const burst = (x, y, z, color, n = 16, speed = 2) => { for (let q = 0; q < n; q++) { const a = (q / n) * TAU; sparks.push({ x, y, z, vx: Math.cos(a) * speed * (0.6 + Math.random() * 0.6), vy: Math.sin(a) * speed * (0.6 + Math.random() * 0.6), vz: 1 + Math.random() * 2, life: 0.7, color }); } };
  const streakMat = glow('#ffffff', 0);
  const streaks = Array.from({ length: 26 }, (_, i) => { const m = box(0.02, 0.02, 3, streakMat); m.userData = { a: (i / 26) * TAU + (i % 3) * 0.17, z: -((i * 6.1) % 60) }; scene.add(m); return m; });

  let dShown = null, aCam = null, shake = 0, fov = 68;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0, focus = 0) {
      if (!s.cars[focus]) focus = 0;
      const sp = speedAt(s.d);
      if (dShown == null || Math.abs(s.d - dShown) > 4) dShown = s.d;
      dShown += sp * dt;
      dShown += (s.d + sp * TICK * alpha - dShown) * (1 - Math.exp(-dt * 10));
      const d = dShown, tNow = s.t + alpha;
      const Zw = (z) => -(z - d) + PZ;
      // the level's light, blended in
      const mood = MOODS[Math.min(MOODS.length, s.level || 1) - 1];
      const k = 1 - Math.exp(-dt * 1.5);
      scene.background.lerp(want.set(mood.bg), k);
      scene.fog.color.copy(scene.background);
      tubeMat.color.lerp(want.set(mood.tube), k);
      lampMat.color.lerp(want.set(mood.lamp), k);
      ringMat.color.copy(lampMat.color);

      dashes.begin();
      for (let q = 0; q < 14; q++) {
        const z = Zw(Math.floor(d / 5) * 5 + q * 5);
        for (let l = 0; l < 8; l++) place(dashes.next(), (l + 0.5) * TAU / 8, z);
      }
      dashes.end();
      lamps.begin();
      for (let q = 0; q < 12; q++) lamps.next().position.z = Zw(Math.floor(d / 7) * 7 + q * 7);
      lamps.end();

      const me = s.cars[focus];
      const meA = me ? me.a + (me.alive ? me.w * TICK * alpha : 0) : -Math.PI / 2;
      // the camera's angle round the tunnel, smoothed: signs hang from the roof above it
      signs.begin();
      if (aCam != null) for (let q = 0; q < 2; q++) {
        const z = Math.floor(d / 90) * 90 + 60 + q * 90;
        if (z - d > AHEAD + 10) continue;
        const sg = signs.next(); const up = aCam + Math.PI;
        sg.position.set(Math.cos(up) * (R - 0.75), Math.sin(up) * (R - 0.75), Zw(z));
        sg.rotation.set(0, 0, aCam + Math.PI / 2);
      }
      signs.end();

      // everything on the road
      [cones, barriers, barrierLamps, oncomingPool, rocks, warns, oils, boosts, shields, gates, dangers, ...carPools, ...truckPools].forEach(p => p.begin());
      const nextHit = me?.alive ? s.obs.filter(o => KINDS[o.k].lethal && o.z > s.d && o.z - s.d < 26 && touches(o, meA, o.z)).sort((u, v) => u.z - v.z)[0] : null;
      for (const o of s.obs) {
        const zNow = zOf(o, d), dz = zNow - d;
        if (dz > AHEAD + 20 || dz < -4) continue;
        const z = Zw(zNow);
        if (o.k === 'cone') place(cones.next(), o.c, z);
        else if (o.k === 'barrier') {
          const m = barriers.next(); m.geometry = arcSlab(o.w || KINDS.barrier.hw, 0.6, 0.62); m.rotation.set(0, 0, o.c); m.position.z = z;
          const lit = Math.floor(tNow / 20) % 2 === 0;
          if (lit) { place(barrierLamps.next(), o.c - (o.w || 0.3) * 0.7, z); place(barrierLamps.next(), o.c + (o.w || 0.3) * 0.7, z); }
        } else if (o.k === 'car') { const m = place(carPools[(o.tint || 0) % carPools.length].next(), o.c, z); m.userData.child.userData.wheels.forEach(w => { w.rotation.x -= dt * 9; }); }
        else if (o.k === 'oncoming') place(oncomingPool.next(), o.c, z);
        else if (o.k === 'truck') place(truckPools[(o.tint || 0) % truckPools.length].next(), o.c, z);
        else if (o.k === 'rock') {
          // it falls from the roof as you come: a red ring shows where it will land
          const fall = Math.max(0, Math.min(1, (34 - dz) / 14));
          const r = (R - 0.42) * (0.25 + 0.75 * fall * fall);
          const m = rocks.next(); m.position.set(Math.cos(o.c) * r, Math.sin(o.c) * r, z); m.rotation.set(tNow * 0.03 * (1 - fall), o.z, tNow * 0.02 * (1 - fall));
          if (fall < 1) place(warns.next(), o.c, z).userData.child.scale.setScalar(1 + Math.sin(tNow * 0.4) * 0.15);
        } else if (o.k === 'oil') { const m = place(oils.next(), o.c, z); m.userData.child.scale.set((o.w || KINDS.oil.hw) * R, KINDS.oil.len / 2, 1); }
        else if (o.k === 'boost') place(boosts.next(), o.c, z);
        else if (o.k === 'shield') { const m = place(shields.next(), o.c, z); m.userData.child.rotation.set(tNow * 0.05, tNow * 0.07, 0); }
        else if (o.k === 'gate') {
          const g = gates.next(), geo = gateGeo(o.w);
          g.userData.sheet.geometry = geo.sheet; g.userData.edge.geometry = geo.edge;
          g.userData.edge.rotation.z = o.w;
          g.rotation.set(0, 0, gateAt(o, d)); g.position.z = z;
          gateSheetMat.opacity = 0.18 + Math.sin(tNow * 0.5) * 0.06;
        }
        if (o === nextHit) {
          const m = place(dangers.next(), o.k === 'gate' ? meA : o.c, z);
          const wide = o.k === 'gate' ? 0.5 : (o.w || KINDS[o.k].hw) * 2 * R;
          m.userData.child.scale.set(wide, KINDS[o.k].len + 0.6, 1);
          dangerMat.opacity = Math.floor(tNow / 6) % 2 ? 0.55 : 0.25;
        }
      }
      [cones, barriers, barrierLamps, oncomingPool, rocks, warns, oils, boosts, shields, gates, dangers, ...carPools, ...truckPools].forEach(p => p.end());
      // coins, and the racing line (clearest in the first levels, while you learn to read the tunnel)
      coins.begin();
      s.items.forEach((c) => { const m = place(coins.next(), c.c, Zw(c.z)); m.userData.child.rotation.z = tNow * 0.15; });
      coins.end();
      lines.begin();
      lineMat.opacity = (s.level || 1) <= 2 ? 0.5 : 0.28;
      (s.path || []).forEach(([z, a]) => { if (z > s.d + 2) { place(lines.next(), a, Zw(z - 2.2)); place(lines.next(), a, Zw(z - 3.2)); } });
      lines.end();

      // the players' cars: the one on this phone exactly where the rules have it, the others eased
      s.cars.forEach((p, i) => {
        if (!cars[i]) { cars[i] = holder(raceCar(SEAT_COLORS[i])); scene.add(cars[i]); shown[i] = { a: p.a, alive: p.alive, coins: p.coins, roll: 0 }; }
        const v = shown[i], m = cars[i], car = m.userData.child;
        const ta = p.a + (p.alive ? p.w * TICK * alpha : 0);
        if (i === focus && p.alive) v.a = wrapAngle(ta);
        else v.a = wrapAngle(v.a + turnTo(ta, v.a) * (1 - Math.exp(-dt * 20)));
        place(m, v.a, PZ);
        // leaning into the turn, a wobble on oil, a spin and a flip when it crashes
        if (p.alive) { car.rotation.set(0, -p.w * 0.08 + (p.slip > 0 ? Math.sin(tNow * 0.6) * 0.25 : 0), -p.w * 0.05); v.roll = 0; }
        else { v.roll = Math.min(Math.PI, v.roll + dt * 6); car.rotation.set(v.roll * 0.3, v.roll * 1.5, v.roll); }
        car.userData.wheels.forEach((w) => { w.rotation.x -= dt * (p.alive ? sp * 2 : 0); });
        car.userData.flames.forEach((f) => { f.visible = p.alive && p.nitro > 0; f.scale.set(1, 0.8 + Math.random() * 0.5, 1); });
        m.visible = p.alive ? !(p.safeT > 0 && Math.floor(tNow / 4) % 2) : true;
        const wx = Math.cos(v.a) * (R - 0.3), wy = Math.sin(v.a) * (R - 0.3);
        if (p.coins > v.coins) burst(wx, wy, PZ - 0.4, '#ffe066', 12, 1.6);
        if (v.alive && !p.alive) { burst(wx, wy, PZ - 0.6, '#ff8a3d', 26, 3); burst(wx, wy, PZ - 0.6, '#ffffff', 10, 2); if (i === focus) shake = 0.5; }
        v.alive = p.alive; v.coins = p.coins;
        if (i === focus) {
          bubble.visible = p.alive && (p.shield || p.safeT > 0);
          bubble.position.set(Math.cos(v.a) * (R - 0.32), Math.sin(v.a) * (R - 0.32), PZ);
          bubble.rotation.z = v.a + Math.PI / 2;
          bubbleMat.opacity = p.shield ? 0.22 + Math.sin(tNow * 0.3) * 0.06 : 0.12;
        }
      });

      spark.begin();
      for (let q = sparks.length - 1; q >= 0; q--) {
        const p = sparks[q];
        p.life -= dt;
        if (p.life <= 0) { sparks.splice(q, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const m = spark.next(); m.position.set(p.x, p.y, p.z); m.scale.setScalar(p.life * 2.2); m.material.opacity = Math.min(1, p.life * 2); m.material.color.set(p.color);
      }
      spark.end();
      const nitro = me?.alive && me.nitro > 0;
      const fast = Math.max(0, (sp - 18) / 18) + (nitro ? 0.6 : 0);
      streakMat.opacity = Math.min(0.6, fast * 0.45);
      streaks.forEach((m) => { const u = m.userData; u.z += sp * dt * (nitro ? 2.2 : 1.5); if (u.z > 5) u.z -= 62; m.visible = fast > 0.03; m.position.set(Math.cos(u.a) * R * 0.9, Math.sin(u.a) * R * 0.9, u.z); });

      // a chase camera behind and above the car, turned so its road is the floor
      const myA = shown[focus]?.a ?? -Math.PI / 2;
      if (aCam == null) aCam = myA;
      aCam = wrapAngle(aCam + turnTo(myA, aCam) * (1 - Math.exp(-dt * 7)));
      shake = Math.max(0, shake - dt);
      const lift = R - 1.45, sx = shake ? Math.sin(tNow * 2.3) * shake * 0.3 : 0;
      camera.up.set(-Math.cos(aCam), -Math.sin(aCam), 0);
      camera.position.set(Math.cos(aCam) * lift + sx, Math.sin(aCam) * lift, PZ + 3.1);
      camera.lookAt(Math.cos(aCam) * (R - 1.9), Math.sin(aCam) * (R - 1.9), PZ - 7);
      const wantFov = 66 + Math.min(10, (sp - 14) * 0.45) + (nitro ? 8 : 0);
      if (Math.abs(wantFov - fov) > 0.05) { fov += (wantFov - fov) * (1 - Math.exp(-dt * 3)); camera.fov = fov; camera.updateProjectionMatrix(); }
    },
  };
}
