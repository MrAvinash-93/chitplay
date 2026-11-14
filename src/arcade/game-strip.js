/**
 * "More games" in the game menu: every game's logo in one row that scrolls sideways. Tap one and it
 * opens straight away, so someone bored of a game can jump to another without going back home.
 * The game being played comes first and is marked; the chit game sits at the front of the rest.
 */
import { ALL_GAMES } from './catalog.js?v=20261114-1217';
import { logoSvg } from './logo.js?v=20261114-1217';

const CSS = ".gamestrip { margin: 4px 0 6px; }\n.gamestrip__title { margin: 0 0 6px; font: 800 13px system-ui, sans-serif; opacity: .85; }\n.gamestrip__row { display: flex; gap: 8px; overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x proximity; padding: 2px 2px 8px; scrollbar-width: thin; scrollbar-color: rgba(255,210,63,.55) transparent; -webkit-overflow-scrolling: touch; }\n.gamestrip__game { flex: 0 0 76px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px 4px; border-radius: 14px; text-decoration: none; color: inherit; background: rgba(255,255,255,.05); border: 2px solid transparent; scroll-snap-align: start; }\n.gamestrip__game:hover, .gamestrip__game:focus-visible { background: rgba(255,255,255,.12); outline: none; }\n.gamestrip__game:active { transform: scale(.96); }\n.gamestrip__game--here { border-color: #ffd23f; cursor: default; }\n.gamestrip__logo svg { display: block; width: 56px; height: 56px; }\n.gamestrip__name { font: 700 11px/1.2 system-ui, sans-serif; text-align: center; max-width: 72px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }\n.gamestrip__row::-webkit-scrollbar { height: 6px; }\n.gamestrip__row::-webkit-scrollbar-track { background: transparent; }\n.gamestrip__row::-webkit-scrollbar-thumb { background: rgba(255,210,63,.55); border-radius: 6px; }";
function addStyle() {
  if (document.getElementById('gamestrip-css')) return;
  const style = document.createElement('style');
  style.id = 'gamestrip-css';
  style.textContent = CSS;
  document.head.append(style);
}

const CHIT = { slug: 'cops-and-robbers', name: 'Raja Rani Chor Police', icon: '👑', accent: '#b8862b', kind: 'Party' };

/**
 * @param {object} o
 * @param {string|null} o.current   slug of the game being played (null for the chit game)
 * @param {string} o.root           path from this page to the site root ('../' on /play/, '' on the home page)
 * @param {(href: string) => boolean} [o.leave]  asked before leaving a game in progress; false stays
 * @param {string} [o.title]
 */
export function gameStrip({ current, root, leave = () => true, title = 'More games' }) {
  const lang = new URLSearchParams(location.search).get('lang');
  const tail = lang ? `&lang=${encodeURIComponent(lang)}` : '';
  const hrefFor = (g) => (g.slug === CHIT.slug ? `${root}?game=${CHIT.slug}${tail}` : `${root}play/?game=${g.slug}&mode=play${tail}`);
  const here = current ? ALL_GAMES.find(g => g.slug === current) : CHIT;
  const games = [here, ...[CHIT, ...ALL_GAMES].filter(g => g && g !== here)].filter(Boolean);

  addStyle();
  const wrap = document.createElement('div');
  wrap.className = 'gamestrip';
  const head = document.createElement('p');
  head.className = 'gamestrip__title';
  head.textContent = `🎮 ${title}`;
  const row = document.createElement('div');
  row.className = 'gamestrip__row';
  row.setAttribute('role', 'list');
  for (const g of games) {
    const a = document.createElement('a');
    a.className = `gamestrip__game${g === here ? ' gamestrip__game--here' : ''}`;
    a.href = hrefFor(g);
    a.setAttribute('role', 'listitem');
    a.setAttribute('aria-label', g === here ? `${g.name} (playing now)` : `Play ${g.name}`);
    if (g === here) a.setAttribute('aria-current', 'page');
    const logo = document.createElement('span');
    logo.className = 'gamestrip__logo';
    logo.innerHTML = logoSvg(g, 64);
    const name = document.createElement('span');
    name.className = 'gamestrip__name';
    name.textContent = g === here ? '▶ Now' : g.name;
    a.append(logo, name);
    a.addEventListener('click', (e) => {
      if (g === here) { e.preventDefault(); return; }
      if (!leave(a.href)) e.preventDefault();
    });
    row.append(a);
  }
  // a mouse wheel scrolls the row sideways on a computer
  row.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { row.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });
  wrap.append(head, row);
  return wrap;
}
