/**
 * The player's own photo as their profile picture. It is shrunk to a small square on this device and
 * kept only here: it is never sent to other players or to any server. Online, others see the character.
 */
const KEY = 'chitplay.photo';
export const getPhoto = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
export const clearPhoto = () => { try { localStorage.removeItem(KEY); } catch {} };
/** Crop the middle square, 160 px, JPEG: small enough for local storage. */
export function setPhotoFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error('not an image')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      const c = document.createElement('canvas');
      c.width = c.height = 160;
      c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 160, 160);
      URL.revokeObjectURL(url);
      const data = c.toDataURL('image/jpeg', 0.82);
      try { localStorage.setItem(KEY, data); resolve(data); } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });
}
/** The face to show: the photo if there is one, otherwise the drawn character. */
export function faceHtml(fallbackSvg) {
  const p = getPhoto();
  return p && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p) ? `<img class="face-photo" src="${p}" alt="">` : fallbackSvg;
}
