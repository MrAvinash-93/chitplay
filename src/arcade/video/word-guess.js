/**
 * Word Guess: a hidden word and its category. One letter shows at the start and another every second
 * and a half. Type the whole word: the earlier you guess right, the more it is worth. One guess per
 * word, so guessing too soon can cost you the round.
 *
 * Fair on any connection: each phone times its player from when the word appeared there, and the
 * points come from how many letters were still hidden at that moment on the player's own screen.
 * Friends' phones are only ever sent the letters already showing (publicState), never the word.
 */
import { H, rnd, scoreBar, SEAT_COLORS, seats, TICK, W } from './lib.js?v=20261114-1428';

/** Everyday words for every age, grouped by the clue shown with them. */
export const WORDS = {
  Animal: ['TIGER', 'HORSE', 'RABBIT', 'MONKEY', 'ZEBRA', 'CAMEL', 'PANDA', 'EAGLE', 'SHEEP', 'DONKEY', 'TURTLE', 'PARROT', 'LION', 'GOAT', 'WHALE', 'SNAKE', 'MOUSE', 'SPIDER', 'GIRAFFE', 'DOLPHIN'],
  Fruit: ['MANGO', 'APPLE', 'BANANA', 'GRAPES', 'ORANGE', 'LEMON', 'CHERRY', 'PAPAYA', 'GUAVA', 'MELON', 'PEACH', 'PEAR', 'COCONUT', 'LITCHI', 'PLUM'],
  Food: ['BREAD', 'RICE', 'PIZZA', 'SALAD', 'BUTTER', 'CHEESE', 'NOODLES', 'SOUP', 'HONEY', 'COOKIE', 'SAMOSA', 'PANCAKE', 'SUGAR', 'PASTA', 'BURGER'],
  'At home': ['CHAIR', 'TABLE', 'PILLOW', 'MIRROR', 'WINDOW', 'BLANKET', 'SPOON', 'BUCKET', 'CLOCK', 'CANDLE', 'SOFA', 'KETTLE', 'CARPET', 'LADDER', 'BASKET'],
  Sport: ['CRICKET', 'TENNIS', 'HOCKEY', 'BOXING', 'GOLF', 'RUGBY', 'KABADDI', 'CYCLING', 'KARATE', 'ROWING', 'CHESS', 'SKATING', 'DIVING'],
  Nature: ['RIVER', 'MOUNTAIN', 'FOREST', 'ISLAND', 'DESERT', 'OCEAN', 'CLOUD', 'RAINBOW', 'VALLEY', 'FLOWER', 'THUNDER', 'SUNSET', 'VOLCANO', 'BEACH'],
  Job: ['DOCTOR', 'TEACHER', 'FARMER', 'PILOT', 'BAKER', 'TAILOR', 'DRIVER', 'NURSE', 'CHEF', 'PAINTER', 'SINGER', 'DENTIST', 'POLICE'],
  Travel: ['TRAIN', 'BICYCLE', 'ROCKET', 'TRUCK', 'BOAT', 'PLANE', 'SCOOTER', 'TICKET', 'STATION', 'AIRPORT', 'SUITCASE', 'BRIDGE', 'TAXI'],
  School: ['PENCIL', 'ERASER', 'NOTEBOOK', 'RULER', 'TEACHER', 'LIBRARY', 'PAPER', 'CRAYON', 'GLOBE', 'SCHOOL', 'LESSON', 'SCIENCE', 'MARKER'],
  Body: ['HEART', 'FINGER', 'ELBOW', 'SHOULDER', 'KNEE', 'NOSE', 'TOOTH', 'ANKLE', 'THUMB', 'MOUTH'],
};
const CLUES = Object.keys(WORDS);
export const ROUNDS = 8;
export const REVEAL = 90;                 // ticks between letters (1.5 s)
const AFTER_LAST = 360;                   // the last reveal plus six seconds to answer
const RESULT = 150;
/** How many letters are showing after a time on screen: one at the start, then one more every 1.5 s, never the whole word. */
export const shownAfter = (len, ms) => Math.min(len - 1, 1 + Math.floor(ms / (REVEAL * TICK * 1000)));
/** Points for a right guess: ten for every letter still hidden, ten for getting it at all. */
export const pointsFor = (len, ms) => 10 + 10 * (len - shownAfter(len, ms));

function newWord(s) {
  const clue = CLUES[Math.floor(rnd(s) * CLUES.length)];
  const list = WORDS[clue];
  let word = list[Math.floor(rnd(s) * list.length)], tries = 0;
  while (s.used.includes(word) && tries++ < 20) word = list[Math.floor(rnd(s) * list.length)];
  s.used.push(word);
  // the order the letters come out in: a random order, the same for everyone
  const order = [...Array(word.length).keys()];
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd(s) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  Object.assign(s, { word, clue, order, phase: 'guess', phaseT: s.t });
  s.players.forEach((p) => { p.guess = null; });
}
const shownNow = (s) => (s.phase === 'guess' ? shownAfter(s.word.length, (s.t - s.phaseT) * TICK * 1000) : s.word.length);
/** The word as it shows now: the letters out so far, blanks for the rest. */
export const masked = (s) => s.word.split('').map((c, i) => (s.order.indexOf(i) < shownNow(s) ? c : '_')).join('');

export default {
  hint: 'Type the whole word and press ✓: the earlier, the more points',
  pad: [],
  keypad: 'letters',
  init({ n, seed }) {
    const s = { n, seed, t: 0, round: 1, word: '', clue: '', order: [], phase: 'guess', phaseT: 0, used: [], ev: [],
      players: seats(n).map(() => ({ score: 0, right: 0, guess: null })) };
    newWord(s);
    return s;
  },
  signal(s) { return s.phase === 'done' ? null : { round: s.round, go: s.phase === 'guess' }; },
  /** Friends' phones get only the letters already showing while the word is being guessed. */
  publicState(s) {
    if (s.phase !== 'guess') return s;
    return { ...s, word: masked(s), used: [] , players: s.players.map(p => ({ ...p, guess: p.guess ? { ...p.guess, text: p.guess.ok ? '✓' : '✗' } : null })) };
  },
  step(s, inputs) {
    s.t += 1;
    const since = s.t - s.phaseT;
    if (s.phase === 'guess') {
      s.players.forEach((p, i) => {
        if (p.guess) return;
        const inp = inputs[i] || {};
        if (inp.rr !== s.round || typeof inp.ans !== 'string' || !inp.ans) return;
        const text = inp.ans.toUpperCase().slice(0, 24), ms = Math.max(0, Math.round(inp.rt || 0));
        const ok = text === s.word;
        p.guess = { text, ok, ms, pts: ok ? pointsFor(s.word.length, ms) : 0 };
        if (ok) { p.score += p.guess.pts; p.right += 1; s.ev.push({ k: 'star', seat: i }); } else s.ev.push({ k: 'hit', seat: i, victim: i });
      });
      const end = (s.word.length - 2) * REVEAL + AFTER_LAST;
      if (s.players.every(p => p.guess) || since >= end) {
        // the quickest right guess at the table earns ten more
        const right = s.players.map((p, i) => (p.guess?.ok ? [p.guess.ms, i] : null)).filter(Boolean).sort((a, b) => a[0] - b[0]);
        if (s.n > 1 && right.length) s.players[right[0][1]].score += 10;
        s.phase = 'result'; s.phaseT = s.t;
      }
    } else if (s.phase === 'result' && since >= RESULT) {
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
  // a computer player: waits until two to four letters (at most half the word) are hidden; the sooner it jumps, the likelier it is wrong
  bot(s, seat) {
    const p = s.players[seat];
    if (s.phase !== 'guess' || p.guess) return {};
    const v = (k) => { const x = Math.sin((s.round * 19 + seat * 7 + k + (s.seed % 10007)) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const len = s.word.length, hiddenWanted = Math.min(2 + Math.floor(v(1) * 3), Math.ceil(len / 2));
    const ms = (s.t - s.phaseT) * TICK * 1000;
    const hidden = len - shownAfter(len, ms);
    if (hidden > hiddenWanted) return {};
    const wrong = v(2) < 0.06 + 0.4 * hidden / len;
    const ans = wrong ? s.word.slice(0, -1) + (s.word.endsWith('S') ? 'E' : 'S') : s.word;
    return { rr: s.round, ans, rt: Math.round(ms) };
  },
  hud(g, s, names) {
    scoreBar(g, s.players.map((p, i) => [names[i] || `P${i + 1}`, p.score, SEAT_COLORS[i]]));
  },
  draw(g, s, names) {
    g.fillStyle = '#1b1530'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#bfb3e6'; g.font = '800 15px system-ui, sans-serif';
    g.fillText(`WORD ${Math.min(s.round, ROUNDS)} / ${ROUNDS}`, W / 2, 54);
    g.fillStyle = '#ffd23f'; g.font = '900 24px system-ui, sans-serif';
    g.fillText(`Clue: ${s.clue}`, W / 2, 96);
    // the letters on tiles: showing ones in white, hidden ones blank
    const word = s.phase === 'guess' ? (s.word.includes('_') ? s.word : masked(s)) : s.word;
    const len = word.length, tile = Math.min(58, 520 / len), gap = 8, left = W / 2 - (len * tile + (len - 1) * gap) / 2;
    word.split('').forEach((c, i) => {
      const x = left + i * (tile + gap), y = 136;
      g.fillStyle = c === '_' ? '#2e2650' : s.phase === 'guess' ? '#f5f2ea' : '#3ddc6a';
      g.fillRect(x, y, tile, tile);
      if (c !== '_') { g.fillStyle = '#1b1530'; g.font = `900 ${Math.round(tile * 0.62)}px system-ui, sans-serif`; g.fillText(c, x + tile / 2, y + tile / 2 + 2); }
    });
    if (s.phase === 'guess') {
      const hidden = word.split('').filter(c => c === '_').length;
      g.fillStyle = '#bfb3e6'; g.font = '700 16px system-ui, sans-serif';
      g.fillText(`${hidden} hidden · a right guess now scores ${10 + 10 * hidden}`, W / 2, 230);
    } else if (s.phase === 'done') {
      g.fillStyle = '#fff'; g.font = '900 26px system-ui, sans-serif'; g.fillText('Final scores', W / 2, 232);
    }
    s.players.forEach((p, i) => {
      const x = W / (s.n + 1) * (i + 1), y = 300;
      g.fillStyle = SEAT_COLORS[i]; g.font = '800 15px system-ui, sans-serif'; g.fillText(names[i] || `P${i + 1}`, x, y);
      g.font = '800 15px system-ui, sans-serif';
      if (s.phase === 'guess') { g.fillStyle = p.guess ? '#ffd23f' : '#8f86b3'; g.fillText(p.guess ? 'guessed!' : 'thinking…', x, y + 24); }
      else if (s.phase === 'done') { g.fillStyle = '#fff'; g.fillText(`${p.right}/${ROUNDS} words`, x, y + 24); }
      else if (p.guess?.ok) { g.fillStyle = '#3ddc6a'; g.fillText(`✓ +${p.guess.pts}`, x, y + 24); }
      else { g.fillStyle = '#ff6b6b'; g.fillText(p.guess ? `✗ ${p.guess.text}` : '✗ no guess', x, y + 24); }
    });
    this.hud(g, s, names);
  },
};
