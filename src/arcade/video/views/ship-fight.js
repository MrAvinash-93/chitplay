/** The 3D picture of ship-fight on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, box, canvasTex, ease, pool, std, tableCamera, toX, toZ } from './common.js?v=20261116-1137';
import { SEAT_COLORS, TICK } from '../lib.js?v=20261116-1137';
import { COOL as SHIP_COOL, STORM_AT as SHIP_STORM } from '../ship-fight.js?v=20261116-1137';

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

export default shipView;
