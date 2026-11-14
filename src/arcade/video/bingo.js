/**
 * Bingo, the way friends play it on paper: everyone has a 5 × 5 card holding 1 to 25 in their own
 * order. Players take turns calling a number; it is crossed off on every card. A full row, column or
 * diagonal is a line, and each line lights one letter of B-I-N-G-O. Five lines first wins.
 *
 * The caller types the number on the phone keypad. Cards are private: friends' phones are sent only
 * their own card (publicState), so nobody can call numbers just to block someone else's lines.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1459';

export const SIZE = 5;
export const NEED = 5;                    // lines for BINGO
const TURN = 60 * 15;                     // fifteen seconds to call, then a number is called for you
const SHOW = 75;                          // the called number stays big for a moment
/** Every line on a card, as cell indexes: five rows, five columns, two diagonals. */
export const LINES = [
  ...[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map(c => [0, 1, 2, 3, 4].map(r => r * 5 + c)),
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];
export const linesOf = (card, called) => LINES.filter(l => l.every(i => called.includes(card[i]))).length;

function shuffled(s) {
  const a = Array.from({ length: SIZE * SIZE }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(s) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function call(s, num, seat, auto) {
  s.called.push(num);
  s.last = { num, seat, auto };
  s.players.forEach((p, i) => {
    const before = p.lines;
    p.lines = linesOf(p.card, s.called);
    if (p.lines > before) s.ev.push({ k: 'star', seat: i, combo: p.lines >= NEED ? 3 : 1 });
  });
  s.phase = 'show'; s.phaseT = s.t;
}

export default {
  hint: 'On your turn, type a number from 1 to 25 and press ✓',
  pad: [],
  keypad: 'digits',
  init({ n, seed }) {
    const s = { n, seed, t: 0, round: 1, turn: 0, called: [], last: null, phase: 'call', phaseT: 0, note: '', winners: null, ev: [], players: [] };
    s.players = seats(n).map(() => ({ card: shuffled(s), lines: 0 }));
    s.turn = Math.floor(rnd(s) * n);
    return s;
  },
  // every call is a new question for the keypad, so a number already called can be typed again
  signal(s) { return s.phase === 'done' ? null : { round: s.round, go: s.phase === 'call' }; },
  /** A friend's phone gets their own card only; the others are hidden, the lines they have are not. */
  publicState(s, seat) {
    return { ...s, players: s.players.map((p, i) => (i === seat || s.phase === 'done' ? p : { ...p, card: null })) };
  },
  step(s, inputs) {
    s.t += 1;
    const since = s.t - s.phaseT;
    if (s.phase === 'call') {
      const inp = inputs[s.turn] || {};
      if (inp.rr === s.round && typeof inp.ans === 'string') {
        const num = Number(inp.ans);
        if (Number.isInteger(num) && num >= 1 && num <= 25 && !s.called.includes(num)) { s.note = ''; call(s, num, s.turn, false); }
        else { s.note = s.called.includes(num) ? `${num} is already called` : 'Pick a number from 1 to 25'; s.round += 1; s.ev.push({ k: 'hit', seat: s.turn, victim: s.turn }); }
      } else if (since >= TURN) {
        const left = Array.from({ length: 25 }, (_, i) => i + 1).filter(x => !s.called.includes(x));
        s.note = '';
        call(s, left[Math.floor(rnd(s) * left.length)], s.turn, true);
      }
      return;
    }
    if (s.phase === 'show' && since >= SHOW) {
      if (s.players.some(p => p.lines >= NEED) || s.called.length >= 25) {
        // one number can finish two cards at once: more lines wins, and if still level, the one who called it
        const top = Math.max(...s.players.map(p => p.lines));
        let winners = seats(s.n).filter(i => s.players[i].lines === top);
        if (winners.length > 1 && winners.includes(s.last.seat)) winners = [s.last.seat];
        s.winners = winners; s.phase = 'done'; return;
      }
      s.turn = (s.turn + 1) % s.n;
      s.round += 1;
      s.phase = 'call'; s.phaseT = s.t;
    }
  },
  over(s) {
    if (s.phase !== 'done') return null;
    return { scores: s.players.map(p => p.lines), winners: s.winners || [] };
  },
  // a computer player: calls the number that does the most for its own nearly-full lines, after a moment
  bot(s, seat) {
    if (s.phase !== 'call' || s.turn !== seat) return {};
    const v = (k) => { const x = Math.sin((s.round * 17 + seat * 3 + k + s.players[seat].card[0] * 31) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const wait = 900 + v(1) * 1400;
    if ((s.t - s.phaseT) * TICK * 1000 < wait) return {};
    const card = s.players[seat].card;
    let best = null, bestScore = -1;
    card.forEach((num, cell) => {
      if (s.called.includes(num)) return;
      const score = LINES.filter(l => l.includes(cell)).reduce((a, l) => { const got = l.filter(i => s.called.includes(card[i])).length; return a + (got + 1) ** 2; }, 0) + v(10 + cell) * 6;
      if (score > bestScore) { bestScore = score; best = num; }
    });
    return { rr: s.round, ans: String(best), rt: Math.round(wait) };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [names[i] || `P${i + 1}`, 'BINGO'.slice(0, Math.min(NEED, p.lines)) || '·', SEAT_COLORS[i]]));
  },
  draw(g, s, names, mine = [0]) {
    g.fillStyle = '#16212e'; g.fillRect(0, 0, W, H);
    g.textBaseline = 'middle';
    const own = (mine.length ? mine : [0]).filter(i => s.players[i]?.card).slice(0, 2);
    // the cards played on this screen
    const cell = own.length > 1 ? 38 : 50, top = 74;
    own.forEach((seat, k) => {
      const p = s.players[seat], left = 24 + k * (cell * 5 + 18);
      g.textAlign = 'left'; g.fillStyle = SEAT_COLORS[seat]; g.font = '800 14px system-ui, sans-serif';
      g.fillText(own.length > 1 ? names[seat] || `P${seat + 1}` : 'Your card', left, top - 12);
      const done = new Set(LINES.filter(l => l.every(i => s.called.includes(p.card[i]))).flat());
      p.card.forEach((num, i) => {
        const x = left + (i % 5) * cell, y = top + Math.floor(i / 5) * cell, hit = s.called.includes(num);
        g.fillStyle = done.has(i) ? '#2f9e5a' : hit ? '#41506a' : '#f3efe4';
        g.fillRect(x + 2, y + 2, cell - 4, cell - 4);
        if (s.last?.num === num && s.phase === 'show') { g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.strokeRect(x + 2, y + 2, cell - 4, cell - 4); }
        g.textAlign = 'center'; g.fillStyle = hit ? '#c9d4e4' : '#1c2533';
        g.font = `900 ${Math.round(cell * 0.42)}px system-ui, sans-serif`; g.fillText(String(num), x + cell / 2, y + cell / 2 + 1);
        if (hit) { g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + 9, y + cell - 9); g.lineTo(x + cell - 9, y + 9); g.stroke(); }
      });
      // B I N G O under the card, lit one letter per line
      'BINGO'.split('').forEach((ch, j) => {
        g.textAlign = 'center'; g.fillStyle = j < p.lines ? '#ffd23f' : '#3a4a60'; g.font = '900 22px system-ui, sans-serif';
        g.fillText(ch, left + cell / 2 + j * cell, top + cell * 5 + 20);
      });
    });
    // the table: whose turn, the last number, the numbers called so far
    const cx = own.length > 1 ? W - 82 : 470;
    g.textAlign = 'center';
    if (s.phase === 'done') {
      const win = s.winners || [];
      g.fillStyle = '#ffd23f'; g.font = '900 36px system-ui, sans-serif'; g.fillText('BINGO!', cx, 120);
      g.fillStyle = '#fff'; g.font = '800 16px system-ui, sans-serif';
      g.fillText(win.length ? win.map(i => names[i] || `P${i + 1}`).join(' & ') : 'No one', cx, 156);
    } else {
      const who = names[s.turn] || `P${s.turn + 1}`;
      g.fillStyle = SEAT_COLORS[s.turn]; g.font = '800 16px system-ui, sans-serif';
      g.fillText(s.phase === 'call' ? (mine.includes(s.turn) ? 'Your call!' : `${who} is calling…`) : `${who} called`, cx, 84);
      // the number just called, big; while the next is being picked, the last one stays up smaller
      if (s.phase === 'show') { g.fillStyle = '#fff'; g.font = '900 64px system-ui, sans-serif'; g.fillText(String(s.last.num), cx, 140); }
      else { g.fillStyle = '#6f819c'; g.font = '800 15px system-ui, sans-serif'; g.fillText(s.last ? `last called: ${s.last.num}` : 'first call', cx, 140); }
      g.fillStyle = '#9fb3d1'; g.font = '700 13px system-ui, sans-serif';
      if (s.phase === 'call') {
        const left = Math.max(0, Math.ceil((TURN - (s.t - s.phaseT)) * TICK));
        g.fillText(s.note || (mine.includes(s.turn) ? `Type 1–25 and press ✓ · ${left} s` : `${left} s`), cx, 184);
      } else if (s.last?.auto) g.fillText('(called for them: time ran out)', cx, 184);
    }
    // called numbers, in order
    g.fillStyle = '#9fb3d1'; g.font = '700 12px system-ui, sans-serif'; g.fillText(`Called (${s.called.length})`, cx, 214);
    g.font = '800 13px system-ui, sans-serif'; g.fillStyle = '#c9d4e4';
    for (let r = 0; r * 8 < s.called.length; r++) g.fillText(s.called.slice(r * 8, r * 8 + 8).join(' '), cx, 234 + r * 18);
    g.textBaseline = 'alphabetic';
    this.hud(g, s, names);
  },
};
