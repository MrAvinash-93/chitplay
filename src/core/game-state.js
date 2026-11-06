import { GAME_PHASES, DEFAULT_MATCH_ROUNDS, ROLES } from '../app/config.js';
import { assignRoles, getPlayerForRole, getRoleForPlayer } from './role-assignment.js';
import { computeRoundScores, applyScores } from './scoring-engine.js';

/**
 * Authoritative game state. All UI reads from here; nothing else mutates
 * gameplay data. Pure data + small helpers — no DOM, no side effects.
 */
export class GameState {
  constructor() {
    this.phase = GAME_PHASES.HOME;
    this.players = [];              // [{id, name, avatar, color}]
    this.matchRound = 0;            // rounds completed
    this.matchRounds = DEFAULT_MATCH_ROUNDS;
    this.assignment = [];           // [{playerId, role}]
    this.revealQueue = [];          // playerIds yet to view their role
    this.revealedCount = 0;
    this.detectiveGuessPlayerId = null;
    this.roundBreakdown = null;     // {playerId: {role, points, reason}}
    this.roundScores = {};          // {playerId: points} for latest round
    this.totals = {};               // {playerId: cumulativePoints}
    this.matchStartedAt = null;
    this.lastResult = null;         // {detectiveGuessedCorrectly, thiefPlayerId, detectivePlayerId}
    this.roundNumber = 0;           // current round number (1-indexed)
  }

  setPlayers(players) {
    this.players = players.map(p => ({ ...p }));
    this.totals = {};
    for (const p of this.players) this.totals[p.id] = 0;
  }

  startMatch(rounds = DEFAULT_MATCH_ROUNDS) {
    this.matchRound = 0;
    this.matchRounds = rounds;
    this.totals = {};
    for (const p of this.players) this.totals[p.id] = 0;
    this.matchStartedAt = Date.now();
    this.lastResult = null;
    this.roundScores = {};
  }

    startRound(rng) {
    // rng optional — fall back to default random if not provided
    this.roundNumber += 1;
    this.assignment = assignRoles(this.players, rng);
    this.revealQueue = this.players.map(p => p.id);
    this.revealedCount = 0;
    this.detectiveGuessPlayerId = null;
    this.roundBreakdown = null;
    this.roundScores = {};
    this.lastResult = null;
  }

  markPlayerRevealed(playerId) {
    const idx = this.revealQueue.indexOf(playerId);
    if (idx !== -1) {
      this.revealQueue.splice(idx, 1);
      this.revealedCount += 1;
    }
  }

  get currentRevealPlayerId() {
    return this.revealQueue[0] ?? null;
  }

  get allRolesRevealed() {
    return this.revealQueue.length === 0;
  }

  get detectivePlayerId() {
    return getPlayerForRole(this.assignment, ROLES.DETECTIVE);
  }

  get thiefPlayerId() {
    return getPlayerForRole(this.assignment, ROLES.THIEF);
  }

  getRoleFor(playerId) {
    return getRoleForPlayer(this.assignment, playerId);
  }

  setDetectiveGuess(playerId) {
    // Detective cannot select themselves
    if (playerId === this.detectivePlayerId) {
      throw new Error('Detective cannot select themselves');
    }
    if (!this.players.some(p => p.id === playerId)) {
      throw new Error('Unknown player');
    }
    this.detectiveGuessPlayerId = playerId;
  }

  /**
   * Finalizes the round: computes scores and applies them.
   * Idempotent — repeated calls do not double-apply.
   */
  finalizeRound() {
    if (!this.detectiveGuessPlayerId) {
      throw new Error('Cannot finalize round without a detective guess');
    }
    if (this.roundBreakdown) {
      return { alreadyFinalized: true, ...this.lastResult };
    }
    const { breakdown, detectiveGuessedCorrectly, thiefPlayerId, detectivePlayerId } =
      computeRoundScores(this.assignment, this.detectiveGuessPlayerId);

    this.roundBreakdown = breakdown;
    this.roundScores = {};
    for (const [pid, entry] of Object.entries(breakdown)) {
      this.roundScores[pid] = entry.points;
    }
    this.totals = applyScores(this.totals, breakdown);
    this.matchRound += 1;
    this.lastResult = { detectiveGuessedCorrectly, thiefPlayerId, detectivePlayerId };
    return { alreadyFinalized: false, ...this.lastResult };
  }

  get isMatchComplete() {
    return this.matchRound >= this.matchRounds;
  }

  get matchDurationMs() {
    if (!this.matchStartedAt) return 0;
    return Date.now() - this.matchStartedAt;
  }

  get allPlayersRevealed() {
    return this.assignment.length > 0 && this.revealQueue.length === 0;
  }
}