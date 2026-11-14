/**
 * Makes a WebP copy of every picture the website's pages show, next to the original:
 *   assets/games/<slug>.webp, assets/games/<slug>-square.webp, assets/chitplay-game.webp, assets/logo.webp
 * The pages show the WebP (a third of the size or less); the JPG and PNG stay for link previews
 * (WhatsApp, Facebook and some search features still want JPG or PNG) and as the originals.
 *
 * The game itself needs none of this: its icons, coins, badges, characters, portraits and 3D
 * textures are drawn by code (SVG and canvas), so they cost no download at all.
 *
 * Needs Google Chrome installed (its WebP encoder does the work). Run it after make-game-images.mjs:
 *     node tools/make-webp.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'assets');
// what the pages show; the app icons stay PNG (phones and browsers ask for PNG by name)
const requestedSlugs = process.argv.slice(2);
const gameJpgs = fs.readdirSync(path.join(ASSETS, 'games'))
  .filter(f => f.endsWith('.jpg') && (!requestedSlugs.length || requestedSlugs.includes(f.replace(/(?:-square)?\.jpg$/, ''))));
const foundSlugs = new Set(gameJpgs.map(f => f.replace(/(?:-square)?\.jpg$/, '')));
const missingSlugs = requestedSlugs.filter(slug => !foundSlugs.has(slug));
if (missingSlugs.length) throw new Error(`Missing game image(s): ${missingSlugs.join(', ')}`);
const files = [
  ...gameJpgs.map(f => path.join(ASSETS, 'games', f)),
  ...(!requestedSlugs.length ? [path.join(ASSETS, 'chitplay-game.jpg'), path.join(ASSETS, 'logo.png')] : []),
].filter(f => fs.existsSync(f));

const port = 9400 + Math.floor(Math.random() * 400);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-webp-'));
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => fs.existsSync(p));
if (!chromePath) { console.error('Google Chrome not found'); process.exit(1); }
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} }
if (!target) { console.error('Chrome did not start'); chrome.kill(); process.exit(1); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const wait = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

// the picture goes in as a data URL (a file:// page can't read pixels back from a file:// image)
const encode = async (file) => {
  const png = file.endsWith('.png');
  const src = `data:image/${png ? 'png' : 'jpeg'};base64,${fs.readFileSync(file).toString('base64')}`;
  const quality = png ? 0.92 : 0.8;
  const r = await send('Runtime.evaluate', {
    awaitPromise: true, returnByValue: true,
    expression: `(async () => {
      const img = new Image(); img.src = ${JSON.stringify(src)}; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      const blob = await new Promise(done => c.toBlob(done, 'image/webp', ${quality}));
      if (!blob || blob.type !== 'image/webp') return null;
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    })()`,
  });
  const b64 = r.result?.result?.value;
  if (!b64) throw new Error(`could not encode ${file}`);
  return Buffer.from(b64, 'base64');
};

let before = 0, after = 0;
try {
  for (const file of files) {
    const buf = await encode(file);
    fs.writeFileSync(file.replace(/\.(jpg|png)$/, '.webp'), buf);
    before += fs.statSync(file).size;
    after += buf.length;
  }
} finally {
  ws.close();
  chrome.kill();
  try { fs.rmSync(prof, { recursive: true, force: true }); } catch { /* Chrome may still hold it for a moment */ }
}
console.log(`${files.length} pictures: ${(before / 1024).toFixed(0)} KB as JPG/PNG, ${(after / 1024).toFixed(0)} KB as WebP (${Math.round((1 - after / before) * 100)}% smaller)`);
