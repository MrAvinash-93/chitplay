/**
 * The TV games in 3D. Each view builds a small scene once and moves things in it to match the game's
 * state; the game's rules never know it exists. A view returns { scene, camera, update(s, dt) }.
 * Light on purpose: no shadows, few lights, shared materials, simple shapes.
 */
import * as THREE from '../../vendor/three.chitplay.min.js';
import { SEAT_COLORS, TICK } from './lib.js?v=20261110-1540';
import { GRAZE as FLY_GRAZE, placeAt, speedAt } from './flying-chit.js?v=20261110-1540';
import { FLY as PIN_FLY, GAP as PIN_GAP, isBigBoard as isPinBig, LEVEL_TICKS as PIN_LEVEL_TICKS, spinAt as pinSpinAt } from './pin-spin.js?v=20261110-1540';
import { COOL as SHIP_COOL, STORM_AT as SHIP_STORM } from './ship-fight.js?v=20261110-1540';
import { speedOf as roadSpeed } from './road-dash.js?v=20261110-1540';
import { TOP as RALLY_TOP, WIN as RALLY_WIN } from './backyard-rally.js?v=20261110-1540';
import { AHEAD as TUNNEL_AHEAD, blocks as tunnelBlocks, speedAt as tunnelSpeed } from './tunnel-race.js?v=20261110-1540';
import { CX as BULL_CX, CY as BULL_CY } from './bull-fight.js?v=20261110-1540';
import { COLS as SNAKE_COLS, ROWS as SNAKE_ROWS } from './hungry-snake.js?v=20261110-1540';
import { G as HOOP_G, MAX as HOOP_MAX } from './hoop-flick.js?v=20261110-1540';
import { ALTAR as GHOST_ALTAR, CORRIDOR_Y as GHOST_CORRIDOR, DOOR as GHOST_DOOR, NIGHT as GHOST_NIGHT, RAGE as GHOST_RAGE, roomX as GHOST_ROOMX } from './ghost-hostel.js?v=20261110-1540';
import { W as HOOP_W, H as HOOP_H } from './lib.js?v=20261110-1540';

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
  const calmSky = new THREE.Color('#7cc4ee'), stormSky = new THREE.Color('#2a3344');
  scene.background = calmSky.clone();
  scene.fog = new THREE.Fog('#7cc4ee', 7, 14);
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 50);
  tableCamera(camera);
  const hemi = new THREE.HemisphereLight('#dff3ff', '#0b3a5c', 1.35);
  const sun = new THREE.DirectionalLight('#fff4dd', 1.7);
  sun.position.set(-3, 6, 3);
  scene.add(hemi, sun);
  // the sea: a real surface that rolls, with foam lines drifting on it
  const waves = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2a8fcf'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3;
    for (let y = 16; y < h; y += 32) { g.beginPath(); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / 20) * 5); g.stroke(); }
  }, [5, 4]);
  const seaGeo = new THREE.PlaneGeometry(12, 7, 48, 28);
  const seaMat = std('#ffffff', { map: waves, roughness: 0.25, metalness: 0.15, flatShading: true });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.z = 0.2;
  scene.add(sea);
  const seaPos = seaGeo.attributes.position;
  const seaBase = Float32Array.from(seaPos.array);
  const waveAt = (x, z, t) => Math.sin(x * 1.6 + t * 0.05) * 0.035 + Math.sin(z * 2.1 - t * 0.04) * 0.03;
  const line = box(0.02, 0.01, 3.6, basic('#ffffff', { transparent: true, opacity: 0.4 }));
  line.position.set(0, 0.06, 0.2);
  scene.add(line);
  // the shores on either side, with palm trees, and a lighthouse at the back
  const sand = std('#e8cf98', { roughness: 1 });
  [-1, 1].forEach((side) => {
    const shore = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 0.2, 24), sand);
    shore.scale.set(1, 1, 2.2);
    shore.position.set(side * 5.0, 0.02, 0.2);
    scene.add(shore);
    [-0.9, 0.5, 1.6].forEach((z, k) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.6, 6), std('#8a5a33'));
      trunk.position.y = 0.3; trunk.rotation.z = side * 0.15;
      tree.add(trunk);
      for (let l = 0; l < 5; l++) { const leaf = box(0.4, 0.02, 0.1, std('#2f9e44')); leaf.position.set(Math.cos(l * 1.26) * 0.15, 0.6, Math.sin(l * 1.26) * 0.15); leaf.rotation.y = -l * 1.26; leaf.rotation.z = -0.35; tree.add(leaf); }
      tree.position.set(side * (4.5 + k * 0.25), 0.1, z);
      scene.add(tree);
    });
  });
  const lighthouse = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.3, 14), std('#f4f4f4'));
  tower.position.y = 0.65;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.2, 0.18, 14), std('#d33a2c'));
  band.position.y = 0.6;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), basic('#fff3a0'));
  lamp.position.y = 1.38;
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 16, 1, true), basic('#fff3a0', { transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.z = Math.PI / 2; beam.position.set(1.2, 0, 0);
  const beamPivot = new THREE.Group(); beamPivot.position.y = 1.38; beamPivot.add(beam);
  lighthouse.add(tower, band, lamp, beamPivot);
  lighthouse.position.set(2.7, 0, -2.9);
  scene.add(lighthouse);
  // the ships: hull, deck, a sail in the player's colour, a cannon, and foam behind
  const ship = (color) => {
    const g = new THREE.Group();
    const hullMat = std('#6b3f22', { roughness: 0.7 });
    const hull = box(0.5, 0.12, 0.24, hullMat);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 4), hullMat);
    bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.position.x = 0.34;
    const stripe = box(0.52, 0.03, 0.25, std(color)); stripe.position.y = 0.045;
    const deck = box(0.46, 0.02, 0.2, std('#c99a64')); deck.position.y = 0.07;
    const cabin = box(0.16, 0.1, 0.14, std('#efe6d2')); cabin.position.set(-0.12, 0.13, 0);
    const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.22, 10), std('#2a2a2a', { metalness: 0.6, roughness: 0.3 }));
    gun.rotation.z = Math.PI / 2; gun.position.set(0.16, 0.12, 0);
    const mast = box(0.02, 0.42, 0.02, std('#5a3a22')); mast.position.set(0.02, 0.3, 0);
    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.5, 0, 0, 0.12, 0, -0.22, 0.14, 0], 3));
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, std(color, { side: THREE.DoubleSide, roughness: 0.8 }));
    sail.position.x = 0.02;
    const flag = box(0.1, 0.06, 0.01, basic(color)); flag.position.set(0.07, 0.52, 0);
    g.add(hull, bow, stripe, deck, cabin, gun, mast, sail, flag);
    g.userData = { hullMat, sail, gun };
    return g;
  };
  const ships = [ship(SEAT_COLORS[0]), ship(SEAT_COLORS[1])];
  scene.add(...ships);
  // under each ship: a ring that fills as the cannon reloads, and the line its shots will take
  const reload = [0, 1].map((i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.018, 6, 40), basic(SEAT_COLORS[i], { transparent: true, opacity: 0.8 })); m.rotation.x = Math.PI / 2; scene.add(m); return m; });
  const aimDots = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), basic('#ffffff', { transparent: true, opacity: 0.55 })));
  const rocks = pool(scene, () => new THREE.Mesh(new THREE.OctahedronGeometry(1, 1), std('#7d776a', { roughness: 0.9, flatShading: true })));
  const foamRings = pool(scene, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 4, 20), basic('#ffffff', { transparent: true, opacity: 0.5 })); m.rotation.x = Math.PI / 2; return m; });
  const shots = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), std('#1b1b1b', { metalness: 0.6 })));
  const shotTrail = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), basic('#ffffff', { transparent: true, opacity: 0.35 })));
  const crates = pool(scene, () => { const g = new THREE.Group(); const b = box(0.22, 0.22, 0.22, std('#b07a3c')); const glow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), basic('#ffd23f', { transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(b, glow); g.userData = { b, glow }; return g; });
  // smoke, splashes, sparks, rain
  const puffs = [];
  const puff = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), basic('#ffffff', { transparent: true, depthWrite: false })));
  const add = (x, y, z, vx, vy, vz, life, size, color) => puffs.push({ x, y, z, vx, vy, vz, life, max: life, size, color });
  const rainMat = basic('#cfe3ff', { transparent: true, opacity: 0 });
  const rain = Array.from({ length: 60 }, (_, i) => { const m = box(0.008, 0.18, 0.008, rainMat); m.userData = { x: ((i * 37) % 100) / 100 * 9 - 4.5, y: ((i * 53) % 100) / 100 * 3, z: ((i * 71) % 100) / 100 * 5 - 2.3 }; scene.add(m); return m; });
  const shown = [null, null], wakes = [[], []];
  let prevShots = [], lastHurt = [0, 0], lastHp = [5, 5], lastCool = [0, 0], shake = 0, flash = 0, sinking = [0, 0];
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const tNow = s.t + alpha;
      // the sea rolls
      for (let k = 0; k < seaPos.count; k++) { const x = seaBase[k * 3], y = seaBase[k * 3 + 1]; seaPos.array[k * 3 + 2] = waveAt(x, y, tNow); }
      seaPos.needsUpdate = true;
      seaGeo.computeVertexNormals();
      waves.offset.x = (tNow * 0.0016) % 1;
      waves.offset.y = (tNow * 0.0007) % 1;
      // the storm: a dark sky, rain and lightning
      const storm = s.clock > SHIP_STORM && s.pause <= 0;
      const k = 1 - Math.exp(-dt * 1.2);
      scene.background.lerp(want.copy(storm ? stormSky : calmSky), k);
      scene.fog.color.copy(scene.background);
      sun.intensity = ease(sun.intensity, storm ? 0.5 : 1.7, k);
      rainMat.opacity = ease(rainMat.opacity, storm ? 0.5 : 0, k);
      rain.forEach((m) => { const u = m.userData; u.y -= dt * 6; if (u.y < 0) u.y += 3; m.visible = rainMat.opacity > 0.02; m.position.set(u.x, u.y, u.z); });
      if (storm && Math.random() < dt * 0.25) flash = 0.25;
      flash = Math.max(0, flash - dt);
      hemi.intensity = 1.35 + flash * 6;
      beamPivot.rotation.y = tNow * 0.02;
      s.ships.forEach((p, i) => {
        const m = ships[i], u = m.userData;
        // smooth: eased to where it is
        const tx = toX(p.x), tz = toZ(p.y);
        if (!shown[i] || s.pause > 85) shown[i] = { x: tx, z: tz, vx: 0 };
        const v = shown[i];
        const kk = 1 - Math.exp(-dt * 18);
        const nx = v.x + (tx - v.x) * kk, nz = v.z + (tz - v.z) * kk;
        const speed = Math.hypot(nx - v.x, nz - v.z) / Math.max(dt, 1e-3);
        v.vx = nx - v.x; v.x = nx; v.z = nz;
        // sinking: the losing ship goes down at the end of the round
        if (p.hp <= 0 && lastHp[i] > 0) sinking[i] = 1.2;
        if (p.hp > 0) sinking[i] = 0;
        sinking[i] = Math.max(0, sinking[i] - dt);
        m.visible = p.hp > 0 || sinking[i] > 0;
        const sink = p.hp > 0 ? 0 : (1.2 - sinking[i]) * 0.35;
        m.position.set(v.x, 0.07 + waveAt(v.x, -v.z, tNow) * 1.4 - sink, v.z);
        m.rotation.set(Math.sin(tNow * 0.05 + i) * 0.06 + (p.hp > 0 ? 0 : sink * 1.5), i ? Math.PI : 0, Math.sin(tNow * 0.07 + i) * 0.05 - v.vx * 2 * (i ? -1 : 1));
        u.hullMat.emissive.set(p.hurt > 0 && p.hurt % 4 > 1 ? '#ff2a00' : '#000000');
        u.sail.scale.x = 1 + Math.sin(tNow * 0.1 + i) * 0.06;
        // a wake of foam behind a moving ship
        if (speed > 0.3 && p.hp > 0 && Math.random() < 0.22) wakes[i].push({ x: v.x - (i ? -0.3 : 0.3), z: v.z, life: 0.7 });
        // cannon fire: a flash and a puff of smoke at the muzzle
        if (p.cool > lastCool[i] && p.hp > 0) { const dir = i ? -1 : 1; for (let q = 0; q < 5; q++) add(v.x + dir * 0.3, 0.14, v.z, dir * (0.4 + Math.random() * 0.4), 0.25 + Math.random() * 0.2, (Math.random() - 0.5) * 0.3, 0.5, 1.2, q < 2 ? '#ffd27a' : '#dcdcdc'); }
        lastCool[i] = p.cool;
        // hit: sparks and smoke, and the camera jolts
        if (p.hurt > lastHurt[i]) { for (let q = 0; q < 12; q++) { const a = Math.random() * TAU; add(v.x, 0.2, v.z, Math.cos(a) * 1.2, 0.6 + Math.random(), Math.sin(a) * 1.2, 0.5, 0.9, q % 2 ? '#ff8a3d' : '#ffd23f'); } for (let q = 0; q < 4; q++) add(v.x, 0.25, v.z, (Math.random() - 0.5) * 0.3, 0.4, (Math.random() - 0.5) * 0.3, 1.2, 2, '#555555'); shake = 0.25; }
        lastHurt[i] = p.hurt; lastHp[i] = p.hp;
        // reload ring and the line the shots will take
        const r = reload[i];
        r.visible = p.hp > 0 && s.pause <= 0;
        r.position.set(v.x, 0.06, v.z);
        r.scale.setScalar(0.6 + 0.4 * (1 - p.cool / SHIP_COOL));
        r.material.opacity = p.cool <= 4 ? 0.95 : 0.45;
      });
      // the aiming line for the ship on this screen
      aimDots.begin();
      const me = s.ships[0], v0 = shown[0];
      if (me && me.hp > 0 && v0 && s.pause <= 0) {
        const lanes = me.triple > 0 ? [-55, 0, 55] : [0];
        lanes.forEach((vy) => { for (let q = 1; q < 14; q++) { const t = q * 0.09; const d = aimDots.next(); d.position.set(v0.x + 0.3 + t * 3.2, 0.1, v0.z + (vy / 100) * t); } });
      }
      aimDots.end();
      foamRings.begin();
      wakes.forEach((list) => { for (let q = list.length - 1; q >= 0; q--) { const w = list[q]; w.life -= dt; if (w.life <= 0) { list.splice(q, 1); continue; } const m = foamRings.next(); m.position.set(w.x, 0.05, w.z); m.scale.setScalar(0.06 + (0.7 - w.life) * 0.16); m.material.opacity = w.life * 0.35; } });
      rocks.begin(); s.rocks.forEach((rk) => {
        const m = rocks.next(); m.position.set(toX(rk.x), 0, toZ(rk.y)); m.scale.setScalar(rk.r / 100 * 1.2);
        const f = foamRings.next(); f.position.set(toX(rk.x), 0.05, toZ(rk.y)); f.scale.setScalar(rk.r / 100 * 1.4 + Math.sin(tNow * 0.08 + rk.x) * 0.02); f.material.opacity = 0.35;
      }); rocks.end();
      foamRings.end();
      // cannonballs, smooth between ticks, with a little trail; one that vanished away from a ship splashes
      shots.begin(); shotTrail.begin();
      s.shots.forEach((b) => {
        const x = toX(b.x + b.vx * TICK * alpha), z = toZ(b.y + b.vy * TICK * alpha);
        const m = shots.next(); m.position.set(x, 0.16, z);
        for (let q = 1; q < 4; q++) { const t = shotTrail.next(); t.position.set(x - Math.sign(b.vx) * q * 0.07, 0.16, z - (b.vy / 320) * q * 0.07); t.scale.setScalar(1 - q * 0.25); }
      });
      shots.end(); shotTrail.end();
      prevShots.forEach((p) => {
        const still = s.shots.some(b => Math.abs(b.y - p.y - p.vy * TICK) < 14 && Math.abs(b.x - p.x) < 40 && Math.sign(b.vx) === Math.sign(p.vx));
        if (still) return;
        const nearShip = s.ships.some(sh => Math.hypot(sh.x - p.x, sh.y - p.y) < 34);
        if (!nearShip) for (let q = 0; q < 6; q++) add(toX(p.x), 0.08, toZ(p.y), (Math.random() - 0.5) * 0.5, 0.7 + Math.random() * 0.5, (Math.random() - 0.5) * 0.5, 0.5, 0.8, '#e6f6ff');
      });
      prevShots = s.shots.map(b => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy }));
      crates.begin(); if (s.crate) { const g = crates.next(); g.position.set(toX(s.crate.x), 0.15 + Math.sin(tNow * 0.1) * 0.04, toZ(s.crate.y)); g.rotation.y = tNow * 0.03; g.userData.b.material.color.set(s.crate.kind === 0 ? '#e0455a' : '#b07a3c'); g.userData.glow.material.color.set(s.crate.kind === 0 ? '#ff6b80' : '#ffd23f'); g.userData.glow.scale.setScalar(1 + Math.sin(tNow * 0.2) * 0.15); } crates.end();
      // smoke and splashes
      puff.begin();
      for (let q = puffs.length - 1; q >= 0; q--) {
        const p = puffs[q];
        p.life -= dt;
        if (p.life <= 0) { puffs.splice(q, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy -= 1.2 * dt;
        const m = puff.next(); m.position.set(p.x, p.y, p.z); m.scale.setScalar(p.size * (1.5 - p.life / p.max)); m.material.opacity = 0.7 * (p.life / p.max); m.material.color.set(p.color);
      }
      puff.end();
      shake = Math.max(0, shake - dt);
      tableCamera(camera);
      if (shake) camera.position.x += Math.sin(tNow * 2.9) * shake * 0.2;
    },
  };
}

function rallyView() {
  const scene = new THREE.Scene();
  const day = new THREE.Color('#9fd3ff'), dusk = new THREE.Color('#f2a06e');
  scene.background = day.clone();
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 50);
  // lower than the other table games, so the house, the neighbours and the sky are in the picture
  const rallyCamera = () => { camera.position.set(0, 3.3, 4.9); camera.lookAt(0, 0.35, -0.35); };
  rallyCamera();
  const hemi = new THREE.HemisphereLight('#fff6e0', '#3d7a46', 1.3);
  const sun = new THREE.DirectionalLight('#ffffff', 1.6);
  sun.position.set(2, 6, 4);
  scene.add(hemi, sun);
  // the yard: grass with a worn dirt strip where the rallies are played, and chalk lines
  const yardTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#3f8a49'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 600; k++) { g.fillStyle = k % 2 ? 'rgba(20,60,20,.18)' : 'rgba(180,230,140,.12)'; g.fillRect((k * 37) % w, (k * 61) % h, 2, 4); }
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(160,110,60,.0)'); grad.addColorStop(0.15, 'rgba(160,110,60,.55)'); grad.addColorStop(0.85, 'rgba(160,110,60,.55)'); grad.addColorStop(1, 'rgba(160,110,60,0)');
    g.fillStyle = grad; g.fillRect(0, h * 0.18, w, h * 0.64);
  });
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.9), std('#ffffff', { map: yardTex, roughness: 0.95 }));
  lane.rotation.x = -Math.PI / 2; lane.position.z = 0.2;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), std('#357a3e', { roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, -0.01, 0);
  scene.add(lawn, lane);
  const white = basic('#ffffff');
  [[0, -1.6, 6.4, 0.03], [0, 1.98, 6.4, 0.03]].forEach(([x, z, w, d]) => { const m = box(w, 0.01, d, white); m.position.set(x, 0.01, z); scene.add(m); });
  const mid = box(0.03, 0.01, 3.6, white); mid.position.set(0, 0.01, 0.2); scene.add(mid);
  // the back: a house wall with windows (neighbours watching), a brick wall, a tree, a clothesline
  const house = box(7.6, 2.2, 0.3, std('#e9d8b8', { roughness: 0.95 }));
  house.position.set(0, 1.1, -2.6);
  const roofTank = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16), std('#2c2c2c'));
  roofTank.position.set(2.4, 2.5, -2.6);
  scene.add(house, roofTank);
  const watchers = [];
  [-2.4, -0.8, 0.8].forEach((x, k) => {
    const frame = box(0.8, 0.6, 0.05, std('#7a4a2a')); frame.position.set(x, 1.4, -2.43);
    const glass = box(0.68, 0.48, 0.04, std('#2d3c52')); glass.position.set(x, 1.4, -2.41);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), std(['#f1c27d', '#c68642', '#8d5524'][k]));
    head.position.set(x + (k - 1) * 0.08, 1.33, -2.36);
    const body = box(0.26, 0.16, 0.06, std(['#d64545', '#2e86c1', '#f2b705'][k])); body.position.set(head.position.x, 1.2, -2.36);
    head.userData = { base: 1.33, body, ph: k * 2 };
    scene.add(frame, glass, body, head);
    watchers.push(head);
  });
  const wall = box(7, 0.6, 0.15, std('#b35c3a')); wall.position.set(0, 0.3, -1.8); scene.add(wall);
  // brick lines on the wall
  for (let k = 0; k < 3; k++) { const l = box(7, 0.015, 0.16, std('#8a4229')); l.position.set(0, 0.15 + k * 0.17, -1.8); scene.add(l); }
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 8), std('#6b4a2b')); trunk.position.y = 0.7;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 10), std('#2f7d32')); crown.position.y = 1.7;
  const crown2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), std('#3b9440')); crown2.position.set(0.4, 1.5, 0.2);
  tree.add(trunk, crown, crown2); tree.position.set(-3.9, 0, -1.9); scene.add(tree);
  const linePoleA = box(0.05, 1.3, 0.05, std('#888888')); linePoleA.position.set(1.0, 0.65, -2.1);
  const linePoleB = linePoleA.clone(); linePoleB.position.x = 3.6;
  const rope = box(2.6, 0.01, 0.01, std('#eeeeee')); rope.position.set(2.3, 1.28, -2.1);
  scene.add(linePoleA, linePoleB, rope);
  const clothes = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#ffffff'].map((c, k) => { const m = box(0.28, 0.34, 0.01, std(c, { side: THREE.DoubleSide })); m.position.set(1.4 + k * 0.45, 1.1, -2.1); scene.add(m); return m; });
  [[-3.2, 1.6], [3.4, 1.7]].forEach(([x, z]) => { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.24, 10), std('#b5651d')); pot.position.set(x, 0.12, z); const plant = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), std('#3b9440')); plant.position.set(x, 0.36, z); scene.add(pot, plant); });
  // the two players, each holding a bat in their colour
  const players = [0, 1].map((i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.3, 4, 10), std(SEAT_COLORS[i], { roughness: 0.7 }));
    body.position.y = 0.42;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), std(['#e0ac69', '#c68642'][i]));
    head.position.y = 0.78;
    const legs = box(0.16, 0.24, 0.1, std('#2f3e6b')); legs.position.y = 0.12;
    const bat = new THREE.Group();
    const blade = box(0.08, 0.08, 0.66, std('#d9b77a', { roughness: 0.6 }));
    const grip = box(0.05, 0.05, 0.22, std(SEAT_COLORS[i]));
    grip.position.z = i === 0 ? -0.44 : 0.44;
    bat.add(blade, grip);
    g.add(body, head, legs);
    scene.add(g, bat);
    return { g, bat, swing: 0 };
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), std('#d7f24f', { roughness: 0.6 }));
  const shade = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), basic('#000000', { transparent: true, opacity: 0.3 }));
  shade.rotation.x = -Math.PI / 2;
  scene.add(ball, shade);
  // where the ball will reach your bat: a glowing ring on the ground
  const landMat = basic('#ffe066', { transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  const land = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 28), landMat);
  land.rotation.x = Math.PI / 2;
  scene.add(land);
  const trail = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), basic('#ffd23f', { transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })));
  const hist = [];
  const puffs = [];
  const puff = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), basic('#ffffff', { transparent: true, depthWrite: false })));
  const add = (x, y, z, vx, vy, vz, life, size, color) => puffs.push({ x, y, z, vx, vy, vz, life, max: life, size, color });
  const BAT_X = [34, HOOP_W - 34];
  // where the ball meets a bat's line, bouncing off the top and bottom of the yard on the way
  const arrive = (b, tx) => {
    if (!b.vx) return null;
    const t = (tx - b.x) / b.vx;
    if (t < 0) return null;
    const lo = RALLY_TOP + 7, hi = HOOP_H - 7, span = hi - lo;
    let y = b.y + b.vy * t - lo;
    y = ((y % (2 * span)) + 2 * span) % (2 * span);
    return lo + (y > span ? 2 * span - y : y);
  };
  let lastRally = 0, lastPts = [0, 0], shake = 0, bx = null, by = null;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const tNow = s.t + alpha;
      // the afternoon wears on as the points go up: day to sunset
      const played = (s.points[0] + s.points[1]) / (RALLY_WIN * 2 - 1);
      scene.background.copy(day).lerp(dusk, Math.min(1, played * 1.1));
      sun.intensity = 1.6 - played * 0.5;
      sun.color.set('#ffffff').lerp(want.set('#ffb070'), played);
      // the ball: smooth between ticks; it bounces once in the middle of the yard
      const b = s.ball;
      const tx = s.pause > 0 ? b.x : b.x + b.vx * TICK * alpha, ty = s.pause > 0 ? b.y : b.y + b.vy * TICK * alpha;
      if (bx == null || Math.abs(tx - bx) > 120) { bx = tx; by = ty; }
      const kk = 1 - Math.exp(-dt * 30);
      bx += (tx - bx) * kk; by += (ty - by) * kk;
      const prog = (bx - BAT_X[0]) / (BAT_X[1] - BAT_X[0]);
      const hgt = 0.08 + Math.abs(Math.sin(prog * Math.PI * 2)) * 0.4;
      ball.position.set(toX(bx), hgt, toZ(by));
      shade.position.set(toX(bx), 0.012, toZ(by));
      shade.scale.setScalar(1 - hgt * 0.8);
      ball.rotation.x += dt * 12;
      // a long rally burns: a trail behind the ball, hotter the longer it goes
      const hot = Math.min(1, s.rally / 14);
      hist.unshift([ball.position.x, ball.position.y, ball.position.z]);
      if (hist.length > 10) hist.length = 10;
      trail.begin();
      if (s.rally >= 4 && s.pause <= 0) hist.forEach(([x, y, z], q) => { const m = trail.next(); m.position.set(x, y, z); m.scale.setScalar(Math.max(0.2, 1 - q * 0.09) * (1 + hot)); m.material.color.set(hot > 0.6 ? '#ff5a2a' : '#ffd23f'); });
      trail.end();
      ball.material.emissive.set(hot > 0.6 ? '#5a1a00' : '#000000');
      // the players follow their bats; a hit swings the bat and kicks up dust
      s.bats.forEach((y, i) => {
        const P = players[i], x = toX(BAT_X[i]), z = toZ(y);
        P.g.position.set(x + (i ? 0.35 : -0.35), 0, z);
        P.g.rotation.y = i ? -Math.PI / 2 : Math.PI / 2;
        P.swing = Math.max(0, P.swing - dt * 4);
        P.bat.position.set(x, 0.12, z);
        P.bat.rotation.y = (i ? 1 : -1) * Math.sin(P.swing * Math.PI) * 0.6;
      });
      if (s.rally > lastRally && s.rally > 0) {
        const i = b.vx > 0 ? 0 : 1;
        players[i].swing = 1;
        for (let q = 0; q < 8; q++) add(toX(BAT_X[i]), 0.15, toZ(s.bats[i]), (Math.random() - 0.5) * 0.8 + (i ? -0.6 : 0.6), 0.5 + Math.random() * 0.4, (Math.random() - 0.5) * 0.8, 0.4, 0.8, q % 2 ? '#fff6a0' : '#e8d6a8');
        if (s.rally >= 10) shake = 0.12;
      }
      lastRally = s.rally;
      // a point: confetti on the winner's side, the neighbours jump
      s.points.forEach((v, i) => {
        if (v > lastPts[i]) { for (let q = 0; q < 26; q++) add(toX(BAT_X[i]) * 0.7, 0.4, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 1.4 + Math.random() * 1.2, (Math.random() - 0.5) * 1.2, 1.2, 1, ['#ff5a4f', '#ffd23f', '#39b6ff', '#5be37d', '#ffffff'][q % 5]); watchers.forEach(w => { w.userData.jump = 1; }); }
        lastPts[i] = v;
      });
      watchers.forEach((w) => { const u = w.userData; u.jump = Math.max(0, (u.jump || 0) - dt * 1.5); const up = (s.rally >= 8 ? 0.03 : 0) * Math.abs(Math.sin(tNow * 0.2 + u.ph)) + u.jump * Math.abs(Math.sin(tNow * 0.4 + u.ph)) * 0.08; w.position.y = u.base + up; u.body.position.y = 1.2 + up; });
      clothes.forEach((c, k) => { c.rotation.x = Math.sin(tNow * 0.05 + k) * 0.25; });
      // the ring where the ball will reach my bat
      const coming = b.vx < 0 && s.pause <= 0;
      const ay = coming ? arrive(b, BAT_X[0]) : null;
      land.visible = ay != null;
      if (ay != null) { land.position.set(toX(BAT_X[0]), 0.02, toZ(ay)); land.scale.setScalar(1 + Math.sin(tNow * 0.3) * 0.1); }
      puff.begin();
      for (let q = puffs.length - 1; q >= 0; q--) {
        const p = puffs[q];
        p.life -= dt;
        if (p.life <= 0) { puffs.splice(q, 1); continue; }
        p.vy -= 2.5 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const m = puff.next(); m.position.set(p.x, Math.max(0.02, p.y), p.z); m.scale.setScalar(p.size); m.material.opacity = Math.min(1, p.life / p.max * 1.5); m.material.color.set(p.color);
      }
      puff.end();
      shake = Math.max(0, shake - dt);
      rallyCamera();
      if (shake) camera.position.x += Math.sin(tNow * 3) * shake * 0.2;
    },
  };
}

// the garden's grass at each level: spring green, deeper green, evening, night under a lamp
const SNAKE_MOODS = [
  { a: '#4a8a44', b: '#3f7a3b', bg: '#9fd3ff', light: 1.3 },
  { a: '#3f8a52', b: '#357a46', bg: '#8cc8e8', light: 1.25 },
  { a: '#6a7a3a', b: '#5d6c32', bg: '#f0a878', light: 1.1 },
  { a: '#2f5a4a', b: '#284e40', bg: '#1f2a44', light: 0.9 },
];
function snakeView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SNAKE_MOODS[0].bg);
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 50);
  tableCamera(camera, 5.4, 4.0);
  const hemi = new THREE.HemisphereLight('#ffffff', '#224422', 1.3);
  const sun = new THREE.DirectionalLight('#ffffff', 1.5);
  sun.position.set(2, 6, 4);
  scene.add(hemi, sun);
  const C = 0.2;
  // the field: a checked lawn, tinted by the level
  const grid = canvasTex(SNAKE_COLS * 8, SNAKE_ROWS * 8, (g) => { for (let y = 0; y < SNAKE_ROWS; y++) for (let x = 0; x < SNAKE_COLS; x++) { g.fillStyle = (x + y) % 2 ? '#d8d8d8' : '#ffffff'; g.fillRect(x * 8, y * 8, 8, 8); } });
  grid.magFilter = THREE.NearestFilter;
  const lawnMat = std(SNAKE_MOODS[0].a, { map: grid });
  const soil = std('#5a3a22');
  const field = box(SNAKE_COLS * C, 0.1, SNAKE_ROWS * C, [soil, soil, lawnMat, soil, soil, soil]);
  field.position.set(0, -0.05, 0.2);
  scene.add(field);
  const garden = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), std('#3b6e36', { roughness: 1 }));
  garden.rotation.x = -Math.PI / 2; garden.position.y = -0.1;
  scene.add(garden);
  // a little wooden fence round it, with flowers and bushes outside
  const fenceMat = std('#a8733e', { roughness: 0.8 });
  const W2 = (SNAKE_COLS * C) / 2 + 0.12, D2 = (SNAKE_ROWS * C) / 2 + 0.12;
  [[0, -D2, W2 * 2, 0.04], [0, D2, W2 * 2, 0.04], [-W2, 0, 0.04, D2 * 2], [W2, 0, 0.04, D2 * 2]].forEach(([x, z, w, d]) => { const rail = box(w, 0.04, d, fenceMat); rail.position.set(x, 0.12, z + 0.2); scene.add(rail); });
  for (let k = 0; k <= 16; k++) [-D2, D2].forEach((z) => { const p = box(0.05, 0.2, 0.05, fenceMat); p.position.set(-W2 + (k / 16) * W2 * 2, 0.08, z + 0.2); scene.add(p); });
  for (let k = 0; k <= 9; k++) [-W2, W2].forEach((x) => { const p = box(0.05, 0.2, 0.05, fenceMat); p.position.set(x, 0.08, -D2 + (k / 9) * D2 * 2 + 0.2); scene.add(p); });
  const flowerCols = ['#ff5a7a', '#ffd23f', '#ffffff', '#c38bff', '#ff8a3d'];
  for (let k = 0; k < 26; k++) {
    const side = k % 2 ? 1 : -1, x = side * (W2 + 0.4 + (k % 3) * 0.35), z = -1.6 + ((k * 0.53) % 3.6);
    if (k % 4 === 0) { const bush = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), std('#2f7d32')); bush.position.set(x, 0.05, z); scene.add(bush); }
    else { const st = box(0.015, 0.16, 0.015, std('#2f7d32')); st.position.set(x, 0.0, z); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), basic(flowerCols[k % flowerCols.length])); fl.position.set(x, 0.09, z); scene.add(st, fl); }
  }
  const cx = (x) => (x - (SNAKE_COLS - 1) / 2) * C, cz = (y) => (y - (SNAKE_ROWS - 1) / 2) * C + 0.2;
  // the snakes: round segments with a stripe every other one, a head with eyes and a flicking tongue
  const segMats = SEAT_COLORS.map(c => [std(c, { roughness: 0.45 }), std(new THREE.Color(c).offsetHSL(0, 0, -0.12).getStyle(), { roughness: 0.45 })]);
  const deadMat = std('#8a8a8a', { roughness: 0.8, transparent: true, opacity: 0.55 });
  const parts = SEAT_COLORS.map(() => pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(C * 0.52, 12, 10), deadMat)));
  const heads = SEAT_COLORS.map((col, i) => {
    const h = new THREE.Group();
    const skull = new THREE.Mesh(new THREE.SphereGeometry(C * 0.62, 16, 12), segMats[i][0]);
    skull.scale.set(1, 0.85, 1.15);
    const white = basic('#ffffff'), black = basic('#111111');
    [-1, 1].forEach((sd) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), white); e.position.set(sd * 0.06, 0.06, -0.07); const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), black); p.position.set(sd * 0.06, 0.068, -0.098); h.add(e, p); });
    const tongue = box(0.02, 0.006, 0.09, basic('#e0324a'));
    tongue.position.set(0, -0.01, -0.15);
    h.add(skull, tongue);
    h.userData = { skull, tongue };
    scene.add(h);
    return h;
  });
  // food: a samosa on a little plate, glowing; the golden one sparkles
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.02, 16), std('#f4f4f4'));
  const samosa = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 3), std('#e9a23b', { roughness: 0.7 }));
  const foodGlow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), basic('#ffd27a', { transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }));
  const golden = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 3), std('#ffd23f', { metalness: 0.7, roughness: 0.2, emissive: '#7a5a00' }));
  const goldGlow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), basic('#fff3a0', { transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(plate, samosa, foodGlow, golden, goldGlow);
  // brick walls: real bricks with mortar
  const brickTex = canvasTex(32, 32, (g, w, h) => { g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, w, h); g.fillStyle = '#b5542f'; g.fillRect(1, 1, 14, 7); g.fillRect(17, 1, 14, 7); g.fillRect(-7, 9, 14, 7); g.fillRect(9, 9, 14, 7); g.fillRect(25, 9, 14, 7); g.fillRect(1, 17, 14, 7); g.fillRect(17, 17, 14, 7); g.fillRect(-7, 25, 14, 7); g.fillRect(9, 25, 14, 7); g.fillRect(25, 25, 14, 7); });
  const brickMat = std('#ffffff', { map: brickTex, roughness: 0.9 });
  const bricks = pool(scene, () => box(C * 0.98, C * 1.2, C * 0.98, brickMat));
  // the cell in front of my snake: red if it is a wall, a brick or a body
  const dangerMat = basic('#ff3b3b', { transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const danger = new THREE.Mesh(new THREE.PlaneGeometry(C * 0.95, C * 0.95), dangerMat);
  danger.rotation.x = -Math.PI / 2;
  // a soft arrow from my head towards the samosa
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 3), basic('#ffffff', { transparent: true, opacity: 0.55 }));
  arrow.rotation.x = -Math.PI / 2;
  scene.add(danger, arrow);
  const bits = pool(scene, () => new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), basic('#ffffff', { side: THREE.DoubleSide, transparent: true })));
  const fx = [];
  const burst = (x, z, n, cols, sp = 1.4) => { for (let q = 0; q < n; q++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); fx.push({ x, y: 0.2, z, vx: Math.cos(a) * v, vy: 1 + Math.random(), vz: Math.sin(a) * v, life: 0.7, c: cols[q % cols.length], r: Math.random() * 6 }); } };
  const DIRV = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
  const ROT = { u: 0, l: Math.PI / 2, d: Math.PI, r: -Math.PI / 2 };
  const last = [];
  let lastLevel = 1;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const tNow = s.t + alpha;
      const mood = SNAKE_MOODS[Math.min(SNAKE_MOODS.length, s.level || 1) - 1];
      const k = 1 - Math.exp(-dt * 1.4);
      scene.background.lerp(want.set(mood.bg), k);
      lawnMat.color.lerp(want.set(mood.a), k);
      hemi.intensity = ease(hemi.intensity, mood.light, k);
      // smooth: each segment slides from where it was to where it is, over the time between moves
      const step = Math.max(4, 10 - ((s.level || 1) - 1));
      const f = Math.min(1, (s.wait + alpha) / step);
      s.snakes.forEach((n, i) => {
        const L = last[i] || (last[i] = { body: n.body.map(c => c.slice()), score: n.score, alive: n.alive });
        // a move happened since the last frame: remember where everything was before it
        if (n.body[0][0] !== L.cur?.[0] || n.body[0][1] !== L.cur?.[1]) { L.prev = L.curBody || n.body.map(c => c.slice()); L.cur = n.body[0].slice(); L.curBody = n.body.map(c => c.slice()); }
        const prev = L.prev || n.body;
        const at = (kk) => { const [x1, y1] = n.body[kk]; const p0 = prev[kk] || n.body[kk]; return [cx(p0[0] + (x1 - p0[0]) * f), cz(p0[1] + (y1 - p0[1]) * f)]; };
        parts[i].begin();
        for (let kk = 1; kk < n.body.length; kk++) {
          const [x, z] = at(kk);
          const m = parts[i].next();
          m.material = n.alive ? segMats[i][kk % 2] : deadMat;
          m.position.set(x, C * 0.42, z);
          m.scale.setScalar(Math.max(0.6, 1 - kk * 0.012));
        }
        parts[i].end();
        const [hx, hz] = at(0);
        const h = heads[i];
        h.visible = true;
        h.position.set(hx, C * 0.5, hz);
        h.rotation.y = ROT[n.d] || 0;
        h.userData.skull.material = n.alive ? segMats[i][0] : deadMat;
        h.userData.tongue.visible = n.alive && Math.floor(tNow / 10) % 3 === 0;
        // ate: a burst where the head is; died: smoke
        if (n.score > L.score) burst(hx, hz, n.score - L.score >= 3 ? 24 : 12, n.score - L.score >= 3 ? ['#ffd23f', '#fff3a0'] : ['#e9a23b', '#ffd27a', '#ffffff']);
        if (L.alive && !n.alive) burst(hx, hz, 16, ['#777777', '#999999', '#555555'], 0.8);
        L.score = n.score; L.alive = n.alive;
      });
      heads.forEach((h, i) => { if (i >= s.snakes.length) h.visible = false; });
      // food
      const fxp = cx(s.food[0]), fzp = cz(s.food[1]);
      plate.position.set(fxp, 0.01, fzp);
      samosa.position.set(fxp, 0.13 + Math.sin(tNow * 0.12) * 0.03, fzp);
      samosa.rotation.y = tNow * 0.05;
      foodGlow.position.set(fxp, 0.12, fzp);
      foodGlow.scale.setScalar(1 + Math.sin(tNow * 0.15) * 0.15);
      bricks.begin(); (s.walls || []).forEach(([x, y]) => { bricks.next().position.set(cx(x), C * 0.55, cz(y)); }); bricks.end();
      const gv = !!s.gold && (s.gold.ttl > 90 || Math.floor(tNow / 6) % 2 === 1);
      golden.visible = goldGlow.visible = gv;
      if (s.gold) { golden.position.set(cx(s.gold.x), 0.16 + Math.sin(tNow * 0.2) * 0.06, cz(s.gold.y)); golden.rotation.y = -tNow * 0.12; goldGlow.position.copy(golden.position); goldGlow.scale.setScalar(1 + Math.sin(tNow * 0.3) * 0.2); }
      // the danger cell in front of my snake, and the arrow to the food
      const me = s.snakes[0];
      danger.visible = false; arrow.visible = false;
      if (me?.alive) {
        const [dx, dy] = DIRV[me.next] || DIRV[me.d];
        const nx = me.body[0][0] + dx, ny = me.body[0][1] + dy;
        const off = nx < 0 || nx >= SNAKE_COLS || ny < 0 || ny >= SNAKE_ROWS;
        const blocked = off || (s.walls || []).some(([a, b]) => a === nx && b === ny) || s.snakes.some(o => o.alive && o.body.some(([a, b]) => a === nx && b === ny));
        if (blocked) { danger.visible = true; danger.position.set(cx(Math.max(-0.5, Math.min(SNAKE_COLS - 0.5, nx))), 0.012, cz(Math.max(-0.5, Math.min(SNAKE_ROWS - 0.5, ny)))); dangerMat.opacity = 0.4 + Math.sin(tNow * 0.6) * 0.2; }
        const [hx, hz] = [heads[0].position.x, heads[0].position.z];
        const ang = Math.atan2(fzp - hz, fxp - hx);
        if (Math.hypot(fzp - hz, fxp - hx) > C * 2.5) { arrow.visible = true; arrow.position.set(hx + Math.cos(ang) * 0.32, 0.06, hz + Math.sin(ang) * 0.32); arrow.rotation.set(-Math.PI / 2, 0, -ang - Math.PI / 2); }
      }
      // a new level: confetti over the field
      if ((s.level || 1) > lastLevel) for (let q = 0; q < 40; q++) fx.push({ x: (Math.random() - 0.5) * 6, y: 1.6, z: (Math.random() - 0.5) * 3, vx: 0, vy: -0.4, vz: 0, life: 2, c: ['#ff5a4f', '#ffd23f', '#39b6ff', '#5be37d', '#ffffff'][q % 5], r: Math.random() * 6 });
      lastLevel = s.level || 1;
      bits.begin();
      for (let q = fx.length - 1; q >= 0; q--) {
        const b = fx[q];
        b.life -= dt;
        if (b.life <= 0) { fx.splice(q, 1); continue; }
        b.vy -= 2.5 * dt; b.x += b.vx * dt; b.y = Math.max(0.02, b.y + b.vy * dt); b.z += b.vz * dt; b.r += dt * 7;
        const m = bits.next(); m.position.set(b.x, b.y, b.z); m.rotation.set(b.r, b.r * 0.6, 0); m.material.color.set(b.c); m.material.opacity = Math.min(1, b.life * 2);
      }
      bits.end();
    },
  };
}

/* ─── Road Dash: behind the rickshaws, from village fields to an evening rush hour ─── */
// each stretch of road: the sky, the ground beside it, and how bright the street lights are
const ROAD_MOODS = [
  { sky: '#9fd3ff', ground: '#6fa84f', fog: '#bfe2ff', sun: 1.6, lights: 0 },   // village road
  { sky: '#a8d8f0', ground: '#8a9a5a', fog: '#c8e6f2', sun: 1.5, lights: 0 },   // town road
  { sky: '#b8d0e8', ground: '#7a8a6a', fog: '#cfdcea', sun: 1.35, lights: 0.2 }, // highway
  { sky: '#f29a6a', ground: '#5a5a3a', fog: '#e8a07a', sun: 0.9, lights: 1 },    // rush hour: evening
];
function roadView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ROAD_MOODS[0].sky);
  scene.fog = new THREE.Fog(ROAD_MOODS[0].fog, 14, 30);
  const camera = new THREE.PerspectiveCamera(58, 1.6, 0.1, 60);
  camera.position.set(0, 2.5, 4.6);
  camera.lookAt(0, 0, -4);
  const hemi = new THREE.HemisphereLight('#fff6e0', '#6fa84f', 1.3);
  const sun = new THREE.DirectionalLight('#ffffff', 1.6);
  sun.position.set(2, 6, 4);
  scene.add(hemi, sun);
  const roadTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3b3f46'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 300; k++) { g.fillStyle = k % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)'; g.fillRect((k * 37) % w, (k * 61) % h, 3, 3); }
    g.fillStyle = '#f2efe6';
    for (let l = 1; l < 4; l++) for (let y = 0; y < h; y += 64) g.fillRect((l * w) / 4 - 3, y, 6, 34);
    g.fillRect(4, 0, 6, h); g.fillRect(w - 10, 0, 6, h);
  }, [1, 6]);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 40), std('#ffffff', { map: roadTex, roughness: 0.75 }));
  road.rotation.x = -Math.PI / 2; road.position.z = -14;
  const groundMat = std(ROAD_MOODS[0].ground);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
  grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.01, -14);
  // kerbs: red and white, scrolling with the road
  const kerbTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d33a2c'; g.fillRect(0, 0, w, h / 2); }, [1, 20]);
  const kerbs = [-1, 1].map((side) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 40), std('#ffffff', { map: kerbTex })); m.position.set(side * 2.39, 0.04, -14); return m; });
  scene.add(grass, road, ...kerbs);
  // my lane glows faintly, so you can see where you are on a busy road
  const laneGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 12), basic('#ffd23f', { transparent: true, opacity: 0.08, depthWrite: false }));
  laneGlow.rotation.x = -Math.PI / 2; laneGlow.position.set(0, 0.012, -4);
  scene.add(laneGlow);
  const laneX = (l) => (l - 1.5) * 1.1;
  const zOf = (x) => -(x - 110) / 52;
  // scenery that comes past: trees and hay (village), shops (town), billboards (highway), street lights
  const leaf = std('#2f7d32'), trunkMat = std('#6b4a2b');
  const trees = pool(scene, () => { const t = new THREE.Group(); const trunk = box(0.15, 0.6, 0.15, trunkMat); trunk.position.y = 0.3; const top = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), leaf); top.position.y = 0.85; t.add(trunk, top); return t; });
  const hay = pool(scene, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 12), std('#d9b24a', { roughness: 1 })); m.rotation.z = Math.PI / 2; m.position.y = 0.28; return m; });
  const shopCols = ['#e8742a', '#2e86c1', '#c0392b', '#27ae60', '#8e44ad', '#f2b705'];
  const shopSigns = ['CHAI', 'SWEETS', 'MOBILE', 'KIRANA', 'TAILOR', 'PAAN'];
  const signTex = shopSigns.map((t, k) => canvasTex(128, 32, (g, w, h) => { g.fillStyle = shopCols[k]; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '800 20px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, w / 2, h / 2 + 1); }));
  let shopN = 0;
  const shops = pool(scene, () => {
    const k = shopN++ % shopSigns.length;
    const g = new THREE.Group();
    const body = box(1.4, 1.1, 1.0, std(['#e9dcc0', '#d8c4a0', '#f0e6d0'][k % 3], { roughness: 0.95 }));
    body.position.y = 0.55;
    const awning = box(1.5, 0.06, 0.5, std(shopCols[k]));
    awning.position.set(0, 0.8, 0.6); awning.rotation.x = 0.3;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), basic('#ffffff', { map: signTex[k] }));
    sign.position.set(0, 1.0, 0.51);
    g.add(body, awning, sign);
    return g;
  });
  const bbTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, h); g.fillStyle = '#b5341f'; g.font = '900 44px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CHITPLAY', w / 2, h / 2 - 12); g.fillStyle = '#1d2a4d'; g.font = '700 22px system-ui, sans-serif'; g.fillText('30+ free games', w / 2, h / 2 + 28); });
  const boards = pool(scene, () => { const g = new THREE.Group(); const p1 = box(0.08, 1.6, 0.08, std('#555b66')); p1.position.set(-0.6, 0.8, 0); const p2 = p1.clone(); p2.position.x = 0.6; const face = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), basic('#ffffff', { map: bbTex })); face.position.y = 1.8; g.add(p1, p2, face); return g; });
  const bulbMat = basic('#fff1b0');
  const glowMat = basic('#ffd27a', { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const poles = pool(scene, () => { const g = new THREE.Group(); const p = box(0.06, 1.8, 0.06, std('#5b616b')); p.position.y = 0.9; const arm = box(0.6, 0.04, 0.04, std('#5b616b')); arm.position.set(0.3, 1.8, 0); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), bulbMat); bulb.position.set(0.58, 1.76, 0); const glow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), glowMat); glow.position.copy(bulb.position); g.add(p, arm, bulb, glow); return g; });
  const rickshaw = (color) => {
    const g = new THREE.Group();
    const body = box(0.55, 0.35, 0.8, std(color)); body.position.y = 0.32;
    const roof = box(0.6, 0.06, 0.75, std('#222222')); roof.position.y = 0.72;
    const p1 = box(0.04, 0.32, 0.04, std('#222222')); p1.position.set(0.26, 0.55, -0.3); const p2 = p1.clone(); p2.position.x = -0.26;
    const glass = box(0.45, 0.22, 0.02, std('#9fd3ff', { metalness: 0.3, roughness: 0.1 })); glass.position.set(0, 0.6, -0.36);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), basic('#fff6c0')); lamp.position.set(0, 0.36, -0.42);
    const wheel = () => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), std('#111111')); w.rotation.z = Math.PI / 2; return w; };
    const w1 = wheel(); w1.position.set(0, 0.12, -0.38); const w2 = wheel(); w2.position.set(0.3, 0.12, 0.28); const w3 = wheel(); w3.position.set(-0.3, 0.12, 0.28);
    g.add(body, roof, p1, p2, glass, lamp, w1, w2, w3);
    g.userData = { wheels: [w1, w2, w3], lamp };
    return g;
  };
  const carts = [], shownY = [];
  const things = [
    pool(scene, () => { const c = new THREE.Group(); const b = box(0.5, 0.4, 0.9, std('#f4f1ea')); b.position.y = 0.55; const h = box(0.3, 0.3, 0.3, std('#f4f1ea')); h.position.set(0, 0.75, 0.55); const sp = box(0.2, 0.2, 0.2, std('#3a2a1a')); sp.position.set(0.1, 0.6, 0.1); [[-0.18, -0.3], [0.18, -0.3], [-0.18, 0.3], [0.18, 0.3]].forEach(([x, z]) => { const l = box(0.08, 0.36, 0.08, std('#f4f1ea')); l.position.set(x, 0.18, z); c.add(l); }); const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), std('#e8dcc0')); hornL.position.set(0.1, 0.95, 0.6); const hornR = hornL.clone(); hornR.position.x = -0.1; c.add(b, h, sp, hornL, hornR); return c; }),
    pool(scene, () => { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CircleGeometry(0.42, 18), basic('#1a1a1a')); p.rotation.x = -Math.PI / 2; p.position.y = 0.01; const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 10), std('#ff7a1a')); cone.position.set(0.45, 0.15, 0); g.add(p, cone); return g; }),
    pool(scene, () => { const b = new THREE.Group(); const body = box(0.9, 0.9, 2.1, std('#d63b2f')); body.position.y = 0.55; const win = box(0.92, 0.25, 1.8, std('#9fd3ff')); win.position.y = 0.75; const stripe = box(0.92, 0.08, 2.12, std('#ffd23f')); stripe.position.y = 0.35; b.add(body, win, stripe); return b; }),
    pool(scene, () => rickshaw('#2e9e4f')),
  ];
  // where something is coming at you in your own lane: a red warning on the road under it
  const warnMat = basic('#ff3b3b', { transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const warns = pool(scene, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.2), warnMat); m.rotation.x = -Math.PI / 2; m.position.y = 0.015; return m; });
  const coins = pool(scene, () => new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 18), std('#ffd23f', { metalness: 0.7, roughness: 0.25, emissive: '#5a4200' })));
  const coinGlow = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), basic('#ffe680', { transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })));
  const streakMat = basic('#ffffff', { transparent: true, opacity: 0, depthWrite: false });
  const streaks = Array.from({ length: 16 }, (_, i) => { const m = box(0.02, 0.02, 1.4, streakMat); m.userData = { x: (i % 2 ? -1 : 1) * (2.6 + (i % 4) * 0.4), y: 0.3 + (i % 3) * 0.5, z: -(i * 2.5) % 30 }; scene.add(m); return m; });
  const puffs = [];
  const puff = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), basic('#ffffff', { transparent: true, depthWrite: false })));
  const add = (x, y, z, vx, vy, vz, life, size, color) => puffs.push({ x, y, z, vx, vy, vz, life, max: life, size, color });
  let dShown = null, camX = 0, shake = 0;
  const lastCoins = [], lastAlive = [];
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const tNow = s.t + alpha;
      const v = roadSpeed(s.dist);
      // smooth: the road moves on every frame, carried on between the game's ticks
      if (dShown == null || Math.abs(s.dist - dShown) > 200) dShown = s.dist;
      dShown += v * dt;
      dShown += (s.dist + v * TICK * alpha - dShown) * (1 - Math.exp(-dt * 10));
      const d = dShown, ahead = (s.dist + v * TICK * alpha) - s.dist;
      // the level's mood
      const mood = ROAD_MOODS[Math.min(ROAD_MOODS.length, s.level || 1) - 1];
      const k = 1 - Math.exp(-dt * 1.2);
      scene.background.lerp(want.set(mood.sky), k);
      scene.fog.color.lerp(want.set(mood.fog), k);
      groundMat.color.lerp(want.set(mood.ground), k);
      sun.intensity = ease(sun.intensity, mood.sun, k);
      glowMat.opacity = ease(glowMat.opacity, mood.lights * 0.35, k);
      roadTex.offset.y = (d / 260) % 1;
      kerbTex.offset.y = (d / 130) % 1;
      // scenery by stretch of road
      const lv = s.level || 1;
      trees.begin(); hay.begin(); shops.begin(); boards.begin(); poles.begin();
      for (let q = 0; q < 10; q++) {
        const z = -((q * 4.2 + (d / 52)) % 42) + 4;
        [-1, 1].forEach((side) => {
          const x = side * 3.2;
          if (lv === 1) { const t = trees.next(); t.position.set(x + (q % 2) * 0.6 * side, 0, z); if (q % 3 === 0) hay.next().position.set(x + side * 1.6, 0.28, z + 1); }
          else if (lv === 2) { const sh = shops.next(); sh.position.set(side * 3.6, 0, z); sh.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; }
          else { if (q % 2 === 0) { const t = trees.next(); t.position.set(x + side * 1.2, 0, z); } if (q % 4 === 1 && side > 0) { const b = boards.next(); b.position.set(side * 3.4, 0, z); b.rotation.y = -0.6; } }
          if (q % 2 === 0) { const pl = poles.next(); pl.position.set(side * 2.6, 0, z + 1.5); pl.rotation.y = side > 0 ? Math.PI : 0; }
        });
      }
      trees.end(); hay.end(); shops.end(); boards.end(); poles.end();
      // what's on the road
      const me = s.carts[0];
      things.forEach(p => p.begin()); warns.begin();
      s.things.forEach((t) => {
        const x = t.x - (v + (t.v || 0)) * TICK * alpha;
        if (zOf(x) > 1.6) return;   // already behind us: it would fill the camera
        const m = things[t.kind].next(); m.position.set(laneX(t.l), t.v ? Math.abs(Math.sin(tNow * 0.5)) * 0.03 : 0, zOf(x));
        m.rotation.y = t.kind === 3 ? (t.v ? Math.PI : 0) : t.kind === 0 ? Math.PI / 2 : 0;
        if (t.kind === 3) m.userData.lamp.material.color.set(t.v || mood.lights > 0.5 ? '#fffbe0' : '#fff6c0');
        // in my lane and close: a red warning on the road under it
        if (me?.alive && t.l === me.l && x > me.x && x - me.x < 90 + (v + (t.v || 0)) * 0.6) { const w = warns.next(); w.position.set(laneX(t.l), 0.015, zOf(x)); w.scale.y = 1 + Math.sin(tNow * 0.5) * 0.1; }
      });
      things.forEach(p => p.end()); warns.end();
      warnMat.opacity = 0.35 + Math.sin(tNow * 0.4) * 0.15;
      coins.begin(); coinGlow.begin();
      s.coins.forEach((c) => { const x = c.x - v * TICK * alpha; if (zOf(x) > 1.6) return; const m = coins.next(); m.position.set(laneX(c.l), 0.35 + Math.sin(tNow * 0.15 + c.x) * 0.05, zOf(x)); m.rotation.set(Math.PI / 2, 0, tNow * 0.12); const gl = coinGlow.next(); gl.position.copy(m.position); gl.scale.setScalar(s.rush > 0 ? 1.3 : 1); });
      coins.end(); coinGlow.end();
      // the rickshaws: smooth lane changes, wheels turning, exhaust, sparkles for a coin, smoke for a crash
      s.carts.forEach((c, i) => {
        if (!carts[i]) { carts[i] = rickshaw(SEAT_COLORS[i]); scene.add(carts[i]); shownY[i] = c.y; }
        shownY[i] += (c.y - shownY[i]) * (1 - Math.exp(-dt * 16));
        const lane = (shownY[i] - 76) / 78;
        const m = carts[i];
        m.position.set(laneX(lane), c.alive ? Math.abs(Math.sin(tNow * 0.4 + i)) * 0.02 : 0, zOf(c.x));
        m.rotation.set(0, (laneX(c.l) - laneX(lane)) * -0.5, c.alive ? 0 : 0.5);
        m.userData.wheels.forEach((w) => { w.rotation.x += dt * (c.alive ? v / 30 : 0); });
        m.userData.lamp.material.color.set(mood.lights > 0.5 ? '#fffbe0' : '#fff6c0');
        if (c.alive && Math.random() < 0.3) add(m.position.x + 0.15, 0.15, m.position.z + 0.45, (Math.random() - 0.5) * 0.2, 0.3, 0.6, 0.6, 0.8, '#cfcfcf');
        if (c.coins > (lastCoins[i] ?? c.coins)) for (let q = 0; q < 10; q++) { const a = (q / 10) * TAU; add(m.position.x, 0.6, m.position.z - 0.3, Math.cos(a) * 1.2, Math.sin(a) * 1.2 + 0.5, 0, 0.45, 0.6, '#ffe066'); }
        if (lastAlive[i] && !c.alive) { for (let q = 0; q < 10; q++) add(m.position.x, 0.4, m.position.z - 0.3, (Math.random() - 0.5) * 1.2, 0.6 + Math.random(), (Math.random() - 0.5) * 0.6, 1.1, 1.8, q % 3 ? '#666666' : '#ff8a3d'); if (i === 0) shake = 0.4; }
        lastCoins[i] = c.coins; lastAlive[i] = c.alive;
      });
      // my lane
      if (me) { laneGlow.position.x = ease(laneGlow.position.x, laneX(me.l), 1 - Math.exp(-dt * 12)); laneGlow.visible = me.alive; }
      // smoke and sparkles
      puff.begin();
      for (let q = puffs.length - 1; q >= 0; q--) {
        const p = puffs[q];
        p.life -= dt;
        if (p.life <= 0) { puffs.splice(q, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const m = puff.next(); m.position.set(p.x, p.y, p.z); m.scale.setScalar(p.size * (1.5 - p.life / p.max)); m.material.opacity = 0.6 * (p.life / p.max); m.material.color.set(p.color);
      }
      puff.end();
      // speed lines once it's fast
      const fast = Math.max(0, (v - 330) / 190);
      streakMat.opacity = fast * 0.5;
      streaks.forEach((m) => { const u = m.userData; u.z += (v / 52) * dt * 1.4; if (u.z > 5) u.z -= 32; m.visible = fast > 0.02; m.position.set(u.x, u.y, u.z); });
      // the camera follows my rickshaw's lane a little, and jolts on a crash
      camX = ease(camX, me ? laneX((shownY[0] - 76) / 78) * 0.45 : 0, 1 - Math.exp(-dt * 4));
      shake = Math.max(0, shake - dt);
      camera.position.set(camX + (shake ? Math.sin(tNow * 2.9) * shake * 0.25 : 0), 2.5, 4.6);
      camera.lookAt(camX * 0.6, 0, -4);
      const fov = 58 + Math.min(8, fast * 8);
      if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = fov; camera.updateProjectionMatrix(); }
      void ahead;
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
// the classroom's light at each level: morning green board, afternoon, evening, and the big-board spotlight
const PIN_MOODS = [
  { bg: '#20352a', light: 1.4, spot: 0.18 },
  { bg: '#1f3340', light: 1.3, spot: 0.22 },
  { bg: '#2c2235', light: 1.15, spot: 0.28 },
  { bg: '#161616', light: 0.95, spot: 0.4 },
];
function pinView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PIN_MOODS[0].bg);
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, -0.2, 7.2);
  camera.lookAt(0, -0.2, 0);
  const hemi = new THREE.HemisphereLight('#fff6e6', '#1d2b22', 1.4);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(2, 3, 6);
  scene.add(key);
  // the classroom wall: a framed chalkboard with chalk sums, a ledge with chalk, a window's light
  const wall = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5a3d24'; g.fillRect(40, 30, w - 80, h - 80);
    g.fillStyle = '#ffffff'; g.fillRect(56, 46, w - 112, h - 112);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(255,255,255,.08)'; g.font = '26px "Comic Sans MS", system-ui, sans-serif';
    ['2 + 3 = 5', 'A B C', '7 × 8 = 56', '★', '3.14', 'x + y', '🙂', 'ChitPlay'].forEach((t, k) => g.fillText(t, 100 + (k % 4) * 220, 110 + Math.floor(k / 4) * 230));
    g.fillStyle = '#6b4a2b'; g.fillRect(40, h - 50, w - 80, 16);
    ['#ffffff', '#ffd23f', '#ff9aa8', '#9fd3ff'].forEach((c, k) => { g.fillStyle = c; g.fillRect(120 + k * 46, h - 58, 30, 8); });
  });
  const boardMat = new THREE.MeshBasicMaterial({ map: wall, color: PIN_MOODS[0].bg });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), boardMat);
  back.position.z = -2;
  scene.add(back);
  // window light falling across the wall, and a spotlight behind the boards
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 9), basic('#fff6d0', { transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }));
  shaft.position.set(-4.5, 0, -1.9); shaft.rotation.z = 0.35;
  const spotMat = basic('#fff3c4', { transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false });
  const spot = new THREE.Mesh(new THREE.CircleGeometry(2.1, 48), spotMat);
  spot.position.set(0, 0.35, -1.95);
  scene.add(shaft, spot);
  const cork = (big) => canvasTex(256, 256, (g, w) => {
    const r = w / 2;
    g.fillStyle = big ? '#c0412b' : '#c89b62'; g.beginPath(); g.arc(r, r, r, 0, TAU); g.fill();
    for (let k = 0; k < 900; k++) { const a = k * 2.399, d = Math.sqrt(k / 900) * (r - 6); g.fillStyle = k % 3 ? 'rgba(110,70,30,.35)' : 'rgba(255,235,200,.25)'; g.fillRect(r + Math.cos(a) * d, r + Math.sin(a) * d, 2.4, 2.4); }
    g.strokeStyle = big ? '#ffd23f' : '#ff9a3d'; g.lineWidth = 10; g.beginPath(); g.arc(r, r, r * 0.62, 0, TAU); g.stroke();
    g.fillStyle = '#fff8e6'; g.save(); g.translate(r, r); g.rotate(-0.12); g.fillRect(-34, -26, 68, 52); g.fillStyle = '#c0412b'; g.font = '800 22px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CP', 0, 2); g.restore();
  });
  const faces = { plain: cork(false), big: cork(true) };
  const rim = std('#7a5530', { roughness: 0.85 });
  const steel = std('#d7dde4', { metalness: 0.85, roughness: 0.25 });
  const heads = SEAT_COLORS.map(c => std(c, { roughness: 0.3 }));
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
  const TICKS = 48;
  const make = (i) => {
    const grp = new THREE.Group();
    const faceMat = std('#ffffff', { map: faces.plain, roughness: 0.95, emissive: '#000000' });
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
    // the time left for this level: a ring of dots round the board, green to red
    const clock = Array.from({ length: TICKS }, (_, k) => { const a = Math.PI / 2 - (k / TICKS) * TAU; const d = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), basic('#7dff9a')); d.position.set(Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0); grp.add(d); return d; });
    // where the next pin will land: green if it is clear, red if a pin is in the way
    const landMat = basic('#5dff8a', { transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const land = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.09, 6, 20, PIN_GAP * 2), landMat);
    land.rotation.z = -Math.PI / 2 - PIN_GAP;
    land.position.z = 0.12;
    grp.add(land);
    scene.add(grp);
    return { grp, spin, faceMat, flying, waiting, ring, clock, land, landMat, pins: [], stars: [], level: 0, shake: 0, seat: i, count: 0, starsN: 0, alive: true, flash: 0, fall: null, rot: 0 };
  };
  const bits = pool(scene, () => new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), basic('#ffffff', { side: THREE.DoubleSide, transparent: true })));
  const parts = [];
  const burst = (x, y, n, colors, speed = 2) => { for (let q = 0; q < n; q++) { const a = Math.random() * TAU, v = speed * (0.4 + Math.random()); parts.push({ x, y, z: 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.4, c: colors[q % colors.length], r: Math.random() * 6 }); } };
  let shake = 0;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const xs = slots(s.n);
      const scale = s.n > 2 ? 0.62 : s.n === 2 ? 0.85 : 1;
      const tNow = s.t + alpha;
      const lv = s.players[0]?.level || 1;
      const mood = PIN_MOODS[isPinBig(lv) ? 3 : Math.min(2, Math.floor((lv - 1) / 2) % 3)];
      const k = 1 - Math.exp(-dt * 1.5);
      scene.background.lerp(want.set(mood.bg), k);
      boardMat.color.lerp(want.set(mood.bg).offsetHSL(0, 0, 0.12), k);
      hemi.intensity = ease(hemi.intensity, mood.light, k);
      spotMat.opacity = ease(spotMat.opacity, mood.spot * 0.35, k);
      s.players.forEach((p, i) => {
        if (!targets[i]) targets[i] = make(i);
        const T = targets[i];
        T.grp.position.set(xs[i], 0.35, 0);
        T.grp.scale.setScalar(scale);
        const big = isPinBig(p.level);
        // a new level: a fresh board pops in with confetti; every fifth one is the big red board
        if (T.level !== p.level) {
          if (T.level) burst(xs[i], 0.35, 30, ['#ff5a4f', '#ffd23f', '#39b6ff', '#5be37d', '#ffffff'], 3);
          T.level = p.level; T.shake = 0.35; T.faceMat.map = big ? faces.big : faces.plain; T.faceMat.needsUpdate = true;
        }
        if (T.shake > 0) { T.shake -= dt; T.spin.scale.setScalar((big ? 1.08 : 1) + Math.sin(T.shake * 40) * 0.04); } else T.spin.scale.setScalar(big ? 1.08 : 1);
        // smooth: the board keeps turning between ticks
        const rot = p.alive ? p.rot + pinSpinAt(p.level, p.lt) * TICK * alpha : p.rot;
        T.spin.rotation.z = rot;
        // a pin went in: the board jolts and cork dust flies; a star: a gold burst
        if (p.stuck.length > T.count && T.count) { T.shake = Math.max(T.shake, 0.12); burst(xs[i], 0.35 - 1.24 * scale, 8, ['#d9b48a', '#a87a4a'], 1.4); }
        if (p.stars.length < T.starsN) burst(xs[i], 0.35 - 0.9 * scale, 20, ['#ffd23f', '#fff3a0'], 2.4);
        T.count = p.stuck.length; T.starsN = p.stars.length;
        // knocked another pin: it bounces off, the board flashes red, the camera jolts
        if (T.alive && !p.alive && p.hitAt != null) { T.fall = { y: -1.2, vy: 2.4, r: 0 }; T.flash = 0.6; if (i === 0) shake = 0.35; }
        T.alive = p.alive;
        T.flash = Math.max(0, T.flash - dt);
        T.faceMat.emissive.set(T.flash > 0 ? '#7a0000' : '#000000');
        while (T.pins.length < p.stuck.length) { const kk = pin(i); T.spin.add(kk); T.pins.push(kk); }
        T.pins.forEach((kk, n) => {
          const a = p.stuck[n];
          kk.visible = a != null;
          if (a == null) return;
          kk.position.set(Math.cos(a) * 1.24, Math.sin(a) * 1.24, 0.05);
          kk.rotation.z = a + Math.PI / 2;
        });
        while (T.stars.length < p.stars.length) { const st = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), starMat); T.spin.add(st); T.stars.push(st); }
        T.stars.forEach((st, n) => { const a = p.stars[n]; st.visible = a != null; if (a != null) { st.position.set(Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0.125); st.rotation.z = a + Math.sin(tNow * 0.1 + n) * 0.15; st.scale.setScalar(1 + Math.sin(tNow * 0.15 + n) * 0.08); } });
        // the pin in the air (smooth), the next one waiting, or the one bouncing off
        const flyLeft = Math.max(0, p.fly - (p.fly > 0 ? alpha : 0));
        T.flying.visible = (p.alive && p.fly > 0) || !!T.fall;
        if (T.fall) {
          T.fall.vy -= 9 * dt; T.fall.y += T.fall.vy * dt; T.fall.r += dt * 9;
          T.flying.position.set(0.4 * (1 - T.fall.vy / 2.4), T.fall.y, 0.3); T.flying.rotation.z = T.fall.r;
          if (T.fall.y < -4) T.fall = null;
        } else { T.flying.position.set(0, -1.3 - (flyLeft / PIN_FLY) * 1.6, 0.05); T.flying.rotation.z = 0; }
        T.waiting.visible = p.alive && p.fly === 0 && p.pins > 0;
        T.waiting.position.set(0, -2.9 + Math.sin(tNow * 0.12) * 0.03, 0.05);
        T.ring.visible = s.n > 1;
        T.grp.rotation.z = p.alive ? 0 : Math.sin(tNow * 0.5) * 0.04;
        // the landing spot: green when clear, red when the next pin would hit one
        const ahead = -Math.PI / 2 - (p.rot + pinSpinAt(p.level, p.lt) * TICK * PIN_FLY);
        const clear = p.stuck.every((x) => { let d = ((x - ahead) % TAU + TAU) % TAU; if (d > Math.PI) d -= TAU; return Math.abs(d) > PIN_GAP; });
        T.land.visible = p.alive && p.pins > 0;
        T.landMat.color.set(clear ? '#5dff8a' : '#ff3b3b');
        T.landMat.opacity = clear ? 0.7 : 0.75 + Math.sin(tNow * 0.8) * 0.2;
        // the level's clock
        const left = Math.max(0, 1 - p.lt / PIN_LEVEL_TICKS), lit = Math.ceil(left * TICKS);
        T.clock.forEach((d, n) => { d.visible = p.alive && n < lit; d.material.color.set(left > 0.3 ? '#7dff9a' : left > 0.15 ? '#ffd23f' : '#ff5a4f'); });
      });
      // flying bits
      bits.begin();
      for (let q = parts.length - 1; q >= 0; q--) {
        const b = parts[q];
        b.life -= dt;
        if (b.life <= 0) { parts.splice(q, 1); continue; }
        b.vy -= 4 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r += dt * 8;
        const m = bits.next(); m.position.set(b.x, b.y, b.z); m.rotation.set(b.r, b.r * 0.6, 0); m.material.color.set(b.c); m.material.opacity = Math.min(1, b.life * 2);
      }
      bits.end();
      shake = Math.max(0, shake - dt);
      camera.position.set(shake ? Math.sin(tNow * 2.7) * shake * 0.3 : 0, -0.2, 7.2);
      camera.lookAt(0, -0.2, 0);
    },
  };
}

/* ─── Hoop Flick: an indoor court under the lights, with a crowd ─── */
// the light in the hall at each level: day practice, evening match, windy night, the final under spotlights
const HOOP_MOODS = [
  { bg: '#1d2c44', wall: '#8fa6cc', hemi: 1.35, spot: 0.3 },
  { bg: '#2a1d3a', wall: '#9a86c0', hemi: 1.2, spot: 0.45 },
  { bg: '#0f2430', wall: '#6fa3b5', hemi: 1.05, spot: 0.6 },
  { bg: '#140c0a', wall: '#8a6556', hemi: 0.85, spot: 0.8 },
];
function hoopView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HOOP_MOODS[0].bg);
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, 0, 5.3);
  camera.lookAt(0, 0, 0);
  const hemi = new THREE.HemisphereLight('#fff6e8', '#33415c', 1.35);
  const sun = new THREE.DirectionalLight('#ffffff', 1.5);
  sun.position.set(2, 6, 4);
  scene.add(hemi, sun);
  const X = (x) => (x - HOOP_W / 2) / 100, Y = (y) => (HOOP_H / 2 - y) / 100;
  // the back wall: painted stripes, a scoreboard and the club's banners
  const wallMat = std('#ffffff', { map: canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#c8cfdb'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#dde3ec'; for (let k = 0; k < 8; k++) g.fillRect(0, k * 32, w, 14);
    g.fillStyle = 'rgba(255,210,63,.75)'; g.fillRect(0, h * 0.74, w, 5);
    // scoreboard
    g.fillStyle = '#111418'; g.fillRect(w / 2 - 40, 96, 80, 22);
    g.fillStyle = '#ffd23f'; g.font = '800 13px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('CHITPLAY', w / 2, 112);
    // banners
    [['#d32f2f', 60], ['#1e6fd0', w - 92]].forEach(([c, x]) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 34, 20); g.lineTo(x + 34, 86); g.lineTo(x + 17, 74); g.lineTo(x, 86); g.closePath(); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(x + 17, 46, 9, 0, TAU); g.fill(); });
  }), roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), wallMat);
  wall.position.z = -1.6;
  // the floor: polished boards with the court lines
  const floorTex = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = '#c48a50'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 32; k++) { g.fillStyle = k % 2 ? 'rgba(90,50,20,.12)' : 'rgba(255,230,190,.08)'; g.fillRect(k * 16, 0, 16, h); }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    g.beginPath(); g.arc(w / 2, h, 34, Math.PI, TAU); g.stroke();
    g.strokeRect(6, 20, 90, h - 20); g.strokeRect(w - 96, 20, 90, h - 20);
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), std('#ffffff', { map: floorTex, roughness: 0.35, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, Y(HOOP_H) - 0.05, 0.6);
  scene.add(wall, floor);
  // bleachers with a crowd along the bottom of the wall
  const crowdCols = ['#d64545', '#2e86c1', '#f2b705', '#27ae60', '#8e44ad', '#e67e22', '#ecf0f1'];
  const crowd = [];
  for (let k = 0; k < 40; k++) {
    const row = k % 2, x = -6.6 + (k / 40) * 13.2 + row * 0.16;
    const p = new THREE.Group();
    const body = box(0.16, 0.22, 0.08, std(crowdCols[k % crowdCols.length], { roughness: 0.9 }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), std(['#f1c27d', '#c68642', '#8d5524', '#e0ac69'][k % 4]));
    head.position.y = 0.18;
    p.add(body, head);
    p.position.set(x, Y(HOOP_H) + 0.12 + row * 0.24, -1.45 + row * -0.05);
    p.userData = { base: p.position.y, ph: k * 0.9 };
    scene.add(p);
    crowd.push(p);
  }
  // spotlights from the ceiling
  const spotMat = basic('#fff2c0', { transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const spots = [-2.6, 0, 2.6].map((x) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.4, 24, 1, true), spotMat); c.position.set(x, 1.6, -1.2); scene.add(c); return c; });
  const orange = std('#ff7a1a', { roughness: 0.35, metalness: 0.3 });
  const gold = basic('#ffd23f');
  const netMat = basic('#ffffff', { wireframe: true, transparent: true, opacity: 0.75 });
  const boardMat = std('#f4f7fb', { roughness: 0.3, transparent: true, opacity: 0.9 });
  const hoop = () => {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 28), orange);
    rim.rotation.x = Math.PI / 2 - 0.35;
    const net = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.19, 0.32, 12, 2, true), netMat);
    net.position.y = -0.17;
    const board = box(0.05, 0.5, 0.5, boardMat);
    board.position.set(0.36, 0.18, 0);
    const square = box(0.055, 0.16, 0.2, basic('#ff5a4f'));
    square.position.set(0.36, 0.12, 0);
    const pole = box(0.05, 0.3, 0.05, std('#99a3b3'));
    pole.position.set(0.42, -0.1, 0);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 6, 28), basic('#ffd23f', { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.rotation.x = Math.PI / 2 - 0.35;
    g.add(rim, net, board, square, pole, glow);
    g.userData = { rim, net, board, square, pole, glow, flash: 0, wobble: 0 };
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
  const dots = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), basic('#ffffff', { transparent: true, opacity: 0.85 })));
  const trail = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), basic('#ffb15c', { transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })));
  const bits = pool(scene, () => new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), basic('#ffffff', { side: THREE.DoubleSide })));
  const confetti = [];
  const confCols = ['#ff5a4f', '#ffd23f', '#39b6ff', '#5be37d', '#ffffff', '#c38bff'];
  // wind: streaks drifting across the court, and a flag that shows which way
  const windMat = basic('#dff4ff', { transparent: true, opacity: 0, depthWrite: false });
  const windLines = Array.from({ length: 14 }, (_, i) => { const m = box(0.5, 0.012, 0.012, windMat); m.userData = { x: -6 + (i * 0.93) % 12, y: -1.2 + ((i * 37) % 100) / 100 * 2.6 }; scene.add(m); return m; });
  const flagPole = box(0.03, 0.7, 0.03, std('#cfd6e0'));
  flagPole.position.set(0, 1.55, -1.3);
  const flag = box(0.32, 0.18, 0.01, basic('#ff5a4f'));
  scene.add(flagPole, flag);
  const lanes = [];
  const seatsView = [];
  const make = (i) => {
    const home = hoop(), next = hoop();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), ballMat);
    const tag = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 6, 24), basic(SEAT_COLORS[i]));
    scene.add(home, next, ball, tag);
    return { home, next, ball, tag, score: 0, spin: 0, bx: null, by: null, hist: [], touched: false };
  };
  const place = (g, h, x) => {
    g.position.set(X(x), Y(h.y), 0);
    const out = h.side < 0 ? -1 : 1;
    g.userData.board.position.x = 0.36 * out; g.userData.pole.position.x = 0.42 * out; g.userData.square.position.x = 0.36 * out;
  };
  let jump = 0, camX = 0;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const tNow = s.t + alpha;
      // the hall's light follows the level of the player on this screen
      const lv = s.players[0]?.level || 1;
      const mood = HOOP_MOODS[Math.min(HOOP_MOODS.length, lv) - 1];
      const k = 1 - Math.exp(-dt * 1.5);
      scene.background.lerp(want.set(mood.bg), k);
      hemi.intensity = ease(hemi.intensity, mood.hemi, k);
      spotMat.opacity = ease(spotMat.opacity, 0.02 + mood.spot * 0.05, k);
      wallMat.color.lerp(want.set(mood.wall), k);
      spots.forEach((c, i) => { c.rotation.z = Math.sin(tNow * 0.01 + i) * 0.08; });
      dots.begin(); trail.begin();
      while (lanes.length < s.n - 1) { const l = box(0.02, 6, 0.02, basic('#ffffff', { transparent: true, opacity: 0.25 })); scene.add(l); lanes.push(l); }
      lanes.forEach((l, q) => { l.position.set(X((HOOP_W / s.n) * (q + 1)), 0, -0.5); });
      let wind = 0;
      s.players.forEach((p, i) => {
        if (!seatsView[i]) seatsView[i] = make(i);
        const V = seatsView[i];
        place(V.home, p.home, p.home.x);
        const hx = p.next.x + (p.next.move ? Math.sin(tNow / 60 + p.next.ph) * p.next.move : 0);
        place(V.next, p.next, hx);
        if (i === 0) wind = p.next.wind || 0;
        // the hoop to aim for glows softly
        const ng = V.next.userData.glow;
        ng.material.opacity = p.alive && !p.flying ? 0.25 + Math.sin(tNow * 0.15) * 0.12 : 0.08;
        // a basket: the hoop it went through flashes gold, the net swings, confetti, the crowd jumps
        if (p.score !== V.score) {
          const up = p.score > V.score;
          V.home.userData.flash = up ? 0.5 : 0;
          if (up) {
            const swish = p.combo > 0;
            for (let q = 0; q < (swish ? 30 : 14); q++) confetti.push({ x: X(p.home.x), y: Y(p.home.y), z: 0.1, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2.4, vz: (Math.random() - 0.5) * 1, r: Math.random() * 6, life: 1.4, c: confCols[q % confCols.length] });
            jump = swish ? 1 : 0.5;
          }
          V.score = p.score;
        }
        const f = V.home.userData;
        if (f.flash > 0) { f.flash -= dt; f.rim.material = gold; f.rim.scale.setScalar(1 + f.flash * 0.6); } else { f.rim.material = orange; f.rim.scale.setScalar(1); }
        f.net.scale.y = 1 + Math.max(0, f.flash) * 0.8;
        f.net.rotation.y = Math.sin(tNow * 0.4) * Math.max(0, f.flash) * 0.6;
        // the rim was touched: a little shake of the hoop
        if (p.flying && p.touched && !V.touched) V.next.userData.wobble = 0.35;
        V.touched = p.flying && p.touched;
        const nu = V.next.userData;
        if (nu.wobble > 0) { nu.wobble -= dt; V.next.rotation.z = Math.sin(tNow * 1.6) * nu.wobble * 0.15; } else V.next.rotation.z = 0;
        // the ball, smooth between ticks: where it was going, carried on by the part of a tick since
        const tx = p.flying ? p.ball.x + p.ball.vx * TICK * alpha : p.ball.x;
        const ty = p.flying ? p.ball.y + (p.ball.vy * TICK + 0.5 * HOOP_G * TICK * TICK) * alpha : p.ball.y;
        if (V.bx == null || Math.hypot(tx - V.bx, ty - V.by) > 80) { V.bx = tx; V.by = ty; }
        const kk = 1 - Math.exp(-dt * 30);
        V.bx += (tx - V.bx) * kk; V.by += (ty - V.by) * kk;
        V.ball.position.set(X(V.bx), Y(V.by), 0.05);
        V.ball.material = p.alive ? ballMat : deadMat;
        if (p.flying) V.spin += (p.ball.vx / 100) * dt * 2;
        V.ball.rotation.z = -V.spin;
        V.tag.visible = s.n > 1 && p.alive && !p.flying;
        V.tag.position.copy(V.ball.position);
        // a glowing trail while it flies
        if (p.flying) { V.hist.unshift([V.ball.position.x, V.ball.position.y]); if (V.hist.length > 10) V.hist.length = 10; } else V.hist.length = 0;
        V.hist.forEach(([x, y], q) => { const m = trail.next(); m.position.set(x, y, 0.02); m.scale.setScalar(Math.max(0.2, 1 - q * 0.09)); });
        // the aiming arc, while the ball waits: it allows for the wind, so what you see is where it goes
        if (p.alive && !p.flying) {
          const w = p.next.wind || 0;
          for (let q = 1; q < 13; q++) {
            const t = q * 0.055, d = dots.next();
            d.position.set(X(p.ball.x + p.aimX * HOOP_MAX * t + 0.5 * w * t * t), Y(p.ball.y - p.aimY * HOOP_MAX * t + 0.5 * HOOP_G * t * t), 0.05);
            d.scale.setScalar(1 - q * 0.055);
          }
        }
      });
      dots.end(); trail.end();
      // confetti
      bits.begin();
      for (let q = confetti.length - 1; q >= 0; q--) {
        const c = confetti[q];
        c.life -= dt;
        if (c.life <= 0) { confetti.splice(q, 1); continue; }
        c.vy -= 3.2 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.r += dt * 6;
        const m = bits.next(); m.position.set(c.x, c.y, c.z); m.rotation.set(c.r, c.r * 0.7, 0); m.material.color.set(c.c);
      }
      bits.end();
      // the crowd sways, and jumps for a basket
      jump = Math.max(0, jump - dt * 1.3);
      crowd.forEach((p) => { p.position.y = p.userData.base + Math.abs(Math.sin(tNow * 0.07 + p.userData.ph)) * 0.02 + jump * Math.abs(Math.sin(tNow * 0.45 + p.userData.ph)) * 0.14; });
      // wind: streaks and the flag
      const wv = wind / 240;
      windMat.opacity = Math.min(0.5, Math.abs(wv) * 0.7);
      windLines.forEach((m) => { const u = m.userData; u.x += wv * dt * 6; if (u.x > 7) u.x -= 14; if (u.x < -7) u.x += 14; m.visible = Math.abs(wv) > 0.05; m.position.set(u.x, u.y + Math.sin(tNow * 0.05 + u.x) * 0.05, 0.3); });
      flag.position.set(Math.sign(wv || 1) * 0.17, 1.82, -1.3);
      flag.scale.x = 0.3 + Math.min(1, Math.abs(wv) * 1.4);
      flag.rotation.y = Math.sin(tNow * 0.3) * (0.1 + Math.abs(wv) * 0.4);
      flag.visible = Math.abs(wv) > 0.05;
      flagPole.visible = flag.visible;
      // the camera drifts a little towards a ball in the air
      const me = seatsView[0], p0 = s.players[0];
      camX = ease(camX, me && p0?.flying ? X(me.bx) * 0.12 : 0, 1 - Math.exp(-dt * 2));
      camera.position.set(camX, 0, 5.3);
      camera.lookAt(camX * 0.6, 0, 0);
    },
  };
}

/* ─── Ghost Hostel: a row of rooms seen from above the corridor, and the ghost floating in it ─── */
function ghostView() {
  const scene = new THREE.Scene();
  const night = new THREE.Color('#0d0b22'), angry = new THREE.Color('#2a0b1a'), dawn = new THREE.Color('#5a3a4a');
  scene.background = night.clone();
  scene.fog = new THREE.Fog('#0d0b22', 5, 11);
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, 3.2, 3.5);
  camera.lookAt(0, 0.15, -0.75);
  const hemi = new THREE.HemisphereLight('#b8c4ff', '#2a2248', 1.5);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight('#cfd8ff', 1.2);
  moon.position.set(-3, 6, 4);
  scene.add(moon);
  const X = (x) => (x - HOOP_W / 2) / 100;
  const Z = (y) => -0.35 + (y - (GHOST_CORRIDOR - 40)) / 100;
  // the night sky behind the hostel: moon and stars, turning to dawn as sunrise comes
  const skyTex = canvasTex(512, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#8a8aa8');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 90; k++) { g.fillStyle = `rgba(255,255,255,${0.4 + (k % 3) * 0.2})`; g.fillRect((k * 97) % w, (k * 53) % (h * 0.7), k % 5 ? 1.5 : 3, k % 5 ? 1.5 : 3); }
  });
  const skyMat = basic('#1a1a44', { map: skyTex, fog: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(22, 8), skyMat);
  sky.position.set(0, 1.5, -4.5);
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), basic('#f4f1d8', { fog: false }));
  moonDisc.position.set(2.5, 0.85, -4.4);
  const moonGlow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), basic('#cfd8ff', { transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  moonGlow.position.set(2.5, 0.85, -4.42);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(0.7, 32), basic('#ffb15c', { fog: false }));
  sunDisc.position.set(-3, -1, -4.4);
  scene.add(sky, moonGlow, moonDisc, sunDisc);
  // the corridor: a long tiled floor, with lamps that flicker when the ghost is near
  const tiles = canvasTex(64, 64, (g, w) => { g.fillStyle = '#2b2740'; g.fillRect(0, 0, w, w); g.fillStyle = '#353150'; g.fillRect(0, 0, w / 2, w / 2); g.fillRect(w / 2, w / 2, w / 2, w / 2); }, [14, 3]);
  const corridor = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), std('#ffffff', { map: tiles, roughness: 0.6, metalness: 0.1 }));
  corridor.rotation.x = -Math.PI / 2;
  corridor.position.set(0, 0, 0.9);
  scene.add(corridor);
  const lampGlowMat = basic('#ffcf7a', { transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const lamps = [-4.5, -1.5, 1.5, 4.5].map((x) => {
    const g = new THREE.Group();
    const post = box(0.04, 0.7, 0.04, std('#3a3550'));
    post.position.y = 0.35;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), basic('#ffe2a0'));
    bulb.position.y = 0.74;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), lampGlowMat);
    glow.position.y = 0.74;
    g.add(post, bulb, glow);
    g.position.set(x, 0, 2.05);
    g.userData = { bulb, glow };
    scene.add(g);
    return g;
  });
  // dust drifting in the moonlight
  const dustMat = basic('#cfd8ff', { transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
  const dust = Array.from({ length: 34 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 3), dustMat); m.userData = { x: ((i * 37) % 100) / 100 * 10 - 5, y: 0.2 + ((i * 53) % 100) / 100 * 1.6, z: -1 + ((i * 71) % 100) / 100 * 3, ph: i }; scene.add(m); return m; });
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
  const flameGlow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), basic('#ffb347', { transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  flameGlow.position.y = 0.5;
  const healRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 32), basic('#b48cff', { transparent: true, opacity: 0.7 }));
  healRing.rotation.x = Math.PI / 2;
  healRing.position.y = 0.04;
  altar.add(top, leg, candle, flame, flameGlow, healRing);
  altar.position.set(X(GHOST_ALTAR.x), 0, Z(GHOST_ALTAR.y) + 0.2);
  scene.add(altar);
  // the ghost, with a glow round it and wisps trailing behind
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
  const haloMat = basic('#9fb0ff', { transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), haloMat);
  halo.position.y = 0.22;
  ghost.add(halo, head, tail, e1, e2, mouth, a1, a2);
  scene.add(ghost);
  const wisp = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), basic('#c9d2ff', { transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })));
  const wisps = [];
  // where the ghost is going: a red ring on the floor in front of that door, and a line to it
  const targetMat = basic('#ff3b5c', { transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
  const targetRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 36), targetMat);
  targetRing.rotation.x = Math.PI / 2;
  scene.add(targetRing);
  const beamDots = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), targetMat));
  // little things that fly: coins from the beds, wind from the fans, sparks
  const coin = pool(scene, () => new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 14), std('#ffd23f', { metalness: 0.7, roughness: 0.25, emissive: '#5a4200' })));
  const windBit = pool(scene, () => box(0.14, 0.008, 0.008, basic('#bff0ff', { transparent: true, opacity: 0.6 })));
  const spark = pool(scene, () => new THREE.Mesh(new THREE.OctahedronGeometry(0.04), basic('#e7ecff', { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const flying = [];
  // the rooms
  const wallMat = std('#5a4f8f', { roughness: 0.9 }), floorMat = std('#8a6044', { roughness: 0.8 }), caughtMat = std('#3a1630', { roughness: 0.9 });
  const doorMat = () => std('#8a5a33', { roughness: 0.7, emissive: '#000000' });
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
    // metal bands on a strong door
    const bands = [0.18, -0.18].map((y) => { const b = box(0.41, 0.04, 0.06, std('#7d8796', { metalness: 0.7, roughness: 0.3 })); b.position.y = y; door.add(b); return b; });
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
    const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), basic('#ffe9a8', { transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
    lampGlow.position.copy(lamp.position);
    g.add(floor, back, left, right, frontL, frontR, door, bed, lamp, lampGlow);
    scene.add(g);
    return { g, door, bands, bed, trim, fans, sleeper, floor, back, left, right, lamp, lampGlow, frontL, frontR, coins: null, coinAt: 0 };
  };
  let gx = null, gz = null, shake = 0, wasMode = '', lastBang = [];
  const tmp = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const tNow = s.t + alpha;
      const span = Math.min(HOOP_W / s.rooms / 100, 2.4) * 0.92;
      const gh = s.ghost;
      s.players.forEach((p, i) => {
        if (!rooms[i]) rooms[i] = makeRoom(i);
        const R = rooms[i];
        R.g.position.x = X(GHOST_ROOMX(s, i));
        R.g.scale.set(span, 1, 1);
        const share = p.hp / GHOST_DOOR.hp[p.door];
        const attacked = gh.mode === 'attack' && gh.target === i;
        // a stronger door is darker wood with metal bands; a battered one goes red, and glows red while under attack
        R.door.visible = p.alive;
        R.door.material.color.set(p.door >= 3 ? '#5a3a24' : '#8a5a33').lerp(tmp.set('#b23a3a'), Math.max(0, 0.6 - share));
        R.door.material.emissive.set(attacked ? (Math.floor(tNow / 8) % 2 ? '#5a0010' : '#2a0008') : '#000000');
        R.bands.forEach((b, k) => { b.visible = p.door >= (k ? 2 : 1); });
        R.door.scale.y = 1 + p.door * 0.04;
        R.door.position.x = p.bang > 0 ? Math.sin(tNow * 2.5) * 0.025 : 0;
        R.door.rotation.y = p.alive ? 0 : 0.9;
        if ((p.bang || 0) > (lastBang[i] || 0) && i === 0) shake = Math.max(shake, 0.12);
        lastBang[i] = p.bang || 0;
        [R.floor, R.back, R.left, R.right, R.frontL, R.frontR].forEach(m => { m.material = m === R.floor ? floorMat : p.alive ? wallMat : caughtMat; });
        R.bed.scale.setScalar(1 + p.bed * 0.06);
        R.trim.visible = p.bed >= 3;
        R.sleeper.position.y = 0.3 + Math.sin(tNow / 40 + i) * 0.01;
        R.sleeper.visible = p.alive;
        const flicker = p.alive && (attacked || s.t > GHOST_RAGE) ? 0.6 + Math.abs(Math.sin(tNow * 0.7 + i)) * 0.4 : 1;
        R.lamp.material.color.set(p.alive ? '#ffe9a8' : '#553344');
        R.lampGlow.material.opacity = p.alive ? 0.18 * flicker : 0.05;
        const shown = Math.min(3, Math.ceil(p.fan / 2));
        R.fans.forEach((f, k) => {
          f.visible = k < shown;
          if (!f.visible) return;
          f.userData.blades.rotation.z += dt * (attacked ? 22 : 5) * (1 + p.fan * 0.1);
          // blowing at the ghost: streaks of wind out of the door
          if (attacked && Math.random() < dt * 14) flying.push({ kind: 'wind', x: R.g.position.x + (Math.random() - 0.5) * 0.3, y: 0.3 + Math.random() * 0.3, z: -0.7, vx: (X(gh.x) - R.g.position.x) * 0.6, vy: 0, vz: 1.4, life: 0.5 });
        });
        // coins: when the bed pays out, a coin floats up from it
        if (R.coins != null && p.coins > R.coins && p.alive && s.t - R.coinAt > 40) { R.coinAt = s.t; flying.push({ kind: 'coin', x: R.g.position.x + 0.18 * span, y: 0.35, z: -1.4, vx: 0, vy: 0.7, vz: 0, life: 0.9 }); }
        R.coins = p.coins;
      });
      // the ghost: smooth between ticks, bobbing, a glow that turns red when hit and violet as it heals
      ghost.visible = gh.mode !== 'gone';
      const tx = X(gh.x), tz = Z(gh.y);
      if (gx == null || Math.hypot(tx - gx, tz - gz) > 2) { gx = tx; gz = tz; }
      const kk = 1 - Math.exp(-dt * 12);
      gx += (tx - gx) * kk; gz += (tz - gz) * kk;
      const size = 0.75 + gh.lv * 0.08;
      ghost.scale.setScalar(gh.mode === 'sleep' ? size * 0.85 : size);
      ghost.position.set(gx, 0.55 + Math.sin(tNow / 18) * 0.06 + (gh.mode === 'sleep' ? -0.15 : 0), gz);
      ghost.rotation.y = gh.mode === 'attack' ? Math.PI : 0;
      ghost.rotation.z = gh.mode === 'attack' ? Math.sin(tNow / 3) * 0.12 : Math.sin(tNow / 25) * 0.05;
      tail.scale.set(1 + Math.sin(tNow / 9) * 0.06, 1 + Math.sin(tNow / 7) * 0.08, 1 + Math.cos(tNow / 9) * 0.06);
      const rage = s.t > GHOST_RAGE;
      ghostMat.emissive.set(gh.hitFlash > 0 ? '#ff4d6d' : gh.mode === 'heal' ? '#b48cff' : rage ? '#ff5d7a' : '#7f8cff');
      ghostMat.emissiveIntensity = gh.hitFlash > 0 ? 0.8 : 0.35;
      haloMat.color.set(gh.hitFlash > 0 ? '#ff6b80' : gh.mode === 'heal' ? '#c9a6ff' : rage ? '#ff7a8f' : '#9fb0ff');
      haloMat.opacity = 0.16 + Math.sin(tNow / 10) * 0.06 + (gh.hitFlash > 0 ? 0.15 : 0);
      eyeMat.color.set(rage ? '#ff2a2a' : '#14102a');
      a1.position.y = a2.position.y = 0.18 + (gh.mode === 'attack' ? Math.abs(Math.sin(tNow / 4)) * 0.15 : 0);
      healRing.visible = gh.mode === 'heal';
      healRing.rotation.z += dt * 2;
      flame.scale.setScalar(1 + Math.sin(tNow / 5) * 0.2);
      flameGlow.scale.setScalar(1 + Math.sin(tNow / 4) * 0.25);
      // wisps trailing behind it
      if (ghost.visible && Math.random() < dt * 20) wisps.push({ x: gx + (Math.random() - 0.5) * 0.2, y: ghost.position.y - 0.1, z: gz, life: 0.8 });
      wisp.begin();
      for (let q = wisps.length - 1; q >= 0; q--) { const w = wisps[q]; w.life -= dt; if (w.life <= 0) { wisps.splice(q, 1); continue; } w.y += dt * 0.15; const m = wisp.next(); m.position.set(w.x, w.y, w.z); m.scale.setScalar(size * (1.4 - w.life)); m.material.opacity = 0.22 * w.life; }
      wisp.end();
      // blown away for good: a burst of light
      if (gh.mode === 'gone' && wasMode !== 'gone') for (let q = 0; q < 40; q++) { const a = (q / 40) * TAU; flying.push({ kind: 'spark', x: gx, y: 0.6, z: gz, vx: Math.cos(a) * 2, vy: Math.sin(a) * 1.5 + 0.5, vz: (Math.random() - 0.5), life: 1 }); }
      wasMode = gh.mode;
      // where it is heading
      const tgt = gh.target >= 0 && (gh.mode === 'walk' || gh.mode === 'attack') ? s.players[gh.target] : null;
      targetRing.visible = !!tgt && tgt.alive;
      beamDots.begin();
      if (targetRing.visible) {
        const rx = X(GHOST_ROOMX(s, gh.target)), rz = -0.45;
        targetRing.position.set(rx, 0.02, rz);
        targetRing.scale.setScalar(1 + Math.sin(tNow * 0.25) * 0.12);
        targetMat.opacity = gh.mode === 'attack' ? 0.75 : 0.45;
        if (gh.mode === 'walk') for (let q = 1; q < 10; q++) { const f = (q / 10 + (tNow * 0.01) % 0.1); const d = beamDots.next(); d.position.set(gx + (rx - gx) * f, 0.05, gz + (rz - gz) * f); }
      }
      beamDots.end();
      // coins, wind and sparks
      coin.begin(); windBit.begin(); spark.begin();
      for (let q = flying.length - 1; q >= 0; q--) {
        const f = flying[q];
        f.life -= dt;
        if (f.life <= 0) { flying.splice(q, 1); continue; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
        if (f.kind === 'coin') { const m = coin.next(); m.position.set(f.x, f.y, f.z); m.rotation.set(Math.PI / 2, 0, tNow * 0.3); m.scale.setScalar(Math.min(1, f.life * 2)); }
        else if (f.kind === 'wind') { const m = windBit.next(); m.position.set(f.x, f.y, f.z); m.rotation.y = Math.atan2(-f.vz, f.vx); m.material.opacity = f.life; }
        else { f.vy -= 2 * dt; const m = spark.next(); m.position.set(f.x, f.y, f.z); m.scale.setScalar(f.life * 2); m.material.opacity = f.life; }
      }
      coin.end(); windBit.end(); spark.end();
      // dust and lamps
      dust.forEach((m) => { const u = m.userData; m.position.set(u.x + Math.sin(tNow / 90 + u.ph) * 0.3, u.y + Math.sin(tNow / 60 + u.ph * 2) * 0.1, u.z); });
      lamps.forEach((l, i) => {
        const near = Math.abs(l.position.x - gx) < 1.4 && ghost.visible;
        const f = near || rage ? (Math.sin(tNow * 1.3 + i * 7) > 0.3 ? 1 : 0.25) : 1;
        l.userData.glow.material.opacity = 0.32 * f;
        l.userData.bulb.material.color.set(f > 0.5 ? '#ffe2a0' : '#6a5a40');
      });
      // the sky: night, angrier when the ghost is in a rage, then dawn over the last minute
      const toDawn = Math.max(0, Math.min(1, (s.t - (GHOST_NIGHT - 60 * 40)) / (60 * 40)));
      scene.background.copy(night).lerp(angry, rage && toDawn < 0.5 ? 0.6 + Math.sin(tNow / 30) * 0.2 : 0).lerp(dawn, toDawn);
      scene.fog.color.copy(scene.background);
      skyMat.color.set('#1a1a44').lerp(tmp.set('#ff9a6a'), toDawn);
      // the moon sets on the right as the sun comes up on the left
      moonDisc.position.y = 0.85 - toDawn * 1.0;
      moonGlow.position.y = moonDisc.position.y;
      sunDisc.visible = toDawn > 0.02;
      sunDisc.position.set(-2.7, -0.1 + toDawn * 1.15, -4.4);
      hemi.intensity = 1.5 + toDawn * 0.6;
      // the camera: a small jolt when your door is hit
      shake = Math.max(0, shake - dt);
      camera.position.set(shake ? Math.sin(tNow * 3) * shake * 0.2 : 0, 3.2, 3.5);
      camera.lookAt(0, 0.15, -0.75);
    },
  };
}

const VIEWS = { 'ghost-hostel': ghostView, 'hoop-flick': hoopView, 'pin-spin': pinView, 'bull-fight': bullView, 'tunnel-race': tunnelView, 'flying-chit': flyingView, 'ship-fight': shipView, 'backyard-rally': rallyView, 'hungry-snake': snakeView, 'road-dash': roadView };
export const hasView = (slug) => !!VIEWS[slug];
export function createView(slug) { return VIEWS[slug] ? VIEWS[slug]() : null; }
