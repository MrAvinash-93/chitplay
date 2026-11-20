/** The 3D picture of hungry-snake on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, box, canvasTex, ease, pool, std, tableCamera } from './common.js?v=20261120-0817';
import { COLS as SNAKE_COLS, ROWS as SNAKE_ROWS } from '../hungry-snake.js?v=20261120-0817';
import { SEAT_COLORS } from '../lib.js?v=20261120-0817';

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
    update(s, dt, alpha = 0, focus = 0) {
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
      const me = s.snakes[focus] || s.snakes[0];
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

export default snakeView;
