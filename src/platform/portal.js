/**
 * Game portals (CrazyGames, Poki) host the game in a frame on their own site and show their own
 * ads. The portal build sets window.CHITPLAY_PORTAL and loads the portal's SDK; this tells the
 * portal when the game has loaded, when play starts and stops, and asks it for an ad between
 * matches. On www.chitplay.com (no portal) every function here does nothing.
 */
import { audioManager } from '../audio/audio-manager.js';

export const PORTAL = (typeof window !== 'undefined' && window.CHITPLAY_PORTAL) || '';
let sdk = null;
let ready = null;
let playing = false;

/** Start the portal's SDK once; safe to call many times. */
export function portalInit() {
  if (ready) return ready;
  ready = (async () => {
    if (!PORTAL) return;
    document.documentElement.classList.add('portal', `portal--${PORTAL}`);
    try {
      const cg = window.CrazyGames?.SDK;
      if (PORTAL === 'crazygames' && cg) {
        await cg.init();
        sdk = {
          start: () => cg.game.gameplayStart(),
          stop: () => cg.game.gameplayStop(),
          loaded: () => cg.game.loadingStop?.(),
          loading: () => cg.game.loadingStart?.(),
          ad: () => new Promise((done) => cg.ad.requestAd('midgame', { adFinished: done, adError: done, adStarted: () => {} })),
        };
      } else if (PORTAL === 'poki' && window.PokiSDK) {
        await window.PokiSDK.init();
        sdk = {
          start: () => window.PokiSDK.gameplayStart(),
          stop: () => window.PokiSDK.gameplayStop(),
          loaded: () => window.PokiSDK.gameLoadingFinished(),
          loading: () => {},
          ad: () => window.PokiSDK.commercialBreak(),
        };
      }
      sdk?.loading();
    } catch (e) {
      console.warn('[ChitPlay] portal SDK did not start', e);
      sdk = null;
    }
  })();
  return ready;
}

/** The game is ready to play: the portal can hide its loading screen. */
export async function loadingDone() {
  await portalInit();
  try { sdk?.loaded(); } catch {}
}

/** Play has started (a match, a run): the portal must not show an ad now. */
export function gameplayStart() {
  if (!sdk || playing) return;
  playing = true;
  try { sdk.start(); } catch {}
}

/** Play has stopped (a menu, the end of a match). */
export function gameplayStop() {
  if (!sdk || !playing) return;
  playing = false;
  try { sdk.stop(); } catch {}
}

/**
 * A natural break between matches: the portal may show an ad. The game is paused and silent
 * until it is over. Resolves straight away when there is no portal.
 */
export async function adBreak() {
  if (!sdk) return;
  gameplayStop();
  dispatchEvent(new CustomEvent('chitplay:pause', { detail: { on: true } }));
  // the ad plays with the game silent (a portal rule), then the sound comes back as it was
  const sound = audioManager.enabled !== false;
  audioManager.setEnabled(false);
  try { window.speechSynthesis?.cancel(); } catch {}
  try { await sdk.ad(); } catch {}
  audioManager.setEnabled(sound);
  dispatchEvent(new CustomEvent('chitplay:pause', { detail: { on: false } }));
}
