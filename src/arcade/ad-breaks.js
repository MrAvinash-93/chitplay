/**
 * Ads between games, never during one: the way the big game sites do it. A short break can show
 * when a player starts the next match (Play again, or another game), with the game silent and
 * paused; nothing ever covers a board, a TV game or its buttons while someone is playing.
 *
 * It uses Google's Ad Placement API for web games (AdSense "H5 games ads"). It stays OFF until that
 * is approved for the site: switch ENABLED to true and the breaks start; until then every call just
 * carries on at once, so the game never waits for an ad that cannot come.
 *
 *   await adBreak('ludo-rematch');   // resolves when the break is over (or straight away)
 */
const ENABLED = false;                         // turn on once AdSense H5 games ads are approved
const CLIENT = 'ca-pub-7139397930159559';
const MIN_GAP_MS = 3 * 60 * 1000;              // at most one break every three minutes
const FIRST_AFTER_MS = 2 * 60 * 1000;          // and never in the first two minutes of a visit

const startedAt = Date.now();
let lastBreak = 0;
let ready = null;

function load() {
  if (ready) return ready;
  ready = new Promise((resolve) => {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = (o) => window.adsbygoogle.push(o);
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
      s.crossOrigin = 'anonymous';
      s.dataset.adFrequencyHint = '180s';
      s.onerror = () => resolve(false);
      s.onload = () => resolve(true);
      document.head.append(s);
    } else resolve(true);
    // the game's own sound is handled by the caller; ads may play sound only when the game allows it
    window.adConfig({ preloadAdBreaks: 'on', sound: 'on' });
  });
  return ready;
}

/**
 * A break before the next match. `pause`/`resume` let the caller silence and hold the game while
 * an ad shows. Always resolves; never rejects, never waits more than a few seconds for nothing.
 */
export async function adBreak(name, { pause = () => {}, resume = () => {} } = {}) {
  if (!ENABLED) return false;
  const now = Date.now();
  if (now - startedAt < FIRST_AFTER_MS || now - lastBreak < MIN_GAP_MS) return false;
  if (!(await load())) return false;
  return new Promise((resolve) => {
    let done = false;
    const finish = (shown) => { if (done) return; done = true; resume(); resolve(shown); };
    setTimeout(() => finish(false), 8000);   // no answer from the ad server: play on
    window.adBreak({
      type: 'next', name,
      beforeAd: () => { lastBreak = Date.now(); pause(); },
      afterAd: () => resume(),
      adBreakDone: (info) => finish(info?.breakStatus === 'viewed'),
    });
  });
}
export const adBreaksOn = () => ENABLED;
