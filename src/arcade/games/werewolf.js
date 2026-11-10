/**
 * Werewolf Night: the old village party game. Everyone secretly gets a role: Werewolf, Seer,
 * Doctor or Villager. At night the werewolves pick someone, the Seer learns one player's role and
 * the Doctor protects one player. By day the village talks it over and votes someone out.
 * The village wins when every werewolf is gone; the werewolves win when they are as many as the rest.
 * Nobody is hurt: someone "caught" by the werewolves just sits out, like any party game.
 */
import { best, seatsOf, shuffle } from '../lib.js?v=20261110-1337';

export const ROLE = { wolf: { name: 'Werewolf', icon: '🐺' }, seer: { name: 'Seer', icon: '🔮' }, doctor: { name: 'Doctor', icon: '🩺' }, villager: { name: 'Villager', icon: '🏡' } };
const alive = (s) => seatsOf(s.n).filter(p => s.alive[p]);
const wolvesLeft = (s) => alive(s).filter(p => s.roles[p] === 'wolf').length;
function winner(s) {
  const w = wolvesLeft(s), rest = alive(s).length - w;
  if (w === 0) return 'village';
  if (w >= rest) return 'wolves';
  return null;
}
function nightActors(s) {
  return alive(s).filter(p => (s.roles[p] === 'wolf' && s.night.kill[p] == null) || (s.roles[p] === 'seer' && s.night.check == null) || (s.roles[p] === 'doctor' && s.night.save == null));
}
function startNight(s) {
  s.phase = 'night';
  s.day += 1;
  s.night = { kill: {}, check: null, save: null };
}

export default {
  secret: true,
  init({ n, rng }) {
    const wolves = n >= 9 ? 2 : 1;
    const deck = shuffle([...Array(wolves).fill('wolf'), 'seer', 'doctor', ...Array(n - wolves - 2).fill('villager')], rng);
    return { n, roles: deck, alive: seatsOf(n).map(() => true), seen: seatsOf(n).map(() => false), phase: 'read', day: 0, night: null, votes: {}, known: {}, story: null, out: null, done: null };
  },
  active(s) {
    if (s.done) return [];
    if (s.phase === 'read') return seatsOf(s.n).filter(p => !s.seen[p]);
    if (s.phase === 'night') return nightActors(s);
    if (s.phase === 'vote') return alive(s).filter(p => s.votes[p] === undefined);
    return [alive(s)[0]];   // dawn and verdict: the first player still in moves things on
  },
  moves(s, seat) {
    if (s.phase === 'read') return [{ ok: 1 }];
    if (s.phase === 'dawn' || s.phase === 'verdict') return [{ next: 1 }];
    const others = alive(s).filter(p => p !== seat);
    if (s.phase === 'vote') return [...others.map(vote => ({ vote })), { vote: -1 }];
    const r = s.roles[seat];
    if (r === 'wolf') return others.filter(p => s.roles[p] !== 'wolf').map(kill => ({ kill }));
    if (r === 'seer') return others.filter(p => s.known[p] == null).map(check => ({ check })).concat(others.every(p => s.known[p] != null) ? [{ check: -1 }] : []);
    if (r === 'doctor') return alive(s).map(save => ({ save }));
    return [];
  },
  apply(s, seat, m, rng) {
    const events = [];
    if (m.ok) {
      s.seen[seat] = true;
      if (s.seen.every(Boolean)) { startNight(s); events.push({ k: 'night', seat }); }
      return events;
    }
    if (m.kill != null) s.night.kill[seat] = m.kill;
    if (m.check != null) { s.night.check = m.check; if (m.check >= 0) s.known[m.check] = s.roles[m.check]; }
    if (m.save != null) s.night.save = m.save;
    if (s.phase === 'night' && !nightActors(s).length) {
      // the wolves' pick: the one most of them chose
      const picks = Object.values(s.night.kill);
      const victim = picks.length ? best([...new Set(picks)], p => picks.filter(x => x === p).length, rng) : -1;
      const saved = victim >= 0 && s.night.save === victim;
      if (victim >= 0 && !saved) s.alive[victim] = false;
      s.story = { victim, saved };
      s.phase = 'dawn';
      events.push({ k: 'day', seat });
      if (victim >= 0 && !saved) events.push({ k: 'caught', seat: victim }); else if (saved) events.push({ k: 'saved', seat: victim });
      const w = winner(s);
      if (w) s.done = w;
      return events;
    }
    if (m.next) {
      if (s.phase === 'dawn') { s.phase = 'vote'; s.votes = {}; return events; }
      startNight(s);
      events.push({ k: 'night', seat });
      return events;
    }
    if (m.vote !== undefined) {
      s.votes[seat] = m.vote;
      if (m.vote >= 0) events.push({ k: 'point', seat, at: m.vote });
      if (!alive(s).some(p => s.votes[p] === undefined)) {
        const tally = {};
        Object.values(s.votes).forEach((v) => { if (v >= 0) tally[v] = (tally[v] || 0) + 1; });
        const top = Math.max(0, ...Object.values(tally));
        const leaders = Object.keys(tally).filter(k => tally[k] === top).map(Number);
        const out = top > 0 && leaders.length === 1 ? leaders[0] : -1;
        if (out >= 0) { s.alive[out] = false; events.push({ k: 'caught', seat: out }); }
        s.out = { who: out, role: out >= 0 ? s.roles[out] : null, tally };
        s.lastVotes = { ...s.votes };
        s.phase = 'verdict';
        const w = winner(s);
        if (w) s.done = w;
      }
    }
    return events;
  },
  result(s) {
    if (!s.done) return null;
    const team = (p) => (s.roles[p] === 'wolf' ? 'wolves' : 'village');
    const winners = seatsOf(s.n).filter(p => team(p) === s.done);
    return { scores: seatsOf(s.n).map(p => (team(p) === s.done ? 1 : 0)), winners, note: s.done === 'village' ? 'The village caught every werewolf!' : 'The werewolves took over the village!', roles: s.roles };
  },
  view(s, seat) {
    const me = seat >= 0 ? s.roles[seat] : null;
    const shownRoles = seatsOf(s.n).map((p) => {
      if (s.done || !s.alive[p] || p === seat) return s.roles[p];
      if (me === 'wolf' && s.roles[p] === 'wolf') return 'wolf';
      if (me === 'seer' && s.known[p]) return s.known[p];
      return null;
    });
    return { n: s.n, phase: s.phase, day: s.day, alive: s.alive, roles: shownRoles, me, story: s.story && { victim: s.story.victim, saved: s.phase === 'dawn' ? s.story.saved : null },
      out: s.out, done: s.done, voted: seatsOf(s.n).map(p => s.votes[p] !== undefined), waiting: s.phase === 'read' ? s.seen.map(x => !x) : null };
  },
  bot(s, seat, rng, moves) {
    if (moves[0].ok || moves[0].next) return moves[0];
    const r = s.roles[seat];
    if (moves[0].kill != null) return best(moves, m => (s.roles[m.kill] === 'seer' || s.roles[m.kill] === 'doctor' ? 2 : 1) * rng(), rng);
    if (moves[0].check != null) return moves[Math.floor(rng() * moves.length)];
    if (moves[0].save != null) return best(moves, m => (m.save === seat ? 1.4 : 1) * rng(), rng);
    // votes: a seer votes for a werewolf it knows; werewolves vote for someone else; the rest guess
    const knownWolf = r === 'seer' ? moves.find(m => m.vote >= 0 && s.known[m.vote] === 'wolf') : null;
    if (knownWolf) return knownWolf;
    const pool = moves.filter(m => m.vote >= 0 && !(r === 'wolf' && s.roles[m.vote] === 'wolf'));
    // the village tends to follow whoever is already accused; werewolves happily join in
    const tally = {};
    Object.values(s.votes).forEach((v) => { if (v >= 0) tally[v] = (tally[v] || 0) + 1; });
    const follow = pool.filter(m => tally[m.vote]).sort((a, b) => tally[b.vote] - tally[a.vote])[0];
    if (follow && rng() < (r === 'wolf' ? 0.8 : 0.6)) return follow;
    // a quiet hunch: villagers lean towards whoever voted against the last player caught by night
    if (r !== 'wolf' && s.story?.victim >= 0 && rng() < 0.35) { const hunch = pool.find(m => s.lastVotes?.[m.vote] === s.story.victim); if (hunch) return hunch; }
    return pool.length ? pool[Math.floor(rng() * pool.length)] : moves[moves.length - 1];
  },
  ui(v, ctx) {
    const N = ctx.names;
    const mine = ctx.active.includes(ctx.me);
    const meDead = ctx.me >= 0 && !v.alive[ctx.me];
    const list = N.map((n, p) => `${v.alive[p] ? '' : '💀 '}${n}${v.roles[p] ? ` · ${ROLE[v.roles[p]].icon} ${ROLE[v.roles[p]].name}` : ''}`);
    const youAre = v.me ? `${ROLE[v.me].icon} You are the ${ROLE[v.me].name}` : '👀 You are watching';
    const pick = (key) => ctx.legal.map((m, i) => ({ label: m[key] >= 0 ? N[m[key]] : 'Nobody', i }));
    if (v.phase === 'read') return { title: mine ? 'Your secret role' : 'Reading the roles…', big: mine ? `${ROLE[v.me].icon} ${ROLE[v.me].name}` : '', lead: mine ? ({ wolf: 'At night, pick someone to catch. Don’t get found out by day!', seer: 'Each night, learn one player’s true role.', doctor: 'Each night, protect one player from the werewolves.', villager: 'Find the werewolves and vote them out.' })[v.me] : '', buttons: mine ? [{ label: 'Got it', i: 0, primary: true }] : [] };
    if (v.phase === 'night') {
      if (!mine) return { title: `🌙 Night ${v.day}`, lead: meDead ? 'You are out: watch quietly.' : 'Close your eyes… the night roles are busy.', list };
      const ask = { wolf: 'Pick someone to catch tonight', seer: 'Whose role do you want to see?', doctor: 'Who will you protect tonight?' }[v.me];
      const key = { wolf: 'kill', seer: 'check', doctor: 'save' }[v.me];
      return { title: `🌙 ${ask}`, lead: youAre, list, buttons: pick(key) };
    }
    if (v.phase === 'dawn') {
      const s2 = v.story;
      const line = s2.victim < 0 ? 'A quiet night: nobody was caught.' : s2.saved ? `The Doctor saved ${N[s2.victim]}! 🩺` : `${N[s2.victim]} was caught in the night.`;
      return { title: `☀️ Day ${v.day}`, lead: line, list, buttons: mine ? [{ label: 'Start the vote', i: 0, primary: true }] : [] };
    }
    if (v.phase === 'vote') return { title: mine ? '🗳️ Who is a werewolf?' : 'The village is voting…', lead: meDead ? 'You are out: you can’t vote.' : youAre, list, buttons: mine ? ctx.legal.map((m, i) => ({ label: m.vote >= 0 ? N[m.vote] : 'Skip the vote', i })) : [] };
    const o = v.out;
    const line = o.who < 0 ? 'The vote was split: nobody leaves.' : `${N[o.who]} was voted out. They were ${ROLE[o.role].icon} ${ROLE[o.role].name}.`;
    return { title: `⚖️ The verdict`, lead: line, list, buttons: mine ? [{ label: 'Night falls…', i: 0, primary: true }] : [] };
  },
  chit: (v) => ({ text: v.phase === 'night' ? 'Night falls…' : v.phase === 'vote' ? 'Who is the werewolf?' : v.phase === 'read' ? 'Werewolf Night' : `Day ${v.day}`, label: v.phase === 'night' ? '🌙' : '☀️' }),
};
