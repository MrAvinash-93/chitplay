/**
 * The TV games. Each is plain logic plus a picture: step() moves the game on by a sixtieth of a second,
 * draw() paints a 640×400 screen. The state is plain data with its own random numbers, so the host's
 * phone can send it to a friend's phone, and a test can run it without a browser.
 *
 *   init({ n, seed })      the start, for n players
 *   step(s, inputs)        one tick; inputs[seat] = { l, r, u, d, a } (what's held down)
 *   over(s)                null, or { scores, winners } when it's finished
 *   bot(s, seat)           what a computer player holds down this tick
 *   draw(g, s, names)      paint the screen
 *   pad                    the touch buttons: [[key, label], …]
 */
export const W = 640, H = 400, TICK = 1 / 60;
export const SEAT_COLORS = ['#ff5a4f', '#39b6ff', '#ffd23f', '#5be37d'];

/** Random numbers that live in the state: every phone can carry on from the same place. */
export function rnd(s) {
  s.seed = (s.seed + 0x6D2B79F5) | 0;
  let t = Math.imul(s.seed ^ (s.seed >>> 15), 1 | s.seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const seats = (n) => Array.from({ length: n }, (_, i) => i);
export const leaders = (scores) => { const top = Math.max(...scores); return scores.map((v, i) => (v === top ? i : -1)).filter(i => i >= 0); };
/** Rounded numbers keep the state small on its way to other phones. */
export const r1 = (v) => Math.round(v * 10) / 10;

/** The score line along the top of the TV. */
export function scoreBar(g, items) {
  g.font = '700 18px system-ui, sans-serif';
  g.textBaseline = 'middle';
  const w = W / items.length;
  items.forEach(([label, value, color], i) => {
    g.fillStyle = 'rgba(10, 6, 3, .72)';
    g.fillRect(i * w + 6, 6, w - 12, 28);
    g.fillStyle = color;
    g.fillRect(i * w + 6, 6, 6, 28);
    g.fillStyle = '#fff';
    g.textAlign = 'left';
    g.fillText(String(label).slice(0, 10), i * w + 18, 21);
    g.textAlign = 'right';
    g.fillText(String(value), i * w + w - 12, 21);
  });
}

/**
 * The level the game is on: a small tag (at height y), and for two seconds after a new level a big
 * banner across the middle with its name.
 */
export function levelTag(g, level, name, since, y = 52, title = name) {
  const text = `Level ${level}${name ? ` · ${name}` : ''}`;
  g.font = '800 15px system-ui, sans-serif';
  g.textBaseline = 'middle'; g.textAlign = 'center';
  const w = g.measureText(text).width + 24;
  g.fillStyle = 'rgba(10, 6, 3, .62)';
  g.fillRect(W / 2 - w / 2, y - 11, w, 22);
  g.fillStyle = '#ffd23f';
  g.fillText(text, W / 2, y + 1);
  if (since >= 0 && since < 120) {
    const a = since < 15 ? since / 15 : since > 95 ? (120 - since) / 25 : 1;
    g.save();
    g.globalAlpha = a;
    g.fillStyle = 'rgba(10, 6, 3, .55)';
    g.fillRect(0, H / 2 - 54, W, 92);
    g.fillStyle = '#ffd23f';
    g.font = '900 46px system-ui, sans-serif';
    g.fillText(`LEVEL ${level}`, W / 2, H / 2 - 22);
    if (title) { g.fillStyle = '#fff'; g.font = '700 22px system-ui, sans-serif'; g.fillText(title, W / 2, H / 2 + 18); }
    g.restore();
  }
}
