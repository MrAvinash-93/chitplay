/**
 * The first visit: five short screens that say what ChitPlay is, in a warm voice. Next, Back, or
 * Skip at any time; it shows once. The games are right behind it, so nobody waits to play.
 */
const KEY = 'chitplay.intro';

const SLIDES = [
  { icon: '👋', title: 'Welcome to ChitPlay', body: 'A cosy living room full of games, the way evenings at home used to be. Free, in your browser: no download, no sign-up, for every age.' },
  { icon: '🎲', title: '47 games, one room', body: 'Ludo, Chess, Carrom and Call Break. Raja Rani Chor Police, the chit game from school. 3D racing on the room’s TV, and quick brain games for a short break.' },
  { icon: '👫', title: 'Play with friends and family', body: 'Tap Play with Friends, share a code, and everyone joins from their own phone, near or far. You pick the games; the whole party goes with you.' },
  { icon: '🏠', title: 'Your room grows with you', body: 'Every game earns points and coins. Climb the ranks, win medals, and make the room your own: new looks for the board, the walls and your character.' },
  { icon: '❤️', title: 'This is your place now', body: 'We gave you a name and a character to start with; change them any time in your profile. Pull up a seat. Let’s play!' },
];

const CSS = `
.intro{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(circle at 50% 30%,rgba(60,30,14,.82),rgba(10,5,3,.9))}
.intro__card{width:min(440px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#1e120b;color:#f6ead2;border:1px solid rgba(255,210,122,.3);border-radius:22px;padding:22px 20px 18px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.5);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.intro__icon{font-size:64px;line-height:1.1;display:block;margin:4px 0 8px;animation:intro-pop .45s ease-out}
.intro__card h2{margin:0 0 8px;color:#ffd27a;font-size:clamp(22px,6vw,28px);line-height:1.2}
.intro__card p{margin:0 auto;max-width:36ch;overflow-wrap:break-word}
.intro__dots{display:flex;justify-content:center;gap:7px;margin:18px 0 14px}
.intro__dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,210,122,.25);transition:width .2s,background .2s}
.intro__dots i.on{width:22px;border-radius:6px;background:#ffd27a}
.intro__row{display:flex;gap:10px;align-items:center}
.intro__btn{flex:1;min-height:46px;padding:10px 14px;border-radius:14px;border:0;font:800 16px system-ui,sans-serif;cursor:pointer}
.intro__btn--go{background:linear-gradient(#ffb347,#f0791f);color:#1e120b}
.intro__btn--back{flex:0 0 auto;background:#2c1a10;color:#ffd27a;border:1px solid rgba(255,210,122,.3)}
.intro__skip{margin-top:10px;background:none;border:0;color:#d4c2a0;font:700 14px system-ui,sans-serif;cursor:pointer;padding:8px}
@keyframes intro-pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){.intro__icon{animation:none}}
`;

/** Show the intro on the first visit (unless the page was opened for a game or a party). */
export function maybeShowIntro() {
  try { if (localStorage.getItem(KEY)) return; } catch { return; }
  const q = new URLSearchParams(location.search);
  if (q.has('game') || q.has('party') || q.has('join')) return;   // they came to play something: let them
  let i = 0;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  const root = document.createElement('div');
  root.className = 'intro';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Welcome to ChitPlay');
  const card = document.createElement('div');
  card.className = 'intro__card';
  root.append(card);
  const done = () => {
    try { localStorage.setItem(KEY, '1'); } catch {}
    removeEventListener('keydown', onKey, true);
    root.remove();
    style.remove();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); done(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  };
  const next = () => { if (i >= SLIDES.length - 1) done(); else { i++; paint(); } };
  const back = () => { if (i > 0) { i--; paint(); } };
  function paint() {
    const s = SLIDES[i], last = i === SLIDES.length - 1;
    card.innerHTML = '';
    const icon = document.createElement('span'); icon.className = 'intro__icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = s.icon;
    const h = document.createElement('h2'); h.textContent = s.title;
    const p = document.createElement('p'); p.textContent = s.body;
    const dots = document.createElement('div'); dots.className = 'intro__dots'; dots.setAttribute('aria-label', `${i + 1} of ${SLIDES.length}`);
    SLIDES.forEach((_, k) => { const d = document.createElement('i'); if (k === i) d.className = 'on'; dots.append(d); });
    const row = document.createElement('div'); row.className = 'intro__row';
    if (i > 0) { const b = document.createElement('button'); b.type = 'button'; b.className = 'intro__btn intro__btn--back'; b.textContent = '←'; b.setAttribute('aria-label', 'Back'); b.onclick = back; row.append(b); }
    const go = document.createElement('button'); go.type = 'button'; go.className = 'intro__btn intro__btn--go'; go.textContent = last ? '🎮 Let’s play!' : 'Next →'; go.onclick = next; row.append(go);
    card.append(icon, h, p, dots, row);
    if (!last) { const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'intro__skip'; skip.textContent = 'Skip'; skip.onclick = done; card.append(skip); }
    go.focus({ preventScroll: true });
  }
  addEventListener('keydown', onKey, true);
  document.body.append(root);
  paint();
}
