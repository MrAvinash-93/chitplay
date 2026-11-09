/**
 * The 3D shapes of the things you can buy for your room (beyond the first few, which live in
 * world-3d.js). Simple shapes, shared materials, no textures except where a picture is the point.
 * Every maker returns a group whose front faces +z; floor things stand on y = 0. Something that
 * moves sets `userData.tick(dt, t)`.
 */
export function decorMakers(THREE, { M, glowMat, box3, cyl3, shadowy }) {
  const sphere = (r, m, x = 0, y = 0, z = 0, seg = 14) => { const o = shadowy(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), m)); o.position.set(x, y, z); return o; };
  const light = (color, power, dist, x, y, z) => { const l = new THREE.PointLight(color, power, dist, 2); l.position.set(x, y, z); return l; };
  const picture = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const gold = M('#e8b923', { metalness: 0.85, roughness: 0.25 });
  const steel = M('#c9d1da', { metalness: 0.7, roughness: 0.3 });
  const dark = M('#1d1d22');
  const wood = M('#7a4a26');

  return {
    /* ─── common ─── */
    cushions() {
      const g = new THREE.Group();
      ['#e85a4c', '#3a7bd5', '#f2b705'].forEach((c, i) => { const s = sphere(0.22, M(c, { roughness: 0.95 }), (i - 1) * 0.36, 0.1, (i % 2) * 0.12); s.scale.set(1, 0.42, 1); g.add(s); });
      return g;
    },
    cactus() {
      const g = new THREE.Group();
      g.add(cyl3(0.13, 0.1, 0.22, M('#d9774a'), 0, 0.11, 0));
      const green = M('#3f8f47', { roughness: 0.8 });
      g.add(cyl3(0.07, 0.08, 0.5, green, 0, 0.45, 0), sphere(0.07, green, 0, 0.7, 0));
      [-1, 1].forEach((s) => { const arm = cyl3(0.04, 0.045, 0.2, green, s * 0.11, 0.5, 0); g.add(arm, sphere(0.04, green, s * 0.11, 0.6, 0)); g.add(box3(0.06, 0.04, 0.05, green, s * 0.07, 0.42, 0)); });
      g.add(sphere(0.035, M('#ff6b9a'), 0, 0.78, 0));
      return g;
    },
    books() {
      const g = new THREE.Group();
      g.add(box3(0.8, 1.3, 0.32, wood, 0, 0.65, 0));
      const cols = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#ef6c00', '#00838f'];
      [0.15, 0.55, 0.95].forEach((y, row) => {
        g.add(box3(0.74, 0.02, 0.3, M('#5a3418'), 0, y - 0.02, 0.01));
        let x = -0.33;
        for (let k = 0; x < 0.3; k++) { const w = 0.04 + ((k * 7 + row * 3) % 4) * 0.012, h = 0.24 + ((k * 5 + row) % 3) * 0.04; g.add(box3(w, h, 0.22, M(cols[(k + row * 2) % cols.length]), x + w / 2, y + h / 2, 0.04)); x += w + 0.008; }
      });
      return g;
    },
    fishbowl() {
      const g = new THREE.Group();
      g.add(cyl3(0.2, 0.16, 0.55, wood, 0, 0.275, 0));
      const glass = new THREE.Mesh(new THREE.SphereGeometry(0.2, 22, 16), M('#bfe9ff', { transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1 }));
      glass.position.y = 0.76;
      const water = new THREE.Mesh(new THREE.SphereGeometry(0.185, 20, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), M('#3aa3c9', { transparent: true, opacity: 0.45 }));
      water.position.y = 0.76;
      const fish = [];
      ['#ff8a00', '#ffd23f'].forEach((c, i) => { const f = new THREE.Group(); const b = sphere(0.035, M(c), 0, 0, 0, 10); b.scale.set(1.5, 1, 0.7); const tail = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.04, 6), M(c)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.06; f.add(b, tail); g.add(f); fish.push([f, i]); });
      g.add(glass, water);
      g.userData.tick = (dt, t) => fish.forEach(([f, i]) => { const a = t * (0.9 + i * 0.4) + i * 3; f.position.set(Math.cos(a) * 0.09, 0.74 + Math.sin(t * 1.3 + i) * 0.03, Math.sin(a) * 0.09); f.rotation.y = -a - Math.PI / 2; });
      return g;
    },
    frames() {
      const g = new THREE.Group();
      [[-0.3, 0.12, 0.34, 0.26, '#7b3fe4'], [0.1, 0.18, 0.26, 0.34, '#e8a317'], [0.38, -0.06, 0.24, 0.2, '#2e9e4f'], [-0.12, -0.2, 0.3, 0.2, '#e53935']].forEach(([x, y, w, h, c], i) => {
        g.add(box3(w + 0.04, h + 0.04, 0.02, M('#2a1a10'), x, y, -0.01));
        const t = picture(64, 64, (p) => { p.fillStyle = c; p.fillRect(0, 0, 64, 64); p.fillStyle = 'rgba(255,255,255,.85)'; p.font = '40px system-ui'; p.textAlign = 'center'; p.fillText(['🏆', '🎲', '♟️', '🃏'][i], 32, 46); });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M('#ffffff', { map: t, roughness: 0.7 }));
        m.position.set(x, y, 0.002);
        g.add(m);
      });
      return g;
    },
    wallshelf() {
      const g = new THREE.Group();
      g.add(box3(0.9, 0.04, 0.2, wood, 0, 0, 0.08));
      g.add(cyl3(0.06, 0.05, 0.1, M('#d9774a'), -0.3, 0.07, 0.08), sphere(0.08, M('#3fa34d'), -0.3, 0.17, 0.08));
      g.add(box3(0.06, 0.2, 0.14, M('#1565c0'), 0, 0.12, 0.08), box3(0.05, 0.17, 0.14, M('#c62828'), 0.07, 0.105, 0.08));
      g.add(cyl3(0.04, 0.05, 0.12, gold, 0.3, 0.08, 0.08), sphere(0.05, gold, 0.3, 0.18, 0.08));
      return g;
    },

    /* ─── rare ─── */
    chair() {
      const g = new THREE.Group();
      const red = M('#d32f2f', { roughness: 0.5 }), blk = M('#202024', { roughness: 0.5 });
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; const leg = box3(0.04, 0.03, 0.3, blk, Math.sin(a) * 0.15, 0.04, Math.cos(a) * 0.15); leg.rotation.y = a; g.add(leg); }
      g.add(cyl3(0.03, 0.03, 0.36, steel, 0, 0.22, 0));
      g.add(box3(0.5, 0.1, 0.48, blk, 0, 0.44, 0), box3(0.42, 0.04, 0.4, red, 0, 0.5, 0));
      const back = box3(0.48, 0.8, 0.08, blk, 0, 0.88, -0.22); back.rotation.x = -0.12; g.add(back);
      const stripe = box3(0.14, 0.7, 0.01, red, 0, 0.88, -0.17); stripe.rotation.x = -0.12; g.add(stripe);
      [-1, 1].forEach((s) => g.add(box3(0.05, 0.04, 0.34, blk, s * 0.27, 0.62, 0)));
      return g;
    },
    fridge() {
      const g = new THREE.Group();
      g.add(box3(0.5, 0.8, 0.5, M('#e9eef3', { roughness: 0.3 }), 0, 0.4, 0));
      g.add(box3(0.03, 0.3, 0.03, steel, 0.18, 0.5, 0.26));
      g.add(box3(0.46, 0.01, 0.01, M('#9aa3ad'), 0, 0.55, 0.255));
      ['#e53935', '#2bd8ff', '#ffd23f'].forEach((c, i) => g.add(sphere(0.025, M(c), -0.15 + i * 0.08, 0.68, 0.26, 8)));
      return g;
    },
    guitar() {
      const g = new THREE.Group();
      g.add(box3(0.3, 0.03, 0.2, dark, 0, 0.015, 0), box3(0.03, 0.5, 0.03, dark, 0, 0.26, -0.06));
      const body = new THREE.Group();
      const red = M('#b3261e', { roughness: 0.35 });
      const a = sphere(0.18, red, 0, 0.32, 0); a.scale.set(1, 1, 0.3);
      const b = sphere(0.14, red, 0, 0.55, 0); b.scale.set(1, 1, 0.3);
      const hole = cyl3(0.05, 0.05, 0.01, dark, 0, 0.42, 0.055); hole.rotation.x = Math.PI / 2;
      body.add(a, b, hole, box3(0.05, 0.55, 0.03, M('#5a3418'), 0, 0.92, 0), box3(0.08, 0.12, 0.03, dark, 0, 1.24, 0));
      body.rotation.x = -0.2;
      body.position.z = 0.03;
      g.add(body);
      return g;
    },
    jukebox() {
      const g = new THREE.Group();
      g.add(box3(0.62, 1.0, 0.42, M('#8a2be2'), 0, 0.5, 0));
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.42, 24, 1, false, -Math.PI / 2, Math.PI), M('#8a2be2'));
      top.rotation.x = Math.PI / 2; top.rotation.z = Math.PI / 2; top.position.set(0, 1.0, 0); shadowy(top);
      g.add(top);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 30, Math.PI), glowMat('#ffd23f'));
      arch.position.set(0, 1.0, 0.22);
      g.add(arch);
      const bars = [];
      for (let k = 0; k < 5; k++) { const b = box3(0.06, 0.2, 0.02, glowMat(['#ff3b5c', '#ff8a00', '#ffd23f', '#2bff8a', '#2bd8ff'][k]), -0.2 + k * 0.1, 0.45, 0.22); g.add(b); bars.push(b); }
      g.add(light('#c77dff', 1.2, 2.4, 0, 0.8, 0.5));
      g.userData.tick = (dt, t) => bars.forEach((b, k) => { b.scale.y = 0.4 + Math.abs(Math.sin(t * 4 + k * 1.3)) * 0.9; });
      return g;
    },
    aquarium() {
      const g = new THREE.Group();
      g.add(box3(1.0, 0.5, 0.4, dark, 0, 0.25, 0));
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.5, 0.36), M('#3aa3c9', { transparent: true, opacity: 0.35, roughness: 0.05 }));
      tank.position.y = 0.76;
      g.add(tank, box3(0.98, 0.04, 0.38, dark, 0, 1.02, 0), box3(0.94, 0.04, 0.34, M('#e8d6a8'), 0, 0.53, 0));
      [-0.3, 0.25].forEach((x) => { for (let k = 0; k < 4; k++) g.add(box3(0.02, 0.12 + k * 0.04, 0.02, M('#2e9e4f'), x + k * 0.03, 0.6 + k * 0.02, -0.08)); });
      const fish = [];
      ['#ff8a00', '#2bd8ff', '#ffd23f', '#ff3b5c'].forEach((c, i) => { const f = sphere(0.03, M(c), 0, 0, 0, 8); f.scale.set(1.6, 1, 0.6); g.add(f); fish.push(f); });
      g.add(light('#7fdcff', 0.8, 2, 0, 0.9, 0.4));
      g.userData.tick = (dt, t) => fish.forEach((f, i) => { const x = Math.sin(t * (0.5 + i * 0.17) + i * 2) * 0.38; f.position.set(x, 0.66 + i * 0.07 + Math.sin(t + i) * 0.02, Math.cos(t * 0.6 + i) * 0.1); f.rotation.y = Math.cos(t * (0.5 + i * 0.17) + i * 2) > 0 ? 0 : Math.PI; });
      return g;
    },
    dartboard() {
      const g = new THREE.Group();
      const t = picture(128, 128, (p, w) => { const c = w / 2; const cols = ['#111', '#e8e0c8']; for (let k = 0; k < 20; k++) { p.fillStyle = cols[k % 2]; p.beginPath(); p.moveTo(c, c); p.arc(c, c, c, (k / 20) * Math.PI * 2, ((k + 1) / 20) * Math.PI * 2); p.fill(); } [[0.62, '#c62828'], [0.55, 'rgba(0,0,0,0)'], [0.15, '#2e7d32'], [0.07, '#c62828']].forEach(([r, col]) => { if (col.startsWith('rgba')) return; p.strokeStyle = col; p.lineWidth = 6; p.beginPath(); p.arc(c, c, c * r, 0, Math.PI * 2); p.stroke(); }); p.fillStyle = '#c62828'; p.beginPath(); p.arc(c, c, 5, 0, Math.PI * 2); p.fill(); });
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.25, 40), M('#ffffff', { map: t, roughness: 0.8 }));
      face.position.z = 0.03;
      const rim = cyl3(0.28, 0.28, 0.05, dark, 0, 0, 0, 32); rim.rotation.x = Math.PI / 2;
      g.add(rim, face);
      [[0.05, 0.08], [-0.09, -0.03], [0.12, -0.1]].forEach(([x, y]) => { const d = cyl3(0.006, 0.006, 0.12, M('#ffd23f'), x, y, 0.09, 6); d.rotation.x = Math.PI / 2; g.add(d); });
      return g;
    },
    lanterns() {
      const g = new THREE.Group();
      ['#ff6b5b', '#ffd23f', '#ff9ad5', '#7de3ff', '#9dff8a'].forEach((c, i) => {
        const x = -1.2 + i * 0.6, drop = 0.25 + (i % 2) * 0.15;
        g.add(cyl3(0.004, 0.004, drop, dark, x, -drop / 2, 0, 4));
        const l = sphere(0.13, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, roughness: 0.9 }), x, -drop - 0.12, 0);
        l.scale.y = 1.15;
        g.add(l);
      });
      g.add(light('#ffd9a0', 1.4, 3.5, 0, -0.5, 0));
      return g;
    },

    /* ─── epic ─── */
    pinball() {
      const g = new THREE.Group();
      [[-0.22, -0.35], [0.22, -0.35], [-0.22, 0.35], [0.22, 0.35]].forEach(([x, z]) => g.add(box3(0.05, 0.75, 0.05, dark, x, 0.375, z)));
      const tbl = new THREE.Group();
      tbl.add(box3(0.55, 0.14, 0.95, M('#1a237e'), 0, 0, 0));
      const playfield = new THREE.Mesh(new THREE.PlaneGeometry(0.47, 0.87), new THREE.MeshBasicMaterial({ map: picture(64, 128, (p, w, h) => { const gr = p.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff3ea5'); gr.addColorStop(1, '#2bd8ff'); p.fillStyle = gr; p.fillRect(0, 0, w, h); p.fillStyle = '#ffd23f'; [[20, 30], [44, 40], [32, 62]].forEach(([x, y]) => { p.beginPath(); p.arc(x, y, 7, 0, 7); p.fill(); }); }), toneMapped: false }));
      playfield.rotation.x = -Math.PI / 2; playfield.position.y = 0.075;
      tbl.add(playfield);
      tbl.position.set(0, 0.82, 0); tbl.rotation.x = 0.1;
      g.add(tbl);
      const head = box3(0.55, 0.5, 0.08, M('#1a237e'), 0, 1.15, -0.45);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.47, 0.4), glowMat('#ff8a00'));
      screen.position.set(0, 1.15, -0.405);
      g.add(head, screen);
      const ball = sphere(0.025, steel, 0, 0.92, 0, 10);
      g.add(ball, light('#ff3ea5', 0.9, 2.2, 0, 1.2, 0.2));
      g.userData.tick = (dt, t) => { ball.position.set(Math.sin(t * 2.3) * 0.17, 0.92 - Math.cos(t * 1.7) * 0.04, Math.cos(t * 1.7) * 0.36); };
      return g;
    },
    vending() {
      const g = new THREE.Group();
      g.add(box3(0.75, 1.75, 0.6, M('#c62828', { roughness: 0.4 }), 0, 0.875, 0));
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 1.05), glowMat('#e8f4ff'));
      win.position.set(-0.08, 1.05, 0.301);
      g.add(win);
      const cols = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa'];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.add(cyl3(0.035, 0.035, 0.13, M(cols[(r + c) % cols.length]), -0.27 + c * 0.125, 0.67 + r * 0.25, 0.27, 10));
      g.add(box3(0.14, 0.5, 0.02, dark, 0.27, 1.1, 0.31), box3(0.4, 0.12, 0.04, dark, -0.08, 0.3, 0.31));
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.14), new THREE.MeshBasicMaterial({ map: picture(256, 52, (p, w, h) => { p.fillStyle = '#ffd23f'; p.fillRect(0, 0, w, h); p.fillStyle = '#c62828'; p.font = '900 34px system-ui'; p.textAlign = 'center'; p.fillText('ICE COLD', w / 2, 38); }), toneMapped: false }));
      sign.position.set(0, 1.66, 0.302);
      g.add(sign, light('#cfe8ff', 1.2, 2.4, 0, 1.0, 0.7));
      return g;
    },
    discoball() {
      const g = new THREE.Group();
      g.add(cyl3(0.006, 0.006, 0.4, dark, 0, -0.2, 0, 4));
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.12, flatShading: true }));
      ball.position.y = -0.62;
      g.add(ball);
      const spots = ['#ff3ea5', '#2bd8ff', '#ffd23f'].map((c, i) => { const l = light(c, 1.6, 4, 0, -0.62, 0); g.add(l); return [l, i]; });
      g.userData.tick = (dt, t) => { ball.rotation.y += dt * 0.8; spots.forEach(([l, i]) => { const a = t * 1.2 + i * 2.1; l.position.set(Math.cos(a) * 0.6, -0.9, Math.sin(a) * 0.6); }); };
      return g;
    },
    ledwall() {
      const g = new THREE.Group();
      const tiles = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
        const m = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
        const tile = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.02), m);
        tile.position.set(-0.4 + c * 0.16, -0.16 + r * 0.16, 0.01);
        g.add(tile); tiles.push([m, r, c]);
      }
      const col = new THREE.Color();
      g.userData.tick = (dt, t) => tiles.forEach(([m, r, c]) => { col.setHSL(((t * 0.15 + c * 0.08 + r * 0.05) % 1 + 1) % 1, 0.9, 0.55); m.color.copy(col); });
      g.add(light('#c77dff', 1.2, 2.5, 0, 0, 0.4));
      return g;
    },
    telescope() {
      const g = new THREE.Group();
      [0, 2.1, 4.2].forEach((a) => { const leg = box3(0.025, 0.9, 0.025, wood, Math.sin(a) * 0.18, 0.43, Math.cos(a) * 0.18); leg.rotation.set(Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2); g.add(leg); });
      const tube = cyl3(0.06, 0.08, 0.8, M('#1d3c6e', { metalness: 0.4, roughness: 0.4 }), 0, 0, 0, 16);
      tube.rotation.x = -1.1;
      const head = new THREE.Group();
      head.add(tube, cyl3(0.085, 0.085, 0.06, gold, 0, 0, 0, 16));
      head.position.set(0, 0.95, 0);
      g.add(head);
      g.userData.tick = (dt, t) => { head.rotation.y = Math.sin(t * 0.2) * 0.4; };
      return g;
    },
    robot() {
      const g = new THREE.Group();
      const body = M('#cfd8e3', { metalness: 0.6, roughness: 0.3 }), blue = glowMat('#2bd8ff');
      g.add(cyl3(0.22, 0.26, 0.12, dark, 0, 0.06, 0, 18));
      g.add(box3(0.42, 0.5, 0.32, body, 0, 0.42, 0), box3(0.24, 0.14, 0.01, blue, 0, 0.48, 0.165));
      const head = new THREE.Group();
      head.add(box3(0.32, 0.24, 0.26, body, 0, 0, 0), box3(0.26, 0.1, 0.01, dark, 0, 0.01, 0.131));
      const eyes = [sphere(0.025, blue, -0.06, 0.01, 0.14, 8), sphere(0.025, blue, 0.06, 0.01, 0.14, 8)];
      head.add(...eyes, cyl3(0.008, 0.008, 0.12, steel, 0, 0.18, 0, 6), sphere(0.03, M('#ff3b5c'), 0, 0.25, 0, 8));
      head.position.y = 0.82;
      g.add(head);
      [-1, 1].forEach((s) => g.add(box3(0.07, 0.36, 0.07, body, s * 0.26, 0.42, 0)));
      g.userData.tick = (dt, t) => { head.rotation.y = Math.sin(t * 0.7) * 0.5; const blink = (t % 4) < 0.12 ? 0.2 : 1; eyes.forEach(e => { e.scale.y = blink; }); };
      return g;
    },

    /* ─── legendary ─── */
    throne() {
      const g = new THREE.Group();
      const velvet = M('#6a1b9a', { roughness: 0.85 });
      g.add(box3(0.8, 0.45, 0.7, gold, 0, 0.225, 0), box3(0.68, 0.1, 0.6, velvet, 0, 0.5, 0.02));
      g.add(box3(0.8, 1.3, 0.12, gold, 0, 1.0, -0.3), box3(0.62, 1.05, 0.02, velvet, 0, 1.0, -0.235));
      [-1, 1].forEach((s) => { g.add(box3(0.1, 0.32, 0.6, gold, s * 0.38, 0.62, 0.02)); g.add(sphere(0.07, gold, s * 0.38, 0.82, 0.3)); });
      [-0.25, 0, 0.25].forEach((x, i) => { const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, i === 1 ? 0.3 : 0.2, 8), gold); spike.position.set(x, i === 1 ? 1.8 : 1.75, -0.3); g.add(spike); });
      g.add(sphere(0.05, glowMat('#ff3b5c'), 0, 1.5, -0.23, 10), light('#ffd27a', 1.4, 3, 0, 1.3, 0.6));
      return g;
    },
    goldtrophy() {
      const g = new THREE.Group();
      g.add(box3(0.5, 0.3, 0.5, M('#2a1a10', { roughness: 0.4 }), 0, 0.15, 0), box3(0.38, 0.12, 0.38, gold, 0, 0.36, 0));
      g.add(cyl3(0.06, 0.1, 0.4, gold, 0, 0.62, 0, 16));
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.12, 0.5, 24, 1, true), gold);
      cup.position.y = 1.07; shadowy(cup);
      g.add(cup);
      [-1, 1].forEach((s) => { const h = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 20, Math.PI), gold); h.position.set(s * 0.3, 1.1, 0); h.rotation.z = s * Math.PI / 2; g.add(h); });
      const star = sphere(0.06, glowMat('#fff3b0'), 0, 1.42, 0, 10);
      g.add(star, light('#ffd23f', 2, 3, 0, 1.3, 0.4));
      g.userData.tick = (dt, t) => { star.position.y = 1.42 + Math.sin(t * 2) * 0.04; star.scale.setScalar(1 + Math.sin(t * 3) * 0.2); };
      return g;
    },
    chandelier() {
      const g = new THREE.Group();
      g.add(cyl3(0.008, 0.008, 0.35, gold, 0, -0.175, 0, 6));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 8, 40), gold);
      ring.rotation.x = Math.PI / 2; ring.position.y = -0.4;
      g.add(ring, sphere(0.08, gold, 0, -0.4, 0));
      const crystal = M('#e8f6ff', { transparent: true, opacity: 0.75, metalness: 0.2, roughness: 0.05 });
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), crystal);
        c.position.set(Math.cos(a) * 0.4, -0.5 - (k % 2) * 0.06, Math.sin(a) * 0.4); c.scale.y = 1.8;
        g.add(c, sphere(0.03, glowMat('#fff1c2'), Math.cos(a) * 0.4, -0.36, Math.sin(a) * 0.4, 8));
      }
      g.add(light('#fff1c2', 2.2, 5, 0, -0.5, 0));
      g.userData.tick = (dt) => { g.rotation.y += dt * 0.1; };
      return g;
    },
    dragon() {
      const g = new THREE.Group();
      const jade = M('#1f8a5b', { metalness: 0.3, roughness: 0.35 });
      g.add(box3(0.6, 0.2, 0.5, M('#2a1a10'), 0, 0.1, 0));
      const pts = [];
      for (let k = 0; k <= 24; k++) { const t = k / 24; pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 3) * 0.22, 0.25 + t * 1.0, Math.cos(t * Math.PI * 3) * 0.12)); }
      // the body: a coil of jade beads, thinner towards the tail
      pts.forEach((p, k) => g.add(sphere(0.045 + (k / pts.length) * 0.03, jade, p.x, p.y, p.z, 10)));
      const head = new THREE.Group();
      head.add(sphere(0.11, jade), box3(0.1, 0.06, 0.14, jade, 0, -0.02, 0.1));
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.12, 6), gold);
      [-1, 1].forEach((s) => { const h2 = horn.clone(); h2.position.set(s * 0.05, 0.1, -0.03); h2.rotation.x = -0.4; head.add(h2); });
      const eyes = [-1, 1].map(s => sphere(0.018, glowMat('#ff3b5c'), s * 0.05, 0.03, 0.09, 8));
      head.add(...eyes);
      const end = pts[pts.length - 1];
      head.position.copy(end).add(new THREE.Vector3(0, 0.06, 0.05));
      g.add(head, sphere(0.06, glowMat('#ffd23f'), 0, 0.35, 0.25, 10), light('#2bff8a', 1.2, 2.5, 0, 0.8, 0.4));
      g.userData.tick = (dt, t) => { head.rotation.y = Math.sin(t * 0.8) * 0.35; eyes.forEach(e => e.scale.setScalar(1 + Math.sin(t * 4) * 0.3)); };
      return g;
    },
    neonlogo() {
      const g = new THREE.Group();
      const t = picture(512, 128, (p, w, h) => {
        p.clearRect(0, 0, w, h);
        p.font = '900 92px system-ui, sans-serif'; p.textAlign = 'center'; p.textBaseline = 'middle';
        p.shadowColor = '#ff3ea5'; p.shadowBlur = 24; p.fillStyle = '#ffd1ef'; p.fillText('CHITPLAY', w / 2, h / 2 + 4);
      });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.32), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
      sign.position.z = 0.02;
      g.add(box3(1.36, 0.38, 0.015, M('#14101e'), 0, 0, 0), sign, light('#ff3ea5', 2, 3, 0, 0, 0.5));
      g.userData.tick = (dt, time) => { sign.material.opacity = (time % 7) < 0.12 ? 0.4 : 1; };
      return g;
    },
  };
}
