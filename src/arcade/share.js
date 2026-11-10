/**
 * After a game: a picture of the moment with the score and the chitplay.com link, ready to send to
 * friends; and a few other games to try next.
 */
import { ALL_GAMES, HOT_DEFAULT, gameBySlug } from './catalog.js?v=20261110-1222';
import { logoSvg } from './logo.js?v=20261110-1222';

const SITE = 'https://www.chitplay.com';
/** A shareable card: the game picture, a banner with the result, and the link. */
export function resultImage({ picture, game, headline, sub }) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1080;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 1080);
  bg.addColorStop(0, '#2a120a'); bg.addColorStop(1, '#0b0503');
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1080);
  if (picture) {
    const w = 1000, h = Math.min(640, w * (picture.height / picture.width));
    g.save();
    g.beginPath(); g.roundRect?.(40, 150, w, h, 28); g.clip();
    g.drawImage(picture, 40, 150, w, h);
    g.restore();
  }
  g.fillStyle = game?.accent || '#e8a317';
  g.fillRect(0, 0, 1080, 120);
  g.fillStyle = '#fff'; g.font = '900 64px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText(`${game?.icon || '🎲'} ${game?.name || 'ChitPlay'}`, 44, 62);
  g.textAlign = 'center';
  g.fillStyle = '#ffd27a'; g.font = '900 78px system-ui, sans-serif';
  g.fillText(headline, 540, 870);
  g.fillStyle = '#fff3d6'; g.font = '600 40px system-ui, sans-serif';
  g.fillText(sub, 540, 950);
  g.fillStyle = '#ffd27a'; g.font = '800 38px system-ui, sans-serif';
  g.fillText('Play free at chitplay.com', 540, 1030);
  return c;
}
/** Share the card, or save it and copy the link where sharing files isn't possible. */
export async function shareResult({ canvas, text, slug }) {
  const url = slug ? `${SITE}/games/${slug}/` : SITE;
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
  try {
    const file = new File([blob], 'chitplay-result.jpg', { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: `${text} ${url}`, title: 'ChitPlay' }); return 'shared'; }
    if (navigator.share) { await navigator.share({ text, url, title: 'ChitPlay' }); return 'shared'; }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'chitplay-result.jpg';
  document.body.append(a); a.click(); a.remove();
  try { await navigator.clipboard.writeText(`${text} ${url}`); } catch {}
  return 'saved';
}
/** Three other games to try: your hot list first, then what's popular, never the one you just played. */
export function suggestions(currentSlug) {
  let hot = [];
  try { hot = JSON.parse(localStorage.getItem('chitplay.hot')) || []; } catch {}
  const pool = [...hot.map(gameBySlug).filter(Boolean), ...HOT_DEFAULT.map(gameBySlug).filter(Boolean), ...ALL_GAMES];
  const seen = new Set([currentSlug]);
  const out = [];
  for (const g of pool) { if (!seen.has(g.slug)) { seen.add(g.slug); out.push(g); } if (out.length === 3) break; }
  return out;
}
/** The "try these next" row, as plain DOM. up: the path back to the site's root. */
export function suggestionRow(currentSlug, up = '../', title = 'Try these next') {
  const box = document.createElement('div');
  box.className = 'next';
  const h = document.createElement('strong');
  h.textContent = title;
  const list = document.createElement('div');
  list.className = 'next__list';
  suggestions(currentSlug).forEach((g) => {
    const a = document.createElement('a');
    a.className = 'next__game';
    a.href = `${up}play/?game=${g.slug}&mode=play`;
    a.innerHTML = logoSvg(g, 64);
    const n = document.createElement('span');
    n.textContent = g.name;
    a.append(n);
    list.append(a);
  });
  box.append(h, list);
  return box;
}
