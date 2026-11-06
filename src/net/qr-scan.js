/**
 * Reads a friend's invite QR code on this device. Camera frames never leave the
 * phone. The camera needs a secure (https) page; where it isn't available, the
 * player can take a photo of the code instead, which works everywhere.
 *
 * jsQR (Apache-2.0, vendored in src/vendor) loads only if the browser has no
 * built-in barcode reader.
 */
let jsQrLoading = null;
function loadJsQr() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (jsQrLoading) return jsQrLoading;
  jsQrLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/jsqr.min.js?v=1.4.0', import.meta.url).href;
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

async function makeReader() {
  if ('BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.includes('qr_code')) {
        const d = new window.BarcodeDetector({ formats: ['qr_code'] });
        return async (source) => (await d.detect(source))[0]?.rawValue || null;
      }
    } catch { /* fall through to jsQR */ }
  }
  const jsQR = await loadJsQr();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (source) => {
    const w = source.videoWidth || source.naturalWidth || source.width;
    const h = source.videoHeight || source.naturalHeight || source.height;
    if (!w || !h) return null;
    const scale = Math.min(1, 900 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data || null;
  };
}

export const canUseCamera = () => !!navigator.mediaDevices?.getUserMedia && window.isSecureContext !== false;

/** A photo of the code. Resolves with a 6-digit code, or null if none was found. */
export async function codeFromPhoto(file) {
  const read = await makeReader();
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
    return joinCodeFrom(await read(img));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Live camera in the given <video>. Calls onCode once a valid invite is seen.
 * Returns a stop() function; rejects if the camera can't be opened.
 */
export async function startCameraScan(video, onCode) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  video.muted = true;
  await video.play();
  const read = await makeReader();
  let running = true;
  const stop = () => {
    running = false;
    stream.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  };
  (async () => {
    while (running) {
      try {
        const code = joinCodeFrom(await read(video));
        if (code && running) { stop(); onCode(code); return; }
      } catch { /* a frame that couldn't be read */ }
      await new Promise(r => setTimeout(r, 220));
    }
  })();
  return stop;
}
