/**
 * A pointing hand that shows a new player where to tap (or, with a mouse, where to click) the first
 * few times they play a game. It sits on a spot on the screen, says what to do in a few words, and
 * goes away at the first touch. After a few turns of a game it stops showing for that game.
 */
const KEY = (slug) => `chitplay.hint.${slug}`;
const fine = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
let current = null;

/** How many more times this game should show the hand. */
export function hintsLeft(slug, max = 3) {
  try { return Math.max(0, max - (Number(localStorage.getItem(KEY(slug))) || 0)); } catch { return 0; }
}
function used(slug) { try { localStorage.setItem(KEY(slug), String((Number(localStorage.getItem(KEY(slug))) || 0) + 1)); } catch {} }

export function hideHint() { current?.remove(); current = null; }

/**
 * Shows the hand at a screen point or over an element. `text` is the short instruction; `{ drag }`
 * makes the hand slide as if dragging, for sticks and pulls.
 */
export function showHint(slug, target, text, { drag = false, max = 3 } = {}) {
  if (!target || !hintsLeft(slug, max)) return;
  let x, y;
  if (target instanceof Element) {
    const r = target.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
    x = r.left + r.width / 2; y = r.top + r.height / 2;
  } else ({ x, y } = target);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  hideHint();
  const hand = document.createElement('div');
  hand.className = `hint-hand${drag ? ' hint-hand--drag' : ''}`;
  hand.setAttribute('aria-hidden', 'true');
  hand.style.left = `${Math.min(innerWidth - 30, Math.max(30, x))}px`;
  hand.style.top = `${Math.min(innerHeight - 30, Math.max(30, y))}px`;
  const ring = document.createElement('span');
  ring.className = 'hint-hand__ring';
  const finger = document.createElement('span');
  finger.className = 'hint-hand__finger';
  finger.textContent = '👆';
  const say = document.createElement('span');
  say.className = 'hint-hand__text';
  say.textContent = fine() ? text.replace(/^Tap/, 'Click') : text;
  if (y > innerHeight * 0.7) say.classList.add('hint-hand__text--up');
  hand.append(ring, finger, say);
  document.body.append(hand);
  // keep the words on the screen, even when the spot is near an edge
  const r = say.getBoundingClientRect();
  if (r.left < 8) say.style.marginLeft = `${8 - r.left}px`;
  else if (r.right > innerWidth - 8) say.style.marginLeft = `${innerWidth - 8 - r.right}px`;
  current = hand;
  used(slug);
  const off = () => { if (current === hand) hideHint(); removeEventListener('pointerdown', off, true); };
  setTimeout(() => addEventListener('pointerdown', off, true), 300);
  setTimeout(off, 7000);
}
