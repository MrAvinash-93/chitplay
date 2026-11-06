import { ROLES, SCORING } from '../app/config.js';

/**
 * Pure scoring engine. Given an assignment and the Detective's guess,
 * returns per-player round scores plus metadata.
 *
 * Rules:
 *  - King and Queen always score their fixed amount for a completed round.
 *  - Detective scores 500 if correct, 0 if wrong.
 *  - Cheat scores 1000 if Detective wrong, 0 if caught.
 *  - Every completed round awards points exactly once per player.
 */
export function computeRoundScores(assignment, detectiveGuessPlayerId) {
  if (!Array.isArray(assignment) || assignment.length !== 4) {
    throw new Error('computeRoundScores requires a 4-player assignment');
  }

  const detectiveEntry = assignment.find(a => a.role === ROLES.DETECTIVE);
  const thiefEntry = assignment.find(a => a.role === ROLES.THIEF);
  if (!detectiveEntry || !thiefEntry) {
    throw new Error('Assignment must contain a Detective and a Cheat');
  }

  const detectiveGuessedCorrectly = detectiveGuessPlayerId === thiefEntry.playerId;

  const breakdown = {};
  for (const entry of assignment) {
    const { playerId, role } = entry;
    switch (role) {
      case ROLES.KING:
        breakdown[playerId] = { role, points: SCORING[ROLES.KING], reason: 'King completes the round' };
        break;
      case ROLES.QUEEN:
        breakdown[playerId] = { role, points: SCORING[ROLES.QUEEN], reason: 'Queen completes the round' };
        break;
      case ROLES.DETECTIVE:
        breakdown[playerId] = detectiveGuessedCorrectly
          ? { role, points: SCORING[ROLES.DETECTIVE_CORRECT], reason: 'Detective correctly identified the Cheat' }
          : { role, points: SCORING[ROLES.DETECTIVE_WRONG], reason: 'Detective accused the wrong player' };
        break;
      case ROLES.THIEF:
        breakdown[playerId] = detectiveGuessedCorrectly
          ? { role, points: SCORING[ROLES.THIEF_CAUGHT], reason: 'Cheat was caught by the Detective' }
          : { role, points: SCORING[ROLES.THIEF_ESCAPED], reason: 'Cheat escaped — Detective guessed wrong' };
        break;
      default:
        breakdown[playerId] = { role, points: 0, reason: 'Unknown role' };
    }
  }

  return {
    breakdown,
    detectiveGuessedCorrectly,
    thiefPlayerId: thiefEntry.playerId,
    detectivePlayerId: detectiveEntry.playerId,
  };
}

/**
 * Applies round scores to cumulative totals. Returns a new totals object.
 */
export function applyScores(cumulative, roundBreakdown) {
  const next = { ...cumulative };
  for (const [playerId, entry] of Object.entries(roundBreakdown)) {
    next[playerId] = (next[playerId] || 0) + entry.points;
  }
  return next;
}

/**
 * Ranks players by total score. Ties share the same rank; next rank skips.
 */
export function rankPlayers(players, totals) {
  const sorted = [...players]
    .map(p => ({ ...p, total: totals[p.id] || 0 }))
    .sort((a, b) => b.total - a.total);
  let rank = 1;
  return sorted.map((p, i) => {
    if (i > 0 && sorted[i - 1].total !== p.total) rank = i + 1;
    return { ...p, rank, isTied: sorted.filter(x => x.total === p.total).length > 1 };
  });
}