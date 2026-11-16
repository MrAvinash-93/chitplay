/** The 3D picture of pen-fight on the TV (src/arcade/video/views.js picks it). */
import * as THREE from '../../../vendor/three.chitplay.min.js';
import { basic, box, canvasTex, lights, std } from './common.js?v=20261116-1359';
import { H as HOOP_H, SEAT_COLORS, W as HOOP_W } from '../lib.js?v=20261116-1359';
import { selectedGameCosmetic } from '../../game-cosmetics.js?v=20261116-1359';

/* ─── Pen Fight: animated pens sliding across a polished classroom desk ─── */
function penFightView() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#273444');
  const camera = new THREE.PerspectiveCamera(40, 1.6, 0.1, 50);
  camera.position.set(0, 5.3, 6.4); camera.lookAt(0, 0, 0.15);
  lights(scene, { sky: '#fff7ea', ground: '#45301e', sun: 1.7 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), std('#3b3028', { roughness: 0.94 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.35; scene.add(floor);
  const texture = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#9b7049'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 42) {
      g.fillStyle = y % 84 ? 'rgba(255,225,182,.12)' : 'rgba(58,34,17,.12)';
      g.fillRect(0, y, w, 2);
      g.strokeStyle = 'rgba(68,39,19,.14)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, y + 9); g.bezierCurveTo(w * 0.3, y - 5, w * 0.7, y + 19, w, y + 4); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3; g.strokeRect(12, 12, w - 24, h - 24);
  });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.18, 3.55), std('#ffffff', { map: texture, roughness: 0.58 }));
  desk.position.set(0, -0.09, 0.15); scene.add(desk);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.08, 3.65), std('#674324', { roughness: 0.7 }));
  edge.position.set(0, -0.2, 0.15); scene.add(edge);
  const bounds = new THREE.Group(), boundMat = basic('#f2dcba'), halfX = 2.62, halfZ = 1.48;
  bounds.add(
    box(halfX * 2, 0.012, 0.025, boundMat),
    box(halfX * 2, 0.012, 0.025, boundMat),
    box(0.025, 0.012, halfZ * 2, boundMat),
    box(0.025, 0.012, halfZ * 2, boundMat),
  );
  bounds.children[0].position.z = -halfZ; bounds.children[1].position.z = halfZ;
  bounds.children[2].position.x = -halfX; bounds.children[3].position.x = halfX;
  bounds.position.set(0, 0.008, 0.16); scene.add(bounds);
  const centerLine = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 2.92), basic('#f5ead6', { transparent: true, opacity: 0.32 }));
  centerLine.position.set(0, 0.008, 0.16); scene.add(centerLine);
  const makePen = (seat) => {
    const group = new THREE.Group();
    const shaftMat = std(SEAT_COLORS[seat], { roughness: 0.3, metalness: 0.3 });
    const dark = std('#17212b', { roughness: 0.3, metalness: 0.45 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.052, 0.66, 12), shaftMat);
    shaft.rotation.z = Math.PI / 2;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 12), dark);
    grip.rotation.z = Math.PI / 2; grip.position.x = -0.15;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.15, 10), std('#d9dce1', { roughness: 0.22, metalness: 0.62 }));
    tip.rotation.z = -Math.PI / 2; tip.position.x = 0.4;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.04, 0.09, 12), dark);
    cap.rotation.z = Math.PI / 2; cap.position.x = -0.37;
    const clip = box(0.23, 0.018, 0.03, std('#e6c46e', { metalness: 0.72, roughness: 0.28 }));
    clip.position.set(-0.2, 0.055, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.012, 6, 20), basic(SEAT_COLORS[seat]));
    ring.position.y = 0.055;
    group.add(shaft, grip, tip, cap, clip, ring); scene.add(group);
    group.userData = { shaftMat, dark, seat };
    return group;
  };
  const pens = [makePen(0), makePen(1)];
  // whose flick it is: a glowing ring on the desk round that pen
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 6, 40), basic('#ffffff', { transparent: true, opacity: 0.7 }));
  halo.rotation.x = Math.PI / 2; scene.add(halo);
  const selectedPen = () => selectedGameCosmetic('pen-fight', 'pen')?.style || 'classic';
  const selectedDesk = () => selectedGameCosmetic('pen-fight', 'desk')?.style || 'classic';
  let penStyle = '', deskStyle = '';
  // the aim while dragging: dots along the slide and a ring where it stops (red: off the desk, gold: a hit)
  const aimDotGeo = new THREE.CircleGeometry(0.035, 12);
  const aimMat = basic('#ffffff', { transparent: true, opacity: 0.9, depthWrite: false });
  const aimDots = Array.from({ length: 48 }, () => { const d = new THREE.Mesh(aimDotGeo, aimMat); d.rotation.x = -Math.PI / 2; d.visible = false; scene.add(d); return d; });
  const aimRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 6, 32), aimMat);
  aimRing.rotation.x = Math.PI / 2; aimRing.visible = false; scene.add(aimRing);
  const at = (x, y) => [(x - HOOP_W / 2) / 100, (y - HOOP_H / 2) / 100];
  return {
    scene, camera,
    setAim(a) {
      aimDots.forEach(d => { d.visible = false; });
      aimRing.visible = !!a;
      if (!a) return;
      aimMat.color.set(a.end === 'off' ? '#ff4d4d' : a.end === 'hit' ? '#ffd23f' : '#ffffff');
      const step = Math.max(1, Math.ceil(a.path.length / aimDots.length));
      for (let k = 1, j = 0; k < a.path.length && j < aimDots.length; k += step, j++) {
        const [x, z] = at(a.path[k][0], a.path[k][1]);
        aimDots[j].position.set(x, 0.015, z);
        aimDots[j].visible = true;
      }
      const [x, z] = at(a.x1, a.y1);
      aimRing.position.set(x, 0.02, z);
      aimRing.scale.setScalar(a.end === 'hit' ? 1.3 : 1);
    },
    update(s) {
      const nextPen = selectedPen(), nextDesk = selectedDesk();
      if (nextPen !== penStyle) {
        penStyle = nextPen;
        pens.forEach((pen) => {
          pen.userData.shaftMat.metalness = penStyle === 'metal' ? 0.86 : penStyle === 'gel' ? 0.12 : 0.3;
          pen.userData.shaftMat.roughness = penStyle === 'metal' ? 0.18 : 0.3;
          pen.userData.dark.color.set(penStyle === 'gel' ? '#263c9b' : '#17212b');
        });
      }
      if (nextDesk !== deskStyle) {
        deskStyle = nextDesk;
        const color = deskStyle === 'green' ? '#416f54' : deskStyle === 'walnut' ? '#68452c' : '#9b7049';
        desk.material.color.set(color); edge.material.color.set(deskStyle === 'green' ? '#254634' : deskStyle === 'walnut' ? '#3d281b' : '#674324');
      }
      s.pens.forEach((p, i) => {
        const m = pens[i];
        // off the edge: it tips over and drops to the floor
        const fall = p.alive ? 0 : Math.min(1, (p.fell || 0) / 28);
        m.position.set((p.x - HOOP_W / 2) / 100, 0.055 - fall * fall * 0.9, (p.y - HOOP_H / 2) / 100);
        m.rotation.y = -p.angle;
        m.rotation.z = fall * 1.4;
        m.visible = p.alive || fall < 1;
      });
      const turnPen = s.phase === 'launch' ? s.pens[s.turn] : null;
      halo.visible = !!turnPen?.alive;
      if (halo.visible) {
        halo.position.set((turnPen.x - HOOP_W / 2) / 100, 0.012, (turnPen.y - HOOP_H / 2) / 100);
        halo.material.color.set(SEAT_COLORS[s.turn]);
        halo.material.opacity = 0.45 + 0.35 * Math.sin(s.t * 0.15);
        halo.scale.setScalar(1 + 0.06 * Math.sin(s.t * 0.15));
      }
    },
  };
}

export default penFightView;
