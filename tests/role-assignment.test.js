import { describe, it, expect } from './harness.js';
import { assignRoles, validateAssignment, getRoleForPlayer, getPlayerForRole } from '../src/core/role-assignment.js';
import { ROLE_LIST, PLAYER_COUNT, ROLES } from '../src/app/config.js';
import { createSeededRng } from '../src/utils/random.js';

const mockPlayers = Array.from({ length: 4 }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));

describe('Role Assignment', () => {
  it('assigns exactly one role per player', () => {
    const assignment = assignRoles(mockPlayers, createSeededRng(42));
    expect(assignment).toHaveLength(PLAYER_COUNT);
    const playerIds = assignment.map(a => a.playerId);
    expect(new Set(playerIds).size).toBe(PLAYER_COUNT);
  });

  it('assigns exactly four unique roles', () => {
    const assignment = assignRoles(mockPlayers, createSeededRng(42));
    const roles = assignment.map(a => a.role);
    expect(new Set(roles).size).toBe(PLAYER_COUNT);
    for (const role of ROLE_LIST) {
      expect(roles).toContain(role);
    }
  });

  it('never duplicates or omits a role across many seeds', () => {
    for (let seed = 0; seed < 200; seed++) {
      const assignment = assignRoles(mockPlayers, createSeededRng(seed));
      const roles = assignment.map(a => a.role);
      expect(new Set(roles).size).toBe(4);
      for (const role of ROLE_LIST) {
        expect(roles).toContain(role);
      }
    }
  });

  it('validateAssignment accepts valid assignments', () => {
    const assignment = assignRoles(mockPlayers, createSeededRng(7));
    expect(validateAssignment(assignment)).toBe(true);
  });

  it('validateAssignment rejects duplicate roles', () => {
    const bad = [
      { playerId: 'p1', role: ROLES.KING },
      { playerId: 'p2', role: ROLES.KING },
      { playerId: 'p3', role: ROLES.DETECTIVE },
      { playerId: 'p4', role: ROLES.THIEF },
    ];
    expect(validateAssignment(bad)).toBe(false);
  });

  it('validateAssignment rejects missing players', () => {
    const bad = [
      { playerId: 'p1', role: ROLES.KING },
      { playerId: 'p2', role: ROLES.QUEEN },
    ];
    expect(validateAssignment(bad)).toBe(false);
  });

  it('getRoleForPlayer returns the correct role', () => {
    const assignment = assignRoles(mockPlayers, createSeededRng(1));
    for (const entry of assignment) {
      expect(getRoleForPlayer(assignment, entry.playerId)).toBe(entry.role);
    }
  });

  it('getPlayerForRole returns the correct player', () => {
    const assignment = assignRoles(mockPlayers, createSeededRng(1));
    for (const entry of assignment) {
      expect(getPlayerForRole(assignment, entry.role)).toBe(entry.playerId);
    }
  });

  it('throws on wrong player count', () => {
    expect(() => assignRoles([{ id: 'p1' }])).toThrow();
    expect(() => assignRoles([])).toThrow();
  });

  it('throws on duplicate player IDs', () => {
    const dupes = [
      { id: 'p1' }, { id: 'p1' }, { id: 'p3' }, { id: 'p4' },
    ];
    expect(() => assignRoles(dupes)).toThrow();
  });
});