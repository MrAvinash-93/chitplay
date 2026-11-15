/**
 * The /play/ page opens every game, each on its own address:
 *  - the table, card and TV games (?game=ludo, ?game=flying-chit …) play in the arcade (src/arcade/table.js);
 *  - Cops and Robbers, by any of its names (?game=cops-and-robbers, ?game=raja-rani-chor-police …),
 *    plays in the 3D room (src/app/bootstrap.js), the same game that used to open on the home page.
 * The home page keeps the list of every game, search, scan and the profile.
 */
import { gameBySlug } from '../arcade/catalog.js?v=20261115-1946';
import { GAME_SLUGS } from '../world/countries.js?v=20261115-1946';

const q = new URLSearchParams(location.search);
const slug = (q.get('game') || '').trim().toLowerCase();
const isCops = !!slug && !gameBySlug(slug) && (Object.values(GAME_SLUGS).includes(slug) || /^[a-z]{2}$/.test(slug));

if (isCops) {
  window.__chitplayCopsPage = true;
  document.documentElement.classList.add('cops-page');   // its top bar keeps only Menu, the round and the scores
  // the 3D room's links, pictures and pages are all written from the site's root
  const base = document.createElement('base');
  base.href = new URL('../', location.href).href;
  document.head.prepend(base);
  // its own look: the home page's styles in place of the arcade's
  document.querySelector('link[href*="arcade/arcade.css"]')?.remove();
  for (const f of ['base.css', 'layout.css']) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = new URL(`../styles/${f}?v=20261115-1946`, import.meta.url).href;
    document.head.append(l);
  }
  document.title = 'Cops and Robbers (Raja Rani Chor Police): Play Free in 3D | ChitPlay';
  const app = document.createElement('div');
  app.id = 'app';
  app.setAttribute('role', 'application');
  app.setAttribute('aria-label', 'Cops and Robbers');
  document.getElementById('party')?.replaceWith(app);
  await import('./bootstrap.js?v=20261115-1946');
} else {
  await import('../arcade/table.js?v=20261115-1946');
}
