/**
 * The table games, tested without a browser:  node tests/arcade.mjs [matches per game]
 * Bots play full matches at every table size. After each move: only legal moves are made, the state
 * survives a trip through JSON (it has to cross the network), the panel can be drawn for every seat,
 * no player's secrets appear in another player's view, and the game always finishes.
 * Then some of the rules that are easy to get wrong are checked directly.
 */
import { GAMES } from '../src/arcade/catalog.js';
import chess from '../src/arcade/games/chess.js';
import checkers from '../src/arcade/games/checkers.js';
import ludo, { HOME } from '../src/arcade/games/ludo.js';
import yacht, { points } from '../src/arcade/games/yacht.js';
import callBreak from '../src/arcade/games/call-break.js';
import reversi from '../src/arcade/games/reversi.js';
import mancala from '../src/arcade/games/mancala.js';
import ticTacToe from '../src/arcade/games/tic-tac-toe.js';
import carrom, { simulate } from '../src/arcade/games/carrom.js';
import consequences from '../src/arcade/games/consequences.js';
import spy from '../src/arcade/games/who-is-the-spy.js';

const MATCHES = Number(process.argv[2]) || 25;
const SLOW = new Set(['chess']);
const CAP = 20000;
let failures = 0, passed = 0;
const fail = (msg) => { failures += 1; console.error(`  ✗ ${msg}`); };
const ok = (cond, msg) => { if (cond) passed += 1; else fail(msg); };
function seeded(seed) {
  return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const key = (m) => JSON.stringify(m, Object.keys(m).sort());
const legalize = (game, s, seat, move, legal) => {
  if (legal.some(m => key(m) === key(move))) return move;
  return game.check ? game.check(s, seat, move) : null;
};

/** Words and hands that must never reach the wrong player. */
function leaks(slug, s, seat, view) {
  const text = JSON.stringify(view);
  // (a caught spy's guess must offer the real word, so that phase is left out)
  if (slug === 'who-is-the-spy' && s.phase !== 'summary' && s.phase !== 'guess' && seat >= 0) return s.words.some(w => w !== s.words[seat] && text.includes(`"${w}"`)) || text.includes('"spies"') && view.reveal;
  if (slug === 'crazy-eights' || slug === 'call-break') {
    if (seat < 0 || !s.hands) return false;
    return s.hands.some((h, p) => p !== seat && h.some(c => view.hand.includes(c)));
  }
  if (slug === 'memory-match') return view.faces.some((f, t) => f && s.owner[t] < 0 && !s.up.includes(t) && !s.miss.includes(t)) || 'seen' in view;
  if (slug === 'riddle-chits') return !s.reveal && (view.answer != null || view.picks != null);
  return false;
}

for (const g of GAMES) {
  const game = (await import(`../src/arcade/games/${g.slug}.js`)).default;
  const sizes = [];
  for (let n = g.min; n <= Math.min(g.max, 5); n++) sizes.push(n);
  let matches = 0, longest = 0, wins = 0, draws = 0, botMs = 0, botMoves = 0, worstMs = 0;
  const games = SLOW.has(g.slug) ? Math.max(2, Math.floor(MATCHES / 8)) : MATCHES;
  for (const n of sizes) {
    for (let k = 0; k < games; k++) {
      const rng = seeded(k * 97 + n * 13 + 5);
      const names = Array.from({ length: n }, (_, i) => `P${i}`);
      // every way of playing gets played: each mode in turn, and every house rule switched on in a third of the matches
      const opts = { ...(k % 2 ? { public: true } : {}), ...(g.modes ? { style: g.modes[k % g.modes.length][0] } : {}), ...(g.rules && k % 3 === 2 ? { rules: Object.fromEntries(g.rules.map(([r]) => [r, true])) } : {}) };
      let s = game.init({ n, rng, opts, names });
      let steps = 0;
      while (!game.result(s)) {
        const active = game.active(s);
        if (!active.length) { fail(`${g.slug}: nobody can move but the game isn't over`); break; }
        for (const seat of active) {
          const legal = game.moves(s, seat);
          if (!legal.length) fail(`${g.slug}: seat ${seat} active with no moves`);
          const t0 = performance.now();
          const raw = game.bot(s, seat, rng, legal);
          const ms = performance.now() - t0;
          botMs += ms; botMoves += 1; worstMs = Math.max(worstMs, ms);
          const move = legalize(game, s, seat, raw, legal);
          if (!move) { fail(`${g.slug}: bot made an illegal move ${JSON.stringify(raw)}`); break; }
          const events = game.apply(s, seat, move, rng);
          if (!Array.isArray(events)) fail(`${g.slug}: apply must return events`);
          s = JSON.parse(JSON.stringify(s));   // as if it crossed the network
          if (game.result(s)) break;
          if (!game.active(s).includes(seat) && active.length > 1 && !game.secret) break;
          if (!game.active(s).length) break;
          if (active.length > 1 && !game.active(s).some(x => active.includes(x))) break;
        }
        // draw every seat's panel; look for leaks
        if (steps % 3 === 0 || g.min === g.max) {
          for (let seat = -1; seat < n; seat++) {
            const view = game.view ? game.view(s, seat) : s;
            const wire = JSON.parse(JSON.stringify(view));
            const act = game.active(s);
            const legal = seat >= 0 && act.includes(seat) ? game.moves(s, seat) : [];
            try { game.ui(wire, { me: seat, legal, active: act, names }); } catch (e) { fail(`${g.slug}: ui threw at seat ${seat}: ${e.stack}`); }
            if (leaks(g.slug, s, seat, wire)) fail(`${g.slug}: seat ${seat} can see a secret`);
          }
        }
        if (++steps > CAP) { fail(`${g.slug} (${n} players) never finished`); break; }
      }
      const r = game.result(s);
      if (r) {
        matches += 1;
        longest = Math.max(longest, steps);
        if (r.winners.length) wins += 1; else draws += 1;
        if (r.scores.length !== n) fail(`${g.slug}: ${r.scores.length} scores for ${n} players`);
        if (r.scores.some(v => !Number.isFinite(v))) fail(`${g.slug}: a score isn't a number`);
      }
    }
  }
  ok(matches > 0, `${g.slug} played`);
  console.log(`${g.slug.padEnd(20)} ${String(matches).padStart(4)} matches · longest ${String(longest).padStart(5)} steps · ${wins} decided, ${draws} drawn · bot avg ${(botMs / botMoves).toFixed(1)} ms, worst ${worstMs.toFixed(0)} ms`);
}

/* ─── rules that are easy to get wrong ─── */
{ // every game has its rules and its own messages, in step across languages
  const { RULES } = await import('../src/arcade/rules.js');
  const { linesFor, lineCount, MOMENT } = await import('../src/arcade/talk.js');
  for (const g of GAMES) {
    ok(RULES[g.slug]?.steps?.length >= 3, `${g.slug} has how-to-play steps`);
    ok(lineCount(g.slug) === 14, `${g.slug} has its own messages`);
    for (const lang of ['en', 'hinglish', 'hindi', 'german', 'italian']) ok(linesFor(g.slug, lang).length === lineCount(g.slug), `${g.slug}: ${lang} lines line up`);
  }
  ok(Object.values(MOMENT).flat().every(i => i < 14), 'bot lines point at real lines');
}
{ // how-to-play translations stay in step with the English rules: same games, same number of steps
  const { RULES } = await import('../src/arcade/rules.js');
  const fs = await import('node:fs');
  const dir = new URL('../src/arcade/rules-i18n/', import.meta.url);
  const cover = [];
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const pack = (await import(new URL(file, dir))).default;
    for (const [slug, r] of Object.entries(pack)) {
      ok(!!RULES[slug], `rules ${file}: ${slug} is not a game`);
      if (!RULES[slug]) continue;
      ok(r.steps?.length === RULES[slug].steps.length, `rules ${file}: ${slug} has ${r.steps?.length} steps, English has ${RULES[slug].steps.length}`);
      ok([...(r.steps || []), r.win, r.scoring].every(t => typeof t === 'string' && t.trim().length > 3), `rules ${file}: ${slug} has an empty line`);
      if (r.house) ok(r.house.length === RULES[slug].house?.length, `rules ${file}: ${slug} house rules out of step`);
    }
    cover.push(`${file.replace('.js', '')} ${Object.keys(pack).length}/${Object.keys(RULES).length}`);
  }
  const { RULES_IN } = await import('../src/arcade/shell-text-more.js');
  ok(RULES_IN.slice().sort().join() === fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', '')).sort().join(), 'RULES_IN lists every rules-i18n file');
  console.log('How to play translated:', cover.join(' · '));
}
{ // chess: a level for every rating, a clock that can run out, and ludo never moves for you
  const { LEVELS } = await import('../src/arcade/games/chess.js');
  ok(LEVELS.map(l => l.id).join() === 'beginner,novice,intermediate,good,advanced,expert,master,grandmaster', 'chess: eight rating levels in order');
  const c = chess.init({ opts: { clock: '180+2', rating: 'novice' } });
  ok(c.clock?.left[0] === 180000 && c.clock.inc === 2000 && c.level === 'novice', 'chess: the clock and level come from the options');
  ok(chess.init({ opts: {} }).clock === null, 'chess: no clock unless one is chosen');
  chess.timeout(c, 0);
  ok(chess.result(c)?.winners[0] === 1, 'chess: running out of time loses');
  const bare = chess.init({ opts: { clock: '60' } });
  bare.b = '....k...........................................Q.......K.......'.split(''); bare.b[60] = 'K'; bare.b[4] = 'k'; bare.b[48] = 'Q'; bare.p = 1;
  chess.timeout(bare, 1);
  ok(chess.result(bare)?.winners.length === 1, 'chess: black out of time against a queen loses');
  const lone = chess.init({ opts: { clock: '60' } });
  lone.b = '.'.repeat(64).split(''); lone.b[60] = 'K'; lone.b[4] = 'k'; lone.b[12] = 'q'; lone.p = 1;
  chess.timeout(lone, 0 + 1);
  ok(chess.result(lone)?.winners.length === 0, 'chess: out of time against a lone king is a draw');
  const quick = chess.init({ opts: { rating: 'beginner' } });
  const t0 = Date.now(); chess.bot(quick, 0, seeded(2), chess.moves(quick, 0));
  ok(Date.now() - t0 < 500, 'chess: the beginner level answers at once');
  const l = ludo.init({ n: 2, rng: seeded(3) });
  ok(ludo.ui(ludo.view ? ludo.view(l, 0) : l, { me: 0, active: [0], legal: ludo.moves(l, 0), names: ['a', 'b'], mine: true }).auto === undefined, 'ludo: never moves for you');
}
console.log('\nRules');
const r0 = seeded(1);
const place = (fen) => fen.replace(/\s/g, '').split('');

{ // chess: perft from the start position
  const s0 = chess.init({});
  const perft = (s, d) => {
    if (d === 0) return 1;
    let c = 0;
    for (const m of chess.moves(s, s.p)) { const x = JSON.parse(JSON.stringify(s)); chess.apply(x, x.p, m); c += perft(x, d - 1); }
    return c;
  };
  ok(perft(s0, 1) === 20 && perft(s0, 2) === 400 && perft(s0, 3) === 8902, 'chess: move counts from the start (20, 400, 8902)');
  // the "Kiwipete" position exercises castling, en passant and promotion: 48 moves
  const kiwi = chess.init({});
  kiwi.b = place(`r...k..r p.ppqpb. bn..pnp. ...PN... .p..P... ..N..Q.p PPPBBPPP R...K..R`);
  ok(chess.moves(kiwi, 0).length === 48, 'chess: 48 moves in the castling test position');
  const fool = chess.init({});
  [[53, 45], [12, 28], [54, 38], [3, 39]].forEach(([f, t]) => { chess.apply(fool, fool.p, { f, t }); });
  ok(chess.result(fool)?.winners[0] === 1 && /Checkmate/.test(chess.result(fool).note), 'chess: fool’s mate is checkmate');
  const ep = chess.init({});
  ep.b = place(`....k... ........ ........ ........ ...p.... ........ ....P... ....K...`);
  ep.c = [{ k: false, q: false }, { k: false, q: false }];
  chess.apply(ep, 0, { f: 52, t: 36 });
  ok(chess.moves(ep, 1).some(m => m.ep && m.t === 44), 'chess: en passant is offered straight after the double step');
  const stale = chess.init({});
  stale.b = place(`.......k ........ ......QK ........ ........ ........ ........ ........`);
  stale.b[stale.b.indexOf('Q')] = '.'; stale.b[13] = 'Q'; stale.b[22] = 'K'; stale.b[23] = '.';
  stale.c = [{ k: false, q: false }, { k: false, q: false }];
  stale.p = 1;
  ok(chess.moves(stale, 1).length === 0 && !stale.end, 'chess: stalemate position has no moves for Black');
}
{ // checkers: captures are compulsory, jumps continue
  const s = checkers.init({});
  s.b = Array(64).fill(-1);
  s.b[9 + 4 * 8 - 1] = -1;
  const at = (x, y) => x + y * 8;
  s.b[at(2, 5)] = 0; s.b[at(3, 4)] = 1; s.b[at(5, 2)] = 1; s.b[at(6, 7)] = 0;
  const moves = checkers.moves(s, 0);
  ok(moves.length === 1 && moves[0].x === at(3, 4), 'checkers: a capture must be taken');
  checkers.apply(s, 0, moves[0]);
  ok(s.p === 0 && s.chain === at(4, 3), 'checkers: the same piece keeps jumping');
}
{ // ludo: needs a six; three sixes lose the turn; exact number home; capture sends back
  const fixed = (...rolls) => () => { const v = rolls.shift(); return (v - 1) / 6 + 0.01; };
  let s = ludo.init({ n: 2 });
  ludo.apply(s, 0, { roll: 1 }, fixed(3));
  ok(s.p === 1 && s.die === null, 'ludo: no six, no token out: the turn passes');
  s = ludo.init({ n: 2 });
  ludo.apply(s, 0, { roll: 1 }, fixed(6));
  ok(ludo.moves(s, 0).length === 4, 'ludo: a six can bring out any token');
  ludo.apply(s, 0, { t: 0 });
  ok(s.p === 0 && s.t[0][0] === 0, 'ludo: a six rolls again');
  s = ludo.init({ n: 2 });
  s.t[0][0] = 53;
  ludo.apply(s, 0, { roll: 1 }, fixed(5));
  ok(s.p === 1, 'ludo: home needs the exact number');
  s = ludo.init({ n: 2 });
  s.t[0][0] = 53;
  ludo.apply(s, 0, { roll: 1 }, fixed(3));
  ludo.apply(s, 0, { t: 0 });
  ok(s.t[0][0] === HOME && s.p === 0, 'ludo: reaching home rolls again');
  s = ludo.init({ n: 2 });
  s.t[0][0] = 2; s.t[1][0] = 2 + 52 - 26 + 3;  // seat 1 sits on absolute square 5
  ludo.apply(s, 0, { roll: 1 }, fixed(3));
  ludo.apply(s, 0, { t: 0 });
  ok(s.t[1][0] === -1 && s.p === 0, 'ludo: landing on a rival sends it back and rolls again');
  s = ludo.init({ n: 2 });
  s.t[0][0] = 5; s.t[1][0] = 8 + 26;           // seat 1 on square 8, a star
  ludo.apply(s, 0, { roll: 1 }, fixed(3));
  ludo.apply(s, 0, { t: 0 });
  ok(s.t[1][0] !== -1, 'ludo: star squares are safe');
  s = ludo.init({ n: 2 });
  s.t[0][0] = 10;
  const six = fixed(6, 6, 6);
  ludo.apply(s, 0, { roll: 1 }, six); ludo.apply(s, 0, { t: 0 });
  ludo.apply(s, 0, { roll: 1 }, six); ludo.apply(s, 0, { t: 0 });
  ludo.apply(s, 0, { roll: 1 }, six);
  ok(s.p === 1, 'ludo: three sixes in a row lose the turn');
}
{ // ludo score mode
  const fixed = (...rolls) => () => (rolls.shift() - 1) / 6 + 0.01;
  const s = ludo.init({ n: 2, opts: { style: 'score' } });
  s.t[0][0] = 2; s.t[1][0] = 2 + 52 - 26 + 3;
  ludo.apply(s, 0, { roll: 1 }, fixed(3));
  ludo.apply(s, 0, { t: 0 });
  ok(s.points[0] === 3 + 20, 'ludo score: 3 squares and a capture score 23');
  const h = ludo.init({ n: 2, opts: { style: 'score' } });
  h.t[0][0] = 53;
  ludo.apply(h, 0, { roll: 1 }, fixed(3));
  ludo.apply(h, 0, { t: 0 });
  ok(h.points[0] === 33, 'ludo score: a token home scores 30 more');
  const r = ludo.init({ n: 2, opts: { style: 'score' } });
  const rng = seeded(9);
  while (!ludo.result(r)) { const seat = ludo.active(r)[0]; ludo.apply(r, seat, ludo.bot(r, seat, rng, ludo.moves(r, seat)), rng); }
  ok(ludo.result(r).winners.length >= 1 && (r.ended || r.won >= 0) && r.round <= 16, 'ludo score: the game ends by round 15, most points wins');
  ok(ludo.init({ n: 4 }).style === 'normal', 'ludo: normal is the default mode');
}
{ // ludo house rules
  const fixed = (...rolls) => () => (rolls.shift() - 1) / 6 + 0.01;
  // a blockade: two red tokens on one square stop green passing
  const b = ludo.init({ n: 2, opts: { rules: { block: true } } });
  b.t[1][0] = 26 + 5 - 26; b.t[1][1] = 26 + 5 - 26;     // seat 1 (yellow side) both on absolute square 31
  b.t[0][0] = 29;                                      // seat 0 two squares behind
  ludo.apply(b, 0, { roll: 1 }, fixed(4));
  ok(!ludo.moves(b, 0).some(m => m.t === 0), 'ludo block: a token cannot pass a blockade');
  // capture before home: a token goes round again
  const c = ludo.init({ n: 2, opts: { rules: { capture: true } } });
  c.t[0][0] = 48;
  ludo.apply(c, 0, { roll: 1 }, fixed(5));
  ludo.apply(c, 0, { t: 0 });
  ok(c.t[0][0] === 2, 'ludo capture rule: without a capture the token goes round again');
  const c2 = ludo.init({ n: 2, opts: { rules: { capture: true } } });
  c2.t[0][0] = 48; c2.caps[0] = 1;
  ludo.apply(c2, 0, { roll: 1 }, fixed(5));
  ludo.apply(c2, 0, { t: 0 });
  ok(c2.t[0][0] === 53, 'ludo capture rule: after a capture the home path is open');
  ok(ludo.init({ n: 3, opts: { rules: { quick: true } } }).t.every(x => x[0] === 0), 'ludo quick start: one token out each');
  // every rule at once still finishes
  let finished = 0;
  for (let k = 0; k < 20; k++) {
    const rng = seeded(500 + k);
    const s = ludo.init({ n: 2 + (k % 3), rng, opts: { rules: { block: true, capture: true, quick: true } } });
    let steps = 0;
    while (!ludo.result(s) && steps++ < 20000) { const seat = ludo.active(s)[0]; ludo.apply(s, seat, ludo.bot(s, seat, rng, ludo.moves(s, seat)), rng); }
    if (ludo.result(s)) finished++;
  }
  ok(finished === 20, `ludo: games with every house rule finish (${finished}/20)`);
}{ // yacht scoring
  ok(points('yacht', [4, 4, 4, 4, 4]) === 50, 'yacht: five alike scores 50');
  ok(points('full', [2, 2, 3, 3, 3]) === 13 && points('full', [2, 2, 2, 2, 3]) === 0, 'yacht: full house');
  ok(points('big', [2, 3, 4, 5, 6]) === 30 && points('small', [1, 2, 3, 4, 5]) === 30 && points('small', [2, 3, 4, 5, 6]) === 0, 'yacht: straights');
  ok(points('four', [5, 5, 5, 5, 1]) === 20, 'yacht: four of a kind');
  ok(points('sixes', [6, 6, 1, 2, 6]) === 18, 'yacht: sixes');
}
{ // call break
  const s = callBreak.init({ rng: seeded(4) });
  s.phase = 'play';
  s.bids = [1, 1, 1, 1];
  s.hands = [['KH', '2H', 'AS'], ['3H', 'AH', '2S'], ['2C', '3S', '9S'], ['5C', '6C', '7C']];
  s.p = 0;
  callBreak.apply(s, 0, { c: 'KH' });
  ok(callBreak.moves(s, 1).map(m => m.c).join() === 'AH', 'call break: must beat the best card if you can');
  callBreak.apply(s, 1, { c: 'AH' });
  ok(callBreak.moves(s, 2).every(m => m.c.endsWith('S')), 'call break: out of the suit, you must trump');
  callBreak.apply(s, 2, { c: '3S' });
  ok(callBreak.moves(s, 3).length === 3, 'call break: no suit and no trump: any card');
  callBreak.apply(s, 3, { c: '5C' });
  ok(s.won[2] === 1 && s.p === 2, 'call break: the trump wins the trick, and leads next');
}
{ // reversi: the opening has four moves and flips a disc
  const s = reversi.init({});
  ok(reversi.moves(s, 0).length === 4, 'reversi: four opening moves');
  reversi.apply(s, 0, { c: reversi.moves(s, 0)[0].c });
  ok(s.b.filter(v => v === 0).length === 4 && s.b.filter(v => v === 1).length === 1, 'reversi: a move flips the trapped disc');
}
{ // mancala
  const s = mancala.init({});
  mancala.apply(s, 0, { pit: 2 });
  ok(s.p === 0 && s.b[6] === 1, 'mancala: last seed in your store: another turn');
  const c = mancala.init({});
  c.b = [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0];
  mancala.apply(c, 0, { pit: 1 });
  ok(c.b[6] === 4 && c.b[10] === 0 && c.done === true, 'mancala: an empty pit of yours captures across');
}
{ // tic-tac-toe: the bot takes a win
  const s = ticTacToe.init({});
  s.b = [0, 0, -1, 1, 1, -1, -1, -1, -1];
  const hits = Array.from({ length: 40 }, (_, i) => ticTacToe.bot(s, 0, seeded(i + 100), ticTacToe.moves(s, 0)).c === 2).filter(Boolean).length;
  ok(hits > 28, 'tic-tac-toe: the bot usually takes a winning square');
}
{ // tic-tac-toe: every open square has an accessible equivalent to the 3D board
  const s = ticTacToe.init({});
  const panel = ticTacToe.ui(s, { me: 0, active: [0], names: ['You', 'Bot'], legal: ticTacToe.moves(s, 0) });
  ok(panel.buttons.length === 9 && panel.buttons[4].label === 'Centre square' && panel.buttons[8].i === 8, 'tic-tac-toe: available squares are labeled for keyboard and screen-reader play');
  s.b[4] = 0;
  const next = ticTacToe.ui(s, { me: 0, active: [0], names: ['You', 'Bot'], legal: ticTacToe.moves(s, 0) });
  ok(next.buttons.length === 8 && next.buttons.every(b => b.label !== 'Centre square'), 'tic-tac-toe: occupied squares are not offered');
}
{ // carrom: a coin in the way moves, the striker stops within the board; a straight shot can sink a coin
  const r = simulate([{ id: 'w1', x: 0.95 - 0.1, y: -0.95 + 0.1 }], 0, { x: 0.3, a: Math.atan2(-0.95 + 0.1 - 0.72, 0.85 - 0.3), p: 0.9 });
  ok(r.frames.length > 3 && r.left.every(c => Math.abs(c.x) <= 1 && Math.abs(c.y) <= 1), 'carrom: everything stays on the board');
  ok(r.sunk.includes('w1'), 'carrom: a straight shot pockets the coin');
  const s = carrom.init({});
  ok(carrom.check(s, 0, { x: 9, a: 0, p: 9 }).x <= 1 && carrom.check(s, 0, { x: 'bad', a: 0, p: 1 }) === null, 'carrom: a shot is kept within the rules');
  ok(s.coins.length === 19 && s.coins.filter(c => c.id[0] === 'w').length === 9, 'carrom: 9 white, 9 black and the queen');
}
{ // consequences: strangers only ever see lines from our list; friends' text is tidied
  const pub = consequences.init({ n: 3, rng: r0, opts: { public: true } });
  ok(!pub.typed && consequences.moves(pub, 0).every(m => typeof m.line === 'string'), 'consequences: no typing at a public table');
  ok(consequences.check(pub, 0, { line: 'something I typed' }) === null, 'consequences: a typed line is refused at a public table');
  const own = consequences.init({ n: 3, rng: r0, opts: {} });
  ok(consequences.check(own, 0, { line: '<b>hi</b>   there' }).line === 'b hi /b there', 'consequences: typed text is tidied');
}
{ // spy: nobody learns who the spy is before the reveal
  const s = spy.init({ n: 4, rng: seeded(3) });
  const v = spy.view(s, 0);
  ok(v.reveal === null && !JSON.stringify(v).includes('"spies"'), 'spy: the view has no spy list before the end');
}

{ // the house rules and modes taken from the best-loved versions of each game
  const fixed = (...rolls) => () => (rolls.shift() - 1) / 6 + 0.01;
  const play = (game, s, rng, cap = 20000) => { let k = 0; while (!game.result(s) && k++ < cap) { const seat = game.active(s)[0]; game.apply(s, seat, game.bot(s, seat, rng, game.moves(s, seat)), rng); } return game.result(s); };

  // ludo: playing on for places gives a full finishing order
  for (let k = 0; k < 10; k++) {
    const rng = seeded(900 + k);
    const n = 3 + (k % 2);
    const s = ludo.init({ n, rng, opts: { rules: { places: true } }, names: ['A', 'B', 'C', 'D'].slice(0, n) });
    const r = play(ludo, s, rng);
    ok(r && s.order.length === n && new Set(s.order).size === n && r.winners[0] === s.order[0], `ludo places: ${n} players all get a place`);
  }
  { const s = ludo.init({ n: 2, opts: { rules: { places: true } } }); s.t[0] = [56, 56, 56, 55]; ludo.apply(s, 0, { roll: 1 }, fixed(1)); ludo.apply(s, 0, { t: 3 }); ok(s.won === 0 && !!ludo.result(s), 'ludo places: with two players the first home still wins'); }
  { // score mode never stalls when the first seat has finished
    const s = ludo.init({ n: 3, opts: { style: 'score', rules: { places: true } } }); s.order = [0]; s.p = 2; s.round = 4;
    ludo.apply(s, 2, { roll: 1 }, fixed(2));
    ok(s.round === 5, 'ludo places: rounds still count when seat 0 is out'); }

  const snakes = (await import('../src/arcade/games/snakes-and-ladders.js')).default;
  { const s = snakes.init({ n: 2, opts: { rules: { six: true } } }); snakes.apply(s, 0, { roll: 1 }, fixed(5)); ok(s.at[0] === 0 && s.p === 1, 'snakes six: no 6, no start');
    snakes.apply(s, 1, { roll: 1 }, fixed(6)); ok(s.at[1] === 1 && s.p === 1, 'snakes six: a 6 brings you on and rolls again'); }
  { const s = snakes.init({ n: 2, opts: { rules: { bounce: true } } }); s.at[0] = 97; snakes.apply(s, 0, { roll: 1 }, fixed(5)); ok(s.at[0] === 79, 'snakes bounce: 97 + 5 bounces back to 98, onto its snake');
    const t = snakes.init({ n: 2 }); t.at[0] = 97; snakes.apply(t, 0, { roll: 1 }, fixed(5)); ok(t.at[0] === 97, 'snakes: without bounce, too high stays put'); }
  { const s = snakes.init({ n: 2, opts: { rules: { three: true } } }); s.at[0] = 10; snakes.apply(s, 0, { roll: 1 }, fixed(6)); snakes.apply(s, 0, { roll: 1 }, fixed(6)); snakes.apply(s, 0, { roll: 1 }, fixed(6));
    ok(s.at[0] === 10 && s.p === 1, 'snakes three sixes: back to the start of the turn'); }

  const pig = (await import('../src/arcade/games/pig.js')).default;
  { // the players after the one who reached the target still get a turn
    const s = pig.init({ n: 3 }); s.bank = [0, 45, 0]; s.p = 1; s.run = 6;
    pig.apply(s, 1, { hold: 1 });
    ok(!pig.result(s) && s.p === 2 && s.last === 1, 'pig: reaching the target starts a last round');
    pig.apply(s, 2, { roll: 1 }, fixed(1));
    ok(s.p === 0 && !pig.result(s), 'pig: seat 0 still plays after seat 2');
    pig.apply(s, 0, { roll: 1 }, fixed(1));
    ok(pig.result(s)?.winners[0] === 1, 'pig: the game ends back at the player who got there first'); }
  { const s = pig.init({ n: 2, opts: { style: 'classic' } }); s.bank[0] = 60; s.run = 10; pig.apply(s, 0, { hold: 1 }); ok(s.last < 0, 'pig classic: 70 is not yet 100'); }
  { const s = pig.init({ n: 2, opts: { style: 'two' } }); s.bank[0] = 40; pig.apply(s, 0, { roll: 1 }, fixed(1, 1)); ok(s.bank[0] === 0 && s.p === 1, 'pig two dice: two 1s lose the bank');
    pig.apply(s, 1, { roll: 1 }, fixed(3, 3)); ok(s.run === 6 && pig.moves(s, 1).length === 1, 'pig two dice: doubles must roll again'); }
  for (const style of ['quick', 'classic', 'two']) { const rng = seeded(77); ok(!!play(pig, pig.init({ n: 3, rng, opts: { style } }), rng), `pig ${style}: finishes`); }

  { const card = { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18 };
    const y = (await import('../src/arcade/games/yacht.js')).default;
    const on = y.init({ n: 2, opts: { rules: { bonus: true } } }), off = y.init({ n: 2 });
    [on, off].forEach((s) => { s.cards = [{ ...card, choice: 20, four: 0, full: 0, small: 0, big: 0, yacht: 0 }, { ...card, sixes: 12, choice: 20, four: 0, full: 0, small: 0, big: 0, yacht: 0 }]; s.done = true; });
    ok(y.result(on).scores[0] === 63 + 20 + 35 && y.result(on).scores[1] === 57 + 20, 'yacht bonus: 63 in the top half earns 35, 57 does not');
    ok(y.result(off).scores[0] === 83, 'yacht: no bonus unless the house rule is on'); }

  const clash = (await import('../src/arcade/games/color-clash.js')).default;
  { const s = clash.init({ n: 3, rng: seeded(3), opts: { rules: { stack: true } } });
    s.hands = [['RD', 'G5'], ['BD', 'Y1'], ['Y2', 'Y3']]; s.colour = 'R'; s.pile = ['R4']; s.p = 0;
    clash.apply(s, 0, { c: 'RD' }, seeded(1));
    ok(s.owe === 2 && s.p === 1 && s.hands[1].length === 2, 'clash stack: a +2 waits for the next player');
    ok(clash.moves(s, 1).some(m => m.c === 'BD') && clash.moves(s, 1).some(m => m.take), 'clash stack: pass it on or take it');
    clash.apply(s, 1, { c: 'BD' }, seeded(1));
    ok(s.owe === 4 && s.p === 2, 'clash stack: it grows');
    clash.apply(s, 2, { take: 1 }, seeded(1));
    ok(s.hands[2].length === 6 && s.owe === 0 && s.p === 0, 'clash stack: whoever takes it draws the lot and misses the turn'); }
  { const s = clash.init({ n: 2, rng: seeded(4), opts: { rules: { till: true } } }); s.hands[0] = ['G5']; s.colour = 'R'; s.pile = ['R4'];
    clash.apply(s, 0, { draw: 1 }, seeded(2));
    ok(s.hands[0].some(c => c[0] === 'W' || c[0] === 'R' || c.slice(1) === '4') || !s.stock.length, 'clash till: draws until a card fits'); }

  const eights = (await import('../src/arcade/games/crazy-eights.js')).default;
  { const s = eights.init({ n: 3, rng: seeded(5), opts: { rules: { twos: true, jacks: true, aces: true } } });
    s.pile = ['5H']; s.suit = 'H'; s.hands = [['2H', 'JH', 'AH', '9C'], ['2S', '4D'], ['6D', '7D']]; s.p = 0;
    eights.apply(s, 0, { c: '2H' }, seeded(1));
    ok(s.owe === 2 && s.p === 1 && eights.moves(s, 1).some(m => m.c === '2S'), 'eights twos: the next player may pass a 2 on');
    eights.apply(s, 1, { c: '2S' }, seeded(1));
    eights.apply(s, 2, { take: 1 }, seeded(1));
    ok(s.hands[2].length === 6 && s.p === 0, 'eights twos: four picked up');
    eights.apply(s, 0, { c: 'JH' }, seeded(1)); ok(s.p === 2, 'eights jacks: the next player is skipped');
    s.p = 0; eights.apply(s, 0, { c: 'AH' }, seeded(1)); ok(s.dir === -1 && s.p === 2, 'eights aces: the direction turns round'); }
  { const rng = seeded(6); ok(!!play(eights, eights.init({ n: 4, rng, opts: { rules: { twos: true, jacks: true, aces: true } } }), rng), 'eights: every house rule still finishes'); }
}

console.log(`\n${failures ? `${failures} FAILED` : 'All good'} · ${passed} checks passed`);
process.exit(failures ? 1 : 0);
