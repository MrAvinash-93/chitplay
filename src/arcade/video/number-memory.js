/**
 * Number Memory: a number flashes up, then hides. Type it back. Every round it is one digit longer;
 * three wrong answers and you are out. The longest number remembered wins.
 *
 * Answers are typed on each player's own phone and sent whole (tv.js keypad), timed from when the
 * question showed there. While players are answering, friends' phones are not sent the number at all
 * (publicState), so nobody can peek at it.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1435';

export const START = 3;
export const LIVES = 3;
const MAX_DIGITS = 20;
const ANSWER = 60 * 15;              // up to 15 s to type it
const RESULT = 120;
/** How long the number stays up: a second, plus a little more for each digit. */
export const showTicks = (digits) => Math.round(60 * (1 + digits * 0.45));
export const pointsFor = (digits) => digits * 10;

function newRound(s) {
  let num = String(1 + Math.floor(rnd(s) * 9));
  while (num.length < s.digits) num += String(Math.floor(rnd(s) * 10));
  s.number = num;
  s.phase = 'show'; s.phaseT = s.t;
  s.players.forEach((p) => { p.ans = null; });
}

export default {
  hint: 'Remember the number, then type it in and press ✓',
  pad: [],
  keypad: 'digits',
  init({ n, seed }) {
    const s = { n, seed, t: 0, round: 1, digits: START, number: '', phase: 'show', phaseT: 0, ev: [],
      players: seats(n).map(() => ({ score: 0, lives: LIVES, best: 0, ans: null, out: false })) };
    newRound(s);
    return s;
  },
  signal(s) { return s.phase === 'done' ? null : { round: s.round, go: s.phase === 'answer' }; },
  /** A friend's phone: the number is shown only while it is meant to be seen. */
  publicState(s) {
    if (s.phase !== 'answer') return s;
    return { ...s, number: s.number.replace(/./g, '•') };
  },
  step(s, inputs) {
    s.t += 1;
    const since = s.t - s.phaseT;
    const playing = s.players.filter(p => !p.out);
    if (s.phase === 'show' && since >= showTicks(s.digits)) { s.phase = 'answer'; s.phaseT = s.t; return; }
    if (s.phase === 'answer') {
      s.players.forEach((p, i) => {
        if (p.out || p.ans != null) return;
        const inp = inputs[i] || {};
        if (inp.rr === s.round && typeof inp.ans === 'string' && inp.ans) { p.ans = inp.ans.slice(0, 24); s.ev.push({ k: 'flap', seat: i }); }
      });
      if (playing.every(p => p.ans != null) || since >= ANSWER) {
        s.players.forEach((p, i) => {
          if (p.out) return;
          if (p.ans === s.number) { p.score += pointsFor(s.digits); p.best = s.digits; s.ev.push({ k: 'star', seat: i, combo: s.digits >= 8 ? 3 : 1 }); }
          else { p.lives -= 1; s.ev.push({ k: 'hit', seat: i, victim: i }); if (p.lives <= 0) { p.out = true; s.ev.push({ k: 'crash', seat: i }); } }
        });
        s.phase = 'result'; s.phaseT = s.t;
      }
      return;
    }
    if (s.phase === 'result' && since >= RESULT) {
      const left = s.players.filter(p => !p.out);
      // alone: until the lives run out; together: until one player is left standing (or none)
      const leaderAlone = s.n > 1 && left.length === 1 && left[0].score > Math.max(...s.players.filter(p => p.out).map(p => p.score));
      if (!left.length || leaderAlone || s.digits >= MAX_DIGITS) { s.phase = 'done'; return; }
      s.round += 1; s.digits += 1;
      newRound(s);
    }
  },
  over(s) {
    if (s.phase !== 'done') return null;
    const scores = s.players.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: top > 0 ? seats(s.n).filter(i => scores[i] === top) : [], endless: s.n === 1 };
  },
  // a computer player: sure of short numbers, less and less sure as they grow; types in a few seconds
  bot(s, seat) {
    const p = s.players[seat];
    if (s.phase !== 'answer' || p.out || p.ans != null) return {};
    const v = (k) => { const x = Math.sin((s.round * 13 + seat * 3 + k + (s.seed % 10007)) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const typing = 1200 + s.digits * 380 + v(1) * 900;
    if ((s.t - s.phaseT) * TICK * 1000 < typing) return {};
    // about as good as most people: sure of 3 or 4 digits, about even at 7, rarely right past 9
    const sure = Math.max(0.05, Math.min(0.98, 1.3 - s.digits * 0.11));
    let ans = s.number;
    if (v(2) > sure) { const k = Math.floor(v(3) * ans.length); ans = ans.slice(0, k) + String((Number(ans[k]) + 1 + Math.floor(v(4) * 8)) % 10) + ans.slice(k + 1); }
    return { rr: s.round, ans, rt: Math.round(typing) };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [`${'♥'.repeat(Math.max(0, p.lives))}${names[i] || `P${i + 1}`}`, p.out ? `${p.score} ✕` : p.score, SEAT_COLORS[i]]));
  },
  draw(g, s, names) {
    g.fillStyle = '#101624'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#9fb3d1'; g.font = '800 15px system-ui, sans-serif';
    g.fillText(`ROUND ${s.round} · ${s.digits} DIGITS`, W / 2, 54);
    const size = Math.max(30, Math.min(78, 560 / Math.max(4, s.digits) * 1.6));
    if (s.phase === 'show') {
      g.fillStyle = '#fff'; g.font = `900 ${size}px ui-monospace, Consolas, monospace`;
      g.fillText(s.number, W / 2, 170);
      const left = 1 - (s.t - s.phaseT) / showTicks(s.digits);
      g.fillStyle = '#4da3ff'; g.fillRect(W / 2 - 160, 230, 320 * Math.max(0, left), 8);
      g.fillStyle = '#9fb3d1'; g.font = '700 18px system-ui, sans-serif'; g.fillText('Remember it!', W / 2, 270);
    } else if (s.phase === 'answer') {
      g.fillStyle = '#c8d3e6'; g.font = '900 32px system-ui, sans-serif'; g.fillText('What was the number?', W / 2, 150);
      g.font = `900 ${size * 0.8}px ui-monospace, Consolas, monospace`; g.fillStyle = '#56627a';
      g.fillText('_ '.repeat(s.digits).trim(), W / 2, 210);
      g.fillStyle = '#9fb3d1'; g.font = '700 16px system-ui, sans-serif';
      g.fillText(`Type it below and press ✓ · ${Math.max(0, Math.ceil((ANSWER - (s.t - s.phaseT)) * TICK))} s`, W / 2, 262);
    } else {
      g.fillStyle = '#9fb3d1'; g.font = '700 16px system-ui, sans-serif'; g.fillText(s.phase === 'done' ? 'Final scores' : 'The number was', W / 2, 104);
      g.fillStyle = '#fff'; g.font = `900 ${size * 0.8}px ui-monospace, Consolas, monospace`; g.fillText(s.number, W / 2, 150);
    }
    s.players.forEach((p, i) => {
      const x = W / (s.n + 1) * (i + 1), y = 318;
      g.fillStyle = SEAT_COLORS[i]; g.font = '800 15px system-ui, sans-serif'; g.fillText(names[i] || `P${i + 1}`, x, y);
      g.font = '800 16px ui-monospace, Consolas, monospace';
      if (s.phase === 'result' || s.phase === 'done') {
        if (s.phase === 'done') { g.fillStyle = '#fff'; g.fillText(`best ${p.best} digits`, x, y + 24); }
        else if (p.out && p.ans == null) { g.fillStyle = '#56627a'; g.fillText('out', x, y + 24); }
        else if (p.ans === s.number) { g.fillStyle = '#3ddc6a'; g.fillText(`✓ ${p.ans}`, x, y + 24); }
        else { g.fillStyle = '#ff6b6b'; g.fillText(`✗ ${p.ans || '—'}`, x, y + 24); }
      } else if (s.phase === 'answer') {
        g.fillStyle = p.out ? '#56627a' : p.ans != null ? '#3ddc6a' : '#9fb3d1';
        g.fillText(p.out ? 'out' : p.ans != null ? 'answered' : 'typing…', x, y + 24);
      }
    });
    this.hud(g, s, names);
  },
};
