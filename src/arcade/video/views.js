/**
 * The TV games in 3D. Each view builds a small scene once and moves things in it to match the game's
 * state; the game's rules never know it exists. A view returns { scene, camera, update(s, dt) }.
 * Light on purpose: no shadows, few lights, shared materials, simple shapes.
 */
import * as THREE from '../../vendor/three.chitplay.min.js';
import { SEAT_COLORS } from './lib.js?v=20261110-1153';
import { AHEAD as TUNNEL_AHEAD } from './tunnel-race.js?v=20261110-1153';
import { CX as BULL_CX, CY as BULL_CY } from './bull-fight.js?v=20261110-1153';
import { COLS as SNAKE_COLS, ROWS as SNAKE_ROWS } from './hungry-snake.js?v=20261110-1153';
import { G as HOOP_G, MAX as HOOP_MAX } from './hoop-flick.js?v=20261110-1153';
import { ALTAR as GHOST_ALTAR, CORRIDOR_Y as GHOST_CORRIDOR, DOOR as GHOST_DOOR, RAGE as GHOST_RAGE, roomX as GHOST_ROOMX } from './ghost-hostel.js?v=20261110-1153';
import { W as HOOP_W, H as HOOP_H } from './lib.js?v=20261110-1153';

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

/* ─── Tunnel Race ─── */
function tunnelView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d1626');
  scene.fog = new THREE.Fog('#0d1626', 16, 58);
  const camera = new THREE.PerspectiveCamera(70, 1.6, 0.1, 120);
  camera.position.set(0, 0, 4.2);
  const R = 3;
  const tex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#3a5b8c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4c72aa'; g.fillRect(0, 0, w, h / 2);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, 0, w, 6);
  }, [1, 12]);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 120, 48, 1, true), basic('#ffffff', { map: tex, side: THREE.BackSide }));
  tube.rotation.x = Math.PI / 2;
  tube.position.z = -55;
  const world = new THREE.Group();
  world.add(tube);
  scene.add(world);
  scene.add(new THREE.HemisphereLight('#ffffff', '#442266', 1.4));
  const walls = new Map();
  const wallMat = [std('#e0455a', { side: THREE.DoubleSide, roughness: 0.5 }), std('#f39c34', { side: THREE.DoubleSide, roughness: 0.5 })];
  const sector = (a0, len, m) => new THREE.Mesh(new THREE.CircleGeometry(R * 0.995, 28, a0, len), m);
  const gems = pool(world, () => new THREE.Mesh(new THREE.OctahedronGeometry(0.2), std('#7dffe3', { emissive: '#1b8f7a', metalness: 0.4, roughness: 0.2 })));
  const planes = [];
  const PZ = -1.2;
  return {
    scene, camera,
    update(s, dt) {
      tex.offset.y = (s.d * 0.04) % 1;
      // walls coming at you
      const seen = new Set();
      s.obs.forEach((o) => {
        const key = `${o.z}`;
        seen.add(key);
        let m = walls.get(key);
        if (!m) {
          m = new THREE.Group();
          const mat = wallMat[o.k === 'gap' ? 1 : 0];
          if (o.k === 'wall') m.add(sector(o.c - o.w / 2, o.w, mat));
          else if (o.k === 'gap') m.add(sector(o.c + o.w / 2, TAU - o.w, mat));
          else m.add(sector(o.c - o.w / 2, o.w, mat), sector(o.c + Math.PI - o.w / 2, o.w, mat));
          const rim = new THREE.Mesh(new THREE.TorusGeometry(R * 0.99, 0.05, 6, 48), basic('#ffffff'));
          m.add(rim);
          m.userData.c0 = o.c;
          world.add(m);
          walls.set(key, m);
        }
        m.position.z = -(o.z - s.d) + PZ;
        m.rotation.z = o.c - m.userData.c0;
      });
      walls.forEach((m, key) => { if (!seen.has(key)) { world.remove(m); m.traverse(x => x.geometry?.dispose()); walls.delete(key); } });
      gems.begin();
      s.gems.forEach((g) => { const m = gems.next(); m.position.set(Math.cos(g.a) * R * 0.74, Math.sin(g.a) * R * 0.74, -(g.z - s.d) + PZ); m.rotation.y += dt * 4; });
      gems.end();
      s.planes.forEach((p, i) => {
        if (!planes[i]) { planes[i] = paperPlane(SEAT_COLORS[i]); world.add(planes[i]); }
        const m = planes[i];
        m.position.set(Math.cos(p.a) * R * 0.74, Math.sin(p.a) * R * 0.74, PZ);
        m.scale.setScalar(1.5);
        m.rotation.set(0, 0, p.a + Math.PI / 2 - p.w * 0.25);
        m.visible = p.alive || Math.floor(s.t / 6) % 2 === 0;
      });
      // the faster it goes, the wider the view: speed you can feel
    },
  };
}

/* ─── Flying Chit ─── */
function flyingView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bfe3ff');
  scene.fog = new THREE.Fog('#bfe3ff', 30, 70);
  const camera = new THREE.PerspectiveCamera(62, 1.6, 0.1, 120);
  lights(scene, { sky: '#ffffff', ground: '#c9a46b' });
  const X = 3, Y = 2;
  // an endless notebook page below, and desks drifting by on either side
  const pageTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#9a6a3c'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = x % 64 ? '#8c5f34' : '#a87445'; g.fillRect(x, 0, 30, h); }
    g.strokeStyle = 'rgba(40,20,5,.45)'; g.lineWidth = 2;
    for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }, [6, 30]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 160), std('#ffffff', { map: pageTex, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -Y - 0.8, -60);
  scene.add(floor);
  const desks = pool(scene, () => {
    const d = new THREE.Group();
    const top = box(1.6, 0.12, 1, std('#a8733e'));
    top.position.y = 0.6;
    const l1 = box(0.1, 0.6, 0.1, std('#4a3322')); l1.position.set(-0.7, 0.3, 0);
    const l2 = l1.clone(); l2.position.x = 0.7;
    d.add(top, l1, l2);
    return d;
  });
  const hoops = pool(scene, () => new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 10, 36), std('#ffbf1f', { metalness: 0.6, roughness: 0.25, emissive: '#5a3c00' })));
  // the golden bangle at the start of a level: thicker, brighter, with sparkles round it
  const golds = pool(scene, () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(1, 0.11, 12, 40), std('#fff06a', { metalness: 0.8, roughness: 0.15, emissive: '#a07800' })));
    for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), basic('#fffbe0')); sp.position.set(Math.cos((k * TAU) / 8) * 1.3, Math.sin((k * TAU) / 8) * 1.3, 0); g.add(sp); }
    return g;
  });
  const fanMat = std('#6f7781', { metalness: 0.5 });
  const fans = pool(scene, () => {
    const f = new THREE.Group();
    f.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), fanMat));
    for (let k = 0; k < 3; k++) { const b = box(0.9, 0.03, 0.18, fanMat); b.position.x = 0.45; const arm = new THREE.Group(); arm.rotation.y = (k * TAU) / 3; arm.add(b); f.add(arm); }
    f.rotation.x = Math.PI / 2;
    return f;
  });
  const bookCols = ['#c0392b', '#2e86c1', '#27ae60', '#8e44ad'];
  const books = pool(scene, () => {
    const b = new THREE.Group();
    for (let k = 0; k < 3; k++) { const m = box(0.7 - k * 0.06, 0.16, 0.5, std(bookCols[k])); m.position.y = k * 0.17 - 0.17; b.add(m); }
    return b;
  });
  const chits = [];
  let camX = 0, camY = 0;
  const Z = (z) => -(z) * 0.9;
  return {
    scene, camera,
    update(s, dt) {
      pageTex.offset.y = (s.d * 0.18) % 1;
      desks.begin();
      for (let k = 0; k < 12; k++) {
        const z = (k * 9 - (s.d % 9));
        [-1, 1].forEach((side) => { const d = desks.next(); d.position.set(side * 5.4, -Y - 0.8, Z(z)); });
      }
      desks.end();
      hoops.begin(); golds.begin(); fans.begin(); books.begin();
      s.objs.forEach((o) => {
        const z = o.z - s.d;
        if (z > 72) return;
        if (o.k === 'hoop' && o.gold) { const m = golds.next(); m.position.set(o.x * X, o.y * Y, Z(z)); m.scale.setScalar(o.r * X * 1.05 * (1 + Math.sin(s.t * 0.15) * 0.04)); m.rotation.z = s.t * 0.04; }
        else if (o.k === 'hoop') { const m = hoops.next(); m.position.set(o.x * X, o.y * Y, Z(z)); m.scale.setScalar(o.r * X * 1.05); m.rotation.z = s.t * 0.01; }
        else if (o.k === 'fan') { const m = fans.next(); m.position.set(o.x * X, o.y * Y, Z(z)); m.rotation.z += dt * 9; m.scale.setScalar(o.r * 2.6); }
        else { const m = books.next(); m.position.set(o.x * X, o.y * Y, Z(z)); m.scale.setScalar(o.r * 2.6); m.rotation.y = o.z; }
      });
      hoops.end(); golds.end(); fans.end(); books.end();
      s.chits.forEach((c, i) => {
        if (!chits[i]) { chits[i] = wingedChit(SEAT_COLORS[i]); scene.add(chits[i]); }
        const m = chits[i];
        m.position.set(c.x * X, c.y * Y, 0);
        m.rotation.set(c.vy * 0.25 + (c.alive ? 0 : 0.8), 0, -c.vx * 0.35);
        const flap = c.alive ? Math.sin(s.t * 0.45 + i) * 0.5 : 0.1;
        m.userData.wings[0].rotation.z = flap;
        m.userData.wings[1].rotation.z = -flap;
        m.visible = c.hit <= 0 || Math.floor(s.t / 4) % 2 === 0;
      });
      // the camera follows the first chit, a little behind and above
      const me = s.chits[0];
      camX = ease(camX, me.x * X * 0.6, 0.08);
      camY = ease(camY, me.y * Y * 0.6 + 0.5, 0.08);
      camera.position.set(camX, camY + 0.2, 2.7);
      camera.lookAt(camX * 0.5, camY * 0.5 - 0.5, -10);
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

/* ─── Bull Fight: a sand ring with a crowd's fence round it ─── */
function bullView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f2c27a');
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, 4.7, 4.1);
  camera.lookAt(0, 0, 0.25);
  lights(scene, { sky: '#fff1d6', ground: '#8a5a2b', sun: 1.8 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), std('#b07a45', { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01;
  scene.add(ground);
  const sand = new THREE.Mesh(new THREE.CircleGeometry(1, 48), std('#e8cc94', { roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 64), basic('#ffffff'));
  rim.rotation.x = Math.PI / 2;
  const ring = new THREE.Group();
  ring.add(sand, rim);
  ring.position.z = 0.2;
  scene.add(ring);
  // a wooden fence and flags round the arena
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * TAU, post = box(0.06, 0.4, 0.06, std('#6b4223'));
    post.position.set(Math.cos(a) * 2.3, 0.2, Math.sin(a) * 2.3 + 0.2);
    scene.add(post);
    if (k % 4 === 0) { const f = box(0.02, 0.16, 0.22, basic(['#d32f2f', '#f2b705', '#2e9e4f', '#1e6fd0'][(k / 4) % 4])); f.position.set(post.position.x, 0.55, post.position.z); scene.add(f); }
  }
  const bull = (color, band) => {
    const g = new THREE.Group();
    const hide = std(color, { roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.32, 6, 12), hide);
    body.rotation.z = Math.PI / 2; body.position.y = 0.3;
    const head = box(0.2, 0.2, 0.22, hide); head.position.set(0.36, 0.36, 0);
    const horn = std('#f4ead5', { roughness: 0.4 });
    [-1, 1].forEach((side) => { const h = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 8), horn); h.rotation.set(side * -0.9, 0, -0.5); h.position.set(0.42, 0.5, side * 0.12); g.add(h); });
    const nose = box(0.06, 0.1, 0.14, std('#d9a38a')); nose.position.set(0.48, 0.32, 0);
    const blanket = box(0.3, 0.06, 0.38, std(band)); blanket.position.y = 0.48;
    [[-0.15, -0.1], [-0.15, 0.1], [0.15, -0.1], [0.15, 0.1]].forEach(([x, z]) => { const l = box(0.07, 0.22, 0.07, hide); l.position.set(x, 0.11, z); g.add(l); });
    g.add(body, head, nose, blanket);
    return g;
  };
  const bulls = [bull('#7a4a2a', SEAT_COLORS[0]), bull('#2f2420', SEAT_COLORS[1])];
  scene.add(...bulls);
  const dust = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), basic('#d8b47a', { transparent: true, opacity: 0.6 })));
  return {
    scene, camera,
    update(s) {
      ring.scale.setScalar(s.ring / 100);
      dust.begin();
      s.bulls.forEach((b, i) => {
        const m = bulls[i];
        m.position.set(toX(b.x), b.charge > 0 ? Math.abs(Math.sin(s.t * 0.6)) * 0.05 : 0, toZ(b.y));
        m.rotation.y = -b.dir;
        m.rotation.z = b.stun > 0 ? Math.sin(s.t * 0.8) * 0.15 : 0;
        if (b.charge > 0 || Math.hypot(b.vx, b.vy) > 150) for (let k = 0; k < 3; k++) { const d = dust.next(); d.position.set(toX(b.x) - Math.cos(b.dir) * (0.3 + k * 0.12), 0.05 + k * 0.03, toZ(b.y) - Math.sin(b.dir) * (0.3 + k * 0.12)); }
      });
      dust.end();
      void BULL_CX; void BULL_CY;
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
