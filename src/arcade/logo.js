/**
 * Every game's logo, drawn in code: a glossy tile in the game's own colour, a pattern for its kind
 * (dice dots, card suits, paper lines, arcade stars), the game's emblem, its name on a ribbon, and
 * the little ChitPlay mark in the top right corner. Plain SVG text: no image files to download.
 */
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// the ChitPlay icon (assets/icon.svg), made small
const MARK = '<rect width="512" height="512" rx="104" fill="#b5341f"/><g transform="rotate(-7 256 256)"><path d="M86 118h340v262l-28 14-30-12-32 14-30-14-30 14-32-12-30 12-30-14-30 12-28-10z" fill="#f6ecd2"/><path d="M238 182a68 68 0 1 0 0 124" fill="none" stroke="#24357f" stroke-width="40" stroke-linecap="round"/><path d="M290 332V168h44a50 50 0 0 1 0 100h-44" fill="none" stroke="#c8272d" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></g>';
const PATTERN = {
  Board: (id) => `<pattern id="p${id}" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.6" fill="#fff" opacity=".13"/><circle cx="19" cy="19" r="2.6" fill="#fff" opacity=".13"/></pattern>`,
  Cards: (id) => `<pattern id="p${id}" width="34" height="34" patternUnits="userSpaceOnUse"><text x="4" y="16" font-size="13" fill="#fff" opacity=".14">♠</text><text x="20" y="32" font-size="13" fill="#fff" opacity=".14">♥</text></pattern>`,
  Dice: (id) => `<pattern id="p${id}" width="30" height="30" patternUnits="userSpaceOnUse"><rect x="4" y="4" width="14" height="14" rx="3" fill="none" stroke="#fff" stroke-width="1.6" opacity=".15"/><circle cx="11" cy="11" r="1.8" fill="#fff" opacity=".2"/></pattern>`,
  Party: (id) => `<pattern id="p${id}" width="200" height="16" patternUnits="userSpaceOnUse"><path d="M0 15h200" stroke="#fff" stroke-width="1.4" opacity=".14"/></pattern>`,
  Puzzle: (id) => `<pattern id="p${id}" width="28" height="28" patternUnits="userSpaceOnUse"><rect x="3" y="3" width="22" height="22" rx="5" fill="none" stroke="#fff" stroke-width="1.5" opacity=".14"/></pattern>`,
  Arcade: (id) => `<pattern id="p${id}" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M10 6l1.6 3.4 3.6.4-2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.4 3.6-.4z" fill="#fff" opacity=".18"/><path d="M0 30h40" stroke="#fff" stroke-width="1" opacity=".08"/></pattern>`,
};
let n = 0;
/** The logo as an SVG string, size in CSS pixels. */
export function logoSvg(game, size = 96) {
  const id = `${(game.slug || 'g').replace(/[^a-z0-9]/gi, '')}${n++}`;
  const accent = game.accent || '#b5341f';
  const name = String(game.name || '');
  const long = name.length > 13;
  const pattern = (PATTERN[game.kind] || PATTERN.Board)(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${esc(name)}">
<defs>
<radialGradient id="g${id}" cx="35%" cy="28%" r="85%"><stop offset="0" stop-color="${accent}" stop-opacity="1"/><stop offset=".55" stop-color="${accent}"/><stop offset="1" stop-color="#140806"/></radialGradient>
<linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="r${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1509"/><stop offset="1" stop-color="#120804"/></linearGradient>
${pattern}
</defs>
<rect x="4" y="4" width="192" height="192" rx="40" fill="url(#g${id})"/>
<rect x="4" y="4" width="192" height="192" rx="40" fill="url(#p${id})"/>
<path d="M44 4h112a40 40 0 0 1 40 40v14C140 86 70 52 4 70V44A40 40 0 0 1 44 4z" fill="url(#s${id})"/>
<circle cx="100" cy="86" r="50" fill="#000" opacity=".18"/>
<text x="100" y="${long ? 104 : 108}" font-size="${long ? 66 : 72}" text-anchor="middle" font-family="'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif">${esc(game.icon || '🎲')}</text>
<path d="M14 142h172l-8 14 8 14H14l8-14z" fill="url(#r${id})" stroke="${accent}" stroke-width="3"/>
<text x="100" y="${162}" font-size="${long ? 15 : 19}" font-weight="900" text-anchor="middle" fill="#ffe7a8" font-family="system-ui,'Segoe UI',sans-serif" letter-spacing=".5">${esc(name.toUpperCase())}</text>
<g transform="translate(154 12) scale(.066)">${MARK}</g>
<rect x="4" y="4" width="192" height="192" rx="40" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3"/>
</svg>`;
}
