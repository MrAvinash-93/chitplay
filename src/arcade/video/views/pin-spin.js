/** The 3D picture of pin-spin on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, canvasTex, ease, pool, std } from './common.js?v=20261116-1239';
import { SEAT_COLORS, TICK } from '../lib.js?v=20261116-1239';
import { FLY as PIN_FLY, GAP as PIN_GAP, LEVEL_TICKS as PIN_LEVEL_TICKS, isBigBoard as isPinBig, spinAt as pinSpinAt } from '../pin-spin.js?v=20261116-1239';

/* ─── Pin Spin: round corkboards spinning on a classroom wall ─── */
// the classroom's light at each level: morning green board, afternoon, evening, and the big-board spotlight
const PIN_MOODS = [
  { bg: '#20352a', light: 1.4, spot: 0.18 },
  { bg: '#1f3340', light: 1.3, spot: 0.22 },
  { bg: '#2c2235', light: 1.15, spot: 0.28 },
  { bg: '#161616', light: 0.95, spot: 0.4 },
];
function pinView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PIN_MOODS[0].bg);
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, -0.2, 7.2);
  camera.lookAt(0, -0.2, 0);
  const hemi = new THREE.HemisphereLight('#fff6e6', '#1d2b22', 1.4);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(2, 3, 6);
  scene.add(key);
  // the classroom wall: a framed chalkboard with chalk sums, a ledge with chalk, a window's light
  const wall = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5a3d24'; g.fillRect(40, 30, w - 80, h - 80);
    g.fillStyle = '#ffffff'; g.fillRect(56, 46, w - 112, h - 112);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(255,255,255,.08)'; g.font = '26px "Comic Sans MS", system-ui, sans-serif';
    ['2 + 3 = 5', 'A B C', '7 × 8 = 56', '★', '3.14', 'x + y', '🙂', 'ChitPlay'].forEach((t, k) => g.fillText(t, 100 + (k % 4) * 220, 110 + Math.floor(k / 4) * 230));
    g.fillStyle = '#6b4a2b'; g.fillRect(40, h - 50, w - 80, 16);
    ['#ffffff', '#ffd23f', '#ff9aa8', '#9fd3ff'].forEach((c, k) => { g.fillStyle = c; g.fillRect(120 + k * 46, h - 58, 30, 8); });
  });
  const boardMat = new THREE.MeshBasicMaterial({ map: wall, color: PIN_MOODS[0].bg });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), boardMat);
  back.position.z = -2;
  scene.add(back);
  // window light falling across the wall, and a spotlight behind the boards
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 9), basic('#fff6d0', { transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }));
  shaft.position.set(-4.5, 0, -1.9); shaft.rotation.z = 0.35;
  const spotMat = basic('#fff3c4', { transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false });
  const spot = new THREE.Mesh(new THREE.CircleGeometry(2.1, 48), spotMat);
  spot.position.set(0, 0.35, -1.95);
  scene.add(shaft, spot);
  const cork = (big) => canvasTex(256, 256, (g, w) => {
    const r = w / 2;
    g.fillStyle = big ? '#c0412b' : '#c89b62'; g.beginPath(); g.arc(r, r, r, 0, TAU); g.fill();
    for (let k = 0; k < 900; k++) { const a = k * 2.399, d = Math.sqrt(k / 900) * (r - 6); g.fillStyle = k % 3 ? 'rgba(110,70,30,.35)' : 'rgba(255,235,200,.25)'; g.fillRect(r + Math.cos(a) * d, r + Math.sin(a) * d, 2.4, 2.4); }
    g.strokeStyle = big ? '#ffd23f' : '#ff9a3d'; g.lineWidth = 10; g.beginPath(); g.arc(r, r, r * 0.62, 0, TAU); g.stroke();
    g.fillStyle = '#fff8e6'; g.save(); g.translate(r, r); g.rotate(-0.12); g.fillRect(-34, -26, 68, 52); g.fillStyle = '#c0412b'; g.font = '800 22px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CP', 0, 2); g.restore();
  });
  const faces = { plain: cork(false), big: cork(true) };
  const rim = std('#7a5530', { roughness: 0.85 });
  const steel = std('#d7dde4', { metalness: 0.85, roughness: 0.25 });
  const heads = SEAT_COLORS.map(c => std(c, { roughness: 0.3 }));
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
  const TICKS = 48;
  const make = (i) => {
    const grp = new THREE.Group();
    const faceMat = std('#ffffff', { map: faces.plain, roughness: 0.95, emissive: '#000000' });
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
    // the time left for this level: a ring of dots round the board, green to red
    const clock = Array.from({ length: TICKS }, (_, k) => { const a = Math.PI / 2 - (k / TICKS) * TAU; const d = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), basic('#7dff9a')); d.position.set(Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0); grp.add(d); return d; });
    // where the next pin will land: green if it is clear, red if a pin is in the way
    const landMat = basic('#5dff8a', { transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const land = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.09, 6, 20, PIN_GAP * 2), landMat);
    land.rotation.z = -Math.PI / 2 - PIN_GAP;
    land.position.z = 0.12;
    grp.add(land);
    scene.add(grp);
    return { grp, spin, faceMat, flying, waiting, ring, clock, land, landMat, pins: [], stars: [], level: 0, shake: 0, seat: i, count: 0, starsN: 0, alive: true, flash: 0, fall: null, rot: 0 };
  };
  const bits = pool(scene, () => new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), basic('#ffffff', { side: THREE.DoubleSide, transparent: true })));
  const parts = [];
  const burst = (x, y, n, colors, speed = 2) => { for (let q = 0; q < n; q++) { const a = Math.random() * TAU, v = speed * (0.4 + Math.random()); parts.push({ x, y, z: 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.4, c: colors[q % colors.length], r: Math.random() * 6 }); } };
  let shake = 0;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const xs = slots(s.n);
      const scale = s.n > 2 ? 0.62 : s.n === 2 ? 0.85 : 1;
      const tNow = s.t + alpha;
      const lv = s.players[0]?.level || 1;
      const mood = PIN_MOODS[isPinBig(lv) ? 3 : Math.min(2, Math.floor((lv - 1) / 2) % 3)];
      const k = 1 - Math.exp(-dt * 1.5);
      scene.background.lerp(want.set(mood.bg), k);
      boardMat.color.lerp(want.set(mood.bg).offsetHSL(0, 0, 0.12), k);
      hemi.intensity = ease(hemi.intensity, mood.light, k);
      spotMat.opacity = ease(spotMat.opacity, mood.spot * 0.35, k);
      s.players.forEach((p, i) => {
        if (!targets[i]) targets[i] = make(i);
        const T = targets[i];
        T.grp.position.set(xs[i], 0.35, 0);
        T.grp.scale.setScalar(scale);
        const big = isPinBig(p.level);
        // a new level: a fresh board pops in with confetti; every fifth one is the big red board
        if (T.level !== p.level) {
          if (T.level) burst(xs[i], 0.35, 30, ['#ff5a4f', '#ffd23f', '#39b6ff', '#5be37d', '#ffffff'], 3);
          T.level = p.level; T.shake = 0.35; T.faceMat.map = big ? faces.big : faces.plain; T.faceMat.needsUpdate = true;
        }
        if (T.shake > 0) { T.shake -= dt; T.spin.scale.setScalar((big ? 1.08 : 1) + Math.sin(T.shake * 40) * 0.04); } else T.spin.scale.setScalar(big ? 1.08 : 1);
        // smooth: the board keeps turning between ticks
        const rot = p.alive ? p.rot + pinSpinAt(p.level, p.lt) * TICK * alpha : p.rot;
        T.spin.rotation.z = rot;
        // a pin went in: the board jolts and cork dust flies; a star: a gold burst
        if (p.stuck.length > T.count && T.count) { T.shake = Math.max(T.shake, 0.12); burst(xs[i], 0.35 - 1.24 * scale, 8, ['#d9b48a', '#a87a4a'], 1.4); }
        if (p.stars.length < T.starsN) burst(xs[i], 0.35 - 0.9 * scale, 20, ['#ffd23f', '#fff3a0'], 2.4);
        T.count = p.stuck.length; T.starsN = p.stars.length;
        // knocked another pin: it bounces off, the board flashes red, the camera jolts
        if (T.alive && !p.alive && p.hitAt != null) { T.fall = { y: -1.2, vy: 2.4, r: 0 }; T.flash = 0.6; if (i === 0) shake = 0.35; }
        T.alive = p.alive;
        T.flash = Math.max(0, T.flash - dt);
        T.faceMat.emissive.set(T.flash > 0 ? '#7a0000' : '#000000');
        while (T.pins.length < p.stuck.length) { const kk = pin(i); T.spin.add(kk); T.pins.push(kk); }
        T.pins.forEach((kk, n) => {
          const a = p.stuck[n];
          kk.visible = a != null;
          if (a == null) return;
          kk.position.set(Math.cos(a) * 1.24, Math.sin(a) * 1.24, 0.05);
          kk.rotation.z = a + Math.PI / 2;
        });
        while (T.stars.length < p.stars.length) { const st = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), starMat); T.spin.add(st); T.stars.push(st); }
        T.stars.forEach((st, n) => { const a = p.stars[n]; st.visible = a != null; if (a != null) { st.position.set(Math.cos(a) * 0.8, Math.sin(a) * 0.8, 0.125); st.rotation.z = a + Math.sin(tNow * 0.1 + n) * 0.15; st.scale.setScalar(1 + Math.sin(tNow * 0.15 + n) * 0.08); } });
        // the pin in the air (smooth), the next one waiting, or the one bouncing off
        const flyLeft = Math.max(0, p.fly - (p.fly > 0 ? alpha : 0));
        T.flying.visible = (p.alive && p.fly > 0) || !!T.fall;
        if (T.fall) {
          T.fall.vy -= 9 * dt; T.fall.y += T.fall.vy * dt; T.fall.r += dt * 9;
          T.flying.position.set(0.4 * (1 - T.fall.vy / 2.4), T.fall.y, 0.3); T.flying.rotation.z = T.fall.r;
          if (T.fall.y < -4) T.fall = null;
        } else { T.flying.position.set(0, -1.3 - (flyLeft / PIN_FLY) * 1.6, 0.05); T.flying.rotation.z = 0; }
        T.waiting.visible = p.alive && p.fly === 0 && p.pins > 0;
        T.waiting.position.set(0, -2.9 + Math.sin(tNow * 0.12) * 0.03, 0.05);
        T.ring.visible = s.n > 1;
        T.grp.rotation.z = p.alive ? 0 : Math.sin(tNow * 0.5) * 0.04;
        // the landing spot: green when clear, red when the next pin would hit one
        const ahead = -Math.PI / 2 - (p.rot + pinSpinAt(p.level, p.lt) * TICK * PIN_FLY);
        const clear = p.stuck.every((x) => { let d = ((x - ahead) % TAU + TAU) % TAU; if (d > Math.PI) d -= TAU; return Math.abs(d) > PIN_GAP; });
        T.land.visible = p.alive && p.pins > 0;
        T.landMat.color.set(clear ? '#5dff8a' : '#ff3b3b');
        T.landMat.opacity = clear ? 0.7 : 0.75 + Math.sin(tNow * 0.8) * 0.2;
        // the level's clock
        const left = Math.max(0, 1 - p.lt / PIN_LEVEL_TICKS), lit = Math.ceil(left * TICKS);
        T.clock.forEach((d, n) => { d.visible = p.alive && n < lit; d.material.color.set(left > 0.3 ? '#7dff9a' : left > 0.15 ? '#ffd23f' : '#ff5a4f'); });
      });
      // flying bits
      bits.begin();
      for (let q = parts.length - 1; q >= 0; q--) {
        const b = parts[q];
        b.life -= dt;
        if (b.life <= 0) { parts.splice(q, 1); continue; }
        b.vy -= 4 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r += dt * 8;
        const m = bits.next(); m.position.set(b.x, b.y, b.z); m.rotation.set(b.r, b.r * 0.6, 0); m.material.color.set(b.c); m.material.opacity = Math.min(1, b.life * 2);
      }
      bits.end();
      shake = Math.max(0, shake - dt);
      camera.position.set(shake ? Math.sin(tNow * 2.7) * shake * 0.3 : 0, -0.2, 7.2);
      camera.lookAt(0, -0.2, 0);
    },
  };
}

export default pinView;
