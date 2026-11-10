import { describe, it, expect } from './harness.js';
import { storage } from '../src/persistence/storage-manager.js';
import { STORAGE_KEYS, STORAGE_VERSION } from '../src/app/config.js';
import { settingsStore } from '../src/persistence/settings-store.js?v=20261110-1415';

describe('Storage Manager', () => {
  it('writes and reads back a value', () => {
    storage.set('__test_key', { hello: 'world', n: 42 });
    const val = storage.get('__test_key', null);
    expect(val.hello).toBe('world');
    expect(val.n).toBe(42);
    storage.remove('__test_key');
  });

  it('returns fallback for missing key', () => {
    const val = storage.get('__definitely_missing_key__', 'fallback');
    expect(val).toBe('fallback');
  });

  it('version mismatch returns fallback', () => {
    // Simulate older schema by writing raw
    try {
      localStorage.setItem('__versioned_test', JSON.stringify({ __v: 0, data: { old: true } }));
    } catch {
      // localStorage unavailable — skip
      return;
    }
    const val = storage.get('__versioned_test', 'fallback');
    expect(val).toBe('fallback');
    try { localStorage.removeItem('__versioned_test'); } catch {}
  });

  it('handles corrupted JSON gracefully', () => {
    try {
      localStorage.setItem('__corrupt_test', '{not valid json');
    } catch { return; }
    const val = storage.get('__corrupt_test', 'fallback');
    expect(val).toBe('fallback');
    try { localStorage.removeItem('__corrupt_test'); } catch {}
  });

  it('remove works for missing keys', () => {
    const result = storage.remove('__never_existed__');
    expect(result).toBe(true);
  });

  it('STORAGE_VERSION is defined', () => {
    expect(typeof STORAGE_VERSION).toBe('number');
    expect(STORAGE_VERSION).toBeGreaterThan(0);
  });

  it('stores and restores a profile player name', () => {
    const originalName = settingsStore.get('playerName');
    expect(typeof originalName).toBe('string');
    expect(originalName.length).toBeGreaterThan(0);
    expect(originalName.length <= 20).toBe(true);
    settingsStore.set('playerName', 'ChitPlay Tester');
    expect(settingsStore.get('playerName')).toBe('ChitPlay Tester');
    settingsStore.set('playerName', originalName);
  });
});