/**
 * Ads inside the games. One Adsterra native banner box, reused (its container may exist once on a
 * page), and shown only where it cannot get in a player's way:
 *  - on a computer while playing: in the empty space above the controls on the right, only when
 *    there is room for it (it never covers the board, the TV or a control);
 *  - on the result screen after a match, last, below every button;
 *  - at the end of the home screen's list of games.
 * Never on a phone during play. The box stays hidden until an ad has actually arrived, so nobody
 * ever sees an empty "Advertisement" label. Set ID to '' to switch ads off.
 */
const ID = 'd5795ad3a6b91ea89d9d71ba6f70c273';
const SRC = 'https://bauval.org/21/d5795ad3a6b91ea89d9d71ba6f70c273';

let box = null;
let loaded = false;
let side = null;

const CSS = '.adbox--result,.adbox--side{display:none}.adbox--filled{display:block}'
  + '.adbox--result{margin:14px 0 4px;padding:8px 0 0;border-top:1px solid rgba(255,210,122,.15);text-align:center}'
  + '.adbox--result small,.adbox--side small{display:block;font:700 10px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.55;margin-bottom:4px}'
  + '.adside{position:fixed;right:16px;top:64px;z-index:5;width:300px;max-height:280px;overflow:hidden;padding:8px;border-radius:14px;background:rgba(20,10,5,.72);display:none}'
  + '.adside--on{display:block}';

function make() {
  if (box) return box;
  if (!document.getElementById('ads-css')) { const st = document.createElement('style'); st.id = 'ads-css'; st.textContent = CSS; document.head.append(st); }
  box = document.createElement('aside');
  box.className = 'adbox adbox--result';
  box.setAttribute('aria-label', 'Advertisement');
  const label = document.createElement('small');
  label.textContent = 'Advertisement';
  const container = document.createElement('div');
  container.id = `container-${ID}`;
  box.append(label, container);
  // shown only once the network has put an ad in it
  new MutationObserver(() => {
    if (container.childElementCount) { box.classList.add('adbox--filled'); fitSide(); }
  }).observe(container, { childList: true, subtree: true });
  return box;
}
function load() {
  if (loaded) return;
  requestAnimationFrame(() => {
    if (loaded || !box?.isConnected) return;
    loaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.dataset.cfasync = 'false';
    s.src = SRC;
    document.body.append(s);
  });
}

/** The ad box for a result panel or the end of a list (or null when ads are off). */
export function resultAd() {
  if (!ID) return null;
  make();
  box.classList.replace('adbox--side', 'adbox--result');
  side?.classList.remove('adside--on');
  load();
  return box;
}

/* ─── on a computer, while playing: the empty space above the controls ─── */
const wide = () => window.innerWidth >= 1100 && window.innerHeight >= 640 && !matchMedia('(pointer: coarse)').matches;
function fitSide() {
  if (!side || !box || box.parentElement !== side) return;
  const controls = document.querySelector('.tvpanel, .panel--play, .panel');
  const top = controls ? controls.getBoundingClientRect().top : window.innerHeight;
  // room for the ad between the top bar and the controls, with a gap; otherwise it stays out of the way
  const room = top - 64 - 16;
  side.classList.toggle('adside--on', wide() && room >= 260 && box.classList.contains('adbox--filled'));
}
/** A match has started: on a wide screen the ad waits above the controls (hidden if there is no room). */
export function sideAd() {
  if (!ID || !wide()) return;
  make();
  if (!side) {
    side = document.createElement('div');
    side.className = 'adside';
    document.body.append(side);
    addEventListener('resize', fitSide);
    setInterval(fitSide, 1500);   // the controls change size as the game goes on
  }
  box.classList.replace('adbox--result', 'adbox--side');
  side.append(box);
  load();
  fitSide();
}
