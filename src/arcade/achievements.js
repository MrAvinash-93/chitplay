/**
 * What a player has done: achievements, best scores and the rank they're working towards. Everything
 * stays on this device. Coins and rank points come from the same profile as the rest of the game,
 * so playing anything moves you up the same ladder. Nothing here is bought or has any real value.
 */
import { profile, RANKS } from '../persistence/profile-store.js?v=20261110-1504';

const KEY = 'chitplay.achievements';
// games that were renamed keep their scores under the new name
const MOVED = { 'knife-throw': 'pin-spin' };
const carry = (a) => {
  for (const [from, to] of Object.entries(MOVED)) {
    for (const k of ['plays', 'wins', 'best']) {
      if (a[k]?.[from] == null) continue;
      a[k][to] = k === 'best' ? Math.max(a[k][to] || 0, a[k][from]) : (a[k][to] || 0) + a[k][from];
      delete a[k][from];
    }
  }
  return a;
};
const load = () => {
  try { return carry({ done: [], plays: {}, wins: {}, best: {}, ...JSON.parse(localStorage.getItem(KEY)) }); } catch { return { done: [], plays: {}, wins: {}, best: {} }; }
};
const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} };
const sum = (o) => Object.values(o).reduce((x, y) => x + y, 0);

/**
 * Four tiers. Bronze comes with playing; Legend takes real skill or months of visits.
 * coins: the reward. test(a): has it been done yet?
 */
export const TIERS = { bronze: { name: 'Bronze', color: '#cd7f32' }, silver: { name: 'Silver', color: '#cfd8e3' }, gold: { name: 'Gold', color: '#ffd23f' }, legend: { name: 'Legend', color: '#c77dff' } };
const sumOf = (o) => Object.values(o).reduce((x, y) => x + y, 0);
export const ACHIEVEMENTS = [
  { id: 'chit-15', tier: 'bronze', icon: '📨', name: 'Paper Wings', hint: 'Score 50 in Flying Chit', coins: 40, test: a => a.best['flying-chit'] >= 50 },
  { id: 'chit-120', tier: 'silver', icon: '✈️', name: 'Bangle Chaser', hint: 'Score 200 in Flying Chit', coins: 120, test: a => a.best['flying-chit'] >= 200 },
  { id: 'chit-250', tier: 'gold', icon: '🌤️', name: 'Sky Above the School', hint: 'Score 500 in Flying Chit', coins: 300, test: a => a.best['flying-chit'] >= 500 },
  { id: 'chit-500', tier: 'legend', icon: '👑', name: 'Chit of Legend', hint: 'Score 1000 in Flying Chit', coins: 1000, test: a => a.best['flying-chit'] >= 1000 },
  { id: 'tunnel-150', tier: 'silver', icon: '🌀', name: 'Into the Spiral', hint: 'Score 150 in Tunnel Race', coins: 120, test: a => a.best['tunnel-race'] >= 150 },
  { id: 'tunnel-600', tier: 'legend', icon: '⚡', name: 'Light Speed', hint: 'Score 600 in Tunnel Race', coins: 1000, test: a => a.best['tunnel-race'] >= 600 },
  { id: 'road-400', tier: 'gold', icon: '🛺', name: 'King of the Road', hint: 'Score 400 in Road Dash', coins: 300, test: a => a.best['road-dash'] >= 400 },
  { id: 'snake-50', tier: 'gold', icon: '🐍', name: 'Very Long Snake', hint: 'Score 50 in Hungry Snake', coins: 300, test: a => a.best['hungry-snake'] >= 50 },
  { id: 'knife-10', tier: 'silver', icon: '📌', name: 'Steady Hand', hint: 'Score 60 in Pin Spin', coins: 150, test: a => a.best['pin-spin'] >= 60 },
  { id: 'knife-250', tier: 'legend', icon: '🏅', name: 'Pin Master', hint: 'Score 250 in Pin Spin', coins: 1000, test: a => a.best['pin-spin'] >= 250 },
  { id: 'hoop-50', tier: 'silver', icon: '🏀', name: 'Soft Touch', hint: 'Score 50 in Hoop Flick', coins: 150, test: a => a.best['hoop-flick'] >= 50 },
  { id: 'hoop-200', tier: 'legend', icon: '🔥', name: 'Nothing but Net', hint: 'Score 200 in Hoop Flick', coins: 1000, test: a => a.best['hoop-flick'] >= 200 },
  { id: 'ghost-5', tier: 'silver', icon: '👻', name: 'Night Owl', hint: 'Last till sunrise 5 times in Ghost Hostel', coins: 200, test: a => a.wins['ghost-hostel'] >= 5 },
  { id: 'ghost-2000', tier: 'gold', icon: '🌅', name: 'Hostel Tycoon', hint: 'Score 2000 in Ghost Hostel', coins: 400, test: a => a.best['ghost-hostel'] >= 2000 },
  { id: 'wolf-10', tier: 'silver', icon: '🐺', name: 'Full Moon', hint: 'Win 10 games of Werewolf Night', coins: 200, test: a => a.wins.werewolf >= 10 },
  { id: 'bull-10', tier: 'silver', icon: '🐂', name: 'Ring Champion', hint: 'Win 10 Bull Fights', coins: 200, test: a => a.wins['bull-fight'] >= 10 },
  { id: 'ship-10', tier: 'silver', icon: '⚓', name: 'Admiral', hint: 'Win 10 Ship Fights', coins: 200, test: a => a.wins['ship-fight'] >= 10 },
  { id: 'rally-10', tier: 'silver', icon: '🎾', name: 'Backyard Star', hint: 'Win 10 Backyard Rallies', coins: 200, test: a => a.wins['backyard-rally'] >= 10 },
  { id: 'ludo-caps-10', tier: 'bronze', icon: '⚔️', name: 'Token Hunter', hint: 'Capture 10 tokens in Ludo', coins: 60, test: a => stat(a, 'ludo', 'caps') >= 10 },
  { id: 'ludo-caps-100', tier: 'gold', icon: '🗡️', name: 'Nobody Is Safe', hint: 'Capture 100 tokens in Ludo', coins: 400, test: a => stat(a, 'ludo', 'caps') >= 100 },
  { id: 'ludo-sixes-50', tier: 'silver', icon: '🎲', name: 'Lucky Hand', hint: 'Roll 50 sixes in Ludo', coins: 150, test: a => stat(a, 'ludo', 'sixes') >= 50 },
  { id: 'ludo-home-40', tier: 'silver', icon: '🏠', name: 'Homecoming', hint: 'Bring 40 tokens home in Ludo', coins: 200, test: a => stat(a, 'ludo', 'home') >= 40 },
  { id: 'ludo-10', tier: 'silver', icon: '🎲', name: 'Ludo Regular', hint: 'Win 10 games of Ludo', coins: 200, test: a => a.wins.ludo >= 10 },
  { id: 'ludo-50', tier: 'legend', icon: '🏰', name: 'Ludo Maharaja', hint: 'Win 50 games of Ludo', coins: 1000, test: a => a.wins.ludo >= 50 },
  { id: 'chess-5', tier: 'gold', icon: '♟️', name: 'Grandmaster of the Lane', hint: 'Win 5 games of Chess', coins: 300, test: a => a.wins.chess >= 5 },
  { id: 'carrom-10', tier: 'gold', icon: '🎯', name: 'Striker Supreme', hint: 'Win 10 games of Carrom', coins: 300, test: a => a.wins.carrom >= 10 },
  { id: 'cards-10', tier: 'silver', icon: '♠️', name: 'Card Sharp', hint: 'Win 10 card games', coins: 200, test: a => (a.wins['call-break'] || 0) + (a.wins['crazy-eights'] || 0) >= 10 },
  { id: 'taster', tier: 'bronze', icon: '🍱', name: 'Taster', hint: 'Play 6 different games', coins: 60, test: a => Object.keys(a.plays).length >= 6 },
  { id: 'explorer', tier: 'gold', icon: '🧭', name: 'Explorer', hint: 'Play 20 different games', coins: 400, test: a => Object.keys(a.plays).length >= 20 },
  { id: 'games-50', tier: 'silver', icon: '🎮', name: 'Regular', hint: 'Finish 50 games', coins: 200, test: a => sumOf(a.plays) >= 50 },
  { id: 'games-250', tier: 'gold', icon: '🕹️', name: 'Living Room Legend', hint: 'Finish 250 games', coins: 600, test: a => sumOf(a.plays) >= 250 },
  { id: 'games-1000', tier: 'legend', icon: '🏆', name: 'Hall of Fame', hint: 'Finish 1000 games', coins: 2500, test: a => sumOf(a.plays) >= 1000 },
  { id: 'wins-25', tier: 'silver', icon: '🥇', name: 'Winner', hint: 'Win 25 games', coins: 250, test: a => sumOf(a.wins) >= 25 },
  { id: 'wins-200', tier: 'legend', icon: '💎', name: 'Unbeatable', hint: 'Win 200 games', coins: 2000, test: a => sumOf(a.wins) >= 200 },
  { id: 'streak-7', tier: 'gold', icon: '🌟', name: 'A Whole Week', hint: 'Play 7 days in a row', coins: 400, test: () => profile.streak >= 7 },
  { id: 'streak-30', tier: 'legend', icon: '🔥', name: 'A Whole Month', hint: 'Play 30 days in a row', coins: 3000, test: () => profile.streak >= 30 },
];

/* ─── popups: one at a time, each with its moment ─── */
const queue = [];
let showing = false;
// while a game is being played nothing pops up over it: unlocks wait for the end of the game
let held = false;
export function holdPopups(on) {
  held = !!on;
  if (!held) setTimeout(nextPopup, 900);
}
function nextPopup() {
  if (showing || held || !queue.length) return;
  showing = true;
  const { icon, title, sub, tier } = queue.shift();
  const box = document.createElement('div');
  box.className = `unlock unlock--${tier || 'plain'}`;
  if (tier && TIERS[tier]) box.style.setProperty('--tier', TIERS[tier].color);
  // a burst of sparks behind it
  for (let i = 0; i < 18; i++) { const sp = document.createElement('i'); sp.className = 'unlock__spark'; sp.style.setProperty('--a', `${i * 20}deg`); sp.style.setProperty('--d', `${60 + (i % 3) * 24}px`); box.append(sp); }
  box.setAttribute('role', 'status');
  const i = document.createElement('span'); i.className = 'unlock__icon'; i.textContent = icon;
  const text = document.createElement('span'); text.className = 'unlock__text';
  const t = document.createElement('strong'); t.textContent = title;
  const s = document.createElement('small'); s.textContent = sub;
  text.append(t, s);
  box.append(i, text);
  document.body.append(box);
  navigator.vibrate?.([30, 40, 30]);
  popupSound?.(tier ? (tier === 'rank' ? 'rankup' : 'achieve') : 'reveal');
  setTimeout(() => { box.remove(); showing = false; nextPopup(); }, tier ? 3600 : 2900);
}
let popupSound = null;
export const onPopup = (fn) => { popupSound = fn; };
export function popup(icon, title, sub = '', tier = '') { queue.push({ icon, title, sub, tier }); nextPopup(); }

/** Anything newly earned: popups and coins. Safe to call at any time. */
export function checkUnlocks(a = load()) {
  const fresh = ACHIEVEMENTS.filter(x => !a.done.includes(x.id) && x.test(a));
  if (!fresh.length) return [];
  fresh.forEach((x) => {
    a.done.push(x.id);
    profile.addCoins(x.coins);
    popup(x.icon, `${TIERS[x.tier].name} achievement: ${x.name}!`, `${x.hint} · +${x.coins} coins`, x.tier);
  });
  save(a);
  return fresh;
}
export const achievementList = () => { const a = load(); return ACHIEVEMENTS.map(x => ({ ...x, done: a.done.includes(x.id) })); };
export const bestOf = (slug) => load().best[slug] || 0;
/** Count something that happened mid-game (a capture, a six…), and unlock what it earns straight away. */
export function bump(slug, key, n = 1) {
  const a = load();
  a.stats = a.stats || {};
  a.stats[slug] = a.stats[slug] || {};
  a.stats[slug][key] = (a.stats[slug][key] || 0) + n;
  save(a);
  checkUnlocks(a);
}
const stat = (a, slug, key) => a.stats?.[slug]?.[key] || 0;
/** How often each game was played and won, and the best scores. */
export const playStats = () => { const a = load(); return { plays: a.plays, wins: a.wins, best: a.best }; };

/** A game has finished for this player. Counts it, rewards it, and returns what to show them. */
export function gameFinished({ slug, won, score = 0, endless = false, mode = 'local', online = false }) {
  const a = load();
  a.plays[slug] = (a.plays[slug] || 0) + 1;
  if (won) a.wins[slug] = (a.wins[slug] || 0) + 1;
  const before = a.best[slug] || 0;
  const newBest = endless && score > before;
  if (score > before) a.best[slug] = score;
  save(a);
  let out = null;
  try { out = profile.recordMatch({ mode, won, score: endless ? Math.min(900, 60 + score * 14) : (won ? 600 : 200), game: slug, rounds: 1, online }); } catch {}
  if (out?.rankedUp) popup(out.after.icon, `New rank: ${out.after.title}!`, `+${out.gained} rank points`, 'rank');
  out?.newBadges?.forEach(b => popup(b.icon, `Badge: ${b.name}!`, b.hint));
  checkUnlocks(a);
  return { newBest, best: Math.max(before, score), coins: out?.coinsEarned || 0, gained: out?.gained || 0, played: a.plays[slug], won: a.wins[slug] || 0 };
}

/** How far along the current rank you are. */
export function rankProgress() {
  const r = profile.rank, points = profile.all.points;
  const i = RANKS.findIndex(x => x.title === r.title);
  const next = RANKS[i + 1] || null;
  const from = RANKS[i].at;
  return { index: Math.max(0, i), icon: r.icon, title: r.title, points, next, share: next ? Math.min(1, (points - from) / (next.at - from)) : 1 };
}
