/** The 3D picture of spin-duel on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { TAU, basic, box, lights, std } from './common.js?v=20261116-1213';
import { H as HOOP_H, SEAT_COLORS, TICK, W as HOOP_W } from '../lib.js?v=20261116-1213';
import { selectedGameCosmetic } from '../../game-cosmetics.js?v=20261116-1213';

/* ─── Spin Duel: two custom tops battling in a small schoolyard arena ─── */
function spinDuelView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#17253c');
  const camera = new THREE.PerspectiveCamera(42, 1.6, 0.1, 50);
  camera.position.set(0, 5.2, 6.4); camera.lookAt(0, 0, -0.15);
  lights(scene, { sky: '#f5f4ff', ground: '#303044', sun: 1.8 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), std('#61462e', { roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.3; scene.add(floor);
  const floorLines = [];
  for (let i = 0; i < 9; i++) {
    const plank = box(10, 0.015, 0.012, basic(i % 2 ? '#7a5a3c' : '#503923'));
    plank.position.set(0, -0.285, -2.8 + i * 0.7); scene.add(plank); floorLines.push(plank);
  }
  const stage = new THREE.Group(); stage.position.z = -0.2; scene.add(stage);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.22, 0.22, 64), std('#34465e', { roughness: 0.35, metalness: 0.28 }));
  bowl.position.y = -0.12;
  const arena = new THREE.Mesh(new THREE.CircleGeometry(1.44, 64), std('#9aa8b8', { roughness: 0.68, metalness: 0.08 }));
  arena.rotation.x = -Math.PI / 2; arena.position.y = 0.005;
  const arenaRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.065, 10, 64), std('#d5deeb', { roughness: 0.32, metalness: 0.4 }));
  arenaRing.rotation.x = Math.PI / 2; arenaRing.position.y = 0.045;
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.012, 6, 64), basic('#ffffff', { transparent: true, opacity: 0.24 }));
  innerRing.rotation.x = Math.PI / 2; innerRing.position.y = 0.016;
  stage.add(bowl, arena, arenaRing, innerRing);
  const makeTop = (seat) => {
    const g = new THREE.Group();
    const shell = std(SEAT_COLORS[seat], { roughness: 0.3, metalness: 0.48, emissive: SEAT_COLORS[seat], emissiveIntensity: 0.12 });
    const edge = std('#e4edf7', { roughness: 0.24, metalness: 0.72 });
    const lower = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 12), shell); lower.position.y = 0.11;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 24), edge); rim.rotation.x = Math.PI / 2; rim.position.y = 0.19;
    const upper = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 10), shell); upper.position.y = 0.31; upper.rotation.x = Math.PI;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.09, 0.18, 10), edge); hub.position.y = 0.38;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 10), std('#f6cf73', { roughness: 0.28, metalness: 0.62 })); tip.position.y = 0.49;
    const fins = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const fin = box(0.06, 0.14, 0.2, shell);
      fin.position.set(0.13, 0.2, 0); fin.rotation.y = i * TAU / 3; fins.add(fin);
    }
    const facets = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const facet = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.27, 3), shell);
      facet.position.y = 0.22; facet.rotation.y = i * TAU / 6; facets.add(facet);
    }
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 6, 32), basic(SEAT_COLORS[seat], { transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.rotation.x = Math.PI / 2; glow.position.y = 0.06;
    g.add(lower, rim, upper, hub, tip, fins, facets, glow);
    g.userData = { shell, edge, fins, facets, glow, seat };
    scene.add(g);
    return g;
  };
  const tops = [makeTop(0), makeTop(1)];
  let style = '', arenaStyle = '';
  const topStyle = () => selectedGameCosmetic('spin-duel', 'top')?.style || 'classic';
  const selectedArena = () => selectedGameCosmetic('spin-duel', 'arena')?.style || 'classic';
  return {
    scene, camera,
    update(s, dt, alpha = 0) {
      const nextTopStyle = topStyle(), nextArenaStyle = selectedArena();
      if (nextTopStyle !== style) {
        style = nextTopStyle;
        tops.forEach((top) => {
          const u = top.userData;
          u.fins.visible = style === 'comet';
          u.facets.visible = style === 'prism';
          u.shell.roughness = style === 'prism' ? 0.18 : 0.3;
          u.shell.metalness = style === 'prism' ? 0.82 : 0.48;
          u.glow.material.opacity = style === 'comet' ? 0.65 : style === 'prism' ? 0.48 : 0.28;
        });
      }
      if (nextArenaStyle !== arenaStyle) {
        arenaStyle = nextArenaStyle;
        const colors = arenaStyle === 'cosmic'
          ? ['#181b43', '#5b58c9', '#a69cff', '#42eaff']
          : arenaStyle === 'sunset'
            ? ['#713c35', '#c86c40', '#ffd09a', '#ffe16a']
            : ['#34465e', '#9aa8b8', '#d5deeb', '#ffffff'];
        bowl.material.color.set(colors[0]); arena.material.color.set(colors[1]);
        arenaRing.material.color.set(colors[2]); innerRing.material.color.set(colors[3]);
        scene.background.set(arenaStyle === 'cosmic' ? '#171633' : arenaStyle === 'sunset' ? '#3d201a' : '#17253c');
      }
      s.tops.forEach((p, i) => {
        const m = tops[i];
        const tx = (p.x - HOOP_W / 2) / 100, tz = (p.y - HOOP_H / 2) / 100;
        m.position.set(tx, 0.035 + (p.alive ? Math.abs(Math.sin(s.t * 0.3 + i)) * 0.025 : 0), tz);
        m.rotation.y = p.angle + (p.alive ? p.spinDir * p.spin * alpha * TICK * 12 : 0);
        m.rotation.z = p.alive ? Math.sin(s.t * 0.12 + i) * Math.min(0.16, Math.hypot(p.vx, p.vy) / 2800) : 0;
        m.visible = p.alive;
        m.userData.glow.material.opacity = (style === 'comet' ? 0.5 : 0.25) + Math.sin(s.t * 0.2 + i) * 0.08;
      });
      arenaRing.rotation.z = Math.sin(s.t * 0.008) * 0.012;
    },
  };
}

export default spinDuelView;
