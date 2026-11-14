/**
 * Stroop Test: a colour word is shown in a different colour of ink. Tap the INK, not the word. Fifteen
 * cards in three stages: ink only, then some cards ask for the WORD instead, then less time per card.
 *
 * Fair on any connection, like Reaction Time: each phone times its own player from the moment the card
 * appeared on that screen, and sends which answer was tapped with the time (tv.js, logic.signal).
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1538';

export const CARDS = 15;
// ink is how the word is printed on the card; btn is the answer button, a shade deeper so white text reads on it
export const COLORS = [
  { key: 'l', name: 'RED', ink: '#ff4b4b', btn: '#d63030', arrow: '←' },
  { key: 'u', name: 'BLUE', ink: '#4da3ff', btn: '#2a74d6', arrow: '↑' },
  { key: 'r', name: 'GREEN', ink: '#3ddc6a', btn: '#1f9e4a', arrow: '→' },
  { key: 'd', name: 'YELLOW', ink: '#ffd23f', btn: '#c9a100', arrow: '↓' },
];
const GAP = [36, 66];                 // ticks of a blank "ready" between cards
const SHOW = 70;                      // ticks the answer stays up
export const windowFor = (card) => (card > 10 ? 120 : 180);   // time to answer: 3 s, then 2 s in the last stage
export const stageOf = (card) => (card <= 5 ? 1 : card <= 10 ? 2 : 3);
export const STAGES = ['Tap the ink', 'Ink or word?', 'Faster'];
/** Points for a right answer: quicker is worth more, never less than 10. */
export const pointsFor = (ms) => Math.max(10, Math.round((2000 - ms) / 10));

function deal(s) {
  const ink = Math.floor(rnd(s) * 4);
  let word = Math.floor(rnd(s) * 4);
  if (rnd(s) < 0.75 && word === ink) word = (word + 1 + Math.floor(rnd(s) * 3)) % 4;   // mostly they clash
  const ask = stageOf(s.card) >= 2 && rnd(s) < 0.35 ? 'word' : 'ink';
  s.cardNow = { ink, word, ask };
  s.phase = 'ready'; s.phaseT = s.t; s.gap = GAP[0] + Math.floor(rnd(s) * (GAP[1] - GAP[0]));
  s.players.forEach((p) => { p.now = null; });
}
const answerOf = (c) => (c.ask === 'ink' ? c.ink : c.word);

export default {
  hint: 'Tap the colour of the INK, not the word',
  pad: [['l', 'RED'], ['u', 'BLUE'], ['r', 'GREEN'], ['d', 'YELLOW']],
  choices: COLORS.map(c => [c.key, c.name, c.btn, c.arrow]),
  init({ n, seed }) {
    const s = { n, seed, t: 0, card: 1, phase: 'ready', phaseT: 0, gap: 50, cardNow: null, goAt: -1, ev: [],
      players: seats(n).map(() => ({ score: 0, right: 0, wrong: 0, now: null, ms: [] })) };
    deal(s);
    return s;
  },
  signal(s) { return s.phase === 'done' ? null : { round: s.card, go: s.phase === 'card' }; },
  step(s, inputs) {
    s.t += 1;
    const since = s.t - s.phaseT;
    if (s.phase === 'ready' && since >= s.gap) {
      s.phase = 'card'; s.phaseT = s.t; s.goAt = s.t;
      if (s.card === 6 || s.card === 11) s.ev.push({ k: 'level', seat: -1, level: stageOf(s.card), name: STAGES[stageOf(s.card) - 1] });
      return;
    }
    if (s.phase === 'card') {
      const want = COLORS[answerOf(s.cardNow)].key;
      s.players.forEach((p, i) => {
        if (p.now != null) return;
        const inp = inputs[i] || {};
        if (inp.rr !== s.card || !Number.isFinite(inp.rt) || !inp.pick) return;
        const ms = Math.max(0, Math.round(inp.rt));
        if (inp.pick === want && ms >= 120) {
          p.now = { ok: true, ms, pick: inp.pick }; p.right += 1; p.ms.push(ms); p.score += pointsFor(ms);
          s.ev.push({ k: 'flap', seat: i });
        } else {
          p.now = { ok: false, ms, pick: inp.pick }; p.wrong += 1;
          s.ev.push({ k: 'hit', seat: i, victim: i });
        }
      });
      if (s.players.every(p => p.now != null) || since >= windowFor(s.card)) {
        s.players.forEach((p) => { if (p.now == null) { p.now = { ok: false, ms: null, pick: null }; p.wrong += 1; } });
        // the quickest right answer at the table earns a little extra
        const right = s.players.map((p, i) => (p.now.ok ? [p.now.ms, i] : null)).filter(Boolean).sort((a, b) => a[0] - b[0]);
        if (s.n > 1 && right.length) { s.players[right[0][1]].score += 20; s.ev.push({ k: 'star', seat: right[0][1], combo: 3 }); }
        else if (s.n === 1 && right.length && right[0][0] < 700) s.ev.push({ k: 'star', seat: 0 });
        s.phase = 'answer'; s.phaseT = s.t;
      }
      return;
    }
    if (s.phase === 'answer' && since >= SHOW) {
      if (s.card >= CARDS) { s.phase = 'done'; return; }
      s.card += 1;
      deal(s);
    }
  },
  over(s) {
    if (s.phase !== 'done') return null;
    const scores = s.players.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: top > 0 ? seats(s.n).filter(i => scores[i] === top) : [] };
  },
  // a computer player: reads the card in 0.6 to 1.2 s and is right most of the time, less so on WORD cards
  bot(s, seat) {
    if (s.phase !== 'card') return {};
    const v = (k) => { const x = Math.sin((s.card * 17 + seat * 5 + k + (s.seed % 10007)) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const rt = Math.round(620 + v(1) * 560 + (s.cardNow.ask === 'word' ? 180 : 0));
    if ((s.t - s.goAt) * TICK * 1000 < rt) return {};
    const right = v(2) < (s.cardNow.ask === 'word' ? 0.78 : 0.9);
    const pick = right ? COLORS[answerOf(s.cardNow)].key : COLORS[(s.cardNow.word + (s.cardNow.ask === 'word' ? 1 : 0)) % 4].key;
    return { [pick]: true, rr: s.card, rt, pick };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [names[i] || `P${i + 1}`, p.score, SEAT_COLORS[i]]));
  },
  draw(g, s, names) {
    g.fillStyle = '#14161f'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const c = s.cardNow, stage = stageOf(Math.min(s.card, CARDS));
    g.fillStyle = '#c9cfdb'; g.font = '800 15px system-ui, sans-serif';
    g.fillText(`CARD ${Math.min(s.card, CARDS)} / ${CARDS} · ${STAGES[stage - 1]}`, W / 2, 54);
    // a white card in the middle, the word on it in the "wrong" ink
    const cw = 380, ch = 170, cx = W / 2 - cw / 2, cy = 92;
    g.fillStyle = '#f5f2ea'; g.beginPath(); g.roundRect ? g.roundRect(cx, cy, cw, ch, 22) : g.rect(cx, cy, cw, ch); g.fill();
    if (s.phase === 'ready') {
      g.fillStyle = '#8a8f9c'; g.font = '800 30px system-ui, sans-serif'; g.fillText('Ready…', W / 2, cy + ch / 2);
    } else if (s.phase === 'card' || s.phase === 'answer') {
      g.fillStyle = c.ask === 'word' ? '#1d1d1d' : '#555b66';
      g.font = '900 18px system-ui, sans-serif';
      g.fillText(c.ask === 'word' ? 'Tap the WORD' : 'Tap the INK colour', W / 2, cy + 28);
      g.fillStyle = COLORS[c.ink].ink; g.font = '900 76px system-ui, sans-serif';
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3;
      g.strokeText(COLORS[c.word].name, W / 2, cy + ch / 2 + 16); g.fillText(COLORS[c.word].name, W / 2, cy + ch / 2 + 16);
      if (s.phase === 'card') {
        const left = 1 - (s.t - s.goAt) / windowFor(s.card);
        g.fillStyle = left > 0.3 ? '#3ddc6a' : '#ff4b4b'; g.fillRect(cx + 20, cy + ch - 16, (cw - 40) * Math.max(0, left), 6);
      }
    } else if (s.phase === 'done') {
      g.fillStyle = '#1d1d1d'; g.font = '900 34px system-ui, sans-serif'; g.fillText('Final scores', W / 2, cy + ch / 2);
    }
    // each player's last answer: right or wrong, and how fast
    s.players.forEach((p, i) => {
      const x = W / (s.n + 1) * (i + 1), y = 312;
      g.fillStyle = SEAT_COLORS[i]; g.font = '800 15px system-ui, sans-serif';
      g.fillText(names[i] || `P${i + 1}`, x, y);
      g.font = '800 17px system-ui, sans-serif';
      if (s.phase === 'answer' || s.phase === 'done') {
        if (s.phase === 'done') { g.fillStyle = '#fff'; g.fillText(`${p.right}/${CARDS} right`, x, y + 24); if (p.ms.length) { g.font = '600 13px system-ui, sans-serif'; g.fillText(`avg ${Math.round(p.ms.reduce((a, b) => a + b, 0) / p.ms.length)} ms`, x, y + 44); } }
        else if (p.now?.ok) { g.fillStyle = '#3ddc6a'; g.fillText(`✓ ${p.now.ms} ms`, x, y + 24); }
        else { g.fillStyle = '#ff6b6b'; g.fillText(p.now?.pick ? '✗ wrong' : '✗ no answer', x, y + 24); }
      } else if (s.phase === 'card' && p.now) { g.fillStyle = '#c9cfdb'; g.fillText('answered', x, y + 24); }
    });
    // the four answers, with their keys, for a keyboard or a big screen
    COLORS.forEach((col, k) => {
      const bw = 128, x = W / 2 - 2 * bw - 18 + k * (bw + 12), y = 362;
      g.fillStyle = col.ink; g.fillRect(x, y, bw, 28);
      g.fillStyle = '#111'; g.font = '800 14px system-ui, sans-serif';
      g.fillText(`${col.arrow} ${col.name}`, x + bw / 2, y + 15);
    });
    this.hud(g, s, names);
  },
};
