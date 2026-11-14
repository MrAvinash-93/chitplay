/**
 * Reaction Time: wait for green, then tap as fast as you can. Five rounds; the fastest hands win.
 *
 * Fair on any connection: every phone times its own player, from the moment GO was drawn on that
 * screen to the moment that player tapped, and sends the result with the tap (tv.js does this for any
 * game that has signal()). So a slow network never makes a friend look slow. A tap before GO is a false
 * start; a time under 100 ms is faster than people can react, so it counts as a guess, not a reflex.
 *
 * Rounds 3 and 4 may flash blue first: a fake signal. Tapping on blue is a false start too.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1305';

export const ROUNDS = 5;
export const MIN_HUMAN = 100;        // ms: quicker than this is a guess
export const MISS = 1500;            // ms counted for no tap at all
const WINDOW = 150;                  // ticks after GO to wait for every tap (2.5 s, room for slow networks)
const SHOW = 150;                    // ticks the round's results stay up
const DECOY = 28;                    // ticks the blue fake-out lasts
export const pointsFor = (ms) => (typeof ms === 'number' ? Math.max(0, 500 - ms) : 0);
const decoyRound = (round) => round === 3 || round === 4;

function startRound(s) {
  s.phase = 'wait';
  s.phaseT = s.t;
  s.waitLen = 90 + Math.floor(rnd(s) * 180);                       // 1.5 to 4.5 seconds
  s.decoyAt = decoyRound(s.round) && rnd(s) < 0.8 ? 30 + Math.floor(rnd(s) * Math.max(10, s.waitLen - 70)) : -1;
  s.goAt = -1;
  s.players.forEach((p) => { p.now = null; });
}

export default {
  hint: 'Wait for green, then tap anywhere as fast as you can',
  pad: [['a', '⚡ TAP']],
  init({ n, seed }) {
    const s = { n, seed, t: 0, round: 1, phase: 'wait', phaseT: 0, waitLen: 0, decoyAt: -1, goAt: -1, ev: [],
      players: seats(n).map(() => ({ times: [], pts: 0, score: 0, now: null, best: null })) };
    startRound(s);
    return s;
  },
  /** What a phone needs to time its own player: which round, and whether GO is showing. */
  signal(s) {
    if (s.phase === 'done') return null;
    return { round: s.round, go: s.phase === 'go' };
  },
  step(s, inputs) {
    s.t += 1;
    const since = s.t - s.phaseT;
    if (s.phase === 'wait' || s.phase === 'decoy') {
      s.phase = s.decoyAt >= 0 && since >= s.decoyAt && since < s.decoyAt + DECOY ? 'decoy' : 'wait';
      if (since >= s.waitLen && !(s.decoyAt >= 0 && since < s.decoyAt + DECOY + 40)) {
        s.phase = 'go'; s.goAt = s.t;
        s.ev.push({ k: 'level', seat: -1, level: s.round, name: 'GO!' });
      }
    }
    if (s.phase === 'wait' || s.phase === 'decoy' || s.phase === 'go') {
      s.players.forEach((p, i) => {
        if (p.now != null) return;
        const inp = inputs[i] || {};
        if (inp.early === s.round) { p.now = 'early'; s.ev.push({ k: 'hit', seat: i, victim: i }); return; }
        if (s.phase === 'go' && inp.rr === s.round && Number.isFinite(inp.rt)) {
          const ms = Math.round(inp.rt);
          if (ms < MIN_HUMAN) { p.now = 'early'; s.ev.push({ k: 'hit', seat: i, victim: i }); return; }
          p.now = Math.min(MISS, ms);
          s.ev.push({ k: 'flap', seat: i });
        }
      });
    }
    if (s.phase === 'go') {
      const everyone = s.players.every(p => p.now != null);
      if (everyone || s.t - s.goAt >= WINDOW) {
        s.players.forEach((p) => { if (p.now == null) p.now = 'miss'; });
        // the round's points, and a little extra for the fastest real reflex at the table
        const valid = s.players.map(p => (typeof p.now === 'number' ? p.now : Infinity));
        const fastest = Math.min(...valid);
        s.players.forEach((p, i) => {
          p.times.push(p.now);
          p.pts += pointsFor(p.now) + (s.n > 1 && p.now === fastest && Number.isFinite(fastest) ? 50 : 0);
          if (typeof p.now === 'number' && (p.best == null || p.now < p.best)) p.best = p.now;
          p.score = p.pts;
          if (s.n > 1 && p.now === fastest && Number.isFinite(fastest)) s.ev.push({ k: 'star', seat: i, combo: 3 });
          else if (s.n === 1 && typeof p.now === 'number' && p.now < 250) s.ev.push({ k: 'star', seat: i, combo: 3 });
        });
        s.phase = 'show'; s.phaseT = s.t;
      }
    } else if (s.phase === 'show' && since >= SHOW) {
      if (s.round >= ROUNDS) { s.phase = 'done'; return; }
      s.round += 1;
      startRound(s);
    }
  },
  over(s) {
    if (s.phase !== 'done') return null;
    const scores = s.players.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: top > 0 ? seats(s.n).filter(i => scores[i] === top) : [] };
  },
  // a computer player: a person's reflexes, usually 230 to 420 ms, sometimes jumpy on the fake-out
  bot(s, seat) {
    if (s.phase === 'done') return {};
    // steady within a round, different from game to game (the seed moves on every round)
    const hsh = (k) => { const v = Math.sin((s.round * 31 + seat * 7 + k + (s.seed % 10007)) * 12.9898) * 43758.5453; return v - Math.floor(v); };
    if (s.phase === 'decoy' && hsh(1) < 0.18) return { a: true, early: s.round };
    if (s.phase !== 'go') return {};
    const rt = Math.round(230 + hsh(2) * 190 + (hsh(3) < 0.1 ? 250 : 0));
    return (s.t - s.goAt) * TICK * 1000 >= rt ? { a: true, rr: s.round, rt } : {};
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [names[i] || `P${i + 1}`, p.score, SEAT_COLORS[i]]));
  },
  draw(g, s, names) {
    const since = s.t - s.phaseT;
    const bg = { wait: '#b3261e', decoy: '#1d5fd6', go: '#1e9e48', show: '#1d2433', done: '#1d2433' }[s.phase];
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // soft rings, so the colour change is felt even out of the corner of an eye
    g.save(); g.globalAlpha = 0.12; g.strokeStyle = '#fff'; g.lineWidth = 18;
    for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(W / 2, H / 2 + 20, 60 + k * 70 + (s.phase === 'go' ? since * 3 % 70 : 0), 0, Math.PI * 2); g.stroke(); }
    g.restore();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.font = '800 15px system-ui, sans-serif';
    g.fillText(`ROUND ${Math.min(s.round, ROUNDS)} / ${ROUNDS}${decoyRound(s.round) && s.phase !== 'show' ? ' · watch out for blue' : ''}`, W / 2, 56);
    const big = (text, sub) => {
      g.font = '900 64px system-ui, sans-serif'; g.fillText(text, W / 2, H / 2 + 6);
      if (sub) { g.font = '700 20px system-ui, sans-serif'; g.fillText(sub, W / 2, H / 2 + 58); }
    };
    if (s.phase === 'wait') big('Wait…', 'Tap when it turns green');
    else if (s.phase === 'decoy') big('Not yet!', 'Blue is a trick. Wait for green');
    else if (s.phase === 'go') big('TAP!', `${Math.round((s.t - s.goAt) * TICK * 1000)} ms`);
    else {
      // the round's results: one bar per player, the fastest marked
      const rows = s.players.map((p, i) => ({ i, v: p.now ?? p.times[p.times.length - 1] }));
      const valid = rows.filter(r => typeof r.v === 'number').map(r => r.v);
      const fastest = valid.length ? Math.min(...valid) : null;
      g.font = '900 30px system-ui, sans-serif';
      g.fillText(s.phase === 'done' ? 'Final scores' : 'Round result', W / 2, 100);
      rows.forEach(({ i, v }, k) => {
        const y = 150 + k * 52;
        const label = typeof v === 'number' ? `${v} ms` : v === 'early' ? 'Too soon!' : 'No tap';
        const width = typeof v === 'number' ? Math.max(20, 360 * (1 - Math.min(v, 800) / 900)) : 20;
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(120, y - 18, 400, 36);
        g.fillStyle = SEAT_COLORS[i]; g.fillRect(120, y - 18, width, 36);
        g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '800 17px system-ui, sans-serif';
        g.fillText(`${v === fastest && s.n > 1 ? '🏆 ' : ''}${names[i] || `P${i + 1}`}`, 130, y + 1);
        g.textAlign = 'right'; g.fillText(label, 510, y + 1);
        g.textAlign = 'center';
        const p = s.players[i], good = p.times.filter(x => typeof x === 'number');
        if (s.phase === 'done' && good.length) { g.font = '600 13px system-ui, sans-serif'; g.fillText(`avg ${Math.round(good.reduce((a, b) => a + b, 0) / good.length)} · best ${p.best}`, 580, y + 1); }
      });
    }
    this.hud(g, s, names);
  },
};
