// Each game's How to play sheet lives in its own small file (tools/make-howto.mjs): every game has one,
// and it says what rules.js and rules-i18n/ say (run the tool again after editing those)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RULES } from '../src/arcade/rules.js';
import { RULES_IN } from '../src/arcade/shell-text-more.js';

test('every game has its own How to play sheet, up to date', async () => {
  for (const [slug, en] of Object.entries(RULES)) {
    assert.ok(fs.existsSync(new URL(`../src/arcade/howto/${slug}.js`, import.meta.url)), `howto/${slug}.js is missing: run node tools/make-howto.mjs`);
    const sheet = (await import(`../src/arcade/howto/${slug}.js`)).default;
    assert.deepEqual(sheet.en.steps, en.steps, `howto/${slug}.js is out of date: run node tools/make-howto.mjs`);
    assert.equal(sheet.en.win, en.win);
    for (const lang of Object.keys(sheet)) if (lang !== 'en') assert.ok(RULES_IN.includes(lang), `${slug}: ${lang}`);
  }
});

test('the TV games each have their own 3D view file', async () => {
  const src = fs.readFileSync(new URL('../src/arcade/video/views.js', import.meta.url), 'utf8');
  for (const m of src.matchAll(/\['(\.\/[^']+)'/g)) assert.ok(fs.existsSync(new URL(`../src/arcade/video/${m[1]}`, import.meta.url)), m[1]);
});
