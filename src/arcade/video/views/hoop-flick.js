/** The 3D picture of hoop-flick on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, box, canvasTex, ease, lights, pool, std } from './common.js?v=20261116-1309';
import { H as HOOP_H, SEAT_COLORS, TICK, W as HOOP_W } from '../lib.js?v=20261116-1309';
import { G as HOOP_G, MAX as HOOP_MAX } from '../hoop-flick.js?v=20261116-1309';

/* ─── Hoop Flick: an indoor court under the lights, with a crowd ─── */
// the light in the hall at each level: day practice, evening match, windy night, the final under spotlights
const HOOP_MOODS = [
  { bg: '#1d2c44', wall: '#8fa6cc', hemi: 1.35, spot: 0.3 },
  { bg: '#2a1d3a', wall: '#9a86c0', hemi: 1.2, spot: 0.45 },
  { bg: '#0f2430', wall: '#6fa3b5', hemi: 1.05, spot: 0.6 },
  { bg: '#140c0a', wall: '#8a6556', hemi: 0.85, spot: 0.8 },
];
function hoopView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(HOOP_MOODS[0].bg);
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 60);
  camera.position.set(0, 0, 5.3);
  camera.lookAt(0, 0, 0);
  const hemi = new THREE.HemisphereLight('#fff6e8', '#33415c', 1.35);
  const sun = new THREE.DirectionalLight('#ffffff', 1.5);
  sun.position.set(2, 6, 4);
  scene.add(hemi, sun);
  const X = (x) => (x - HOOP_W / 2) / 100, Y = (y) => (HOOP_H / 2 - y) / 100;
  // the back wall: painted stripes, a scoreboard and the club's banners
  const wallMat = std('#ffffff', { map: canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#c8cfdb'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#dde3ec'; for (let k = 0; k < 8; k++) g.fillRect(0, k * 32, w, 14);
    g.fillStyle = 'rgba(255,210,63,.75)'; g.fillRect(0, h * 0.74, w, 5);
    // scoreboard
    g.fillStyle = '#111418'; g.fillRect(w / 2 - 40, 96, 80, 22);
    g.fillStyle = '#ffd23f'; g.font = '800 13px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('CHITPLAY', w / 2, 112);
    // banners
    [['#d32f2f', 60], ['#1e6fd0', w - 92]].forEach(([c, x]) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 34, 20); g.lineTo(x + 34, 86); g.lineTo(x + 17, 74); g.lineTo(x, 86); g.closePath(); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(x + 17, 46, 9, 0, TAU); g.fill(); });
  }), roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), wallMat);
  wall.position.z = -1.6;
  // the floor: polished boards with the court lines
  const floorTex = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = '#c48a50'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 32; k++) { g.fillStyle = k % 2 ? 'rgba(90,50,20,.12)' : 'rgba(255,230,190,.08)'; g.fillRect(k * 16, 0, 16, h); }
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    g.beginPath(); g.arc(w / 2, h, 34, Math.PI, TAU); g.stroke();
    g.strokeRect(6, 20, 90, h - 20); g.strokeRect(w - 96, 20, 90, h - 20);
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), std('#ffffff', { map: floorTex, roughness: 0.35, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, Y(HOOP_H) - 0.05, 0.6);
  scene.add(wall, floor);
  // bleachers with a crowd along the bottom of the wall
  const crowdCols = ['#d64545', '#2e86c1', '#f2b705', '#27ae60', '#8e44ad', '#e67e22', '#ecf0f1'];
  const crowd = [];
  for (let k = 0; k < 40; k++) {
    const row = k % 2, x = -6.6 + (k / 40) * 13.2 + row * 0.16;
    const p = new THREE.Group();
    const body = box(0.16, 0.22, 0.08, std(crowdCols[k % crowdCols.length], { roughness: 0.9 }));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), std(['#f1c27d', '#c68642', '#8d5524', '#e0ac69'][k % 4]));
    head.position.y = 0.18;
    p.add(body, head);
    p.position.set(x, Y(HOOP_H) + 0.12 + row * 0.24, -1.45 + row * -0.05);
    p.userData = { base: p.position.y, ph: k * 0.9 };
    scene.add(p);
    crowd.push(p);
  }
  // spotlights from the ceiling
  const spotMat = basic('#fff2c0', { transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const spots = [-2.6, 0, 2.6].map((x) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.4, 24, 1, true), spotMat); c.position.set(x, 1.6, -1.2); scene.add(c); return c; });
  const orange = std('#ff7a1a', { roughness: 0.35, metalness: 0.3 });
  const gold = basic('#ffd23f');
  const netMat = basic('#ffffff', { wireframe: true, transparent: true, opacity: 0.75 });
  const boardMat = std('#f4f7fb', { roughness: 0.3, transparent: true, opacity: 0.9 });
  const hoop = () => {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 28), orange);
    rim.rotation.x = Math.PI / 2 - 0.35;
    const net = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.19, 0.32, 12, 2, true), netMat);
    net.position.y = -0.17;
    const board = box(0.05, 0.5, 0.5, boardMat);
    board.position.set(0.36, 0.18, 0);
    const square = box(0.055, 0.16, 0.2, basic('#ff5a4f'));
    square.position.set(0.36, 0.12, 0);
    const pole = box(0.05, 0.3, 0.05, std('#99a3b3'));
    pole.position.set(0.42, -0.1, 0);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 6, 28), basic('#ffd23f', { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.rotation.x = Math.PI / 2 - 0.35;
    g.add(rim, net, board, square, pole, glow);
    g.userData = { rim, net, board, square, pole, glow, flash: 0, wobble: 0 };
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
  const dots = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), basic('#ffffff', { transparent: true, opacity: 0.85 })));
  const trail = pool(scene, () => new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), basic('#ffb15c', { transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })));
  const bits = pool(scene, () => new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), basic('#ffffff', { side: THREE.DoubleSide })));
  const confetti = [];
  const confCols = ['#ff5a4f', '#ffd23f', '#39b6ff', '#5be37d', '#ffffff', '#c38bff'];
  // wind: streaks drifting across the court, and a flag that shows which way
  const windMat = basic('#dff4ff', { transparent: true, opacity: 0, depthWrite: false });
  const windLines = Array.from({ length: 14 }, (_, i) => { const m = box(0.5, 0.012, 0.012, windMat); m.userData = { x: -6 + (i * 0.93) % 12, y: -1.2 + ((i * 37) % 100) / 100 * 2.6 }; scene.add(m); return m; });
  const flagPole = box(0.03, 0.7, 0.03, std('#cfd6e0'));
  flagPole.position.set(0, 1.55, -1.3);
  const flag = box(0.32, 0.18, 0.01, basic('#ff5a4f'));
  scene.add(flagPole, flag);
  const lanes = [];
  const seatsView = [];
  const make = (i) => {
    const home = hoop(), next = hoop();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), ballMat);
    const tag = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 6, 24), basic(SEAT_COLORS[i]));
    scene.add(home, next, ball, tag);
    return { home, next, ball, tag, score: 0, spin: 0, bx: null, by: null, hist: [], touched: false };
  };
  const place = (g, h, x) => {
    g.position.set(X(x), Y(h.y), 0);
    const out = h.side < 0 ? -1 : 1;
    g.userData.board.position.x = 0.36 * out; g.userData.pole.position.x = 0.42 * out; g.userData.square.position.x = 0.36 * out;
  };
  let jump = 0, camX = 0;
  const want = new THREE.Color();
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const tNow = s.t + alpha;
      // the hall's light follows the level of the player on this screen
      const lv = s.players[0]?.level || 1;
      const mood = HOOP_MOODS[Math.min(HOOP_MOODS.length, lv) - 1];
      const k = 1 - Math.exp(-dt * 1.5);
      scene.background.lerp(want.set(mood.bg), k);
      hemi.intensity = ease(hemi.intensity, mood.hemi, k);
      spotMat.opacity = ease(spotMat.opacity, 0.02 + mood.spot * 0.05, k);
      wallMat.color.lerp(want.set(mood.wall), k);
      spots.forEach((c, i) => { c.rotation.z = Math.sin(tNow * 0.01 + i) * 0.08; });
      dots.begin(); trail.begin();
      while (lanes.length < s.n - 1) { const l = box(0.02, 6, 0.02, basic('#ffffff', { transparent: true, opacity: 0.25 })); scene.add(l); lanes.push(l); }
      lanes.forEach((l, q) => { l.position.set(X((HOOP_W / s.n) * (q + 1)), 0, -0.5); });
      let wind = 0;
      s.players.forEach((p, i) => {
        if (!seatsView[i]) seatsView[i] = make(i);
        const V = seatsView[i];
        place(V.home, p.home, p.home.x);
        const hx = p.next.x + (p.next.move ? Math.sin(tNow / 60 + p.next.ph) * p.next.move : 0);
        place(V.next, p.next, hx);
        if (i === 0) wind = p.next.wind || 0;
        // the hoop to aim for glows softly
        const ng = V.next.userData.glow;
        ng.material.opacity = p.alive && !p.flying ? 0.25 + Math.sin(tNow * 0.15) * 0.12 : 0.08;
        // a basket: the hoop it went through flashes gold, the net swings, confetti, the crowd jumps
        if (p.score !== V.score) {
          const up = p.score > V.score;
          V.home.userData.flash = up ? 0.5 : 0;
          if (up) {
            const swish = p.combo > 0;
            for (let q = 0; q < (swish ? 30 : 14); q++) confetti.push({ x: X(p.home.x), y: Y(p.home.y), z: 0.1, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2.4, vz: (Math.random() - 0.5) * 1, r: Math.random() * 6, life: 1.4, c: confCols[q % confCols.length] });
            jump = swish ? 1 : 0.5;
          }
          V.score = p.score;
        }
        const f = V.home.userData;
        if (f.flash > 0) { f.flash -= dt; f.rim.material = gold; f.rim.scale.setScalar(1 + f.flash * 0.6); } else { f.rim.material = orange; f.rim.scale.setScalar(1); }
        f.net.scale.y = 1 + Math.max(0, f.flash) * 0.8;
        f.net.rotation.y = Math.sin(tNow * 0.4) * Math.max(0, f.flash) * 0.6;
        // the rim was touched: a little shake of the hoop
        if (p.flying && p.touched && !V.touched) V.next.userData.wobble = 0.35;
        V.touched = p.flying && p.touched;
        const nu = V.next.userData;
        if (nu.wobble > 0) { nu.wobble -= dt; V.next.rotation.z = Math.sin(tNow * 1.6) * nu.wobble * 0.15; } else V.next.rotation.z = 0;
        // the ball, smooth between ticks: where it was going, carried on by the part of a tick since
        const tx = p.flying ? p.ball.x + p.ball.vx * TICK * alpha : p.ball.x;
        const ty = p.flying ? p.ball.y + (p.ball.vy * TICK + 0.5 * HOOP_G * TICK * TICK) * alpha : p.ball.y;
        if (V.bx == null || Math.hypot(tx - V.bx, ty - V.by) > 80) { V.bx = tx; V.by = ty; }
        const kk = 1 - Math.exp(-dt * 30);
        V.bx += (tx - V.bx) * kk; V.by += (ty - V.by) * kk;
        V.ball.position.set(X(V.bx), Y(V.by), 0.05);
        V.ball.material = p.alive ? ballMat : deadMat;
        if (p.flying) V.spin += (p.ball.vx / 100) * dt * 2;
        V.ball.rotation.z = -V.spin;
        V.tag.visible = s.n > 1 && p.alive && !p.flying;
        V.tag.position.copy(V.ball.position);
        // a glowing trail while it flies
        if (p.flying) { V.hist.unshift([V.ball.position.x, V.ball.position.y]); if (V.hist.length > 10) V.hist.length = 10; } else V.hist.length = 0;
        V.hist.forEach(([x, y], q) => { const m = trail.next(); m.position.set(x, y, 0.02); m.scale.setScalar(Math.max(0.2, 1 - q * 0.09)); });
        // the aiming arc, while the ball waits: it allows for the wind, so what you see is where it goes
        if (p.alive && !p.flying) {
          const w = p.next.wind || 0;
          for (let q = 1; q < 13; q++) {
            const t = q * 0.055, d = dots.next();
            d.position.set(X(p.ball.x + p.aimX * HOOP_MAX * t + 0.5 * w * t * t), Y(p.ball.y - p.aimY * HOOP_MAX * t + 0.5 * HOOP_G * t * t), 0.05);
            d.scale.setScalar(1 - q * 0.055);
          }
        }
      });
      dots.end(); trail.end();
      // confetti
      bits.begin();
      for (let q = confetti.length - 1; q >= 0; q--) {
        const c = confetti[q];
        c.life -= dt;
        if (c.life <= 0) { confetti.splice(q, 1); continue; }
        c.vy -= 3.2 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.r += dt * 6;
        const m = bits.next(); m.position.set(c.x, c.y, c.z); m.rotation.set(c.r, c.r * 0.7, 0); m.material.color.set(c.c);
      }
      bits.end();
      // the crowd sways, and jumps for a basket
      jump = Math.max(0, jump - dt * 1.3);
      crowd.forEach((p) => { p.position.y = p.userData.base + Math.abs(Math.sin(tNow * 0.07 + p.userData.ph)) * 0.02 + jump * Math.abs(Math.sin(tNow * 0.45 + p.userData.ph)) * 0.14; });
      // wind: streaks and the flag
      const wv = wind / 240;
      windMat.opacity = Math.min(0.5, Math.abs(wv) * 0.7);
      windLines.forEach((m) => { const u = m.userData; u.x += wv * dt * 6; if (u.x > 7) u.x -= 14; if (u.x < -7) u.x += 14; m.visible = Math.abs(wv) > 0.05; m.position.set(u.x, u.y + Math.sin(tNow * 0.05 + u.x) * 0.05, 0.3); });
      flag.position.set(Math.sign(wv || 1) * 0.17, 1.82, -1.3);
      flag.scale.x = 0.3 + Math.min(1, Math.abs(wv) * 1.4);
      flag.rotation.y = Math.sin(tNow * 0.3) * (0.1 + Math.abs(wv) * 0.4);
      flag.visible = Math.abs(wv) > 0.05;
      flagPole.visible = flag.visible;
      // the camera drifts a little towards a ball in the air
      const me = seatsView[0], p0 = s.players[0];
      camX = ease(camX, me && p0?.flying ? X(me.bx) * 0.12 : 0, 1 - Math.exp(-dt * 2));
      camera.position.set(camX, 0, 5.3);
      camera.lookAt(camX * 0.6, 0, 0);
    },
  };
}

export default hoopView;
