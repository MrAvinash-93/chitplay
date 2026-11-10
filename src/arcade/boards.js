/**
 * The boards, in 3D, on the mat in the room. Each draw() says where everything should be now; pieces
 * of the same kind are matched up with where they were and glide, hop or flip to the new place, so
 * no game has to think about animation. All art here is made in code: no image files to download.
 * A piece the player may tap carries its move's number in userData.pick.
 */
import * as THREE from '../vendor/three.chitplay.min.js';
import { COLS as FOUR_COLS, ROWS as FOUR_ROWS } from './games/four-in-a-row.js?v=20261110-1311';
import { destination as ludoDestination, COLORS as LUDO_COLORS, HOME as LUDO_HOME, SAFE as LUDO_SAFE, STARTS as LUDO_STARTS, quarter as ludoQuarter } from './games/ludo.js?v=20261110-1311';
import { LADDERS, SNAKES } from './games/snakes-and-ladders.js?v=20261110-1311';
import { N as DOTS_N } from './games/dots-and-boxes.js?v=20261110-1311';
import { BASE_Y as CARROM_BASE, R as COIN_R, STRIKER_R, POCKETS, POCKET_R } from './games/carrom.js?v=20261110-1311';
import { isRed, rankOf, suitOf, SUIT_ICON } from './cards.js?v=20261110-1311';

export const PLAYER_COLORS = ['#d32f2f', '#2e7dd1', '#f2b705', '#2e9e4f'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;

/* ─── materials and shapes, shared to stay light ─── */
const mats = new Map();
const mat = (color, roughness = 0.55, metalness = 0.05) => {
  const key = `${color}|${roughness}|${metalness}`;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.5 }));
  return mats.get(key);
};
const geos = new Map();
const geo = (key, make) => { if (!geos.has(key)) geos.set(key, make()); return geos.get(key); };
const cyl = (rt, rb, h, seg = 24) => geo(`c${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
const box = (w, h, d) => geo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d));
const ball = (r) => geo(`s${r}`, () => new THREE.SphereGeometry(r, 16, 12));
function mesh(g, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  return o;
}
function group(...parts) { const g = new THREE.Group(); g.add(...parts); return g; }
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
/** A flat square board: a block of wood with a picture on top. */
function plate(size, depth, picture, { color = '#5a3a20', thick = 0.05 } = {}) {
  const w = 1024, h = Math.round(1024 * (depth / size));
  const top = new THREE.MeshStandardMaterial({ map: canvasTexture(w, h, picture), roughness: 0.75, envMapIntensity: 0.3 });
  const side = mat(color, 0.6);
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, thick, depth), [side, side, top, side, side, side]);
  m.position.y = thick / 2;
  m.receiveShadow = true;
  m.castShadow = true;
  return m;
}
const TOP_Y = 0.05;   // the top of a plate

/* ─── pieces ─── */
/** A flat round piece, standing on y = 0. */
const disc = (color, r = 0.06, h = 0.028) => group(mesh(cyl(r, r, h), mat(color, 0.35), 0, h / 2, 0));
function pawnShape(color, s = 1) {
  const m = mat(color, 0.32);
  return group(mesh(cyl(0.042 * s, 0.056 * s, 0.03 * s), m, 0, 0.015 * s, 0), mesh(cyl(0.02 * s, 0.038 * s, 0.075 * s), m, 0, 0.066 * s, 0), mesh(ball(0.032 * s), m, 0, 0.122 * s, 0));
}
const CHESS_HEIGHT = { P: 0.1, N: 0.13, B: 0.145, R: 0.125, Q: 0.165, K: 0.18 };
function chessPiece(kind, color) {
  const m = mat(color, 0.32), h = CHESS_HEIGHT[kind];
  const parts = [mesh(cyl(0.05, 0.058, 0.022), m, 0, 0.011, 0), mesh(cyl(0.024, 0.042, h - 0.03), m, 0, 0.022 + (h - 0.03) / 2, 0)];
  if (kind === 'P') parts.push(mesh(ball(0.027), m, 0, h + 0.008, 0));
  if (kind === 'R') { parts.push(mesh(cyl(0.04, 0.034, 0.034, 8), m, 0, h, 0)); }
  if (kind === 'B') { parts.push(mesh(ball(0.028), m, 0, h - 0.002, 0), mesh(ball(0.009), m, 0, h + 0.034, 0)); }
  if (kind === 'N') {
    const head = mesh(box(0.034, 0.07, 0.066), m, 0, h - 0.002, 0.012);
    head.rotation.x = 0.45;
    parts.push(head, mesh(box(0.024, 0.024, 0.04), m, 0, h + 0.022, 0.04));
  }
  if (kind === 'Q') { parts.push(mesh(ball(0.03), m, 0, h - 0.004, 0), mesh(cyl(0.036, 0.018, 0.022, 10), m, 0, h + 0.03, 0), mesh(ball(0.01), m, 0, h + 0.05, 0)); }
  if (kind === 'K') { parts.push(mesh(cyl(0.034, 0.024, 0.026, 10), m, 0, h - 0.004, 0), mesh(box(0.012, 0.05, 0.012), m, 0, h + 0.036, 0), mesh(box(0.036, 0.012, 0.012), m, 0, h + 0.04, 0)); }
  return group(...parts);
}
/** A die: 1 on top, 6 below, 2 and 5 front and back, 3 and 4 right and left. */
const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
const dieFaces = new Map();
function dieFace(v, ink = '#2a1a10', paper = '#fbf6e9') {
  const key = v + ink + paper;
  if (!dieFaces.has(key)) {
    dieFaces.set(key, new THREE.MeshStandardMaterial({ roughness: 0.35, envMapIntensity: 0.4, map: canvasTexture(128, 128, (g) => {
      g.fillStyle = paper; g.fillRect(0, 0, 128, 128);
      g.fillStyle = ink;
      PIPS[v].forEach(([x, y]) => { g.beginPath(); g.arc(32 + x * 32, 32 + y * 32, 12, 0, TAU); g.fill(); });
    }) }));
  }
  return dieFaces.get(key);
}
const dieMesh = (size = 0.13) => {
  const m = new THREE.Mesh(box(size, size, size), [3, 4, 1, 6, 2, 5].map(v => dieFace(v)));
  m.castShadow = true;
  return m;
};
export const DIE_TURN = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [-Math.PI / 2, 0, 0], 5: [Math.PI / 2, 0, 0], 3: [0, 0, Math.PI / 2], 4: [0, 0, -Math.PI / 2] };

const cardFaces = new Map();
function cardFace(code) {
  if (!cardFaces.has(code)) {
    const paint = code === 'back'
      ? (g, w, h) => { g.fillStyle = '#7a1f2b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f0c869'; g.lineWidth = 6; g.strokeRect(12, 12, w - 24, h - 24); for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(16 + i * 24, 18); g.lineTo(16, 18 + i * 34); g.stroke(); } }
      : (g, w, h) => {
        g.fillStyle = '#fbf8ef'; g.fillRect(0, 0, w, h);
        g.fillStyle = isRed(code) ? '#c62828' : '#17140f';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '800 54px system-ui, sans-serif';
        g.fillText(rankOf(code), w * 0.27, 44);
        g.font = '88px system-ui, "Segoe UI Symbol", sans-serif';
        g.fillText(SUIT_ICON[suitOf(code)], w / 2, h * 0.58);
      };
    cardFaces.set(code, new THREE.MeshStandardMaterial({ map: canvasTexture(192, 270, paint), roughness: 0.55, envMapIntensity: 0.3 }));
  }
  return cardFaces.get(code);
}
function cardMesh(code, w = 0.2) {
  const edge = mat('#ded7c6', 0.7), d = w * 1.4;
  const m = new THREE.Mesh(box(w, 0.006, d), [edge, edge, cardFace(code), cardFace('back'), edge, edge]);
  m.castShadow = true;
  return m;
}
function textSprite(text, { size = 0.09, color = '#fff6dc', bg = 'rgba(30,16,8,.72)' } = {}) {
  const t = canvasTexture(128, 64, (g, w, h) => {
    if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(h / 2, h / 2, h / 2, Math.PI / 2, -Math.PI / 2); g.arc(w - h / 2, h / 2, h / 2, -Math.PI / 2, Math.PI / 2); g.fill(); }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 40px system-ui, sans-serif';
    g.fillText(String(text), w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(size * 2, size, 1);
  s.renderOrder = 5;
  s.userData.ownTexture = true;
  return s;
}

/** Free a label's or a chit's one-off texture; shared materials stay. */
function disposeOwn(obj) {
  obj.traverse((o) => {
    if (!o.userData.ownTexture) return;
    [].concat(o.material).forEach((m) => { m.map?.dispose(); m.dispose(); });
    if (o.isMesh) o.geometry.dispose();
  });
}

const DIE_SIZE = 0.115;
export const STEP_SECONDS = 0.13;   // a Ludo token, one square

/* ─── the stage: reconciles what should be with what is, and animates the difference ─── */
class Stage {
  constructor(root) {
    this.root = root;
    this.world = new THREE.Group();
    root.add(this.world);
    this.live = [];
    this.want = [];
    this.picks = [];
    this.marks = [];
    this.playing = null;
  }
  add(obj) { this.world.add(obj); return obj; }
  begin() { this.want = []; this.marks.forEach((o) => { this.world.remove(o); }); this.marks = []; this.picks = []; }
  /** Something should be at x,y,z. `kind` says which older piece may become this one. */
  put(kind, make, x, y, z, o = {}) { this.want.push({ kind, make, x, y, z, ...o }); }
  /** A glowing spot on the board that can be tapped. */
  mark(x, z, pick, { r = 0.05, y = TOP_Y + 0.004, color = '#ffe08a', solid = true, pulse = false } = {}) {
    const glow = new THREE.Mesh(cyl(r, r, 0.006, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: solid ? 0.62 : 0 }));
    glow.position.set(x, y, z);
    glow.userData.pick = pick;
    glow.userData.pulse = pulse;
    this.world.add(glow);
    this.marks.push(glow);
    this.picks.push(glow);
    return glow;
  }
  /** An invisible area that can be tapped. */
  area(x, z, w, d, pick, { y = TOP_Y + 0.01, show = false, color = '#ffe08a' } = {}) {
    const a = new THREE.Mesh(box(w, 0.004, d), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: show ? 0.4 : 0, depthWrite: false }));
    a.position.set(x, y, z);
    this.world.add(a);
    this.marks.push(a);
    if (pick != null) { a.userData.pick = pick; this.picks.push(a); }
    return a;
  }
  end() {
    const old = this.live.slice();
    const next = [];
    const claim = (spec, test) => {
      let bestI = -1, bestD = Infinity;
      old.forEach((p, i) => {
        if (!p || p.dying != null || p.kind !== spec.kind || !test(p)) return;
        const d = Math.hypot(p.to[0] - spec.x, p.to[2] - spec.z);
        if (d < bestD) { bestD = d; bestI = i; }
      });
      if (bestI < 0) return null;
      const p = old[bestI];
      old[bestI] = null;
      return p;
    };
    const unmatched = [];
    // first whatever hasn't moved, so a jump doesn't shuffle every piece on the board
    for (const spec of this.want) {
      const p = claim(spec, q => Math.hypot(q.to[0] - spec.x, q.to[2] - spec.z) < 1e-3);
      if (p) next.push(this.#update(p, spec)); else unmatched.push(spec);
    }
    for (const spec of unmatched) {
      const p = claim(spec, () => true);
      if (p) next.push(this.#update(p, spec));
      else next.push(this.#create(spec));
    }
    old.forEach((p) => { if (p) { p.dying = p.dying ?? 0; p.spec = null; next.push(p); } });
    this.live = next;
    next.forEach((p) => { if (p.spec?.pick != null) { p.obj.userData.pick = p.spec.pick; this.picks.push(p.obj); } else delete p.obj.userData.pick; });
  }
  #create(spec) {
    const obj = spec.make();
    obj.position.set(spec.x, spec.y + (reduced || spec.noDrop ? 0 : 0.5), spec.z);
    if (spec.from && !reduced) obj.position.set(spec.from[0], spec.y + 0.12, spec.from[1]);
    if (spec.rot) obj.rotation.set(...spec.rot);
    this.world.add(obj);
    spec.update?.(obj);
    return { kind: spec.kind, obj, spec, to: [spec.x, spec.y, spec.z], from: obj.position.toArray(), t: reduced ? 1 : 0, dur: spec.from ? 0.42 : 0.32, hop: 0, spin: spec.spin, rotFrom: (spec.rot || [0, 0, 0]).slice(), rotTo: (spec.rot || [0, 0, 0]).slice() };
  }
  #update(p, spec) {
    const moved = Math.hypot(p.to[0] - spec.x, p.to[2] - spec.z, p.to[1] - spec.y) > 1e-3;
    const rot = spec.rot || [0, 0, 0];
    const turned = rot.some((v, i) => Math.abs(v - p.rotTo[i]) > 1e-3);
    const spun = spec.spin !== undefined && spec.spin !== p.spin;
    spec.update?.(p.obj);
    if (moved || turned || spun) {
      const dist = Math.hypot(p.to[0] - spec.x, p.to[2] - spec.z);
      p.from = p.obj.position.toArray();
      p.to = [spec.x, spec.y, spec.z];
      p.t = reduced ? 1 : 0;
      p.dur = spun ? 0.6 : Math.min(0.7, 0.26 + dist * 0.5);
      p.hop = spun ? 0.26 : moved ? (spec.hop ?? Math.min(0.2, 0.05 + dist * 0.15)) : (turned ? 0.1 : 0);
      p.rotFrom = [p.obj.rotation.x, p.obj.rotation.y, p.obj.rotation.z];
      p.rotTo = rot.slice();
      if (spec.route?.length > 1 && !reduced) { p.route = spec.route; p.routeFrom = [p.obj.position.x, p.obj.position.z]; p.routeT = 0; p.routeY = spec.y; p.t = 1; }
      if (spun) {
        p.rotFrom = p.rotFrom.map(v => v - (Math.floor(Math.random() * 2) + 2) * TAU);
        p.spin = spec.spin;
      }
    }
    p.spec = spec;
    return p;
  }
  tick(dt) {
    let dead = false;
    this.clock = (this.clock || 0) + dt;
    if (!reduced) this.marks.forEach((m) => { if (m.userData.pulse) m.material.opacity = 0.5 + 0.4 * Math.sin(this.clock * 5); });
    for (const p of this.live) {
      if (p.route && p.dying == null) {
        p.routeT += dt / STEP_SECONDS;
        const at = Math.floor(p.routeT);
        if (at >= p.route.length) { const [x, z] = p.route[p.route.length - 1]; p.obj.position.set(x, p.routeY, z); p.route = null; continue; }
        const [fx, fz] = at ? p.route[at - 1] : p.routeFrom;
        const [tx, tz] = p.route[at];
        const k = p.routeT - at;
        p.obj.position.set(fx + (tx - fx) * k, p.routeY + 0.28 * k * (1 - k), fz + (tz - fz) * k);
        continue;
      }
      if (p.dying != null) {
        p.dying += dt;
        const k = Math.max(0, 1 - p.dying / 0.22);
        p.size = p.size || p.obj.scale.clone();
        p.obj.scale.set(p.size.x * k, p.size.y * k, p.size.z * k);
        if (k <= 0) { this.world.remove(p.obj); disposeOwn(p.obj); p.gone = true; dead = true; }
        continue;
      }
      if (p.t >= 1) continue;
      p.t = Math.min(1, p.t + dt / p.dur);
      const e = 1 - (1 - p.t) ** 3;
      const o = p.obj.position;
      o.x = p.from[0] + (p.to[0] - p.from[0]) * e;
      o.z = p.from[2] + (p.to[2] - p.from[2]) * e;
      o.y = p.from[1] + (p.to[1] - p.from[1]) * e + 4 * p.hop * p.t * (1 - p.t);
      p.obj.rotation.set(p.rotFrom[0] + (p.rotTo[0] - p.rotFrom[0]) * e, p.rotFrom[1] + (p.rotTo[1] - p.rotFrom[1]) * e, p.rotFrom[2] + (p.rotTo[2] - p.rotFrom[2]) * e);
    }
    if (dead) this.live = this.live.filter(p => !p.gone);
    this.playing?.(dt);
  }
  dispose() {
    this.root.remove(this.world);
    this.live = [];
    this.picks = [];
  }
}

/* ─── pictures for the boards ─── */
function woodPaper(g, w, h, a = '#c49a62', b = '#b48a52') {
  g.fillStyle = a; g.fillRect(0, 0, w, h);
  g.strokeStyle = b; g.lineWidth = 2;
  for (let y = 4; y < h; y += 13) { g.beginPath(); g.moveTo(0, y + Math.sin(y) * 2); g.bezierCurveTo(w * 0.3, y + 5, w * 0.6, y - 5, w, y); g.stroke(); }
}
const SIZE = 1.7;
/** Column/row (0-based from the far left corner) to board x/z, for an n×n grid. */
const cell = (c, r, n, size = SIZE) => [((c + 0.5) / n - 0.5) * size, ((r + 0.5) / n - 0.5) * size];
function chequered(n, dark, light, frame = '#3a2412') {
  return (g, w, h) => {
    g.fillStyle = frame; g.fillRect(0, 0, w, h);
    const s = (w - 40) / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? dark : light; g.fillRect(20 + x * s, 20 + y * s, s, s); }
  };
}

/* ─── one drawing per game ─── */
const twoStep = (ctx, st, onPiece) => { // tap a piece, then where it goes
  if (st.sel != null && !ctx.legal.some(m => m.f === st.sel)) st.sel = null;
  onPiece(st.sel);
};

/** The player picks the die up, holds it for a moment, and throws it onto the middle of the board. */
function thrower(st, kind, size, spread, value, hand, done, onRelease) {
  const p = st.live.find(x => x.kind === kind);
  const DIE_SIZE = size;
      const rot = DIE_TURN[value];
      const a = Math.random() * TAU, r = 0.05 + Math.random() * 0.13;
      const land = [Math.cos(a) * r, Math.sin(a) * r];
      const restY = TOP_Y + DIE_SIZE / 2;
      if (!p || reduced) { st.dieAt = land; done(); return; }
      const o = p.obj, from = o.position.clone(), spin = [3 + Math.random() * 2, 2 + Math.random() * 2, 2 + Math.random() * 2];
      let t = 0, out = null;
      p.t = 1;
      st.dieAt = land;
      const settle = () => {
        st.playing = null;
        st.finishThrow = null;
        o.position.set(land[0], restY, land[1]);
        o.rotation.set(rot[0], rot[1], rot[2]);
        p.to = [land[0], restY, land[1]];
        p.from = p.to.slice();
        p.rotTo = rot.slice();
        p.rotFrom = rot.slice();
      };
      st.finishThrow = settle;
      st.playing = (dt) => {
        t += dt;
        if (t < 0.32) {                 // down to the die, and it comes up to the hand
          const h = hand(), k = (t / 0.32) ** 2;
          o.position.set(from.x + (h.x - from.x) * k, from.y + (h.y - from.y) * k, from.z + (h.z - from.z) * k);
          return;
        }
        if (t < 0.64) {                 // held in the hand as the arm comes up
          o.position.copy(hand());
          return;
        }
        if (!out) { out = o.position.clone(); onRelease?.(); }
        const k = Math.min(1, (t - 0.64) / 0.62), e = 1 - (1 - k) ** 2;
        // flies in an arc, with one small bounce before it settles
        const arc = k < 0.72 ? 4 * 0.2 * (k / 0.72) * (1 - k / 0.72) + (out.y - restY) * (1 - k / 0.72) : 4 * 0.035 * ((k - 0.72) / 0.28) * (1 - (k - 0.72) / 0.28);
        o.position.set(out.x + (land[0] - out.x) * e, restY + arc, out.z + (land[1] - out.z) * e);
        const left = (1 - k) ** 2;
        o.rotation.set(rot[0] + spin[0] * TAU * left, rot[1] + spin[1] * TAU * left, rot[2] + spin[2] * TAU * left);
        if (k < 1) return;
        settle();
        done();
      };
}

const BOARDS = {
  'tic-tac-toe': {
    span: 1.75,
    build(st) {
      st.add(plate(SIZE * 0.86, SIZE * 0.86, (g, w, h) => {
        woodPaper(g, w, h, '#e6cf9f', '#d9bf8a');
        g.strokeStyle = '#5a3a20'; g.lineWidth = 16; g.lineCap = 'round';
        [1, 2].forEach((k) => { const p = (k * w) / 3; g.beginPath(); g.moveTo(p, 40); g.lineTo(p, h - 40); g.moveTo(40, p); g.lineTo(w - 40, p); g.stroke(); });
      }));
    },
    draw(st, v, ctx) {
      const S = SIZE * 0.86;
      v.b.forEach((p, i) => {
        const [x, z] = cell(i % 3, Math.floor(i / 3), 3, S);
        if (p === 0) st.put('x', () => { const m = mat('#c62828', 0.3); const a = mesh(box(0.34, 0.05, 0.06), m); const b = mesh(box(0.34, 0.05, 0.06), m); a.rotation.y = Math.PI / 4; b.rotation.y = -Math.PI / 4; return group(a, b); }, x, TOP_Y + 0.03, z);
        if (p === 1) st.put('o', () => { const t = mesh(geo('o', () => new THREE.TorusGeometry(0.11, 0.032, 12, 32)), mat('#1565c0', 0.3)); t.rotation.x = Math.PI / 2; return group(t); }, x, TOP_Y + 0.035, z);
      });
      v.line?.forEach((c) => { const [x, z] = cell(c % 3, Math.floor(c / 3), 3, S); st.area(x, z, S / 3 - 0.03, S / 3 - 0.03, null, { show: true, color: '#7dff9a', y: TOP_Y + 0.002 }); });
      ctx.legal.forEach((m, i) => { const [x, z] = cell(m.c % 3, Math.floor(m.c / 3), 3, S); st.area(x, z, S / 3 - 0.04, S / 3 - 0.04, i, { show: ctx.mine }); });
    },
  },
  'four-in-a-row': {
    span: 1.9,
    build(st) {
      const rack = plate(SIZE, SIZE * 0.86, (g, w, h) => {
        g.fillStyle = '#1b4fa8'; g.fillRect(0, 0, w, h);
        const sx = w / FOUR_COLS, sy = h / FOUR_ROWS;
        for (let c = 0; c < FOUR_COLS; c++) for (let r = 0; r < FOUR_ROWS; r++) {
          g.fillStyle = '#0c2758'; g.beginPath(); g.arc((c + 0.5) * sx, (r + 0.5) * sy, Math.min(sx, sy) * 0.4, 0, TAU); g.fill();
        }
      }, { color: '#143a80' });
      st.add(rack);
    },
    draw(st, v, ctx) {
      const W = SIZE, D = SIZE * 0.86;
      v.b.forEach((p, i) => {
        if (p < 0) return;
        const c = i % FOUR_COLS, r = (i - c) / FOUR_COLS;
        const x = ((c + 0.5) / FOUR_COLS - 0.5) * W, z = (0.5 - (r + 0.5) / FOUR_ROWS) * D;
        st.put(p === 0 ? 'fr' : 'fy', () => disc(p === 0 ? '#d32f2f' : '#f2b705', 0.092, 0.03), x, TOP_Y, z, { hop: 0.06 });
      });
      v.line?.forEach((i) => {
        const c = i % FOUR_COLS, r = (i - c) / FOUR_COLS;
        st.mark(((c + 0.5) / FOUR_COLS - 0.5) * W, (0.5 - (r + 0.5) / FOUR_ROWS) * D, { none: 1 }, { r: 0.11, y: TOP_Y + 0.002, color: '#7dff9a', pulse: true });
      });
      ctx.legal.forEach((m, i) => {
        const x = ((m.c + 0.5) / FOUR_COLS - 0.5) * W;
        st.area(x, 0, W / FOUR_COLS - 0.015, D, i, { show: false });
        st.mark(x, -D / 2 - 0.07, i, { r: 0.05 });
      });
    },
  },
  reversi: {
    span: 1.9,
    build(st) { st.add(plate(SIZE, SIZE, chequered(8, '#1f7a3f', '#238a48', '#123d20'))); },
    draw(st, v, ctx) {
      const side = mat('#555', 0.5), dark = mat('#191919', 0.35), light = mat('#f3efe4', 0.35);
      v.b.forEach((p, i) => {
        if (p < 0) return;
        const [x, z] = cell(i % 8, Math.floor(i / 8), 8);
        st.put('rv', () => { const m = new THREE.Mesh(cyl(0.082, 0.082, 0.026), [side, dark, light]); m.castShadow = true; return m; }, x, TOP_Y + 0.016, z, { rot: [p === 0 ? 0 : Math.PI, 0, 0], hop: 0.1 });
      });
      if (v.last != null) { const [x, z] = cell(v.last % 8, Math.floor(v.last / 8), 8); st.area(x, z, 0.2, 0.2, null, { show: true, color: '#f7d774', y: TOP_Y + 0.001 }); }
      ctx.legal.forEach((m, i) => { const [x, z] = cell(m.c % 8, Math.floor(m.c / 8), 8); st.mark(x, z, i, { r: 0.036 }); });
    },
  },
  checkers: {
    span: 1.9,
    faces: true,
    build(st) { st.add(plate(SIZE, SIZE, chequered(8, '#3f2a1c', '#c9a26f'))); },
    draw(st, v, ctx) {
      v.b.forEach((p, i) => {
        if (p < 0) return;
        const [x, z] = cell(i % 8, Math.floor(i / 8), 8);
        const color = p % 2 === 0 ? '#d32f2f' : '#f7f0e0';
        const king = p >= 2;
        st.put(`c${p}`, () => (king ? group(disc(color, 0.08, 0.03), mesh(cyl(0.07, 0.07, 0.03), mat(color, 0.35), 0, 0.045, 0), mesh(ball(0.02), mat('#f0c040', 0.3), 0, 0.075, 0)) : disc(color, 0.08, 0.034)), x, TOP_Y, z);
      });
      twoStep(ctx, st, (sel) => {
        const froms = [...new Set(ctx.legal.map(m => m.f))];
        // with a single piece to move (a jump in progress) it's selected already
        const active = sel ?? (froms.length === 1 ? froms[0] : null);
        froms.forEach((f) => { const [x, z] = cell(f % 8, Math.floor(f / 8), 8); st.mark(x, z, { sel: f }, { r: 0.09, y: TOP_Y + 0.002, color: f === active ? '#ffb347' : '#ffe08a' }); });
        ctx.legal.forEach((m, i) => { if (m.f === active) { const [x, z] = cell(m.t % 8, Math.floor(m.t / 8), 8); st.mark(x, z, i, { r: 0.06 }); } });
      });
    },
  },
  chess: {
    span: 1.95,
    faces: true,
    build(st) { st.add(plate(SIZE, SIZE, chequered(8, '#6e4426', '#c9a26f'))); },
    draw(st, v, ctx) {
      v.b.forEach((c, i) => {
        if (c === '.') return;
        const [x, z] = cell(i % 8, Math.floor(i / 8), 8);
        const white = c === c.toUpperCase();
        const kind = c.toUpperCase();
        st.put(`p${c}`, () => { const g = chessPiece(kind, white ? '#fffaf0' : '#17110d'); if (!white) g.rotation.y = Math.PI; return g; }, x, TOP_Y, z, white ? {} : { rot: [0, Math.PI, 0] });
      });
      if (v.last) [v.last.f, v.last.t].forEach((sq) => { const [x, z] = cell(sq % 8, Math.floor(sq / 8), 8); st.area(x, z, 0.2, 0.2, null, { show: true, color: '#f7d774', y: TOP_Y + 0.001 }); });
      twoStep(ctx, st, (sel) => {
        [...new Set(ctx.legal.map(m => m.f))].forEach((f) => { const [x, z] = cell(f % 8, Math.floor(f / 8), 8); st.area(x, z, 0.2, 0.2, { sel: f }, { show: f === sel, color: '#ffb347', y: TOP_Y + 0.003 }); });
        if (sel == null) return;
        const seen = new Set();
        ctx.legal.forEach((m, i) => {
          if (m.f !== sel || seen.has(m.t)) return;
          seen.add(m.t);
          const [x, z] = cell(m.t % 8, Math.floor(m.t / 8), 8);
          // a pawn reaching the far side: the panel asks what it becomes
          const promos = ctx.legal.filter(o => o.f === sel && o.t === m.t && o.q);
          st.mark(x, z, promos.length ? { promote: { f: sel, t: m.t } } : i, { r: 0.05, y: TOP_Y + 0.006 });
        });
      });
    },
  },
  'nine-mens-morris': {
    span: 1.85,
    build(st) {
      st.add(plate(SIZE, SIZE, (g, w, h) => {
        woodPaper(g, w, h, '#d9b983', '#ca9f68');
        g.strokeStyle = '#3a2412'; g.lineWidth = 10;
        [0, 1, 2].forEach((ring) => { const m = 90 + ring * 140; g.strokeRect(m, m, w - m * 2, h - m * 2); });
        g.beginPath();
        g.moveTo(w / 2, 90); g.lineTo(w / 2, 370); g.moveTo(w / 2, h - 90); g.lineTo(w / 2, h - 370);
        g.moveTo(90, h / 2); g.lineTo(370, h / 2); g.moveTo(w - 90, h / 2); g.lineTo(w - 370, h / 2);
        g.stroke();
      }));
    },
    point(i) {
      const ring = Math.floor(i / 8), k = i % 8;
      const R = (1 - (90 + ring * 140) / 512) * (SIZE / 2);
      const corners = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
      return [corners[k][0] * R, corners[k][1] * R];
    },
    draw(st, v, ctx) {
      const at = this.point;
      v.b.forEach((p, i) => {
        if (p < 0) return;
        const [x, z] = at(i);
        st.put(`m${p}`, () => disc(p === 0 ? '#f4ead5' : '#2a211c', 0.075, 0.034), x, TOP_Y, z);
      });
      twoStep(ctx, st, (sel) => {
        ctx.legal.forEach((m, i) => {
          if (m.x != null) { const [x, z] = at(m.x); st.mark(x, z, i, { r: 0.09, y: TOP_Y + 0.04, color: '#ff6b5b' }); return; }
          if (m.f == null) { const [x, z] = at(m.t); st.mark(x, z, i, { r: 0.05 }); return; }
          if (m.f === sel) { const [x, z] = at(m.t); st.mark(x, z, i, { r: 0.05 }); }
        });
        [...new Set(ctx.legal.map(m => m.f).filter(f => f != null))].forEach((f) => { const [x, z] = at(f); st.mark(x, z, { sel: f }, { r: 0.09, y: TOP_Y + 0.002, color: f === sel ? '#ffb347' : '#ffe08a' }); });
      });
    },
  },
  mancala: {
    span: 1.9,
    pit(i) {
      if (i === 6) return [0.82, 0];
      if (i === 13) return [-0.82, 0];
      if (i < 6) return [(i - 2.5) * 0.235, 0.17];
      return [(9.5 - i) * 0.235, -0.17];
    },
    build(st) {
      const pos = (i) => this.pit(i);
      st.add(plate(1.98, 0.72, (g, w, h) => {
        woodPaper(g, w, h, '#a0713f', '#8d5f30');
        const kx = w / 1.98, kz = h / 0.72;
        for (let i = 0; i < 14; i++) {
          const [x, z] = pos(i);
          const px = (x + 0.99) * kx, pz = (z + 0.36) * kz;
          g.fillStyle = '#4c2f15'; g.beginPath();
          if (i === 6 || i === 13) g.ellipse(px, pz, 0.1 * kx, 0.3 * kz, 0, 0, TAU);
          else g.ellipse(px, pz, 0.095 * kx, 0.13 * kz, 0, 0, TAU);
          g.fill();
        }
      }));
    },
    draw(st, v, ctx) {
      const COLORS = ['#e2574c', '#f2b705', '#2e9e4f', '#2e7dd1', '#b05cc6', '#ef8a3c'];
      v.b.forEach((count, i) => {
        const [x, z] = this.pit(i);
        const store = i === 6 || i === 13;
        for (let k = 0; k < count; k++) {
          const a = k * 2.4, d = Math.min(store ? 0.07 : 0.055, 0.016 * Math.sqrt(k) * 1.9);
          const sx = x + Math.cos(a) * d, sz = z + Math.sin(a) * d * (store ? 2.6 : 1.1);
          const color = COLORS[k % COLORS.length];
          st.put(`seed${color}`, () => mesh(ball(0.022), mat(color, 0.3)), sx, TOP_Y + 0.024 + Math.floor(k / 9) * 0.03, sz, { hop: 0.1 });
        }
        st.put(`lab${i}:${count}`, () => textSprite(count, { size: 0.075 }), x, TOP_Y + 0.17, z + (store ? 0.34 : (i < 6 ? 0.19 : -0.19)), { noDrop: true });
      });
      ctx.legal.forEach((m, i) => { const [x, z] = this.pit(m.pit); st.area(x, z, 0.21, 0.29, i, { show: ctx.mine, color: '#ffe08a', y: TOP_Y + 0.003 }); });
    },
  },
  'dots-and-boxes': {
    span: 1.85,
    build(st) {
      st.add(plate(SIZE, SIZE, (g, w, h) => { g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(70,110,190,.28)'; g.lineWidth = 3; for (let y = 40; y < h; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, { color: '#cfc4a6' }));
      const u = (SIZE * 0.88) / DOTS_N, o = -(SIZE * 0.88) / 2;
      for (let y = 0; y <= DOTS_N; y++) for (let x = 0; x <= DOTS_N; x++) st.add(mesh(cyl(0.018, 0.018, 0.018, 12), mat('#2a2422', 0.4), o + x * u, TOP_Y + 0.009, o + y * u));
    },
    draw(st, v, ctx) {
      const u = (SIZE * 0.88) / DOTS_N, o = -(SIZE * 0.88) / 2, total = DOTS_N * (DOTS_N + 1);
      const where = (e) => (e < total
        ? { x: o + ((e % DOTS_N) + 0.5) * u, z: o + Math.floor(e / DOTS_N) * u, horizontal: true }
        : { x: o + ((e - total) % (DOTS_N + 1)) * u, z: o + (Math.floor((e - total) / (DOTS_N + 1)) + 0.5) * u, horizontal: false });
      v.lines.forEach((p, e) => {
        if (p < 0) return;
        const { x, z, horizontal } = where(e);
        st.put(`l${e}`, () => mesh(horizontal ? box(u - 0.03, 0.014, 0.02) : box(0.02, 0.014, u - 0.03), mat(PLAYER_COLORS[p], 0.4)), x, TOP_Y + 0.008, z, { noDrop: true });
      });
      v.boxes.forEach((p, b) => {
        if (p < 0) return;
        const x = o + ((b % DOTS_N) + 0.5) * u, z = o + (Math.floor(b / DOTS_N) + 0.5) * u;
        st.put(`box${b}`, () => mesh(box(u - 0.05, 0.006, u - 0.05), mat(PLAYER_COLORS[p], 0.7)), x, TOP_Y + 0.003, z, { noDrop: true });
      });
      ctx.legal.forEach((m, i) => {
        const { x, z, horizontal } = where(m.e);
        st.area(x, z, horizontal ? u - 0.05 : 0.09, horizontal ? 0.09 : u - 0.05, i, { show: ctx.mine, color: '#d7c56f', y: TOP_Y + 0.004 });
      });
    },
  },
  ludo: {
    span: 1.85,
    path: [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], [0, 7], [0, 6]],
    colors: LUDO_COLORS,
    // tokens are deeper than the squares they stand on, so a token never melts into its own colour
    pawns: ['#9c1212', '#0e5c2c', '#b57a00', '#124b94'],
    yards: [[0, 0], [9, 0], [9, 9], [0, 9]],
    column(q, k) { return [[1 + k, 7], [7, 1 + k], [13 - k, 7], [7, 13 - k]][q]; },
    build(st) {
      const path = this.path, colors = this.colors, yards = this.yards, column = this.column;
      st.add(plate(SIZE, SIZE, (g, w) => {
        const u = w / 15;
        g.fillStyle = '#fbf6e9'; g.fillRect(0, 0, w, w);
        yards.forEach(([x, y], q) => {
          g.fillStyle = colors[q]; g.fillRect(x * u, y * u, 6 * u, 6 * u);
          g.fillStyle = '#fbf6e9'; g.fillRect((x + 1) * u, (y + 1) * u, 4 * u, 4 * u);
          [[2, 2], [4, 2], [2, 4], [4, 4]].forEach(([a, b]) => { g.fillStyle = colors[q]; g.beginPath(); g.arc((x + a) * u, (y + b) * u, 0.62 * u, 0, TAU); g.fill(); });
          for (let k = 0; k < 5; k++) { const [c, r] = column(q, k); g.fillStyle = colors[q]; g.fillRect(c * u, r * u, u, u); }
          const [sc, sr] = path[LUDO_STARTS[q]];
          g.fillStyle = colors[q]; g.fillRect(sc * u, sr * u, u, u);
        });
        g.strokeStyle = '#6d5a40'; g.lineWidth = 2;
        path.forEach(([c, r]) => g.strokeRect(c * u, r * u, u, u));
        LUDO_SAFE.forEach((sq) => {
          if (LUDO_STARTS.includes(sq)) return;
          const [c, r] = path[sq];
          g.fillStyle = '#b08d3c'; g.font = `${u * 0.8}px system-ui, "Segoe UI Symbol", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('★', (c + 0.5) * u, (r + 0.55) * u);
        });
        const m = 7.5 * u;
        [[6, 6, 9, 6], [9, 6, 9, 9], [9, 9, 6, 9], [6, 9, 6, 6]].forEach(([a, b, c, d], i) => {
          g.fillStyle = colors[[1, 2, 3, 0][i]];
          g.beginPath(); g.moveTo(a * u, b * u); g.lineTo(c * u, d * u); g.lineTo(m, m); g.fill();
        });
      }, { color: '#6b4a2b' }));
    },
    tokenAt(v, seat, t, pos) {
      const q = ludoQuarter(v, seat);
      let c, r;
      if (pos < 0) { const [yx, yy] = this.yards[q]; const [a, b] = [[2, 2], [4, 2], [2, 4], [4, 4]][t]; c = yx + a - 0.5; r = yy + b - 0.5; }
      else if (pos === LUDO_HOME) { c = 7 + (t % 2 ? 0.2 : -0.2); r = 7 + (t < 2 ? 0.2 : -0.2); }
      else if (pos > 50) { [c, r] = this.column(q, pos - 51); }
      else { [c, r] = this.path[(LUDO_STARTS[q] + pos) % 52]; }
      return cell(c, r, 15);
    },
    draw(st, v, ctx) {
      st.finishThrow?.();
      const spots = new Map();
      const before = st.ludoWas || v.t;
      st.ludoWas = v.t;
      v.t.forEach((tokens, seat) => tokens.forEach((pos, t) => {
        let [x, z] = this.tokenAt(v, seat, t, pos);
        if (pos >= 0 && pos !== LUDO_HOME) {   // tokens sharing a square stand side by side
          const key = `${x.toFixed(3)},${z.toFixed(3)}`;
          const n = spots.get(key) || 0;
          spots.set(key, n + 1);
          x += [0, 0.03, -0.03, 0.03][n]; z += [0, 0.03, 0.03, -0.03][n];
        }
        const q = ludoQuarter(v, seat);
        const move = ctx.legal.findIndex(m => m.t === t);
        const mine = ctx.mine && seat === ctx.me && move >= 0;
        // moving forward: walk the squares in between, so you can follow it and count
        const was = before[seat]?.[t] ?? pos;
        let route;
        if (was >= 0 && pos >= 0 && pos !== was && (pos > was || (pos <= 6 && was >= 45))) {
          // forwards, or round again past its own start (the capture-first rule)
          route = [];
          const steps = pos > was ? pos - was : pos + 51 - was;
          for (let k = 1; k < steps; k++) { const p2 = was + k > 50 && pos < was ? was + k - 51 : was + k; route.push(this.tokenAt(v, seat, t, p2)); }
          route.push([x, z]);
        }
        // captured: a high arc all the way back to the yard
        const sentHome = was >= 0 && pos < 0;
        st.put(`t${seat}.${t}`, () => pawnShape(this.pawns[q], 0.82), x, TOP_Y, z, mine ? { pick: move, hop: 0.12, route } : { hop: sentHome ? 0.7 : 0.12, route });
        // where this move would land: a ring on the board
        if (mine) {
          const to = ludoDestination(v, seat, t);
          if (to != null) { const [lx, lz] = this.tokenAt(v, seat, t, to); st.mark(lx, lz, move, { r: 0.05, y: TOP_Y + 0.003, color: '#ffffff', pulse: true }); }
        }
        if (mine) st.mark(x, z, move, { r: 0.07, y: TOP_Y + 0.002, pulse: true });
        // a number to match its button, once it's on the board
        if (mine && pos >= 0) {
          st.put(`no${t}`, () => textSprite(t + 1, { size: 0.085 }), x, TOP_Y + 0.2, z, { noDrop: true, hop: 0 });
        }
      }));
      const [dx, dz] = st.dieAt || [0, 0];
      st.put('die', () => dieMesh(DIE_SIZE), dx, TOP_Y + DIE_SIZE / 2, dz, { rot: DIE_TURN[v.shown || 1], pick: ctx.mine && v.die == null ? 0 : undefined, noDrop: true });
    },
    throwDie(st, value, hand, done, onRelease) { thrower(st, 'die', DIE_SIZE, 0, value, hand, done, onRelease); },
  },
  'snakes-and-ladders': {
    throwDie(st, value, hand, done, onRelease) { thrower(st, 'die', DIE_SIZE, 0, value, hand, done, onRelease); },
    span: 1.85,
    square(n) { // 1 at the near left, snaking up to 100 at the far left
      const k = n - 1, row = Math.floor(k / 10), col = row % 2 ? 9 - (k % 10) : k % 10;
      return cell(col, 9 - row, 10);
    },
    build(st) {
      const toPx = (n, w) => { const k = n - 1, row = Math.floor(k / 10), col = row % 2 ? 9 - (k % 10) : k % 10; return [(col + 0.5) * w / 10, (9 - row + 0.5) * w / 10]; };
      st.add(plate(SIZE, SIZE, (g, w) => {
        const u = w / 10;
        const tints = ['#f6e3b4', '#cfe6c4', '#f3c9b5', '#c6d9ee', '#ecd0e6'];
        for (let n = 1; n <= 100; n++) {
          const [x, y] = toPx(n, w);
          g.fillStyle = tints[(n * 7 + Math.floor((n - 1) / 10)) % tints.length]; g.fillRect(x - u / 2, y - u / 2, u, u);
          g.fillStyle = '#4a3a28'; g.font = `800 ${u * 0.27}px system-ui, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'top';
          g.fillText(String(n), x - u * 0.45, y - u * 0.45);
        }
        Object.entries(LADDERS).forEach(([a, b]) => {
          const [x1, y1] = toPx(Number(a), w), [x2, y2] = toPx(b, w);
          const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), nx = (-dy / len) * u * 0.13, ny = (dx / len) * u * 0.13;
          g.strokeStyle = '#7a4f24'; g.lineWidth = u * 0.07; g.lineCap = 'round';
          g.beginPath(); g.moveTo(x1 + nx, y1 + ny); g.lineTo(x2 + nx, y2 + ny); g.moveTo(x1 - nx, y1 - ny); g.lineTo(x2 - nx, y2 - ny); g.stroke();
          g.lineWidth = u * 0.05;
          for (let t = 0.08; t < 1; t += u * 0.42 / len) { const px = x1 + dx * t, py = y1 + dy * t; g.beginPath(); g.moveTo(px + nx, py + ny); g.lineTo(px - nx, py - ny); g.stroke(); }
        });
        Object.entries(SNAKES).forEach(([a, b], i) => {
          const [x1, y1] = toPx(Number(a), w), [x2, y2] = toPx(b, w);
          const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
          const color = ['#2e8b57', '#c0392b', '#6a3fb5', '#d17a10'][i % 4];
          g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = u * 0.17;
          g.beginPath(); g.moveTo(x1, y1);
          const waves = Math.max(2, Math.round(len / (u * 1.1)));
          for (let k = 1; k <= waves; k++) {
            const t0 = (k - 0.5) / waves, t1 = k / waves, off = (k % 2 ? 1 : -1) * u * 0.42;
            g.quadraticCurveTo(x1 + dx * t0 + nx * off, y1 + dy * t0 + ny * off, x1 + dx * t1, y1 + dy * t1);
          }
          g.stroke();
          g.fillStyle = color; g.beginPath(); g.arc(x1, y1, u * 0.19, 0, TAU); g.fill();
          g.fillStyle = '#fff'; [-1, 1].forEach((s) => { g.beginPath(); g.arc(x1 + nx * s * u * 0.08, y1 + ny * s * u * 0.08, u * 0.05, 0, TAU); g.fill(); });
        });
      }, { color: '#6b4a2b' }));
    },
    draw(st, v, ctx) {
      st.finishThrow?.();
      const before = st.snakesWas || v.at;
      st.snakesWas = v.at;
      v.at.forEach((n, seat) => {
        let x, z;
        if (n === 0) { [x, z] = this.square(1); x -= 0.14 + seat * 0.02; z += 0.11 - seat * 0.045; }
        else { [x, z] = this.square(n); x += (seat - (v.n - 1) / 2) * 0.042; z += seat % 2 ? 0.02 : -0.02; }
        // a normal roll walks square by square; a ladder or a snake is one long move
        const was = before[seat] ?? n;
        let route;
        if (n > was && n - was <= 6 && was > 0) {
          route = [];
          for (let k = was + 1; k < n; k++) route.push(this.square(k));
          route.push([x, z]);
        }
        st.put(`s${seat}`, () => pawnShape(PLAYER_COLORS[seat], 0.78), x, TOP_Y, z, { hop: 0.14, route });
      });
      const [dx, dz] = st.dieAt || [0, 0];
      st.put('die', () => dieMesh(DIE_SIZE), dx, TOP_Y + DIE_SIZE / 2, dz, { rot: DIE_TURN[v.shown || 1], pick: ctx.mine ? 0 : undefined, noDrop: true });
    },
  },
  'memory-match': {
    span: 1.8,
    build(st) { st.add(plate(SIZE, SIZE * 0.72, (g, w, h) => { g.fillStyle = '#2d1f4d'; g.fillRect(0, 0, w, h); }, { color: '#1e1436' })); },
    tileMat(face) {
      this.faces = this.faces || new Map();
      if (!this.faces.has(face)) {
        this.faces.set(face, new THREE.MeshStandardMaterial({ roughness: 0.5, envMapIntensity: 0.3, map: canvasTexture(128, 128, (g) => {
          g.fillStyle = '#fbf6e9'; g.fillRect(0, 0, 128, 128);
          g.font = '82px system-ui, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(face, 64, 72);
        }) }));
      }
      return this.faces.get(face);
    },
    backMat() {
      if (!this.back) this.back = new THREE.MeshStandardMaterial({ roughness: 0.5, envMapIntensity: 0.3, map: canvasTexture(128, 128, (g) => { g.fillStyle = '#6a1b9a'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#e8c9ff'; g.lineWidth = 6; g.strokeRect(14, 14, 100, 100); g.fillStyle = '#e8c9ff'; g.font = '800 54px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 68); }) });
      return this.back;
    },
    draw(st, v, ctx) {
      const shown = new Set([...v.up, ...v.miss]);
      const W = SIZE * 0.94, D = SIZE * 0.68, cols = 6, rows = 4;
      v.owner.forEach((owner, t) => {
        if (owner >= 0) return;
        const c = t % cols, r = Math.floor(t / cols);
        const x = ((c + 0.5) / cols - 0.5) * W, z = ((r + 0.5) / rows - 0.5) * D;
        const up = shown.has(t);
        const move = ctx.legal.findIndex(m => m.t === t);
        st.put(`tile${t}`, () => { const e = mat('#ded7c6', 0.7); const m = new THREE.Mesh(box(W / cols - 0.02, 0.02, D / rows - 0.02), [e, e, this.backMat(), this.backMat(), e, e]); m.castShadow = true; return m; },
          x, TOP_Y + 0.012, z, {
            rot: [up ? Math.PI : 0, 0, 0], hop: 0.08, pick: move >= 0 ? move : undefined,
            // the face is painted on the underside, and only when somebody may see it
            update: (m) => { m.material[3] = v.faces[t] ? this.tileMat(v.faces[t]) : this.backMat(); },
          });
      });
    },
  },
  pig: { span: 1.4, tray: true, dice: (v) => [{ v: v.shown }], throwDie(st, value, hand, done, onRelease) { thrower(st, 'dice0', 0.2, 0, value, hand, done, onRelease); } },
  yacht: { span: 1.5, tray: true, dice: (v) => v.dice.map((n, i) => ({ v: n, spin: v.spins[i], keep: v.keep[i] })) },
  'crazy-eights': {
    span: 1.7,
    felt: true,
    draw(st, v, ctx, seatOf) {
      st.put(`card:${v.top}`, () => cardMesh(v.top, 0.24), 0.17, TOP_Y + 0.004, 0, { from: v.by != null && seatOf(v.by) >= 0 ? seatSpot(seatOf(v.by), 0.6) : undefined });
      for (let i = 0; i < Math.min(6, Math.ceil(v.stock / 8)); i++) st.put(`stock${i}`, () => cardMesh('back', 0.24), -0.17, TOP_Y + 0.004 + i * 0.007, -0.002 * i, { rot: [Math.PI, 0, 0], noDrop: true });
      const draw = ctx.legal.findIndex(m => m.draw);
      if (draw >= 0) st.area(-0.17, 0, 0.26, 0.36, draw, { show: true });
      st.put(`suit:${v.suit}`, () => textSprite(SUIT_ICON[v.suit], { size: 0.13, color: v.suit === 'H' || v.suit === 'D' ? '#ff7b72' : '#fff' }), 0.17, TOP_Y + 0.25, -0.26, { noDrop: true });
      opponents(st, v.counts, ctx, seatOf);
    },
  },
  'color-clash': {
    span: 1.7,
    felt: true,
    face(code) {
      this.faces = this.faces || new Map();
      if (!this.faces.has(code)) {
        const COL = { R: '#d32f2f', G: '#2e9e4f', B: '#1e6fd0', Y: '#f2b705' };
        const LBL = { S: '⊘', T: '⇄', D: '+2', W: '★', W4: '+4' };
        const v = code[0] === 'W' ? code : code.slice(1);
        this.faces.set(code, new THREE.MeshStandardMaterial({ roughness: 0.5, envMapIntensity: 0.3, map: canvasTexture(192, 270, (g, w, h) => {
          g.fillStyle = '#fbf8ef'; g.fillRect(0, 0, w, h);
          if (code[0] === 'W') { ['#d32f2f', '#2e9e4f', '#1e6fd0', '#f2b705'].forEach((c, i) => { g.fillStyle = c; g.fillRect(12 + (i % 2) * 84, 12 + Math.floor(i / 2) * 123, 84, 123); }); }
          else { g.fillStyle = COL[code[0]]; g.fillRect(12, 12, w - 24, h - 24); }
          g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w / 2, h / 2, 62, 92, -0.5, 0, Math.PI * 2); g.fill();
          g.fillStyle = code[0] === 'W' ? '#222' : COL[code[0]]; g.font = '900 78px system-ui, "Segoe UI Symbol", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(LBL[v] ?? v, w / 2, h / 2 + 4);
        }) }));
      }
      return this.faces.get(code);
    },
    draw(st, v, ctx, seatOf) {
      const edge = mat('#ded7c6', 0.7);
      const card = (code) => { const m = new THREE.Mesh(box(0.24, 0.006, 0.336), [edge, edge, this.face(code), cardFace('back'), edge, edge]); m.castShadow = true; return m; };
      st.put(`rp:${v.top}`, () => card(v.top), 0.17, TOP_Y + 0.004, 0, { from: v.by != null && seatOf(v.by) >= 0 ? seatSpot(seatOf(v.by), 0.6) : undefined, rot: [0, (v.top.charCodeAt(1) || 3) * 0.07 - 0.2, 0] });
      for (let i = 0; i < Math.min(6, Math.ceil(v.stock / 12)); i++) st.put(`stock${i}`, () => cardMesh('back', 0.24), -0.17, TOP_Y + 0.004 + i * 0.007, -0.002 * i, { rot: [Math.PI, 0, 0], noDrop: true });
      const draw = ctx.legal.findIndex(m => m.draw);
      if (draw >= 0) st.area(-0.17, 0, 0.26, 0.36, draw, { show: true });
      const COLHEX = { R: '#ff6b5b', G: '#5be37d', B: '#59a8ff', Y: '#ffd23f' };
      st.put(`colour:${v.colour}:${v.dir}`, () => textSprite(v.dir > 0 ? '⟳' : '⟲', { size: 0.13, color: COLHEX[v.colour] }), 0.17, TOP_Y + 0.25, -0.26, { noDrop: true });
      opponents(st, v.counts, ctx, seatOf);
    },
  },
  'call-break': {
    span: 1.7,
    felt: true,
    draw(st, v, ctx, seatOf) {
      const cards = v.trick.length ? v.trick : v.lastTrick?.cards || [];
      cards.forEach(({ seat, c }) => {
        const [x, z] = seatSpot(seatOf(seat), 0.22);
        st.put(`card:${c}`, () => cardMesh(c, 0.22), x, TOP_Y + 0.004, z, { rot: [0, (x - z) * 0.3, 0], hop: 0.2, from: seatSpot(seatOf(seat), 0.62) });
      });
      opponents(st, v.counts, ctx, seatOf);
    },
  },
  carrom: {
    span: 1.95,
    faces: true,
    build(st) {
      const S = SIZE / 2;
      st.add(plate(SIZE + 0.14, SIZE + 0.14, (g, w) => {
        const f = w / (SIZE + 0.14) ;
        g.fillStyle = '#3a2412'; g.fillRect(0, 0, w, w);
        const m = 0.07 * f, inner = SIZE * f;
        g.fillStyle = '#e9d0a0'; g.fillRect(m, m, inner, inner);
        const P = (v) => m + (v + 1) * (inner / 2);
        POCKETS.forEach(([x, y]) => { g.fillStyle = '#161009'; g.beginPath(); g.arc(P(x), P(y), POCKET_R * (inner / 2), 0, TAU); g.fill(); });
        g.strokeStyle = '#7a2a18'; g.lineWidth = 5;
        [CARROM_BASE, -CARROM_BASE].forEach((b) => { g.beginPath(); g.moveTo(P(-0.62), P(b)); g.lineTo(P(0.62), P(b)); g.stroke(); });
        [CARROM_BASE, -CARROM_BASE].forEach((b) => { g.beginPath(); g.moveTo(P(b), P(-0.62)); g.lineTo(P(b), P(0.62)); g.stroke(); });
        g.beginPath(); g.arc(P(0), P(0), 0.32 * (inner / 2), 0, TAU); g.stroke();
        g.beginPath(); g.arc(P(0), P(0), 0.08 * (inner / 2), 0, TAU); g.stroke();
      }, { color: '#2a1a0c' }));
      st.scale = S;
      st.aimLine = mesh(box(1, 0.003, 0.012), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.8 }));
      st.aimLine.visible = false;
      st.add(st.aimLine);
      st.aimStriker = mesh(cyl(STRIKER_R * S, STRIKER_R * S, 0.024), mat('#fdf5e0', 0.3));
      st.aimStriker.visible = false;
      st.add(st.aimStriker);
    },
    coin(id) {
      const color = id === 'q' ? '#c2185b' : id[0] === 'w' ? '#f5ecd8' : '#2a211c';
      const r = (id === 'S' ? STRIKER_R : COIN_R) * (SIZE / 2);
      return () => disc(id === 'S' ? '#fdf5e0' : color, r, 0.022);
    },
    draw(st, v) {
      const S = SIZE / 2;
      const place = (state) => {
        st.begin();
        state.coins.forEach(c => st.put(`coin${c.id}`, this.coin(c.id), c.x * S, TOP_Y, c.y * S, { noDrop: true, hop: 0 }));
        st.end();
      };
      // a shot is playing out: the newest state waits until the coins stop
      if (st.playing) { st.latest = v; return; }
      const fresh = v.frames && st.lastShot != null && v.shot !== st.lastShot;
      st.lastShot = v.shot;
      if (!fresh || reduced) { place(v); return; }
      st.latest = v;
      st.aimStriker.visible = false;
      st.aimLine.visible = false;
      const pieces = new Map(st.live.map(p => [p.kind.slice(4), p]));
      const striker = this.coin('S')();
      st.add(striker);
      let f = 0;
      st.playing = (dt) => {
        f += dt * 20;
        const at = Math.floor(f);
        const a = v.frames[Math.min(v.frames.length - 1, at)];
        const b = v.frames[Math.min(v.frames.length - 1, at + 1)];
        const k = f - at;
        v.ids.forEach((id, i) => {
          const o = id === 'S' ? striker : pieces.get(id)?.obj;
          if (!o) return;
          if (!a[i]) { o.visible = false; return; }
          const to = b[i] || a[i];
          o.position.set(((a[i][0] + (to[0] - a[i][0]) * k) / 1000) * S, TOP_Y, ((a[i][1] + (to[1] - a[i][1]) * k) / 1000) * S);
        });
        if (f < v.frames.length - 1) return;
        st.playing = null;
        st.world.remove(striker);
        pieces.forEach((p) => { p.obj.visible = true; p.t = 1; });
        place(st.latest);
        st.onShotDone?.();
      };
    },
    /** While aiming: where the striker sits and the line it will take. */
    aim(st, seat, x, angle, power) {
      const S = SIZE / 2, y = (seat === 0 ? CARROM_BASE : -CARROM_BASE);
      st.aimStriker.visible = true;
      st.aimStriker.position.set(x * S, TOP_Y + 0.012, y * S);
      const len = 0.25 + power * 1.1;
      st.aimLine.visible = true;
      st.aimLine.scale.x = len;
      st.aimLine.position.set(x * S + (Math.cos(angle) * len) / 2, TOP_Y + 0.006, y * S + (Math.sin(angle) * len) / 2);
      st.aimLine.rotation.y = -angle;
    },
    aimOff(st) { st.aimStriker.visible = false; st.aimLine.visible = false; },
  },
};

function seatSpot(actorSeat, r) {
  const a = [[-0.75, -0.65], [0.75, -0.65], [0.75, 0.65], [-0.75, 0.65]][actorSeat] || [0, 0];
  return [a[0] * r / 0.75, a[1] * r / 0.65];
}
/** Face-down hands in front of the other players, with a count. */
function opponents(st, counts, ctx, seatOf) {
  counts.forEach((n, seat) => {
    const k = seatOf(seat);
    if (k < 0 || seat === ctx.me) return;
    const [x, z] = seatSpot(k, 0.6);
    for (let i = 0; i < Math.min(5, n); i++) st.put(`hand${seat}.${i}`, () => cardMesh('back', 0.14), x + i * 0.024, TOP_Y + 0.004 + i * 0.004, z, { rot: [Math.PI, 0, 0.05 * (i - 2)], noDrop: true });
    st.put(`cnt${seat}:${n}`, () => textSprite(n, { size: 0.085 }), x, TOP_Y + 0.14, z, { noDrop: true });
  });
}

const FELT = (g, w, h) => { g.fillStyle = '#1d5e3c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 6; g.strokeRect(28, 28, w - 56, h - 56); };
const TRAY = (g, w, h) => { g.fillStyle = '#7b2d26'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,220,170,.3)'; g.lineWidth = 6; g.strokeRect(24, 24, w - 48, h - 48); };

function drawTray(st, def, v, ctx) {
  st.finishThrow?.();
  const dice = def.dice(v);
  dice.forEach((d, i) => {
    const count = dice.length;
    const x = count === 1 ? (st.dieAt?.[0] ?? 0) : ((i + 0.5) / count - 0.5) * 1.15;
    const z = count === 1 ? (st.dieAt?.[1] ?? 0) : d.keep ? 0.3 : -0.08;
    const move = ctx.legal.findIndex(m => m.h === i);
    st.put(`dice${i}`, () => dieMesh(count === 1 ? 0.2 : 0.17), x, TOP_Y + (count === 1 ? 0.1 : 0.085), z, { rot: DIE_TURN[d.v], spin: d.spin, pick: move >= 0 ? move : undefined, noDrop: true });
    if (d.keep) st.mark(x, z, move >= 0 ? move : { none: 1 }, { r: 0.13, color: '#ffe08a', y: TOP_Y + 0.003 });
  });
}

/** The chit games: one sheet of paper on the mat, showing what the table may all read. */
function chitPicture(text, label) {
  return (g, w, h) => {
    g.fillStyle = '#f3ead2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,110,190,.28)'; g.lineWidth = 3;
    for (let y = 80; y < h; y += 52) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.textAlign = 'center';
    if (label) { g.fillStyle = 'rgba(80,55,30,.6)'; g.font = '700 42px system-ui, sans-serif'; g.fillText(label, w / 2, 60); }
    if (!text) return;
    g.fillStyle = '#3a2a18'; g.textBaseline = 'middle';
    const words = String(text).split(/\s+/);
    let size = 110, lines = [];
    for (; size > 26; size -= 4) {
      g.font = `800 ${size}px system-ui, sans-serif`;
      lines = [];
      let line = '';
      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (g.measureText(next).width > w - 90 && line) { lines.push(line); line = word; } else line = next;
      }
      lines.push(line);
      if (lines.length * size * 1.18 < h - 150 && lines.every(l => g.measureText(l).width <= w - 60)) break;
    }
    const top = h / 2 - ((lines.length - 1) * size * 1.18) / 2 + 24;
    lines.forEach((l, i) => g.fillText(l, w / 2, top + i * size * 1.18));
  };
}
function chitDraw(st, info) {
  const text = info?.text || '', label = info?.label || '';
  const W = 1.0, D = 0.7;
  st.put(`paper:${label}:${text}`, () => {
    const m = plate(W, D, chitPicture(text, label), { color: '#d9ccab', thick: 0.008 });
    m.userData.ownTexture = true;
    return group(m);
  }, 0, 0.012, 0.02, { rot: [0, -0.03, 0] });
}

/**
 * The 3D side of one game. draw(view, ctx) makes the board match the state; pickAt(x, y) says what
 * a tap means: a move's number, or null. Returns null if there's no 3D (the panel still works).
 */
export function createBoard(slug, world, ctxHelpers) {
  const story = world?.story;
  if (!story?.boardRoot) return null;
  const def = BOARDS[slug] || { span: 1.5, chit: true };
  const st = new Stage(story.boardRoot);
  if (def.felt) st.add(plate(SIZE, SIZE * 0.9, FELT, { color: '#3a2412' }));
  if (def.tray) st.add(plate(SIZE * 0.86, SIZE * 0.56, TRAY, { color: '#3a2412' }));
  def.build?.(st);
  let last = 0, raf = 0, stop = false;
  const loop = (now) => {
    if (stop) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.12, (now - last) / 1000 || 0.016);
    last = now;
    st.tick(dt);
  };
  raf = requestAnimationFrame(loop);
  return {
    span: def.span,
    stage: st,
    def,
    draw(view, ctx, game) {
      st.world.rotation.y = def.faces && ctx.me === 1 ? Math.PI : 0;
      const seatOf = ctxHelpers.seatOf;
      if (def.chit) {
        st.begin();
        chitDraw(st, game.chit ? game.chit(view) : { text: 'ChitPlay', label: '' });
        st.end();
        return;
      }
      if (slug === 'carrom') { def.draw(st, view, ctx); return; }
      st.begin();
      if (def.tray) drawTray(st, def, view, ctx);
      else def.draw.call(def, st, view, ctx, seatOf);
      st.end();
    },
    /** The move number under a tap; selecting a piece redraws and returns null. */
    /** A spot worth pointing at for a new player: the first tappable mark on the board. */
    hintTarget() { return st.picks.find(o => o.visible !== false && o.material?.opacity > 0) || st.picks[0] || null; },
    pickAt(x, y, redraw, ask) {
      const hit = story.boardAt(x, y, st.picks);
      if (hit == null) return null;
      if (typeof hit === 'number') { st.sel = null; return hit; }
      if (hit.sel != null) { st.sel = st.sel === hit.sel ? null : hit.sel; redraw(); return null; }
      if (hit.promote) { ask(hit.promote); return null; }
      return null;
    },
    throwDie: def.throwDie ? (value, hand, done, onRelease) => def.throwDie(st, value, hand, done, onRelease) : null,
    aim(seat, x, a, p) { if (def.aim) def.aim(st, seat, x, a, p); },
    aimOff() { def.aimOff?.(st); },
    get animating() { return !!st.playing; },
    dispose() {
      stop = true;
      cancelAnimationFrame(raf);
      st.dispose();
    },
  };
}
