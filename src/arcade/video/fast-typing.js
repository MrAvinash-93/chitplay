/**
 * Fast Typing: a word shows up, type it exactly and press ✓. Ten words, getting longer. A right word
 * scores ten points for every letter per second you typed it at, so speed counts, but a single wrong
 * letter scores nothing.
 *
 * Fair on any connection: each phone times its own player from when the word appeared on that screen
 * (tv.js keypad, signal) and sends the whole word on ✓, so a slow connection never costs speed.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1448';

/** Everyday words by length band: short first, longer as the game goes on. */
export const WORDS = [
  ['BOOK', 'FISH', 'MILK', 'STAR', 'TREE', 'RAIN', 'DOOR', 'KITE', 'LAMP', 'SHIP', 'CAKE', 'BIRD', 'MOON', 'SOCK', 'FROG', 'CAMEL', 'TIGER', 'APPLE', 'CHAIR', 'MANGO', 'RIVER', 'TRAIN', 'CLOUD', 'HONEY', 'PIANO'],
  ['BANANA', 'GARDEN', 'ROCKET', 'PENCIL', 'MONKEY', 'WINDOW', 'TENNIS', 'BOTTLE', 'CANDLE', 'ORANGE', 'PLANET', 'FOREST', 'BUTTER', 'CASTLE', 'TURTLE', 'BICYCLE', 'BLANKET', 'RAINBOW', 'TEACHER', 'KITCHEN', 'DOLPHIN', 'PANCAKE', 'CRICKET', 'THUNDER', 'LIBRARY'],
  ['ELEPHANT', 'KANGAROO', 'UMBRELLA', 'DINOSAUR', 'SANDWICH', 'KEYBOARD', 'FOOTBALL', 'HOSPITAL', 'BIRTHDAY', 'TREASURE', 'MOUNTAIN', 'NOTEBOOK', 'CROCODILE', 'BUTTERFLY', 'CHOCOLATE', 'PINEAPPLE', 'TELESCOPE', 'SUNFLOWER', 'SNOWFLAKE', 'FIREWORKS', 'ADVENTURE', 'NEWSPAPER', 'WATERMELON', 'BASKETBALL', 'HELICOPTER', 'STRAWBERRY', 'LIGHTHOUSE', 'TOOTHBRUSH'],
];
export const ROUNDS = 10;
const READY = 60;                       // a second of "get ready" before each word
const RESULT = 120;
/** Time allowed for a word: four seconds plus one for each letter. */
export const limitTicks = (len) => 60 * (4 + len);
/** Ten points for every letter per second, at least 5 for a right word, at most 60. */
export const pointsFor = (len, ms) => Math.max(5, Math.min(60, Math.round(10 * len / (Math.max(300, ms) / 1000))));
const band = (round) => (round <= 3 ? 0 : round <= 6 ? 1 : 2);

function newWord(s) {
  const list = WORDS[band(s.round)];
  let word = list[Math.floor(rnd(s) * list.length)], tries = 0;
  while (s.used.includes(word) && tries++ < 20) word = list[Math.floor(rnd(s) * list.length)];
  s.used.push(word);
  Object.assign(s, { word, phase: 'ready', phaseT: s.t });
  s.players.forEach((p) => { p.now = null; });
}

export default {
  hint: 'Type the word exactly and press ✓: the faster, the more points',
  pad: [],
  keypad: 'letters',
  init({ n, seed }) {
    const s = { n, seed, t: 0, round: 1, word: '', phase: 'ready', phaseT: 0, used: [], ev: [],
      players: seats(n).map(() => ({ score: 0, right: 0, letters: 0, ms: 0, now: null })) };
    newWord(s);
    return s;
  },
  signal(s) { return s.phase === 'done' ? null : { round: s.round, go: s.phase === 'type' }; },
  step(s, inputs) {
    s.t += 1;
    const since = s.t - s.phaseT;
    if (s.phase === 'ready') { if (since >= READY) { s.phase = 'type'; s.phaseT = s.t; } return; }
    if (s.phase === 'type') {
      s.players.forEach((p, i) => {
        if (p.now) return;
        const inp = inputs[i] || {};
        if (inp.rr !== s.round || typeof inp.ans !== 'string' || !inp.ans) return;
        const text = inp.ans.toUpperCase().slice(0, 24), ms = Math.max(0, Math.round(inp.rt || 0));
        const ok = text === s.word;
        p.now = { text, ok, ms, pts: ok ? pointsFor(s.word.length, ms) : 0 };
        if (ok) { p.score += p.now.pts; p.right += 1; p.letters += s.word.length; p.ms += Math.max(300, ms); s.ev.push({ k: 'star', seat: i, combo: p.now.pts >= 40 ? 3 : 1 }); }
        else s.ev.push({ k: 'hit', seat: i, victim: i });
      });
      if (s.players.every(p => p.now) || since >= limitTicks(s.word.length)) { s.phase = 'result'; s.phaseT = s.t; }
      return;
    }
    if (s.phase === 'result' && since >= RESULT) {
      if (s.round >= ROUNDS) { s.phase = 'done'; return; }
      s.round += 1;
      newWord(s);
    }
  },
  over(s) {
    if (s.phase !== 'done') return null;
    const scores = s.players.map(p => p.score), top = Math.max(...scores);
    return { scores, winners: top > 0 ? seats(s.n).filter(i => scores[i] === top) : [] };
  },
  // a computer player: types two to three and a half letters a second, and now and then slips
  bot(s, seat) {
    const p = s.players[seat];
    if (s.phase !== 'type' || p.now) return {};
    const v = (k) => { const x = Math.sin((s.round * 23 + seat * 5 + k + (s.seed % 10007)) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const speed = 2 + v(1) * 1.5, ms = 700 + 1000 * s.word.length / speed;
    if ((s.t - s.phaseT) * TICK * 1000 < ms) return {};
    const slip = v(2) < 0.08;
    const k = Math.floor(v(3) * s.word.length);
    const ans = slip ? s.word.slice(0, k) + (s.word[k] === 'E' ? 'A' : 'E') + s.word.slice(k + 1) : s.word;
    return { rr: s.round, ans, rt: Math.round(ms) };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [names[i] || `P${i + 1}`, p.score, SEAT_COLORS[i]]));
  },
  draw(g, s, names) {
    g.fillStyle = '#10201c'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#9fd1c0'; g.font = '800 15px system-ui, sans-serif';
    g.fillText(`WORD ${Math.min(s.round, ROUNDS)} / ${ROUNDS}`, W / 2, 54);
    if (s.phase === 'ready') {
      g.fillStyle = '#fff'; g.font = '900 34px system-ui, sans-serif'; g.fillText('Get ready…', W / 2, 170);
      g.fillStyle = '#9fd1c0'; g.font = '700 16px system-ui, sans-serif'; g.fillText(`${s.word.length} letters`, W / 2, 214);
    } else if (s.phase === 'done') {
      g.fillStyle = '#fff'; g.font = '900 30px system-ui, sans-serif'; g.fillText('Final scores', W / 2, 150);
    } else {
      g.fillStyle = '#9fd1c0'; g.font = '700 16px system-ui, sans-serif'; g.fillText(s.phase === 'type' ? 'Type this word:' : 'The word was', W / 2, 104);
      const size = Math.min(64, 640 / s.word.length);
      g.fillStyle = s.phase === 'type' ? '#fff' : '#3ddc6a'; g.font = `900 ${size}px ui-monospace, Consolas, monospace`;
      g.fillText(s.word, W / 2, 166);
      if (s.phase === 'type') {
        const left = 1 - (s.t - s.phaseT) / limitTicks(s.word.length);
        g.fillStyle = '#2bbd8e'; g.fillRect(W / 2 - 160, 222, 320 * Math.max(0, left), 8);
      }
    }
    s.players.forEach((p, i) => {
      const x = W / (s.n + 1) * (i + 1), y = 300;
      g.fillStyle = SEAT_COLORS[i]; g.font = '800 15px system-ui, sans-serif'; g.fillText(names[i] || `P${i + 1}`, x, y);
      g.font = '800 15px system-ui, sans-serif';
      if (s.phase === 'done') {
        const lps = p.ms ? p.letters / (p.ms / 1000) : 0;
        g.fillStyle = '#fff'; g.fillText(`${p.right}/${ROUNDS} · ${lps.toFixed(1)} letters/s`, x, y + 24);
      } else if (s.phase === 'type' || s.phase === 'ready') { g.fillStyle = p.now ? '#ffd23f' : '#7fa89a'; g.fillText(p.now ? 'done!' : 'typing…', x, y + 24); }
      else if (p.now?.ok) { g.fillStyle = '#3ddc6a'; g.fillText(`✓ +${p.now.pts} · ${(p.now.ms / 1000).toFixed(1)} s`, x, y + 24); }
      else { g.fillStyle = '#ff6b6b'; g.fillText(p.now ? `✗ ${p.now.text}` : '✗ too slow', x, y + 24); }
    });
    this.hud(g, s, names);
  },
};
