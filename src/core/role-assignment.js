import { ROLE_LIST, PLAYER_COUNT } from '../app/config.js';
import { shuffle } from '../utils/random.js';

/**
 * Assigns exactly one unique role to each of the four players.
 * Uses a Fisher–Yates shuffle with an injectable RNG for testability.
 * Pure function: returns a new array, never mutates input.
 *
 * @param {Array<{id:string,name:string}>} players
 * @param {() => number} rng
 * @returns {Array<{playerId:string, role:string}>}
 */
export function assignRoles(players, rng) {
  if (!Array.isArray(players) || players.length !== PLAYER_COUNT) {
    throw new Error(`assignRoles requires exactly ${PLAYER_COUNT} players`);
  }
  const ids = players.map(p => p.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Player IDs must be unique');
  }
  const shuffledRoles = shuffle(ROLE_LIST, rng);
  return players.map((player, index) => ({
    playerId: player.id,
    role: shuffledRoles[index],
  }));
}

/**
 * Returns the role assigned to a given player from an assignment array.
 */
export function getRoleForPlayer(assignment, playerId) {
  const entry = assignment.find(a => a.playerId === playerId);
  return entry ? entry.role : null;
}

/**
 * Returns the playerId who holds a given role.
 */
export function getPlayerForRole(assignment, role) {
  const entry = assignment.find(a => a.role === role);
  return entry ? entry.playerId : null;
}

/**
 * Verifies an assignment contains exactly the four unique roles
 * and one entry per player.
 */
export function validateAssignment(assignment) {
  if (!Array.isArray(assignment) || assignment.length !== PLAYER_COUNT) return false;
  const roles = new Set(assignment.map(a => a.role));
  const players = new Set(assignment.map(a => a.playerId));
  if (roles.size !== PLAYER_COUNT) return false;
  if (players.size !== PLAYER_COUNT) return false;
  for (const role of ROLE_LIST) {
    if (!roles.has(role)) return false;
  }
  return true;
}