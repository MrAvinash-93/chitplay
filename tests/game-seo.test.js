import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_GAMES } from '../src/arcade/catalog.js';
import { LANG_PAGES } from '../tools/seo-langs.mjs';
import { guideFor, GUIDE_HEADINGS } from '../tools/seo-guides.mjs';
import { RULES } from '../src/arcade/rules.js';

test('the main chit game has its own steps and questions in every language', async () => {
  const { default: main } = await import('../tools/guides/main.mjs');
  for (const language of LANG_PAGES) {
    const g = main[language.code];
    assert.ok(g, `${language.label}: no main game guide`);
    assert.equal(g.steps.length, 6, `${language.label}: main game needs 6 steps`);
    assert.ok(g.faq.length >= 5, `${language.label}: main game needs at least 5 questions`);
    const html = readFileSync(join(ROOT, language.dir, 'games', 'cops-and-robbers', 'index.html'), 'utf8');
    assert.ok(html.includes('"FAQPage"'), `${language.label}: main game page has no FAQ schema`);
  }
});

test('every finished language has the full guide and every FAQ for every game', () => {
  for (const code of Object.keys(GUIDE_HEADINGS)) {
    for (const [slug, en] of Object.entries(RULES)) {
      const guide = guideFor(code, slug);
      assert.ok(guide, `${code}: ${slug} has no guide`);
      assert.equal(guide.steps.length, en.steps.length, `${code}: ${slug} has ${guide.steps.length} steps, English has ${en.steps.length}`);
      if (en.house) assert.equal(guide.house?.length, en.house.length, `${code}: ${slug} house rules don't line up`);
      assert.equal(guide.faq.length, (en.faq || []).length, `${code}: ${slug} has ${guide.faq.length} FAQ answers, English has ${(en.faq || []).length}`);
      guide.faq.forEach(([q, a]) => assert.ok(q.trim() && a.trim(), `${code}: ${slug} has an empty FAQ line`));
    }
  }
});

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const GUIDES = [{ slug: 'cops-and-robbers' }, ...ALL_GAMES];

function jpegDimensions(path) {
  const data = readFileSync(path);
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset < data.length) {
    if (data[offset++] !== 0xff) continue;
    while (data[offset] === 0xff) offset++;
    const marker = data[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = data.readUInt16BE(offset);
    if (frameMarkers.has(marker)) return { width: data.readUInt16BE(offset + 5), height: data.readUInt16BE(offset + 3) };
    offset += length;
  }
  return null;
}

test('every catalog game has names and descriptions in each published SEO language', () => {
  for (const language of LANG_PAGES) {
    assert.ok(language.main[0].trim(), `${language.label} has no localized name for Raja Rani Chor Police`);
    assert.ok(language.main[1].trim(), `${language.label} has no localized description for Raja Rani Chor Police`);
    for (const game of ALL_GAMES) {
      const localized = language.names[game.slug];
      assert.ok(localized, `${language.label} is missing ${game.slug}`);
      assert.ok(localized[0].trim(), `${language.label} has no display name for ${game.slug}`);
      assert.ok(localized[1].trim(), `${language.label} has no search description for ${game.slug}`);
    }
    assert.ok(language.ui.guide, `${language.label} is missing its guide label`);
    assert.ok(language.ui.skip, `${language.label} is missing its skip-link label`);
  }
});

test('every English and localized game guide has an authentic gameplay preview', () => {
  for (const game of GUIDES) {
    const preview = join(ROOT, 'assets', 'gameplay', `${game.slug}.jpg`);
    assert.ok(existsSync(preview), `missing gameplay preview for ${game.slug}`);
    assert.deepEqual(jpegDimensions(preview), { width: 1200, height: 630 }, `${game.slug} preview must be 1200x630`);
    // only pages with a full guide in their language are offered to search engines and linked as
    // alternates; the rest exist for players but carry noindex (the main game has its own full pages)
    const guided = (language) => game.slug === 'cops-and-robbers' || !!guideFor(language.code, game.slug);
    const cluster = [
      ['en', `https://www.chitplay.com/games/${game.slug}/`],
      ...LANG_PAGES.filter(guided).map((language) => [language.code, `https://www.chitplay.com/${language.dir}/games/${game.slug}/`]),
      ['x-default', `https://www.chitplay.com/games/${game.slug}/`],
    ];
    for (const language of [null, ...LANG_PAGES]) {
      const page = join(ROOT, language ? language.dir : '', 'games', game.slug, 'index.html');
      const html = readFileSync(page, 'utf8');
      const image = `assets/gameplay/${game.slug}.jpg`;
      assert.ok(html.includes(image), `${language?.label || 'English'} guide is missing ${game.slug}'s gameplay image`);
      if (language && !guided(language)) {
        assert.ok(html.includes('content="noindex, follow"'), `${language.label} ${game.slug} has no guide yet, so it must be noindex`);
        continue;
      }
      assert.ok(!html.includes('noindex'), `${language?.label || 'English'} ${game.slug} has a guide, so it must be indexable`);
      for (const [code, href] of cluster) {
        assert.ok(html.includes(`hreflang="${code}" href="${href}"`), `${language?.label || 'English'} guide is missing the ${code} alternate for ${game.slug}`);
      }
      for (const other of LANG_PAGES.filter(l => !guided(l))) {
        assert.ok(!html.includes(`hreflang="${other.code}" href="https://www.chitplay.com/${other.dir}/games/${game.slug}/"`), `${language?.label || 'English'} ${game.slug} must not list the unfinished ${other.code} page as an alternate`);
      }
    }
  }
});

test('English schema uses game titles rather than splitting SEO keywords into aliases', () => {
  const html = readFileSync(join(ROOT, 'games', 'four-in-a-row', 'index.html'), 'utf8');
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const game = schema.find((entry) => entry['@type'] === 'VideoGame');
  const localizedName = LANG_PAGES.find((language) => language.names['four-in-a-row'][0] !== 'Four in a Row').names['four-in-a-row'][0];
  assert.ok(game.alternateName.includes(localizedName));
  assert.ok(!game.alternateName.includes('connect'));
  assert.ok(!game.alternateName.includes('discs'));
});

test('every game-idea article is written in every language, with the same games and all its language versions linked', async () => {
  const { ARTICLES } = await import('../tools/articles/index.mjs');
  const langs = [{ code: 'en', dir: '' }, ...LANG_PAGES];
  const slugs = new Set(ALL_GAMES.map(g => g.slug).concat('cops-and-robbers'));
  for (const L of langs) {
    const { default: T } = await import(`../tools/articles/${L.code}.mjs`);
    for (const A of ARTICLES) {
      const a = T.articles[A.slug];
      assert.ok(a && a.title && a.desc && a.intro.length >= 2 && a.tips.length >= 3 && a.faq.length >= 2, `${L.code}: ${A.slug} is incomplete`);
      for (const k of A.offline) assert.ok(T.offline[k]?.length === 4, `${L.code}: classic game ${k} missing`);
      for (const g of A.games) assert.ok(slugs.has(g), `${A.slug}: unknown game ${g}`);
      const file = join(ROOT, L.dir || '', 'articles', A.slug, 'index.html');
      assert.ok(existsSync(file), `${L.code}: ${A.slug} page not built`);
      const html = readFileSync(file, 'utf8');
      assert.equal((html.match(/<link rel="alternate" hreflang=/g) || []).length, langs.length + 1, `${L.code}: ${A.slug} must name every language version and x-default`);
      assert.ok(html.includes('"FAQPage"') && html.includes('"Article"'), `${L.code}: ${A.slug} needs Article and FAQ schema`);
      for (const g of A.games) assert.ok(html.includes(g === 'cops-and-robbers' ? '?game=cops-and-robbers' : `play/?game=${g}&amp;mode=play`) || html.includes(`play/?game=${g}&mode=play`), `${L.code}: ${A.slug} has no play link for ${g}`);
    }
  }
  const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  for (const A of ARTICLES) assert.ok(sitemap.includes(`/articles/${A.slug}/</loc>`), `${A.slug} not in the sitemap`);
});

test('every game has its pictures in both formats, so no page falls back to the default picture', () => {
  for (const g of ALL_GAMES) {
    for (const file of [`${g.slug}.jpg`, `${g.slug}.webp`, `${g.slug}-square.jpg`, `${g.slug}-square.webp`]) {
      assert.ok(existsSync(join(ROOT, 'assets', 'games', file)), `${g.slug}: assets/games/${file} is missing (run tools/make-game-images.mjs and tools/make-webp.mjs)`);
    }
    assert.ok(existsSync(join(ROOT, 'assets', 'gameplay', `${g.slug}.jpg`)), `${g.slug}: no gameplay picture`);
  }
});
