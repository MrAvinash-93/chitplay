/**
 * The 3D paper chit for the party games: a folded slip on a striped mat that unfolds to show a
 * secret word, a prompt or a riddle, and folds shut again before the phone is passed on.
 * Light on purpose: one small scene, no shadows (a soft blob instead), the frame rate drops to
 * nothing while the chit is still, and every animation respects reduced motion.
 * Resolves null where WebGL isn't available: the game then shows its plain paper card.
 */
import * as THREE from '../vendor/three.chitplay.min.js';

const PAPER = '#f3ead2';
const TONES = { paper: '#f3ead2', truth: '#ffd9d2', dare: '#d6e4ff', gold: '#ffe9a8' };
const W = 1.6, H = 2.0, T = 0.012;       // one half of the chit: width, height, thickness

/** Lined paper with a fold crease, as a canvas: the outside and the inside of the chit. */
function paperCanvas(tone, text = '', label = '') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 640;
  const g = c.getContext('2d');
  g.fillStyle = tone;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(70, 110, 190, .28)';
  g.lineWidth = 2;
  for (let y = 58; y < c.height; y += 38) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
  g.strokeStyle = 'rgba(200, 80, 80, .35)';
  g.beginPath(); g.moveTo(52, 0); g.lineTo(52, c.height); g.stroke();
  // a little wear on the paper
  for (let n = 0; n < 900; n++) { g.fillStyle = `rgba(120, 90, 50, ${Math.random() * 0.04})`; g.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2); }
  if (label) {
    g.fillStyle = 'rgba(80, 55, 30, .55)';
    g.font = '700 30px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(label, c.width / 2, 48);
  }
  if (text) {
    g.fillStyle = '#3a2a18';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    // biggest font that fits, wrapped over several lines
    const words = String(text).split(/\s+/);
    let size = 96, lines = [];
    for (; size > 22; size -= 4) {
      g.font = `800 ${size}px system-ui, sans-serif`;
      lines = [];
      let line = '';
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        if (g.measureText(next).width > c.width - 70 && line) { lines.push(line); line = w; } else line = next;
      }
      lines.push(line);
      if (lines.length * size * 1.18 < c.height - 120 && lines.every(l => g.measureText(l).width <= c.width - 50)) break;
    }
    const top = c.height / 2 - ((lines.length - 1) * size * 1.18) / 2 + 14;
    lines.forEach((l, i) => g.fillText(l, c.width / 2, top + i * size * 1.18));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export async function createStage(host) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch { return null; }
  if (!renderer.getContext()) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 5.4, 4.2);
  camera.lookAt(0, 0, 0.15);
  scene.add(new THREE.HemisphereLight('#fff6e4', '#3a2010', 1.6));
  const sun = new THREE.DirectionalLight('#ffe7c4', 1.6);
  sun.position.set(2, 6, 3);
  scene.add(sun);

  // the striped mat the chit lies on
  const mat = document.createElement('canvas');
  mat.width = 256; mat.height = 256;
  const mg = mat.getContext('2d');
  mg.fillStyle = '#d9bd7a'; mg.fillRect(0, 0, 256, 256);
  ['#2e7a44', '#2a4a9a', '#b8392c'].forEach((col, i) => { for (let k = 0; k < 3; k++) { mg.fillStyle = col; mg.fillRect(0, 22 + (i + k * 3) * 26, 256, 8); } });
  const matTex = new THREE.CanvasTexture(mat);
  matTex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.13 }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.005;
  blob.scale.set(1.3, 1, 1);
  scene.add(blob);

  // the chit: two halves hinged in the middle; the left one swings open
  const chit = new THREE.Group();
  scene.add(chit);
  const make = () => new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.85 });
  const edge = new THREE.MeshStandardMaterial({ color: '#e2d6b8', roughness: 0.9 });
  const halfGeo = new THREE.BoxGeometry(W, T, H);
  // box faces: +x, -x, +y (top), -y (bottom), +z, -z
  const rightMats = [edge, edge, make(), make(), edge, edge];
  const leftMats = [edge, edge, make(), make(), edge, edge];
  const right = new THREE.Mesh(halfGeo, rightMats);
  right.position.x = W / 2;
  const leftPivot = new THREE.Group();
  const left = new THREE.Mesh(halfGeo, leftMats);
  left.position.x = -W / 2;
  leftPivot.add(left);
  chit.add(right, leftPivot);

  let tone = PAPER, open = 0, target = 0, spin = 0, lift = 0, liftTarget = 0, dropT = 1, last = performance.now(), frames = 0;
  const textures = [];
  const setFaces = (text, label) => {
    textures.forEach(t => t.dispose());
    textures.length = 0;
    const outside = paperCanvas(tone, '', '');
    const inside = paperCanvas(tone, text, label);
    textures.push(outside, inside);
    // the inside is the top face of the right half (and of the left half when open)
    rightMats[2].map = inside; rightMats[3].map = outside;
    leftMats[2].map = inside; leftMats[3].map = outside;
    // the left half shows the left part of the writing, the right half the right part
    rightMats[2].map = inside.clone(); rightMats[2].map.offset.x = 0.5; rightMats[2].map.repeat.x = 0.5; rightMats[2].map.needsUpdate = true;
    leftMats[2].map = inside.clone(); leftMats[2].map.repeat.x = 0.5; leftMats[2].map.needsUpdate = true;
    textures.push(rightMats[2].map, leftMats[2].map);
    [...rightMats, ...leftMats].forEach(m => { m.needsUpdate = true; });
  };
  setFaces('', '');

  function resize() {
    const w = host.clientWidth || 300, h = host.clientHeight || 200;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole open chit in view on narrow screens
    camera.position.set(0, 5.4 * Math.max(1, 1.15 / camera.aspect), 4.2 * Math.max(1, 1.15 / camera.aspect));
    camera.lookAt(0, 0, 0.15);
    camera.updateProjectionMatrix();
    frames = 3;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  let raf = 0;
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 7);
    open += (target - open) * k;
    lift += (liftTarget - lift) * k;
    dropT = Math.min(1, dropT + dt * 1.6);
    const moving = Math.abs(target - open) > 0.001 || Math.abs(liftTarget - lift) > 0.001 || dropT < 1 || frames > 0;
    if (!moving) return;   // still: no work at all
    frames = Math.max(0, frames - 1);
    // closed: the left half lies folded over the right one; open: flat side by side
    leftPivot.rotation.z = -Math.PI * (1 - open) * 0.985;
    leftPivot.position.y = T * (1 - open);
    const fall = reduced ? 0 : (1 - dropT) ** 2;
    // a closed chit is only the right half wide: slide it back to the middle
    chit.position.set(-(W / 2) * (1 - open), 0.06 + lift * 0.5 + fall * 3, fall * -1.2);
    chit.rotation.set(0, spin * (1 - open) + fall * 2, (1 - open) * 0.04);
    chit.scale.setScalar(1 - 0.08 * (1 - open));
    blob.scale.set(0.75 + open * 0.75, 1, 0.75 + open * 0.3);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  return {
    /** Unfold the chit to show this text (a small label sits at the top). */
    reveal(text, { tone: t = 'paper', label = '' } = {}) {
      tone = TONES[t] || PAPER;
      setFaces(text, label);
      spin = 0;
      target = 1; liftTarget = 0;
      frames = 2;
    },
    /** Fold it shut (before the phone is passed on). */
    fold({ tone: t } = {}) {
      if (t) { tone = TONES[t] || PAPER; setFaces('', ''); }
      target = 0; liftTarget = 0;
      spin = (Math.random() - 0.5) * 0.5;
      frames = 2;
    },
    /** Drop a fresh folded chit onto the mat. */
    toss({ tone: t = 'paper' } = {}) {
      tone = TONES[t] || PAPER;
      setFaces('', '');
      target = 0; open = 0;
      dropT = reduced ? 1 : 0;
      spin = (Math.random() - 0.5) * 0.8;
      frames = 2;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      textures.forEach(t => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
