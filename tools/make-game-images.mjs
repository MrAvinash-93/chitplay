/**
 * Draws the picture each game shows in search results and link previews:
 *   assets/games/<slug>.jpg         1200 x 630 (link previews, Google Discover)
 *   assets/games/<slug>-square.jpg  600 x 600  (search results, structured data)
 * from the same logo the game list uses, so they always match.
 *
 * Needs Google Chrome installed. Run it again when a game is added or renamed:
 *     node tools/make-game-images.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'games');
fs.mkdirSync(OUT, { recursive: true });
globalThis.document ??= undefined;
const { ALL_GAMES } = await import('../src/arcade/catalog.js');
const { RULES } = await import('../src/arcade/rules.js');
const { logoSvg } = await import('../src/arcade/logo.js');

const MAIN = { slug: 'cops-and-robbers', name: 'Raja Rani Chor Police', kind: 'Party', accent: '#b5341f', icon: '👑' };
const games = [MAIN, ...ALL_GAMES];
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tagline = (g) => (g.slug === MAIN.slug ? 'Cops and Robbers · the 4-chit game' : `${g.min === g.max ? g.min : `${g.min}–${g.max}`} players · ${g.kind} game`);

const page = (g, w, h) => {
  const square = w === h;
  const logo = logoSvg(g, square ? 330 : 400);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
body{display:flex;${square ? 'flex-direction:column;justify-content:center;gap:22px' : 'gap:56px;padding:0 70px;box-sizing:border-box'};align-items:center;
background:radial-gradient(ellipse 80% 90% at 28% 40%, ${g.accent || '#b5341f'}66, transparent 70%),linear-gradient(160deg,#2a1509,#110804);font-family:"Segoe UI",system-ui,sans-serif;color:#fff3d6}
.logo{filter:drop-shadow(0 18px 30px rgba(0,0,0,.55));flex:none;line-height:0}
.txt{display:flex;flex-direction:column;gap:14px;${square ? 'align-items:center;text-align:center' : ''}}
h1{margin:0;font-size:${square ? 50 : 76}px;line-height:1.05;color:#ffd27a;font-weight:900;letter-spacing:-.5px;text-shadow:0 4px 0 #5a2a0c}
p{margin:0;font-size:${square ? 24 : 32}px;font-weight:600;opacity:.92}
.cta{display:inline-block;align-self:${square ? 'center' : 'flex-start'};margin-top:8px;padding:12px 26px;border-radius:16px;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6;font-size:${square ? 24 : 30}px;font-weight:800}
.site{font-size:${square ? 20 : 24}px;opacity:.75;font-weight:700;letter-spacing:1px}
</style></head><body><div class="logo">${logo}</div><div class="txt">
<h1>${esc(g.name)}</h1>${square ? '' : `<p>${esc(tagline(g))}</p>`}<span class="cta">▶ Play free online</span><span class="site">CHITPLAY.COM</span></div></body></html>`;
};

const port = 9400 + Math.floor(Math.random() * 400);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-img-'));
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => fs.existsSync(p));
if (!chromePath) { console.error('Google Chrome not found'); process.exit(1); }
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const wait = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');

let bytes = 0;
for (const g of games) {
  if (g !== MAIN && !RULES[g.slug]) continue;
  for (const [w, h, suffix] of [[1200, 630, ''], [600, 600, '-square']]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    const tmp = path.join(prof, `${g.slug}${suffix}.html`);
    fs.writeFileSync(tmp, page(g, w, h));
    await send('Page.navigate', { url: `file:///${tmp.replace(/\\/g, '/')}` });
    await sleep(350);
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    const buf = Buffer.from(r.result.data, 'base64');
    bytes += buf.length;
    fs.writeFileSync(path.join(OUT, `${g.slug}${suffix}.jpg`), buf);
  }
}
// the home page's picture: what ChitPlay is, at a glance, with the games people search for most
const FEATURED = ['ludo', 'carrom', 'chess', 'call-break', 'color-clash', 'snakes-and-ladders', 'flying-chit'];
const tiles = [MAIN, ...FEATURED.map(s => ALL_GAMES.find(g => g.slug === s)).filter(Boolean)].map(g => `<div class="t">${logoSvg(g, 150)}</div>`).join('');
const home = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{display:flex;align-items:center;gap:40px;padding:0 56px;box-sizing:border-box;font-family:"Segoe UI",system-ui,sans-serif;color:#fff3d6;
background:radial-gradient(ellipse 70% 90% at 20% 40%,#b5341f77,transparent 70%),linear-gradient(160deg,#2a1509,#110804)}
.l{display:flex;flex-direction:column;gap:14px;width:440px;flex:none}
.brand{display:flex;align-items:center;gap:16px}.brand svg{width:84px;height:84px}
h1{margin:0;font-size:66px;line-height:1;color:#ffd27a;font-weight:900;letter-spacing:2px;text-shadow:0 4px 0 #5a2a0c}
h2{margin:0;font-size:40px;line-height:1.1;font-weight:900}
p{margin:0;font-size:24px;font-weight:600;opacity:.9}
.cta{align-self:flex-start;margin-top:6px;padding:12px 26px;border-radius:16px;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6;font-size:28px;font-weight:800}
.g{display:grid;grid-template-columns:repeat(4,150px);gap:14px}.t{line-height:0;filter:drop-shadow(0 10px 16px rgba(0,0,0,.5))}
</style></head><body><div class="l"><div class="brand">${fs.readFileSync(path.join(ROOT, 'assets', 'icon.svg'), 'utf8').replace(/<\?xml[^>]*>/, '')}<h1>CHITPLAY</h1></div>
<h2>30+ free indoor games</h2><p>Raja Rani Chor Police, Ludo, Carrom, Chess, card and arcade games in 3D</p><span class="cta">▶ Play free · chitplay.com</span></div>
<div class="g">${tiles}</div></body></html>`;
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
const homeTmp = path.join(prof, 'home.html');
fs.writeFileSync(homeTmp, home);
await send('Page.navigate', { url: `file:///${homeTmp.replace(/\\/g, '/')}` });
await sleep(500);
const homeShot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
fs.writeFileSync(path.join(ROOT, 'assets', 'home.jpg'), Buffer.from(homeShot.result.data, 'base64'));
console.log(`${games.length} games, ${(bytes / 1024 / 1024).toFixed(2)} MB in assets/games/, and assets/home.jpg`);
ws.close(); chrome.kill();
process.exit(0);
