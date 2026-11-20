/** The 3D picture of tag-game on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { basic, box, lights, std } from './common.js?v=20261120-0817';
import { FURNITURE, TAG_COVER } from '../tag-game-core.js?v=20261120-0817';
import { H as HOOP_H, SEAT_COLORS, W as HOOP_W } from '../lib.js?v=20261120-0817';

/*
 * The tag games in 3D: hide and seek in a big house (rooms with their own floors, low walls with wide
 * doorways, furniture to hide behind), the two chase games in a hall (polished stone, a long carpet,
 * pillars). Same places as the rules: every hiding spot is a piece of furniture or a pillar.
 */
function floorTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  if (kind === 'wood') {
    g.fillStyle = '#b98a5a'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) {
      g.fillStyle = (y / 32) % 2 ? '#b07f4f' : '#c19463'; g.fillRect(0, y, 256, 31);
      g.fillStyle = 'rgba(60,35,12,.35)'; g.fillRect(0, y + 31, 256, 1); g.fillRect(((y * 7) % 200) + 20, y, 1, 32);
    }
  } else if (kind === 'tile') {
    for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) { g.fillStyle = ((x + y) / 64) % 2 ? '#ece4d2' : '#ddd2bb'; g.fillRect(x, y, 64, 64); }
    g.strokeStyle = 'rgba(120,105,80,.45)'; g.lineWidth = 2;
    for (let k = 0; k <= 256; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
  } else if (kind === 'carpet') {
    g.fillStyle = '#8a3b3b'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#e2b35d'; g.lineWidth = 8; g.strokeRect(20, 20, 216, 216); g.lineWidth = 3; g.strokeRect(38, 38, 180, 180);
    g.fillStyle = '#e2b35d'; g.beginPath(); g.arc(128, 128, 30, 0, Math.PI * 2); g.fill();
  } else {
    const ice = kind === 'ice';
    for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) { g.fillStyle = ((x + y) / 64) % 2 ? (ice ? '#e8f4f8' : '#efe2c8') : (ice ? '#cfe4ee' : '#dfcca8'); g.fillRect(x, y, 64, 64); }
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1;
    for (let k = 0; k <= 256; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function tagGameView(mode) {
  const scene = new THREE.Scene();
  const icy = mode === 'baraf-pani';
  const house = mode === 'lapa-chupi';
  scene.background = new THREE.Color(house ? '#2c211a' : icy ? '#1d2a33' : '#2a2018');
  const camera = new THREE.PerspectiveCamera(38, 1.6, 0.1, 50);
  // close enough that the house (or the hall) fills the picture
  camera.position.set(0, 6.3, 4.5); camera.lookAt(0, 0, 0.25);
  lights(scene, { sky: icy ? '#eef8ff' : '#fff4e0', ground: '#3a2c20', sun: 1.7 });
  const halfX = 2.96, halfZ = 1.79, midZ = 0.18;
  const plane = (w, d, mat, x, z, y = -0.07) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; };
  const texMat = (kind, rx, ry) => { const t = floorTexture(kind); t.repeat.set(rx, ry); return std('#ffffff', { map: t, roughness: kind === 'carpet' ? 0.95 : 0.45 }); };
  const wallMat = std('#efe6d6', { roughness: 0.8 });
  const wall = (w, h, d, x, z) => { const m = box(w, h, d, wallMat); m.position.set(x, h / 2 - 0.07, z); scene.add(m); return m; };
  if (house) {
    // four rooms: two bedrooms at the back, the kitchen and the living room at the front
    plane(halfX, midZ + halfZ, texMat('wood', 3, 2), -halfX / 2, (midZ - halfZ) / 2);
    plane(halfX, midZ + halfZ, texMat('wood', 3, 2), halfX / 2, (midZ - halfZ) / 2);
    plane(halfX, halfZ - midZ, texMat('tile', 4, 2), -halfX / 2, (halfZ + midZ) / 2);
    plane(halfX, halfZ - midZ, texMat('carpet', 1, 1), halfX / 2, (halfZ + midZ) / 2);
    // the outer walls (the front is left open, like a doll's house, so the camera sees in)
    wall(halfX * 2 + 0.1, 0.5, 0.08, 0, -halfZ - 0.04);
    wall(0.08, 0.5, halfZ * 2, -halfX - 0.04, 0);
    wall(0.08, 0.5, halfZ * 2, halfX + 0.04, 0);
    // windows on the back wall
    [-1.6, 1.4].forEach((wx) => { const win = box(0.62, 0.22, 0.02, std('#9fd3ff', { emissive: '#4a7fa8', emissiveIntensity: 0.4 })); win.position.set(wx, 0.24, -halfZ + 0.01); scene.add(win); });
    // low inside walls with wide doorways
    const gap = 0.7, h = 0.24;
    wall(0.06, h, (midZ + halfZ) / 2 - gap / 2, 0, -halfZ + ((midZ + halfZ) / 2 - gap / 2) / 2);
    wall(0.06, h, (midZ + halfZ) / 2 - gap / 2, 0, midZ - ((midZ + halfZ) / 2 - gap / 2) / 2);
    wall(halfX * 0.44, h, 0.06, -halfX + halfX * 0.22, midZ);
    wall(halfX * 0.64 - gap, h, 0.06, -halfX * 0.56 + gap + (halfX * 0.64 - gap) / 2, midZ);
    wall(halfX * 0.72 - gap, h, 0.06, halfX * 0.28 + (halfX * 0.72 - gap) / 2, midZ);
    // a ceiling lamp's warm glow in each room
    [[-1.5, -0.8], [1.5, -0.8], [-1.5, 1], [1.5, 1]].forEach(([lx, lz]) => { const l = new THREE.PointLight('#ffd9a0', 0.6, 3.2); l.position.set(lx, 1.4, lz); scene.add(l); });
  } else {
    plane(halfX * 2, halfZ * 2, texMat(icy ? 'ice' : 'stone', 9, 5.5), 0, 0);
    const runner = plane(halfX * 1.2, halfZ * 0.48, std(icy ? '#5d93b8' : '#9a3a36', { roughness: 0.95 }), 0, 0, -0.065);
    const trim = plane(halfX * 1.2 - 0.12, halfZ * 0.48 - 0.12, std(icy ? '#e8f6ff' : '#e2b35d', { roughness: 0.6 }), 0, 0, -0.064);
    trim.scale.set(1, 1, 1); runner.renderOrder = 0;
    const inner = plane(halfX * 1.2 - 0.2, halfZ * 0.48 - 0.2, std(icy ? '#5d93b8' : '#9a3a36', { roughness: 0.95 }), 0, 0, -0.063); inner.renderOrder = 1;
    wall(halfX * 2 + 0.1, 0.6, 0.08, 0, -halfZ - 0.04);
    wall(0.08, 0.6, halfZ * 2, -halfX - 0.04, 0);
    wall(0.08, 0.6, halfZ * 2, halfX + 0.04, 0);
    // tall windows down the back wall and a chandelier's light over the middle
    for (let k = 0; k < 5; k++) { const win = box(0.42, 0.34, 0.02, std(icy ? '#cfefff' : '#ffe2a6', { emissive: icy ? '#5aa0c8' : '#b8833a', emissiveIntensity: 0.35 })); win.position.set(-2.2 + k * 1.1, 0.3, -halfZ + 0.01); scene.add(win); }
    const chand = new THREE.PointLight(icy ? '#e6f6ff' : '#ffe2b0', 1.1, 6); chand.position.set(0, 2.2, 0); scene.add(chand);
  }
  const wood = (c) => std(c, { roughness: 0.7 });
  const covers = TAG_COVER.map(([px, py], i) => {
    const x = (px - HOOP_W / 2) / 100, z = (py - HOOP_H / 2) / 100;
    const g = new THREE.Group();
    const add = (m, mx, my, mz) => { m.position.set(mx, my, mz); g.add(m); return m; };
    if (house) {
      const kind = FURNITURE[i % FURNITURE.length];
      if (kind === 'bed' || kind === 'bed2') {
        add(box(0.62, 0.16, 0.46, wood('#5a3a22')), 0, 0.08, 0);
        add(box(0.58, 0.08, 0.42, std('#f4efe4', { roughness: 0.9 })), 0, 0.2, 0);
        add(box(0.58, 0.04, 0.24, std(kind === 'bed' ? '#3f7fbf' : '#c0563f', { roughness: 0.9 })), 0, 0.25, 0.09);
        add(box(0.2, 0.06, 0.12, std('#ffffff')), -0.14, 0.27, -0.13); add(box(0.2, 0.06, 0.12, std('#ffffff')), 0.14, 0.27, -0.13);
        add(box(0.62, 0.3, 0.04, wood('#4a2f1b')), 0, 0.23, -0.23);
      } else if (kind === 'table') {
        add(box(0.62, 0.04, 0.4, wood('#8a5a32')), 0, 0.3, 0);
        [[-0.27, -0.16], [0.27, -0.16], [-0.27, 0.16], [0.27, 0.16]].forEach(([lx, lz]) => add(box(0.04, 0.3, 0.04, wood('#6b4524')), lx, 0.15, lz));
        [[-0.42, 0], [0.42, 0]].forEach(([cx]) => { add(box(0.16, 0.03, 0.16, wood('#7a4b2a')), cx, 0.18, 0); add(box(0.16, 0.18, 0.03, wood('#7a4b2a')), cx + Math.sign(cx) * 0.07, 0.27, 0); });
      } else if (kind === 'tv') {
        add(box(0.7, 0.22, 0.24, wood('#3b2a1e')), 0, 0.11, 0);
        add(box(0.56, 0.32, 0.03, std('#111111', { roughness: 0.3 })), 0, 0.4, -0.04);
        add(box(0.5, 0.26, 0.01, basic('#4ab3ff')), 0, 0.4, -0.02);
      } else if (kind === 'sofa') {
        add(box(0.7, 0.16, 0.36, std('#6b3fa0', { roughness: 0.9 })), 0, 0.12, 0.02);
        add(box(0.7, 0.26, 0.1, std('#5a3489', { roughness: 0.9 })), 0, 0.25, -0.15);
        add(box(0.1, 0.22, 0.36, std('#5a3489', { roughness: 0.9 })), -0.34, 0.17, 0.02); add(box(0.1, 0.22, 0.36, std('#5a3489', { roughness: 0.9 })), 0.34, 0.17, 0.02);
      } else if (kind === 'plant') {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 14), std('#b0643a')), 0, 0.1, 0);
        [[0, 0.36, 0, 0.2], [-0.12, 0.3, 0.05, 0.14], [0.12, 0.32, -0.04, 0.15], [0, 0.5, 0, 0.13]].forEach(([lx, ly, lz, r]) => add(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), std('#3f8f3a', { roughness: 0.9 })), lx, ly, lz));
      } else if (kind === 'curtain') {
        for (let k = 0; k < 5; k++) add(box(0.07, 0.62, 0.05, std(k % 2 ? '#d98c3a' : '#c2752a', { roughness: 0.95 })), 0, 0.31, -0.18 + k * 0.09);
        add(box(0.04, 0.03, 0.5, wood('#7a4b25')), 0, 0.63, 0.0);
      } else {
        add(box(0.34, 0.66, 0.3, std('#e9eef2', { roughness: 0.35 })), 0, 0.33, 0);
        add(box(0.35, 0.01, 0.31, std('#b8c3cc')), 0, 0.46, 0);
        add(box(0.02, 0.12, 0.02, std('#8a96a0', { metalness: 0.6 })), 0.12, 0.55, 0.16);
      }
    } else {
      // a stone pillar (frosted for freeze tag), with a base and a capital
      const stone = std(icy ? '#e6f4fb' : '#efe2c8', { roughness: icy ? 0.25 : 0.5, metalness: icy ? 0.1 : 0 });
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.08, 18), stone), 0, 0.04, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.6, 18), stone), 0, 0.38, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.08, 18), stone), 0, 0.72, 0);
    }
    g.position.set(x, -0.07, z); scene.add(g); return g;
  });
  const makePlayer = (seat) => {
    const g = new THREE.Group();
    const shirt = std(SEAT_COLORS[seat], { roughness: 0.72 });
    const skin = std(['#e0ac69', '#c68642', '#8d5524', '#f1c27d'][seat % 4], { roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.2, 4, 8), shirt); body.position.y = 0.28;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), skin); head.position.y = 0.51;
    const legMat = std('#28313a', { roughness: 0.84 });
    const legs = [-0.055, 0.055].map((lx) => { const l = box(0.055, 0.18, 0.07, legMat); l.position.set(lx, 0.09, 0.015); return l; });
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.16, 8), basic('#ffd23f')); hat.position.y = 0.68;
    const badge = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 6, 24), basic(SEAT_COLORS[seat]));
    badge.rotation.x = Math.PI / 2; badge.position.y = 0.02;
    const ice = new THREE.Mesh(new THREE.SphereGeometry(0.29, 10, 8), std('#a7f2ff', { transparent: true, opacity: 0.48, roughness: 0.16, metalness: 0.12 }));
    ice.position.y = 0.3;
    g.add(body, head, ...legs, hat, badge, ice); scene.add(g);
    g.userData = { body, shirt, hat, badge, ice, seat };
    return g;
  };
  const people = Array.from({ length: 4 }, (_, i) => makePlayer(i));
  // the camera rides behind and above your own player, so you move through the house (or the hall)
  // instead of watching a map: closer in, following smoothly, still wide enough to see who is near
  const cam = { x: 0, z: 0.25, ready: false };
  return {
    scene, camera,
    update(s, dt, _alpha, mine = 0) {
      const me = s.players[mine] || s.players[0];
      const tx = me && Number.isFinite(me.x) ? (me.x - HOOP_W / 2) / 100 * 0.78 : 0;
      const tz = me && Number.isFinite(me.y) ? (me.y - HOOP_H / 2) / 100 * 0.78 : 0.25;
      const k = cam.ready ? 1 - Math.exp(-(Number(dt) || 0.016) * 3.2) : 1;
      cam.x += (tx - cam.x) * k; cam.z += (tz - cam.z) * k; cam.ready = true;
      camera.position.set(cam.x, 4.3, cam.z + 3.3);
      camera.lookAt(cam.x, 0, cam.z - 0.15);
      // a hiding place rustles when the seeker gets close to whoever is inside it
      const seeker = s.players[s.it];
      covers.forEach((c) => { c.rotation.z = 0; });
      if (house && seeker && s.phase === 'seek') s.players.forEach((p, i) => {
        if (i === s.it || !p.hidden || !p.alive) return;
        const near = Math.hypot(seeker.x - p.x, seeker.y - p.y);
        if (near > 170) return;
        let best = null, bd = Infinity;
        TAG_COVER.forEach(([cx, cy], j) => { const d = Math.hypot(cx - p.x, cy - p.y); if (d < bd) { bd = d; best = j; } });
        if (best != null) covers[best].rotation.z = Math.sin(s.t * 0.9 + i) * (near < 100 ? 0.05 : 0.025);
      });
      s.players.forEach((p, i) => {
        const m = people[i], u = m.userData;
        const concealed = (mode === 'lapa-chupi' && p.hidden) || !p.alive
          || !Number.isFinite(p.x) || !Number.isFinite(p.y);
        m.visible = !concealed;
        if (concealed) return;
        const x = (p.x - HOOP_W / 2) / 100, z = (p.y - HOOP_H / 2) / 100;
        m.position.set(x, 0, z);
        const speed = Math.hypot(p.vx || 0, p.vy || 0);
        if (speed > 1) m.rotation.y = Math.atan2(p.vx, p.vy);
        m.position.y = speed > 1 ? Math.abs(Math.sin(s.t * 0.45 + i)) * 0.035 : 0;
        u.hat.visible = i === s.it;
        u.badge.material.color.set(i === s.it ? '#ffd23f' : SEAT_COLORS[i]);
        u.ice.visible = !!p.frozen;
        u.shirt.color.set(p.frozen ? '#75d9f0' : SEAT_COLORS[i]);
      });
      for (let i = s.players.length; i < people.length; i++) people[i].visible = false;
    },
  };
}

export default tagGameView;
