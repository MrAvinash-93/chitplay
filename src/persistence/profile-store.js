/**
 * The player's profile, kept on this device only: name, gender, character,
 * points (solo and Nearby apart), rank, badges, best matches and pinned games.
 */
import { randomName, cleanName, isValidName, detectNameRegion } from '../world/names.js?v=20261107-2046';
import { cleanLook, PRESETS } from '../world/character-looks.js?v=20261107-2046';

const KEY = 'chitplay.profile.v1';
const OLD_STATS_KEY = 'chitplay.stats.v1';
const emptyStats = () => ({ points: 0, matches: 0, wins: 0, best: 0, catches: 0, escapes: 0, cheats: 0, caught: 0 });

/** Rank titles run on lifetime points, from the back bench up. */
export const RANKS = [
  { at: 0, title: 'New in Class', icon: '🎒' },
  { at: 1500, title: 'Back Bencher', icon: '🪑' },
  { at: 5000, title: 'Chit Folder', icon: '📝' },
  { at: 10000, title: 'Homework Copier', icon: '📚' },
  { at: 18000, title: 'Class Monitor', icon: '📋' },
  { at: 30000, title: 'Sharp Eye', icon: '🕵️' },
  { at: 50000, title: 'Master Bluffer', icon: '🎭' },
  { at: 80000, title: 'School Captain', icon: '🎖️' },
  { at: 125000, title: 'Neighbourhood Legend', icon: '🏅' },
  { at: 200000, title: 'Chit Emperor', icon: '👑' },
];

export const BADGES = [
  { id: 'first-match', icon: '🎬', name: 'First Match', hint: 'Finish a match', test: (s) => s.all.matches >= 1 },
  { id: 'first-win', icon: '🏆', name: 'First Win', hint: 'Win a match', test: (s) => s.all.wins >= 1 },
  { id: 'ten-wins', icon: '🥇', name: 'Ten Wins', hint: 'Win 10 matches', test: (s) => s.all.wins >= 10 },
  { id: 'detective', icon: '🕵️', name: 'Detective', hint: 'Catch 25 thieves', test: (s) => s.all.catches >= 25 },
  { id: 'escape-artist', icon: '🦊', name: 'Escape Artist', hint: 'Get away 25 times', test: (s) => s.all.escapes >= 25 },
  { id: 'sneaky', icon: '🤫', name: 'Sneaky', hint: 'Try to cheat 20 times', test: (s) => s.all.cheats >= 20 },
  { id: 'red-handed', icon: '🚨', name: 'Red-Handed', hint: 'Get caught cheating 10 times', test: (s) => s.all.caught >= 10 },
  { id: 'honest', icon: '😇', name: 'Honest Player', hint: 'Win without cheating', test: (s) => s.last?.won && s.last.cheats === 0 },
  { id: 'friends', icon: '📶', name: 'With Friends', hint: 'Finish a Nearby match', test: (s) => s.nearby.matches >= 1 },
  { id: 'big-score', icon: '💰', name: 'Big Score', hint: 'Score 8000 in one match', test: (s) => s.all.best >= 8000 },
  { id: 'streak-3', icon: '🔥', name: 'Three-Day Habit', hint: 'Play 3 days in a row', test: (s) => s.streak >= 3 },
  { id: 'streak-7', icon: '🌟', name: 'Full School Week', hint: 'Play 7 days in a row', test: (s) => s.streak >= 7 },
  { id: 'world-tour', icon: '🌍', name: 'World Tour', hint: 'Play 5 different games', test: (s) => s.gamesPlayed >= 5 },
];

let data = null;

const dayNumber = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);

function firstRun() {
  const gender = Math.random() < 0.5 ? 'm' : 'f';
  const pool = PRESETS.filter(p => p.gender === gender && p.age !== 'child');
  const look = pool[Math.floor(Math.random() * pool.length)];
  const p = {
    v: 1, name: randomName(gender, detectNameRegion()), gender, look: cleanLook(look, look.id),
    stats: { local: emptyStats(), nearby: emptyStats() },
    badges: [], hall: [], pins: [], games: {}, streak: 0, lastDay: 0,
  };
  // scores from before profiles existed stay with the player
  try {
    const old = JSON.parse(localStorage.getItem(OLD_STATS_KEY));
    if (old && Number.isFinite(old.matches)) {
      Object.assign(p.stats.local, {
        matches: old.matches, wins: old.wins || 0, catches: old.catches || 0, escapes: old.escapes || 0,
        best: old.best || 0, points: Math.max(0, (old.best || 0) * (old.matches ? 1 : 0)),
      });
      p.games = old.games || {};
    }
  } catch { /* nothing to keep */ }
  // a name someone chose themselves survives; the old default "Avin" does not
  try {
    const raw = localStorage.getItem('chitplay.settings.v1');
    const saved = raw && JSON.parse(raw);
    const n = cleanName(saved?.playerName ?? saved?.data?.playerName).trim();
    if (n && n !== 'Avin' && isValidName(n)) p.name = n;
  } catch { /* nothing to keep */ }
  return p;
}

function load() {
  if (data) return data;
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s?.v === 1 && isValidName(s.name) && s.stats?.local && s.stats?.nearby) {
      data = {
        ...s, gender: s.gender === 'f' ? 'f' : 'm', look: cleanLook(s.look, s.look?.id),
        badges: Array.isArray(s.badges) ? s.badges : [], hall: Array.isArray(s.hall) ? s.hall : [],
        pins: Array.isArray(s.pins) ? s.pins : [], games: s.games || {},
      };
      return data;
    }
  } catch { /* unreadable: start fresh */ }
  data = firstRun();
  save();
  return data;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage blocked: lasts this visit */ } }

export const rankFor = (points) => {
  let i = 0;
  while (i + 1 < RANKS.length && points >= RANKS[i + 1].at) i++;
  const rank = RANKS[i], next = RANKS[i + 1] || null;
  return { ...rank, index: i, next, progress: next ? (points - rank.at) / (next.at - rank.at) : 1 };
};

function allStats(p) {
  const a = p.stats.local, b = p.stats.nearby;
  return {
    points: a.points + b.points, matches: a.matches + b.matches, wins: a.wins + b.wins, best: Math.max(a.best, b.best),
    catches: a.catches + b.catches, escapes: a.escapes + b.escapes, cheats: a.cheats + b.cheats, caught: a.caught + b.caught,
  };
}

export const profile = {
  get name() { return load().name; },
  get gender() { return load().gender; },
  get look() { return { ...load().look, gender: load().gender }; },
  get stats() { return load().stats; },
  get all() { return allStats(load()); },
  get badges() { return load().badges.slice(); },
  get hall() { return load().hall.slice(); },
  get pins() { return load().pins.slice(); },
  get streak() { return load().streak; },
  get rank() { return rankFor(allStats(load()).points); },

  /** Saves only a valid name; the screen shows what was kept. */
  setName(raw) {
    const n = cleanName(raw).trim();
    if (!n || !isValidName(n)) return false;
    load().name = n;
    save();
    return true;
  },
  setGender(g) { const p = load(); p.gender = g === 'f' ? 'f' : 'm'; p.look.gender = p.gender; save(); },
  setLook(look) { const p = load(); p.look = cleanLook({ ...look, gender: p.gender }, look?.id); save(); return p.look; },

  /** ⭐ a game: pinned games come first in the Indoor Games row. */
  isPinned(id) { return load().pins.includes(id); },
  pin(id) { const p = load(); if (!p.pins.includes(id)) { p.pins.unshift(id); save(); } },
  unpin(id) { const p = load(); p.pins = p.pins.filter(x => x !== id); save(); },
  togglePin(id) { if (profile.isPinned(id)) profile.unpin(id); else profile.pin(id); return profile.isPinned(id); },

  /**
   * After a finished match. Points only ever add up: a bad match can't lower a rank.
   * @returns {{ gained:number, before:object, after:object, rankedUp:boolean, newBadges:object[], place:number|null, streak:number }}
   */
  recordMatch({ mode = 'local', won, score, catches = 0, escapes = 0, cheats = 0, caught = 0, game, rounds }) {
    const p = load();
    const s = p.stats[mode === 'nearby' ? 'nearby' : 'local'];
    const before = rankFor(allStats(p).points);
    const gained = Math.max(0, score);
    s.points += gained; s.matches++; if (won) s.wins++;
    s.best = Math.max(s.best, score);
    s.catches += catches; s.escapes += escapes; s.cheats += cheats; s.caught += caught;
    if (game) p.games[game] = (p.games[game] || 0) + 1;
    // one play a day keeps the streak alive
    const today = dayNumber();
    if (p.lastDay !== today) { p.streak = p.lastDay === today - 1 ? p.streak + 1 : 1; p.lastDay = today; }
    // the device's own hall of fame: best 10 matches
    const entry = { score, game, rounds, won: !!won, at: Date.now(), mode: mode === 'nearby' ? 'nearby' : 'local' };
    p.hall = [...p.hall, entry].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 10);
    const place = p.hall.indexOf(entry);
    const view = {
      all: allStats(p), nearby: p.stats.nearby, streak: p.streak,
      gamesPlayed: Object.keys(p.games).length, last: { won, cheats },
    };
    const newBadges = BADGES.filter(b => !p.badges.includes(b.id) && b.test(view));
    newBadges.forEach(b => p.badges.push(b.id));
    save();
    const after = rankFor(view.all.points);
    return { gained, before, after, rankedUp: after.index > before.index, newBadges, place: place >= 0 ? place + 1 : null, streak: p.streak };
  },

  /** Reset score: points, rank, badges and best matches go; name and character stay. */
  resetScore() {
    const p = load();
    p.stats = { local: emptyStats(), nearby: emptyStats() };
    p.badges = []; p.hall = []; p.games = {}; p.streak = 0; p.lastDay = 0;
    save();
    try { localStorage.removeItem(OLD_STATS_KEY); } catch { /* fine */ }
  },
};
