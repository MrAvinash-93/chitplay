/** What the TV games' 3D views share: materials, lights, textures, the camera over a table. */
import * as THREE from '../../../vendor/three.chitplay.min.js';

export const TAU = Math.PI * 2;
export const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });
export const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
export const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
export function lights(scene, { sky = '#ffffff', ground = '#444444', sun = 1.6 } = {}) {
  scene.add(new THREE.HemisphereLight(sky, ground, 1.3));
  const d = new THREE.DirectionalLight('#ffffff', sun);
  d.position.set(2, 6, 4);
  scene.add(d);
}
/** Meshes reused frame to frame: ask for the i-th one of a kind, hide what wasn't asked for. */
export function pool(scene, make) {
  const list = [];
  let used = 0;
  return {
    begin() { used = 0; },
    next() { if (used >= list.length) { const m = make(); scene.add(m); list.push(m); } const m = list[used++]; m.visible = true; return m; },
    end() { for (let i = used; i < list.length; i++) list[i].visible = false; },
  };
}
export const ease = (a, b, k) => a + (b - a) * k;
/** The short way from angle b to angle a, always in -π..π, however many turns either has made. */
export const turnTo = (a, b) => { let x = (a - b) % TAU; if (x > Math.PI) x -= TAU; else if (x < -Math.PI) x += TAU; return x; };
/** An angle kept in 0..2π, so a shown angle never runs away after many laps. */
export const wrapAngle = (a) => ((a % TAU) + TAU) % TAU;

/* ─── a paper plane, and a winged chit ─── */
export const FLYING_CHIT_PALETTES = {
  classic: { paper: '#fbf3d9', wing: '#ffffff', emissive: '#000000', glow: 0, metalness: 0, roughness: 0.85 },
  blueprint: { paper: '#2468a5', wing: '#9fe8ff', emissive: '#07213b', glow: 0.08, metalness: 0.12, roughness: 0.52 },
  golden: { paper: '#ffd85a', wing: '#fff0a8', emissive: '#9c6a00', glow: 0.18, metalness: 0.68, roughness: 0.24, halo: '#ffdc54' },
  neon: { paper: '#20204b', wing: '#a7fcff', emissive: '#06c8df', glow: 0.72, metalness: 0.24, roughness: 0.3, halo: '#24efff' },
  rose: { paper: '#ffd5e5', wing: '#fff0f6', emissive: '#8b214c', glow: 0.16, metalness: 0.08, roughness: 0.48, halo: '#ff72a8' },
};

export function wingedChit(color, style = 'classic') {
  const grp = new THREE.Group();
  const paper = std('#fbf3d9', { roughness: 0.85 });
  const body = box(0.42, 0.08, 0.3, paper);
  const edge = box(0.46, 0.05, 0.34, basic(color));
  edge.position.y = -0.03;
  const band = box(0.43, 0.02, 0.06, basic(color));
  band.position.y = 0.05;
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.12, 0.42, 0.05, 0.02, 0, 0, 0.14], 3));
  wingGeo.computeVertexNormals();
  const wingMat = std('#ffffff', { side: THREE.DoubleSide, roughness: 0.7 });
  const lw = new THREE.Mesh(wingGeo, wingMat), rw = new THREE.Mesh(wingGeo, wingMat);
  lw.position.x = 0.2; rw.position.x = -0.2; rw.scale.x = -1;
  const eye = basic('#2b2118');
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), eye), e2 = e1.clone();
  e1.position.set(0.07, 0.05, -0.15); e2.position.set(-0.07, 0.05, -0.15);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.014, 5, 28), basic('#ffffff', { transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.rotation.x = Math.PI / 2; halo.position.y = -0.07; halo.visible = false;
  grp.add(halo, edge, body, band, lw, rw, e1, e2);
  grp.scale.setScalar(1.3);
  const applyStyle = (key) => {
    const palette = FLYING_CHIT_PALETTES[key] || FLYING_CHIT_PALETTES.classic;
    paper.color.set(palette.paper);
    paper.emissive.set(palette.emissive);
    paper.emissiveIntensity = palette.glow;
    paper.metalness = palette.metalness;
    paper.roughness = palette.roughness;
    wingMat.color.set(palette.wing);
    wingMat.emissive.set(palette.emissive);
    wingMat.emissiveIntensity = palette.glow * 0.55;
    halo.visible = !!palette.halo;
    halo.material.color.set(palette.halo || color);
  };
  grp.userData = { wings: [lw, rw], applyStyle };
  applyStyle(style);
  return grp;
}

/* ─── board-like games seen from above at an angle: ship fight, gully rally, hungry snake ─── */
export function tableCamera(camera, y = 5.1, z = 4.3) { camera.position.set(0, y, z); camera.lookAt(0, 0, 0.35); }
export const toX = (x) => (x - 320) / 100, toZ = (y) => (y - 221) / 100;
