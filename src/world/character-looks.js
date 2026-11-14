/**
 * Everything a character can look like, as plain data: no 3D here, so this file
 * is also safe for the profile screen, for checks on what other phones send,
 * and for the unit tests. People of every age sit at this table.
 */
export const AGES = [
  { id: 'child', label: 'Child' }, { id: 'teen', label: 'Teen' }, { id: 'adult', label: 'Adult' }, { id: 'elder', label: 'Elder' },
];
export const HAIR_STYLES = [
  { id: 'short', label: 'Short' }, { id: 'side', label: 'Side part' }, { id: 'spiky', label: 'Spiky' }, { id: 'curly', label: 'Curly' },
  { id: 'afro', label: 'Afro' }, { id: 'buzz', label: 'Buzz cut' }, { id: 'balding', label: 'Balding' }, { id: 'bald', label: 'Bald' },
  { id: 'bob', label: 'Bob' }, { id: 'long', label: 'Long' }, { id: 'wavy', label: 'Wavy' }, { id: 'plaits', label: 'Plaits' },
  { id: 'ponytail', label: 'Ponytail' }, { id: 'bun', label: 'Bun' },
];
export const OUTFITS = [
  { id: 'tshirt', label: 'T-shirt', sleeve: 'short' }, { id: 'stripes', label: 'Striped tee', sleeve: 'short' },
  { id: 'jersey', label: 'Sports jersey', sleeve: 'short' }, { id: 'school', label: 'Shirt & tie', sleeve: 'short' },
  { id: 'check', label: 'Check shirt', sleeve: 'long' }, { id: 'hoodie', label: 'Hoodie', sleeve: 'long' },
  { id: 'sweater', label: 'Sweater vest', sleeve: 'long' }, { id: 'blazer', label: 'Blazer', sleeve: 'long' },
  { id: 'kurta', label: 'Kurta', sleeve: 'long' }, { id: 'frock', label: 'Frock', sleeve: 'short', skirt: true },
  { id: 'dress', label: 'Long dress', sleeve: 'long', skirt: true }, { id: 'saree', label: 'Saree', sleeve: 'short', skirt: true },
  { id: 'salwar', label: 'Salwar suit', sleeve: 'long' },
];
export const HEADWEAR = [
  { id: 'none', label: 'None' }, { id: 'cap', label: 'Cap' }, { id: 'beanie', label: 'Beanie' }, { id: 'pagri', label: 'Turban' },
  { id: 'hijab', label: 'Hijab' }, { id: 'headband', label: 'Headband' },
];
/**
 * Special hats you earn: a new rank unlocks one (rank = index in the rank ladder), the others cost
 * coins. They are the same hats the roles wear in the 3D room, so every phone can draw them.
 */
export const FANCY_HATS = [
  { id: 'beret', label: 'Beret', rank: 1 },
  { id: 'cowboy', label: 'Cowboy hat', rank: 2 },
  { id: 'tophat', label: 'Top hat', rank: 3 },
  { id: 'kepi', label: 'Kepi', rank: 4 },
  { id: 'dhaka', label: 'Dhaka topi', rank: 5 },
  { id: 'helmet', label: 'Bobby helmet', rank: 6 },
  { id: 'tiara', label: 'Tiara', rank: 7 },
  { id: 'ushanka', label: 'Ushanka', rank: 8 },
  { id: 'crown', label: 'Crown', rank: 9 },
  { id: 'visor', label: 'Banker visor', price: 200 },
  { id: 'doctor', label: 'Doctor mirror', price: 250 },
  { id: 'sombrero', label: 'Sombrero', price: 300 },
  { id: 'turban', label: 'Royal turban', price: 400 },
];
/** Special colours for clothes, bought with coins. */
export const PREMIUM_COLORS = [
  { id: 'c-gold', label: 'Gold', hex: '#d4af37', price: 120 },
  { id: 'c-silver', label: 'Silver', hex: '#c0c6cc', price: 120 },
  { id: 'c-neon', label: 'Neon green', hex: '#39e75f', price: 150 },
  { id: 'c-hotpink', label: 'Hot pink', hex: '#ff2d95', price: 150 },
  { id: 'c-sky', label: 'Sky blue', hex: '#4fc3ff', price: 150 },
  { id: 'c-midnight', label: 'Midnight', hex: '#151a2e', price: 100 },
];
export const isFancyHat = (id) => FANCY_HATS.some(h => h.id === id);
export const GLASSES = [{ id: 'none', label: 'None' }, { id: 'round', label: 'Round' }, { id: 'square', label: 'Square' }];
export const FACIAL = [
  { id: 'none', label: 'None' }, { id: 'stubble', label: 'Stubble' }, { id: 'moustache', label: 'Moustache' }, { id: 'beard', label: 'Beard' },
];
export const SKIN_TONES = ['#f6d7bd', '#e8bd96', '#d9a273', '#c58c5c', '#a86f45', '#8d5a35', '#6b4226', '#4a2d1b'];
export const HAIR_COLORS = ['#0f0b08', '#2a1a10', '#4a2c17', '#7a4a22', '#b98a4a', '#d9c07a', '#8a8a8a', '#e6e2da', '#8a2c1a', '#3a4fa0'];
export const EYE_COLORS = ['#2a1608', '#4a2c12', '#6b4420', '#3f6b3a', '#3a6a9a', '#6a7a86'];
export const CLOTH_COLORS = ['#d4a017', '#e91e63', '#2196f3', '#43a047', '#f4efe4', '#1d2a4d', '#c62828', '#6a1b9a', '#00838f', '#ef6c00', '#37474f', '#8d6e63'];
export const PANTS_COLORS = ['#2f3e6b', '#1d2a4d', '#3b3b3b', '#6b4a2f', '#5a3a6b', '#c7b48a', '#f4efe4', '#222222'];

/** The ready-made cast: every age, every kind of person. */
export const PRESETS = [
  { id: 'school-boy', label: 'Little Brother', gender: 'm', age: 'child', skin: '#c58c5c', hair: 'side', hairColor: '#1b1410', eyes: '#2a1608', outfit: 'school', color: '#f4efe4', color2: '#1d2a4d', pants: '#2f3e6b' },
  { id: 'school-girl', label: 'Little Sister', gender: 'f', age: 'child', skin: '#d9a273', hair: 'plaits', hairColor: '#120d0a', eyes: '#2a1608', outfit: 'school', color: '#f4efe4', color2: '#c62828', pants: '#1d2a4d' },
  { id: 'cricket-fan', label: 'Cricket Fan', gender: 'm', age: 'teen', skin: '#a86f45', hair: 'spiky', hairColor: '#0f0b08', eyes: '#2a1608', outfit: 'jersey', color: '#2196f3', color2: '#f4efe4', pants: '#1d2a4d', headwear: 'cap' },
  { id: 'hoodie-teen', label: 'Hoodie Teen', gender: 'm', age: 'teen', skin: '#d9a273', hair: 'curly', hairColor: '#2a1a10', eyes: '#4a2c12', outfit: 'hoodie', color: '#37474f', color2: '#ef6c00', pants: '#222222' },
  { id: 'college-girl', label: 'College Girl', gender: 'f', age: 'teen', skin: '#c58c5c', hair: 'ponytail', hairColor: '#2a1a10', eyes: '#2a1608', outfit: 'stripes', color: '#e91e63', color2: '#f4efe4', pants: '#2f3e6b' },
  { id: 'bookworm', label: 'Bookworm', gender: 'f', age: 'teen', skin: '#f6d7bd', hair: 'bob', hairColor: '#4a2c17', eyes: '#3a6a9a', outfit: 'sweater', color: '#6a1b9a', color2: '#f4efe4', pants: '#3b3b3b', glasses: 'round' },
  { id: 'gamer', label: 'Gamer', gender: 'm', age: 'teen', skin: '#e8bd96', hair: 'short', hairColor: '#7a4a22', eyes: '#3f6b3a', outfit: 'tshirt', color: '#00838f', color2: '#f4efe4', pants: '#222222', glasses: 'square' },
  { id: 'free-spirit', label: 'Free Spirit', gender: 'f', age: 'teen', skin: '#6b4226', hair: 'afro', hairColor: '#0f0b08', eyes: '#2a1608', outfit: 'tshirt', color: '#ef6c00', color2: '#f4efe4', pants: '#c7b48a', headwear: 'headband' },
  { id: 'office-man', label: 'Office Guy', gender: 'm', age: 'adult', skin: '#c58c5c', hair: 'side', hairColor: '#0f0b08', eyes: '#2a1608', outfit: 'blazer', color: '#1d2a4d', color2: '#c62828', pants: '#1d2a4d', facial: 'stubble' },
  { id: 'office-woman', label: 'Office Woman', gender: 'f', age: 'adult', skin: '#d9a273', hair: 'long', hairColor: '#2a1a10', eyes: '#4a2c12', outfit: 'blazer', color: '#37474f', color2: '#f4efe4', pants: '#222222' },
  { id: 'kurta-man', label: 'Kurta Man', gender: 'm', age: 'adult', skin: '#a86f45', hair: 'short', hairColor: '#1b1410', eyes: '#2a1608', outfit: 'kurta', color: '#f4efe4', color2: '#d4a017', pants: '#f4efe4', facial: 'moustache' },
  { id: 'saree-lady', label: 'Saree Lady', gender: 'f', age: 'adult', skin: '#a86f45', hair: 'bun', hairColor: '#120d0a', eyes: '#2a1608', outfit: 'saree', color: '#c62828', color2: '#d4a017', pants: '#c62828', bindi: true },
  { id: 'salwar-woman', label: 'Salwar Suit', gender: 'f', age: 'adult', skin: '#c58c5c', hair: 'long', hairColor: '#0f0b08', eyes: '#2a1608', outfit: 'salwar', color: '#00838f', color2: '#f4efe4', pants: '#00838f' },
  { id: 'sardar', label: 'Turban Man', gender: 'm', age: 'adult', skin: '#c58c5c', hair: 'short', hairColor: '#0f0b08', eyes: '#2a1608', outfit: 'check', color: '#1d2a4d', color2: '#f4efe4', pants: '#3b3b3b', headwear: 'pagri', facial: 'beard', headColor: '#ef6c00' },
  { id: 'hijab-woman', label: 'Hijab Woman', gender: 'f', age: 'adult', skin: '#d9a273', hair: 'bun', hairColor: '#120d0a', eyes: '#4a2c12', outfit: 'dress', color: '#37474f', color2: '#8d6e63', pants: '#37474f', headwear: 'hijab', headColor: '#8d6e63' },
  { id: 'teacher', label: 'Uncle', gender: 'm', age: 'adult', skin: '#e8bd96', hair: 'balding', hairColor: '#2a1a10', eyes: '#3a6a9a', outfit: 'sweater', color: '#8d6e63', color2: '#f4efe4', pants: '#6b4a2f', glasses: 'square', facial: 'moustache' },
  { id: 'strong-man', label: 'Big Brother', gender: 'm', age: 'adult', skin: '#4a2d1b', hair: 'buzz', hairColor: '#0f0b08', eyes: '#2a1608', outfit: 'jersey', color: '#c62828', color2: '#f4efe4', pants: '#222222', facial: 'beard' },
  { id: 'big-sister', label: 'Big Sister', gender: 'f', age: 'adult', skin: '#f6d7bd', hair: 'wavy', hairColor: '#8a2c1a', eyes: '#3f6b3a', outfit: 'check', color: '#43a047', color2: '#f4efe4', pants: '#2f3e6b' },
  { id: 'grandpa', label: 'Grandpa', gender: 'm', age: 'elder', skin: '#c58c5c', hair: 'balding', hairColor: '#e6e2da', eyes: '#2a1608', outfit: 'kurta', color: '#f4efe4', color2: '#8d6e63', pants: '#f4efe4', glasses: 'round', facial: 'moustache' },
  { id: 'grandma', label: 'Grandma', gender: 'f', age: 'elder', skin: '#d9a273', hair: 'bun', hairColor: '#e6e2da', eyes: '#2a1608', outfit: 'saree', color: '#f4efe4', color2: '#6a1b9a', pants: '#f4efe4', glasses: 'round', bindi: true },
  { id: 'old-professor', label: 'Old Professor', gender: 'm', age: 'elder', skin: '#f6d7bd', hair: 'short', hairColor: '#8a8a8a', eyes: '#6a7a86', outfit: 'blazer', color: '#6b4a2f', color2: '#37474f', pants: '#3b3b3b', glasses: 'square', facial: 'beard' },
  { id: 'old-aunty', label: 'Wise Aunty', gender: 'f', age: 'elder', skin: '#8d5a35', hair: 'bob', hairColor: '#8a8a8a', eyes: '#2a1608', outfit: 'dress', color: '#00838f', color2: '#d4a017', pants: '#00838f' },
  { id: 'frock-girl', label: 'Frock Girl', gender: 'f', age: 'child', skin: '#8d5a35', hair: 'bob', hairColor: '#0f0b08', eyes: '#2a1608', outfit: 'frock', color: '#e91e63', color2: '#f4efe4', pants: '#e91e63' },
  { id: 'naughty-boy', label: 'Naughty Boy', gender: 'm', age: 'child', skin: '#e8bd96', hair: 'spiky', hairColor: '#4a2c17', eyes: '#4a2c12', outfit: 'stripes', color: '#43a047', color2: '#d4a017', pants: '#6b4a2f' },
];

const DEFAULTS = { glasses: 'none', facial: 'none', headwear: 'none', headColor: '#c62828', bindi: false };
const HEX = /^#[0-9a-f]{6}$/i;
const ids = (arr) => new Set(arr.map(x => x.id));
const VALID = {
  age: ids(AGES), hair: ids(HAIR_STYLES), outfit: ids(OUTFITS), headwear: ids([...HEADWEAR, ...FANCY_HATS]), glasses: ids(GLASSES), facial: ids(FACIAL),
};

export const lookOf = (id) => {
  const p = PRESETS.find(x => x.id === id);
  return p ? { ...DEFAULTS, ...p } : null;
};

/**
 * Turns anything (saved data, or what another phone sent) into a safe, complete look.
 * Unknown values fall back to the given preset's, so a bad message can't break the room.
 */
export function cleanLook(raw, fallbackId = 'school-boy') {
  const base = lookOf(fallbackId) || { ...DEFAULTS, ...PRESETS[0] };
  const r = raw && typeof raw === 'object' ? raw : {};
  const out = { ...base };
  for (const [k, set] of Object.entries(VALID)) if (set.has(r[k])) out[k] = r[k];
  for (const k of ['skin', 'hairColor', 'eyes', 'color', 'color2', 'pants', 'headColor']) if (HEX.test(r[k] || '')) out[k] = r[k];
  if (r.gender === 'm' || r.gender === 'f') out.gender = r.gender;
  out.bindi = !!r.bindi;
  out.id = PRESETS.some(p => p.id === r.id) ? r.id : 'custom';
  out.label = out.id === 'custom' ? 'Custom' : (lookOf(out.id).label);
  return out;
}

/** A stranger at the table: any age, the right gender, a skin tone that fits the room. */
export function randomLook(gender, skin) {
  const pool = PRESETS.filter(p => p.gender === gender);
  const p = pool[Math.floor(Math.random() * pool.length)];
  return { ...DEFAULTS, ...p, ...(skin ? { skin } : {}) };
}

export const lookKey = (l) => JSON.stringify([l.gender, l.age, l.skin, l.hair, l.hairColor, l.eyes, l.outfit, l.color, l.color2, l.pants, l.glasses, l.facial, l.headwear, l.headColor, l.bindi]);

// the special hats in the flat portraits (fixed colours: nothing from outside goes in here)
const FANCY_SVG = {
  beret: '<ellipse cx="34" cy="13" rx="17" ry="6.5" fill="#1a1a1a"/><rect x="34" y="4" width="2" height="4" fill="#1a1a1a"/>',
  cowboy: '<path d="M6 18q26 7 52 0-6 6-26 6T6 18z" fill="#8a5a2b"/><path d="M19 18q1-13 13-13t13 13q-13 4-26 0z" fill="#9d6a37"/><circle cx="32" cy="14" r="2" fill="#f0c040"/>',
  tophat: '<rect x="11" y="15" width="42" height="4" rx="2" fill="#111"/><rect x="20" y="-4" width="24" height="20" rx="2" fill="#151515"/><rect x="20" y="10" width="24" height="3" fill="#c62828"/>',
  kepi: '<path d="M19 18l2-13h22l2 13z" fill="#1a2250"/><rect x="18" y="14" width="28" height="4" fill="#c8272d"/><path d="M18 18h28q-2 4-14 4t-14-4z" fill="#111"/>',
  dhaka: '<path d="M17 19q1-12 15-12t15 12z" fill="#b71c1c"/><path d="M19 13h26M18 16h28" stroke="#ffd166" stroke-width="1.4"/>',
  helmet: '<path d="M17 21q0-21 15-21t15 21z" fill="#14204a"/><circle cx="32" cy="12" r="3" fill="#d4af37"/><rect x="16" y="19" width="32" height="3" rx="1.5" fill="#0d1530"/>',
  tiara: '<path d="M19 17l4-8 4 6 5-10 5 10 4-6 4 8z" fill="#e8c46a"/><circle cx="32" cy="9" r="2" fill="#e91e63"/>',
  ushanka: '<path d="M14 22q0-17 18-17t18 17z" fill="#5b4636"/><rect x="11" y="18" width="10" height="16" rx="5" fill="#6d5644"/><rect x="43" y="18" width="10" height="16" rx="5" fill="#6d5644"/>',
  crown: '<path d="M18 19l1-13 6 6 7-9 7 9 6-6 1 13z" fill="#f2c12e"/><rect x="18" y="16" width="28" height="4" fill="#d9a400"/><circle cx="32" cy="11" r="2" fill="#c62828"/>',
  visor: '<path d="M16 21q16-8 32 0" fill="none" stroke="#1f7a3a" stroke-width="3"/><path d="M34 19q12 0 18 5-10 1-18-1z" fill="#2e9e4f"/>',
  doctor: '<path d="M16 22q16-8 32 0" fill="none" stroke="#333" stroke-width="2"/><circle cx="32" cy="15" r="5" fill="#cfd8dc" stroke="#607d8b"/>',
  sombrero: '<ellipse cx="32" cy="18" rx="30" ry="6" fill="#d9b86a"/><path d="M22 18q2-15 10-15t10 15z" fill="#e2c47c"/><path d="M4 18q28 9 56 0" fill="none" stroke="#c8272d" stroke-width="2"/>',
  turban: '<path d="M13 25q0-21 19-21t19 21q-19-12-38 0z" fill="#ffd166"/><circle cx="32" cy="12" r="3" fill="#c62828"/><path d="M32 9v-6" stroke="#fff" stroke-width="2"/>',
};

/** A small flat face for the character picker (SVG markup built only from checked values). */
export function portraitSvg(rawLook) {
  const l = cleanLook(rawLook, rawLook?.id);
  const longHair = ['long', 'wavy', 'bob', 'plaits', 'ponytail'].includes(l.hair);
  const covered = l.headwear === 'hijab' || l.headwear === 'pagri';
  const back = !covered && longHair ? `<ellipse cx="32" cy="${l.hair === 'bob' ? 30 : 34}" rx="20" ry="${l.hair === 'bob' ? 18 : 24}" fill="${l.hairColor}"/>` : '';
  const afro = l.hair === 'afro' ? `<circle cx="32" cy="20" r="22" fill="${l.hairColor}"/>` : '';
  const bun = l.hair === 'bun' && !covered ? `<circle cx="32" cy="6" r="6.5" fill="${l.hairColor}"/>` : '';
  const top = covered ? '' : ({
    bald: '', buzz: `<path d="M17 24a15 15 0 0 1 30 0q-15-9-30 0z" fill="${l.hairColor}" opacity=".6"/>`,
    balding: `<path d="M17 28q-1-7 3-10 3 4 0 12zM47 28q1-7-3-10-3 4 0 12z" fill="${l.hairColor}"/>`,
    spiky: `<path d="M16 26l1-11 5 4 3-9 5 6 4-7 3 7 6-5 1 8 4-1-1 9q-15-9-31-1z" fill="${l.hairColor}"/>`,
    side: `<path d="M16 28a16 16 0 0 1 32-3q-12 0-20-7-3 7-12 10z" fill="${l.hairColor}"/>`,
  }[l.hair] ?? `<path d="M16 28a16 16 0 0 1 32 0q-16-11-32 0z" fill="${l.hairColor}"/>`);
  const eye = (x) => `<circle cx="${x}" cy="30" r="2.6" fill="#fff"/><circle cx="${x}" cy="30.3" r="1.6" fill="${l.eyes}"/>`;
  const glasses = l.glasses === 'none' ? '' : l.glasses === 'round'
    ? '<g fill="none" stroke="#222" stroke-width="1.2"><circle cx="26" cy="30" r="4.4"/><circle cx="38" cy="30" r="4.4"/><path d="M30.4 30h3.2"/></g>'
    : '<g fill="none" stroke="#222" stroke-width="1.2"><rect x="21.5" y="26.5" width="9" height="7" rx="1"/><rect x="33.5" y="26.5" width="9" height="7" rx="1"/><path d="M30.5 30h3"/></g>';
  const facial = l.facial === 'beard' ? `<path d="M19 33q1 14 13 15 12-1 13-15-2 6-6 5-7-2-14 0-4 1-6-5z" fill="${l.hairColor}"/>`
    : l.facial === 'moustache' ? `<path d="M26 39q6-3 12 0-6 1.5-12 0z" fill="${l.hairColor}"/>` : '';
  const hat = l.headwear === 'cap' ? `<path d="M15 23a17 15 0 0 1 34 0zM44 22h13q-2 4-13 3z" fill="${l.color2}"/>`
    : l.headwear === 'beanie' ? `<path d="M15 24a17 18 0 0 1 34 0z" fill="${l.color2}"/>`
      : l.headwear === 'pagri' ? `<path d="M13 25q0-20 19-20t19 20q-19-12-38 0z" fill="${l.headColor}"/>`
        : l.headwear === 'headband' ? `<path d="M16 23q16-7 32 0v3q-16-7-32 0z" fill="${l.headColor}"/>`
          : (FANCY_SVG[l.headwear] || '');
  const hijab = l.headwear === 'hijab' ? `<path d="M32 5C16 5 11 20 12 34c0 12 8 18 20 18s20-6 20-18c1-14-4-29-20-29zm0 10c9 0 13 8 13 18s-5 14-13 14-13-4-13-14 4-18 13-18z" fill="${l.headColor}"/>` : '';
  return `<svg viewBox="0 0 64 64" aria-hidden="true" width="56" height="56">${afro}${back}${bun}<path d="M10 64q1-15 22-15t22 15z" fill="${l.color}"/><rect x="27" y="42" width="10" height="10" rx="4" fill="${l.skin}"/><ellipse cx="32" cy="31" rx="15" ry="${l.age === 'child' ? 15 : 17}" fill="${l.skin}"/>${top}${eye(26)}${eye(38)}<path d="M26 40q6 4 12 0" fill="none" stroke="#7a2424" stroke-width="1.4" stroke-linecap="round"/>${facial}${glasses}${l.bindi ? '<circle cx="32" cy="24.5" r="1.1" fill="#c62828"/>' : ''}${hat}${hijab}</svg>`;
}
