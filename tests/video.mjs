/**
 * The TV games, tested without a browser:  node tests/video.mjs
 * Bots play every game at every table size. The state must survive JSON (it crosses the network),
 * every game must end, and bots must be good enough to be worth playing, but not unbeatable.
 */
import { VIDEO_GAMES } from '../src/arcade/catalog.js';

let failures = 0;
const fail = (m) => { failures += 1; console.error(`  ✗ ${m}`); };
const LIMIT = 60 * 60 * 12;    // twelve minutes of play
for (const g of VIDEO_GAMES) {
  const game = (await import(`../src/arcade/video/${g.slug}.js`)).default;
  for (let n = g.min; n <= g.max; n++) {
    let sumTicks = 0, sumTop = 0, bytes = 0;
    const runs = 12;
    for (let k = 0; k < runs; k++) {
      let s = game.init({ n, seed: k * 77 + n });
      let t = 0, r = null;
      while (!(r = game.over(s)) && t < LIMIT) {
        game.step(s, Array.from({ length: n }, (_, i) => game.bot(s, i)));
        s.ev.length = 0;
        t += 1;
        if (t % 240 === 0) { const j = JSON.stringify(s); bytes = Math.max(bytes, j.length); s = JSON.parse(j); }
      }
      if (!r) { fail(`${g.slug} (${n} players, run ${k}) never ended in 12 minutes`); continue; }
      if (r.scores.length !== n || r.scores.some(v => !Number.isFinite(v))) fail(`${g.slug}: bad scores ${r.scores}`);
      sumTicks += t;
      sumTop += Math.max(...r.scores);
    }
    console.log(`${g.slug.padEnd(14)} ${n}p · avg game ${(sumTicks / runs / 60).toFixed(0)}s · avg best score ${(sumTop / runs).toFixed(1)} · state ${bytes} bytes`);
  }
  // an idle player loses in an endless game; a game with an opponent still finishes
  const s = game.init({ n: g.min, seed: 5 });
  let t = 0;
  while (!game.over(s) && t < LIMIT) { game.step(s, Array.from({ length: g.min }, (_, i) => (g.max === 2 && g.min === 2 && i === 1 ? game.bot(s, i) : {}))); s.ev.length = 0; t += 1; }
  if (!game.over(s)) fail(`${g.slug}: an idle player never ends the game`);
}
const flying = (await import('../src/arcade/video/flying-chit.js')).default;
{
  const s = flying.init({ n: 1, seed: 3 });
  for (let i = 0; i < 30; i++) flying.step(s, [{ x: 1, y: -1 }]);
  if (!(s.chits[0].x > 0.3 && s.chits[0].y > 0.3)) fail('flying chit: the stick steers right and up');
  if (!(s.chits[0].lift < 1)) fail('flying chit: lift runs down over time');
}
const tunnel = await import('../src/arcade/video/tunnel-race.js');
{
  if (!tunnel.blocks({ k: 'wall', c: 0, w: 1 }, 0.1) || tunnel.blocks({ k: 'wall', c: 0, w: 1 }, 2)) fail('tunnel: a wall blocks only its own side');
  if (tunnel.blocks({ k: 'gap', c: 1, w: 1.4 }, 1) || !tunnel.blocks({ k: 'gap', c: 1, w: 1.4 }, 3)) fail('tunnel: a gap lets you through only in the gap');
  for (const [key, sign] of [['u', 1], ['d', -1]]) {
    const s = tunnel.default.init({ n: 1, seed: 4 });
    const before = s.planes[0].a;
    tunnel.default.step(s, [{ [key]: true }]);
    const delta = Math.atan2(Math.sin(s.planes[0].a - before), Math.cos(s.planes[0].a - before));
    if (Math.sign(delta) !== sign) fail(`tunnel: ${key} steers ${sign > 0 ? 'right' : 'left'}`);
  }
}
// Turbo Tunnel is fair: a driver who keeps to the sure way through every row never crashes, and the
// way through every row is clear of everything that ends a run
{
  const turbo = await import('../src/arcade/video/turbo-tunnel.js');
  const { default: game, KINDS, CAR, turnTo } = turbo;
  for (let seed = 1; seed <= 12; seed++) {
    const s = game.init({ n: 1, seed });
    let t = 0;
    while (!game.over(s) && t < 60 * 60 * 4) {
      const row = s.path.find(([z]) => z > s.d - 0.3);
      // the opening rows come before the first marked one: hold the start line, which they keep clear
      const x = row ? Math.max(-1, Math.min(1, turnTo(row[1], s.cars[0].a) * 5)) : 0;
      game.step(s, [{ x }]);
      for (const [z, a] of s.path) {
        const bad = s.obs.find(o => o.z === z && KINDS[o.k].lethal && (o.k === 'gate' ? Math.abs(turnTo(a, o.c)) > o.w - CAR : Math.abs(turnTo(a, o.c)) < (o.w || KINDS[o.k].hw) + CAR));
        if (bad) { fail(`turbo tunnel (seed ${seed}): the way through at ${z} is blocked by a ${bad.k}`); t = Infinity; break; }
      }
      s.ev.length = 0; t += 1;
    }
    if (game.over(s)) fail(`turbo tunnel (seed ${seed}): a driver on the sure way through crashed at ${s.d} (level ${s.level})`);
  }
  // steering: right turns one way, left the other; oil slows the wheel but doesn't end the run
  const s = game.init({ n: 1, seed: 9 });
  const a0 = s.cars[0].a;
  game.step(s, [{ r: true }]);
  if (!(turnTo(s.cars[0].a, a0) > 0)) fail('turbo tunnel: right steers the car round');
  s.obs.push({ k: 'oil', z: s.d + 0.1, c: s.cars[0].a });
  game.step(s, [{}]);
  if (!s.cars[0].alive || !(s.cars[0].slip > 0)) fail('turbo tunnel: oil makes the car slide without ending the run');
}
// Reaction Time is fair: each phone's own measured time counts, however late it reaches the host;
// guesses under 100 ms and taps before GO are false starts
{
  const { default: game } = await import('../src/arcade/video/reaction-time.js');
  const s = game.init({ n: 2, seed: 3 }); let t = 0, arrive = null;
  while (!game.over(s) && t < 60 * 120) {
    let friend = {};
    if (s.phase === 'go' && arrive == null) arrive = s.t + 36;          // the tap reaches the host 0.6 s late
    if (arrive != null && s.phase === 'go' && s.t >= arrive) friend = { a: true, rr: s.round, rt: 250 };
    if (s.phase === 'show') arrive = null;
    game.step(s, [friend, game.bot(s, 1)]); s.ev.length = 0; t += 1;
  }
  if (s.players[0].times.some(v => v !== 250)) fail(`reaction time: a late-arriving 250 ms tap was not counted as 250 (${s.players[0].times})`);
  const g = game.init({ n: 1, seed: 1 }); while (g.phase !== 'go') game.step(g, [{}]);
  game.step(g, [{ a: true, rr: g.round, rt: 60 }]);
  if (g.players[0].now !== 'early') fail('reaction time: a 60 ms tap must count as a guess');
  const e = game.init({ n: 1, seed: 1 }); game.step(e, [{ a: true, early: 1 }]);
  if (e.players[0].now !== 'early') fail('reaction time: a tap before GO must be a false start');
}
// Stroop Test: the right answer counts with the phone's own time, a wrong one scores nothing,
// and an answer meant for an earlier card is ignored
{
  const { default: game, COLORS } = await import('../src/arcade/video/stroop-test.js');
  const s = game.init({ n: 1, seed: 2 }); let t = 0;
  while (!game.over(s) && t < 60 * 180) {
    let inp = {};
    if (s.phase === 'card' && s.t - s.goAt > 50) { const want = COLORS[s.cardNow.ask === 'ink' ? s.cardNow.ink : s.cardNow.word].key; inp = { [want]: true, rr: s.card, rt: 650, pick: want }; }
    game.step(s, [inp]); s.ev.length = 0; t += 1;
  }
  if (s.players[0].right !== 15 || s.players[0].score !== 15 * 135) fail(`stroop: a perfect late player should score 2025 (${s.players[0].score})`);
  const w = game.init({ n: 1, seed: 5 }); while (w.phase !== 'card') game.step(w, [{}]);
  game.step(w, [{ rr: w.card - 1, rt: 400, pick: 'l' }]);
  if (w.players[0].now !== null) fail('stroop: an answer for an earlier card must be ignored');
  const wrong = COLORS.find(c => c.key !== COLORS[w.cardNow.ask === 'ink' ? w.cardNow.ink : w.cardNow.word].key).key;
  game.step(w, [{ rr: w.card, rt: 500, pick: wrong }]);
  if (w.players[0].now?.ok !== false || w.players[0].score !== 0) fail('stroop: a wrong answer scores nothing');
}
// Number Memory: a perfect player with late-arriving answers goes all the way; friends' phones get
// dots, not the number, while people are answering
{
  const { default: game } = await import('../src/arcade/video/number-memory.js');
  const s = game.init({ n: 1, seed: 2 }); let t = 0;
  while (!game.over(s) && t < 60 * 900) { const inp = s.phase === 'answer' && s.t - s.phaseT > 40 ? { rr: s.round, ans: s.number, rt: 3000 } : {}; game.step(s, [inp]); s.ev.length = 0; t += 1; }
  if (s.players[0].best !== 20) fail(`number memory: a perfect player should reach 20 digits (${s.players[0].best})`);
  const p = game.init({ n: 2, seed: 1 }); while (p.phase !== 'answer') game.step(p, [{}, {}]);
  if (/\d/.test(game.publicState(p, 1).number)) fail('number memory: the number must not be sent to friends while they answer');
  game.step(p, [{ rr: p.round, ans: '000', rt: 900 }, {}]);
  if (p.players[0].ans !== '000') fail('number memory: a typed answer must be taken');
}
// Word Guess: points come from the player's own time, one guess per word, lowercase typing counts,
// and friends' phones get only the letters already showing
{
  const { default: game, pointsFor, WORDS } = await import('../src/arcade/video/word-guess.js');
  if (pointsFor(6, 0) !== 60 || pointsFor(6, 1500) !== 50 || pointsFor(6, 60000) !== 20) fail('word guess: points by hidden letters are off');
  if (Object.values(WORDS).flat().some(w => !/^[A-Z]{4,8}$/.test(w))) fail('word guess: every word must be 4 to 8 capital letters');
  const s = game.init({ n: 1, seed: 5 }); let t = 0;
  while (!game.over(s) && t < 60 * 900) { const inp = s.phase === 'guess' && s.t - s.phaseT > 200 ? { rr: s.round, ans: s.word.toLowerCase(), rt: 3000 } : {}; game.step(s, [inp]); s.ev.length = 0; t += 1; }
  if (s.players[0].right !== 8) fail(`word guess: a perfect player should get all eight words (${s.players[0].right})`);
  const p = game.init({ n: 2, seed: 1 }); for (let i = 0; i < 100; i++) game.step(p, [{}, {}]);
  const seen = game.publicState(p, 1).word;
  if (seen === p.word || !seen.includes('_') || seen.length !== p.word.length) fail('word guess: the word must not be sent to friends while they guess');
  game.step(p, [{ rr: p.round, ans: 'WRONG', rt: 900 }, {}]);
  game.step(p, [{ rr: p.round, ans: p.word, rt: 1000 }, {}]);
  if (p.players[0].guess?.ok !== false || p.players[0].score !== 0) fail('word guess: only the first guess on a word counts');
}
// Fast Typing: speed scores from the player's own time, a wrong letter scores nothing, one try a word
{
  const { default: game, pointsFor } = await import('../src/arcade/video/fast-typing.js');
  if (pointsFor(6, 2000) !== 30 || pointsFor(4, 60000) !== 5 || pointsFor(10, 100) !== 60) fail('fast typing: points by speed are off');
  const s = game.init({ n: 1, seed: 4 }); let t = 0;
  while (!game.over(s) && t < 60 * 900) { const inp = s.phase === 'type' && s.t - s.phaseT > 150 ? { rr: s.round, ans: s.word.toLowerCase(), rt: 2000 } : {}; game.step(s, [inp]); s.ev.length = 0; t += 1; }
  if (s.players[0].right !== 10) fail(`fast typing: a perfect typist should get all ten words (${s.players[0].right})`);
  const p = game.init({ n: 2, seed: 1 }); while (p.phase !== 'type') game.step(p, [{}, {}]);
  game.step(p, [{ rr: p.round, ans: p.word.slice(0, -1) + 'Q', rt: 900 }, {}]);
  game.step(p, [{ rr: p.round, ans: p.word, rt: 1000 }, {}]);
  if (p.players[0].now?.ok !== false || p.players[0].score !== 0) fail('fast typing: only the first try on a word counts');
}
// Bingo: friends' phones get only their own card; a number already called can be typed again;
// one number finishing two cards goes to more lines, then to the caller; games always end
{
  const { default: game } = await import('../src/arcade/video/bingo.js');
  const p = game.init({ n: 3, seed: 1 });
  if (game.publicState(p, 1).players.some((x, i) => (i === 1) !== !!x.card)) fail('bingo: a phone must get its own card only');
  const turn = p.turn, rr = p.round, inp = []; inp[turn] = { rr, ans: '99', rt: 400 }; game.step(p, inp);
  if (p.phase !== 'call' || p.turn !== turn || p.round !== rr + 1) fail('bingo: a bad number must let the caller try again');
  for (const n of [2, 3, 4]) for (let seed = 1; seed < 12; seed++) {
    const s = game.init({ n, seed }); let t = 0, r;
    while (!(r = game.over(s)) && t < 60 * 900) { game.step(s, Array.from({ length: n }, (_, i) => game.bot(s, i))); s.ev.length = 0; t += 1; }
    if (!r || r.winners.length !== 1 && !r.winners.every(w => r.scores[w] === Math.max(...r.scores))) fail(`bingo: game ${n}p seed ${seed} did not end well`);
    if (r && r.winners.some(w => r.scores[w] < 5)) fail('bingo: a winner needs five lines');
  }
}
// Unblock Puzzle: every lot is valid and can be done in exactly its par; a drag slides a vehicle only
// up to the first thing in its way, and counts as one move
{
  const { default: game, LOTS, parse, bestMove, grid, boardBox, N } = await import('../src/arcade/video/unblock-puzzle.js');
  for (const code of Object.values(LOTS).flat()) {
    const { vehicles, pos, par } = parse(code); const p = pos.slice(); let m = 0;
    if (!vehicles[0].h || vehicles[0].fix !== 2) fail(`unblock: the rickshaw must be across row 3 (${code})`);
    while (p[0] !== N - 2 && m < 60) { const [i, to] = bestMove(vehicles, p); p[i] = to; m += 1; }
    if (m !== par) fail(`unblock: ${code} takes ${m} moves, not its par ${par}`);
  }
  const s = game.init({ n: 1, seed: 1 }), pl = s.players[0], b = boardBox(0, 1);
  const g = grid(s.vehicles, pl.pos);
  const i = s.vehicles.findIndex((v, k) => k > 0 && !v.h), v = s.vehicles[i];
  if (i > 0) {
    const cell = g.indexOf(i), x = b.x + (cell % N + 0.5) * b.cell, y = b.y + (Math.floor(cell / N) + 0.5) * b.cell;
    game.step(s, [{ drag: { x0: x, y0: y, x1: x, y1: y + 9 * b.cell } }]);
    const after = grid(s.vehicles, pl.pos);
    if (pl.moves > 1 || after.filter(c => c === i).length !== v.len) fail('unblock: a drag must be one move and keep the vehicle whole');
    if (s.vehicles.some((w, k) => after.filter(c => c === k).length !== w.len)) fail('unblock: vehicles must never overlap');
  }
  for (const n of [1, 2]) { const r = game.init({ n, seed: 5 }); let t = 0, o; while (!(o = game.over(r)) && t < 60 * 1500) { game.step(r, Array.from({ length: n }, (_, k) => game.bot(r, k))); r.ev.length = 0; t += 1; } if (!o) fail('unblock: a game with computer players must end'); }
}
// the playground tag games: rules as children play them
{
  const tagGames = Object.fromEntries(await Promise.all(['baraf-pani', 'lapa-chupi', 'pakda-padi'].map(async slug => [slug, (await import(`../src/arcade/video/${slug}.js`)).default])));
  const play = (game, n, seed) => { const s = game.init({ n, seed }); let t = 0, r; while (!(r = game.over(s)) && t < 60 * 60 * 3) { game.step(s, Array.from({ length: n }, (_, i) => game.bot(s, i))); s.ev.length = 0; t += 1; } return { s, r, t }; };
  for (const [slug, game] of Object.entries(tagGames)) {
    if (new Set([0, 1, 2, 3, 4, 5].map(seed => game.init({ n: 4, seed }).it)).size < 2) fail(`${slug}: "it" is always the same seat`);
    for (const n of [3, 4]) for (let seed = 0; seed < 6; seed++) {
      const { r } = play(game, n, seed);
      const top = Math.max(...r.scores);
      if (slug !== 'pakda-padi' && r.winners.some(w => r.scores[w] < top)) fail(`${slug}: a winner scored less than a loser (${r.scores}, winners ${r.winners})`);
    }
  }
  if (VIDEO_GAMES.find(g => g.slug === 'baraf-pani').min < 3) fail('baraf pani: freeze tag needs at least three players');
  // freeze tag: "it" counts to three before chasing
  { const s = tagGames['baraf-pani'].init({ n: 3, seed: 1 }); const x0 = s.players[s.it].x; for (let t = 0; t < 120; t++) { tagGames['baraf-pani'].step(s, [{ x: 1 }, { x: 1 }, { x: 1 }]); s.ev.length = 0; } if (s.players[s.it].x !== x0) fail('baraf pani: "it" moved before counting to three'); }
  // hide and seek: the seeker stays put, eyes shut, while the others hide
  { const s = tagGames['lapa-chupi'].init({ n: 3, seed: 2 }); const p0 = { ...s.players[s.it] }; for (let t = 0; t < 200; t++) { tagGames['lapa-chupi'].step(s, [{ x: 1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: -1 }]); s.ev.length = 0; } if (s.players[s.it].x !== p0.x || s.players[s.it].y !== p0.y) fail('lapa chupi: the seeker moved while the others were hiding'); }
  // a fair game: matches with computer players last a while, they don't end in a few seconds
  for (const slug of ['baraf-pani', 'lapa-chupi']) for (const n of [3, 4]) {
    const secs = [0, 1, 2, 3, 4, 5].map(seed => play(tagGames[slug], n, seed).t / 60).sort((a, b) => a - b);
    if (secs[3] < 12) fail(`${slug} (${n} players): matches are over too soon (median ${secs[3].toFixed(0)}s)`);
  }
}
console.log(failures ? `\n${failures} FAILED` : '\nAll good');
process.exit(failures ? 1 : 0);
