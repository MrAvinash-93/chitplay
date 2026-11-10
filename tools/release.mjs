/**
 * Get the site ready for GitHub Pages. Run it before every push:
 *
 *     node tools/release.mjs
 *
 * 1. Stamps a fresh version on every ?v= tag and on the service worker, so players'
 *    phones fetch the new files instead of keeping the old ones.
 * 2. Checks what only breaks once it's live: GitHub Pages cares about capital letters and
 *    Windows doesn't, so a wrong-case import works here and fails for everybody there.
 * 3. Checks file sizes against GitHub's 25 MB limit for uploads in the browser.
 *
 * Nothing to install: plain Node. Exits with an error if anything would break the live site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'archive', 'dist']);
const UPLOAD_LIMIT = 25 * 1024 * 1024;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out); }
    else out.push(path.join(dir, entry.name));
  }
  return out;
}
const files = walk(ROOT);

/* ─── 1. A fresh version ─────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const TAGGED = /\.(js|mjs|html|css)$/;
let stamped = 0;
for (const file of files) {
  if (!TAGGED.test(file) || file.includes(`${path.sep}vendor${path.sep}`) || file === fileURLToPath(import.meta.url)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = before
    .replace(/\?v=[\w-]+/g, `?v=${stamp}`)
    .replace(/const VERSION = 'chitplay-[\w-]+';/, `const VERSION = 'chitplay-${stamp}';`);
  if (after !== before) { fs.writeFileSync(file, after); stamped++; }
}

/* ─── 2. Does everything the game asks for exist, with exactly that spelling? ─── */
const exists = (absolute) => {
  let dir = ROOT;
  for (const part of path.relative(ROOT, absolute).split(path.sep)) {
    if (part === '..' || !fs.existsSync(dir) || !fs.readdirSync(dir).includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
};
const problems = [];
const check = (from, ref) => {
  const clean = ref.split(/[?#]/)[0];
  if (!clean || /^(https?:|data:|mailto:|#|\/\/)/.test(ref) || clean.includes('${')) return;
  const target = clean.startsWith('/') ? path.join(ROOT, clean) : path.resolve(path.dirname(from), clean);
  if (!exists(target) && !exists(path.join(target, 'index.html'))) problems.push(`${path.relative(ROOT, from)} → ${ref}`);
};
const IMPORTS = [
  /\bfrom\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*[`'"]([^`'"$]+)/g,
  /^\s*import\s+['"]([^'"]+)['"]/gm,
];
for (const file of files.filter(f => /\.js$/.test(f) && f.includes(`${path.sep}src${path.sep}`) && !f.includes(`${path.sep}vendor${path.sep}`))) {
  const text = fs.readFileSync(file, 'utf8');
  IMPORTS.forEach(re => { for (const m of text.matchAll(re)) check(file, m[1]); });
  // language files are imported through a template: `./hinglish.js${V}`
  for (const m of text.matchAll(/import\(`(\.[^`$]+)\$\{V\}`\)/g)) check(file, m[1]);
}
for (const name of ['index.html', '404.html']) {
  const file = path.join(ROOT, name);
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/\b(?:src|href)="([^"]+)"/g)) check(file, m[1]);
}
const swFile = path.join(ROOT, 'sw.js');
for (const m of fs.readFileSync(swFile, 'utf8').matchAll(/^\s*'(\.\/[^']+)',?$/gm)) check(swFile, m[1]);
for (const name of ['.nojekyll', 'CNAME', 'index.html', '404.html', 'sw.js', 'manifest.webmanifest']) {
  if (!fs.existsSync(path.join(ROOT, name))) problems.push(`missing ${name}`);
}

/* ─── 3. Sizes ───────────────────────────────────────────── */
const everything = walk(ROOT).filter(f => !f.includes(`${path.sep}.git${path.sep}`));
const bytes = everything.map(f => [f, fs.statSync(f).size]);
const total = bytes.reduce((sum, [, size]) => sum + size, 0);
bytes.filter(([, size]) => size > UPLOAD_LIMIT).forEach(([f]) => problems.push(`${path.relative(ROOT, f)} is over 25 MB`));

console.log(`Version ${stamp} on ${stamped} files · ${everything.length} files · ${(total / 1048576).toFixed(1)} MB in all`);
if (problems.length) {
  console.error(`\nThese would break on the live site:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('Ready. Push it: git add -A && git commit -m "…" && git push');
