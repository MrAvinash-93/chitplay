/**
 * Smaller downloads in the game: each game's How to play sheet gets its own file,
 * src/arcade/howto/<game>.js, holding just what the sheet shows (steps, who wins, levels, house rules,
 * scoring) in English and every language it has been written in.
 *
 * rules.js (every game, with the guide pages' longer text) and rules-i18n/<language>.js stay the
 * source; a player opening Ludo now downloads Ludo's sheet, not all 47 games' rules.
 *
 *   node tools/make-howto.mjs        (release.mjs runs it)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCADE = path.join(ROOT, 'src', 'arcade');
const load = async (f) => import(pathToFileURL(path.join(ARCADE, f)).href);
const { RULES } = await load('rules.js');
const { RULES_IN } = await load('shell-text-more.js');
const FIELDS = ['steps', 'win', 'levels', 'house', 'scoring'];
const pick = (r) => Object.fromEntries(FIELDS.filter(k => r?.[k] != null).map(k => [k, r[k]]));

const langs = {};
for (const lang of RULES_IN) {
  try { langs[lang] = (await load(`rules-i18n/${lang}.js`)).default; } catch { /* that language shows the English */ }
}
const OUT = path.join(ARCADE, 'howto');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.js') && !RULES[f.slice(0, -3)]) fs.unlinkSync(path.join(OUT, f));
let bytes = 0;
for (const [slug, r] of Object.entries(RULES)) {
  const sheet = { en: pick(r) };
  for (const [lang, all] of Object.entries(langs)) {
    const own = all[slug];
    // the same steps as the English, or the English stays (as the game has always done)
    if (own?.steps?.length === r.steps?.length) {
      const mine = pick(own);
      if (own.house && own.house.length !== r.house?.length) delete mine.house;
      sheet[lang] = mine;
    }
  }
  const text = `// made by tools/make-howto.mjs from rules.js and rules-i18n/: edit those, not this\nexport default ${JSON.stringify(sheet)};\n`;
  const file = path.join(OUT, `${slug}.js`);
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) fs.writeFileSync(file, text);
  bytes += text.length;
}
console.log(`How to play: ${Object.keys(RULES).length} games, ${Math.round(bytes / 1024)} KB in all, ${Object.keys(langs).length} languages`);
