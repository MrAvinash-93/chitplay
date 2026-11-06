import { STORAGE_KEYS } from '../app/config.js';
import { storage } from './storage-manager.js';

/**
 * Stores local statistics and match history.
 * No personal data beyond display names chosen by the player.
 */

const DEFAULTS = Object.freeze({
  matchesPlayed: 0,
  bestMatchScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalCorrectDetectiveGuesses: 0,
  totalThiefEscapes: 0,
  history: [], // [{at, rounds, winnerName, winnerScore, players:[{name,score}]}]
  savedPlayers: null,
});

let current = { ...DEFAULTS };
let loaded = false;

function load() {
  if (loaded) return;
  loaded = true;
  const stored = storage.get(STORAGE_KEYS.STATS, null);
  if (stored && typeof stored === 'object') {
    current = { ...DEFAULTS, ...stored };
    if (!Array.isArray(current.history)) current.history = [];
  }
}

function save() {
  storage.set(STORAGE_KEYS.STATS, current);
}

export const matchStore = {
  getStats() {
    load();
    return { ...current, history: [...current.history] };
  },

  recordMatchResult({ players, totals, rounds, correctGuess, thiefEscaped, winner }) {
    load();
    current.matchesPlayed += 1;
    const topScore = Math.max(...players.map(p => totals[p.id] || 0));
    if (topScore > current.bestMatchScore) current.bestMatchScore = topScore;

    if (correctGuess) {
      current.totalCorrectDetectiveGuesses += 1;
      current.currentStreak += 1;
      if (current.currentStreak > current.bestStreak) current.bestStreak = current.currentStreak;
    } else {
      current.currentStreak = 0;
    }
    if (thiefEscaped) current.totalThiefEscapes += 1;

    current.history.unshift({
      at: Date.now(),
      rounds,
      winnerName: winner?.name ?? '—',
      winnerScore: winner?.total ?? 0,
      players: players.map(p => ({ name: p.name, score: totals[p.id] || 0 })),
    });
    if (current.history.length > 20) current.history.length = 20;

    save();
  },

  savePlayerNames(names) {
    load();
    current.savedPlayers = Array.isArray(names) ? [...names] : null;
    save();
  },

  getSavedPlayerNames() {
    load();
    return current.savedPlayers ? [...current.savedPlayers] : null;
  },

  clearHistory() {
    load();
    current.history = [];
    save();
  },

  resetAll() {
    current = { ...DEFAULTS };
    save();
  },
};