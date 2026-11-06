import { STORAGE_KEYS, STORAGE_VERSION } from '../app/config.js';

/**
 * Safe, versioned LocalStorage wrapper.
 * Never throws on read/write failures — degrades gracefully.
 */

function isAvailable() {
  try {
    const k = '__chitplay_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const available = isAvailable();
const memoryFallback = new Map();

export const storage = {
  available,

  get(key, fallback = null) {
    try {
      const raw = available ? localStorage.getItem(key) : memoryFallback.get(key);
      if (raw == null) return fallback;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.__v !== undefined) {
        if (parsed.__v !== STORAGE_VERSION) {
          // Version mismatch — migrate or discard
          return fallback;
        }
        return parsed.data;
      }
      return parsed;
    } catch (err) {
      console.warn(`[storage] Failed to read ${key}:`, err);
      return fallback;
    }
  },

  set(key, value) {
    try {
      const wrapped = JSON.stringify({ __v: STORAGE_VERSION, data: value });
      if (available) localStorage.setItem(key, wrapped);
      else memoryFallback.set(key, wrapped);
      return true;
    } catch (err) {
      console.warn(`[storage] Failed to write ${key}:`, err);
      return false;
    }
  },

  remove(key) {
    try {
      if (available) localStorage.removeItem(key);
      else memoryFallback.delete(key);
      return true;
    } catch {
      return false;
    }
  },

  clearAll() {
    for (const key of Object.values(STORAGE_KEYS)) this.remove(key);
  },
};