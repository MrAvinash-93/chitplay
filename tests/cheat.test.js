import { describe, it, expect } from './harness.js';
import { Match, CHEAT_PENALTY } from '../src/world/match.js?v=20261106-rotate';
import { COUNTRIES } from '../src/world/countries.js?v=20261108-prod';

const withRandom = (values, fn) => {
  const original = Math.random;
  let i = 0;
  Math.random = () => values[Math.min(i++, values.length - 1)];
  try { return fn(); } finally { Math.random = original; }
};
const fresh = () => { const m = new Match(COUNTRIES.IN, 4, 7); m.startRound(); return m; };

describe('Cheat', () => {
  it('a failed peek sees nothing and clears nobody', () => {
    const m = fresh();
    const res = withRandom([0.9, 0.9, 0], () => m.cheat());
    expect(res.peeked).toBe(false);
    expect(res.slot).toBe(null);
    expect(m.cleared).toHaveLength(0);
  });

  it('a successful peek clears an innocent, never the thief', () => {
    const m = fresh();
    const res = withRandom([0.9, 0.1, 0], () => m.cheat());
    expect(res.peeked).toBe(true);
    expect(res.seat === m.thief).toBe(false);
    expect(m.cleared).toHaveLength(1);
  });

  it('only one try per round', () => {
    const m = fresh();
    m.cheat();
    expect(m.cheat()).toBe(null);
  });

  it('being noticed costs points whether or not the peek worked', () => {
    const m = fresh();
    withRandom([0, 0.9, 0], () => m.cheat());
    expect(m.cheatPenalty).toBe(CHEAT_PENALTY);
  });

  it('works about half the time', () => {
    let seen = 0;
    for (let i = 0; i < 2000; i++) if (fresh().cheat()?.peeked) seen++;
    expect(seen > 850 && seen < 1150).toBe(true);
  });
});
