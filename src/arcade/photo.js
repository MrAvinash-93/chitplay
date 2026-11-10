/**
 * The player's own photo as their profile picture. It is shrunk to a small square on this device and
 * kept only here: it is never sent to other players or to any server. Online, others see the character.
 */
const KEY = 'chitplay.photo';
export const getPhoto = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
export const clearPhoto = () => { try { localStorage.removeItem(KEY); } catch {} };
const SIZE = 256;
const save = (canvas) => {
  const data = canvas.toDataURL('image/jpeg', 0.85);
  localStorage.setItem(KEY, data);
  return data;
};
const loadImage = (file) => new Promise((resolve, reject) => {
  if (!file || !/^image\//.test(file.type)) { reject(new Error('not an image')); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => resolve(Object.assign(img, { _url: url }));
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
  img.src = url;
});
/** Crop the middle square, without asking: small enough for local storage. */
export async function setPhotoFromFile(file) {
  const img = await loadImage(file);
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, SIZE, SIZE);
  URL.revokeObjectURL(img._url);
  return save(c);
}
/**
 * Let the player frame their own face: drag to move, pinch, wheel or slide to zoom, then save.
 * Resolves with the saved picture, or null if they cancel.
 */
export async function cropPhotoFromFile(file) {
  const img = await loadImage(file);
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const make = (tag, cls, props = {}) => Object.assign(document.createElement(tag), { className: cls }, props);
  const shade = make('div', 'crop');
  shade.setAttribute('role', 'dialog');
  shade.setAttribute('aria-modal', 'true');
  shade.setAttribute('aria-label', 'Frame your photo');
  const box = make('div', 'crop__box');
  const view = make('div', 'crop__view');
  const pic = make('img', 'crop__img', { src: img.src, alt: '', draggable: false });
  const zoom = make('input', 'crop__zoom', { type: 'range', min: '1', max: '4', step: '0.01', value: '1' });
  zoom.setAttribute('aria-label', 'Zoom');
  const cancel = make('button', 'crop__btn', { type: 'button', textContent: 'Cancel' });
  const ok = make('button', 'crop__btn crop__btn--go', { type: 'button', textContent: 'Save photo' });
  const row = make('div', 'crop__row');
  row.append(cancel, ok);
  view.append(pic);
  box.append(make('strong', 'crop__title', { textContent: 'Move and zoom to frame your face' }), view, zoom, row);
  shade.append(box);
  document.body.append(shade);

  // the picture's zoom, and where its centre sits relative to the centre of the frame
  let V = view.clientWidth || 260;
  const base = () => V / Math.min(iw, ih);
  let z = 1, x = 0, y = 0;
  const clamp = () => {
    const s = base() * z;
    const mx = Math.max(0, (iw * s - V) / 2), my = Math.max(0, (ih * s - V) / 2);
    x = Math.min(mx, Math.max(-mx, x));
    y = Math.min(my, Math.max(-my, y));
  };
  const draw = () => {
    clamp();
    const s = base() * z;
    pic.style.width = `${iw * s}px`;
    pic.style.height = `${ih * s}px`;
    pic.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  };
  const setZoom = (nz) => { const k = Math.min(4, Math.max(1, nz)) / z; x *= k; y *= k; z *= k; zoom.value = String(z); draw(); };
  draw();
  const onResize = () => { const nv = view.clientWidth || V; x *= nv / V; y *= nv / V; V = nv; draw(); };
  addEventListener('resize', onResize);

  const pts = new Map();
  let pinch = 0;
  view.addEventListener('pointerdown', (e) => { view.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); pinch = 0; });
  view.addEventListener('pointermove', (e) => {
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    const now = [e.clientX, e.clientY];
    pts.set(e.pointerId, now);
    if (pts.size === 1) { x += now[0] - prev[0]; y += now[1] - prev[1]; draw(); return; }
    const [a, b] = [...pts.values()];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (pinch) setZoom(z * d / pinch);
    pinch = d;
  });
  const lift = (e) => { pts.delete(e.pointerId); pinch = 0; };
  view.addEventListener('pointerup', lift);
  view.addEventListener('pointercancel', lift);
  view.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
  zoom.addEventListener('input', () => setZoom(Number(zoom.value)));

  return new Promise((resolve, reject) => {
    const finish = () => { removeEventListener('resize', onResize); removeEventListener('keydown', onKey); shade.remove(); URL.revokeObjectURL(img._url); };
    const onKey = (e) => { if (e.key === 'Escape') { finish(); resolve(null); } };
    addEventListener('keydown', onKey);
    cancel.addEventListener('click', () => { finish(); resolve(null); });
    ok.addEventListener('click', () => {
      const s = base() * z;
      // the frame, in the picture's own pixels
      const side = V / s;
      const sx = iw / 2 - x / s - side / 2, sy = ih / 2 - y / s - side / 2;
      const c = document.createElement('canvas');
      c.width = c.height = SIZE;
      c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      finish();
      try { resolve(save(c)); } catch (err) { reject(err); }
    });
    ok.focus({ preventScroll: true });
  });
}
/** The face to show: the photo if there is one, otherwise the drawn character. */
export function faceHtml(fallbackSvg) {
  const p = getPhoto();
  return p && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p) ? `<img class="face-photo" src="${p}" alt="">` : fallbackSvg;
}
