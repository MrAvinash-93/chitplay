import test from 'node:test';
import assert from 'node:assert/strict';
import spinDuel, { LAUNCH_TICKS as SPIN_LAUNCH_TICKS } from '../src/arcade/video/spin-duel.js?v=20261120-0817';
import penFight, { LAUNCH_TICKS as PEN_LAUNCH_TICKS } from '../src/arcade/video/pen-fight.js?v=20261120-0817';
import lapaChupi from '../src/arcade/video/lapa-chupi.js?v=20261120-0817';

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

// Pen Fight takes turns: one flick each, only on your own turn
test('Pen Fight: only the player whose turn it is can flick, once', () => {
  const state = penFight.init({ n: 2, seed: 7 });
  const turn = state.turn, other = 1 - turn;
  const inputs = (i, swipe) => { const list = [{}, {}]; list[i] = { swipe }; return list; };
  penFight.step(state, inputs(other, { x: 1, y: 0, power: 0.9 }));
  assert.equal(state.phase, 'launch', 'a flick out of turn does nothing');
  assert.equal(state.pens[other].vx, 0);
  assert.equal(state.notice?.seat, other);
  penFight.step(state, inputs(turn, { x: turn ? -1 : 1, y: 0, power: 0.9 }));
  assert.equal(state.phase, 'flick');
  assert.equal(state.pens[turn].power, 0.9);
  assert.equal(state.flicks, 1);
  const vx = state.pens[turn].vx;
  penFight.step(state, inputs(turn, { x: turn ? 1 : -1, y: 0, power: 0.2 }));
  assert.equal(Math.sign(state.pens[turn].vx), Math.sign(vx), 'a second swipe cannot flick again in the same turn');
});

test('Pen Fight: a turn left alone passes to the other player', () => {
  const state = penFight.init({ n: 2, seed: 11 });
  const turn = state.turn;
  for (let i = 0; i < PEN_LAUNCH_TICKS; i++) penFight.step(state, [{}, {}]);
  assert.equal(state.phase, 'launch');
  assert.equal(state.turn, 1 - turn);
  assert.equal(state.notice?.seat, turn);
});

test('Pen Fight: flicking your own pen off the desk loses the round', () => {
  const state = penFight.init({ n: 2, seed: 3 });
  const turn = state.turn;
  // straight away from the other pen, as hard as possible
  const list = [{}, {}]; list[turn] = { swipe: { x: turn ? 1 : -1, y: 0, power: 1 } };
  penFight.step(state, list);
  for (let i = 0; i < 400 && state.phase !== 'result'; i++) penFight.step(state, [{}, {}]);
  assert.equal(state.phase, 'result');
  assert.equal(state.lastRound.winner, 1 - turn);
  assert.equal(state.lastRound.reason, 'self-out');
});

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
