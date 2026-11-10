/**
 * The player's profile, kept on this device only: name, gender, character,
 * points (solo and Nearby apart), rank, badges, best matches and pinned games.
 */
import { randomName, cleanName, isValidName, detectNameRegion } from '../world/names.js?v=20261110-1207';
import { cleanLook, PRESETS, FANCY_HATS, PREMIUM_COLORS } from '../world/character-looks.js?v=20261110-1207';
import { SPECIAL_EMOJIS } from '../world/table-talk.js?v=20261110-1207';

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

/* ─── Coins: earned by playing, spent on hats and colours. They are only for fun and have no value. ─── */
export const COINS = { match: 10, per: 200, win: 20, online: 10, rankUp: 100 };

/** Daily challenges: three a day, the same three for everybody that day. */
export const CHALLENGES = [
  { id: 'catch2', key: 'catches', n: 2, coins: 60 },
  { id: 'catch3', key: 'catches', n: 3, coins: 90 },
  { id: 'escape1', key: 'escapes', n: 1, coins: 50 },
  { id: 'escape2', key: 'escapes', n: 2, coins: 80 },
  { id: 'win1', key: 'wins', n: 1, coins: 70 },
  { id: 'win2', key: 'wins', n: 2, coins: 110 },
  { id: 'play2', key: 'matches', n: 2, coins: 40 },
  { id: 'play3', key: 'matches', n: 3, coins: 60 },
  { id: 'online1', key: 'online', n: 1, coins: 100 },
  { id: 'score5k', key: 'bigScore', n: 1, coins: 80 },
  { id: 'emoji3', key: 'emojis', n: 3, coins: 30 },
  { id: 'honest1', key: 'honestWins', n: 1, coins: 80 },
];
export const DAILY_BONUS = 50;
/** Coming back every day: day 1 to day 7, then it starts again. A full week also unlocks 🌈. */
export const LOGIN_REWARDS = [20, 30, 40, 50, 60, 80, 150];

/** A small seeded random generator: the day number picks the same challenges on every phone. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** The three challenges of a day: always three different kinds. */
export function challengesFor(day) {
  const rnd = seeded(Math.imul(day, 2654435761));
  const pool = CHALLENGES.slice();
  const picked = [];
  while (picked.length < 3 && pool.length) {
    const c = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    if (!picked.some(x => x.key === c.key)) picked.push(c);
  }
  return picked;
}
/** Weeks start on Monday (day 0 of the epoch was a Thursday). */
export const weekNumber = (day) => Math.floor((day + 3) / 7);

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
    coins: 0, owned: [], daily: null, week: null, rivals: null, login: null,
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
        coins: Number.isFinite(s.coins) && s.coins >= 0 ? Math.floor(s.coins) : 0,
        owned: Array.isArray(s.owned) ? s.owned.filter(x => typeof x === 'string') : [],
        daily: s.daily && typeof s.daily === 'object' ? s.daily : null,
        week: s.week && typeof s.week === 'object' ? s.week : null,
        rivals: s.rivals && typeof s.rivals === 'object' && Array.isArray(s.rivals.list) ? s.rivals : null,
        login: s.login && typeof s.login === 'object' ? s.login : null,
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

/** Today's challenges with progress (a new day starts a fresh set). */
function dailyState(p) {
  const day = dayNumber();
  if (!p.daily || p.daily.day !== day) p.daily = { day, progress: {}, claimed: [], bonus: false };
  return p.daily;
}
/** Adds progress to today's challenges; finished ones pay their coins at once. */
function progressDaily(p, deltas) {
  const d = dailyState(p);
  const completed = [];
  let coins = 0;
  for (const [key, n] of Object.entries(deltas)) if (n > 0) d.progress[key] = (d.progress[key] || 0) + n;
  for (const c of challengesFor(d.day)) {
    if (!d.claimed.includes(c.id) && (d.progress[c.key] || 0) >= c.n) {
      d.claimed.push(c.id);
      completed.push(c);
      coins += c.coins;
    }
  }
  let bonus = 0;
  if (!d.bonus && d.claimed.length >= 3) { d.bonus = true; bonus = DAILY_BONUS; coins += bonus; }
  p.coins += coins;
  return { completed, coins, bonus };
}
function weekState(p) {
  const id = weekNumber(dayNumber());
  if (!p.week || p.week.id !== id) p.week = { id, points: 0, matches: 0 };
  if (!p.rivals || p.rivals.week !== id) p.rivals = { week: id, list: [] };
  return p.week;
}
const hatOf = (id) => FANCY_HATS.find(h => h.id === id);
const emojiOf = (id) => SPECIAL_EMOJIS.find(e => e.id === id || e.symbol === id);
const loginState = (p) => (p.login ||= { last: 0, streak: 0, weeks: 0 });
/** What others see next to your name: your rank's icon, or your newest badge, or nothing yet. */
export const FLAIRS = new Set([...RANKS.map(r => r.icon), ...BADGES.map(b => b.icon)]);
const colourOf = (id) => PREMIUM_COLORS.find(c => c.id === id);

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
  get coins() { return load().coins; },
  /** Coins for an achievement. Coins can't be bought and have no value outside the game. */
  /** Spend coins (on a second chance, a room decoration…). False if there aren't enough. */
  spend(n) { const p = load(); n = Math.max(0, Math.floor(n) || 0); if (p.coins < n) return false; p.coins -= n; save(); return true; },
  addCoins(n) { const p = load(); p.coins += Math.max(0, Math.floor(n) || 0); save(); },

  /** A special hat, colour or emoji you have: bought, or earned with your rank, a badge or a week of visits. */
  owns(id) {
    const p = load();
    if (p.owned.includes(id)) return true;
    const rank = rankFor(allStats(p).points).index;
    const hat = hatOf(id);
    if (hat) return hat.rank != null && rank >= hat.rank;
    const e = emojiOf(id);
    if (!e) return false;
    if (e.rank != null) return rank >= e.rank;
    if (e.badge) return p.badges.includes(e.badge);
    if (e.login) return loginState(p).weeks >= 1;
    return false;
  },
  get flair() {
    const p = load();
    const rank = rankFor(allStats(p).points);
    if (rank.index >= 1) return rank.icon;
    const last = p.badges[p.badges.length - 1];
    return BADGES.find(b => b.id === last)?.icon || '';
  },
  /** Today's visit reward: which day of the week it is and whether it's taken. */
  get login() {
    const p = load();
    const l = loginState(p);
    const today = dayNumber();
    const claimed = l.last === today;
    const day = claimed ? l.streak : (l.last === today - 1 ? (l.streak % 7) + 1 : 1);
    return { day, claimed, coins: LOGIN_REWARDS[day - 1], rewards: LOGIN_REWARDS.slice(), weeks: l.weeks };
  },
  /** Take today's visit reward (once a day). Returns what you got, or null if it was taken already. */
  claimLogin() {
    const p = load();
    const l = loginState(p);
    const today = dayNumber();
    if (l.last === today) return null;
    l.streak = l.last === today - 1 ? (l.streak % 7) + 1 : 1;
    l.last = today;
    const coins = LOGIN_REWARDS[l.streak - 1];
    p.coins += coins;
    let rainbow = false;
    if (l.streak === 7) { l.weeks += 1; rainbow = l.weeks === 1; }
    save();
    return { day: l.streak, coins, rainbow };
  },
  /** Spend coins on a hat or colour. false if it's owned already or you can't afford it. */
  buy(id) {
    const p = load();
    const item = hatOf(id) || colourOf(id) || emojiOf(id);
    if (!item || item.price == null || profile.owns(id) || p.coins < item.price) return false;
    p.coins -= item.price;
    p.owned.push(item.id || id);
    save();
    return true;
  },
  /** Today's three challenges, how far you are, and how long until new ones. */
  get daily() {
    const p = load();
    const d = dailyState(p);
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return {
      items: challengesFor(d.day).map(c => ({ ...c, progress: Math.min(c.n, d.progress[c.key] || 0), done: d.claimed.includes(c.id) })),
      bonus: d.bonus, bonusCoins: DAILY_BONUS, endsIn: midnight - now,
    };
  },
  /** Something that counts for a challenge outside a match (sending an emoji). */
  track(key, n = 1) {
    const p = load();
    const r = progressDaily(p, { [key]: n });
    save();
    return r;
  },
  /** This week: your points, and the people you played online or Nearby with (their points this week). */
  get week() {
    const p = load();
    const w = weekState(p);
    return { points: w.points, matches: w.matches, rivals: p.rivals.list.slice().sort((a, b) => b.points - a.points).slice(0, 20) };
  },
  noteRivals(list) {
    const p = load();
    weekState(p);
    const mine = p.name.toLowerCase();
    for (const r of list || []) {
      const name = cleanName(String(r?.name || '')).trim().slice(0, 16);
      const points = Number.isFinite(r?.weekly) ? Math.max(0, Math.min(10000000, Math.floor(r.weekly))) : null;
      if (!name || points == null || name.toLowerCase() === mine) continue;
      const old = p.rivals.list.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (old) { old.points = Math.max(old.points, points); old.at = Date.now(); } else p.rivals.list.push({ name, points, at: Date.now() });
    }
    p.rivals.list = p.rivals.list.sort((a, b) => b.at - a.at).slice(0, 40);
    save();
  },

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
  recordMatch({ mode = 'local', won, score, catches = 0, escapes = 0, cheats = 0, caught = 0, game, rounds, online = false }) {
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
    // coins: for playing, for a good score, for winning, for playing online, for each new rank
    const rankUps = Math.max(0, after.index - before.index);
    let coinsEarned = COINS.match + Math.floor(gained / COINS.per) + (won ? COINS.win : 0) + (online ? COINS.online : 0) + rankUps * COINS.rankUp;
    p.coins += coinsEarned;
    const unlocked = FANCY_HATS.filter(h => h.rank != null && h.rank > before.index && h.rank <= after.index);
    const week = weekState(p);
    week.points += gained;
    week.matches += 1;
    const daily = progressDaily(p, {
      matches: 1, wins: won ? 1 : 0, catches, escapes, online: online ? 1 : 0,
      bigScore: score >= 5000 ? 1 : 0, honestWins: won && cheats === 0 ? 1 : 0,
    });
    coinsEarned += daily.coins;
    save();
    return {
      gained, before, after, rankedUp: after.index > before.index, newBadges, place: place >= 0 ? place + 1 : null, streak: p.streak,
      coinsEarned, coins: p.coins, challenges: daily.completed, dailyBonus: daily.bonus, unlocked,
    };
  },

  /** Reset score: points, rank, badges and best matches go; name and character stay. */
  resetScore() {
    const p = load();
    p.stats = { local: emptyStats(), nearby: emptyStats() };
    p.badges = []; p.hall = []; p.games = {}; p.streak = 0; p.lastDay = 0;
    // coins and what you bought stay; the week's points start again
    p.week = null;
    save();
    try { localStorage.removeItem(OLD_STATS_KEY); } catch { /* fine */ }
  },
};
