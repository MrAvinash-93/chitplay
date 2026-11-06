/**
 * Single entry point for the lazily loaded 3D world, so bootstrap and the
 * Bachpan Mode screen share one instance.
 */
let pending = null;

export function loadWorld(app) {
  if (!pending) {
    pending = import('./world-3d.js?v=20261105-world')
      .then(m => m.initWorld3D(app))
      .catch(e => { console.warn('[World3D] disabled:', e); return null; });
  }
  return pending;
}
