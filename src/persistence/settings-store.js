import { STORAGE_KEYS } from '../app/config.js';
import { storage } from './storage-manager.js';
import { gameBus, EVENTS } from '../core/event-bus.js';

const DEFAULTS = Object.freeze({
  soundEnabled: true,
  musicEnabled: false,
  reducedMotion: false,
  animationsEnabled: true,
  matchRounds: 7,
  hapticsEnabled: true,
  world3d: true,
  chatEnabled: true,
  graphics: 'low',       // "Light": smooth on every phone; higher levels are one choice away in the profile
  playerName: 'Avin',
  voiceEnabled: true,
  defaultsVersion: 4,
});

let current = { ...DEFAULTS };
let loaded = false;

function load() {
  if (loaded) return;
  loaded = true;
  const stored = storage.get(STORAGE_KEYS.SETTINGS, null);
  if (stored && typeof stored === 'object') {
    current = { ...DEFAULTS, ...stored };
    // settings saved under the old defaults move to the new ones once; later choices stick
    if (stored.defaultsVersion !== DEFAULTS.defaultsVersion) {
      if ((stored.defaultsVersion || 0) < 2) {
        if (/^Player-/.test(current.playerName || '')) current.playerName = DEFAULTS.playerName;
        if (current.matchRounds === 5) current.matchRounds = DEFAULTS.matchRounds;
        current.voiceEnabled = DEFAULTS.voiceEnabled;
      }
      // "auto" was the old default, not a choice; someone who picked High or 4K keeps it
      if (current.graphics === 'auto') current.graphics = DEFAULTS.graphics;
      // the voices came back (they were switched off for everyone before): on once, then it's the player's choice
      if ((stored.defaultsVersion || 0) < 4) current.voiceEnabled = true;
      current.defaultsVersion = DEFAULTS.defaultsVersion;
      save();
    }
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