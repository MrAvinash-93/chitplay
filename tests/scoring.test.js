import { describe, it, expect } from './harness.js';
import { computeRoundScores, applyScores, rankPlayers } from '../src/core/scoring-engine.js';
import { ROLES, SCORING } from '../src/app/config.js';

function makeAssignment(kingId, queenId, detectiveId, thiefId) {
  return [
    { playerId: kingId, role: ROLES.KING },
    { playerId: queenId, role: ROLES.QUEEN },
    { playerId: detectiveId, role: ROLES.DETECTIVE },
    { playerId: thiefId, role: ROLES.THIEF },
  ];
}

describe('Scoring Engine', () => {
  it('King always scores 1000', () => {
    const assignment = makeAssignment('k', 'q', 'd', 't');
    const { breakdown } = computeRoundScores(assignment, 't');
    expect(breakdown.k.points).toBe(1000);
  });

  it('Queen always scores 800', () => {
    const assignment = makeAssignment('k', 'q', 'd', 't');
    const { breakdown } = computeRoundScores(assignment, 't');
    expect(breakdown.q.points).toBe(800);
  });

  it('Detective scores 500 on correct guess', () => {
    const assignment = makeAssignment('k', 'q', 'd', 't');
    const { breakdown, detectiveGuessedCorrectly } = computeRoundScores(assignment, 't');
    expect(breakdown.d.points).toBe(500);
    expect(detectiveGuessedCorrectly).toBe(true);
  });

  it('Detective scores 0 on wrong guess', () => {
    const assignment = makeAssignment('k', 'q', 'd', 't');
    const { breakdown, detectiveGuessedCorrectly } = computeRoundScores(assignment, 'k');
    expect(breakdown.d.points).toBe(0);
    expect(detectiveGuessedCorrectly).toBe(false);
  });

  it('Thief scores 0 when caught', () => {
    const assignment = makeAssignment('k', 'q', 'd', 't');
    const { breakdown } = computeRoundScores(assignment, 't');
    expect(breakdown.t.points).toBe(0);
  });

  it('Thief scores 1000 when escaped', () => {
    const assignment = makeAssignment('k', 'q', 'd', 't');
    const { breakdown } = computeRoundScores(assignment, 'q');
    expect(breakdown.t.points).toBe(1000);
  });

  it('total points awarded per round is always 2800 or 2300', () => {
    const assignment = makeAssignment('k', 'q', 'd', 't');
    const correct = computeRoundScores(assignment, 't');
    const wrong = computeRoundScores(assignment, 'q');
    const sumCorrect = Object.values(correct.breakdown).reduce((s, e) => s + e.points, 0);
    const sumWrong = Object.values(wrong.breakdown).reduce((s, e) => s + e.points, 0);
    // Correct: 1000 + 800 + 500 + 0 = 2300
    // Wrong:   1000 + 800 + 0 + 1000 = 2800
    expect(sumCorrect).toBe(2300);
    expect(sumWrong).toBe(2800);
  });

  it('applyScores accumulates correctly', () => {
    const totals = { a: 100, b: 200, c: 300, d: 400 };
    const breakdown = {
      a: { points: 10 }, b: { points: 20 }, c: { points: 30 }, d: { points: 40 },
    };
    const next = applyScores(totals, breakdown);
    expect(next.a).toBe(110);
    expect(next.b).toBe(220);
    expect(next.c).toBe(330);
    expect(next.d).toBe(440);
  });

  it('applyScores does not mutate input', () => {
    const totals = { a: 100 };
    const breakdown = { a: { points: 10 } };
    applyScores(totals, breakdown);
    expect(totals.a).toBe(100);
  });

  it('rankPlayers sorts by total descending', () => {
    const players = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const totals = { a: 100, b: 400, c: 250, d: 50 };
    const ranked = rankPlayers(players, totals);
    expect(ranked[0].id).toBe('b');
    expect(ranked[1].id).toBe('c');
    expect(ranked[2].id).toBe('a');
    expect(ranked[3].id).toBe('d');
  });

  it('rankPlayers assigns shared rank for ties', () => {
    const players = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const totals = { a: 100, b: 400, c: 400, d: 50 };
    const ranked = rankPlayers(players, totals);
    // b and c tied at 400 → rank 1, then a → rank 3, d → rank 4
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(1);
    expect(ranked[0].isTied).toBe(true);
    expect(ranked[2].rank).toBe(3);
    expect(ranked[3].rank).toBe(4);
  });

  it('throws on invalid assignment', () => {
    expect(() => computeRoundScores([], 'x')).toThrow();
    expect(() => computeRoundScores([{ playerId: 'a', role: ROLES.KING }], 'a')).toThrow();
  });

  it('throws when assignment lacks a Thief', () => {
    const noThief = [
      { playerId: 'a', role: ROLES.KING },
      { playerId: 'b', role: ROLES.QUEEN },
      { playerId: 'c', role: ROLES.DETECTIVE },
      { playerId: 'd', role: ROLES.KING },
    ];
    expect(() => computeRoundScores(noThief, 'a')).toThrow();
  });
});