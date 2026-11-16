/** The 3D picture of backyard-rally on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { basic, box, canvasTex, pool, std, toX, toZ } from './common.js?v=20261116-1213';
import { H as HOOP_H, SEAT_COLORS, TICK, W as HOOP_W } from '../lib.js?v=20261116-1213';
import { TOP as RALLY_TOP, WIN as RALLY_WIN } from '../backyard-rally.js?v=20261116-1213';

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

export default rallyView;
