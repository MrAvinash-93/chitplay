import { describe, it, expect } from './harness.js';
import { Match, CHEAT_PENALTY, CHEAT_CATCH_CHANCE } from '../src/world/match.js?v=20261114-1549';
import { COUNTRIES } from '../src/world/countries.js?v=20261114-1549';
import { nextCaughtScene, nextCloseCall, SCENE_COUNTS, resetSceneDecks } from '../src/world/cheat-lines.js?v=20261114-1549';

const withRandom = (value, fn) => {
  const original = Math.random;
  Math.random = () => value;
  try { return fn(); } finally { Math.random = original; }
};
const fresh = () => { const m = new Match(COUNTRIES.IN, 4, 7); m.startRound(); return m; };

describe('Cheat', () => {
  it('caught: nothing is seen, nobody is cleared, all suspects stay, and it costs points', () => {
    const m = fresh();
    const res = withRandom(0, () => m.cheat());
    expect(res.caught).toBe(true);
    expect(res.peeked).toBe(false);
    expect(res.slot).toBe(null);
    expect(m.cleared).toHaveLength(0);
    expect(m.suspects()).toHaveLength(3);
    expect(m.cheatPenalty).toBe(CHEAT_PENALTY);
  });

  it('not caught: one innocent is cleared and two suspects are left', () => {
    const m = fresh();
    const res = withRandom(0.99, () => m.cheat());
    expect(res.caught).toBe(false);
    expect(res.peeked).toBe(true);
    expect(m.suspects()).toHaveLength(2);
    expect(m.cheatPenalty).toBe(0);
  });

  it('the thief is never the chit that gets seen', () => {
    for (let i = 0; i < 500; i++) {
      const m = fresh();
      const res = m.cheat();
      if (res.peeked) {
        expect(res.seat === m.thief).toBe(false);
        expect(res.slot === 'thief').toBe(false);
      }
      expect(m.suspects().includes(m.thief)).toBe(true);
    }
  });

  it('only one try per round', () => {
    const m = fresh();
    m.cheat();
    expect(m.cheat()).toBe(null);
  });

  it('goes unnoticed about 70% of the time', () => {
    expect(CHEAT_CATCH_CHANCE).toBe(0.3);
    let safe = 0;
    for (let i = 0; i < 3000; i++) if (!fresh().cheat().caught) safe++;
    expect(safe > 1950 && safe < 2250).toBe(true);
  });

  it('counts tries and catches for the profile', () => {
    const m = fresh();
    withRandom(0, () => m.cheat());
    expect(m.cheats[m.guesser]).toBe(1);
    expect(m.caughtCheats[m.guesser]).toBe(1);
  });
});

describe('Cheat scenes', () => {
  const allDifferent = (next, n) => {
    const seen = new Set();
    for (let i = 0; i < n; i++) seen.add(next('english', { name: 'A', other: 'B' }).join('|'));
    return seen.size;
  };
  it('has at least 20 scenes of each kind', () => {
    expect(SCENE_COUNTS.caught >= 20).toBe(true);
    expect(SCENE_COUNTS.closeCall >= 20).toBe(true);
  });
  it('20 catches in a row are 20 different scenes', () => {
    resetSceneDecks();
    expect(allDifferent(nextCaughtScene, 20)).toBe(20);
  });
  it('20 close calls in a row are 20 different scenes', () => {
    resetSceneDecks();
    expect(allDifferent(nextCloseCall, 20)).toBe(20);
  });
  it('every scene is a full exchange with names filled in', () => {
    for (const lang of ['english', 'hinglish', 'spanish']) {
      for (let i = 0; i < 30; i++) {
        const scene = nextCaughtScene(lang, { name: 'Asha', other: 'Ravi' });
        expect(scene).toHaveLength(3);
        expect(scene.join(' ').includes('{')).toBe(false);
      }
    }
  });
});
