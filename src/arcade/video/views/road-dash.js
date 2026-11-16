/** The 3D picture of road-dash on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, box, canvasTex, ease, lights, pool, std } from './common.js?v=20261116-1213';
import { speedOf as roadSpeed } from '../road-dash.js?v=20261116-1213';
import { SEAT_COLORS, TICK } from '../lib.js?v=20261116-1213';

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
  // an Indian auto-rickshaw: a rounded tub in the player's colour, the black canvas hood with its yellow
  // top, a windscreen, handlebar and mirrors, one wheel in front and two behind
  const autoYellow = std('#f5c518', { roughness: 0.45 }), canvasMat = std('#1b1b1b', { roughness: 0.9 }), chrome = std('#d9dde3', { metalness: 0.8, roughness: 0.25 });
  const rubber = std('#111111', { roughness: 0.9 }), glassMat = std('#bfe3ff', { metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.55 });
  const rickshaw = (color) => {
    const g = new THREE.Group();
    const paint = std(color, { roughness: 0.35, metalness: 0.15 });
    const tub = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.42, 6, 14), paint);
    tub.rotation.x = Math.PI / 2; tub.scale.set(1, 1, 0.75); tub.position.set(0, 0.36, 0.05);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), paint);
    nose.scale.set(1, 0.9, 1.2); nose.position.set(0, 0.36, -0.4);
    const floor = box(0.56, 0.05, 0.7, std('#2a2a2a')); floor.position.set(0, 0.2, 0.08);
    // the hood: half a cylinder lying along the length, black canvas with a yellow top
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.72, 16, 1, true, -Math.PI / 2, Math.PI), canvasMat);
    hood.rotation.x = Math.PI / 2; hood.rotation.z = Math.PI / 2; hood.scale.set(1, 1, 0.85); hood.position.set(0, 0.56, 0.08);
    hood.material.side = THREE.DoubleSide;
    const top = box(0.5, 0.04, 0.74, autoYellow); top.position.set(0, 0.82, 0.08);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.26), glassMat); glass.position.set(0, 0.62, -0.3); glass.rotation.x = -0.25;
    const frame = box(0.5, 0.03, 0.03, chrome); frame.position.set(0, 0.76, -0.3);
    const bar = box(0.42, 0.025, 0.025, chrome); bar.position.set(0, 0.5, -0.36);
    const mirrors = [-1, 1].map((k) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), chrome); m.position.set(k * 0.27, 0.68, -0.32); return m; });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), basic('#fff6c0')); lamp.position.set(0, 0.42, -0.6);
    const tail = [-1, 1].map((k) => { const t = box(0.06, 0.04, 0.02, basic('#ff3b2f')); t.position.set(k * 0.2, 0.38, 0.44); return t; });
    const wheel = () => {
      const w = new THREE.Group();
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 16), rubber);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), chrome); hub.rotation.x = Math.PI / 2;
      w.add(tyre, hub);
      w.rotation.y = Math.PI / 2;
      return w;
    };
    const w1 = wheel(); w1.position.set(0, 0.13, -0.42); const w2 = wheel(); w2.position.set(0.31, 0.13, 0.3); const w3 = wheel(); w3.position.set(-0.31, 0.13, 0.3);
    g.add(tub, nose, floor, hood, top, glass, frame, bar, ...mirrors, lamp, ...tail, w1, w2, w3);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
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
    update(s, dt, alpha = 0, focus = 0) {
      if (!s.carts[focus]) focus = 0;
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
      const me = s.carts[focus];
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
        if (lastAlive[i] && !c.alive) { for (let q = 0; q < 10; q++) add(m.position.x, 0.4, m.position.z - 0.3, (Math.random() - 0.5) * 1.2, 0.6 + Math.random(), (Math.random() - 0.5) * 0.6, 1.1, 1.8, q % 3 ? '#666666' : '#ff8a3d'); if (i === focus) shake = 0.4; }
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
      camX = ease(camX, me ? laneX((shownY[focus] - 76) / 78) * 0.45 : 0, 1 - Math.exp(-dt * 4));
      shake = Math.max(0, shake - dt);
      camera.position.set(camX + (shake ? Math.sin(tNow * 2.9) * shake * 0.25 : 0), 2.5, 4.6);
      camera.lookAt(camX * 0.6, 0, -4);
      const fov = 58 + Math.min(8, fast * 8);
      if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = fov; camera.updateProjectionMatrix(); }
      void ahead;
    },
  };
}

export default roadView;
