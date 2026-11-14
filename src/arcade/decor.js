/**
 * Your gaming room: things to put in it, whole-room themes, its size, and how grand it has become.
 * You start as a new gamer in a small, ordinary room. Everything is bought with coins earned by
 * playing (they have no value outside the game), and the best things also need wins, achievements
 * or a rank: a room shows how far you have come as a gamer.
 */
import { RANKS } from '../persistence/profile-store.js?v=20261114-1459';

export const RARITY = {
  common: { name: 'Common', color: '#b9c3cf', points: 1 },
  rare: { name: 'Rare', color: '#4fc3ff', points: 3 },
  epic: { name: 'Epic', color: '#c77dff', points: 6 },
  legendary: { name: 'Legendary', color: '#ffc93c', points: 12 },
};
/** place: where it goes in the room (floor, wall or ceiling). */
export const DECOR = [
  // common
  { id: 'cactus', icon: '🌵', name: 'Cactus pot', price: 80, rarity: 'common' },
  { id: 'cushions', icon: '🟣', name: 'Floor cushions', price: 90, rarity: 'common' },
  { id: 'frames', icon: '🖼️', name: 'Photo frames', price: 100, rarity: 'common', place: 'wall' },
  { id: 'plant', icon: '🌿', name: 'Money plant', price: 120, rarity: 'common' },
  { id: 'poster', icon: '🎮', name: 'Game poster', price: 150, rarity: 'common', place: 'wall' },
  { id: 'wallshelf', icon: '🪴', name: 'Wall shelf', price: 160, rarity: 'common', place: 'wall' },
  { id: 'books', icon: '📚', name: 'Bookshelf', price: 180, rarity: 'common' },
  { id: 'lamp', icon: '💡', name: 'Floor lamp', price: 200, rarity: 'common' },
  { id: 'fishbowl', icon: '🐠', name: 'Fish bowl', price: 220, rarity: 'common' },
  { id: 'beanbag', icon: '🛋️', name: 'Bean bag', price: 250, rarity: 'common' },
  // rare
  { id: 'dartboard', icon: '🎯', name: 'Dartboard', price: 260, rarity: 'rare', place: 'wall', need: { wins: 2 } },
  { id: 'lanterns', icon: '🏮', name: 'Paper lanterns', price: 300, rarity: 'rare', place: 'ceiling', need: { wins: 3 } },
  { id: 'speaker', icon: '🔊', name: 'Big speaker', price: 300, rarity: 'rare', need: { wins: 5 } },
  { id: 'fridge', icon: '🧊', name: 'Mini fridge', price: 380, rarity: 'rare', need: { wins: 4 } },
  { id: 'trophies', icon: '🏆', name: 'Trophy shelf', price: 400, rarity: 'rare', need: { achievements: 3 } },
  { id: 'guitar', icon: '🎸', name: 'Guitar', price: 420, rarity: 'rare', need: { wins: 6 } },
  { id: 'chair', icon: '💺', name: 'Gaming chair', price: 450, rarity: 'rare', need: { rank: 1 } },
  { id: 'jukebox', icon: '📻', name: 'Jukebox', price: 600, rarity: 'rare', need: { wins: 8 } },
  { id: 'aquarium', icon: '🐟', name: 'Aquarium', price: 700, rarity: 'rare', need: { achievements: 4 } },
  // epic
  { id: 'clock', icon: '🌀', name: 'Neon rings', price: 350, rarity: 'epic', place: 'wall', need: { achievements: 6 } },
  { id: 'ledwall', icon: '🌈', name: 'LED wall', price: 800, rarity: 'epic', place: 'wall', need: { wins: 10 } },
  { id: 'arcade', icon: '🕹️', name: 'Arcade cabinet', price: 900, rarity: 'epic', need: { wins: 25 } },
  { id: 'discoball', icon: '🪩', name: 'Disco ball', price: 900, rarity: 'epic', place: 'ceiling', need: { achievements: 5 } },
  { id: 'telescope', icon: '🔭', name: 'Telescope', price: 950, rarity: 'epic', need: { rank: 2 } },
  { id: 'vending', icon: '🥤', name: 'Vending machine', price: 1100, rarity: 'epic', need: { wins: 12 } },
  { id: 'pinball', icon: '🎰', name: 'Pinball table', price: 1200, rarity: 'epic', need: { wins: 15 } },
  { id: 'robot', icon: '🤖', name: 'Robot buddy', price: 1500, rarity: 'epic', need: { wins: 20 } },
  // legendary
  { id: 'neonlogo', icon: '🔠', name: 'ChitPlay neon sign', price: 2000, rarity: 'legendary', place: 'wall', need: { wins: 30 } },
  { id: 'goldtrophy', icon: '🥇', name: 'Giant gold trophy', price: 2500, rarity: 'legendary', need: { achievements: 12 } },
  { id: 'chandelier', icon: '💎', name: 'Crystal chandelier', price: 2800, rarity: 'legendary', place: 'ceiling', need: { rank: 4 } },
  { id: 'throne', icon: '👑', name: 'Gaming throne', price: 3000, rarity: 'legendary', need: { wins: 50 } },
  { id: 'dragon', icon: '🐉', name: 'Jade dragon', price: 4000, rarity: 'legendary', need: { achievements: 15, rank: 5 } },
];
export const placeOf = (x) => x?.place || (x?.wall ? 'wall' : 'floor');

/** Where things can go. Floor spots stay clear of the mat, the TV and the shelf. */
export const SPOTS = [
  { id: 'fl', name: 'Back left corner', x: -2.2, z: -1.95, place: 'floor' },
  { id: 'bm', name: 'Back wall, left', x: -1.05, z: -2.15, place: 'floor' },
  { id: 'bn', name: 'Back wall, right', x: 1.0, z: -2.15, place: 'floor' },
  { id: 'fx', name: 'Far left corner', x: -3.2, z: -1.55, place: 'floor' },
  { id: 'ml', name: 'Right side, middle', x: 2.45, z: -0.45, place: 'floor' },
  { id: 'll', name: 'Left side, middle', x: -2.6, z: -0.3, place: 'floor' },
  { id: 'fr', name: 'Left side, front', x: -2.1, z: 0.95, place: 'floor' },
  { id: 'mr', name: 'Right side, front', x: 2.15, z: 0.95, place: 'floor' },
  { id: 'lf', name: 'Left, near you', x: -2.9, z: 2.0, place: 'floor' },
  { id: 'rf', name: 'Right, near you', x: 2.9, z: 2.0, place: 'floor' },
  { id: 'wl', name: 'Wall, left', x: -2.1, z: -2.58, y: 1.55, place: 'wall' },
  { id: 'wr', name: 'Wall, right', x: 1.75, z: -2.58, y: 1.75, place: 'wall' },
  { id: 'wc', name: 'Wall, above the slate', x: 0.25, z: -2.58, y: 2.35, place: 'wall' },
  { id: 'wf', name: 'Wall, far left', x: -3.3, z: -2.58, y: 1.7, place: 'wall' },
  { id: 'wx', name: 'Wall, far right', x: 3.2, z: -2.58, y: 1.6, place: 'wall' },
  { id: 'cm', name: 'Ceiling, back right', x: 1.0, z: -1.6, y: 3.0, place: 'ceiling' },
  { id: 'cb', name: 'Ceiling, back left', x: -1.4, z: -1.9, y: 3.0, place: 'ceiling' },
];

/**
 * How big the gaming room is. Everyone starts in a small, ordinary room; coins and a grander room
 * knock the side walls out. half: how far each side wall stands from the middle of the mat.
 */
export const ROOM_SIZES = [
  { icon: '🚪', name: 'Small room', note: 'Where every gamer starts', half: 3.0, price: 0 },
  { icon: '🏠', name: 'Bigger room', note: 'Room for more things', half: 3.6, price: 800, need: { roomLevel: 3 } },
  { icon: '🏟️', name: 'Gaming hall', note: 'Every spot opens up', half: 4.1, price: 2500, need: { roomLevel: 5, wins: 10 } },
];
/** A spot fits a room when it stands inside its side walls. */
export const spotFits = (spot, size = 0) => Math.abs(spot.x) <= (ROOM_SIZES[size] || ROOM_SIZES[0]).half - 0.35;
export const spotsFor = (d, size = decorState().size) => SPOTS.filter(s => s.place === placeOf(d) && spotFits(s, size));

/** Whole-room looks: floor, mat, walls and light together. */
export const THEMES = [
  { id: '', icon: '🏠', name: 'Home style', price: 0, rarity: 'common', note: 'Follows the language you play in' },
  { id: 'cabin', icon: '🪵', name: 'Cozy cabin', price: 500, rarity: 'common', floor: 'wood', mat: 'tartan', wall: ['#c89b6a', '#7a4e2c', '#3b2414'], mood: 'warm' },
  { id: 'zen', icon: '🎋', name: 'Zen garden', price: 700, rarity: 'rare', need: { wins: 5 }, floor: 'wood', mat: 'tatami', wall: ['#efe6d2', '#8a7a5a', '#4a3c28'], mood: 'cool' },
  { id: 'beach', icon: '🏖️', name: 'Beach hut', price: 900, rarity: 'rare', need: { achievements: 3 }, floor: 'terrazzo', mat: 'bamboo', wall: ['#bfe9f2', '#f2dfb0', '#3aa3c9'], mood: 'sunset' },
  { id: 'garden', icon: '🌻', name: 'Garden room', price: 900, rarity: 'rare', need: { wins: 8 }, floor: 'jangpan', mat: 'dari', wall: ['#d8efc8', '#5f8f4a', '#2f5a24'], mood: 'warm' },
  { id: 'arcade', icon: '👾', name: 'Neon arcade', price: 1500, rarity: 'epic', need: { wins: 15 }, floor: 'carpet', mat: 'rug', wall: ['#2a2050', '#1a1238', '#ff3ea5'], mood: 'neon' },
  { id: 'space', icon: '🚀', name: 'Space station', price: 2200, rarity: 'epic', need: { achievements: 8 }, floor: 'tiles', mat: 'yo', wall: ['#1b2450', '#0d1330', '#33e1ff'], mood: 'cool' },
  { id: 'royal', icon: '🏰', name: 'Royal palace', price: 3500, rarity: 'legendary', need: { wins: 40, rank: 3 }, floor: 'parquet', mat: 'carpetwall', wall: ['#8a2433', '#3a0d14', '#d4af37'], mood: 'warm' },
];
export const themeOf = (id) => THEMES.find(t => t.id === id) || null;

const KEY = 'chitplay.decor';
export function decorState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    const placed = s?.placed && typeof s.placed === 'object' ? s.placed : {};
    return { owned: Array.isArray(s?.owned) ? s.owned : [], placed, themes: Array.isArray(s?.themes) ? s.themes : [], size: sizeOf(s?.size, placed) };
  } catch { return { owned: [], placed: {}, themes: [], size: 0 }; }
}
/**
 * The room's size. Rooms from before sizes existed get one big enough for everything already in
 * them, so nothing a player put up disappears behind a wall.
 */
function sizeOf(size, placed) {
  if (Number.isInteger(size) && size >= 0 && size < ROOM_SIZES.length) return size;
  const spots = Object.values(placed).map(id => SPOTS.find(s => s.id === id)).filter(Boolean);
  let n = 0;
  while (n + 1 < ROOM_SIZES.length && !spots.every(s => spotFits(s, n))) n += 1;
  return n;
}
export function saveDecor(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
export const decorOf = (id) => DECOR.find(d => d.id === id) || null;

/** How grand the room is: every thing and theme you own, and a bigger room, adds to it. */
export const ROOM_LEVELS = [
  [0, 'Normal room'], [3, 'Cozy corner'], [8, 'Hangout spot'], [15, 'Game den'], [25, 'Party room'],
  [40, 'Arcade lounge'], [60, 'Pro setup'], [85, 'Elite house'], [115, 'Gaming mansion'], [150, 'Legendary Gaming House'],
];
export function roomLevel(state = decorState()) {
  const pts = state.owned.reduce((n, id) => n + (RARITY[decorOf(id)?.rarity]?.points || 0), 0)
    + state.themes.reduce((n, id) => n + (RARITY[themeOf(id)?.rarity]?.points || 0) + 2, 0)
    + (state.size || 0) * 6;
  let i = 0;
  while (i + 1 < ROOM_LEVELS.length && pts >= ROOM_LEVELS[i + 1][0]) i += 1;
  const next = ROOM_LEVELS[i + 1];
  return { level: i + 1, title: ROOM_LEVELS[i][1], points: pts, next: next ? { at: next[0], title: next[1] } : null, share: next ? (pts - ROOM_LEVELS[i][0]) / (next[0] - ROOM_LEVELS[i][0]) : 1 };
}

/** What still has to happen before something can be bought or used, or '' when it is open. */
export function lockedBy(need, { wins = 0, achievements = 0, rank = 0 } = {}) {
  if (!need) return '';
  if (need.roomLevel && roomLevel().level < need.roomLevel) return `🔒 Reach room level ${need.roomLevel}`;
  if (need.wins && wins < need.wins) return `🔒 Win ${need.wins - wins} more game${need.wins - wins === 1 ? '' : 's'}`;
  if (need.achievements && achievements < need.achievements) return `🔒 ${need.achievements - achievements} more achievement${need.achievements - achievements === 1 ? '' : 's'}`;
  if (need.rank && rank < need.rank) return `🔒 Reach rank ${RANKS[need.rank]?.icon || ''} ${RANKS[need.rank]?.title || need.rank}`;
  return '';
}

/**
 * The next thing for your room: something you can buy right now, or else the nearest one,
 * with what it still takes. Null once the room has everything.
 */
export function nextForRoom({ wins = 0, achievements = 0, coins = 0, rank = 0 } = {}) {
  const owned = decorState().owned;
  const left = DECOR.filter(d => !owned.includes(d.id));
  if (!left.length) return null;
  const p = { wins, achievements, rank };
  const open = left.filter(d => !lockedBy(d.need, p)).sort((a, b) => a.price - b.price);
  const ready = open.find(d => d.price <= coins);
  if (ready) return { icon: ready.icon, text: `You can get a ${ready.name} for your gaming room now!`, ready: true };
  const gap = (d) => { const w = Math.max(0, (d.need?.wins || 0) - wins), a = Math.max(0, (d.need?.achievements || 0) - achievements), r = Math.max(0, (d.need?.rank || 0) - rank); return Math.max(0, d.price - coins) / 40 + w * 2 + a * 3 + r * 10; };
  const d = left.sort((x, y) => gap(x) - gap(y))[0];
  const why = lockedBy(d.need, p);
  return { icon: d.icon, text: why ? `Next for your gaming room: ${d.name} · ${why.replace('🔒 ', '')}` : `Next for your gaming room: ${d.name} · ${d.price - coins} more coins`, ready: false };
}
