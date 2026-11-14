/**
 * Ads inside the games: only on the result screen after a match, below every button, never while
 * anyone is playing and never over a board, the TV or a control. One Adsterra native banner (4:1);
 * its container may exist once on a page, so the same box is reused from one result to the next.
 * Set ID to '' to switch it off.
 */
const ID = 'd5795ad3a6b91ea89d9d71ba6f70c273';
const SRC = 'https://bauval.org/21/d5795ad3a6b91ea89d9d71ba6f70c273';

let box = null;
let loaded = false;

/** The ad box for a result panel (or null when ads are off). Put it after the panel's buttons. */
export function resultAd() {
  if (!ID) return null;
  if (!box) {
    box = document.createElement('aside');
    box.className = 'adbox adbox--result';
    box.setAttribute('aria-label', 'Advertisement');
    const label = document.createElement('small');
    label.textContent = 'Advertisement';
    const container = document.createElement('div');
    container.id = `container-${ID}`;
    container.style.minHeight = '90px';
    box.append(label, container);
  }
  // the network's script looks for the container, so it loads once the box is on the page
  if (!loaded) {
    requestAnimationFrame(() => {
      if (loaded || !box.isConnected) return;
      loaded = true;
      const s = document.createElement('script');
      s.async = true;
      s.dataset.cfasync = 'false';
      s.src = SRC;
      document.body.append(s);
    });
  }
  return box;
}
