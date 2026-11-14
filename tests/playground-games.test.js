import test from 'node:test';
import assert from 'node:assert/strict';
import barafPani from '../src/arcade/video/baraf-pani.js?v=20261114-1334';
import pakdaPadi from '../src/arcade/video/pakda-padi.js?v=20261114-1334';

// who is "it" is counted out afresh each match (like "eeny meeny"), so these tests read it from the state

test('Baraf Pani: IT wins when every runner is frozen', () => {
  const state = barafPani.init({ n: 3, seed: 1 });
  state.players.forEach((p, i) => { if (i !== state.it) p.frozen = true; });
  barafPani.step(state, [{}, {}, {}]);
  assert.deepEqual(barafPani.over(state).winners, [state.it]);
});

test('Baraf Pani: a runner can unfreeze a nearby teammate', () => {
  const state = barafPani.init({ n: 3, seed: 2 });
  const [runner, frozen] = [0, 1, 2].filter(i => i !== state.it);
  Object.assign(state.players[state.it], { x: 560, y: 80 });
  Object.assign(state.players[runner], { x: 240, y: 200 });
  Object.assign(state.players[frozen], { x: 260, y: 200, frozen: true });
  barafPani.step(state, [{}, {}, {}]);
  assert.equal(state.players[frozen].frozen, false);
  assert.ok(state.ev.some(event => event.k === 'thaw' && event.victim === frozen));
});

test('Pakda Padi: a close tag passes IT to the caught player', () => {
  const state = pakdaPadi.init({ n: 2, seed: 3 });
  const tagger = state.it, runner = 1 - tagger;
  Object.assign(state.players[tagger], { x: 300, y: 200 });
  Object.assign(state.players[runner], { x: 328, y: 200 });
  pakdaPadi.step(state, [{}, {}]);
  assert.equal(state.it, runner);
  assert.ok(state.ev.some(event => event.k === 'tag' && event.victim === runner));
});
