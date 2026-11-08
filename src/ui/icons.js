/**
 * The game's icon set: small inline SVGs instead of emoji, so every control looks the
 * same on every phone. Under 4 KB, no icon font, nothing extra to download.
 */
const SPEAKER = '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/>';
const MIC = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/>';
const BUBBLE = '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9.5L6 20.5V17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>';
const SLASH = '<path d="M3.5 3.5l17 17"/>';

const PATHS = {
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/>',
  mic: MIC,
  micOff: MIC + SLASH,
  chat: BUBBLE,
  chatOff: BUBBLE + SLASH,
  chatDots: `${BUBBLE}<path d="M8 11h.01M12 11h.01M16 11h.01" stroke-width="2.6"/>`,
  sound: `${SPEAKER}<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>`,
  soundOff: `${SPEAKER}<path d="M16 9.5l5 5M21 9.5l-5 5"/>`,
  rotate: '<rect x="8" y="5.5" width="8" height="13" rx="1.6"/><path d="M3 12a9 9 0 0 1 3-6.7M6 2v3.5H2.500M21 12a9 9 0 0 1-3 6.7M18 22v-3.500h3.500"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.500 2.600 3.800 5.600 3.800 9s-1.300 6.400-3.800 9c-2.500-2.600-3.800-5.600-3.800-9S9.500 5.600 12 3z"/>',
  sliders: '<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.600"/><circle cx="8" cy="17" r="2.600"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.500 14.500c.9 1.400 2.100 2 3.500 2s2.600-.6 3.500-2M9 9.500h.01M15 9.500h.01"/>',
  play: '<path d="M7 4.500v15l12.500-7.500z" fill="currentColor"/>',
  eye: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="3"/>',
  wifi: '<path d="M2.500 9a14 14 0 0 1 19 0M6 13a9 9 0 0 1 12 0M9.500 16.500a4 4 0 0 1 5 0M12 20h.01"/>',
  phone: '<rect x="7" y="2.500" width="10" height="19" rx="2.200"/><path d="M11 18.500h2"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.500v2.500H14zM20 14v2.500M14 20h2.500M18.500 18.500H20V20"/>',
  star: '<path d="M12 3.500l2.600 5.400 5.900.8-4.300 4.100 1 5.900-5.200-2.800-5.200 2.800 1-5.900-4.300-4.100 5.900-.8z"/>',
  starOn: '<path d="M12 3.500l2.600 5.400 5.900.8-4.300 4.100 1 5.900-5.200-2.800-5.200 2.800 1-5.900-4.300-4.100 5.900-.8z" fill="currentColor"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 2-2s-.5-1.500-.5-2.500.8-1.500 1.800-1.500H18a3 3 0 0 0 3-3c0-5-4-9-9-9z"/><path d="M7.500 12h.01M9.500 7.500h.01M14.500 7.500h.01" stroke-width="2.600"/>',
  trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4.500c0 3 1.500 5 3.700 5.500M16 6h3.500c0 3-1.500 5-3.700 5.500M12 14v4M8.500 20.500h7"/>',
  share: '<circle cx="18" cy="5" r="2.500"/><circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="19" r="2.500"/><path d="M8.200 10.800l7.600-4.500M8.200 13.200l7.600 4.500"/>',
  exit: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h9"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  restart: '<path d="M4 12a8 8 0 1 0 2.600-5.900L4 8.500M4 4v4.500h4.500"/>',
  trash: '<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l1 13h9l1-13M10 11v5.500M14 11v5.500"/>',
  book: '<path d="M4 5.500c3-1.500 5.500-1.500 8 0 2.500-1.500 5-1.500 8 0v14c-3-1.500-5.500-1.500-8 0-2.500-1.500-5-1.500-8 0zM12 5.500v14"/>',
  home: '<path d="M4 11l8-7 8 7M6 9.500V20h12V9.500"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18M12 9v11M12 9c-1.5-3.5-6-4.5-6-1.5 0 1.500 2.500 1.500 6 1.500zM12 9c1.500-3.500 6-4.500 6-1.500 0 1.500-2.500 1.500-6 1.500z"/>',
  coin: '<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="5.500"/><path d="M12 9.500v5"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13.500" width="4" height="6" rx="1.500"/><rect x="17" y="13.500" width="4" height="6" rx="1.500"/>',
  target: '<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="4.500"/><circle cx="12" cy="12" r="1"/>',
};

/** SVG markup for an icon. Decorative by default: the button around it carries the label. */
export const iconSvg = (name) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;
