/**
 * The 3D room. It reacts to the game: chits get tossed on the mat, players pick
 * them up, the power goes out while the guesser thinks, the tubelight flickers
 * back on for the result, and the camera follows whoever is talking.
 *
 * It never decides anything and never shows a role by itself: the game screen
 * tells it what to do through `story`.
 */
import * as THREE from '../vendor/three.chitplay.min.js';
import { gameBus, EVENTS } from '../core/event-bus.js';
import { settingsStore } from '../persistence/settings-store.js?v=20261107-cast';
import { audioManager } from '../audio/audio-manager.js';
import { createCharacter, setCharacterDetail } from './characters.js?v=20261107-cast';
import { lookOf, lookKey } from './character-looks.js?v=20261107-cast';
import { buildRoomDetails } from './room-details.js?v=20261107-cast';
import { COUNTRIES } from './countries.js?v=20261107-cast';
import * as Themes from './themes.js?v=20261107-cast';

const TAU = Math.PI * 2;

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = p => 1 - (1 - p) ** 3;
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function canvasTex(w, h, draw, { repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = 8;
  return t;
}

/* ─── Procedural textures ─────────────────────────────────────────── */

function paperTexture(seed = 3) {
  const r = rng(seed);
  return canvasTex(512, 512, (g2) => {
    g2.scale(4, 4);
    const g = g2, w = 128, h = 128;
    g.fillStyle = '#f3ead2';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,110,190,.5)';
    g.lineWidth = 1;
    for (let y = 14; y < h; y += 12) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    }
    g.strokeStyle = 'rgba(200,60,60,.55)';
    g.beginPath(); g.moveTo(18, 0); g.lineTo(18, h); g.stroke();
    // pencil scribble — someone's handwriting on the outside
    g.strokeStyle = 'rgba(55,55,65,.55)';
    g.lineWidth = 1.5;
    g.beginPath();
    let x = 30 + r() * 20, y = 50 + r() * 30;
    g.moveTo(x, y);
    for (let i = 0; i < 6; i++) {
      x += 8 + r() * 8;
      g.quadraticCurveTo(x - 4, y - 10 - r() * 6, x, y + (r() - 0.5) * 4);
    }
    g.stroke();
    const edge = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
    edge.addColorStop(0, 'rgba(0,0,0,0)');
    edge.addColorStop(1, 'rgba(150,110,50,.25)');
    g.fillStyle = edge;
    g.fillRect(0, 0, w, h);
  });
}

function stripeTexture() {
  return canvasTex(64, 512, (g, w, h) => {
    const cols = ['#c98d4a', '#c8272d', '#f0c23a', '#c98d4a', '#2c7a4a', '#c8272d', '#c98d4a', '#2a4f9a'];
    const bh = h / cols.length;
    cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * bh, w, bh + 1); });
  });
}

function fanShadowTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.translate(w / 2, h / 2);
    try { g.filter = 'blur(6px)'; } catch {}
    g.fillStyle = 'rgba(0,0,0,.9)';
    for (let i = 0; i < 3; i++) {
      g.save();
      g.rotate(i * TAU / 3);
      g.beginPath();
      g.ellipse(64, 0, 56, 16, 0.12, 0, TAU);
      g.fill();
      g.restore();
    }
    g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill();
  });
}

function glowTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

/* ─── World ───────────────────────────────────────────────────────── */

const SHOTS = {
  home:  { pos: [0, 2.3, 3.7],   look: [0, 0.3, -0.5],  orbit: 0.32 },
  menu:  { pos: [-1.6, 2.0, 3.1], look: [0.2, 0.25, -0.4], orbit: 0.12 },
  top:   { pos: [0, 4.0, 1.9],   look: [0, 0, -0.1],    orbit: 0.06 },
  mat:   { pos: [0.9, 2.6, 2.4], look: [0, 0, -0.1],    orbit: 0.08 },
  close: { pos: [0.2, 1.35, 1.7], look: [0, 0.05, -0.2], orbit: 0.04 },
  low:   { pos: [-0.7, 0.95, 2.5], look: [-0.2, 0.3, -0.5], orbit: 0.06 },
  score: { pos: [1.4, 2.1, 3.2], look: [0, 0.3, -0.5],  orbit: 0.2 },
  result: { pos: [0, 2.0, 3.1],  look: [0, 0.45, -0.2], orbit: 0.08 },
  overhead: { pos: [0, 3.6, 2.0], look: [0, 0.1, -0.05], orbit: 0.05 },
};

let instance = null;

export function initWorld3D(app) {
  if (instance) return instance;
  if (!supportsWebGL()) return null;
  instance = createWorld(app);
  return instance;
}

const SEATS = [
  { x: -1.05, z: -0.85 },  // back-left
  { x: 1.05, z: -0.85 },   // back-right
  { x: 1.25, z: 0.7 },     // front-right
  { x: -1.25, z: 0.7 },    // front-left
];


function createWorld() {
  const html = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'world3d';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const caption = document.createElement('div');
  caption.className = 'world-caption';
  caption.setAttribute('aria-hidden', 'true');
  document.body.appendChild(caption);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  /* Graphics levels. "ultra" draws at up to 3840 × 2160 on a screen that has those pixels. */
  const QUALITY = [
    { name: 'low', maxHeight: 720, dpr: 1, shadow: 1024, texture: 2, dust: false, frameMs: 1000 / 30 },
    { name: 'medium', maxHeight: 1080, dpr: 1.5, shadow: 1024, texture: 2, dust: true, frameMs: 1000 / 45 },
    { name: 'high', maxHeight: 1440, dpr: 2, shadow: 2048, texture: 3, dust: true, frameMs: 1000 / 60 },
    { name: 'ultra', maxHeight: 2160, dpr: 3, shadow: 4096, texture: 4, dust: true, frameMs: 1000 / 60 },
  ];
  const levelNamed = (name) => QUALITY.findIndex(q => q.name === name);
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  function automaticLevel() {
    if (memory <= 2 || cores <= 2) return levelNamed('low');
    const physicalHeight = Math.min(screen.width, screen.height) * (window.devicePixelRatio || 1);
    if (coarse) return memory <= 3 ? levelNamed('medium') : levelNamed('high');
    return physicalHeight >= 1800 ? levelNamed('ultra') : levelNamed('high');
  }
  // ?quality=ultra (or the choice in the profile) fixes the level; "auto" steps down when frames run slow
  let graphicsChoice = new URLSearchParams(location.search).get('quality') || settingsStore.get('graphics') || 'auto';
  if (levelNamed(graphicsChoice) < 0) graphicsChoice = 'auto';
  let quality = graphicsChoice === 'auto' ? automaticLevel() : levelNamed(graphicsChoice);
  Themes.setTextureDetail(QUALITY[quality].texture, Math.min(16, renderer.capabilities.getMaxAnisotropy()));
  setCharacterDetail(QUALITY[quality].texture / 4);

  const scene = new THREE.Scene();
  const BG = new THREE.Color('#1a0e09');
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 7, 15);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 40);

  /* Environment map so steel and marbles have something to reflect */
  {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const geo = new THREE.SphereGeometry(10, 16, 12);
    const top = new THREE.Color('#ffe2bf'), mid = new THREE.Color('#8a5a40'), bot = new THREE.Color('#24130c');
    const colors = [];
    const pos = geo.attributes.position;
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 10;
      if (y > 0) c.lerpColors(mid, top, y); else c.lerpColors(mid, bot, -y);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    envScene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4, 3) }));
    win.position.set(-7, 3, -3);
    win.lookAt(0, 0, 0);
    envScene.add(win);
    scene.environment = pmrem.fromScene(envScene, 0.03).texture;
    pmrem.dispose();
  }

  const std = (p) => new THREE.MeshStandardMaterial({ envMapIntensity: 0.35, ...p });

  /* Room shell */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), std({ map: Themes.floorTexture('redoxide'), roughness: 0.42, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = std({ map: Themes.wallTexture(['#e6dcc6', '#7fae95', '#4f7f68']), roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.5), wallMat);
  backWall.position.set(0, 2.25, -2.6);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const calendar = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.75), std({ map: Themes.calendarTexture('JUNE 1998'), roughness: 0.8 }));
  calendar.position.set(-1.1, 1.45, -2.585);
  calendar.rotation.z = 0.035;
  scene.add(calendar);

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8),
    new THREE.MeshBasicMaterial({ color: '#f4f8ff' }),
  );
  tube.rotation.z = Math.PI / 2;
  tube.position.set(0.4, 2.35, -2.55);
  scene.add(tube);

  buildRoomDetails(scene, wallMat, Math.min(16, renderer.capabilities.getMaxAnisotropy()));

  /* The mat */
  const MAT_W = 3.0, MAT_D = 2.0;
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(MAT_W, MAT_D), std({ map: Themes.matTexture('woven'), roughness: 0.95, bumpScale: 0.8 }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.y = 0.004;
  mat.material.bumpMap = mat.material.map;
  mat.receiveShadow = true;
  scene.add(mat);

  /* Lighting: evening sun through a grilled window, tubelight, hemisphere fill */
  const sunTarget = new THREE.Object3D();
  scene.add(sunTarget);
  const sunDir = new THREE.Vector3(6, -4.3, 2.4).normalize();
  const sun = new THREE.DirectionalLight('#ffb36a', 3.2);
  sun.position.copy(sunDir).multiplyScalar(-11);
  sun.target = sunTarget;
  sun.castShadow = true;
  sun.shadow.mapSize.set(QUALITY[quality].shadow, QUALITY[quality].shadow);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 22 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // Window wall + grill that only exists to cast the sunlight patch. Its
  // material writes neither colour nor depth, so only the shadow pass sees it.
  {
    const grill = new THREE.Group();
    const hidden = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const add = (w, h, x, y) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), hidden);
      m.position.set(x, y, 0);
      m.castShadow = true;
      m.renderOrder = -1;
      grill.add(m);
    };
    const WW = 2.1, WH = 1.7, BIG = 8;
    add(BIG, BIG, -(WW / 2 + BIG / 2), 0);  // wall left of window
    add(BIG, BIG, WW / 2 + BIG / 2, 0);     // wall right
    add(WW, BIG, 0, WH / 2 + BIG / 2);      // above
    add(WW, BIG, 0, -(WH / 2 + BIG / 2));   // below
    for (let x = -WW / 2 + 0.21; x < WW / 2 - 0.1; x += 0.21) add(0.035, WH, x, 0);
    add(WW, 0.05, 0, 0.15);
    add(0.06, WH, 0, 0);
    grill.position.copy(sunDir).multiplyScalar(-4.2);
    grill.lookAt(0, 0, 0);
    scene.add(grill);
  }

  const hemi = new THREE.HemisphereLight('#f6d6b4', '#3a2018', 0.7);
  scene.add(hemi);
  const tubeLight = new THREE.PointLight('#e8f0ff', 14, 0, 2);
  tubeLight.position.set(0.4, 2.3, -2.3);
  scene.add(tubeLight);

  /* Ceiling-fan shadow sweeping the mat */
  const fanShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.6),
    new THREE.MeshBasicMaterial({ map: fanShadowTexture(), transparent: true, opacity: 0.17, depthWrite: false }),
  );
  fanShadow.rotation.x = -Math.PI / 2;
  fanShadow.position.set(0.2, 0.012, -0.2);
  scene.add(fanShadow);

  /* The four chits */
  const paperSide = std({ color: '#efe4c8', roughness: 0.9 });
  const chits = [];
  for (let i = 0; i < 4; i++) {
    const paper = std({ map: paperTexture(3 + i), roughness: 0.85 });
    const mats = [paperSide, paperSide, paper, paper, paperSide, paperSide];
    const group = new THREE.Group();
    const half = new THREE.BoxGeometry(0.15, 0.008, 0.15);
    const left = new THREE.Mesh(half, mats);
    left.position.set(-0.074, 0.013, 0);
    left.rotation.z = 0.13;
    const right = new THREE.Mesh(half, mats);
    right.position.set(0.074, 0.013, 0);
    right.rotation.z = -0.13;
    [left, right].forEach(m => { m.castShadow = true; m.receiveShadow = true; group.add(m); });
    group.position.set(-0.9 + i * 0.6, 0.006, (i % 2 ? 0.25 : -0.2));
    group.rotation.y = i * 1.3;
    scene.add(group);
    chits.push({ mesh: group, flight: null, picked: false, phase: i * 1.7 });
  }

  /* The four people playing */
  const heldPaper = std({ map: paperTexture(42), roughness: 0.85 });
  const STARTING_CAST = ['office-man', 'saree-lady', 'hoodie-teen', 'college-girl'];
  const actors = SEATS.map((seat, i) => createCharacter(scene, lookOf(STARTING_CAST[i]), { seat, paperMaterial: heldPaper }));
  let country = COUNTRIES.IN;
  const roleInfo = (slot) => country.roles[slot] || null;
  const roleAcc = (slot) => roleInfo(slot)?.acc || null;

  /* Props */
  const props = new THREE.Group();
  scene.add(props);
  const shadowy = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

  // Spinning top
  const top = new THREE.Group();
  const topTilt = new THREE.Group();
  const topSpin = new THREE.Group();
  {
    const prof = [[0, 0.012], [0.012, 0.016], [0.05, 0.055], [0.083, 0.1], [0.088, 0.122], [0.07, 0.15], [0.03, 0.165], [0.022, 0.2], [0, 0.21]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    const body = shadowy(new THREE.Mesh(new THREE.LatheGeometry(prof, 20), std({ map: stripeTexture(), roughness: 0.5 })));
    const tip = shadowy(new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.016, 6), std({ color: '#9aa3ab', metalness: 1, roughness: 0.3, envMapIntensity: 1 })));
    tip.rotation.x = Math.PI;
    tip.position.y = 0.008;
    topSpin.add(body, tip);
  }
  topTilt.add(topSpin);
  top.add(topTilt);
  const TOP_AT = { x: 0.15, z: 1.4 };
  top.position.set(TOP_AT.x, 0, TOP_AT.z);
  props.add(top);

  // Glass marbles
  {
    const glass = std({ color: '#cdeeff', transparent: true, opacity: 0.5, roughness: 0.04, envMapIntensity: 1.6 });
    const swirl = ['#e63b2e', '#2e8be6', '#f2c12e', '#2ec46a', '#e63b9a', '#f28a2e'];
    const spots = [[2.05, -0.05], [2.18, -0.12], [2.1, -0.25], [2.32, 0.05], [2.48, -0.2], [2.23, -0.4]];
    spots.forEach(([x, z], i) => {
      const m = shadowy(new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 10), glass));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), std({ color: swirl[i], roughness: 0.3, emissive: swirl[i], emissiveIntensity: 0.15 }));
      core.scale.set(1, 0.45, 1.2);
      core.rotation.set(i, i * 2, 0);
      m.add(core);
      m.position.set(x, 0.038, z);
      props.add(m);
    });
  }

  // Ball (cricket / baseball / ping-pong depending on the country)
  const ballMat = std({ color: '#8e1b14', roughness: 0.38 });
  const seamMat = std({ color: '#eadcc2', roughness: 0.7 });
  const ball = shadowy(new THREE.Mesh(new THREE.SphereGeometry(1, 22, 14), ballMat));
  {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(1.006, 0.055, 5, 40), seamMat);
    seam.rotation.set(0.4, 0.9, 0);
    ball.add(seam);
    ball.scale.setScalar(0.075);
    ball.position.set(2.05, 0.075, 1.25);
    props.add(ball);
  }


  // Steel tumbler of chai
  {
    const prof = [[0, 0], [0.05, 0], [0.052, 0.004], [0.062, 0.145], [0.064, 0.15], [0.059, 0.15], [0.049, 0.007], [0, 0.007]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    const glass = shadowy(new THREE.Mesh(
      new THREE.LatheGeometry(prof, 24),
      std({ color: '#dfe4ea', metalness: 1, roughness: 0.2, envMapIntensity: 1.3, side: THREE.DoubleSide }),
    ));
    const chai = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), std({ color: '#a0602c', roughness: 0.25 }));
    chai.rotation.x = -Math.PI / 2;
    chai.position.y = 0.105;
    glass.add(chai);
    glass.position.set(-2.0, 0, -0.1);
    props.add(glass);
  }

  // Pencil that wrote the chits
  {
    const pencil = new THREE.Group();
    const body = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.16, 6), std({ color: '#e8b923', roughness: 0.5 })));
    const wood = shadowy(new THREE.Mesh(new THREE.ConeGeometry(0.0065, 0.022, 6), std({ color: '#e0bc8a', roughness: 0.8 })));
    wood.position.y = 0.091;
    const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.0066, 0.0066, 0.012, 6), std({ color: '#d4606a', roughness: 0.9 }));
    eraser.position.y = -0.086;
    pencil.add(body, wood, eraser);
    pencil.rotation.set(0, 0.7, Math.PI / 2);
    pencil.position.set(0.5, 0.0105, 0.72);
    props.add(pencil);
  }

  // Old CRT TV on a stool, playing static
  const tvCanvas = document.createElement('canvas');
  tvCanvas.width = 160;
  tvCanvas.height = 120;
  const tvCtx = tvCanvas.getContext('2d');
  const tvImage = tvCtx.createImageData(160, 120);
  const tvTex = new THREE.CanvasTexture(tvCanvas);
  tvTex.colorSpace = THREE.SRGBColorSpace;
  const tvScreenMat = new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false });
  const tvLight = new THREE.PointLight('#9bbcff', 1.4, 3.5, 2);
  {
    const tv = new THREE.Group();
    const stool = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.6), std({ color: '#5a3a22', roughness: 0.7 })));
    stool.position.y = 0.225;
    const cab = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 0.55), std({ color: '#2b2724', roughness: 0.55 })));
    cab.position.y = 0.45 + 0.28;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.38), tvScreenMat);
    screen.position.set(-0.06, 0.73, 0.277);
    const knobMat = std({ color: '#b8b0a4', roughness: 0.4, metalness: 0.4 });
    [0.6, 0.78].forEach(y => {
      const k = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), knobMat);
      k.rotation.x = Math.PI / 2;
      k.position.set(0.28, y, 0.28);
      tv.add(k);
    });
    const antMat = std({ color: '#c9ccd0', metalness: 1, roughness: 0.3, envMapIntensity: 1 });
    [-0.45, 0.5].forEach(rz => {
      const a = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.55, 4), antMat));
      a.position.set(Math.sin(-rz) * 0.27, 1.01 + Math.cos(rz) * 0.27, 0);
      a.rotation.z = rz;
      tv.add(a);
    });
    tvLight.position.set(-0.06, 0.73, 0.6);
    tv.add(stool, cab, screen, tvLight);
    tv.position.set(2.15, 0, -1.85);
    tv.rotation.y = -0.55;
    scene.add(tv);
  }

  // Candle for when the light goes
  const candle = new THREE.Group();
  const candleLight = new THREE.PointLight('#ff9a3c', 0, 5, 2);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false }));
  const flameGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ff9a3c', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  {
    const wax = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.15, 12), std({ color: '#f6f0e2', roughness: 0.6 })));
    wax.position.y = 0.075;
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.008, 16), std({ color: '#cfd4da', metalness: 1, roughness: 0.25, envMapIntensity: 1 }));
    plate.position.y = 0.004;
    flame.scale.set(1, 2.1, 1);
    flame.position.y = 0.185;
    flameGlow.scale.set(0.35, 0.35, 1);
    flameGlow.position.y = 0.19;
    candleLight.position.y = 0.3;
    candle.add(plate, wax, flame, flameGlow, candleLight);
    candle.position.set(0, 0, -1.25);
    candle.scale.setScalar(0.001);
    scene.add(candle);
  }

  /* Dust motes floating in the sunbeam */
  const DUST = 140;
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  {
    const r = rng(99);
    for (let i = 0; i < DUST; i++) {
      const t = r() * 3.6;
      dustPos[i * 3] = -sunDir.x * t + (r() - 0.5) * 1.8;
      dustPos[i * 3 + 1] = 0.2 + (-sunDir.y) * t + (r() - 0.5) * 0.6;
      dustPos[i * 3 + 2] = -sunDir.z * t + (r() - 0.5) * 1.6;
      dustSeed[i] = r() * TAU;
    }
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustBase = dustPos.slice();
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    map: glowTexture(), color: '#ffd9a3', size: 0.016, transparent: true, opacity: 0.8,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  /* ─── State ─────────────────────────────────────────────────── */
  let enabled = true;
  let reduced = false;
  let running = false;
  let rafId = 0;
  let last = 0, lastRender = 0, time = 0;
  let distMul = 1;
  let shot = SHOTS.home;
  const camPos = new THREE.Vector3(...SHOTS.home.pos);
  const camLook = new THREE.Vector3(...SHOTS.home.look);
  const tmpPos = new THREE.Vector3(), tmpLook = new THREE.Vector3(), tmpOff = new THREE.Vector3();
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let paused = false;
  let talkShot = null, talkUntil = 0, lastCut = -10;
  let powerTarget = 1, power = 1, fanSpeed = 1, restoreAt = -100;
  let tvFrame = 0;
  let captionTimer = 0;
  let snapCamera = true;

  function readMotion(settings) {
    const s = settings || settingsStore.getAll();
    const os = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    reduced = !!(s.reducedMotion || os || s.animationsEnabled === false);
  }
  readMotion();

  function showCaption(text) {
    if (!enabled) return;
    caption.textContent = text;
    caption.classList.add('world-caption--show');
    clearTimeout(captionTimer);
    captionTimer = setTimeout(() => caption.classList.remove('world-caption--show'), 1800);
  }

  function layout() {
    const r = Math.random;
    const out = [];
    for (let i = 0; i < chits.length; i++) {
      let p, tries = 0;
      do {
        // centre of the mat, clear of the actors' laps
        p = new THREE.Vector3((r() - 0.5) * 1.5, 0.006, (r() - 0.5) * 0.8 - 0.05);
        tries++;
      } while (tries < 40 && out.some(q => q.distanceTo(p) < 0.36));
      out.push(p);
    }
    return out;
  }

  function launch(chit, to, { height = 0.8, dur = 0.9, delay = 0, spin = true, onDone } = {}) {
    const m = chit.mesh;
    m.visible = true;
    if (reduced) {
      m.position.copy(to);
      m.rotation.set(0, Math.random() * TAU, 0);
      chit.flight = null;
      onDone?.();
      return;
    }
    const sgn = () => (Math.random() < 0.5 ? -1 : 1);
    chit.flight = {
      from: m.position.clone(), to: to.clone(), h: height, t: -delay, dur,
      ry0: m.rotation.y, ry1: m.rotation.y + (Math.random() - 0.5) * 5,
      sx: spin ? sgn() * (1 + Math.floor(Math.random() * 2)) : 0,
      sz: spin && Math.random() < 0.5 ? sgn() : 0,
      onDone,
    };
  }

  function tossAll({ high = false, from = null } = {}) {
    const spots = layout();
    chits.forEach((c, i) => {
      c.picked = false;
      if (!c.mesh.visible || from) {
        if (from) c.mesh.position.copy(from);
        else c.mesh.position.set((Math.random() - 0.5) * 2, 3.4, 2.4 + Math.random());
        c.mesh.visible = true;
      }
      launch(c, spots[i], { height: high ? 1.6 : 0.7 + Math.random() * 0.4, dur: high ? 1.3 : 0.85 + Math.random() * 0.2, delay: i * 0.09 });
    });
    audioManager.play('paper-toss');
  }

  function setPower(on) {
    const target = on ? 1 : 0;
    if (target === powerTarget) return;
    powerTarget = target;
    if (on) {
      restoreAt = time;
      audioManager.play('power-on');
      showCaption(country.outage.on);
    } else {
      audioManager.play('power-cut');
      showCaption(country.outage.off);
    }
  }

  /* ─── Choreography ─────────────────────────────────────── */
  const MAT_CENTER = new THREE.Vector3(0, 0, -0.05);
  let timeline = [];
  let detectiveScan = null;      // { actor, others, next, i }
  const v1 = new THREE.Vector3();

  const after = (sec, fn) => timeline.push({ at: time + (reduced ? 0 : sec), fn });

  function resetActors() {
    detectiveScan = null;
    actors.forEach(a => {
      a.setPose('idle');
      a.lookAt(MAT_CENTER);
      a.showRole(null);
      a.setAccessory(null);
      a.holdChit(false);
    });
  }

  // Someone leans in, the nearest chit goes into their hand, and it leaves the mat for good
  function actorPicksChit(actor, { peek } = {}) {
    const reach = actor.reachPoint(v1).clone();
    const c = chits
      .filter(ch => !ch.picked && ch.mesh.visible)
      .sort((a, b) => a.mesh.position.distanceTo(reach) - b.mesh.position.distanceTo(reach))[0];
    actor.setPose('reach');
    actor.lookAt(c ? c.mesh.position : MAT_CENTER);
    const done = () => {
      actor.holdChit(true);
      actor.lookAt(null);
      actor.setPose(peek ? 'peek' : 'hold');
    };
    if (!c) { done(); return; }
    c.picked = true;
    launch(c, reach, {
      height: 0.12, dur: 0.6, spin: false, delay: reduced ? 0 : 0.25,
      onDone: () => { c.mesh.visible = false; done(); },
    });
  }

  // All four chits, folded, in one small pile in the middle of the mat
  function gatherChits(animate = true) {
    chits.forEach((c, i) => {
      c.picked = false;
      const spot = new THREE.Vector3(MAT_CENTER.x + (i - 1.5) * 0.015, 0.006 + i * 0.022, MAT_CENTER.z + ((i % 2) - 0.5) * 0.02);
      if (animate && c.mesh.visible) launch(c, spot, { height: 0.1, dur: 0.45, spin: false, delay: i * 0.05 });
      else {
        c.flight = null;
        c.mesh.visible = true;
        c.mesh.position.copy(spot);
        c.mesh.rotation.set(0, i * 0.7, 0);
      }
    });
  }

  function headOf(actor) { return actor.headWorld(new THREE.Vector3()); }

  const shotOnActor = (actor, { y = 1.5, back = 2.0, lift = 0 } = {}) => () => {
    const h = headOf(actor);
    return {
      pos: [h.x * 0.55, y, h.z + back],
      look: [h.x * 0.85, h.y - 0.15 + lift, h.z],
      orbit: 0.03,
    };
  };

  /* Conversation camera: whoever talks fills the frame, seen over the shoulder of whoever they talk to */
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tDir = new THREE.Vector3();
  const talkFraming = (speaker, listener) => () => {
    const S = actors[speaker].headWorld(tA);
    const narrow = camera.aspect < 0.8;
    if (listener != null && actors[listener]) {
      const L = actors[listener].headWorld(tB);
      tDir.copy(S).sub(L); tDir.y = 0; tDir.normalize();
      const back = narrow ? 0.72 : 0.46;
      // the shoulder on the side away from the room's centre keeps the third player out of the way
      const px = -tDir.z, pz = tDir.x;
      const side = (L.x + px) ** 2 + (L.z + pz) ** 2 > (L.x - px) ** 2 + (L.z - pz) ** 2 ? 1 : -1;
      return {
        pos: [L.x - tDir.x * back + side * px * 0.2, Math.max(0.55, L.y + 0.17), L.z - tDir.z * back + side * pz * 0.2],
        look: [S.x, S.y - 0.03, S.z], orbit: 0, exact: true,
      };
    }
    // talking to the whole table: straight on, from the middle of the mat
    tDir.set(MAT_CENTER.x - S.x, 0, MAT_CENTER.z - S.z).normalize();
    const d = narrow ? 1.35 : 1.0;
    return { pos: [S.x + tDir.x * d, S.y + 0.06, S.z + tDir.z * d], look: [S.x, S.y - 0.05, S.z], orbit: 0, exact: true };
  };
  // the head high in the frame, the profile panel below it
  const portraitFraming = (seat) => () => {
    const H = actors[seat].headWorld(tA);
    tDir.set(MAT_CENTER.x - H.x, 0, MAT_CENTER.z - H.z).normalize();
    const d = camera.aspect < 0.8 ? 1.75 : 1.05;
    return { pos: [H.x + tDir.x * d, H.y + 0.03, H.z + tDir.z * d], look: [H.x, H.y - (camera.aspect < 0.8 ? 0.34 : 0.1), H.z], orbit: 0, exact: true };
  };

  function startGuesserScan(guesser, acc = 'cap') {
    const others = actors.filter(a => a !== guesser);
    detectiveScan = { actor: guesser, others, next: 0, i: 0 };
    guesser.setAccessory(acc);
    guesser.setPose('think');
    others.forEach(a => {
      a.setPose('nervous');
      a.lookAt(headOf(guesser));
    });
  }

  function updateActors(dt) {
    if (timeline.length) {
      const due = timeline.filter(e => e.at <= time);
      if (due.length) {
        timeline = timeline.filter(e => e.at > time);
        due.forEach(e => { try { e.fn(); } catch (err) { console.error(err); } });
      }
    }
    if (detectiveScan && time > detectiveScan.next) {
      const { actor, others } = detectiveScan;
      detectiveScan.next = time + 1.1 + Math.random() * 0.8;
      detectiveScan.i = (detectiveScan.i + 1 + Math.floor(Math.random() * 2)) % others.length;
      actor.lookAt(headOf(others[detectiveScan.i]));
    }
    actors.forEach(a => a.update(dt, time, reduced));
    updateTags();
    updateBubbles();
  }

  /* ─── Per-frame update ──────────────────────────────────────── */
  function updateTv() {
    const d = tvImage.data;
    const roll = (time * 30) % 120;
    for (let y = 0; y < 120; y++) {
      const band = Math.abs(y - roll) < 6 ? 60 : 0;
      for (let x = 0; x < 160; x++) {
        const v = Math.min(255, (Math.random() * 200 + band) | 0);
        const i = (y * 160 + x) * 4;
        d[i] = v * 0.92; d[i + 1] = v * 0.96; d[i + 2] = v; d[i + 3] = 255;
      }
    }
    tvCtx.putImageData(tvImage, 0, 0);
    tvTex.needsUpdate = true;
  }

  function update(dt) {
    const motion = reduced ? 0 : 1;

    // Power / tubelight flicker
    if (powerTarget === 0) {
      power = damp(power, 0, 7, dt);
    } else {
      const s = time - restoreAt;
      const f = s < 0.08 ? 1 : s < 0.22 ? 0.05 : s < 0.3 ? 0.85 : s < 0.55 ? 0.08 : s < 0.62 ? 1 : s < 0.72 ? 0.3 : 1;
      power = reduced ? damp(power, 1, 6, dt) : f;
    }
    fanSpeed = damp(fanSpeed, powerTarget, powerTarget ? 0.9 : 0.45, dt);

    hemi.intensity = 0.22 + 0.5 * power;
    tubeLight.intensity = 14 * power;
    tube.material.color.setScalar(0.15 + 0.85 * power);
    sun.intensity = damp(sun.intensity, powerTarget ? 3.2 : 1.3, 2, dt);  // dusk deepens during the power cut
    renderer.toneMappingExposure = 0.95 + 0.2 * power;

    fanShadow.rotation.z -= fanSpeed * (reduced ? 2 : 14) * dt;
    fanShadow.material.opacity = 0.17 * power;

    // Candle
    const candleOn = 1 - power;
    const cs = damp(candle.scale.x, powerTarget ? 0.001 : 1, 5, dt);
    candle.scale.setScalar(cs);
    const flick = 0.85 + Math.sin(time * 23) * 0.06 + Math.sin(time * 37 + 1) * 0.05 + (Math.random() - 0.5) * 0.08 * motion;
    candleLight.intensity = 2.2 * candleOn * flick;
    flame.scale.set(1, 2.1 * flick, 1);
    flameGlow.material.opacity = 0.9 * flick;

    // TV
    tvLight.intensity = (1.2 + Math.random() * 0.4 * motion) * power;
    tvScreenMat.color.setScalar(power);
    if (power > 0.05 && (tvFrame++ % 2 === 0) && (motion || tvFrame < 3)) updateTv();

    // Lattu spin + precession
    topSpin.rotation.y += (reduced ? 3 : 32) * dt;
    topTilt.rotation.z = reduced ? 0.04 : 0.06 + Math.sin(time * 0.7) * 0.03;
    top.rotation.y += (reduced ? 0.2 : 2.2) * dt;
    if (!reduced) top.position.set(TOP_AT.x + Math.cos(time * 0.9) * 0.06, 0, TOP_AT.z + Math.sin(time * 0.9) * 0.06);

    // Dust
    if (motion) {
      const p = dustGeo.attributes.position.array;
      for (let i = 0; i < DUST; i++) {
        const s = dustSeed[i];
        p[i * 3] = dustBase[i * 3] + Math.sin(time * 0.21 + s) * 0.12;
        p[i * 3 + 1] = dustBase[i * 3 + 1] + Math.sin(time * 0.17 + s * 2) * 0.18;
        p[i * 3 + 2] = dustBase[i * 3 + 2] + Math.cos(time * 0.19 + s) * 0.12;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }
    dust.material.opacity = 0.35 + 0.5 * (powerTarget ? 1 : 0.4);

    // Chits rest where they land; they only move when someone throws or picks them
    for (const c of chits) {
      const m = c.mesh;
      const f = c.flight;
      if (f) {
        f.t += dt;
        if (f.t < 0) continue;
        const p = clamp01(f.t / f.dur);
        const e = easeOut(p);
        m.position.x = f.from.x + (f.to.x - f.from.x) * e;
        m.position.z = f.from.z + (f.to.z - f.from.z) * e;
        m.position.y = f.from.y + (f.to.y - f.from.y) * p + 4 * f.h * p * (1 - p);
        m.rotation.x = f.sx * TAU * e;
        m.rotation.z = f.sz * TAU * e;
        m.rotation.y = f.ry0 + (f.ry1 - f.ry0) * e;
        if (p >= 1) {
          c.flight = null;
          m.rotation.x = 0;
          m.rotation.z = 0;
          f.onDone?.();
        }
      }
    }

    // Camera: damped move to the shot + slow orbit + camcorder hand-shake + pointer parallax
    pointer.sx = damp(pointer.sx, pointer.x, 3, dt);
    pointer.sy = damp(pointer.sy, pointer.y, 3, dt);
    updateActors(dt);
    const talking = talkShot && time < talkUntil;
    const framing = portraitShot || (talking ? talkShot : shot);
    const sh = typeof framing === 'function' ? framing() : framing;
    tmpLook.set(...sh.look);
    tmpOff.set(...sh.pos).sub(tmpLook).multiplyScalar(sh.exact ? 1 : distMul);
    if (distMul > 1 && !sh.exact) {
      // portrait phones: look more top-down so the mat fills the frame
      tmpOff.y *= 1 + (distMul - 1) * 0.5;
      tmpLook.y *= 0.2;
      tmpLook.z += 0.3;
    }
    tmpOff.applyAxisAngle(THREE.Object3D.DEFAULT_UP, Math.sin(time * 0.09) * sh.orbit * motion);
    tmpPos.copy(tmpLook).add(tmpOff);
    tmpPos.x += pointer.sx * 0.3 * motion;
    tmpPos.y += pointer.sy * 0.15 * motion;
    if (snapCamera || reduced) {
      camPos.copy(tmpPos);
      camLook.copy(tmpLook);
      snapCamera = false;
    } else {
      const k = sh.exact ? 3.4 : 1.5;
      camPos.set(damp(camPos.x, tmpPos.x, k, dt), damp(camPos.y, tmpPos.y, k, dt), damp(camPos.z, tmpPos.z, k, dt));
      camLook.set(damp(camLook.x, tmpLook.x, k, dt), damp(camLook.y, tmpLook.y, k, dt), damp(camLook.z, tmpLook.z, k, dt));
    }
    camera.position.copy(camPos);
    camera.position.x += Math.sin(time * 0.71) * 0.025 * motion;
    camera.position.y += Math.sin(time * 1.13 + 1) * 0.018 * motion;
    camera.lookAt(camLook);
    camera.rotation.z += Math.sin(time * 0.53) * 0.006 * motion;
  }

  /* If the device can't keep up, draw fewer pixels instead of stuttering. */
  let slowMs = 0, warmUntil = 0;
  function applyQuality() {
    const q = QUALITY[quality];
    dust.visible = q.dust;
    if (sun.shadow.mapSize.x !== q.shadow) {
      sun.shadow.mapSize.set(q.shadow, q.shadow);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    resize();
  }
  function watchPerformance(frameMs, now) {
    if (graphicsChoice !== 'auto' || now < warmUntil || quality === 0) return;   // ignore shader warm-up
    if (frameMs > 42) slowMs += frameMs; else slowMs = Math.max(0, slowMs - frameMs * 0.5);
    if (slowMs > 3000) {
      quality -= 1;
      slowMs = 0;
      warmUntil = now + 2500;
      applyQuality();
      console.info('[World3D] graphics level:', QUALITY[quality].name);
    }
  }

  function resize() {
    const W = window.innerWidth || 1, H = window.innerHeight || 1;
    const q = QUALITY[quality];
    const ratio = Math.min(window.devicePixelRatio || 1, q.dpr);
    const k = Math.min(ratio, q.maxHeight / Math.min(W, H), 3840 / Math.max(W, H));
    renderer.setSize(Math.max(1, Math.round(W * k)), Math.max(1, Math.round(H * k)), false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const aspect = W / H;
    distMul = aspect < 1.25 ? Math.min(1.55, Math.max(1, 1.2 / aspect)) : 1;
    scene.fog.near = 7 * distMul;
    scene.fog.far = 15 * distMul;
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - lastRender < QUALITY[quality].frameMs - 2) return;
    watchPerformance(now - lastRender, now);
    lastRender = now;
    const dt = paused ? 0 : Math.min(0.1, (now - last) / 1000);
    last = now;
    time += dt;
    try {
      update(dt);
      renderer.render(scene, camera);
    } catch (e) {
      // one bad frame must never freeze the room; report it once
      if (!frameErrorShown) { frameErrorShown = true; console.error('[World3D] frame error:', e); }
    }
  }
  let frameErrorShown = false;

  function start() {
    if (running || !enabled || document.hidden) return;
    running = true;
    last = lastRender = performance.now();
    warmUntil = last + 4000;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function setEnabled(on) {
    enabled = !!on;
    html.classList.toggle('has-world', enabled);
    canvas.hidden = !enabled;
    if (enabled) start(); else { stop(); caption.classList.remove('world-caption--show'); }
  }

  /* ─── Wiring ────────────────────────────────────────────────── */
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); });
  canvas.addEventListener('webglcontextrestored', () => start());

  gameBus.on(EVENTS.SETTINGS_CHANGED, (payload = {}) => {
    const s = payload.settings || {};
    if (payload.settings) readMotion(s);
  });

  /* ─── Story API: how the game screen directs the room ───────── */
  const bubbleLayer = document.createElement('div');
  bubbleLayer.className = 'player-bubbles';
  bubbleLayer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bubbleLayer);
  const bubbles = actors.map((_, i) => {
    const b = document.createElement('div');
    b.className = `player-bubble player-bubble--${i}`;
    bubbleLayer.appendChild(b);
    return { el: b, until: 0, typer: 0 };
  });
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const proj = new THREE.Vector3();

  // Names are HTML above the canvas, not sprites inside it: the room renders at a low
  // resolution, so anything drawn in 3D would come out blurred and pixelated.
  const tagLayer = document.createElement('div');
  tagLayer.className = 'player-tags';
  tagLayer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tagLayer);
  const tags = actors.map(() => {
    const el = document.createElement('div');
    el.className = 'player-tag';
    el.hidden = true;
    tagLayer.appendChild(el);
    return { el, text: null, width: 0 };
  });
  // an opened chit, same idea: real text, so the role can always be read
  const roleCards = actors.map(() => {
    const el = document.createElement('div');
    el.className = 'player-chit';
    el.hidden = true;
    const emoji = document.createElement('span');
    const name = document.createElement('strong');
    el.append(emoji, name);
    tagLayer.appendChild(el);
    return { el, emoji, name, role: null, width: 0 };
  });
  function placeLabel(label, angle = '') {
    const W = window.innerWidth, H = window.innerHeight;
    proj.project(camera);
    const y = (1 - proj.y) / 2 * H;
    const off = proj.z > 1 || y < 0 || y > H + 24;
    label.el.style.visibility = off ? 'hidden' : 'visible';
    if (off) return;
    // stays whole at the screen edges, where a player can sit partly out of view on phones
    const half = label.width / 2 + 4;
    const x = half * 2 > W ? W / 2 : Math.max(half, Math.min(W - half, (proj.x + 1) / 2 * W));
    label.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)${angle}`;
  }

  function updateTags() {
    roleCards.forEach((chit, i) => {
      const role = actors[i].shownRole;
      if (role !== chit.role) {
        chit.role = role;
        chit.el.hidden = !role;
        if (role) {
          chit.emoji.textContent = role.emoji;
          chit.name.textContent = role.name.toUpperCase();
          chit.name.style.color = role.color;
          chit.width = chit.el.offsetWidth;
        }
      }
      if (!role) return;
      actors[i].handWorld(proj);
      proj.y += 0.1;
      placeLabel(chit, i % 2 ? ' rotate(2deg)' : ' rotate(-2deg)');
    });
    tags.forEach((tag, i) => {
      const text = actors[i].name;
      if (text !== tag.text) {
        tag.text = text;
        tag.el.textContent = text || '';
        tag.el.hidden = !text;
        tag.width = text ? tag.el.offsetWidth : 0;
      }
      if (!text) return;
      actors[i].headWorld(proj);
      proj.y += 0.3;
      placeLabel(tag);
    });
  }

  function updateBubbles() {
    if (!story.active) return;
    const W = window.innerWidth, H = window.innerHeight;
    bubbles.forEach((b, i) => {
      if (!b.el.classList.contains('player-bubble--show')) return;
      if (time > b.until) { b.el.classList.remove('player-bubble--show'); return; }
      actors[i].headWorld(proj);
      proj.y += 0.5;
      proj.project(camera);
      const off = proj.z > 1;
      const half = Math.min(120, W * 0.24);
      const x = Math.max(half, Math.min(W - half, (proj.x + 1) / 2 * W));
      // keep clear of the score chips at the top and the prompts at the bottom,
      // scaled for short landscape phones as well as tall screens
      const top = Math.min(190, H * 0.3), bottom = Math.min(150, H * 0.24);
      const y = Math.max(top, Math.min(H - bottom, (1 - proj.y) / 2 * H));
      b.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      b.el.style.visibility = off ? 'hidden' : 'visible';
    });
  }

  /* Room textures are kept for the last few games, so swiping back is instant. */
  const themeCache = new Map();
  function themed(key, make, inUse) {
    let t = themeCache.get(key);
    if (!t) {
      t = make();
      themeCache.set(key, t);
      if (themeCache.size > 12) {
        for (const [k, old] of themeCache) {
          if (!inUse.includes(old)) { themeCache.delete(k); old.dispose(); break; }
        }
      }
    }
    return t;
  }
  let themeTimer = 0;
  function applyTheme(c) {
    clearTimeout(themeTimer);
    const t = c.theme;
    const inUse = [floor.material.map, mat.material.map, wallMat.map, calendar.material.map];
    const put = (material, texture) => { material.map = texture; material.needsUpdate = true; };
    put(floor.material, themed(`floor|${t.floor}`, () => Themes.floorTexture(t.floor), inUse));
    put(mat.material, themed(`mat|${t.mat}`, () => Themes.matTexture(t.mat), inUse));
    mat.material.bumpMap = mat.material.map;
    put(wallMat, themed(`wall|${t.wall.join()}`, () => Themes.wallTexture(t.wall), inUse));
    put(calendar.material, themed(`month|${t.month}`, () => Themes.calendarTexture(t.month), inUse));
    const b = Themes.BALL_COLORS[t.ball] || Themes.BALL_COLORS.cricket;
    ballMat.color.set(b.body);
    seamMat.color.set(b.seam);
    ball.scale.setScalar(b.r);
    ball.position.y = b.r;
  }

  let portraitShot = null;
  const dressAll = (list) => list?.forEach((p, i) => { if (p?.look && actors[i]) actors[i].setLook(p.look); });

  const story = {
    active: false,
    get country() { return country; },
    get quality() { return QUALITY[quality].name; },
    get graphics() { return graphicsChoice; },
    // swiping through games stays smooth: the room repaints once the swipe settles
    setCountry(c, { soon = false } = {}) {
      if (!c) return;
      country = c;
      clearTimeout(themeTimer);
      if (soon) themeTimer = setTimeout(() => applyTheme(c), 140);
      else applyTheme(c);
    },
    setGraphics(choice) {
      graphicsChoice = levelNamed(choice) >= 0 ? choice : 'auto';
      quality = graphicsChoice === 'auto' ? automaticLevel() : levelNamed(graphicsChoice);
      slowMs = 0;
      warmUntil = performance.now() + 2500;
      Themes.setTextureDetail(QUALITY[quality].texture);
      setCharacterDetail(QUALITY[quality].texture / 4);
      themeCache.forEach(t => t.dispose());
      themeCache.clear();
      applyQuality();
      applyTheme(country);
    },
    /** The people at the table on the start screen: [{ name, look }] */
    preview(list) {
      dressAll(list);
      actors.forEach((a, i) => a.setName(list?.[i]?.label || list?.[i]?.name || null));
    },
    setLook(i, look) { actors[i]?.setLook(look); },
    lookKeyOf: lookKey,
    portrait(seat) { portraitShot = seat == null ? null : portraitFraming(seat); },
    setPaused(on) { paused = !!on; },
    begin(list) {
      story.active = true;
      html.classList.add('story-mode');
      setEnabled(true);
      timeline = [];
      talkShot = null;
      portraitShot = null;
      resetActors();
      setPower(true);
      shot = camera.aspect < 0.8 ? SHOTS.overhead : SHOTS.home;
      dressAll(list);
      list.forEach((p, i) => actors[i].setName(p.label || p.name));
      gatherChits(false);
    },
    end() {
      if (!story.active) return;
      story.active = false;
      html.classList.remove('story-mode');
      bubbles.forEach(b => { clearInterval(b.typer); b.el.classList.remove('player-bubble--show'); });
      timeline = [];
      talkShot = null;
      resetActors();
      actors.forEach(a => a.setName(null));
      setPower(true);
    },
    say(i, text, ms) {
      const b = bubbles[i];
      if (!b || !story.active) return 0;
      const dur = ms || Math.min(4200, 1100 + text.length * 55);
      clearInterval(b.typer);
      b.el.textContent = '';
      b.el.classList.add('player-bubble--show');
      b.until = time + dur / 1000;
      let n = 0;
      const chars = [...text];
      if (reduced) b.el.textContent = text;
      else b.typer = setInterval(() => {
        n += 2;
        b.el.textContent = chars.slice(0, n).join('');
        if (n >= chars.length) clearInterval(b.typer);
      }, 35);
      actors[i].talk(dur / 1000 * 0.8);
      audioManager.play('talk');
      return dur;
    },
    /** Point the camera at a conversation: i talks to j (or to everyone when j is null). */
    talkTo(i, j, ms = 2500) {
      if (!actors[i]) return;
      talkShot = talkFraming(i, j);
      talkUntil = time + ms / 1000 + 0.5;
      lastCut = time;
      if (j != null && actors[j]) {
        actors[i].lookAt(headOf(actors[j]));
        actors[j].lookAt(headOf(actors[i]));
      }
    },
    clearTalk() { talkShot = null; talkUntil = 0; },
    get sinceCut() { return time - lastCut; },
    narrate(text) { showCaption(text); },
    /** Before the toss: the chits sit in one still pile. */
    gather() {
      detectiveScan = null;
      actors.forEach(a => { a.showRole(null); a.holdChit(false); a.setAccessory(null); a.setPose('idle'); a.lookAt(MAT_CENTER); });
      shot = camera.aspect < 0.8 ? SHOTS.overhead : SHOTS.mat;
      gatherChits(true);
    },
    chitsOnMat() { return chits.filter(c => c.mesh.visible && !c.picked).length; },
    /** One player scoops up the pile and throws it. Only this makes the chits fly. */
    deal(d) {
      detectiveScan = null;
      const tosser = actors[d];
      tosser.play([['reach', 0.42, 11], ['throw', 0.42, 12], ['fling', 0.55, 16], ['idle', 0, 6]]);
      actors.forEach(a => { if (a !== tosser) a.lookAt(headOf(tosser)); });
      after(0.32, () => {
        const hand = tosser.handWorld(new THREE.Vector3());
        chits.forEach((c, i) => launch(c, hand, { height: 0.04, dur: 0.24, spin: false, delay: i * 0.02 }));
      });
      after(0.92, () => {
        tossAll({ from: tosser.handWorld(new THREE.Vector3()) });
        actors.forEach(a => a.lookAt(MAT_CENTER));
      });
    },
    pick(i) { actorPicksChit(actors[i], { peek: true }); },
    hold(i) { actors[i].holdChit(true); actors[i].setPose('hold'); actors[i].lookAt(MAT_CENTER); },
    pose(i, name) { actors[i]?.setPose(name); },
    emote(i, symbol, sec = 2) { actors[i]?.emote(symbol, sec); },
    mood(i, name, sec = 2.5) { actors[i]?.mood(name, sec); },
    // one player sneaks a look at another's chit
    sneak(i, j) {
      actors[i].setPose('sneaky');
      actors[i].lookAt(actors[j].handWorld(new THREE.Vector3()));
    },
    look(i, j) {
      const a = actors[i];
      if (!a) return;
      if (j === 'camera') a.lookAt(camera.position);
      else if (j === 'center') a.lookAt(MAT_CENTER);
      else if (j == null) a.lookAt(null);
      else a.lookAt(headOf(actors[j]));
    },
    allLook(j) { actors.forEach((a, i) => { if (i !== j) story.look(i, j); }); },
    // on tall phone screens a top-down view is the only way to fit all four
    focus(i, opts) { shot = i == null ? (camera.aspect < 0.8 ? SHOTS.overhead : SHOTS.home) : shotOnActor(actors[i], opts); },
    view(name) { shot = camera.aspect < 0.8 && name === 'result' ? SHOTS.overhead : (SHOTS[name] || SHOTS.home); },
    power(on) { setPower(on); },
    // Mafia-style night: lights down without the "power cut" caption/sound
    night(on) {
      const target = on ? 0 : 1;
      if (target === powerTarget) return;
      powerTarget = target;
      if (!on) restoreAt = time - 1;
    },
    investigate(i, acc) { startGuesserScan(actors[i], acc || 'cap'); },
    // one player publicly shows their chit (e.g. "I am the King!")
    showOne(i, slot) {
      const a = actors[i];
      a.showRole(roleInfo(slot));
      a.setAccessory(roleAcc(slot));
      a.play([['show', 1.8, 8], ['hold', 0, 6]]);
      after(1.9, () => { a.showRole(null); a.holdChit(true); });
      actors.forEach((o, n) => { if (n !== i) o.lookAt(headOf(a)); });
    },
    stopScan() { detectiveScan = null; },
    point(i, j) {
      detectiveScan = null;
      actors[i].setPose('point');
      actors[i].lookAt(headOf(actors[j]));
      actors.forEach((a, n) => { if (n !== i) a.lookAt(headOf(actors[j])); });
      actors[j].setPose('nervous');
    },
    reveal(roles) {
      talkShot = null;
      actors.forEach((a, i) => {
        a.showRole(roleInfo(roles[i]));
        a.setAccessory(roleAcc(roles[i]));
        a.setPose('show');
        a.lookAt(camera.position);
      });
      audioManager.play('paper-toss');
    },
    celebrate(w) {
      talkShot = null;
      tossAll({ high: true });     // one big throw for the winner
      actors.forEach((a, i) => {
        a.showRole(null);
        a.holdChit(false);
        a.setAccessory(i === w ? 'crown' : null);
        a.setPose(i === w ? 'cheer' : 'clap');
        a.lookAt(i === w ? camera.position : headOf(actors[w]));
      });
    },
    actorAt(clientX, clientY) {
      ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      let best = -1, bestD = Infinity;
      actors.forEach((a, i) => {
        const hit = raycaster.intersectObject(a.root, true)[0];
        if (hit && hit.distance < bestD) { bestD = hit.distance; best = i; }
      });
      if (best >= 0) return best;
      // forgiving fallback: nearest head on screen within 90px
      actors.forEach((a, i) => {
        a.headWorld(proj).project(camera);
        const dx = ((proj.x + 1) / 2) * window.innerWidth - clientX;
        const dy = ((1 - proj.y) / 2) * window.innerHeight - clientY;
        const d = Math.hypot(dx, dy);
        if (d < 90 && d < bestD) { bestD = d; best = i; }
      });
      return best;
    },
  };

  resize();
  update(0);
  applyQuality();
  renderer.render(scene, camera);
  setEnabled(true);

  return { setEnabled, story };
}
