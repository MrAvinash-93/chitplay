/**
 * Ads in the Android app (chitplay-android, built with Capacitor): Google AdMob, never the website's
 * AdSense or Adsterra. On the website this file does nothing at all.
 *
 *  - a banner at the bottom of the games list (the home page) only: never while a game is played;
 *  - an interstitial between games (Play again, or the next game), at most one every three minutes and
 *    never in the first two minutes, the same rule as the website's ad breaks;
 *  - Google's consent form (UMP) first, where the law asks for one (EEA, UK, Switzerland).
 *
 * The ad unit IDs come from window.CHITPLAY_ADMOB, written into the app's pages by
 * chitplay-android/tools/copy-web.mjs (Google's test IDs until the real ones are filled in there).
 */
export const isApp = () => !!window.Capacitor?.isNativePlatform?.();
const plugin = () => window.Capacitor?.Plugins?.AdMob || null;
const cfg = () => window.CHITPLAY_ADMOB || {};

const MIN_GAP_MS = 3 * 60 * 1000;
const FIRST_AFTER_MS = 2 * 60 * 1000;
const startedAt = Date.now();
let ready = null;
let lastBreak = 0;

/** Starts AdMob once, after asking for consent where it is needed. Resolves false when ads can't run. */
export function initAds() {
  if (ready) return ready;
  ready = (async () => {
    const ad = plugin();
    if (!isApp() || !ad) return false;
    try {
      await ad.initialize({ initializeForTesting: !!cfg().testing });
      try {
        const info = await ad.requestConsentInfo();
        if (info?.isConsentFormAvailable && info?.status === 'REQUIRED') await ad.showConsentForm();
      } catch { /* no consent form here: ads stay non-personalised by Google's own rules */ }
      return true;
    } catch (e) { console.warn('[ads] AdMob', e); return false; }
  })();
  return ready;
}

/** The banner under the games list. on=false takes it away (a game is opening). */
export async function listBanner(on) {
  const ad = plugin();
  if (!isApp() || !ad || !cfg().banner) return;
  try {
    if (!on) { await ad.hideBanner(); document.documentElement.style.removeProperty('--app-banner'); return; }
    if (!(await initAds())) return;
    await ad.showBanner({ adId: cfg().banner, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, isTesting: !!cfg().testing });
    // the list keeps its last row clear of the banner
    document.documentElement.style.setProperty('--app-banner', '64px');
  } catch (e) { console.warn('[ads] banner', e); }
}

/** Can this phone offer "watch an ad for a reward"? (the Android app, with a rewarded unit) */
export const rewardOn = () => isApp() && !!plugin() && !!cfg().rewarded;

/**
 * A rewarded ad the player chose to watch. Resolves true only when AdMob says the reward was earned
 * (watched to the end), false when it was closed early or no ad came.
 */
export async function appReward({ pause, resume } = {}) {
  const ad = plugin();
  if (!rewardOn() || !(await initAds())) return false;
  let earned = false;
  const handles = [];
  try {
    await ad.prepareRewardVideoAd({ adId: cfg().rewarded, isTesting: !!cfg().testing });
    pause?.();
    const closed = new Promise((done) => {
      const on = (name, fn) => Promise.resolve(ad.addListener(name, fn)).then(h => handles.push(h)).catch(() => {});
      on('onRewardedVideoAdReward', () => { earned = true; });
      on('onRewardedVideoAdDismissed', () => done());
      on('onRewardedVideoAdFailedToShow', () => done());
      setTimeout(done, 90000);
    });
    await ad.showRewardVideoAd();
    await closed;
  } catch { /* no ad came */ } finally {
    handles.forEach(h => { try { h.remove(); } catch {} });
    resume?.();
  }
  return earned;
}

/** An ad between games. Resolves when it has closed (or at once when it isn't time for one). */
export async function appBreak({ pause, resume } = {}) {
  const ad = plugin();
  if (!isApp() || !ad || !cfg().interstitial) return;
  const now = Date.now();
  if (now - startedAt < FIRST_AFTER_MS || now - lastBreak < MIN_GAP_MS) return;
  if (!(await initAds())) return;
  try {
    await ad.prepareInterstitial({ adId: cfg().interstitial, isTesting: !!cfg().testing });
    lastBreak = Date.now();
    pause?.();
    // the game waits until the ad is closed (or failed to show), a minute at most
    let handles = [];
    const closed = new Promise((done) => {
      for (const name of ['interstitialAdDismissed', 'interstitialAdFailedToShow']) {
        Promise.resolve(ad.addListener(name, () => done())).then(h => handles.push(h)).catch(() => {});
      }
      setTimeout(done, 60000);
    });
    await ad.showInterstitial();
    await closed;
    handles.forEach(h => { try { h.remove(); } catch {} });
  } catch { /* no ad came: carry on */ } finally { resume?.(); }
}
