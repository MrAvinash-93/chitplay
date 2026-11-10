/**
 * The TV games in 3D. Each view builds a small scene once and moves things in it to match the game's
 * state; the game's rules never know it exists. A view returns { scene, camera, update(s, dt) }.
 * Light on purpose: no shadows, few lights, shared materials, simple shapes.
 */
import * as THREE from '../../vendor/three.chitplay.min.js';
import { SEAT_COLORS, TICK } from './lib.js?v=20261110-1351';
import { GRAZE as FLY_GRAZE, placeAt, speedAt } from './flying-chit.js?v=20261110-1351';
import { AHEAD as TUNNEL_AHEAD, blocks as tunnelBlocks, speedAt as tunnelSpeed } from './tunnel-race.js?v=20261110-1351';
import { CX as BULL_CX, CY as BULL_CY } from './bull-fight.js?v=20261110-1351';
import { COLS as SNAKE_COLS, ROWS as SNAKE_ROWS } from './hungry-snake.js?v=20261110-1351';
import { G as HOOP_G, MAX as HOOP_MAX } from './hoop-flick.js?v=20261110-1351';
import { ALTAR as GHOST_ALTAR, CORRIDOR_Y as GHOST_CORRIDOR, DOOR as GHOST_DOOR, RAGE as GHOST_RAGE, roomX as GHOST_ROOMX } from './ghost-hostel.js?v=20261110-1351';
import { W as HOOP_W, H as HOOP_H } from './lib.js?v=20261110-1351';

const TAU = Math.PI * 2;
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });
const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function lights(scene, { sky = '#ffffff', ground = '#444444', sun = 1.6 } = {}) {
  scene.add(new THREE.HemisphereLight(sky, ground, 1.3));
  const d = new THREE.DirectionalLight('#ffffff', sun);
  d.position.set(2, 6, 4);
  scene.add(d);
}
/** Meshes reused frame to frame: ask for the i-th one of a kind, hide what wasn't asked for. */
function pool(scene, make) {
  const list = [];
  let used = 0;
  return {
    begin() { used = 0; },
    next() { if (used >= list.length) { const m = make(); scene.add(m); list.push(m); } const m = list[used++]; m.visible = true; return m; },
    end() { for (let i = used; i < list.length; i++) list[i].visible = false; },
  };
}
const ease = (a, b, k) => a + (b - a) * k;

/* ─── a paper plane, and a winged chit ─── */
function paperPlane(color) {
  const g = new THREE.BufferGeometry();
  // nose at -z: two wings and a keel, folded paper
  const v = [0, 0, -0.5, -0.42, 0.02, 0.32, 0, 0.06, 0.32, 0, 0, -0.5, 0, 0.06, 0.32, 0.42, 0.02, 0.32, 0, 0, -0.5, 0, -0.14, 0.3, 0, 0.06, 0.32];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, std('#fbf6e8', { side: THREE.DoubleSide, roughness: 0.8 }));
  const stripe = box(0.05, 0.012, 0.6, basic(color));
  stripe.position.set(0, 0.05, 0);
  const grp = new THREE.Group();
  grp.add(m, stripe);
  return grp;
}
function wingedChit(color) {
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
  grp.add(edge, body, band, lw, rw, e1, e2);
  grp.scale.setScalar(1.3);
  grp.userData.wings = [lw, rw];
  return grp;
}

/* ─── Tunnel Race: a glowing paper tunnel that turns round you ─── */
// each level has its own colours: the tunnel, the air, the walls and the safe way through
const TUNNEL_MOODS = [
  { bg: '#0b1426', tube: '#4a6fae', ring: '#9fd0ff', wall: '#e0455a', gap: '#f39c34' },   // paper blue
  { bg: '#160b26', tube: '#7553a8', ring: '#e2b8ff', wall: '#ff4f7a', gap: '#ffb03b' },   // purple night
  { bg: '#04201f', tube: '#2f8f87', ring: '#a6fff3', wall: '#ff5d5d', gap: '#ffd23f' },   // teal
  { bg: '#26100a', tube: '#b8662f', ring: '#ffd7a8', wall: '#ff3b3b', gap: '#ffe066' },   // spin cycle: hot
];
function tunnelView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(TUNNEL_MOODS[0].bg);
  scene.fog = new THREE.Fog(TUNNEL_MOODS[0].bg, 14, 56);
  const camera = new THREE.PerspectiveCamera(72, 1.6, 0.1, 120);
  camera.position.set(0, 0, 4.2);
  const R = 3, PZ = -1.2, PR = R * 0.74;
  // the tunnel: light paper with folds and grid lines, tinted by the level's colour
  const tex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#b9c2d0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d9e0ea'; g.fillRect(0, 0, w, h / 2);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 2); g.lineTo(w, 2); g.stroke();
    g.strokeStyle = 'rgba(40,50,70,.35)'; g.lineWidth = 2;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 6; k++) g.fillRect((k * 89) % w, 40 + (k * 37) % 160, 40, 6);
  }, [1, 14]);
  const tubeMat = basic(TUNNEL_MOODS[0].tube, { map: tex, side: THREE.BackSide });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 120, 48, 1, true), tubeMat);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = -55;
  scene.add(tube);
  // rings of light along the tunnel, rushing past
  const ringMat = basic(TUNNEL_MOODS[0].ring, { transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const rings = Array.from({ length: 12 }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(R * 0.985, 0.03, 6, 64), ringMat); scene.add(m); return m; });
  // speed lines along the walls
  const streakMat = basic('#ffffff', { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const streaks = Array.from({ length: 22 }, (_, i) => { const m = box(0.025, 0.025, 2.6, streakMat); m.userData = { a: (i / 22) * TAU + (i % 3) * 0.2, z: -((i * 5.3) % 50) }; scene.add(m); return m; });
  // walls: red where the plane is heading for one, the way through glowing
  const walls = new Map();
  const wallMat = () => std('#e0455a', { side: THREE.DoubleSide, roughness: 0.45, emissive: '#3a0a10' });
  const sector = (a0, len, m) => new THREE.Mesh(new THREE.CircleGeometry(R * 0.995, 36, a0, len), m);
  const arc = (a0, len, mat) => { const t = new THREE.Mesh(new THREE.TorusGeometry(PR, 0.05, 6, 32, len), mat); t.rotation.z = a0; return t; };
  const gemMat = std('#7dffe3', { emissive: '#1b8f7a', metalness: 0.4, roughness: 0.2 });
  const gems = pool(scene, () => new THREE.Mesh(new THREE.OctahedronGeometry(0.2), gemMat));
  const gemGlow = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), basic('#7dffe3', { transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));
  const spark = pool(scene, () => new THREE.Mesh(new THREE.OctahedronGeometry(0.05), basic('#bfffee', { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const sparks = [];
  const trailMats = SEAT_COLORS.map(c => basic(c, { transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  const trails = SEAT_COLORS.map((_, i) => pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), trailMats[i])));
  scene.add(new THREE.HemisphereLight('#ffffff', '#442266', 1.4));
  const planes = [], shown = [];
  let dShown = null, aCam = null, shake = 0;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      // smooth: the tunnel moves on every frame, carried on between the game's ticks
      const sp = tunnelSpeed(s.d);
      if (dShown == null || Math.abs(s.d - dShown) > 4) dShown = s.d;
      dShown += sp * dt;
      dShown += (s.d + sp * TICK * alpha - dShown) * (1 - Math.exp(-dt * 10));
      const d = dShown, tNow = s.t + alpha;
      // the level's colours, blended in
      const mood = TUNNEL_MOODS[Math.min(TUNNEL_MOODS.length, s.level || 1) - 1];
      const k = 1 - Math.exp(-dt * 1.5);
      scene.background.lerp(want.set(mood.bg), k);
      scene.fog.color.copy(scene.background);
      tubeMat.color.lerp(want.set(mood.tube), k);
      ringMat.color.lerp(want.set(mood.ring), k);
      tex.offset.y = (d * 0.04) % 1;
      rings.forEach((m, i) => { const z = i * 5 - (d % 5); m.position.z = -z + PZ + 2; });
      // the plane on this screen, and where it is about to be
      const me = s.planes[0];
      const meA = me ? me.a + (me.alive ? me.w * TICK * alpha : 0) : -Math.PI / 2;
      // walls coming at you
      const next = s.obs.find(o => o.z > s.d);
      const seen = new Set();
      s.obs.forEach((o) => {
        const key = `${o.z}`;
        seen.add(key);
        let m = walls.get(key);
        if (!m) {
          m = new THREE.Group();
          const mat = wallMat();
          const safe = basic(mood.gap, { transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
          // the way through, outlined
          if (o.k === 'wall') { m.add(sector(o.c - o.w / 2, o.w, mat)); m.add(arc(o.c + o.w / 2 + 0.1, TAU - o.w - 0.2, safe)); }
          else if (o.k === 'gap') { m.add(sector(o.c + o.w / 2, TAU - o.w, mat)); m.add(arc(o.c - o.w / 2 + 0.08, o.w - 0.16, safe)); }
          else { m.add(sector(o.c - o.w / 2, o.w, mat), sector(o.c + Math.PI - o.w / 2, o.w, mat)); m.add(arc(o.c + o.w / 2 + 0.08, Math.PI - o.w - 0.16, safe), arc(o.c + Math.PI + o.w / 2 + 0.08, Math.PI - o.w - 0.16, safe)); }
          m.add(new THREE.Mesh(new THREE.TorusGeometry(R * 0.99, 0.05, 6, 48), basic('#ffffff')));
          m.userData = { c0: o.c, mat, safe };
          scene.add(m);
          walls.set(key, m);
        }
        m.position.z = -(o.z - d) + PZ;
        m.rotation.z = o.c - m.userData.c0;
        // the next wall: red and pulsing if the plane is lined up to hit it, calm if it's clear
        const u = m.userData, danger = o === next && me?.alive && tunnelBlocks(o, meA) && o.z - s.d < 22;
        u.mat.color.set(danger ? (Math.floor(tNow / 6) % 2 ? '#ff2a2a' : '#ff8080') : mood.wall);
        u.mat.emissive.set(danger ? '#c00000' : '#8a1a24');   // the walls glow, so they stand out from the tunnel
        u.safe.opacity = o === next ? 0.65 + Math.sin(tNow * 0.3) * 0.3 : 0.35;
      });
      walls.forEach((m, key) => { if (!seen.has(key)) { scene.remove(m); m.traverse((x) => { x.geometry?.dispose(); }); walls.delete(key); } });
      gems.begin(); gemGlow.begin();
      s.gems.forEach((g) => {
        const p = [Math.cos(g.a) * PR, Math.sin(g.a) * PR, -(g.z - d) + PZ];
        const m = gems.next(); m.position.set(...p); m.rotation.y = tNow * 0.08; m.rotation.x = tNow * 0.05;
        const gl = gemGlow.next(); gl.position.set(...p); gl.scale.setScalar(1 + Math.sin(tNow * 0.2 + g.z) * 0.15);
      });
      gems.end(); gemGlow.end();
      // the planes: smoothed, banking into the turn, a trail of light behind
      s.planes.forEach((p, i) => {
        if (!planes[i]) { planes[i] = paperPlane(SEAT_COLORS[i]); scene.add(planes[i]); shown[i] = { a: p.a, gems: p.gems, trail: [] }; }
        const v = shown[i], m = planes[i];
        const ta = p.a + (p.alive ? p.w * TICK * alpha : 0);
        let da = ((ta - v.a + Math.PI * 3) % TAU) - Math.PI;
        v.a += da * (1 - Math.exp(-dt * 26));
        m.position.set(Math.cos(v.a) * PR, Math.sin(v.a) * PR, PZ);
        m.scale.setScalar(1.5);
        m.rotation.set(0, 0, v.a + Math.PI / 2 - p.w * 0.3);
        m.visible = p.alive || Math.floor(tNow / 6) % 2 === 0;
        if (p.gems > v.gems) {
          for (let q = 0; q < 16; q++) { const a = (q / 16) * TAU; sparks.push({ x: m.position.x, y: m.position.y, z: PZ - 0.3, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.8, vz: 3, life: 0.6 }); }
        }
        if (!p.alive && v.alive !== false && i === 0) shake = 0.4;
        v.alive = p.alive; v.gems = p.gems;
        v.trail.unshift([m.position.x, m.position.y]);
        if (v.trail.length > 18) v.trail.length = 18;
        trails[i].begin();
        if (p.alive) v.trail.forEach(([x, y], q) => { const t = trails[i].next(); t.position.set(x, y, PZ + 0.35 + q * 0.12); t.scale.setScalar(Math.max(0.2, 1 - q * 0.05)); });
        trails[i].end();
      });
      // sparkles from a gem
      spark.begin();
      for (let q = sparks.length - 1; q >= 0; q--) {
        const p = sparks[q];
        p.life -= dt;
        if (p.life <= 0) { sparks.splice(q, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const m = spark.next(); m.position.set(p.x, p.y, p.z); m.scale.setScalar(p.life * 2); m.material.opacity = Math.min(1, p.life * 2);
      }
      spark.end();
      // speed lines
      const fast = Math.max(0, (sp - 14) / 16);
      streakMat.opacity = fast * 0.5;
      streaks.forEach((m) => { const u = m.userData; u.z += sp * dt * 1.5; if (u.z > 5) u.z -= 55; m.visible = fast > 0.02; m.position.set(Math.cos(u.a) * R * 0.9, Math.sin(u.a) * R * 0.9, u.z); });
      // the camera turns with the plane, so it always flies along the bottom of the screen
      const myA = shown[0]?.a ?? -Math.PI / 2;
      if (aCam == null) aCam = myA;
      let dc = ((myA - aCam + Math.PI * 3) % TAU) - Math.PI;
      aCam += dc * (1 - Math.exp(-dt * 6));
      shake = Math.max(0, shake - dt);
      const lean = R * 0.3, sx = shake ? Math.sin(tNow * 2.3) * shake * 0.3 : 0;
      camera.position.set(Math.cos(aCam) * lean + sx, Math.sin(aCam) * lean, 4.2);
      camera.rotation.set(0, 0, aCam + Math.PI / 2);
      const fov = 70 + Math.min(10, (sp - 12) * 0.6);
      if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = fov; camera.updateProjectionMatrix(); }
    },
  };
}

/* ─── Flying Chit: an endless classroom, morning to night ─── */
// the room's light at each level: sky through the windows, the air, and how bright the tube lights are
const FLY_MOODS = [
  { sky: '#bfe3ff', fog: '#cfe8ff', hemi: 1.35, sun: 1.5, tubes: 0.25, wall: '#ffffff' },   // morning
  { sky: '#c9e9ff', fog: '#d8ecfb', hemi: 1.4, sun: 1.6, tubes: 0.25, wall: '#ffffff' },
  { sky: '#ffe2b0', fog: '#f6dcb4', hemi: 1.25, sun: 1.4, tubes: 0.45, wall: '#fff1dc' },   // afternoon
  { sky: '#ffb985', fog: '#e9b993', hemi: 1.05, sun: 1.1, tubes: 0.7, wall: '#f4d6be' },    // evening
  { sky: '#1b2347', fog: '#232b52', hemi: 0.75, sun: 0.35, tubes: 1.6, wall: '#9aa3c8' },   // night
];
function flyingView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FLY_MOODS[0].sky);
  scene.fog = new THREE.Fog(FLY_MOODS[0].fog, 26, 66);
  const camera = new THREE.PerspectiveCamera(62, 1.6, 0.1, 120);
  const hemi = new THREE.HemisphereLight('#ffffff', '#c9a46b', 1.35);
  const sun = new THREE.DirectionalLight('#fff4dd', 1.5);
  sun.position.set(-4, 6, 3);
  scene.add(hemi, sun);
  const X = 3, Y = 2, LEN = 160;
  const Z = (z) => -(z) * 0.9;
  // the floor: wooden boards, scrolling under you
  const floorTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9a6a3c'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = x % 64 ? '#8c5f34' : '#a87445'; g.fillRect(x, 0, 30, h); }
    g.strokeStyle = 'rgba(40,20,5,.45)'; g.lineWidth = 2;
    for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }, [6, 30]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, LEN), std('#ffffff', { map: floorTex, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -Y - 0.8, -LEN / 2 + 6);
  // the walls: windows, then a blackboard with chalk on it, again and again
  const wallTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#efe4cc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8a5a34'; g.fillRect(0, h - 46, w, 46);                   // wooden panel at the bottom
    g.fillStyle = '#6e4626'; g.fillRect(0, h - 50, w, 5);
    // a window with a sky, frames and a sill
    g.fillStyle = '#8fd0ff'; g.fillRect(28, 34, 180, 128);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(40, 44, 30, 108);
    g.fillStyle = '#ffffff'; g.fillRect(24, 30, 188, 6); g.fillRect(24, 160, 188, 8); g.fillRect(24, 30, 6, 136); g.fillRect(206, 30, 6, 136); g.fillRect(115, 30, 6, 136); g.fillRect(24, 96, 188, 5);
    // a blackboard, with sums and a doodle
    g.fillStyle = '#5a3a20'; g.fillRect(262, 40, 222, 124);
    g.fillStyle = '#24493a'; g.fillRect(268, 46, 210, 112);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.fillStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2;
    g.font = '700 20px "Comic Sans MS", system-ui, sans-serif'; g.fillText('2 + 2 = 4', 284, 80); g.fillText('A B C', 284, 112);
    g.beginPath(); g.arc(430, 96, 20, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(420, 92); g.lineTo(424, 92); g.moveTo(436, 92); g.lineTo(440, 92); g.stroke();
    g.beginPath(); g.arc(430, 100, 9, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = '#d9cfb8'; g.fillRect(262, 164, 222, 6);
  }, [LEN / 12, 1]);
  // each wall has its own copy of the picture: they face opposite ways, so they scroll opposite ways
  const wallTexR = wallTex.clone();
  wallTexR.needsUpdate = true;
  const wallMat = std('#ffffff', { map: wallTex, roughness: 0.95 });
  const wallMatR = std('#ffffff', { map: wallTexR, roughness: 0.95 });
  const walls = [-1, 1].map((side) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 6.4), side < 0 ? wallMat : wallMatR);
    m.rotation.y = -side * Math.PI / 2;
    m.position.set(side * 6.5, 0.2, -LEN / 2 + 6);
    return m;
  });
  // the ceiling, with tube lights going by
  const ceilTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,110,95,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  }, [7, LEN / 2]);
  const ceilMat = std('#ffffff', { map: ceilTex, roughness: 1 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, LEN), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, Y + 1.4, -LEN / 2 + 6);
  scene.add(floor, ceil, ...walls);
  const tubeMat = basic('#fffbe8');
  const tubes = pool(scene, () => box(0.18, 0.06, 2.2, tubeMat));
  // rows of desks along the walls
  const deskTop = std('#a8733e'), deskLeg = std('#4a3322'), bench = std('#7c5130');
  const desks = pool(scene, () => {
    const d = new THREE.Group();
    const top = box(1.6, 0.12, 1, deskTop); top.position.y = 0.6;
    const l1 = box(0.1, 0.6, 0.1, deskLeg); l1.position.set(-0.7, 0.3, 0);
    const l2 = l1.clone(); l2.position.x = 0.7;
    const seat = box(1.5, 0.08, 0.4, bench); seat.position.set(0, 0.35, 0.75);
    d.add(top, l1, l2, seat);
    return d;
  });
  // bangles: gold, and the next one you should go for glows
  const hoopMat = std('#ffbf1f', { metalness: 0.65, roughness: 0.22, emissive: '#5a3c00' });
  const hoopNextMat = std('#ffd84a', { metalness: 0.6, roughness: 0.2, emissive: '#b07a00' });
  const hoops = pool(scene, () => new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 10, 40), hoopMat));
  const glowMat = basic('#fff3a0', { transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 8, 40), glowMat);
  scene.add(glow);
  const aimMat = basic('#ffffff', { transparent: true, opacity: 0.85, depthTest: false, depthWrite: false });
  const aim = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 32), aimMat);
  const aimDot = new THREE.Mesh(new THREE.CircleGeometry(0.018, 12), aimMat);
  aim.renderOrder = aimDot.renderOrder = 5;
  scene.add(aim, aimDot);
  const golds = pool(scene, () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(1, 0.11, 12, 40), std('#fff06a', { metalness: 0.8, roughness: 0.15, emissive: '#a07800' })));
    for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), basic('#fffbe0')); sp.position.set(Math.cos((k * TAU) / 8) * 1.3, Math.sin((k * TAU) / 8) * 1.3, 0); g.add(sp); }
    return g;
  });
  // ceiling fans, on a rod up to the ceiling
  const fanMat = std('#6f7781', { metalness: 0.5 });
  const fans = pool(scene, () => {
    const f = new THREE.Group();
    const spin = new THREE.Group();
    spin.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 14), fanMat));
    for (let k = 0; k < 3; k++) { const b = box(0.9, 0.03, 0.2, fanMat); b.position.x = 0.48; const arm = new THREE.Group(); arm.rotation.y = (k * TAU) / 3; arm.add(b); spin.add(arm); }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 4, 6), fanMat);
    rod.position.y = 2;
    f.add(spin, rod);
    f.userData.spin = spin;
    return f;
  });
  const bookCols = ['#c0392b', '#2e86c1', '#27ae60', '#8e44ad'];
  const books = pool(scene, () => {
    const b = new THREE.Group();
    for (let k = 0; k < 3; k++) { const m = box(0.7 - k * 0.06, 0.16, 0.5, std(bookCols[k])); m.position.y = k * 0.17 - 0.17; m.rotation.y = (k - 1) * 0.12; b.add(m); }
    return b;
  });
  // speed lines at the edges, once you're going fast
  const streakMat = basic('#ffffff', { transparent: true, opacity: 0, depthWrite: false });
  const streaks = Array.from({ length: 18 }, (_, i) => {
    const m = box(0.02, 0.02, 2.4, streakMat);
    const a = (i / 18) * TAU;
    m.userData = { a, r: 2.6 + (i % 3) * 0.5, z: -(i * 3.3) % 30 };
    scene.add(m);
    return m;
  });
  // the paper storm: bits of paper drifting in the air
  const bitMat = std('#fbf6e8', { side: THREE.DoubleSide, roughness: 0.9 });
  const bits = Array.from({ length: 26 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), bitMat);
    m.userData = { x: ((i * 37) % 100) / 100 * 10 - 5, y: ((i * 53) % 100) / 100 * 5 - 2.4, z: -((i * 71) % 60), spin: 1 + (i % 5) };
    m.visible = false;
    scene.add(m);
    return m;
  });
  // sparkles when you fly through a bangle, and a glowing trail behind each chit
  const spark = pool(scene, () => new THREE.Mesh(new THREE.OctahedronGeometry(0.05), basic('#fff6b0', { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const sparks = [];
  const trailMats = SEAT_COLORS.map(c => basic(c, { transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  const trails = SEAT_COLORS.map((_, i) => pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), trailMats[i])));
  const chits = [], shown = [];
  let dShown = null, camX = 0, camY = 0, roll = 0, shake = 0, fov = 62;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      // smooth motion: the room moves on every frame, not only on every tick of the game
      const sp = speedAt(s.d);
      if (dShown == null || Math.abs(s.d - dShown) > 4) dShown = s.d;
      dShown += sp * dt;
      dShown += (s.d + sp * TICK * alpha - dShown) * (1 - Math.exp(-dt * 10));
      const d = dShown, tNow = s.t + alpha;
      // the light of the level, blended in over a couple of seconds
      const mood = FLY_MOODS[Math.min(FLY_MOODS.length, s.level || 1) - 1];
      const k = 1 - Math.exp(-dt * 1.5);
      scene.background.lerp(want.set(mood.sky), k);
      scene.fog.color.lerp(want.set(mood.fog), k);
      wallMat.color.lerp(want.set(mood.wall), k);
      wallMatR.color.copy(wallMat.color);
      ceilMat.color.lerp(want.set(mood.wall), k);
      hemi.intensity = ease(hemi.intensity, mood.hemi, k);
      sun.intensity = ease(sun.intensity, mood.sun, k);
      tubeMat.color.lerp(want.set(mood.tubes > 1 ? '#fff7d0' : '#e9e4d4'), k);
      // the room scrolls past
      floorTex.offset.y = (d * 0.18) % 1;
      wallTex.offset.x = (d * 0.9 / 12) % 1;
      wallTexR.offset.x = -(d * 0.9 / 12) % 1;
      ceilTex.offset.y = -(d * 0.9 / 2) % 1;
      tubes.begin();
      for (let i = 0; i < 9; i++) { const z = i * 7 - (d % 7); [-1.6, 1.6].forEach((x) => { tubes.next().position.set(x, Y + 1.36, Z(z) + 3); }); }
      tubes.end();
      desks.begin();
      for (let i = 0; i < 12; i++) {
        const z = (i * 9 - (d % 9));
        [-1, 1].forEach((side) => { const m = desks.next(); m.position.set(side * 5.2, -Y - 0.8, Z(z)); m.rotation.y = side > 0 ? Math.PI : 0; });
      }
      desks.end();
      // what's coming
      const next = s.objs.find(o => o.k === 'hoop' && !o.gold && o.z > s.d);
      hoops.begin(); golds.begin(); fans.begin(); books.begin();
      glow.visible = false;
      s.objs.forEach((o) => {
        const z = o.z - d;
        if (z > 72 || z < -3) return;
        const p = (o.sw || o.bob) ? placeAt(o, tNow) : o;
        const px = p.x * X, py = p.y * Y;
        if (o.k === 'hoop' && o.gold) { const m = golds.next(); m.position.set(px, py, Z(z)); m.scale.setScalar(o.r * X * 1.05 * (1 + Math.sin(tNow * 0.15) * 0.04)); m.rotation.z = tNow * 0.04; }
        else if (o.k === 'hoop') {
          const m = hoops.next();
          m.position.set(px, py, Z(z));
          m.rotation.z = tNow * 0.01;
          const isNext = o === next;
          m.material = isNext ? hoopNextMat : hoopMat;
          m.scale.setScalar(o.r * X * 1.05 * (isNext ? 1 + Math.sin(tNow * 0.2) * 0.03 : 1));
          if (isNext) { glow.visible = true; glow.position.copy(m.position); glow.scale.setScalar(o.r * X * 1.05); glowMat.opacity = 0.22 + Math.sin(tNow * 0.2) * 0.1; }
        }
        else if (o.k === 'fan') { const m = fans.next(); m.position.set(px, py, Z(z)); m.userData.spin.rotation.y = tNow * 0.35; m.scale.setScalar(o.r * 2.6); }
        else { const m = books.next(); m.position.set(px, py, Z(z)); m.scale.setScalar(o.r * 2.6); m.rotation.y = o.z + (o.sw ? Math.sin(tNow / 20) * 0.3 : 0); m.rotation.z = o.sw ? Math.sin(tNow / 30) * 0.2 : 0; }
      });
      hoops.end(); golds.end(); fans.end(); books.end();
      // the aim ring for the chit on this screen: it sits at the next bangle's distance
      const target = s.objs.find(o => o.k === 'hoop' && o.z > s.d + 0.5);
      const a0 = s.chits[0], v0 = shown[0];
      aim.visible = aimDot.visible = !!(target && a0?.alive && v0);
      if (aim.visible) {
        const z = Z(target.z - d);
        const tp = (target.sw || target.bob) ? placeAt(target, tNow) : target;
        const on = Math.hypot(v0.x - tp.x, v0.y - tp.y) < target.r + FLY_GRAZE;
        aim.position.set(v0.x * X, v0.y * Y, z); aimDot.position.copy(aim.position);
        const near = Math.min(20, (2.7 - z) * 0.66);   // the same size on screen however far away
        aim.scale.setScalar(near); aimDot.scale.setScalar(near);
        aimMat.color.set(on ? '#5dff8a' : '#ffffff');
        aimMat.opacity = on ? 0.95 : 0.7;
      }
      // the chits: smoothed between ticks, tilting into turns, flapping, a trail of light behind
      s.chits.forEach((c, i) => {
        if (!chits[i]) { chits[i] = wingedChit(SEAT_COLORS[i]); scene.add(chits[i]); shown[i] = { x: c.x, y: c.y, score: c.score, hit: c.hit, trail: [] }; }
        const v = shown[i], m = chits[i];
        const tx = c.alive ? c.x + c.vx * TICK * alpha : c.x, ty = c.alive ? c.y + c.vy * TICK * alpha : c.y;
        const kk = 1 - Math.exp(-dt * 28);
        v.x += (tx - v.x) * kk; v.y += (ty - v.y) * kk;
        m.position.set(v.x * X, v.y * Y, 0);
        m.rotation.set(c.vy * 0.22 + (c.alive ? Math.sin(tNow * 0.05 + i) * 0.04 : 0.8), -c.vx * 0.12, -c.vx * 0.38);
        const flap = c.alive ? Math.sin(tNow * (0.45 + Math.max(0, c.vy) * 0.15) + i) * 0.55 : 0.1;
        m.userData.wings[0].rotation.z = flap;
        m.userData.wings[1].rotation.z = -flap;
        m.visible = c.hit <= 0 || Math.floor(tNow / 4) % 2 === 0;
        // through a bangle: a burst of sparkles where the chit is
        if (c.score > v.score) {
          const n = c.score - v.score >= 10 ? 26 : 12 + Math.min(5, c.combo) * 2;
          for (let q = 0; q < n; q++) { const a = (q / n) * TAU; sparks.push({ x: m.position.x, y: m.position.y, z: -0.6, vx: Math.cos(a) * (1.4 + (q % 3) * 0.5), vy: Math.sin(a) * (1.4 + (q % 3) * 0.5), vz: 2 + (q % 4), life: 0.7 }); }
        }
        if (c.hit > v.hit && i === 0) shake = 0.35;
        v.score = c.score; v.hit = c.hit;
        v.trail.unshift([m.position.x, m.position.y - 0.02, 0.3]);
        if (v.trail.length > 22) v.trail.length = 22;
        trails[i].begin();
        if (c.alive) v.trail.forEach(([x, y, z], q) => { const t = trails[i].next(); t.position.set(x, y, z + q * sp * dt * 0.9 + q * 0.03); t.scale.setScalar(Math.max(0.15, 1 - q * 0.045)); });
        trails[i].end();
        trailMats[i].opacity = 0.18 + Math.min(0.3, sp / 90);
      });
      // sparkles fly out and fall behind
      spark.begin();
      for (let q = sparks.length - 1; q >= 0; q--) {
        const p = sparks[q];
        p.life -= dt;
        if (p.life <= 0) { sparks.splice(q, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += (p.vz + sp * 0.5) * dt; p.vy -= 2 * dt;
        const m = spark.next(); m.position.set(p.x, p.y, p.z); m.scale.setScalar(p.life * 1.6); m.material.opacity = Math.min(1, p.life * 2);
      }
      spark.end();
      // speed lines: the faster you go, the more you see them
      const fast = Math.max(0, (sp - 15) / 12);
      streakMat.opacity = fast * 0.45;
      streaks.forEach((m) => {
        const u = m.userData;
        u.z += sp * dt * 1.6;
        if (u.z > 4) u.z -= 34;
        m.visible = fast > 0.02;
        m.position.set(Math.cos(u.a) * u.r * 1.4, Math.sin(u.a) * u.r * 0.8, u.z);
      });
      // the paper storm and after: paper bits in the air
      const storm = (s.level || 1) >= 4;
      bits.forEach((m) => {
        const u = m.userData;
        m.visible = storm;
        if (!storm) return;
        u.z += sp * dt * 0.9;
        if (u.z > 4) u.z -= 64;
        m.position.set(u.x + Math.sin(tNow / 40 + u.spin) * 0.4, u.y + Math.sin(tNow / 33 + u.spin * 2) * 0.3, u.z);
        m.rotation.set(tNow * 0.02 * u.spin, tNow * 0.03 * u.spin, 0);
      });
      // the camera: just behind the first chit, leaning into turns, wider when it's fast, a jolt when hit
      const me = shown[0] || { x: 0, y: 0 }, c0 = s.chits[0] || {};
      camX = ease(camX, me.x * X * 0.6, 1 - Math.exp(-dt * 5));
      camY = ease(camY, me.y * Y * 0.6 + 0.5, 1 - Math.exp(-dt * 5));
      roll = ease(roll, -(c0.vx || 0) * 0.05, 1 - Math.exp(-dt * 4));
      shake = Math.max(0, shake - dt);
      const sx = shake ? Math.sin(tNow * 2.1) * shake * 0.25 : 0, sy = shake ? Math.cos(tNow * 2.7) * shake * 0.2 : 0;
      camera.position.set(camX + sx, camY + 0.2 + sy, 2.7);
      camera.lookAt(camX * 0.5, camY * 0.5 - 0.5, -10);
      camera.rotation.z += roll;
      const wantFov = 60 + Math.min(12, (sp - 10) * 0.7);
      if (Math.abs(wantFov - fov) > 0.05) { fov = ease(fov, wantFov, 1 - Math.exp(-dt * 2)); camera.fov = fov; camera.updateProjectionMatrix(); }
    },
  };
}

/* ─── board-like games seen from above at an angle: ship fight, gully rally, hungry snake ─── */
function tableCamera(camera, y = 5.1, z = 4.3) { camera.position.set(0, y, z); camera.lookAt(0, 0, 0.35); }
const toX = (x) => (x - 320) / 100, toZ = (y) => (y - 221) / 100;

function shipView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b3a5c');
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 50);
  tableCamera(camera);
  lights(scene, { sky: '#dff3ff', ground: '#0b3a5c' });
  const waves = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1d79b5'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 4;
    for (let y = 16; y < h; y += 32) { g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 20) * 5); g.stroke(); }
  }, [4, 3]);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), std('#ffffff', { map: waves, roughness: 0.3, metalness: 0.1 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.z = 0.2;
  scene.add(sea);
  const line = box(0.02, 0.01, 3.6, basic('#ffffff', { transparent: true, opacity: 0.4 }));
  line.position.z = 0.2;
  scene.add(line);
  const ship = (color) => {
    const g = new THREE.Group();
    const hull = box(0.5, 0.14, 0.24, std(color));
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 4), std(color));
    bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.position.x = 0.34;
    const cabin = box(0.18, 0.12, 0.16, std('#efe6d2')); cabin.position.set(-0.08, 0.13, 0);
    const gun = box(0.2, 0.05, 0.05, std('#333333')); gun.position.set(0.12, 0.12, 0);
    const mast = box(0.02, 0.3, 0.02, std('#5a3a22')); mast.position.set(-0.08, 0.32, 0);
    const flag = box(0.12, 0.08, 0.01, basic(color)); flag.position.set(-0.02, 0.42, 0);
    g.add(hull, bow, cabin, gun, mast, flag);
    return g;
  };
  const ships = [ship(SEAT_COLORS[0]), ship(SEAT_COLORS[1])];
  ships[1].rotation.y = Math.PI;
  scene.add(...ships);
  const rocks = pool(scene, () => new THREE.Mesh(new THREE.OctahedronGeometry(1, 1), std('#7d776a', { roughness: 0.9, flatShading: true })));
  const shots = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), std('#1b1b1b', { metalness: 0.6 })));
  const crates = pool(scene, () => box(0.22, 0.22, 0.22, std('#b07a3c')));
  return {
    scene, camera,
    update(s) {
      waves.offset.x = (s.t * 0.0016) % 1;
      waves.offset.y = (s.t * 0.0007) % 1;
      s.ships.forEach((p, i) => {
        const m = ships[i];
        m.visible = p.hp > 0;
        m.position.set(toX(p.x), 0.07 + Math.sin(s.t * 0.07 + i) * 0.02, toZ(p.y));
        m.rotation.z = Math.sin(s.t * 0.05 + i) * 0.05;
        m.children[0].material.emissive?.set(p.hurt > 0 && p.hurt % 4 > 1 ? '#ff0000' : '#000000');
      });
      rocks.begin(); s.rocks.forEach((k) => { const m = rocks.next(); m.position.set(toX(k.x), 0, toZ(k.y)); m.scale.setScalar(k.r / 100 * 1.2); }); rocks.end();
      shots.begin(); s.shots.forEach((b) => { const m = shots.next(); m.position.set(toX(b.x), 0.16, toZ(b.y)); }); shots.end();
      crates.begin(); if (s.crate) { const m = crates.next(); m.position.set(toX(s.crate.x), 0.15 + Math.sin(s.t * 0.1) * 0.04, toZ(s.crate.y)); m.rotation.y = s.t * 0.03; m.material.color.set(s.crate.kind === 0 ? '#e0455a' : '#b07a3c'); } crates.end();
    },
  };
}
function rallyView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#9fd3ff');
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 50);
  tableCamera(camera, 4.6, 4.4);
  lights(scene, { sky: '#fff6e0', ground: '#3d7a46' });
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.9), std('#3f8a49', { roughness: 0.95 }));
  lane.rotation.x = -Math.PI / 2; lane.position.z = 0.2;
  scene.add(lane);
  const white = basic('#ffffff');
  [[0, -1.6, 6.4, 0.03], [0, 1.98, 6.4, 0.03]].forEach(([x, z, w, d]) => { const m = box(w, 0.01, d, white); m.position.set(x, 0.01, z); scene.add(m); });
  const mid = box(0.03, 0.01, 3.6, white); mid.position.set(0, 0.01, 0.2); scene.add(mid);
  // a brick wall on one side, a house on the other: the lane behind home
  const wall = box(7, 0.6, 0.15, std('#b35c3a')); wall.position.set(0, 0.3, -1.8); scene.add(wall);
  const bats = [0, 1].map((i) => { const b = new THREE.Group(); const blade = box(0.1, 0.12, 0.66, std(SEAT_COLORS[i])); const handle = box(0.06, 0.06, 0.25, std('#6b4a2b')); handle.position.x = i === 0 ? -0.15 : 0.15; b.add(blade, handle); scene.add(b); return b; });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), std('#d7f24f', { roughness: 0.6 }));
  const shade = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), basic('#000000', { transparent: true, opacity: 0.3 }));
  shade.rotation.x = -Math.PI / 2;
  scene.add(ball, shade);
  return {
    scene, camera,
    update(s) {
      s.bats.forEach((y, i) => bats[i].position.set(toX(i === 0 ? 34 : 606), 0.06, toZ(y)));
      const h = 0.08 + Math.abs(Math.sin(s.ball.x / 55)) * 0.35;
      ball.position.set(toX(s.ball.x), h, toZ(s.ball.y));
      shade.position.set(toX(s.ball.x), 0.012, toZ(s.ball.y));
      ball.rotation.x += 0.2;
    },
  };
}
function snakeView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#183018');
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 50);
  tableCamera(camera, 5.4, 4.0);
  lights(scene, { sky: '#ffffff', ground: '#224422' });
  const C = 0.2;
  const grid = canvasTex(SNAKE_COLS * 8, SNAKE_ROWS * 8, (g) => { for (let y = 0; y < SNAKE_ROWS; y++) for (let x = 0; x < SNAKE_COLS; x++) { g.fillStyle = (x + y) % 2 ? '#3f7a3b' : '#4a8a44'; g.fillRect(x * 8, y * 8, 8, 8); } });
  grid.magFilter = THREE.NearestFilter;
  const field = box(SNAKE_COLS * C, 0.1, SNAKE_ROWS * C, [std('#5a3a22'), std('#5a3a22'), std('#ffffff', { map: grid }), std('#5a3a22'), std('#5a3a22'), std('#5a3a22')]);
  field.position.set(0, -0.05, 0.2);
  scene.add(field);
  const cx = (x) => (x - (SNAKE_COLS - 1) / 2) * C, cz = (y) => (y - (SNAKE_ROWS - 1) / 2) * C + 0.2;
  const parts = SEAT_COLORS.map(col => pool(scene, () => box(C * 0.86, C * 0.7, C * 0.86, std(col))));
  const heads = SEAT_COLORS.map((col) => { const h = new THREE.Mesh(new THREE.SphereGeometry(C * 0.55, 14, 10), std(col)); const e = basic('#111111'); const a = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), e), b = a.clone(); a.position.set(0.05, 0.05, -0.06); b.position.set(-0.05, 0.05, -0.06); h.add(a, b); scene.add(h); return h; });
  const samosa = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 3), std('#e9a23b', { roughness: 0.7 }));
  const golden = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 3), std('#ffd23f', { metalness: 0.7, roughness: 0.2, emissive: '#7a5a00' }));
  scene.add(samosa, golden);
  const brickMat = std('#8d8478', { roughness: 0.9 });
  const bricks = pool(scene, () => box(C * 0.96, C * 0.9, C * 0.96, brickMat));
  const DIR = { u: 0, l: Math.PI / 2, d: Math.PI, r: -Math.PI / 2 };
  return {
    scene, camera,
    update(s) {
      s.snakes.forEach((n, i) => {
        parts[i].begin();
        n.body.slice(1).forEach(([x, y], k) => { const m = parts[i].next(); m.position.set(cx(x), C * 0.35, cz(y)); m.scale.setScalar(1 - Math.min(0.3, k * 0.01)); m.material.opacity = n.alive ? 1 : 0.4; m.material.transparent = !n.alive; });
        parts[i].end();
        const [hx, hy] = n.body[0];
        heads[i].position.set(cx(hx), C * 0.45, cz(hy));
        heads[i].rotation.y = DIR[n.d] || 0;
      });
      heads.forEach((h, i) => { h.visible = i < s.snakes.length; });
      samosa.position.set(cx(s.food[0]), 0.12 + Math.sin(s.t * 0.12) * 0.04, cz(s.food[1]));
      samosa.rotation.y = s.t * 0.05;
      bricks.begin(); (s.walls || []).forEach(([x, y]) => { bricks.next().position.set(cx(x), C * 0.45, cz(y)); }); bricks.end();
      golden.visible = !!s.gold && (s.gold.ttl > 90 || Math.floor(s.t / 6) % 2 === 1);
      if (s.gold) { golden.position.set(cx(s.gold.x), 0.16 + Math.sin(s.t * 0.2) * 0.06, cz(s.gold.y)); golden.rotation.y = -s.t * 0.12; }
    },
  };
}

/* ─── Road Dash: behind the rickshaws, looking down the road ─── */
function roadView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#9fd3ff');
  scene.fog = new THREE.Fog('#9fd3ff', 14, 30);
  const camera = new THREE.PerspectiveCamera(58, 1.6, 0.1, 60);
  camera.position.set(0, 2.5, 4.6);
  camera.lookAt(0, 0, -4);
  lights(scene, { sky: '#fff6e0', ground: '#6fa84f' });
  const roadTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3b3f46'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2efe6';
    for (let l = 1; l < 4; l++) for (let y = 0; y < h; y += 64) g.fillRect((l * w) / 4 - 3, y, 6, 34);
    g.fillRect(4, 0, 6, h); g.fillRect(w - 10, 0, 6, h);
  }, [1, 6]);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 40), std('#ffffff', { map: roadTex, roughness: 0.9 }));
  road.rotation.x = -Math.PI / 2; road.position.z = -14;
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), std('#6fa84f'));
  grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.01, -14);
  scene.add(grass, road);
  const trees = pool(scene, () => { const t = new THREE.Group(); const trunk = box(0.15, 0.6, 0.15, std('#6b4a2b')); trunk.position.y = 0.3; const top = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), std('#2f7d32')); top.position.y = 0.85; t.add(trunk, top); return t; });
  const laneX = (l) => (l - 1.5) * 1.1;
  const zOf = (x) => -(x - 110) / 52;
  const rickshaw = (color) => {
    const g = new THREE.Group();
    const body = box(0.55, 0.35, 0.8, std(color)); body.position.y = 0.32;
    const roof = box(0.6, 0.06, 0.75, std('#222222')); roof.position.y = 0.72;
    const p1 = box(0.04, 0.32, 0.04, std('#222222')); p1.position.set(0.26, 0.55, -0.3); const p2 = p1.clone(); p2.position.x = -0.26;
    const glass = box(0.45, 0.22, 0.02, std('#9fd3ff', { metalness: 0.3, roughness: 0.1 })); glass.position.set(0, 0.6, -0.36);
    const wheel = () => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), std('#111111')); w.rotation.z = Math.PI / 2; return w; };
    const w1 = wheel(); w1.position.set(0, 0.12, -0.38); const w2 = wheel(); w2.position.set(0.3, 0.12, 0.28); const w3 = wheel(); w3.position.set(-0.3, 0.12, 0.28);
    g.add(body, roof, p1, p2, glass, w1, w2, w3);
    return g;
  };
  const carts = [];
  const things = [
    pool(scene, () => { const c = new THREE.Group(); const b = box(0.5, 0.4, 0.9, std('#f4f1ea')); b.position.y = 0.55; const h = box(0.3, 0.3, 0.3, std('#f4f1ea')); h.position.set(0, 0.75, 0.55); const sp = box(0.2, 0.2, 0.2, std('#3a2a1a')); sp.position.set(0.1, 0.6, 0.1); [[-0.18, -0.3], [0.18, -0.3], [-0.18, 0.3], [0.18, 0.3]].forEach(([x, z]) => { const l = box(0.08, 0.36, 0.08, std('#f4f1ea')); l.position.set(x, 0.18, z); c.add(l); }); c.add(b, h, sp); return c; }),
    pool(scene, () => { const p = new THREE.Mesh(new THREE.CircleGeometry(0.42, 18), basic('#1a1a1a')); p.rotation.x = -Math.PI / 2; p.position.y = 0.01; return p; }),
    pool(scene, () => { const b = new THREE.Group(); const body = box(0.9, 0.9, 2.1, std('#d63b2f')); body.position.y = 0.55; const win = box(0.92, 0.25, 1.8, std('#9fd3ff')); win.position.y = 0.75; const stripe = box(0.92, 0.08, 2.12, std('#ffd23f')); stripe.position.y = 0.35; b.add(body, win, stripe); return b; }),
    pool(scene, () => rickshaw('#2e9e4f')),
  ];
  const coins = pool(scene, () => new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 18), std('#ffd23f', { metalness: 0.7, roughness: 0.25, emissive: '#5a4200' })));
  return {
    scene, camera,
    update(s) {
      roadTex.offset.y = (s.dist / 260) % 1;
      trees.begin();
      for (let k = 0; k < 10; k++) { const z = -((k * 4.2 + (s.dist / 52)) % 42) + 4; [-3.2, 3.2].forEach((x) => { const t = trees.next(); t.position.set(x + (k % 2) * 0.6 * Math.sign(x), 0, z); }); }
      trees.end();
      things.forEach(p => p.begin());
      s.things.forEach((t) => { const m = things[t.kind].next(); m.position.set(laneX(t.l), 0, zOf(t.x)); m.rotation.y = t.kind === 3 ? (t.v ? Math.PI : 0) : t.kind === 0 ? Math.PI / 2 : 0; m.position.y = t.v ? Math.abs(Math.sin(s.t * 0.5)) * 0.03 : 0; });
      things.forEach(p => p.end());
      coins.begin(); s.coins.forEach((c) => { const m = coins.next(); m.position.set(laneX(c.l), 0.35, zOf(c.x)); m.rotation.set(Math.PI / 2, 0, s.t * 0.1); }); coins.end();
      s.carts.forEach((c, i) => {
        if (!carts[i]) { carts[i] = rickshaw(SEAT_COLORS[i]); scene.add(carts[i]); }
        const lane = (c.y - 76) / 78;
        carts[i].position.set(laneX(lane), c.alive ? Math.abs(Math.sin(s.t * 0.4 + i)) * 0.02 : 0, zOf(c.x));
        carts[i].rotation.set(0, (laneX(c.l) - laneX(lane)) * -0.5, c.alive ? 0 : 0.5);
      });
    },
  };
}

/* ─── Bull Fight: a village arena at dusk, with a crowd all round ─── */
function bullView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f0b46e');
  scene.fog = new THREE.Fog('#f0b46e', 9, 20);
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  const hemi = new THREE.HemisphereLight('#fff1d6', '#8a5a2b', 1.25);
  const sun = new THREE.DirectionalLight('#ffe2b0', 1.7);
  sun.position.set(-3, 6, 2);
  scene.add(hemi, sun);
  // the ground outside the ring, and the raked sand inside it
  const groundTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#a7743f'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 400; k++) { g.fillStyle = k % 2 ? 'rgba(80,50,20,.18)' : 'rgba(255,230,180,.12)'; g.fillRect((k * 37) % w, (k * 61) % h, 2, 2); }
  }, [10, 8]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(22, 16), std('#ffffff', { map: groundTex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01;
  scene.add(ground);
  const sandTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ecd29b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(160,120,60,.22)'; g.lineWidth = 2;
    for (let r = 12; r < w / 2; r += 10) { g.beginPath(); g.arc(w / 2, h / 2, r, 0, TAU); g.stroke(); }
    for (let k = 0; k < 500; k++) { g.fillStyle = 'rgba(120,80,30,.12)'; g.fillRect((k * 53) % w, (k * 29) % h, 2, 2); }
  });
  const sand = new THREE.Mesh(new THREE.CircleGeometry(1, 64), std('#ffffff', { map: sandTex, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  const rimMat = basic('#ffffff');
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 6, 80), rimMat);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.02;
  const warnMat = basic('#ff3b2f', { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const warn = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 80), warnMat);
  warn.rotation.x = Math.PI / 2; warn.position.y = 0.03;
  const ring = new THREE.Group();
  ring.add(sand, rim, warn);
  ring.position.z = 0;   // the same middle as the game's ring: what you see is where you fall out
  scene.add(ring);
  // a wooden fence with two rails, flags and bunting
  const wood = std('#6b4223', { roughness: 0.8 });
  const FENCE = 2.35;
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * TAU, post = box(0.07, 0.46, 0.07, wood);
    post.position.set(Math.cos(a) * FENCE, 0.23, Math.sin(a) * FENCE);
    scene.add(post);
    if (k % 6 === 0) {
      const pole = box(0.03, 0.9, 0.03, wood); pole.position.set(post.position.x, 0.45, post.position.z);
      const f = box(0.02, 0.18, 0.26, basic(['#d32f2f', '#f2b705', '#2e9e4f', '#1e6fd0', '#e8742a', '#8e44ad'][(k / 6) % 6]));
      f.position.set(post.position.x, 0.8, post.position.z + 0.13);
      f.userData.flag = k;
      scene.add(pole, f);
    }
  }
  [0.16, 0.36].forEach((y) => { const rail = new THREE.Mesh(new THREE.TorusGeometry(FENCE, 0.022, 6, 96), wood); rail.rotation.x = Math.PI / 2; rail.position.set(0, y, 0); scene.add(rail); });
  const flags = [];
  scene.traverse((m) => { if (m.userData.flag != null) flags.push(m); });
  // bunting: little triangles on a string across the back
  const buntCols = ['#d32f2f', '#f2b705', '#2e9e4f', '#1e6fd0'];
  for (let k = 0; k < 22; k++) {
    const t = k / 21, x = -3.2 + t * 6.4, y = 1.55 - Math.sin(t * Math.PI) * 0.35;
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 3), basic(buntCols[k % 4]));
    tri.rotation.x = Math.PI; tri.position.set(x, y, -2.6);
    scene.add(tri);
  }
  // the crowd on stands all round: they sway, and jump when there's a big hit
  const standMat = std('#7a5634', { roughness: 0.9 });
  for (let tier = 0; tier < 3; tier++) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(2.9 + tier * 0.45, 2.9 + tier * 0.45, 0.22, 48, 1, true, 0.6, TAU - 1.2), standMat);   // open at the front, towards the camera
    st.position.set(0, 0.11 + tier * 0.25, 0);
    scene.add(st);
  }
  const crowdCols = ['#d64545', '#2e86c1', '#f2b705', '#27ae60', '#8e44ad', '#e67e22', '#ecf0f1', '#16a085'];
  const crowd = [];
  for (let k = 0; k < 84; k++) {
    const tier = k % 3, a = ((k * 137.5) % 360) * Math.PI / 180;
    // keep the front of the arena open so the camera sees the ring
    if (Math.sin(a) > 0.55) continue;
    const r = 2.95 + tier * 0.45;
    const p = new THREE.Group();
    const body = box(0.13, 0.2, 0.1, std(crowdCols[k % crowdCols.length], { roughness: 0.9 }));
    body.position.y = 0.1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), std(['#f1c27d', '#c68642', '#8d5524', '#e0ac69'][k % 4]));
    head.position.y = 0.26;
    p.add(body, head);
    p.position.set(Math.cos(a) * r, 0.22 + tier * 0.25, Math.sin(a) * r);
    p.lookAt(0, p.position.y, 0);
    p.userData = { base: p.position.y, ph: k * 0.7 };
    scene.add(p);
    crowd.push(p);
  }
  // a bull: hump, head, curved horns, ears, a blanket in the player's colour, legs that walk, a tail
  const bull = (color, band) => {
    const g = new THREE.Group();
    const hide = std(color, { roughness: 0.75 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.34, 6, 14), hide);
    body.rotation.z = Math.PI / 2; body.position.y = 0.32;
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), hide);
    hump.position.set(0.14, 0.45, 0); hump.scale.set(1, 0.8, 1);
    const neck = box(0.16, 0.18, 0.2, hide); neck.position.set(0.3, 0.38, 0);
    const head = new THREE.Group();
    head.position.set(0.4, 0.38, 0);
    const skull = box(0.2, 0.19, 0.2, hide);
    const snout = box(0.08, 0.11, 0.15, std('#d9a38a', { roughness: 0.6 })); snout.position.set(0.12, -0.04, 0);
    const horn = std('#f4ead5', { roughness: 0.35 });
    [-1, 1].forEach((side) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8), horn);
      base.rotation.x = side * 1.2; base.position.set(0.02, 0.1, side * 0.12);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 8), horn);
      tip.position.set(0.05, 0.19, side * 0.2); tip.rotation.set(side * -0.3, 0, -0.5);
      const ear = box(0.04, 0.05, 0.1, hide); ear.position.set(-0.04, 0.04, side * 0.14); ear.rotation.x = side * 0.5;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), basic('#111111')); eye.position.set(0.08, 0.04, side * 0.09);
      head.add(base, tip, ear, eye);
    });
    head.add(skull, snout);
    const blanket = box(0.34, 0.05, 0.4, std(band, { roughness: 0.7 })); blanket.position.set(-0.02, 0.5, 0);
    const trim = box(0.36, 0.03, 0.42, basic('#ffd23f')); trim.position.set(-0.02, 0.475, 0);
    const legs = [[-0.17, -0.1], [-0.17, 0.1], [0.17, -0.1], [0.17, 0.1]].map(([x, z]) => {
      const pivot = new THREE.Group(); pivot.position.set(x, 0.24, z);
      const l = box(0.075, 0.24, 0.075, hide); l.position.y = -0.12;
      const hoof = box(0.08, 0.04, 0.08, std('#2a1d16')); hoof.position.y = -0.23;
      pivot.add(l, hoof); g.add(pivot);
      return pivot;
    });
    const tail = new THREE.Group(); tail.position.set(-0.36, 0.38, 0);
    const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 5), hide); tl.position.y = -0.13;
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), std('#2a1d16')); tuft.position.y = -0.27;
    tail.add(tl, tuft);
    g.add(body, hump, neck, head, blanket, trim, tail);
    g.userData = { legs, tail, head, walk: 0 };
    return g;
  };
  const bulls = [bull('#7a4a2a', SEAT_COLORS[0]), bull('#2f2420', SEAT_COLORS[1])];
  // under each bull: a ring and an arrow in its player's colour, so you always know which is yours
  const marks = SEAT_COLORS.slice(0, 2).map((c) => {
    const g = new THREE.Group();
    const mat = basic(c, { transparent: true, opacity: 0.8, depthWrite: false });
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 6, 40), mat); r.rotation.x = Math.PI / 2;
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 3), mat); arrow.rotation.set(0, 0, -Math.PI / 2); arrow.position.set(0.42, 0, 0);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), basic('#000000', { transparent: true, opacity: 0.25, depthWrite: false })); shadow.rotation.x = -Math.PI / 2;
    g.add(shadow, r, arrow);
    g.userData = { mat, arrow };
    scene.add(g);
    return g;
  });
  scene.add(...bulls);
  // dust, sparks and dizzy stars
  const puffs = [];
  const puff = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), basic('#e3c48e', { transparent: true, opacity: 0.6, depthWrite: false })));
  const starMat = basic('#ffe066');
  const stars = bulls.map(() => { const g = new THREE.Group(); for (let k = 0; k < 3; k++) { const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), starMat); st.position.set(Math.cos((k * TAU) / 3) * 0.14, 0, Math.sin((k * TAU) / 3) * 0.14); g.add(st); } scene.add(g); return g; });
  const shown = [null, null];
  let ringShown = null, shake = 0, jump = 0, camX = 0, camZ = 0;
  const lastStun = [0, 0], lastCharge = [0, 0];
  const addPuff = (x, y, z, vx, vy, vz, life, size, color) => puffs.push({ x, y, z, vx, vy, vz, life, max: life, size, color });
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const tNow = s.t + alpha;
      if (ringShown == null) ringShown = s.ring;
      ringShown += (s.ring - ringShown) * (1 - Math.exp(-dt * 8));
      ring.scale.setScalar(ringShown / 100);
      const shrinking = s.clock > 60 * 25 && s.pause <= 0;
      let danger = 0;
      s.bulls.forEach((b, i) => {
        // smooth: carried on between ticks, and snapped after a new round puts the bulls back
        const tx = b.x + (s.pause > 0 ? 0 : b.vx * TICK * alpha), ty = b.y + (s.pause > 0 ? 0 : b.vy * TICK * alpha);
        let v = shown[i];
        if (!v || Math.hypot(tx - v.x, ty - v.y) > 60) v = shown[i] = { x: tx, y: ty, dir: b.dir };
        const k = 1 - Math.exp(-dt * 26);
        v.x += (tx - v.x) * k; v.y += (ty - v.y) * k;
        let dd = ((b.dir - v.dir + Math.PI * 3) % TAU) - Math.PI;
        v.dir += dd * (1 - Math.exp(-dt * 14));
        const m = bulls[i], u = m.userData;
        const speed = Math.hypot(b.vx, b.vy);
        const charging = b.charge > 0;
        m.position.set(toX(v.x), charging ? Math.abs(Math.sin(tNow * 0.6)) * 0.04 : 0, toZ(v.y));
        m.rotation.y = -v.dir;
        m.rotation.x = b.stun > 0 ? Math.sin(tNow * 0.8) * 0.12 : 0;
        m.rotation.z = charging ? -0.12 : 0;
        // legs walk with speed, the head lowers to charge, the tail swishes
        u.walk += dt * Math.min(18, 4 + speed / 18);
        const swing = Math.min(0.7, speed / 260);
        u.legs.forEach((l, q) => { l.rotation.z = Math.sin(u.walk + (q % 2 ? Math.PI : 0) + (q > 1 ? Math.PI / 2 : 0)) * swing; });
        u.head.rotation.z = charging ? -0.45 : b.cool <= 0 ? -0.15 + Math.sin(tNow * 0.1) * 0.05 : 0;
        u.tail.rotation.x = Math.sin(tNow * 0.15 + i) * 0.5;
        // the player's ring and arrow; the arrow glows when a charge is ready
        const mk = marks[i];
        mk.position.set(toX(v.x), 0.02, toZ(v.y));
        mk.rotation.y = -v.dir;
        mk.userData.arrow.scale.setScalar(b.cool <= 0 ? 1.3 + Math.sin(tNow * 0.3) * 0.15 : 0.8);
        mk.userData.mat.opacity = b.cool <= 0 ? 0.95 : 0.55;
        // dust behind a charge, and steam from the nose when ready
        if (charging && Math.random() < 0.8) addPuff(m.position.x - Math.cos(v.dir) * 0.3, 0.06, m.position.z - Math.sin(v.dir) * 0.3, (Math.random() - 0.5) * 0.4, 0.5, (Math.random() - 0.5) * 0.4, 0.6, 1, '#e3c48e');
        if (b.cool <= 0 && Math.random() < 0.05) addPuff(m.position.x + Math.cos(v.dir) * 0.5, 0.33, m.position.z + Math.sin(v.dir) * 0.5, Math.cos(v.dir) * 0.3, 0.15, Math.sin(v.dir) * 0.3, 0.5, 0.5, '#ffffff');
        if (charging && !lastCharge[i]) for (let q = 0; q < 8; q++) addPuff(m.position.x, 0.05, m.position.z, (Math.random() - 0.5) * 1.2, 0.4, (Math.random() - 0.5) * 1.2, 0.7, 1.3, '#e3c48e');
        lastCharge[i] = charging ? 1 : 0;
        // a big hit: sparks where the horns met, the crowd jumps, the camera jolts
        if (b.stun > lastStun[i] && b.stun >= 20) {
          const o = bulls[1 - i].position;
          const hx = (m.position.x + o.x) / 2, hz = (m.position.z + o.z) / 2;
          for (let q = 0; q < 16; q++) { const a = (q / 16) * TAU; addPuff(hx, 0.35, hz, Math.cos(a) * 1.6, 0.6 + Math.random(), Math.sin(a) * 1.6, 0.45, 0.6, '#fff1a0'); }
          shake = 0.3; jump = 1;
        }
        lastStun[i] = b.stun;
        // dizzy: stars circle the head
        const st = stars[i];
        st.visible = b.stun > 0;
        if (st.visible) { st.position.set(m.position.x + Math.cos(v.dir) * 0.35, 0.68, m.position.z + Math.sin(v.dir) * 0.35); st.rotation.y = tNow * 0.3; }
        danger = Math.max(danger, s.pause > 0 ? 0 : 1 - Math.max(0, (s.ring - Math.hypot(b.x - BULL_CX, b.y - BULL_CY))) / 40);
      });
      // the rim glows red when someone is near it, or while the ring shrinks
      warnMat.opacity = Math.max(shrinking ? 0.35 + Math.sin(tNow * 0.2) * 0.2 : 0, danger * (0.5 + Math.sin(tNow * 0.4) * 0.3));
      // dust and sparks
      puff.begin();
      for (let q = puffs.length - 1; q >= 0; q--) {
        const p = puffs[q];
        p.life -= dt;
        if (p.life <= 0) { puffs.splice(q, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy -= 0.6 * dt;
        const m = puff.next(); m.position.set(p.x, p.y, p.z);
        m.scale.setScalar(p.size * (1.6 - p.life / p.max));
        m.material.opacity = 0.6 * (p.life / p.max);
        m.material.color.set(p.color);
      }
      puff.end();
      // the crowd sways, and jumps on a big hit; the flags flutter
      jump = Math.max(0, jump - dt * 1.4);
      crowd.forEach((p) => { p.position.y = p.userData.base + Math.abs(Math.sin(tNow * 0.08 + p.userData.ph)) * 0.025 + jump * Math.abs(Math.sin(tNow * 0.5 + p.userData.ph)) * 0.12; });
      flags.forEach((f, q) => { f.rotation.y = Math.sin(tNow * 0.12 + q) * 0.4; });
      // the camera: a little towards the action, with a jolt on a big hit
      const mx = (toX(shown[0]?.x ?? 320) + toX(shown[1]?.x ?? 320)) / 2, mz = (toZ(shown[0]?.y ?? 221) + toZ(shown[1]?.y ?? 221)) / 2;
      camX = ease(camX, mx * 0.25, 1 - Math.exp(-dt * 2));
      camZ = ease(camZ, mz * 0.2, 1 - Math.exp(-dt * 2));
      shake = Math.max(0, shake - dt);
      const sx = shake ? Math.sin(tNow * 2.3) * shake * 0.2 : 0;
      camera.position.set(camX + sx, 3.25, 2.75 + camZ);
      camera.lookAt(camX * 0.8, 0, 0.12 + camZ * 0.8);
    },
  };
}

/* ─── Pin Spin: round corkboards spinning on a classroom wall ─── */
function pinView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#20352a');
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, -0.2, 7.2);
  camera.lookAt(0, -0.2, 0);
  scene.add(new THREE.HemisphereLight('#fff6e6', '#1d2b22', 1.4));
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(2, 3, 6);
  scene.add(key);
  // a chalkboard wall behind: faint chalk sums, so it reads as a classroom
  const wall = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#20352a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.045)'; g.font = '20px system-ui, sans-serif';
    ['2 + 3 = 5', 'A B C', '7 × 8 = 56', '★', '3.14', 'x + y'].forEach((t, k) => g.fillText(t, 60 + (k % 3) * 330, 90 + Math.floor(k / 3) * 300));
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ map: wall }));
  back.position.z = -2;
  scene.add(back);
  const cork = (big) => canvasTex(256, 256, (g, w) => {
    const r = w / 2;
    g.fillStyle = big ? '#c0412b' : '#c89b62'; g.beginPath(); g.arc(r, r, r, 0, TAU); g.fill();
    // cork speckles
    for (let k = 0; k < 900; k++) { const a = k * 2.399, d = Math.sqrt(k / 900) * (r - 6); g.fillStyle = k % 3 ? 'rgba(110,70,30,.35)' : 'rgba(255,235,200,.25)'; g.fillRect(r + Math.cos(a) * d, r + Math.sin(a) * d, 2.4, 2.4); }
    // a coloured paper ring and a pinned note in the middle
    g.strokeStyle = big ? '#ffd23f' : '#ff9a3d'; g.lineWidth = 10; g.beginPath(); g.arc(r, r, r * 0.62, 0, TAU); g.stroke();
    g.fillStyle = '#fff8e6'; g.save(); g.translate(r, r); g.rotate(-0.12); g.fillRect(-34, -26, 68, 52); g.fillStyle = '#c0412b'; g.font = '800 22px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CP', 0, 2); g.restore();
  });
  const faces = { plain: cork(false), big: cork(true) };
  const rim = std('#7a5530', { roughness: 0.85 });
  const steel = std('#d7dde4', { metalness: 0.85, roughness: 0.25 });
  const heads = SEAT_COLORS.map(c => std(c, { roughness: 0.3 }));
  // a push pin pointing up (+y): needle below, plastic head on top
  const pin = (seat) => {
    const k = new THREE.Group();
    const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.006, 0.42, 8), steel); needle.position.y = 0.21;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.16, 14), heads[seat % heads.length]); neck.position.y = -0.05;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.07, 18), heads[seat % heads.length]); cap.position.y = -0.16;
    k.add(needle, neck, cap);
    return k;
  };
  const starTex = canvasTex(128, 128, (g, w) => {
    const r = w / 2;
    g.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.42 : r * 0.95; g.lineTo(r + Math.cos(a) * rr, r + Math.sin(a) * rr); }
    g.closePath(); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#b07a00'; g.stroke();
  });
  const starMat = new THREE.MeshBasicMaterial({ map: starTex, transparent: true });
  const targets = [];
  const slots = (n) => ({ 1: [0], 2: [-1.7, 1.7], 3: [-2.4, 0, 2.4], 4: [-2.7, -0.9, 0.9, 2.7] })[n] || [0];
  const make = (i) => {
    const grp = new THREE.Group();
    const faceMat = std('#ffffff', { map: faces.plain, roughness: 0.95 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.22, 48), [rim, faceMat, faceMat]);
    disc.rotation.x = Math.PI / 2;
    const spin = new THREE.Group();
    spin.add(disc);
    grp.add(spin);
    const flying = pin(i);
    grp.add(flying);
    const waiting = pin(i);
    grp.add(waiting);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.03, 6, 48), basic(SEAT_COLORS[i]));
    grp.add(ring);
    scene.add(grp);
    return { grp, spin, faceMat, flying, waiting, ring, pins: [], stars: [], level: 0, shake: 0, seat: i };
  };
  return {
    scene, camera,
    update(s, dt) {
      const xs = slots(s.n);
      const scale = s.n > 2 ? 0.62 : s.n === 2 ? 0.85 : 1;
      s.players.forEach((p, i) => {
        if (!targets[i]) targets[i] = make(i);
        const T = targets[i];
        T.grp.position.set(xs[i], 0.35, 0);
        T.grp.scale.setScalar(scale);
        // a new level: a fresh board pops in; every fifth one is the big red board
        if (T.level !== p.level) { T.level = p.level; T.shake = 0.35; T.faceMat.map = p.level % 5 === 0 ? faces.big : faces.plain; T.faceMat.needsUpdate = true; }
        if (T.shake > 0) { T.shake -= dt; T.spin.scale.setScalar((p.level % 5 === 0 ? 1.08 : 1) + Math.sin(T.shake * 40) * 0.04); } else T.spin.scale.setScalar(p.level % 5 === 0 ? 1.08 : 1);
        T.spin.rotation.z = p.rot;
        while (T.pins.length < p.stuck.length) { const k = pin(i); T.spin.add(k); T.pins.push(k); }
        T.pins.forEach((k, n) => {
          const a = p.stuck[n];
          k.visible = a != null;
          if (a == null) return;
          // the needle points into the board, the head sticks out past the rim
          k.position.set(Math.cos(a) * 1.24, Math.sin(a) * 1.24, 0.05);
          k.rotation.z = a + Math.PI / 2;
        });
        while (T.stars.length < p.stars.length) { const st = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), starMat); T.spin.add(st); T.stars.push(st); }
        T.stars.forEach((st, n) => { const a = p.stars[n]; st.visible = a != null; if (a != null) { st.position.set(Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0.125); st.rotation.z = a; } });
        // the pin in the air, and the next one waiting
        T.flying.visible = p.alive && p.fly > 0;
        T.flying.position.set(0, -1.3 - (p.fly / 7) * 1.6, 0.05);
        T.waiting.visible = p.alive && p.fly === 0 && p.pins > 0;
        T.waiting.position.set(0, -2.9, 0.05);
        T.ring.visible = s.n > 1;
        T.grp.rotation.z = p.alive ? 0 : Math.sin(s.t * 0.5) * 0.04;
      });
    },
  };
}

/* ─── Hoop Flick: a ball and hoops in a sports hall, seen from the side ─── */
function hoopView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1d2c44');
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, 0, 5.3);
  camera.lookAt(0, 0, 0);
  lights(scene, { sky: '#fff6e8', ground: '#33415c', sun: 1.5 });
  const X = (x) => (x - HOOP_W / 2) / 100, Y = (y) => (HOOP_H / 2 - y) / 100;
  // the hall: a wall with painted stripes and a wooden floor
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), std('#ffffff', { map: canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#26395a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2e4670'; for (let k = 0; k < 8; k++) g.fillRect(0, k * 16, w, 7);
    g.fillStyle = 'rgba(255,210,63,.5)'; g.fillRect(0, h * 0.72, w, 3);
  }), roughness: 0.95 }));
  wall.position.z = -1.2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), std('#ffffff', { map: canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#b9814a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,45,15,.35)'; for (let k = 0; k < 16; k++) { g.beginPath(); g.moveTo(k * 16, 0); g.lineTo(k * 16, h); g.stroke(); }
  }, [3, 1]), roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, Y(HOOP_H) - 0.05, 0.6);
  scene.add(wall, floor);
  const orange = std('#ff7a1a', { roughness: 0.35, metalness: 0.3 });
  const gold = basic('#ffd23f');
  const netMat = basic('#ffffff', { wireframe: true, transparent: true, opacity: 0.75 });
  const boardMat = std('#f4f7fb', { roughness: 0.3, transparent: true, opacity: 0.9 });
  const hoop = () => {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 28), orange);
    rim.rotation.x = Math.PI / 2 - 0.35;   // tipped towards us so the opening shows
    const net = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.19, 0.32, 12, 2, true), netMat);
    net.position.y = -0.17;
    const board = box(0.05, 0.5, 0.5, boardMat);
    board.position.set(0.36, 0.18, 0);
    const pole = box(0.05, 0.3, 0.05, std('#99a3b3'));
    pole.position.set(0.42, -0.1, 0);
    g.add(rim, net, board, pole);
    g.userData = { rim, net, board, pole, flash: 0 };
    return g;
  };
  const ballTex = canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = '#e8742a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a1d0c'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    [w / 4, (3 * w) / 4].forEach((x) => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); });
  });
  const ballMat = std('#ffffff', { map: ballTex, roughness: 0.65 });
  const deadMat = std('#7a7a7a', { roughness: 0.8 });
  const dots = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), basic('#ffffff', { transparent: true, opacity: 0.8 })));
  const lanes = [];
  const seatsView = [];
  const make = (i) => {
    const home = hoop(), next = hoop();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), ballMat);
    const tag = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 6, 24), basic(SEAT_COLORS[i]));
    scene.add(home, next, ball, tag);
    return { home, next, ball, tag, score: 0, spin: 0 };
  };
  const place = (g, h, x) => {
    g.position.set(X(x), Y(h.y), 0);
    // the backboard stands on the outside of the court
    const out = h.side < 0 ? -1 : 1;
    g.userData.board.position.x = 0.36 * out; g.userData.pole.position.x = 0.42 * out;
  };
  return {
    scene, camera,
    update(s, dt) {
      dots.begin();
      while (lanes.length < s.n - 1) { const l = box(0.02, 6, 0.02, basic('#ffffff', { transparent: true, opacity: 0.25 })); scene.add(l); lanes.push(l); }
      lanes.forEach((l, k) => { l.position.set(X((HOOP_W / s.n) * (k + 1)), 0, -0.5); });
      s.players.forEach((p, i) => {
        if (!seatsView[i]) seatsView[i] = make(i);
        const V = seatsView[i];
        place(V.home, p.home, p.home.x);
        const hx = p.next.x + (p.next.move ? Math.sin(s.t / 60 + p.next.ph) * p.next.move : 0);
        place(V.next, p.next, hx);
        // a basket: the hoop it went through flashes gold
        if (p.score !== V.score) { V.home.userData.flash = p.score > V.score ? 0.5 : 0; V.score = p.score; }
        const f = V.home.userData;
        if (f.flash > 0) { f.flash -= dt; f.rim.material = gold; f.rim.scale.setScalar(1 + f.flash * 0.6); } else { f.rim.material = orange; f.rim.scale.setScalar(1); }
        V.home.userData.net.scale.y = 1 + Math.max(0, f.flash) * 0.8;
        V.ball.position.set(X(p.ball.x), Y(p.ball.y), 0.05);
        V.ball.material = p.alive ? ballMat : deadMat;
        if (p.flying) V.spin += (p.ball.vx / 100) * dt * 2;
        V.ball.rotation.z = -V.spin;
        V.tag.visible = s.n > 1 && p.alive && !p.flying;
        V.tag.position.copy(V.ball.position);
        // the aiming arc, while the ball waits
        if (p.alive && !p.flying) {
          for (let k = 1; k < 10; k++) {
            const t = k * 0.06, d = dots.next();
            d.position.set(X(p.ball.x + p.aimX * HOOP_MAX * t), Y(p.ball.y - p.aimY * HOOP_MAX * t + 0.5 * HOOP_G * t * t), 0.05);
            d.scale.setScalar(1 - k * 0.07);
          }
        }
      });
      dots.end();
    },
  };
}

/* ─── Ghost Hostel: a row of rooms seen from above the corridor, and the ghost floating in it ─── */
function ghostView() {
  const scene = new THREE.Scene();
  const night = new THREE.Color('#0d0b22'), angry = new THREE.Color('#2a0b1a');
  scene.background = night.clone();
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, 3.2, 3.5);
  camera.lookAt(0, 0.15, -0.75);
  scene.add(new THREE.HemisphereLight('#b8c4ff', '#2a2248', 1.6));
  const moon = new THREE.DirectionalLight('#cfd8ff', 1.2);
  moon.position.set(-3, 6, 4);
  scene.add(moon);
  const X = (x) => (x - HOOP_W / 2) / 100;
  const Z = (y) => -0.35 + (y - (GHOST_CORRIDOR - 40)) / 100;
  // the corridor: a long tiled floor
  const tiles = canvasTex(64, 64, (g, w) => { g.fillStyle = '#2b2740'; g.fillRect(0, 0, w, w); g.fillStyle = '#353150'; g.fillRect(0, 0, w / 2, w / 2); g.fillRect(w / 2, w / 2, w / 2, w / 2); }, [14, 3]);
  const corridor = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), std('#ffffff', { map: tiles, roughness: 0.9 }));
  corridor.rotation.x = -Math.PI / 2;
  corridor.position.set(0, 0, 0.9);
  scene.add(corridor);
  // the ghost's corner: a little table with a candle
  const altar = new THREE.Group();
  const top = box(0.5, 0.06, 0.3, std('#4a3328'));
  top.position.y = 0.3;
  const leg = box(0.06, 0.3, 0.06, std('#4a3328'));
  leg.position.y = 0.15;
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8), std('#f4ead2'));
  candle.position.y = 0.4;
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), basic('#ffb347'));
  flame.position.y = 0.5;
  const healRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 32), basic('#b48cff', { transparent: true, opacity: 0.7 }));
  healRing.rotation.x = Math.PI / 2;
  healRing.position.y = 0.04;
  altar.add(top, leg, candle, flame, healRing);
  altar.position.set(X(GHOST_ALTAR.x), 0, Z(GHOST_ALTAR.y) + 0.2);
  scene.add(altar);
  // the ghost
  const ghostMat = std('#eef3ff', { emissive: '#7f8cff', emissiveIntensity: 0.35, transparent: true, opacity: 0.88, roughness: 0.4 });
  const ghost = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), ghostMat);
  head.position.y = 0.32;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 20, 1, true), ghostMat);
  tail.rotation.x = Math.PI;
  tail.position.y = -0.02;
  const eyeMat = basic('#14102a');
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), eyeMat), e2 = e1.clone();
  e1.position.set(-0.11, 0.38, 0.27); e2.position.set(0.11, 0.38, 0.27);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), eyeMat);
  mouth.scale.set(1, 1.4, 0.5);
  mouth.position.set(0, 0.22, 0.29);
  const armGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const a1 = new THREE.Mesh(armGeo, ghostMat), a2 = new THREE.Mesh(armGeo, ghostMat);
  a1.position.set(-0.33, 0.18, 0.08); a2.position.set(0.33, 0.18, 0.08);
  ghost.add(head, tail, e1, e2, mouth, a1, a2);
  scene.add(ghost);
  // the rooms
  const wallMat = std('#5a4f8f', { roughness: 0.9 }), floorMat = std('#8a6044', { roughness: 0.8 }), caughtMat = std('#3a1630', { roughness: 0.9 });
  const doorMat = () => std('#8a5a33', { roughness: 0.7 });
  const rooms = [];
  const fan = () => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.4, 6), std('#9aa3b5', { metalness: 0.5 }));
    pole.position.y = 0.2;
    const blades = new THREE.Group();
    for (let k = 0; k < 3; k++) { const b = box(0.24, 0.02, 0.07, std('#7fd8ff')); b.position.x = 0.12; const arm = new THREE.Group(); arm.add(b); arm.rotation.z = (k * TAU) / 3; blades.add(arm); }
    blades.position.set(0, 0.42, 0.03);
    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 24), std('#dfe7ee', { metalness: 0.6 }));
    cage.position.copy(blades.position);
    g.add(pole, blades, cage);
    g.userData.blades = blades;
    return g;
  };
  const makeRoom = (i) => {
    const g = new THREE.Group();
    const floor = box(1, 0.04, 1, floorMat);
    floor.position.set(0, 0.02, -1.25);
    const back = box(1, 0.8, 0.05, wallMat);
    back.position.set(0, 0.4, -1.75);
    const left = box(0.05, 0.8, 1, wallMat), right = left.clone();
    left.position.set(-0.5, 0.4, -1.25); right.position.set(0.5, 0.4, -1.25);
    const frontL = box(0.3, 0.8, 0.05, wallMat), frontR = frontL.clone();
    frontL.position.set(-0.35, 0.4, -0.75); frontR.position.set(0.35, 0.4, -0.75);
    const door = box(0.4, 0.62, 0.05, doorMat());
    door.position.set(0, 0.31, -0.74);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), std('#ffd23f', { metalness: 0.7 }));
    knob.position.set(0.13, 0, 0.04);
    door.add(knob);
    // the bed, with someone fast asleep in it
    const bed = new THREE.Group();
    const frame = box(0.42, 0.12, 0.62, std('#5a3a20'));
    frame.position.y = 0.1;
    const mattress = box(0.38, 0.06, 0.58, std('#f1ede4'));
    mattress.position.y = 0.19;
    const blanket = box(0.4, 0.05, 0.38, std(SEAT_COLORS[i] || '#7b3fe4'));
    blanket.position.set(0, 0.23, 0.1);
    const pillow = box(0.26, 0.05, 0.12, std('#ffffff'));
    pillow.position.set(0, 0.24, -0.2);
    const sleeper = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), std('#e0ac69'));
    sleeper.position.set(0, 0.3, -0.12);
    const trim = box(0.44, 0.03, 0.64, basic('#ffd23f'));
    trim.position.y = 0.04;
    bed.add(frame, mattress, blanket, pillow, sleeper, trim);
    bed.position.set(0.18, 0, -1.4);
    const fans = [fan(), fan(), fan()];
    fans.forEach((f, k) => { f.position.set(-0.32 + k * 0.2, 0.04, -0.95 - k * 0.12); f.rotation.y = 0.2; g.add(f); });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), basic('#ffe9a8'));
    lamp.position.set(0, 0.74, -1.25);
    g.add(floor, back, left, right, frontL, frontR, door, bed, lamp);
    scene.add(g);
    return { g, door, bed, trim, fans, sleeper, floor, back, left, right, lamp, frontL, frontR, shake: 0 };
  };
  return {
    scene, camera,
    update(s, dt) {
      const span = Math.min(HOOP_W / s.rooms / 100, 2.4) * 0.92;
      s.players.forEach((p, i) => {
        if (!rooms[i]) rooms[i] = makeRoom(i);
        const R = rooms[i];
        R.g.position.x = X(GHOST_ROOMX(s, i));
        R.g.scale.set(span, 1, 1);
        const share = p.hp / GHOST_DOOR.hp[p.door];
        // a stronger door is darker wood with metal bands; a battered one goes red
        R.door.visible = p.alive;
        R.door.material.color.set(p.door >= 3 ? '#5a3a24' : '#8a5a33').lerp(new THREE.Color('#b23a3a'), Math.max(0, 0.6 - share));
        R.door.scale.y = 1 + p.door * 0.04;
        R.door.position.x = p.bang > 0 ? Math.sin(s.t * 2.5) * 0.02 : 0;
        R.door.rotation.y = p.alive ? 0 : 0.9;
        [R.floor, R.back, R.left, R.right, R.frontL, R.frontR].forEach(m => { m.material = m === R.floor ? floorMat : p.alive ? wallMat : caughtMat; });
        R.bed.scale.setScalar(1 + p.bed * 0.06);
        R.trim.visible = p.bed >= 3;
        R.sleeper.position.y = 0.3 + Math.sin(s.t / 40 + i) * 0.01;
        R.sleeper.visible = p.alive;
        R.lamp.material.color.set(p.alive ? '#ffe9a8' : '#553344');
        const shown = Math.min(3, Math.ceil(p.fan / 2));
        R.fans.forEach((f, k) => {
          f.visible = k < shown;
          if (!f.visible) return;
          const blowing = s.ghost.mode === 'attack' && s.ghost.target === i;
          f.userData.blades.rotation.z += dt * (blowing ? 22 : 5) * (1 + p.fan * 0.1);
        });
      });
      // the ghost: bobbing in the air, red when the fans hit it, a ring of light while it recovers
      const gh = s.ghost;
      ghost.visible = gh.mode !== 'gone';
      const size = 0.75 + gh.lv * 0.08;
      ghost.scale.setScalar(gh.mode === 'sleep' ? size * 0.85 : size);
      ghost.position.set(X(gh.x), 0.55 + Math.sin(s.t / 18) * 0.06 + (gh.mode === 'sleep' ? -0.15 : 0), Z(gh.y));
      ghost.rotation.y = gh.mode === 'attack' ? Math.PI : 0;   // its back to us while it bangs on a door
      ghost.rotation.z = gh.mode === 'attack' ? Math.sin(s.t / 3) * 0.12 : 0;
      ghostMat.emissive.set(gh.hitFlash > 0 ? '#ff4d6d' : gh.mode === 'heal' ? '#b48cff' : '#7f8cff');
      ghostMat.emissiveIntensity = gh.hitFlash > 0 ? 0.8 : 0.35;
      a1.position.y = a2.position.y = 0.18 + (gh.mode === 'attack' ? Math.abs(Math.sin(s.t / 4)) * 0.15 : 0);
      healRing.visible = gh.mode === 'heal';
      healRing.rotation.z += dt * 2;
      flame.scale.setScalar(1 + Math.sin(s.t / 5) * 0.2);
      scene.background.copy(night).lerp(angry, s.t > GHOST_RAGE ? 0.6 + Math.sin(s.t / 30) * 0.2 : 0);
    },
  };
}

const VIEWS = { 'ghost-hostel': ghostView, 'hoop-flick': hoopView, 'pin-spin': pinView, 'bull-fight': bullView, 'tunnel-race': tunnelView, 'flying-chit': flyingView, 'ship-fight': shipView, 'backyard-rally': rallyView, 'hungry-snake': snakeView, 'road-dash': roadView };
export const hasView = (slug) => !!VIEWS[slug];
export function createView(slug) { return VIEWS[slug] ? VIEWS[slug]() : null; }
