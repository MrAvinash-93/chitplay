/**
 * Tell Bing, Yandex, Seznam, Naver and the other IndexNow search engines about every page in the
 * sitemap at once, so new and changed pages are crawled in hours instead of weeks.
 * Run it after the site is live on GitHub Pages (the key file must be reachable first):
 *
 *   node tools/indexnow.mjs
 *
 * The key is public by design: it only proves the site is ours (https://www.indexnow.org).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = '93eca9ccd9696a532682e720b75a9239';
const HOST = 'www.chitplay.com';
const urls = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

const live = await fetch(`https://${HOST}/${KEY}.txt`).then(r => r.text()).catch(() => '');
if (live.trim() !== KEY) {
  console.error(`The key file is not live yet at https://${HOST}/${KEY}.txt — upload the site first, then run this again.`);
  process.exit(1);
}
// at most 10,000 URLs per request
for (let i = 0; i < urls.length; i += 10000) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`IndexNow: ${urls.slice(i, i + 10000).length} pages sent → HTTP ${res.status} ${res.status === 200 || res.status === 202 ? '(accepted)' : ''}`);
}
