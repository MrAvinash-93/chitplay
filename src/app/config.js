/**
 * ChitPlay configuration — single source of truth for game constants.
 * All values are frozen to prevent accidental mutation.
 */

export const ROLES = Object.freeze({
  KING: 'king',
  QUEEN: 'queen',
  DETECTIVE: 'detective',
  THIEF: 'thief',
  DETECTIVE_CORRECT: 'detective_correct',
  DETECTIVE_WRONG: 'detective_wrong',
  THIEF_CAUGHT: 'thief_caught',
  THIEF_ESCAPED: 'thief_escaped',
});

export const ROLE_LIST = Object.freeze([ROLES.KING, ROLES.QUEEN, ROLES.DETECTIVE, ROLES.THIEF]);

export const PLAYER_COUNT = 4;

export const SCORING = Object.freeze({
  [ROLES.KING]: 1000,
  [ROLES.QUEEN]: 800,
  [ROLES.DETECTIVE_CORRECT]: 500,
  [ROLES.DETECTIVE_WRONG]: 0,
  [ROLES.THIEF_CAUGHT]: 0,
  [ROLES.THIEF_ESCAPED]: 1000,
});

export const ROLE_META = Object.freeze({
  [ROLES.KING]: {
    id: ROLES.KING,
    name: 'King',
    tagline: 'The royal ruler',
    description: 'You sit on the throne. Your crown is heavy and your reign is secure — for now. You earn a fixed reward simply for completing the round.',
    color: 'king',
    icon: 'crown',
    pointsLabel: '1000 points every completed round',
  },
  [ROLES.QUEEN]: {
    id: ROLES.QUEEN,
    name: 'Queen',
    tagline: 'The royal companion',
    description: 'You share the throne. Your elegance earns you a strong, steady reward — but the spotlight is not yours alone.',
    color: 'queen',
    icon: 'queen-crown',
    pointsLabel: '800 points every completed round',
  },
  [ROLES.DETECTIVE]: {
    id: ROLES.DETECTIVE,
    name: 'Detective',
    tagline: 'The investigator',
    description: 'You must identify the Cheat. Choose carefully — a correct accusation earns you glory. A wrong one lets the Cheat escape.',
    color: 'detective',
    icon: 'policeBadge',
    pointsLabel: '500 points if you catch the Cheat, 0 otherwise',
  },
  [ROLES.THIEF]: {
    id: ROLES.THIEF,
    name: 'Cheat',
    tagline: 'The undercover bluffer',
    description: 'You are the Cheat. Keep a straight face, blend in, and dodge the Detective. A wrong guess means you escape with the grand prize.',
    color: 'thief',
    icon: 'mask',
    pointsLabel: '1000 points if you fool the Detective, 0 if caught',
  },
});

export const GAME_PHASES = Object.freeze({
  HOME: 'HOME',
  PLAYER_SETUP: 'PLAYER_SETUP',
  ROUND_INTRO: 'ROUND_INTRO',
  ROLE_HANDOFF: 'ROLE_HANDOFF',
  ROLE_REVEAL: 'ROLE_REVEAL',
  DETECTIVE_HANDOFF: 'DETECTIVE_HANDOFF',
  GUESS_SELECTION: 'GUESS_SELECTION',
  GUESS_CONFIRMATION: 'GUESS_CONFIRMATION',
  RESULT_REVEAL: 'RESULT_REVEAL',
  SCOREBOARD: 'SCOREBOARD',
  NEXT_ROUND: 'NEXT_ROUND',
  HOW_TO_PLAY: 'HOW_TO_PLAY',
  SETTINGS: 'SETTINGS',
  GAME_OVER: 'GAME_OVER',
  MULTIPLAYER: 'MULTIPLAYER',
  BACHPAN: 'BACHPAN',
});

export const STATE_TRANSITIONS = Object.freeze({
  [GAME_PHASES.HOME]: [GAME_PHASES.PLAYER_SETUP, GAME_PHASES.HOW_TO_PLAY, GAME_PHASES.SETTINGS, GAME_PHASES.MULTIPLAYER, GAME_PHASES.BACHPAN],
  [GAME_PHASES.MULTIPLAYER]: [GAME_PHASES.HOME],
  [GAME_PHASES.BACHPAN]: [GAME_PHASES.HOME],
  [GAME_PHASES.PLAYER_SETUP]: [GAME_PHASES.HOME, GAME_PHASES.ROUND_INTRO],
  [GAME_PHASES.ROUND_INTRO]: [GAME_PHASES.ROLE_HANDOFF, GAME_PHASES.SCOREBOARD],
  [GAME_PHASES.ROLE_HANDOFF]: [GAME_PHASES.ROLE_REVEAL],
  [GAME_PHASES.ROLE_REVEAL]: [GAME_PHASES.ROLE_HANDOFF, GAME_PHASES.DETECTIVE_HANDOFF],
  [GAME_PHASES.DETECTIVE_HANDOFF]: [GAME_PHASES.GUESS_SELECTION],
  [GAME_PHASES.GUESS_SELECTION]: [GAME_PHASES.GUESS_CONFIRMATION, GAME_PHASES.DETECTIVE_HANDOFF],
  [GAME_PHASES.GUESS_CONFIRMATION]: [GAME_PHASES.GUESS_SELECTION, GAME_PHASES.RESULT_REVEAL],
  [GAME_PHASES.RESULT_REVEAL]: [GAME_PHASES.SCOREBOARD],
  [GAME_PHASES.SCOREBOARD]: [GAME_PHASES.ROUND_INTRO, GAME_PHASES.HOME, GAME_PHASES.GAME_OVER],
  [GAME_PHASES.NEXT_ROUND]: [GAME_PHASES.ROUND_INTRO, GAME_PHASES.SCOREBOARD],
  [GAME_PHASES.HOW_TO_PLAY]: [GAME_PHASES.HOME],
  [GAME_PHASES.SETTINGS]: [GAME_PHASES.HOME],
  [GAME_PHASES.GAME_OVER]: [GAME_PHASES.HOME, GAME_PHASES.PLAYER_SETUP],
});

export const DEFAULT_MATCH_ROUNDS = 5;

export const AVATAR_IDS = Object.freeze(['knight', 'sorceress', 'rogue', 'sage', 'jester', 'guard', 'noble', 'wanderer']);

export const AVATAR_COLORS = Object.freeze([
  { id: 'gold', hex: '#d4a017' },
  { id: 'rose', hex: '#e91e63' },
  { id: 'sapphire', hex: '#2196f3' },
  { id: 'emerald', hex: '#43a047' },
  { id: 'amethyst', hex: '#9c27b0' },
  { id: 'ember', hex: '#ff5722' },
]);

export const STORAGE_KEYS = Object.freeze({
  SETTINGS: 'chitplay.settings.v1',
  MATCH: 'chitplay.match.v1',
  STATS: 'chitplay.stats.v1',
  PLAYERS: 'chitplay.players.v1',
});

export const STORAGE_VERSION = 1;

export const ANIMATION_SKIP_KEY = 'chitplay.settings.animations';