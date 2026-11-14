/**
 * Capture real 3D gameplay previews for the SEO guides:
 *   assets/gameplay/<slug>.jpg  1200 x 630
 *
 * The app is served locally and opened in headless Chrome; no external service is used.
 * Run all games, or pass slugs to refresh a subset:
 *     node tools/make-gameplay-images.mjs
 *     node tools/make-gameplay-images.mjs ludo chess
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdirSync, mkdtempSync, readFile, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, 'assets', 'gameplay');
const WIDTH = 1200;
const HEIGHT = 630;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const { ALL_GAMES } = await import('../src/arcade/catalog.js');
const MAIN_GAME = { slug: 'cops-and-robbers', min: 4, max: 4 };
const GUIDE_GAMES = [MAIN_GAME, ...ALL_GAMES];
const requested = process.argv.slice(2);
const unknown = requested.filter((slug) => !GUIDE_GAMES.some((game) => game.slug === slug));
if (unknown.length) throw new Error(`Unknown game slug(s): ${unknown.join(', ')}`);
const games = requested.length ? GUIDE_GAMES.filter((game) => requested.includes(game.slug)) : GUIDE_GAMES;
mkdirSync(OUT, { recursive: true });

const server = createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  const file = resolve(ROOT, `.${pathname}`);
  const rel = relative(ROOT, file);
  if (rel.startsWith(`..${sep}`) || rel === '..') {
    res.writeHead(403).end('Forbidden');
    return;
  }
  let target = file;
  try { if (statSync(target).isDirectory()) target = join(target, 'index.html'); } catch {}
  readFile(target, (error, data) => {
    if (error) {
      res.writeHead(404).end('Not found');
      return;
    }
    const ext = target.slice(target.lastIndexOf('.')).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

const chromePath = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((candidate) => existsSync(candidate));
if (!chromePath) throw new Error('Google Chrome not found; gameplay previews need a local Chrome install.');

await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(0, '127.0.0.1', resolveListen);
});
const origin = `http://127.0.0.1:${server.address().port}`;
const profileDir = mkdtempSync(join(tmpdir(), 'chitplay-gameplay-'));
const portProbe = createServer();
await new Promise((resolveListen, rejectListen) => {
  portProbe.once('error', rejectListen);
  portProbe.listen(0, '127.0.0.1', resolveListen);
});
const port = portProbe.address().port;
await new Promise((resolveClose) => portProbe.close(resolveClose));
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  'about:blank',
], { stdio: 'ignore' });

let ws;
const failures = [];
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((tab) => tab.type === 'page'); } catch {}
  }
  if (!target) throw new Error('Headless Chrome did not open a debugging page.');

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await once(ws, 'open');
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const resolveMessage = pending.get(message.id);
    if (!resolveMessage) return;
    pending.delete(message.id);
    if (message.error) resolveMessage.reject(new Error(message.error.message));
    else resolveMessage.resolve(message);
  });
  const send = (method, params = {}) => new Promise((resolveMessage, rejectMessage) => {
    const id = ++nextId;
    pending.set(id, { resolve: resolveMessage, reject: rejectMessage });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
  });

  for (const game of games) {
    try {
      if (game.slug === MAIN_GAME.slug) {
        await send('Page.navigate', { url: `${origin}/?game=raja-rani-chor-police&lang=en` });
        let ready = false;
        let lastState;
        for (let i = 0; i < 80; i++) {
          await sleep(500);
          const step = await send('Runtime.evaluate', {
            expression: `(() => {
              const buttons = [...document.querySelectorAll('button')];
              const button = buttons.find((item) => item.textContent.trim() === 'Skip for now')
                || buttons.find((item) => /Collect \\d+ coins/.test(item.textContent.trim()))
                || buttons.find((item) => item.textContent.includes('Guest Play'));
              if (button) {
                const action = button.textContent.trim();
                button.click();
                return { action, body: document.body.innerText.slice(-240) };
              }
              const body = document.body.innerText;
              const playing = [...document.querySelectorAll('button')].some((item) => item.getAttribute('aria-label') === 'Game menu');
              return { ready: !!document.querySelector('canvas') && playing, body: body.slice(-240), title: document.title };
            })()`,
            returnByValue: true,
          });
          const value = step.result?.result?.value;
          lastState = value;
          if (value?.ready) { ready = true; break; }
          if (!value?.action) continue;
          await sleep(900);
        }
        if (!ready) throw new Error(`the four-player game did not reach its live table (${JSON.stringify(lastState)})`);
        await sleep(1500);
      } else {
        const players = Math.min(game.max, Math.max(game.min, 2));
        await send('Page.navigate', {
          url: `${origin}/play/?game=${encodeURIComponent(game.slug)}&mode=play&n=${players}&lang=en`,
        });
        let ready = false;
        for (let i = 0; i < 40; i++) {
          await sleep(500);
          const probe = await send('Runtime.evaluate', {
            expression: `(() => {
              const root = document.querySelector('#party');
              const guide = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Got it!');
              if (guide) guide.click();
              return !!root?.children.length && !!document.querySelector('canvas');
            })()`,
            returnByValue: true,
          });
          if (probe.result?.result?.value) { ready = true; break; }
        }
        if (!ready) throw new Error('game screen or 3D canvas did not become ready');
        await sleep(4500);
        for (let attempt = 0; attempt < 10; attempt++) {
          const dismiss = await send('Runtime.evaluate', {
            expression: `(() => {
              const button = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === 'Got it!');
              if (!button) return false;
              button.click();
              return true;
            })()`,
            returnByValue: true,
          });
          if (!dismiss.result?.result?.value) break;
          await sleep(500);
        }
        let state;
        for (let attempt = 0; attempt < 12; attempt++) {
          state = await send('Runtime.evaluate', {
            expression: `({
              game: document.body.innerText.trim().length > 0,
              guide: [...document.querySelectorAll('[role="dialog"]')].some((dialog) => /how to play/i.test(dialog.getAttribute('aria-label') || ''))
            })`,
            returnByValue: true,
          });
          if (state.result?.result?.value?.game && !state.result?.result?.value?.guide) break;
          await sleep(500);
        }
        if (state.result?.result?.value?.guide) throw new Error('the how-to-play sheet did not close');
        if (!state.result?.result?.value?.game) throw new Error('game controls did not appear');
        await sleep(1200);
      }

      const shot = await send('Page.captureScreenshot', {
        format: 'jpeg', quality: 90, fromSurface: true, captureBeyondViewport: false,
      });
      const bytes = Buffer.from(shot.result.data, 'base64');
      if (bytes.length < 20_000) throw new Error(`preview image is unexpectedly small (${bytes.length} bytes)`);
      writeFileSync(join(OUT, `${game.slug}.jpg`), bytes);
      console.log(`${game.slug}: ${(bytes.length / 1024).toFixed(0)} KB`);
    } catch (error) {
      failures.push(`${game.slug}: ${error.message}`);
      console.error(`Failed ${game.slug}: ${error.message}`);
    }
  }
} finally {
  ws?.close();
  if (chrome.exitCode === null && chrome.signalCode === null) {
    const exited = once(chrome, 'exit');
    chrome.kill();
    await exited;
  }
  await new Promise((resolveClose) => server.close(resolveClose));
  for (let attempt = 0; ; attempt++) {
    try {
      rmSync(profileDir, { recursive: true, force: true });
      break;
    } catch (error) {
      if (error.code !== 'EPERM' || attempt >= 7) throw error;
      await sleep(250);
    }
  }
}

if (failures.length) throw new Error(`Gameplay preview capture failed:\n${failures.join('\n')}`);
console.log(`Captured ${games.length} gameplay previews in assets/gameplay/.`);
