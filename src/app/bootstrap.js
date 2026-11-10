import { createApp } from './lifecycle.js?v=20261110-1410';
import { GAME_PHASES } from './config.js?v=20261110-1410';
import { audioManager } from '../audio/audio-manager.js';
import { loadWorld } from '../world/world-loader.js?v=20261110-1410';
import { GameScreen } from '../ui/screens/game-screen.js?v=20261110-1410';

/**
 * ChitPlay is now a single 3D game: one screen (the 3D room) that hosts the
 * start sheet, the country editions and the auto-played match.
 */
function boot() {
  const root = document.getElementById('app');
  const app = createApp(root);

  // Start loading the 3D world before the screen asks for it.
  loadWorld(app);

  app.router.register(GAME_PHASES.HOME, GameScreen);

  // Unlock audio on first user interaction
  const unlock = () => {
    audioManager.unlock();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });

  app.transition(GAME_PHASES.HOME);

  // Expose for debugging (non-enumerable, dev-only)
  Object.defineProperty(window, '__chitplay', {
    value: app,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return app;
}

// Never let one bad frame or promise take the whole game down.
window.addEventListener('error', (e) => console.error('[ChitPlay] error:', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && typeof e.reason === 'symbol') { e.preventDefault(); return; }   // our own cancellations
  console.error('[ChitPlay] unhandled:', e.reason);
});

// Offline + instant repeat visits in production (skipped on localhost so edits show up right away).
if ('serviceWorker' in navigator && !/^(localhost|127\.|\[::1\]|0\.0\.0\.0|192\.168\.|10\.)/.test(location.hostname)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('[ChitPlay] service worker:', e));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
