import test from 'node:test';
import assert from 'node:assert/strict';
import spinDuel, { LAUNCH_TICKS as SPIN_LAUNCH_TICKS } from '../src/arcade/video/spin-duel.js?v=20261114-1435';
import penFight, { LAUNCH_TICKS as PEN_LAUNCH_TICKS } from '../src/arcade/video/pen-fight.js?v=20261114-1435';
import lapaChupi from '../src/arcade/video/lapa-chupi.js?v=20261114-1435';

function hudText(state) {
  const text = [];
  const context = {
    fillRect() {},
    fillText(value) { text.push(String(value)); },
    measureText(value) { return { width: String(value).length * 8 }; },
    restore() {},
    save() {},
    strokeText() {},
  };
  lapaChupi.hud(context, state, ['Seeker', 'Hider']);
  return text;
}

for (const [name, game, directionKey, launchTicks] of [
  ['Spin Duel', spinDuel, 'tops', SPIN_LAUNCH_TICKS],
  ['Pen Fight', penFight, 'pens', PEN_LAUNCH_TICKS],
]) {
  test(`${name}: swipe launches once with its direction and power`, () => {
    const state = game.init({ n: 2, seed: 7 });
    game.step(state, [{}, { swipe: { x: -1, y: 0, power: 0.9 } }]);
    assert.equal(state[directionKey][1].launched, true);
    assert.ok(state[directionKey][1].vx < 0);
    assert.equal(state[directionKey][1].power, 0.9);
    game.step(state, [{}, { swipe: { x: 1, y: 0, power: 0.2 } }]);
    assert.ok(state[directionKey][1].vx < 0, 'a second swipe cannot relaunch the same player');
  });

  test(`${name}: missed launch window ends the round and shows a retry cue`, () => {
    const state = game.init({ n: 2, seed: 11 });
    for (let i = 0; i < launchTicks; i++) game.step(state, [{}, {}]);
    assert.equal(state.phase, 'result');
    assert.equal(state.lastRound.winner, -1);
    game.step(state, [{ swipe: { x: 1, y: 0, power: 0.7 } }, {}]);
    assert.equal(state.notice?.seat, 0);
  });
}

test('Lapa Chupi: hidden coordinates are masked for other online players only', () => {
  const state = lapaChupi.init({ n: 2, seed: 13 });
  // the seeker is counted out afresh each match, so read who it is
  const seeker = state.it, hider = 1 - seeker;
  state.phase = 'seek';
  state.players[hider].hidden = true;
  const seekerState = lapaChupi.publicState(state, seeker);
  assert.equal(seekerState.players[hider].x, null);
  assert.equal(seekerState.players[hider].y, null);
  assert.equal(seekerState.isSeeker, true);
  assert.ok(seekerState.seekSignal);
  const hiderState = lapaChupi.publicState(state, hider);
  assert.equal(hiderState.players[hider].x, state.players[hider].x);
  assert.equal(hiderState.isSeeker, false);
  assert.equal(hiderState.seekSignal, null);
  assert.ok(hudText(seekerState).some((text) => text.includes('HIDER SIGNAL')));
  assert.equal(hudText(hiderState).some((text) => text.includes('HIDER SIGNAL')), false);
  assert.equal(state.players[hider].hidden, true);
});

test('Lapa Chupi: seeker signal gets warmer without exposing a hider location', () => {
  const state = lapaChupi.init({ n: 2, seed: 17 });
  const seeker = state.it, hider = 1 - seeker;
  state.phase = 'seek';
  state.players[seeker].x = 100;
  state.players[seeker].y = 200;
  state.players[hider].x = 500;
  state.players[hider].y = 200;
  state.players[hider].hidden = true;

  const cold = lapaChupi.publicState(state, seeker).seekSignal;
  state.players[seeker].x = 300;
  const warm = lapaChupi.publicState(state, seeker).seekSignal;
  state.players[seeker].x = 370;
  const hot = lapaChupi.publicState(state, seeker).seekSignal;

  assert.deepEqual([cold.level, warm.level, hot.level], [1, 2, 3]);
  assert.equal('distance' in hot, false);
  assert.equal('x' in hot, false);
  assert.equal('y' in hot, false);
});
