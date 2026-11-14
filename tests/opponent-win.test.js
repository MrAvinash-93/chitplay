import test from 'node:test';
import assert from 'node:assert/strict';
import flyingChit from '../src/arcade/video/flying-chit.js';
import tunnelRace from '../src/arcade/video/tunnel-race.js';
import hoopFlick from '../src/arcade/video/hoop-flick.js';
import pinSpin from '../src/arcade/video/pin-spin.js';
import roadDash from '../src/arcade/video/road-dash.js';
import hungrySnake from '../src/arcade/video/hungry-snake.js';
import turboTunnel from '../src/arcade/video/turbo-tunnel.js';

for (const [name, game, collection] of [
  ['Flying Chit', flyingChit, 'chits'],
  ['Tunnel Race', tunnelRace, 'planes'],
  ['Hoop Flick', hoopFlick, 'players'],
  ['Pin Spin', pinSpin, 'players'],
  ['Road Dash', roadDash, 'carts'],
  ['Hungry Snake', hungrySnake, 'snakes'],
  ['Turbo Tunnel', turboTunnel, 'cars'],
]) {
  test(`${name}: the last active opponent wins immediately`, () => {
    const state = game.init({ n: 2, seed: 4 });
    state[collection][0].alive = false;
    state[collection][0].score = 100;
    state[collection][1].alive = true;
    state[collection][1].score = 1;
    const result = game.over(state);
    assert.deepEqual(result.winners, [1]);
    assert.equal(result.scores[1], name === 'Hungry Snake' ? 4 : 1);
    assert.equal(state[collection][1].score, 1, 'checking the result does not mutate live game state');
  });
}
