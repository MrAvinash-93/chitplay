import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { RULES } from '../src/arcade/rules.js';
import { RULES_IN } from '../src/arcade/shell-text-more.js';

// a translated rules file must match the English step for step: the game falls back to English for a
// game whose steps don't line up, and the SEO page shows these words as the full guide
const files = readdirSync(new URL('../src/arcade/rules-i18n/', import.meta.url)).filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''));

test('the game\'s Latin Russian rules are made from the Cyrillic guide (run tools/make-latin-rules.mjs)', async () => {
  const { default: ru } = await import('../tools/guides/ru.mjs');
  const { default: latin } = await import('../src/arcade/rules-i18n/russian_latin.js');
  const { latinRussian } = await import('../tools/make-latin-rules.mjs');
  assert.deepEqual(latin.chess.steps, ru.chess.steps.map(latinRussian));
  assert.deepEqual(Object.keys(latin), Object.keys(ru));
  const { default: ko } = await import('../tools/guides/ko.mjs');
  const { default: koLatin } = await import('../src/arcade/rules-i18n/korean_roman.js');
  const { latinKorean } = await import('../tools/make-latin-rules.mjs');
  assert.deepEqual(koLatin.ludo.steps, ko.ludo.steps.map(latinKorean));
  assert.equal(latinKorean('선을 그어요'), 'seoneul geueoyo');
  const { default: ne } = await import('../tools/guides/ne.mjs');
  const { default: neLatin } = await import('../src/arcade/rules-i18n/nepali.js');
  const { latinNepali } = await import('../tools/make-latin-rules.mjs');
  assert.deepEqual(neLatin.chess.steps, ne.chess.steps.map(latinNepali));
  assert.equal(latinNepali('समय सकिन्छ'), 'samay sakinchha');
});

for (const lang of files) {
  test(`rules in ${lang} match the English game by game`, async () => {
    const own = (await import(`../src/arcade/rules-i18n/${lang}.js`)).default;
    for (const [slug, en] of Object.entries(RULES)) {
      const r = own[slug];
      assert.ok(r, `${lang}: ${slug} is missing`);
      assert.equal(r.steps?.length, en.steps.length, `${lang}: ${slug} has ${r.steps?.length} steps, English has ${en.steps.length}`);
      assert.ok(r.win && r.scoring, `${lang}: ${slug} needs win and scoring`);
      if (en.house) assert.equal(r.house?.length, en.house.length, `${lang}: ${slug} house rules don't line up`);
      for (const s of [...r.steps, r.win, r.scoring]) assert.ok(s.trim().length > 5, `${lang}: ${slug} has an empty line`);
    }
  });
  test(`${lang} is switched on in the game`, () => assert.ok(RULES_IN.includes(lang), `${lang} is not in RULES_IN`));
}
