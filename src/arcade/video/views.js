/**
 * The TV games' 3D pictures. Each game's view is its own file (views/<game>.js), loaded only when
 * that game is played: a phone playing Pen Fight never downloads the tunnel, the ghost house or the hoops.
 * createView(slug) resolves to the view, or null when the game has only the flat picture.
 */
const V = '?v=20261116-1213';
const FILES = {
  'turbo-tunnel': ['./turbo-view.js', 'turboView'],
  'ghost-hostel': ['./views/ghost-hostel.js', 'default'],
  'hoop-flick': ['./views/hoop-flick.js', 'default'],
  'pin-spin': ['./views/pin-spin.js', 'default'],
  'bull-fight': ['./views/bull-fight.js', 'default'],
  'tunnel-race': ['./views/tunnel-race.js', 'default'],
  'flying-chit': ['./views/flying-chit.js', 'default'],
  'ship-fight': ['./views/ship-fight.js', 'default'],
  'backyard-rally': ['./views/backyard-rally.js', 'default'],
  'hungry-snake': ['./views/hungry-snake.js', 'default'],
  'road-dash': ['./views/road-dash.js', 'default'],
  'spin-duel': ['./views/spin-duel.js', 'default'],
  'pen-fight': ['./views/pen-fight.js', 'default'],
  'lapa-chupi': ['./views/tag-game.js', 'default'],
  'baraf-pani': ['./views/tag-game.js', 'default'],
  'pakda-padi': ['./views/tag-game.js', 'default'],
};
const TAGS = new Set(['lapa-chupi', 'baraf-pani', 'pakda-padi']);
export const hasView = (slug) => !!FILES[slug];
/** The module a game's view lives in: tv.js can start fetching it before it needs it. */
export const viewFile = (slug) => (FILES[slug] ? new URL(FILES[slug][0] + V, import.meta.url).href : null);
export async function createView(slug) {
  const f = FILES[slug];
  if (!f) return null;
  const make = (await import(f[0] + V))[f[1]];
  return TAGS.has(slug) ? make(slug) : make();
}
