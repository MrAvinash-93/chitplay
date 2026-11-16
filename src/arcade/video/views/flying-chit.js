/** The 3D picture of flying-chit on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, box, canvasTex, ease, pool, std, wingedChit } from './common.js?v=20261116-1309';
import { SEAT_COLORS, TICK } from '../lib.js?v=20261116-1309';
import { selectedGameCosmetic } from '../../game-cosmetics.js?v=20261116-1309';
import { GRAZE as FLY_GRAZE, placeAt, speedAt } from '../flying-chit.js?v=20261116-1309';

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
  scene.fog = new THREE.Fog(FLY_MOODS[0].fog, 18, 58);
  const camera = new THREE.PerspectiveCamera(66, 1.6, 0.1, 120);   // a wider lens: the corridor walls stream past like a tunnel
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
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, LEN), std('#ffffff', { map: floorTex, roughness: 0.9 }));
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
    // a school corridor narrow as a tunnel: the walls rush past just outside the flying space
    m.position.set(side * 4.4, 0.2, -LEN / 2 + 6);
    return m;
  });
  // the ceiling, with tube lights going by
  const ceilTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,110,95,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  }, [7, LEN / 2]);
  const ceilMat = std('#ffffff', { map: ceilTex, roughness: 1 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(9, LEN), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, Y + 1.0, -LEN / 2 + 6);
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
  let chitStyle = selectedGameCosmetic('flying-chit', 'chit')?.style || 'classic';
  let dShown = null, camX = 0, camY = 0, roll = 0, shake = 0, fov = 62;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0, focus = 0) {
      if (!s.chits[focus]) focus = 0;
      const nextChitStyle = selectedGameCosmetic('flying-chit', 'chit')?.style || 'classic';
      if (nextChitStyle !== chitStyle) {
        chitStyle = nextChitStyle;
        chits.forEach((chit) => chit?.userData.applyStyle(chitStyle));
      }
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
      for (let i = 0; i < 9; i++) { const z = i * 7 - (d % 7); [-1.6, 1.6].forEach((x) => { tubes.next().position.set(x, Y + 0.96, Z(z) + 3); }); }
      tubes.end();
      desks.begin();
      for (let i = 0; i < 12; i++) {
        const z = (i * 9 - (d % 9));
        [-1, 1].forEach((side) => { const m = desks.next(); m.position.set(side * 3.75, -Y - 0.8, Z(z)); m.rotation.y = side > 0 ? Math.PI : 0; });
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
      const a0 = s.chits[focus], v0 = shown[focus];
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
        if (!chits[i]) { chits[i] = wingedChit(SEAT_COLORS[i], chitStyle); scene.add(chits[i]); shown[i] = { x: c.x, y: c.y, score: c.score, hit: c.hit, trail: [] }; }
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
        if (c.hit > v.hit && i === focus) shake = 0.35;
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
      const me = shown[focus] || { x: 0, y: 0 }, c0 = s.chits[focus] || {};
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

export default flyingView;
