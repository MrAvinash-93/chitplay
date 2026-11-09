/**
 * Every game in progress is kept on this device, so a refresh (or a closed tab) carries on from the
 * same move. Games against friends on other phones can't be kept this way: the other phones would
 * have moved on. One saved game per game type; old ones are dropped after three days.
 */
const KEY = 'chitplay.resume.v1';
const MAX_AGE = 3 * 24 * 3600 * 1000;
const readAll = () => { try { const a = JSON.parse(localStorage.getItem(KEY)); return a && typeof a === 'object' ? a : {}; } catch { return {}; } };
const writeAll = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* storage full: the game still plays, it just won't be kept */ } };

export function saveGame(slug, data) {
  const a = readAll();
  a[slug] = { ...data, at: Date.now() };
  writeAll(a);
}
export function loadSaved(slug) {
  const s = readAll()[slug];
  return s && Date.now() - s.at < MAX_AGE ? s : null;
}
export function clearSaved(slug) {
  const a = readAll();
  if (a[slug]) { delete a[slug]; writeAll(a); }
}
/** Games with something to carry on, newest first: [{ slug, at }]. */
export function savedList() {
  return Object.entries(readAll()).filter(([, v]) => Date.now() - v.at < MAX_AGE).map(([slug, v]) => ({ slug, at: v.at })).sort((a, b) => b.at - a.at);
}
/** Was this page opened by reloading it (pull-to-refresh, F5)? */
export const isReload = () => { try { return performance.getEntriesByType('navigation')[0]?.type === 'reload'; } catch { return false; } };
