/** The 3D picture of tunnel-race on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, box, canvasTex, pool, std, turnTo, wingedChit, wrapAngle } from './common.js?v=20261116-1137';
import { selectedGameCosmetic } from '../../game-cosmetics.js?v=20261116-1137';
import { SEAT_COLORS, TICK } from '../lib.js?v=20261116-1137';
import { blocks as tunnelBlocks, speedAt as tunnelSpeed } from '../tunnel-race.js?v=20261116-1137';

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
/* ─── Tunnel Race: a glowing paper tunnel that turns round you ─── */
// each level has its own colours: the tunnel, the air, the walls and the safe way through
const TUNNEL_MOODS = [
  { bg: '#0b1426', tube: '#4a6fae', ring: '#9fd0ff', wall: '#e0455a', gap: '#f39c34' },   // paper blue
  { bg: '#160b26', tube: '#7553a8', ring: '#e2b8ff', wall: '#ff4f7a', gap: '#ffb03b' },   // purple night
  { bg: '#04201f', tube: '#2f8f87', ring: '#a6fff3', wall: '#ff5d5d', gap: '#ffd23f' },   // teal
  { bg: '#26100a', tube: '#b8662f', ring: '#ffd7a8', wall: '#ff3b3b', gap: '#ffe066' },   // spin cycle: hot
];
const TUNNEL_THEMES = {
  cosmic: [
    { bg: '#100a2e', tube: '#473276', ring: '#c9a7ff', wall: '#ff4f9a', gap: '#62f1ff' },
    { bg: '#17072d', tube: '#633175', ring: '#f2a4ff', wall: '#ff5b83', gap: '#70f5e5' },
    { bg: '#081d36', tube: '#235e8b', ring: '#8de8ff', wall: '#ff647d', gap: '#b6ff78' },
    { bg: '#240b32', tube: '#793c86', ring: '#ffb1e6', wall: '#ff5961', gap: '#f7ec78' },
  ],
  sunset: [
    { bg: '#32131e', tube: '#9b4c42', ring: '#ffd1a1', wall: '#f0445c', gap: '#ffe16a' },
    { bg: '#3a1820', tube: '#b65b4a', ring: '#ffbd91', wall: '#f04f64', gap: '#ffdf73' },
    { bg: '#27202b', tube: '#855f69', ring: '#ffd2bc', wall: '#fa5360', gap: '#ffc36a' },
    { bg: '#31171c', tube: '#a45b44', ring: '#ffe0a6', wall: '#ff4554', gap: '#fff078' },
  ],
};
function tunnelView() {
  const tunnelPalette = (style) => TUNNEL_THEMES[style] || TUNNEL_MOODS;
  let themeStyle = selectedGameCosmetic('tunnel-race', 'tunnel')?.style || 'paper';
  let craftStyle = selectedGameCosmetic('tunnel-race', 'craft')?.style || 'paper';
  let moods = tunnelPalette(themeStyle);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(moods[0].bg);
  scene.fog = new THREE.Fog(moods[0].bg, 14, 56);
  const camera = new THREE.PerspectiveCamera(72, 1.6, 0.1, 120);
  camera.position.set(0, 0, 4.2);
  const R = 3, PZ = -1.2, PR = R * 0.74;
  // the tunnel: light paper with folds and grid lines, tinted by the level's colour
  const tex = canvasTex(1024, 256, (g, w, h) => {
    // panels with a soft light-to-shade fall across each, so the wall reads as a curved surface
    const panel = w / 16;
    for (let k = 0; k < 16; k++) {
      const shade = g.createLinearGradient(k * panel, 0, (k + 1) * panel, 0);
      shade.addColorStop(0, '#e6ebf3'); shade.addColorStop(0.5, '#c9d1de'); shade.addColorStop(1, '#a9b3c4');
      g.fillStyle = shade; g.fillRect(k * panel, 0, panel, h);
    }
    // a band where the panels meet, ridged
    g.fillStyle = '#8e98aa'; g.fillRect(0, h / 2 - 6, w, 12);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, h / 2 - 6, w, 2);
    g.strokeStyle = 'rgba(30,40,60,.45)'; g.lineWidth = 2;
    for (let x = 0; x < w; x += panel) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    // four light strips running the length of the tunnel: they rush past and give the speed
    [0, 4, 8, 12].forEach((k) => {
      const x = k * panel + panel / 2;
      const glow = g.createLinearGradient(x - 14, 0, x + 14, 0);
      glow.addColorStop(0, 'rgba(255,255,255,0)'); glow.addColorStop(0.5, 'rgba(255,255,255,.95)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = glow; g.fillRect(x - 14, 0, 28, h);
      g.fillStyle = '#ffffff'; for (let y = 10; y < h; y += 42) g.fillRect(x - 3, y, 6, 18);
    });
    // rivets
    g.fillStyle = 'rgba(40,50,70,.4)';
    for (let x = panel / 4; x < w; x += panel / 2) { g.beginPath(); g.arc(x, 14, 2.5, 0, Math.PI * 2); g.arc(x, h - 14, 2.5, 0, Math.PI * 2); g.fill(); }
  }, [1, 14]);
  const tubeMat = basic(moods[0].tube, { map: tex, side: THREE.BackSide });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 120, 48, 1, true), tubeMat);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = -55;
  scene.add(tube);
  // rings of light along the tunnel, rushing past
  const ringMat = basic(moods[0].ring, { transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
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
  // power-ups: a blue shield orb and a red-gold magnet, each with its own glow
  const shieldOrb = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), std('#5aa9ff', { emissive: '#1d4f9a', metalness: 0.3, roughness: 0.15 })));
  const magnetOrb = pool(scene, () => { const g = new THREE.Group(); const u = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.07, 8, 16, Math.PI), std('#ff4d3d', { emissive: '#7a1208' })); const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.12), std('#e8e8e8', { metalness: 0.6 })); const t2 = t1.clone(); t1.position.set(-0.18, -0.04, 0); t2.position.set(0.18, -0.04, 0); g.add(u, t1, t2); return g; });
  const bubbles = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), basic('#5aa9ff', { transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));
  const gemGlow = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), basic('#7dffe3', { transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })));
  const spark = pool(scene, () => new THREE.Mesh(new THREE.OctahedronGeometry(0.05), basic('#bfffee', { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const sparks = [];
  const trailMats = SEAT_COLORS.map(c => basic(c, { transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  const trails = SEAT_COLORS.map((_, i) => pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), trailMats[i])));
  scene.add(new THREE.HemisphereLight('#ffffff', '#442266', 1.4));
  const planes = [], shown = [];
  const clearPlanes = () => {
    planes.forEach((plane) => {
      if (!plane) return;
      scene.remove(plane);
      plane.traverse((part) => {
        part.geometry?.dispose();
        (Array.isArray(part.material) ? part.material : [part.material]).forEach(material => material?.dispose());
      });
    });
    planes.length = 0;
    shown.length = 0;
  };
  const refreshCosmetics = (s) => {
    if (s.t !== 0) return;
    const nextTheme = selectedGameCosmetic('tunnel-race', 'tunnel')?.style || 'paper';
    const nextCraft = selectedGameCosmetic('tunnel-race', 'craft')?.style || 'paper';
    if (nextTheme !== themeStyle) { themeStyle = nextTheme; moods = tunnelPalette(themeStyle); }
    if (nextCraft !== craftStyle) { craftStyle = nextCraft; clearPlanes(); }
  };
  let dShown = null, aCam = null, shake = 0;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0, focus = 0) {
      refreshCosmetics(s);
      if (!s.planes[focus]) focus = 0;
      // smooth: the tunnel moves on every frame, carried on between the game's ticks
      const sp = tunnelSpeed(s.d);
      if (dShown == null || Math.abs(s.d - dShown) > 4) dShown = s.d;
      dShown += sp * dt;
      dShown += (s.d + sp * TICK * alpha - dShown) * (1 - Math.exp(-dt * 10));
      const d = dShown, tNow = s.t + alpha;
      // the level's colours, blended in
      const mood = moods[Math.min(moods.length, s.level || 1) - 1];
      const k = 1 - Math.exp(-dt * 1.5);
      scene.background.lerp(want.set(mood.bg), k);
      scene.fog.color.copy(scene.background);
      tubeMat.color.lerp(want.set(mood.tube), k);
      ringMat.color.lerp(want.set(mood.ring), k);
      tex.offset.y = (d * 0.04) % 1;
      rings.forEach((m, i) => { const z = i * 5 - (d % 5); m.position.z = -z + PZ + 2; });
      // the plane on this screen, and where it is about to be
      const me = s.planes[focus];
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
        u.safe.color.set(mood.gap);
        u.safe.opacity = o === next ? 0.65 + Math.sin(tNow * 0.3) * 0.3 : 0.35;
      });
      walls.forEach((m, key) => { if (!seen.has(key)) { scene.remove(m); m.traverse((x) => { x.geometry?.dispose(); }); walls.delete(key); } });
      gems.begin(); gemGlow.begin(); shieldOrb.begin(); magnetOrb.begin();
      s.gems.forEach((g) => {
        if (g.got) return;
        const p = [Math.cos(g.a) * PR, Math.sin(g.a) * PR, -(g.z - d) + PZ];
        if (g.p === 'shield') { const m = shieldOrb.next(); m.position.set(...p); m.scale.setScalar(1 + Math.sin(tNow * 0.25) * 0.12); return; }
        if (g.p === 'magnet') { const m = magnetOrb.next(); m.position.set(...p); m.rotation.z = Math.sin(tNow * 0.2) * 0.4; m.rotation.y = tNow * 0.06; return; }
        const m = gems.next(); m.position.set(...p); m.rotation.y = tNow * 0.08; m.rotation.x = tNow * 0.05;
        const gl = gemGlow.next(); gl.position.set(...p); gl.scale.setScalar(1 + Math.sin(tNow * 0.2 + g.z) * 0.15);
      });
      gems.end(); gemGlow.end(); shieldOrb.end(); magnetOrb.end();
      bubbles.begin();
      s.planes.forEach((p) => { if (p.alive && (p.shield || p.safeT > 0)) { const b = bubbles.next(); b.position.set(Math.cos(p.a) * PR, Math.sin(p.a) * PR, PZ); b.material.opacity = p.safeT > 0 && Math.floor(tNow / 4) % 2 ? 0.08 : 0.24; } });
      bubbles.end();
      // the planes: smoothed, banking into the turn, a trail of light behind
      s.planes.forEach((p, i) => {
        if (!planes[i]) { planes[i] = craftStyle === 'winged-chit' ? wingedChit(SEAT_COLORS[i]) : paperPlane(SEAT_COLORS[i]); scene.add(planes[i]); shown[i] = { a: p.a, gems: p.gems, trail: [] }; }
        const v = shown[i], m = planes[i];
        const ta = p.a + (p.alive ? p.w * TICK * alpha : 0);
        // the plane on this phone is drawn exactly where the game checks it (already smoothed between
        // ticks), so what you see is what hits; other planes, which arrive over the network, are eased
        if (i === focus && p.alive) v.a = wrapAngle(ta);
        else v.a = wrapAngle(v.a + turnTo(ta, v.a) * (1 - Math.exp(-dt * 26)));
        m.position.set(Math.cos(v.a) * PR, Math.sin(v.a) * PR, PZ);
        m.scale.setScalar(1.5);
        m.rotation.set(0, 0, v.a + Math.PI / 2 - p.w * 0.3);
        m.visible = p.alive || Math.floor(tNow / 6) % 2 === 0;
        if (p.gems > v.gems) {
          for (let q = 0; q < 16; q++) { const a = (q / 16) * TAU; sparks.push({ x: m.position.x, y: m.position.y, z: PZ - 0.3, vx: Math.cos(a) * 1.8, vy: Math.sin(a) * 1.8, vz: 3, life: 0.6 }); }
        }
        if (!p.alive && v.alive !== false && i === focus) shake = 0.4;
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
      const myA = shown[focus]?.a ?? -Math.PI / 2;
      if (aCam == null) aCam = myA;
      aCam = wrapAngle(aCam + turnTo(myA, aCam) * (1 - Math.exp(-dt * 6)));
      shake = Math.max(0, shake - dt);
      const lean = R * 0.3, sx = shake ? Math.sin(tNow * 2.3) * shake * 0.3 : 0;
      camera.position.set(Math.cos(aCam) * lean + sx, Math.sin(aCam) * lean, 4.2);
      camera.rotation.set(0, 0, aCam + Math.PI / 2);
      const fov = 70 + Math.min(10, (sp - 12) * 0.6);
      if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = fov; camera.updateProjectionMatrix(); }
    },
  };
}

export default tunnelView;
