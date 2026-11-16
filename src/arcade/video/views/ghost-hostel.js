/** The 3D picture of ghost-hostel on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { SEAT_COLORS, W as HOOP_W } from '../lib.js?v=20261116-1239';
import { ALTAR as GHOST_ALTAR, CORRIDOR_Y as GHOST_CORRIDOR, DOOR as GHOST_DOOR, NIGHT as GHOST_NIGHT, RAGE as GHOST_RAGE, roomX as GHOST_ROOMX } from '../ghost-hostel.js?v=20261116-1239';
import { TAU, basic, box, canvasTex, pool, std } from './common.js?v=20261116-1239';

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

export default ghostView;
