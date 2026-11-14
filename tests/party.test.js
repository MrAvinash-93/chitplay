import test from 'node:test';
import assert from 'node:assert/strict';

// the party module touches localStorage and the page only when used; a tiny stand-in is enough here
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.addEventListener = () => {};
const { planFor } = await import('../src/net/party.js');

test('a party of four plays together where four fit, and in pairs at two-player games', () => {
  const four = ['a', 'b', 'c', 'd'];
  assert.deepEqual(planFor('ludo', four).tables, [['a', 'b', 'c', 'd']]);
  assert.deepEqual(planFor('chess', four).tables, [['a', 'b'], ['c', 'd']]);
  assert.deepEqual(planFor('call-break', four).tables, [['a', 'b', 'c', 'd']]);
});
test('nobody is left out, and the host always leads the first table', () => {
  for (const slug of ['chess', 'ludo', 'bingo', 'carrom', 'who-is-the-spy']) {
    for (let n = 1; n <= 10; n++) {
      const people = Array.from({ length: n }, (_, i) => `p${i}`);
      const plan = planFor(slug, people);
      assert.deepEqual(plan.tables.flat().sort(), [...people].sort(), `${slug} with ${n}: everyone has a seat`);
      assert.equal(plan.tables[0][0], 'p0', `${slug}: the host leads table 1`);
    }
  }
  // three at a two-player game: a pair and one who plays the computer (never three at one board)
  assert.deepEqual(planFor('chess', ['a', 'b', 'c']).tables, [['a', 'b'], ['c']]);
});
