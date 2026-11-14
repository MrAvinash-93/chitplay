/**
 * 3D or 2D, chosen on each phone and kept there. 3D is the room with the players around the board;
 * 2D looks straight down on the board with nothing else in the picture (TV games use their flat
 * drawing). The choice lives on <html data-view>, so the room, the boards and the TV games all read
 * the same thing, and a switch mid-game takes effect on the next frame.
 */
const KEY = 'chitplay.view';
let mode = (() => { try { return localStorage.getItem(KEY) === '2d' ? '2d' : '3d'; } catch { return '3d'; } })();
document.documentElement.dataset.view = mode;

export const is2d = () => mode === '2d';

export function setView(next) {
  mode = next === '2d' ? '2d' : '3d';
  try { localStorage.setItem(KEY, mode); } catch { /* storage blocked: the choice lasts this visit */ }
  document.documentElement.dataset.view = mode;
  window.dispatchEvent(new CustomEvent('chitplay:view', { detail: mode }));
}

/** The 2D/3D switch for a top bar: it shows the view you'd switch to. */
export function viewButton(className, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  const paint = () => {
    const tip = is2d() ? 'Switch to 3D view' : 'Switch to 2D view';
    b.textContent = is2d() ? '3D' : '2D';
    b.title = tip;
    b.setAttribute('aria-label', tip);
    b.setAttribute('aria-pressed', String(is2d()));
  };
  paint();
  b.addEventListener('click', () => { setView(is2d() ? '3d' : '2d'); paint(); onClick?.(); });
  return b;
}
