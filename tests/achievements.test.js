import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem(key) { return storage.get(key) ?? null; },
  setItem(key, value) { storage.set(key, String(value)); },
};

const [{ ALL_GAMES }, { profile }, { ACHIEVEMENTS, checkUnlocks, holdPopups }] = await Promise.all([
  import('../src/arcade/catalog.js?v=20261114-1515'),
  import('../src/persistence/profile-store.js?v=20261114-1515'),
  import('../src/arcade/achievements.js?v=20261114-1515'),
]);

holdPopups(true);

test('every game has collectible first-play and regular-player rewards', () => {
  for (const game of ALL_GAMES) {
    assert.ok(ACHIEVEMENTS.some(item => item.id === `game-first-${game.slug}`));
    assert.ok(ACHIEVEMENTS.some(item => item.id === `game-regular-${game.slug}`));
  }
});

test('game rewards unlock once at the stated play and win milestones', () => {
  const state = { done: [], plays: { ludo: 1 }, wins: {}, best: {}, stats: {} };
  const before = profile.coins;

  assert.deepEqual(checkUnlocks(state).map(item => item.id), ['game-first-ludo']);
  assert.deepEqual(checkUnlocks(state), []);

  state.plays.ludo = 5;
  assert.deepEqual(checkUnlocks(state).map(item => item.id), ['game-regular-ludo']);

  state.plays.chess = 3;
  state.wins.chess = 3;
  assert.deepEqual(
    checkUnlocks(state).map(item => item.id).sort(),
    ['game-first-chess', 'game-regular-chess'],
  );
  assert.equal(profile.coins, before + 200);
});
