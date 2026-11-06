import { PLAYER_COUNT } from '../app/config.js';
import { ValidationError } from '../utils/errors.js';

const MAX_NAME_LENGTH = 14;

export function validatePlayerName(name, existingNames = []) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` };
  }
  const normalized = trimmed.toLowerCase();
  const duplicates = existingNames
    .filter(n => n !== undefined && n !== null)
    .map(n => String(n).trim().toLowerCase())
    .filter(n => n === normalized);
  if (duplicates.length > 0) {
    return { valid: false, error: 'Names must be unique' };
  }
  return { valid: true, value: trimmed };
}

export function validatePlayers(players) {
  if (!Array.isArray(players) || players.length !== PLAYER_COUNT) {
    return { valid: false, error: `Exactly ${PLAYER_COUNT} players required` };
  }
  const names = [];
  const errors = [];
  for (const p of players) {
    const res = validatePlayerName(p.name, names);
    if (!res.valid) errors.push(res.error);
    else names.push(res.value);
  }
  if (errors.length) return { valid: false, error: errors[0] };
  return { valid: true };
}

export function assertValid(condition, message, field = null) {
  if (!condition) throw new ValidationError(message, field);
}

export { MAX_NAME_LENGTH };