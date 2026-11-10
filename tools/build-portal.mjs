/**
 * The game alone, ready to upload to a game portal: CrazyGames or Poki.
 *
 *   node tools/build-portal.mjs              → dist/crazygames/ and dist/poki/ (+ a .zip of each)
 *   node tools/build-portal.mjs crazygames   → just one
 *
 * What changes from www.chitplay.com:
 *   - the portal's SDK is loaded and window.CHITPLAY_PORTAL is set, so src/platform/portal.js tells
 *     the portal when the game has loaded and when play starts and stops, and asks it for an ad
 *     between matches (the portal's own ads: no AdSense, no Google Analytics, no Tag Manager)
 *   - only the game: the home screen and /play/, the code, the icons. No guide pages, language
 *     pages, legal pages, sitemap, robots, ads.txt or service worker
 *   - nothing links out to the website: guide links, legal links and sharing links are hidden
 *
 * Run tools/release.mjs first, so every file carries the current version.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SDK = {
  crazygames: 'https://sdk.crazygames.com/crazygames-sdk-v3.js',
  poki: 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js',
};
const which = process.argv[2] ? [process.argv[2]] : Object.keys(SDK);
const ASSETS = ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'icon-maskable-512.png', 'logo.png'];

function sizeOf(dir) {
  let bytes = 0, files = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { const s = sizeOf(p); bytes += s.bytes; files += s.files; } else { bytes += statSync(p).size; files += 1; }
  }
  return { bytes, files };
}
/** The page for a portal: its SDK in, the website's analytics, ads and search tags out. */
function portalPage(html, portal) {
  return html
    .replace(/<!-- analytics -->[\s\S]*?<!-- \/analytics -->/g, '')
    .replace(/<!-- seo:head -->[\s\S]*?<!-- \/seo:head -->/g, '<title>ChitPlay: Raja Rani Chor Police &amp; 30+ Indoor Games</title>')
    .replace(/<section class="seo-intro"[\s\S]*?<\/section>/g, '')
    .replace(/<link rel="canonical"[^>]*>\s*/g, '')
    .replace(/<meta (?:property|name)="(?:og|twitter):[^>]*>\s*/g, '')
    .replace(/<link rel="manifest"[^>]*>\s*/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
    .replace(/<noscript>[\s\S]*?<\/noscript>/g, '<noscript><p>ChitPlay needs JavaScript to run.</p></noscript>')
    .replace(/<\/head>/, `  <script>window.CHITPLAY_PORTAL = '${portal}';</script>\n  <script src="${SDK[portal]}"></script>\n</head>`);
}

for (const portal of which) {
  if (!SDK[portal]) { console.error(`Unknown portal "${portal}". Use: ${Object.keys(SDK).join(', ')}`); process.exit(1); }
  const out = join(ROOT, 'dist', portal);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'assets'), { recursive: true });
  mkdirSync(join(out, 'play'), { recursive: true });
  cpSync(join(ROOT, 'src'), join(out, 'src'), { recursive: true });
  // the old /party/ page is not part of the game any more
  rmSync(join(out, 'src', 'party'), { recursive: true, force: true });
  ASSETS.forEach((a) => { if (existsSync(join(ROOT, 'assets', a))) cpSync(join(ROOT, 'assets', a), join(out, 'assets', a)); });
  cpSync(join(ROOT, 'favicon.ico'), join(out, 'favicon.ico'));
  writeFileSync(join(out, 'index.html'), portalPage(readFileSync(join(ROOT, 'index.html'), 'utf8'), portal));
  writeFileSync(join(out, 'play', 'index.html'), portalPage(readFileSync(join(ROOT, 'play', 'index.html'), 'utf8'), portal));
  const { bytes, files } = sizeOf(out);
  let zipped = '';
  try {
    const zip = join(ROOT, 'dist', `chitplay-${portal}.zip`);
    rmSync(zip, { force: true });
    try { execFileSync('tar', ['-a', '-c', '-f', zip, '-C', out, '.'], { stdio: 'ignore' }); }
    catch { execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${out}\*' -DestinationPath '${zip}' -Force`], { stdio: 'ignore' }); }
    zipped = ` · zip ${(statSync(zip).size / 1024 / 1024).toFixed(1)} MB`;
  } catch { zipped = ' · (zip it yourself: tar was not found)'; }
  console.log(`${portal}: ${files} files, ${(bytes / 1024 / 1024).toFixed(1)} MB${zipped} → dist/${portal}/`);
}
