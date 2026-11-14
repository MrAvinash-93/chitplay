import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
let failCosmeticSave = false;
globalThis.localStorage = {
  getItem(key) { return storage.get(key) ?? null; },
  setItem(key, value) {
    if (failCosmeticSave && key === 'chitplay.game-cosmetics.v1') throw new Error('test storage failure');
    storage.set(key, String(value));
  },
};

const { profile } = await import('../src/persistence/profile-store.js?v=20261114-1515');
const cosmetics = await import('../src/arcade/game-cosmetics.js?v=20261114-1515');

test('game cosmetics spend earned coins and only equip in their own game slot', async () => {
  assert.equal(cosmetics.buyGameCosmetic('ludo-candy-board'), false);
  assert.equal(cosmetics.buyGameCosmetic('not-a-cosmetic'), false);
  profile.addCoins(300);

  assert.equal(cosmetics.buyGameCosmetic('ludo-candy-board'), true);
  assert.equal(profile.coins, 200);
  assert.equal(cosmetics.gameCosmeticOwned('ludo-candy-board'), true);
  assert.equal(cosmetics.selectedGameCosmetic('ludo', 'board')?.style, 'candy');
  const reloaded = await import('../src/arcade/game-cosmetics.js?v=20261114-1515');
  assert.equal(reloaded.gameCosmeticOwned('ludo-candy-board'), true);
  assert.equal(reloaded.selectedGameCosmetic('ludo', 'board')?.style, 'candy');
  assert.equal(cosmetics.buyGameCosmetic('ludo-candy-board'), false);
  assert.equal(cosmetics.equipGameCosmetic('chess', 'board', 'ludo-candy-board'), false);
  assert.equal(cosmetics.equipGameCosmetic('ludo', 'board', null), true);
  assert.equal(cosmetics.selectedGameCosmetic('ludo', 'board'), null);

  const before = profile.coins;
  failCosmeticSave = true;
  assert.throws(() => cosmetics.buyGameCosmetic('chess-jade-board'));
  failCosmeticSave = false;
  assert.equal(profile.coins, before);
  assert.equal(cosmetics.gameCosmeticOwned('chess-jade-board'), false);

  failCosmeticSave = true;
  assert.throws(() => cosmetics.equipGameCosmetic('ludo', 'board', 'ludo-candy-board'));
  failCosmeticSave = false;
  assert.equal(cosmetics.selectedGameCosmetic('ludo', 'board'), null);
});

test('Flying Chit styles are coin purchases and equip in the chit slot', () => {
  const balance = profile.coins;
  assert.equal(cosmetics.gameStyleSlots('flying-chit')[0].id, 'chit');
  assert.deepEqual(cosmetics.gameCosmeticsFor('flying-chit', 'chit').map(item => item.style), ['blueprint', 'golden', 'neon', 'rose']);
  profile.addCoins(100);

  assert.equal(cosmetics.buyGameCosmetic('flying-blueprint'), true);
  assert.equal(profile.coins, balance);
  assert.equal(cosmetics.selectedGameCosmetic('flying-chit', 'chit')?.style, 'blueprint');
  assert.equal(cosmetics.buyGameCosmetic('flying-blueprint'), false);
  assert.equal(cosmetics.equipGameCosmetic('tunnel-race', 'chit', 'flying-blueprint'), false);
});
