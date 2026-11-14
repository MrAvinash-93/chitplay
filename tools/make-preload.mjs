/**
 * Faster first load: the home page and the play page name every module they will need up front
 * (<link rel="modulepreload">), so the browser fetches them all at once instead of discovering them
 * one import at a time (41 round trips on a phone network before the first picture).
 *
 * Each URL is written exactly as the code imports it (with its ?v= stamp, or without one), so the
 * preloaded file is the same module the page then uses and nothing downloads twice.
 * The 3D room's modules (loaded a moment later) are preloaded too, after the page's own ones.
 *
 *   node tools/make-preload.mjs        (release.mjs runs it after stamping)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every module reached from `entry` by static imports, as [path from the root, URL as imported]. */
function graph(entryPath, entryUrl) {
  const out = new Map([[entryUrl, entryPath]]);
  const visit = (file) => {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of src.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm)) {
      const spec = m[1] || m[2];
      if (!spec.startsWith('.')) continue;
      const [rel, query] = spec.split('?');
      const target = path.posix.join(path.posix.dirname(file), rel);
      const url = `${target}${query ? `?${query}` : ''}`;
      if (out.has(url)) continue;
      out.set(url, target);
      visit(target);
    }
  };
  visit(entryPath);
  return out;
}
/** The modules a dynamic import(...) of `spec` inside `from` would bring in. */
function dynamicGraph(from, needle) {
  const src = fs.readFileSync(path.join(ROOT, from), 'utf8');
  const m = src.match(new RegExp(`import\\(\\s*['"\`]([^'"\`]*${needle}[^'"\`]*)['"\`]`));
  if (!m) return new Map();
  const [rel, query] = m[1].split('?');
  const target = path.posix.join(path.posix.dirname(from), rel);
  return graph(target, `${target}${query ? `?${query}` : ''}`);
}

function write(htmlFile, base, groups) {
  const file = path.join(ROOT, htmlFile);
  let html = fs.readFileSync(file, 'utf8');
  const seen = new Set();
  const links = [];
  for (const g of groups) for (const url of g.keys()) {
    if (seen.has(url)) continue;
    seen.add(url);
    links.push(`  <link rel="modulepreload" href="${base}${url}">`);
  }
  const block = `<!-- preload -->\n${links.join('\n')}\n  <!-- /preload -->`;
  if (html.includes('<!-- preload -->')) html = html.replace(/<!-- preload -->[\s\S]*?<!-- \/preload -->/, block);
  else html = html.replace(/(\s*<script type="module")/, `\n  ${block}$1`);
  fs.writeFileSync(file, html);
  return links.length;
}

// the home page: its app, then the 3D room it opens into
const homeEntry = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<script type="module" src="\.\/([^"]+)"/)[1];
const [homePath] = homeEntry.split('?');
const home = graph(homePath, homeEntry);
const room = [...home.values()].reduce((acc, f) => { for (const [u, p] of dynamicGraph(f, 'world-loader')) acc.set(u, p); return acc; }, new Map());
const worldLoader = [...home.values(), ...room.values()].find(p => p.endsWith('world-loader.js'));
const world = worldLoader ? dynamicGraph(worldLoader, 'world-3d') : new Map();
const nHome = write('index.html', './', [home, room, world]);

// the play page: the table and everything it imports (the 3D engine included)
const playEntry = fs.readFileSync(path.join(ROOT, 'play', 'index.html'), 'utf8').match(/<script type="module" src="\.\.\/([^"]+)"/)[1];
const [playPath] = playEntry.split('?');
const nPlay = write('play/index.html', '../', [graph(playPath, playEntry)]);
console.log(`Preload: ${nHome} modules on the home page, ${nPlay} on the play page`);
