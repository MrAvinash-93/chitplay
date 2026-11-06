/**
 * Low-poly kids sitting cross-legged around the chatai. Each kid is a small
 * rig (spine, head, two-part arms) driven by named poses plus a little
 * procedural life (breathing, blinking, looking around).
 *
 * Kids never know anyone's role on their own — the world tells them what to
 * show, and only after the result is public.
 */
import * as THREE from '../vendor/three.chitplay.min.js';

const TAU = Math.PI * 2;
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));

export const KID_LOOKS = [
  { skin: '#c58c5c', hair: '#1b1410', style: 'side',   shirt: '#d4a017', pants: '#2f3e6b' },
  { skin: '#a86f45', hair: '#120d0a', style: 'plaits', shirt: '#e91e63', pants: '#5a3a6b' },
  { skin: '#d9a273', hair: '#2a1a10', style: 'spiky',  shirt: '#2196f3', pants: '#3b3b3b' },
  { skin: '#8d5a35', hair: '#0f0b08', style: 'bob',    shirt: '#43a047', pants: '#6b4a2f' },
];

// sh: [[left x, left z], [right x, right z]] shoulder rotations; el: elbow bends.
// Shoulder x < 0 swings the arm forward; z > 0 moves the left hand outward,
// z < 0 moves the right hand outward.
const POSES = {
  idle:     { sh: [[-0.35, 0.12], [-0.35, -0.12]], el: [-1.15, -1.15], lean: 0.08, head: 0.18 },
  reach:    { sh: [[-0.35, 0.12], [-1.15, -0.05]], el: [-1.15, -0.25], lean: 0.42, head: 0.45 },
  peek:     { sh: [[-0.9, -0.15], [-0.95, 0.15]],  el: [-1.75, -1.7],  lean: 0.2,  head: 0.3 },
  hold:     { sh: [[-0.35, 0.12], [-0.6, 0.08]],   el: [-1.15, -1.4],  lean: 0.1,  head: 0.15 },
  think:    { sh: [[-0.4, 0.1],   [-0.85, 0.28]],  el: [-1.4, -2.3],   lean: 0.12, head: 0.02 },
  nervous:  { sh: [[-0.55, -0.1], [-0.55, 0.1]],   el: [-1.4, -1.4],   lean: 0.22, head: 0.28 },
  show:     { sh: [[-0.35, 0.12], [-2.2, -0.1]],   el: [-1.15, -0.2],  lean: -0.02, head: -0.05 },
  cheer:    { sh: [[-2.8, 0.35],  [-2.8, -0.35]],  el: [-0.25, -0.25], lean: -0.08, head: -0.25 },
  sad:      { sh: [[-0.1, 0.08],  [-0.1, -0.08]],  el: [-0.5, -0.5],   lean: 0.45, head: 0.55 },
  facepalm: { sh: [[-0.35, 0.12], [-1.15, 0.38]],  el: [-1.15, -2.35], lean: 0.3,  head: 0.42 },
  point:    { sh: [[-0.35, 0.12], [-1.5, 0]],      el: [-1.15, -0.05], lean: 0.15, head: 0.05 },
  clap:     { sh: [[-1.0, -0.3],  [-1.0, 0.3]],    el: [-1.2, -1.2],   lean: 0,    head: -0.05 },
  throw:    { sh: [[-0.35, 0.12], [-2.7, -0.1]],   el: [-1.15, -0.6],  lean: -0.12, head: 0.05 },
  fling:    { sh: [[-0.35, 0.12], [-1.1, -0.05]],  el: [-1.15, -0.1],  lean: 0.3,  head: 0.25 },
  shrug:    { sh: [[-0.25, 0.55], [-0.25, -0.55]], el: [-1.9, -1.9],   lean: -0.05, head: 0.05 },
  laugh:    { sh: [[-0.5, -0.18], [-0.5, 0.18]],   el: [-1.3, -1.3],   lean: -0.15, head: -0.3 },
  cry:      { sh: [[-1.0, -0.22], [-1.0, 0.22]],   el: [-2.15, -2.15], lean: 0.35, head: 0.42 },
  jump:     { sh: [[-2.9, 0.4],   [-2.9, -0.4]],   el: [-0.15, -0.15], lean: -0.1, head: -0.3 },
  sneaky:   { sh: [[-0.4, 0.05],  [-0.9, 0.25]],   el: [-1.6, -2.2],   lean: 0.3,  head: 0.25 },
  deny:     { sh: [[-0.95, 0.32], [-0.95, -0.32]], el: [-1.65, -1.65], lean: -0.05, head: 0.0 },
  surprised:{ sh: [[-1.5, 0.55],  [-1.5, -0.55]],  el: [-0.7, -0.7],   lean: -0.2, head: -0.2 },
  wave:     { sh: [[-0.35, 0.12], [-2.6, -0.35]],  el: [-1.15, -0.7],  lean: 0,    head: -0.05 },
};

const emojiCache = {};
function emojiTexture(symbol) {
  if (emojiCache[symbol]) return emojiCache[symbol];
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,253,244,.95)';
  g.beginPath(); g.arc(64, 60, 52, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(40, 100); g.lineTo(30, 124); g.lineTo(62, 108); g.fill();
  g.strokeStyle = 'rgba(60,40,20,.35)';
  g.lineWidth = 4;
  g.beginPath(); g.arc(64, 60, 52, 0, TAU); g.stroke();
  g.font = '64px serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(symbol, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  emojiCache[symbol] = t;
  return t;
}

function std(p) {
  return new THREE.MeshStandardMaterial({ roughness: 0.75, envMapIntensity: 0.35, ...p });
}

function labelTexture(text, { w = 256, h = 64, bg = 'rgba(15,8,4,.78)', fg = '#ffe6b0', font = 'bold 30px monospace' } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.font = font;
  const tw = Math.min(w - 8, g.measureText(text).width + 28);
  g.fillStyle = bg;
  const x = (w - tw) / 2;
  g.beginPath();
  g.roundRect ? g.roundRect(x, 6, tw, h - 12, 12) : g.rect(x, 6, tw, h - 12);
  g.fill();
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function roleChitTexture(label, emoji, color) {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f3ead2';
  g.fillRect(0, 0, 192, 128);
  g.strokeStyle = 'rgba(70,110,190,.45)';
  for (let y = 14; y < 128; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(192, y); g.stroke(); }
  g.strokeStyle = 'rgba(120,90,50,.35)';
  g.beginPath(); g.moveTo(96, 0); g.lineTo(96, 128); g.stroke();   // fold crease
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '40px serif';
  g.fillText(emoji, 96, 46);
  g.fillStyle = color;
  g.font = `bold ${label.length > 6 ? 24 : 32}px monospace`;
  g.fillText(label, 96, 96);
  g.strokeStyle = '#5a4022';
  g.lineWidth = 4;
  g.strokeRect(2, 2, 188, 124);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildHair(style, mat) {
  const hair = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.113, 16, 10, 0, TAU, 0, Math.PI * 0.55), mat);
  cap.rotation.x = -0.4;
  cap.position.set(0, 0.012, -0.01);
  hair.add(cap);
  if (style === 'side') {
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), mat);
    fringe.position.set(0.02, 0.07, 0.085);
    fringe.rotation.z = -0.25;
    hair.add(fringe);
  } else if (style === 'plaits') {
    const ribbon = std({ color: '#d62839' });
    [-1, 1].forEach(s => {
      const braid = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.13, 3, 6), mat);
      braid.position.set(s * 0.085, -0.09, -0.04);
      braid.rotation.z = s * 0.15;
      const bow = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), ribbon);
      bow.position.set(s * 0.095, -0.17, -0.035);
      hair.add(braid, bow);
    });
  } else if (style === 'spiky') {
    for (let i = 0; i < 7; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 5), mat);
      const a = (i / 7) * TAU;
      spike.position.set(Math.cos(a) * 0.05, 0.1, Math.sin(a) * 0.05 - 0.01);
      spike.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      hair.add(spike);
    }
  } else if (style === 'bob') {
    const bob = new THREE.Mesh(new THREE.SphereGeometry(0.122, 16, 10, 0, TAU, 0, Math.PI * 0.62), mat);
    bob.rotation.x = -0.75;
    bob.position.set(0, 0.0, -0.025);
    hair.add(bob);
  }
  hair.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return hair;
}

function buildAccessories() {
  const acc = {};
  // Sipahi / detective cap
  {
    const g = new THREE.Group();
    const navy = std({ color: '#1f3f8a', roughness: 0.6 });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.1, 0.06, 14), navy);
    top.position.y = 0.1;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.06), std({ color: '#111a33' }));
    brim.position.set(0, 0.075, 0.1);
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.018, 8), std({ color: '#f0c040', metalness: 0.8, roughness: 0.3, envMapIntensity: 1 }));
    badge.position.set(0, 0.1, 0.104);
    g.add(top, brim, badge);
    acc.cap = g;
  }
  // Crown
  {
    const g = new THREE.Group();
    const gold = std({ color: '#f2c12e', metalness: 0.9, roughness: 0.3, envMapIntensity: 1.2 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.05, 12, 1, true), gold);
    band.material.side = THREE.DoubleSide;
    band.position.y = 0.11;
    g.add(band);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      const p = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 4), gold);
      p.position.set(Math.sin(a) * 0.082, 0.155, Math.cos(a) * 0.082);
      g.add(p);
    }
    acc.crown = g;
  }
  // Tiara
  {
    const g = new THREE.Group();
    const silver = std({ color: '#e8d6f0', metalness: 0.8, roughness: 0.3, envMapIntensity: 1.2 });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 5, 16, Math.PI), silver);
    arc.rotation.x = -Math.PI / 2 + 0.5;
    arc.position.set(0, 0.07, 0.0);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.02), std({ color: '#ff4fa3', emissive: '#ff4fa3', emissiveIntensity: 0.4 }));
    gem.position.set(0, 0.12, 0.075);
    g.add(arc, gem);
    acc.tiara = g;
  }
  // Wazir's turban
  {
    const g = new THREE.Group();
    const cloth = std({ color: '#f2efe6', roughness: 0.85 });
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095 - i * 0.012, 0.028, 6, 16), cloth);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.075 + i * 0.03;
      g.add(ring);
    }
    const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.018), std({ color: '#1f9a4a', emissive: '#1f9a4a', emissiveIntensity: 0.4 }));
    jewel.position.set(0, 0.1, 0.11);
    g.add(jewel);
    acc.turban = g;
  }
  // Nepali dhaka topi
  {
    const g = new THREE.Group();
    const c = document.createElement('canvas');
    c.width = 64; c.height = 16;
    const x = c.getContext('2d');
    ['#c8272d', '#1f3f8a', '#f0c23a', '#2c7a4a', '#111'].forEach((col, i) => { x.fillStyle = col; for (let k = i; k < 64; k += 5) x.fillRect(k, 0, 2, 16); });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const topi = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.105, 0.09, 14), std({ map: t, roughness: 0.8 }));
    topi.position.y = 0.11;
    topi.rotation.x = -0.12;
    g.add(topi);
    acc.dhaka = g;
  }
  // Doctor's head mirror band
  {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.012, 5, 20), std({ color: '#f2f2f2' }));
    band.rotation.x = Math.PI / 2 - 0.2;
    band.position.y = 0.05;
    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 14), std({ color: '#dfe4ea', metalness: 1, roughness: 0.15, envMapIntensity: 1.4 }));
    mirror.rotation.x = Math.PI / 2;
    mirror.position.set(0, 0.075, 0.105);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.006), std({ color: '#d62839' }));
    cross.position.set(0, 0.075, 0.11);
    g.add(band, mirror, cross);
    acc.doctor = g;
  }
  // Mayor's top hat
  {
    const g = new THREE.Group();
    const black = std({ color: '#151515', roughness: 0.5 });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.14, 14), black);
    crown.position.y = 0.16;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 16), black);
    brim.position.y = 0.09;
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.077, 0.077, 0.025, 14), std({ color: '#8a1a1a' }));
    ribbon.position.y = 0.11;
    g.add(crown, brim, ribbon);
    acc.tophat = g;
  }
  // Banker's green visor
  {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.01, 5, 20), std({ color: '#1f6b3a' }));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.06;
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.006, 16, 1, false, -Math.PI / 2.4, Math.PI / 1.2),
      std({ color: '#2fa35a', transparent: true, opacity: 0.85 }));
    peak.position.set(0, 0.06, 0.04);
    g.add(band, peak);
    acc.visor = g;
  }
  // Sheriff's cowboy hat
  {
    const g = new THREE.Group();
    const leather = std({ color: '#8a5a2b', roughness: 0.7 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 18), leather);
    brim.position.y = 0.085;
    brim.scale.set(1, 1, 0.85);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.09, 14), leather);
    crown.position.y = 0.13;
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.02, 5), std({ color: '#f0c040', metalness: 0.8, roughness: 0.3, envMapIntensity: 1 }));
    star.position.set(0, 0.13, 0.084);
    g.add(brim, crown, star);
    acc.cowboy = g;
  }
  // British custodian helmet
  {
    const g = new THREE.Group();
    const navy = std({ color: '#141c3a', roughness: 0.55 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), navy);
    dome.scale.set(1, 1.35, 1);
    dome.position.y = 0.12;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), std({ color: '#c0c4cc', metalness: 0.9, roughness: 0.3, envMapIntensity: 1 }));
    knob.position.y = 0.27;
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.025, 8), std({ color: '#c0c4cc', metalness: 0.9, roughness: 0.3, envMapIntensity: 1 }));
    badge.position.set(0, 0.13, 0.108);
    g.add(dome, knob, badge);
    acc.helmet = g;
  }
  // Russian ushanka
  {
    const g = new THREE.Group();
    const fur = std({ color: '#5a4636', roughness: 1 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.118, 16, 10, 0, TAU, 0, Math.PI * 0.5), std({ color: '#3a3a44', roughness: 0.8 }));
    cap.position.y = 0.035;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 8, 20), fur);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.05;
    g.add(cap, band);
    [-1, 1].forEach(s => {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.07), fur);
      flap.position.set(s * 0.11, -0.01, 0);
      g.add(flap);
    });
    acc.ushanka = g;
  }
  // French gendarme kepi
  {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.09, 14), std({ color: '#1a2250', roughness: 0.6 }));
    top.position.y = 0.12;
    top.rotation.x = -0.1;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.101, 0.101, 0.022, 14), std({ color: '#c8272d' }));
    band.position.y = 0.085;
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.01, 0.06), std({ color: '#111' }));
    brim.position.set(0, 0.075, 0.1);
    g.add(top, band, brim);
    acc.kepi = g;
  }
  // Beret
  {
    const g = new THREE.Group();
    const beret = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), std({ color: '#1a1a1a', roughness: 0.9 }));
    beret.scale.set(1.05, 0.35, 1.05);
    beret.position.set(0.015, 0.095, -0.01);
    beret.rotation.z = -0.2;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.02, 5), std({ color: '#1a1a1a' }));
    stalk.position.set(0.02, 0.14, -0.01);
    g.add(beret, stalk);
    acc.beret = g;
  }
  // Sombrero
  {
    const g = new THREE.Group();
    const straw = std({ color: '#d9b86a', roughness: 0.9 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.012, 22), straw);
    brim.position.y = 0.085;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.014, 6, 24), std({ color: '#c8272d' }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.09;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 14), straw);
    crown.position.y = 0.16;
    g.add(brim, rim, crown);
    acc.sombrero = g;
  }
  // Cheat's eye mask
  {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.104, 0.02, 6, 20), std({ color: '#111', roughness: 0.5 }));
    band.rotation.x = Math.PI / 2;
    band.scale.set(1, 1, 1.2);
    band.position.y = 0.005;
    g.add(band);
    acc.mask = g;
  }
  Object.values(acc).forEach(g => {
    g.visible = false;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  });
  return acc;
}

export function createKid(scene, look, { seat, paperMaterial }) {
  const root = new THREE.Group();
  root.position.set(seat.x, 0, seat.z);
  root.rotation.y = Math.atan2(-seat.x, -seat.z);   // face the centre of the mat
  scene.add(root);

  const skin = std({ color: look.skin, roughness: 0.65 });
  const shirt = std({ color: look.shirt, roughness: 0.8 });
  const pants = std({ color: look.pants, roughness: 0.85 });
  const hairMat = std({ color: look.hair, roughness: 0.6 });
  const dark = new THREE.MeshBasicMaterial({ color: '#140c08' });
  const shadowy = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  // Cross-legged lap + feet
  const lap = shadowy(new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), pants));
  lap.scale.set(0.23, 0.07, 0.17);
  lap.position.set(0, 0.07, 0.07);
  root.add(lap);
  [-1, 1].forEach(s => {
    const foot = shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), skin));
    foot.scale.set(1, 0.7, 1.4);
    foot.position.set(s * 0.1, 0.05, 0.2);
    root.add(foot);
  });

  // Spine → torso, head, arms
  const spine = new THREE.Group();
  spine.position.y = 0.11;
  root.add(spine);
  const torso = shadowy(new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.15, 4, 10), shirt));
  torso.scale.set(1, 1, 0.82);
  torso.position.y = 0.17;
  spine.add(torso);

  const headPivot = new THREE.Group();
  headPivot.position.y = 0.4;
  spine.add(headPivot);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.05, 8), skin);
  neck.position.y = 0.0;
  headPivot.add(neck);
  const head = new THREE.Group();
  head.position.y = 0.11;
  headPivot.add(head);
  const skull = shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 18), skin));
  skull.scale.set(1, 0.97, 0.96);
  head.add(skull);
  const white = new THREE.MeshBasicMaterial({ color: '#fbfaf4' });
  const eyes = [], brows = [];
  [-1, 1].forEach(s => {
    const eye = new THREE.Group();
    eye.position.set(s * 0.038, 0.004, 0.086);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 10), white);
    sclera.scale.set(1, 1.18, 0.55);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), dark);
    pupil.scale.set(1, 1.15, 0.6);
    pupil.position.set(0, -0.001, 0.008);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.0038, 6, 4), white);
    shine.position.set(0.0045, 0.0055, 0.0145);
    eye.add(sclera, pupil, shine);
    head.add(eye);
    eyes.push(eye);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.004, 0.022, 2, 6), hairMat);
    brow.rotation.z = Math.PI / 2;
    brow.position.set(s * 0.038, 0.037, 0.093);
    brow.userData.side = s;
    head.add(brow);
    brows.push(brow);
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), new THREE.MeshBasicMaterial({ color: '#ff8a8a', transparent: true, opacity: 0.32, depthWrite: false }));
    blush.position.set(s * 0.062, -0.028, 0.083);
    blush.rotation.y = s * 0.62;
    head.add(blush);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), skin);
    ear.scale.set(0.7, 1, 1);
    ear.position.set(s * 0.104, -0.005, 0);
    head.add(ear);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), skin);
  nose.scale.set(1, 0.85, 1);
  nose.position.set(0, -0.018, 0.103);
  head.add(nose);

  // Mouth shapes: smile ⌣, frown ⌢, open O, flat —
  const lipMat = std({ color: '#7a2424', roughness: 0.6 });
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.052, 0.094);
  head.add(mouth);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.0042, 6, 14, Math.PI), lipMat);
  smile.rotation.z = Math.PI;
  smile.position.y = 0.008;
  const frown = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0042, 6, 14, Math.PI), lipMat);
  frown.position.y = -0.008;
  const open = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), std({ color: '#4a1414', roughness: 0.7 }));
  open.scale.set(1, 0.85, 0.35);
  const flat = new THREE.Mesh(new THREE.CapsuleGeometry(0.0042, 0.022, 2, 6), lipMat);
  flat.rotation.z = Math.PI / 2;
  mouth.add(smile, frown, open, flat);
  const MOUTHS = { smile, frown, open, flat };
  const showMouth = (name) => Object.entries(MOUTHS).forEach(([k, m]) => (m.visible = k === name));
  showMouth('smile');

  // Collar on the shirt
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.013, 6, 18), std({ color: '#f4efe4', roughness: 0.8 }));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.31;
  spine.add(collar);
  head.add(buildHair(look.style, hairMat));
  const acc = buildAccessories();
  Object.values(acc).forEach(g => head.add(g));

  function arm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.135, 0.3, 0);
    spine.add(shoulder);
    const upper = shadowy(new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.1, 3, 8), shirt));
    upper.position.y = -0.07;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.145;
    shoulder.add(elbow);
    const fore = shadowy(new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.1, 3, 8), skin));
    fore.position.y = -0.065;
    elbow.add(fore);
    const hand = new THREE.Group();
    hand.position.y = -0.14;
    elbow.add(hand);
    hand.add(shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), skin)));
    return { shoulder, elbow, hand };
  }
  const L = arm(1), R = arm(-1);

  // Folded chit held in the right hand (never shows a role)
  const heldChit = new THREE.Group();
  {
    const half = new THREE.BoxGeometry(0.06, 0.006, 0.06);
    const a = new THREE.Mesh(half, paperMaterial);
    a.position.x = -0.03;
    a.rotation.z = 0.15;
    const b = new THREE.Mesh(half, paperMaterial);
    b.position.x = 0.03;
    b.rotation.z = -0.15;
    heldChit.add(a, b);
    heldChit.position.set(0, -0.03, 0.03);
    heldChit.rotation.x = 1.2;
    heldChit.visible = false;
    heldChit.traverse(o => { if (o.isMesh) o.castShadow = true; });
    R.hand.add(heldChit);
  }

  // World-space sprites: open role chit (result only) and name tag
  const openChit = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, toneMapped: false, depthWrite: false }));
  openChit.scale.set(0.42, 0.28, 1);
  openChit.visible = false;
  scene.add(openChit);
  const nameTag = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, toneMapped: false, depthTest: false, depthWrite: false }));
  nameTag.scale.set(0.6, 0.15, 1);
  nameTag.renderOrder = 10;
  nameTag.visible = false;
  scene.add(nameTag);

  // Emote bubble above the head (❗ ❓ 💢 😂 😭 …)
  const emoteSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, toneMapped: false, depthTest: false, depthWrite: false }));
  emoteSprite.renderOrder = 11;
  emoteSprite.visible = false;
  scene.add(emoteSprite);
  let emoteUntil = 0, emoteStart = 0;

  /* ─── Expressions ──────────────────────────────────────── */
  // brow: [y offset, tilt] (tilt > 0 = inner ends down / angry)
  const MOODS = {
    neutral:   { brow: [0, 0],        mouth: 'smile', eye: 1 },
    happy:     { brow: [0.006, -0.1], mouth: 'smile', eye: 0.75 },
    sad:       { brow: [0.002, -0.4], mouth: 'frown', eye: 0.85 },
    angry:     { brow: [-0.004, 0.42], mouth: 'flat', eye: 0.9 },
    surprised: { brow: [0.012, -0.1], mouth: 'open',  eye: 1.25 },
    worried:   { brow: [0.006, -0.32], mouth: 'flat', eye: 1.05 },
    sly:       { brow: [0.002, 0.2],  mouth: 'smile', eye: 0.8, sly: true },
  };
  const POSE_MOOD = {
    cheer: 'happy', jump: 'happy', clap: 'happy', laugh: 'happy', show: 'happy', wave: 'happy', throw: 'happy', fling: 'happy',
    sad: 'sad', cry: 'sad', facepalm: 'sad', nervous: 'worried', deny: 'worried', surprised: 'surprised',
    point: 'angry', think: 'sly', peek: 'sly', sneaky: 'sly',
  };
  let moodOverride = null, moodUntil = 0;
  let browY = 0, browTilt = 0, eyeOpen = 1;

  /* ─── Animation state ──────────────────────────────────── */
  const cur = JSON.parse(JSON.stringify(POSES.idle));
  let pose = 'idle';
  let poseSpeed = 7;
  let sequence = [];
  let seqT = 0;
  let lookTarget = null;       // world Vector3 or null
  let yaw = 0, pitch = 0, bounce = 0;
  let blinkAt = 1 + Math.random() * 3;
  let now = 0, talkUntil = 0;
  const seed = Math.random() * TAU;
  const tmp = new THREE.Vector3();
  const local = new THREE.Vector3();

  function setPose(name, speed = 7) {
    if (!POSES[name]) return;
    pose = name;
    poseSpeed = speed;
    sequence = [];
  }

  function play(steps) {
    // steps: [[pose, seconds, speed?], ...]; last pose stays
    sequence = steps.slice();
    seqT = 0;
    const [first, , sp] = sequence[0];
    pose = first;
    poseSpeed = sp || 9;
  }

  function update(dt, time, reduced) {
    now = time;
    const talking = time < talkUntil;
    const moodName = (moodOverride && time < moodUntil) ? moodOverride : (POSE_MOOD[pose] || 'neutral');
    const md = MOODS[moodName] || MOODS.neutral;
    if (talking) {
      const o = Math.abs(Math.sin(time * 15 + seed));
      showMouth(o > 0.35 ? 'open' : md.mouth === 'open' ? 'open' : md.mouth);
      open.scale.set(1, 0.45 + o * 0.7, 0.35);
    } else {
      showMouth(md.mouth);
      open.scale.set(1, 0.85, 0.35);
    }
    browY = damp(browY, md.brow[0], 10, dt);
    browTilt = damp(browTilt, md.brow[1], 10, dt);
    brows.forEach(b => {
      const s = b.userData.side;
      b.position.y = 0.037 + browY + (md.sly && s > 0 ? 0.008 : 0);
      b.rotation.z = Math.PI / 2 + s * browTilt * (md.sly && s > 0 ? -0.5 : 1);
    });
    eyeOpen = damp(eyeOpen, md.eye, 10, dt);
    if (sequence.length) {
      seqT += dt;
      if (seqT >= sequence[0][1] && sequence.length > 1) {
        sequence.shift();
        seqT = 0;
        pose = sequence[0][0];
        poseSpeed = sequence[0][2] || 9;
      }
    }
    const tgt = POSES[pose];
    const k = reduced ? 50 : poseSpeed;
    for (let s = 0; s < 2; s++) {
      cur.sh[s][0] = damp(cur.sh[s][0], tgt.sh[s][0], k, dt);
      cur.sh[s][1] = damp(cur.sh[s][1], tgt.sh[s][1], k, dt);
      cur.el[s] = damp(cur.el[s], tgt.el[s], k, dt);
    }
    cur.lean = damp(cur.lean, tgt.lean, k, dt);
    cur.head = damp(cur.head, tgt.head, k, dt);

    const m = reduced ? 0 : 1;
    let clapZ = 0, rub = 0, wave = 0, jitter = 0;
    if (pose === 'clap') clapZ = Math.sin(time * 16 + seed) * 0.18 * m;
    if (pose === 'nervous') { rub = Math.sin(time * 9 + seed) * 0.12 * m; jitter = Math.sin(time * 13 + seed) * 0.05 * m; }
    if (pose === 'cheer' || pose === 'jump') wave = Math.sin(time * 9 + seed) * 0.25 * m;
    let waveR = 0, roll = 0, shake = 0;
    if (pose === 'wave') waveR = Math.sin(time * 10 + seed) * 0.4 * m;
    if (pose === 'laugh') roll = Math.sin(time * 20 + seed) * 0.06 * m;
    if (pose === 'cry') roll = Math.sin(time * 14 + seed) * 0.035 * m;
    if (pose === 'sneaky') roll = 0.22;
    if (pose === 'shrug') roll = Math.sin(time * 1.5) * 0.04 * m;
    if (pose === 'deny') shake = Math.sin(time * 12 + seed) * 0.4 * m;
    const hop = pose === 'jump' ? 0.12 : pose === 'cheer' ? 0.05 : pose === 'laugh' ? 0.015 : 0;
    const hopSpeed = pose === 'laugh' ? 20 : pose === 'jump' ? 7 : 8;
    bounce = damp(bounce, hop ? Math.abs(Math.sin(time * hopSpeed + seed)) * hop * m : 0, 12, dt);

    L.shoulder.rotation.set(cur.sh[0][0] + rub, 0, cur.sh[0][1] - clapZ + wave);
    R.shoulder.rotation.set(cur.sh[1][0] - rub, 0, cur.sh[1][1] + clapZ - wave + waveR);
    L.elbow.rotation.x = cur.el[0];
    R.elbow.rotation.x = cur.el[1];

    const breathe = Math.sin(time * 2.1 + seed) * 0.012 * m;
    spine.rotation.x = cur.lean + breathe;
    spine.rotation.z = damp(spine.rotation.z, roll, 10, dt);
    root.position.y = bounce;
    torso.scale.set(1 + breathe * 0.6, 1, 0.82 + breathe * 0.6);

    // Head look-at (yaw/pitch relative to the body)
    let ty = Math.sin(time * 0.4 + seed) * 0.15 * m, tp = 0;
    if (lookTarget) {
      local.copy(lookTarget);
      root.worldToLocal(local);
      local.y -= 0.6;
      ty = Math.max(-1.2, Math.min(1.2, Math.atan2(local.x, local.z)));
      tp = Math.max(-0.5, Math.min(0.6, -Math.atan2(local.y, Math.hypot(local.x, local.z))));
    }
    yaw = damp(yaw, ty + jitter, reduced ? 50 : 4, dt);
    pitch = damp(pitch, tp, reduced ? 50 : 4, dt);
    const nod = talking ? Math.sin(time * 9 + seed) * 0.045 * m : 0;
    const tilt = pose === 'shrug' ? 0.18 : pose === 'think' ? 0.12 : 0;
    headPivot.rotation.set(cur.head * 0.6 + pitch + nod, yaw + shake, Math.sin(time * 0.7 + seed) * 0.04 * m + tilt);
    spine.rotation.y = pose === 'point' ? yaw * 0.6 : yaw * 0.15;

    // Blink (and squint / widen with the mood)
    let lid = eyeOpen;
    if (time > blinkAt) {
      if (time - blinkAt < 0.12) lid = 0.12;
      else blinkAt = time + 2 + Math.random() * 3.5;
    }
    if (pose === 'cry' || pose === 'laugh') lid = Math.min(lid, 0.3);
    eyes.forEach(e => (e.scale.y = lid));

    // Emote pops in, bobs, then disappears
    if (emoteSprite.visible) {
      if (time > emoteUntil) emoteSprite.visible = false;
      else {
        head.getWorldPosition(tmp);
        const age = time - emoteStart;
        const pop = Math.min(1, age * 6);
        const s = 0.2 * (pop < 1 ? 0.6 + pop * 0.5 : 1);
        emoteSprite.scale.set(s, s, 1);
        emoteSprite.position.set(tmp.x + 0.14, tmp.y + 0.2 + Math.sin(age * 5) * 0.015 + bounce, tmp.z);
      }
    }

    // Sprites follow the kid
    if (openChit.visible) {
      R.hand.getWorldPosition(tmp);
      openChit.position.copy(tmp).add(new THREE.Vector3(0, 0.1, 0));
    }
    if (nameTag.visible) {
      head.getWorldPosition(tmp);
      nameTag.position.set(tmp.x, tmp.y + 0.3 + bounce, tmp.z);
    }
  }

  return {
    root,
    setPose,
    play,
    update,
    get pose() { return pose; },
    talk(sec = 1.4) { talkUntil = now + sec; },
    mood(name, sec = 2.5) { moodOverride = name; moodUntil = now + sec; },
    emote(symbol, sec = 2) {
      if (!symbol) { emoteSprite.visible = false; return; }
      emoteSprite.material.map = emojiTexture(symbol);
      emoteSprite.material.needsUpdate = true;
      emoteSprite.visible = true;
      emoteStart = now;
      emoteUntil = now + sec;
    },
    lookAt(v) { lookTarget = v ? v.clone() : null; },
    headWorld(out = new THREE.Vector3()) { return head.getWorldPosition(out); },
    handWorld(out = new THREE.Vector3()) { return R.hand.getWorldPosition(out); },
    reachPoint(out = new THREE.Vector3()) {
      // where the right hand ends up in the "reach" pose (approx, in world)
      out.set(-0.12, 0.2, 0.42);
      return root.localToWorld(out);
    },
    holdChit(on) { heldChit.visible = !!on; },
    showRole(texture) {
      openChit.material.map = texture || null;
      openChit.material.needsUpdate = true;
      openChit.visible = !!texture;
      if (texture) heldChit.visible = false;
    },
    setAccessory(name) {
      Object.entries(acc).forEach(([k, g]) => (g.visible = k === name));
    },
    setName(text) {
      if (!text) { nameTag.visible = false; return; }
      if (nameTag.userData.text !== text) {
        nameTag.material.map?.dispose();
        nameTag.material.map = labelTexture(text);
        nameTag.material.needsUpdate = true;
        nameTag.userData.text = text;
      }
      nameTag.visible = true;
    },
    setShirt(hex) { if (hex) shirt.color.set(hex); },
    setSkin(hex) { if (hex) skin.color.set(hex); },
    // keep the name tag a sensible size on screen, even in close-ups
    fitTag(cameraPos) {
      if (!nameTag.visible) return;
      const s = Math.min(1, Math.max(0.3, nameTag.position.distanceTo(cameraPos) / 3.6));
      nameTag.scale.set(0.6 * s, 0.15 * s, 1);
    },
  };
}
