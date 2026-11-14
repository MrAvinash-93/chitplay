import { profile } from '../persistence/profile-store.js?v=20261114-1459';

export const GAME_STYLE_SLOTS = {
  'flying-chit': [
    { id: 'chit', label: 'Flying chit', defaultName: 'Classic paper wings' },
  ],
  'tunnel-race': [
    { id: 'craft', label: 'Your craft', defaultName: 'Paper plane' },
    { id: 'tunnel', label: 'Tunnel theme', defaultName: 'Paper blue' },
  ],
  chess: [
    { id: 'board', label: 'Board', defaultName: 'Tournament wood' },
    { id: 'pieces', label: 'Pieces', defaultName: 'Ivory and ebony' },
  ],
  ludo: [
    { id: 'board', label: 'Board', defaultName: 'Classic colors' },
    { id: 'pieces', label: 'Tokens', defaultName: 'Glossy tokens' },
  ],
  'spin-duel': [
    { id: 'top', label: 'Your top', defaultName: 'Classic top' },
    { id: 'arena', label: 'Arena', defaultName: 'Blue arena' },
  ],
  'pen-fight': [
    { id: 'pen', label: 'Your pen', defaultName: 'Classic pen' },
    { id: 'desk', label: 'Desk', defaultName: 'Classroom wood' },
  ],
};

export const GAME_COSMETICS = [
  { id: 'flying-blueprint', game: 'flying-chit', slot: 'chit', style: 'blueprint', name: 'Blueprint glider', icon: '📘', price: 100 },
  { id: 'flying-golden', game: 'flying-chit', slot: 'chit', style: 'golden', name: 'Golden origami', icon: '🌟', price: 160 },
  { id: 'flying-neon', game: 'flying-chit', slot: 'chit', style: 'neon', name: 'Neon comet', icon: '💠', price: 220 },
  { id: 'flying-rose', game: 'flying-chit', slot: 'chit', style: 'rose', name: 'Rose kite', icon: '🌸', price: 140 },
  { id: 'tunnel-winged-chit', game: 'tunnel-race', slot: 'craft', style: 'winged-chit', name: 'Winged Chit', icon: '🪁', price: 120 },
  { id: 'tunnel-cosmic', game: 'tunnel-race', slot: 'tunnel', style: 'cosmic', name: 'Cosmic tunnel', icon: '🌌', price: 140 },
  { id: 'tunnel-sunset', game: 'tunnel-race', slot: 'tunnel', style: 'sunset', name: 'Sunset tunnel', icon: '🌅', price: 180 },
  { id: 'chess-jade-board', game: 'chess', slot: 'board', style: 'jade', name: 'Jade board', icon: '🟩', price: 120 },
  { id: 'chess-ocean-board', game: 'chess', slot: 'board', style: 'ocean', name: 'Ocean board', icon: '🌊', price: 160 },
  { id: 'chess-royal-pieces', game: 'chess', slot: 'pieces', style: 'royal', name: 'Royal pieces', icon: '👑', price: 140 },
  { id: 'chess-neon-pieces', game: 'chess', slot: 'pieces', style: 'neon', name: 'Neon pieces', icon: '✨', price: 180 },
  { id: 'ludo-candy-board', game: 'ludo', slot: 'board', style: 'candy', name: 'Candy board', icon: '🍬', price: 100 },
  { id: 'ludo-sunset-board', game: 'ludo', slot: 'board', style: 'sunset', name: 'Sunset board', icon: '🌅', price: 150 },
  { id: 'ludo-matte-tokens', game: 'ludo', slot: 'pieces', style: 'matte', name: 'Matte tokens', icon: '🎨', price: 110 },
  { id: 'ludo-metal-tokens', game: 'ludo', slot: 'pieces', style: 'metallic', name: 'Metallic tokens', icon: '💎', price: 170 },
  { id: 'spin-comet-top', game: 'spin-duel', slot: 'top', style: 'comet', name: 'Comet top', icon: '☄️', price: 120 },
  { id: 'spin-prism-top', game: 'spin-duel', slot: 'top', style: 'prism', name: 'Prism top', icon: '🔷', price: 180 },
  { id: 'spin-cosmic-arena', game: 'spin-duel', slot: 'arena', style: 'cosmic', name: 'Cosmic arena', icon: '🌌', price: 140 },
  { id: 'spin-sunset-arena', game: 'spin-duel', slot: 'arena', style: 'sunset', name: 'Sunset arena', icon: '🌅', price: 180 },
  { id: 'pen-gel-pen', game: 'pen-fight', slot: 'pen', style: 'gel', name: 'Gel pen', icon: '🖊️', price: 100 },
  { id: 'pen-metal-pen', game: 'pen-fight', slot: 'pen', style: 'metal', name: 'Metal pen', icon: '🖋️', price: 160 },
  { id: 'pen-green-desk', game: 'pen-fight', slot: 'desk', style: 'green', name: 'Green desk', icon: '🟩', price: 120 },
  { id: 'pen-walnut-desk', game: 'pen-fight', slot: 'desk', style: 'walnut', name: 'Walnut desk', icon: '🪵', price: 160 },
];

const KEY = 'chitplay.game-cosmetics.v1';
const BY_ID = new Map(GAME_COSMETICS.map(item => [item.id, item]));
let data = null;

function load() {
  if (data) return data;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { saved = {}; }
  const owned = Array.isArray(saved.owned) ? [...new Set(saved.owned.filter(id => BY_ID.has(id)))] : [];
  const equipped = {};
  for (const [game, slots] of Object.entries(GAME_STYLE_SLOTS)) {
    for (const slot of slots) {
      const id = saved.equipped?.[game]?.[slot.id];
      const item = BY_ID.get(id);
      if (item?.game === game && item.slot === slot.id && owned.includes(id)) {
        (equipped[game] ||= {})[slot.id] = id;
      }
    }
  }
  data = { owned, equipped };
  return data;
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(load()));
}

export function gameStyleSlots(game) {
  return GAME_STYLE_SLOTS[game]?.slice() || [];
}

export function gameCosmeticsFor(game, slot) {
  return GAME_COSMETICS.filter(item => item.game === game && item.slot === slot);
}

export function gameCosmeticOwned(id) {
  return BY_ID.has(id) && load().owned.includes(id);
}

export function selectedGameCosmetic(game, slot) {
  const id = load().equipped[game]?.[slot];
  return BY_ID.get(id) || null;
}

export function equipGameCosmetic(game, slot, id = null) {
  if (!GAME_STYLE_SLOTS[game]?.some(option => option.id === slot)) return false;
  if (id != null) {
    const item = BY_ID.get(id);
    if (!item || item.game !== game || item.slot !== slot || !gameCosmeticOwned(id)) return false;
  }
  const equipped = load().equipped;
  const previous = equipped[game]?.[slot];
  if (id == null) {
    if (equipped[game]) delete equipped[game][slot];
  } else {
    (equipped[game] ||= {})[slot] = id;
  }
  try {
    save();
  } catch (error) {
    if (previous) (equipped[game] ||= {})[slot] = previous;
    else if (equipped[game]) {
      delete equipped[game][slot];
      if (!Object.keys(equipped[game]).length) delete equipped[game];
    }
    throw error;
  }
  return true;
}

export function buyGameCosmetic(id) {
  const item = BY_ID.get(id);
  const state = load();
  if (!item || state.owned.includes(id) || profile.coins < item.price || !profile.spend(item.price)) return false;

  const previous = state.equipped[item.game]?.[item.slot];
  state.owned.push(id);
  (state.equipped[item.game] ||= {})[item.slot] = id;
  try {
    save();
  } catch (error) {
    state.owned = state.owned.filter(ownedId => ownedId !== id);
    if (previous) state.equipped[item.game][item.slot] = previous;
    else delete state.equipped[item.game][item.slot];
    profile.addCoins(item.price);
    throw error;
  }
  return true;
}
