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
}
console.log(failures ? `\n${failures} FAILED` : '\nAll good');
process.exit(failures ? 1 : 0);
