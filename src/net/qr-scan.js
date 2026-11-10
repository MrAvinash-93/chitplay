/**
 * Reads a friend's invite QR code on this device. Camera frames and pictures
 * never leave the phone. The live camera needs a secure (https) page; a photo or
 * a saved screenshot of the code works everywhere.
 *
 * jsQR (Apache-2.0, vendored in src/vendor) loads only if the browser has no
 * built-in barcode reader, or the built-in one can't read a picture.
 */
let jsQrLoading = null;
function loadJsQr() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (jsQrLoading) return jsQrLoading;
  jsQrLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/jsqr.min.js?v=20261110-1222.4.0', import.meta.url).href;
    s.onload = () => (window.jsQR ? resolve(window.jsQR) : reject(new Error('load')));
    s.onerror = () => { jsQrLoading = null; reject(new Error('load')); };
    document.head.append(s);
  });
  return jsQrLoading;
}

/** The 6-digit code from what a QR holds: an invite link or the digits themselves. Anything else: null. */
export function joinCodeFrom(text) {
  const raw = String(text || '').trim();
  try {
    const code = new URL(raw).searchParams.get('join');
    if (/^\d{6}$/.test(code || '')) return code;
  } catch { /* not a link */ }
  const digits = raw.replace(/\s/g, '');
  return /^\d{6}$/.test(digits) ? digits : null;
}

/** The browser's own reader, or null where there isn't one. */
async function nativeReader() {
  if (!('BarcodeDetector' in window)) return null;
  try {
    const formats = await window.BarcodeDetector.getSupportedFormats();
    if (!formats.includes('qr_code')) return null;
    const d = new window.BarcodeDetector({ formats: ['qr_code'] });
    return async (source) => (await d.detect(source))[0]?.rawValue || null;
  } catch {
    return null;
  }
}

/** jsQR over a canvas. `crop` reads only the middle of the picture, which brings a far-away code closer. */
async function canvasReader() {
  const jsQR = await loadJsQr();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return (source, { maxSide = 900, crop = 1 } = {}) => {
    const w = source.videoWidth || source.naturalWidth || source.width;
    const h = source.videoHeight || source.naturalHeight || source.height;
    if (!w || !h) return null;
    const cw = w * crop, ch = h * crop;
    const scale = Math.min(1, maxSide / Math.max(cw, ch));
    canvas.width = Math.round(cw * scale);
    canvas.height = Math.round(ch * scale);
    ctx.drawImage(source, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data || null;
  };
}

/**
 * A photo or screenshot of the code.
 * Resolves with { code } for an invite, { other: true } for some other QR code, or {} if it found none.
 */
export async function codeFromPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
    let text = null;
    const native = await nativeReader();
    if (native) text = await native(img).catch(() => null);
    if (!text) {
      const read = await canvasReader();
      text = read(img) || read(img, { maxSide: 1600 }) || read(img, { maxSide: 1200, crop: 0.6 });
    }
    if (!text) return {};
    const code = joinCodeFrom(text);
    return code ? { code } : { other: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Live camera in the given <video>, which must already be on the page.
 * Calls onCode once with a valid invite, onOther whenever it sees some other QR code.
 *
 * Returns straight away, so a player can cancel while the permission question is up:
 *   stop()         turns the camera off (it also goes off if the video leaves the page)
 *   ready          resolves with { torch } when the picture is showing, rejects if the camera can't open
 *   setTorch(on)   the phone's light, where it has one
 */
export function startCameraScan(video, onCode, onOther = () => {}) {
  let running = true;
  let stream = null;
  const stop = () => {
    if (!running) return;
    running = false;
    stream?.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  };
  const scan = async (readFrame) => {
    for (let frame = 0; running; frame++) {
      if (!video.isConnected) { stop(); return; }
      if (!document.hidden) {
        try {
          const text = await readFrame(frame);
          if (text && running) {
            const code = joinCodeFrom(text);
            if (code) { stop(); onCode(code); return; }
            onOther();
          }
        } catch { /* a frame that couldn't be read */ }
      }
      await new Promise(r => setTimeout(r, 180));
    }
  };
  const ready = (async () => {
    const opened = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
    });
    if (!running) { opened.getTracks().forEach(t => t.stop()); return null; }   // cancelled during the question
    stream = opened;
    video.srcObject = stream;
    video.setAttribute('playsinline', '');
    video.muted = true;
    try {
      await video.play();
    } catch (e) {
      if (!running) return null;
      stop();
      throw e;
    }
    const track = stream.getVideoTracks()[0];
    track?.applyConstraints?.({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
    const native = await nativeReader();
    if (!running) return null;
    if (native) {
      scan(() => native(video));
    } else {
      const read = await canvasReader();
      // every other frame looks at the middle only, for a code held further away
      scan((frame) => (frame % 2 ? read(video, { crop: 0.55 }) : read(video)));
    }
    return { torch: !!track?.getCapabilities?.().torch };
  })();
  const setTorch = (on) => stream?.getVideoTracks()[0]?.applyConstraints({ advanced: [{ torch: !!on }] }).catch(() => {});
  return { stop, ready, setTorch };
}
