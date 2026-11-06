import { STORAGE_KEYS } from '../app/config.js';
import { storage } from './storage-manager.js';
import { gameBus, EVENTS } from '../core/event-bus.js';

function createDefaultPlayerName() {
  const values = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values);
  } else {
    values[0] = (Date.now() ^ Math.floor(Math.random() * 0x100000000)) >>> 0;
    values[1] = Math.floor(Math.random() * 0x100000000);
  }
  const suffix = [...values]
    .map(value => value.toString(36).padStart(7, '0'))
    .join('')
    .slice(0, 12)
    .toUpperCase();
  return `Player-${suffix}`;
}

const DEFAULTS = Object.freeze({
  soundEnabled: true,
  musicEnabled: false,
  reducedMotion: false,
  animationsEnabled: true,
  matchRounds: 5,
  hapticsEnabled: true,
  world3d: true,
  vhsFilter: true,
  playerName: createDefaultPlayerName(),
});

let current = { ...DEFAULTS };
let loaded = false;

function load() {
  if (loaded) return;
  loaded = true;
  const stored = storage.get(STORAGE_KEYS.SETTINGS, null);
  if (stored && typeof stored === 'object') {
    current = { ...DEFAULTS, ...stored };
  }
  if (typeof current.playerName !== 'string' || !current.playerName.trim()) {
    current.playerName = DEFAULTS.playerName;
    save();
  } else {
    current.playerName = current.playerName.trim().slice(0, 20);
    if (stored?.playerName !== current.playerName) save();
  }
  // Respect OS-level reduced-motion preference on first load
  if (stored == null && typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.reducedMotion = true;
      current.animationsEnabled = false;
    }
  }
}

function save() {
  storage.set(STORAGE_KEYS.SETTINGS, current);
}

export const settingsStore = {
  get(key) {
    load();
    return current[key];
  },

  getAll() {
    load();
    return { ...current };
  },

  set(key, value) {
    load();
    if (key === 'playerName') {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('Player name must not be empty.');
      }
      value = value.trim().slice(0, 20);
    }
    if (current[key] === value) return;
    current[key] = value;
    save();
    gameBus.emit(EVENTS.SETTINGS_CHANGED, { key, value, settings: { ...current } });
  },

  setAll(partial) {
    load();
    let changed = false;
    for (const [k, v] of Object.entries(partial)) {
      if (k === 'playerName' && (typeof v !== 'string' || !v.trim())) continue;
      if (k in DEFAULTS && current[k] !== v) {
        current[k] = k === 'playerName' ? v.trim().slice(0, 20) : v;
        changed = true;
      }
    }
    if (changed) {
      save();
      gameBus.emit(EVENTS.SETTINGS_CHANGED, { settings: { ...current } });
    }
  },

  reset() {
    current = { ...DEFAULTS };
    save();
    gameBus.emit(EVENTS.SETTINGS_CHANGED, { settings: { ...current } });
  },
};