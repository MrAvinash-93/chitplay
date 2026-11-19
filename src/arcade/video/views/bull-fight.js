/** The 3D picture of bull-fight on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, box, canvasTex, ease, pool, std, toX, toZ, turnTo, wrapAngle } from './common.js?v=20261119-1247';
import { SEAT_COLORS, TICK } from '../lib.js?v=20261119-1247';
import { CX as BULL_CX, CY as BULL_CY } from '../bull-fight.js?v=20261119-1247';

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
        v.dir = wrapAngle(v.dir + turnTo(b.dir, v.dir) * (1 - Math.exp(-dt * 14)));
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

export default bullView;
