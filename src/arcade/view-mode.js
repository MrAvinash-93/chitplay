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

/** The look of the switch: both views side by side, the one in use lit up (added once, wherever it is used). */
const CSS = '.vtoggle{display:inline-flex;align-items:center;gap:0;padding:3px;border-radius:999px;font:800 13px system-ui,sans-serif;cursor:pointer;width:auto}'
  + '.vtoggle .vtoggle__opt{padding:4px 9px;border-radius:999px;line-height:1.1;color:inherit;opacity:.6;transition:background .15s,color .15s,opacity .15s}'
  + '.vtoggle .vtoggle__opt--on{background:#ffd23f;color:#1e120b;opacity:1;box-shadow:0 1px 4px rgba(0,0,0,.35)}';
function addStyle() {
  if (document.getElementById('vtoggle-css')) return;
  const st = document.createElement('style');
  st.id = 'vtoggle-css';
  st.textContent = CSS;
  document.head.append(st);
}

/**
 * The 3D / 2D switch: both shown, the view you are in lit up, so nobody has to guess which one is on.
 * One tap switches to the other.
 */
export function viewButton(className, onClick) {
  addStyle();
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `${className} vtoggle`;
  const opt = (label, on) => {
    const o = document.createElement('span');
    o.className = `vtoggle__opt${on ? ' vtoggle__opt--on' : ''}`;
    o.textContent = label;
    return o;
  };
  const paint = () => {
    b.replaceChildren(opt('3D', !is2d()), opt('2D', is2d()));
    const tip = is2d() ? 'View: 2D. Tap for 3D' : 'View: 3D. Tap for 2D';
    b.title = tip;
    b.setAttribute('aria-label', tip);
    b.setAttribute('aria-pressed', String(is2d()));
  };
  paint();
  b.addEventListener('click', () => { setView(is2d() ? '3d' : '2d'); paint(); onClick?.(); });
  // another switch (the profile, a game's bar) changed the view: show it here too
  window.addEventListener('chitplay:view', paint);
  return b;
}
