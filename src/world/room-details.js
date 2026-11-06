/**
 * The lived-in parts of the room: side walls, a window with evening light and
 * curtains, a wall clock, a slate, a shelf with school things. Everything is drawn
 * in code so the game stays a few hundred kilobytes.
 */
import * as THREE from '../vendor/three.chitplay.min.js';

const TAU = Math.PI * 2;

function tex(w, h, draw, anisotropy = 8) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

function skyTexture() {
  return tex(1024, 1024, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#ffc781'); sky.addColorStop(0.55, '#ffe2ab'); sky.addColorStop(0.75, '#ffd08a'); sky.addColorStop(1, '#a0aa6e');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const sun = g.createRadialGradient(w * 0.68, h * 0.52, 8, w * 0.68, h * 0.52, 340);
    sun.addColorStop(0, 'rgba(255,255,235,1)'); sun.addColorStop(0.1, 'rgba(255,245,200,.9)'); sun.addColorStop(1, 'rgba(255,220,150,0)');
    g.fillStyle = sun; g.fillRect(0, 0, w, h);
    // rooftops and a neem tree outside
    g.fillStyle = '#8a6a55';
    [[0, 690, 240, 340], [210, 730, 200, 300], [520, 660, 180, 370], [760, 720, 270, 310]].forEach(r => g.fillRect(...r));
    g.fillStyle = '#6d5344';
    [[50, 670, 120, 20], [560, 640, 80, 20], [830, 700, 130, 20]].forEach(r => g.fillRect(...r));
    g.fillStyle = '#4e7040';
    for (let i = 0; i < 90; i++) { g.beginPath(); g.arc(380 + Math.cos(i) * 130 * Math.random(), 610 + Math.sin(i * 2) * 110 * Math.random(), 22 + Math.random() * 26, 0, TAU); g.fill(); }
    g.fillStyle = '#3d2b1f'; g.fillRect(372, 690, 18, 160);
  });
}

function curtainTexture(color, band) {
  return tex(512, 1024, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) {          // pleats
      const s = Math.sin(x / w * TAU * 7);
      g.fillStyle = s > 0 ? `rgba(255,255,255,${s * 0.16})` : `rgba(0,0,0,${-s * 0.24})`;
      g.fillRect(x, 0, 2, h);
    }
    g.fillStyle = band; g.fillRect(0, h - 90, w, 30); g.fillRect(0, h - 44, w, 12);
    g.fillStyle = 'rgba(255,255,255,.2)';
    for (let y = 40; y < h - 110; y += 90) for (let x = 20 + (y % 180 ? 40 : 0); x < w; x += 80) { g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
  });
}

function clockTexture() {
  return tex(512, 512, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(c, c, c - 2, 0, TAU); g.fill();
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 14; g.stroke();
    g.fillStyle = '#2a2018'; g.font = '700 46px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      g.fillText(String(i), c + Math.cos(a) * 190, c + Math.sin(a) * 190);
    }
    const hand = (a, l, wd) => { g.lineWidth = wd; g.lineCap = 'round'; g.strokeStyle = '#1a1410'; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * l, c + Math.sin(a) * l); g.stroke(); };
    hand(-0.6, 120, 13); hand(1.9, 170, 8);
    g.fillStyle = '#b3261e'; g.beginPath(); g.arc(c, c, 13, 0, TAU); g.fill();
  });
}

function slateTexture() {
  return tex(1024, 720, (g, w, h) => {
    g.fillStyle = '#1f2a26'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {           // old chalk smudges
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.018})`;
      g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 120, 12 + Math.random() * 40, Math.random(), 0, TAU); g.fill();
    }
    g.strokeStyle = '#7a5532'; g.lineWidth = 34; g.strokeRect(0, 0, w, h);
    g.fillStyle = 'rgba(245,245,235,.92)'; g.textAlign = 'left';
    g.font = '700 72px "Comic Sans MS", "Segoe Print", cursive';
    g.fillText('CHITPLAY', 66, 124);
    g.font = '52px "Comic Sans MS", "Segoe Print", cursive';
    ['King      1000', 'Queen      800', 'Police     500', 'Thief        0'].forEach((t, i) => g.fillText(t, 74, 232 + i * 92));
    g.strokeStyle = 'rgba(245,245,235,.8)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(70, 150); g.lineTo(520, 150); g.stroke();
    for (let i = 0; i < 4; i++) {             // a tally of who won
      g.beginPath(); g.moveTo(690 + i * 34, 300); g.lineTo(676 + i * 34, 430); g.stroke();
    }
    g.beginPath(); g.moveTo(660, 410); g.lineTo(820, 320); g.stroke();
  });
}

export function buildRoomDetails(scene, wallMaterial, anisotropy) {
  const std = (p) => new THREE.MeshStandardMaterial({ envMapIntensity: 0.35, roughness: 0.75, ...p });
  const box = (w, h, d, material, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const wood = std({ color: '#5e3c22', roughness: 0.55 });
  const paint = std({ color: '#f1ead8', roughness: 0.45 });

  /* side walls and skirting, so the room closes around the mat */
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.5), wallMaterial);
    wall.rotation.y = -s * Math.PI / 2;
    wall.position.set(s * 4.1, 2.25, 2.4);
    wall.receiveShadow = true;
    scene.add(wall);
    box(0.03, 0.14, 10, wood, s * 4.08, 0.07, 2.4);
  }
  box(8.2, 0.14, 0.03, wood, 0, 0.07, -2.585);

  /* window on the left wall, where the evening sun comes from */
  const W = { y: 1.9, z: -0.6, w: 2.1, h: 1.7 };
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W.w, W.h), new THREE.MeshBasicMaterial({ map: skyTexture(), toneMapped: false }));
  glass.rotation.y = Math.PI / 2;
  glass.position.set(-4.08, W.y, W.z);
  scene.add(glass);
  const frameX = -4.06;
  box(0.06, 0.1, W.w + 0.2, wood, frameX, W.y + W.h / 2 + 0.05, W.z);
  box(0.1, 0.1, W.w + 0.3, wood, frameX + 0.03, W.y - W.h / 2 - 0.05, W.z);
  box(0.06, W.h + 0.2, 0.1, wood, frameX, W.y, W.z - W.w / 2 - 0.05);
  box(0.06, W.h + 0.2, 0.1, wood, frameX, W.y, W.z + W.w / 2 + 0.05);
  const iron = std({ color: '#2d3a3a', roughness: 0.4, metalness: 0.5 });
  for (let z = W.z - W.w / 2 + 0.21; z < W.z + W.w / 2 - 0.1; z += 0.21) box(0.018, W.h, 0.018, iron, frameX + 0.01, W.y, z);
  box(0.02, 0.05, W.w, iron, frameX + 0.01, W.y + 0.15, W.z);
  const curtain = std({ map: curtainTexture('#b5533c', '#e8b84a'), roughness: 0.95, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const g = new THREE.PlaneGeometry(0.62, W.h + 0.5, 22, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 34) * 0.035);
    g.computeVertexNormals();
    const c = new THREE.Mesh(g, curtain);
    c.rotation.y = Math.PI / 2;
    c.position.set(-4.0, W.y - 0.18, W.z + s * (W.w / 2 + 0.12));
    c.castShadow = true;
    scene.add(c);
  }
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, W.w + 1.1, 12), std({ color: '#c49a4a', metalness: 0.8, roughness: 0.3 }));
  rod.rotation.x = Math.PI / 2;
  rod.position.set(-3.98, W.y + W.h / 2 + 0.2, W.z);
  scene.add(rod);

  /* wall clock */
  const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 40), std({ color: '#3a2a1a' }));
  clockBody.rotation.x = Math.PI / 2;
  clockBody.position.set(1.15, 2.72, -2.57);
  scene.add(clockBody);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.225, 40), std({ map: clockTexture(), roughness: 0.3 }));
  face.position.set(1.15, 2.72, -2.546);
  scene.add(face);

  /* a slate where someone keeps score */
  const slateTex = slateTexture();
  slateTex.anisotropy = anisotropy || 8;
  const slate = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.8), std({ map: slateTex, roughness: 0.82 }));
  slate.position.set(0.25, 1.5, -2.575);
  slate.rotation.z = -0.012;
  scene.add(slate);

  /* shelf with school things on the right wall */
  const shelfX = 4.0, shelfZ = -0.5;
  box(0.34, 0.035, 1.6, wood, shelfX - 0.17, 1.35, shelfZ);
  box(0.34, 0.035, 1.6, wood, shelfX - 0.17, 0.82, shelfZ);
  const bookColors = ['#a33a2c', '#2c5d8a', '#e0a92e', '#3c7a4c', '#6a3b86', '#d0d0c4', '#c76a2a'];
  let z = shelfZ - 0.68;
  bookColors.concat(bookColors.slice(0, 4)).forEach((c, i) => {
    const t = 0.05 + (i % 3) * 0.018, h = 0.2 + (i % 4) * 0.022;
    box(0.2, h, t, std({ color: c, roughness: 0.65 }), shelfX - 0.17, 1.368 + h / 2, z).rotation.x = i === 8 ? 0.22 : 0;
    z += t + 0.006;
  });
  // school bag
  const bagMat = std({ color: '#274f8c', roughness: 0.82 });
  const bag = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), bagMat);
  bag.scale.set(0.15, 0.2, 0.2);
  bag.position.set(shelfX - 0.19, 1.035, shelfZ + 0.34);
  bag.castShadow = true;
  scene.add(bag);
  box(0.03, 0.1, 0.22, std({ color: '#c8a13a', roughness: 0.4, metalness: 0.5 }), shelfX - 0.34, 1.0, shelfZ + 0.34);
  // steel tiffin box
  const steel = std({ color: '#d7dce2', metalness: 1, roughness: 0.22, envMapIntensity: 1.2 });
  for (let i = 0; i < 3; i++) {
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.07, 28), steel);
    tier.position.set(shelfX - 0.17, 0.875 + i * 0.075, shelfZ - 0.34);
    tier.castShadow = true;
    scene.add(tier);
  }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 8, 20, Math.PI), steel);
  handle.position.set(shelfX - 0.17, 1.06, shelfZ - 0.34);
  handle.rotation.y = Math.PI / 2;
  scene.add(handle);
  // cricket bat in the corner
  const bat = box(0.1, 0.72, 0.03, std({ color: '#d9b77e', roughness: 0.5 }), -3.55, 0.42, -2.35);
  bat.rotation.z = 0.14;
  const batHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.3, 12), std({ color: '#2b2b2b' }));
  batHandle.position.set(-3.6, 0.92, -2.35);
  batHandle.rotation.z = 0.14;
  scene.add(batHandle);
}
