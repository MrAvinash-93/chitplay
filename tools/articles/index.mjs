/**
 * Game-idea articles: eight evergreen guides (games at home, with friends, at school, for the family,
 * without anything, for two, for parties, for four) in English and every language ChitPlay speaks.
 *
 * Each article lists free ChitPlay games that fit, with a link to play the game itself and one to its
 * rules, then classic games that need nothing, tips and questions. Every language version of an article
 * names all the others (hreflang), the same as the game guides.
 *
 *   /articles/<slug>/            English
 *   /<lang dir>/articles/<slug>/ every other language
 *   /articles/ and /<lang dir>/articles/  the list of articles
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Which games each article lists, the same in every language. */
export const ARTICLES = [
  { slug: 'games-to-play-at-home', cover: 'ludo', games: ['cops-and-robbers', 'ludo', 'carrom', 'snakes-and-ladders', 'memory-match', 'unblock-puzzle', 'word-guess'], offline: ['dumb-charades', 'antakshari', 'hot-and-cold', 'story-chain'] },
  { slug: 'games-to-play-with-friends', cover: 'who-is-the-spy', games: ['cops-and-robbers', 'who-is-the-spy', 'truth-or-dare', 'call-break', 'bingo', 'bull-fight', 'ludo'], offline: ['two-truths', 'would-you-rather', 'dumb-charades'] },
  { slug: 'games-to-play-at-school', cover: 'dots-and-boxes', games: ['cops-and-robbers', 'dots-and-boxes', 'tic-tac-toe', 'bingo', 'pen-fight', 'riddle-chits', 'number-memory'], offline: ['name-place-animal-thing', 'hangman', 'word-chain', 'rock-paper-scissors'] },
  { slug: 'indoor-games-for-family', cover: 'snakes-and-ladders', games: ['cops-and-robbers', 'ludo', 'carrom', 'snakes-and-ladders', 'majority-vote', 'riddle-chits', 'yacht'], offline: ['antakshari', 'dumb-charades', 'simon-says', 'i-spy'] },
  { slug: 'games-without-anything', cover: 'word-guess', games: ['cops-and-robbers', 'word-guess', 'reaction-time', 'truth-or-dare', 'majority-vote'], offline: ['rock-paper-scissors', 'twenty-questions', 'i-spy', 'word-chain', 'would-you-rather', 'simon-says', 'thumb-war', 'story-chain'] },
  { slug: 'games-for-2-people', cover: 'chess', games: ['chess', 'carrom', 'checkers', 'four-in-a-row', 'ship-fight', 'backyard-rally', 'tic-tac-toe', 'reversi'], offline: ['thumb-war', 'rock-paper-scissors', 'twenty-questions'] },
  { slug: 'fun-party-games', cover: 'werewolf', games: ['who-is-the-spy', 'werewolf', 'truth-or-dare', 'majority-vote', 'consequences', 'cops-and-robbers', 'fast-typing'], offline: ['dumb-charades', 'two-truths', 'antakshari', 'hot-and-cold'] },
  { slug: 'games-for-4-people', cover: 'call-break', games: ['cops-and-robbers', 'call-break', 'ludo', 'bingo', 'crazy-eights', 'pakda-padi', 'lapa-chupi'], offline: ['dumb-charades', 'name-place-animal-thing', 'story-chain'] },
];
const PUBLISHED = '2026-11-14';

/**
 * Writes every article and list page. `site` carries what build-seo.mjs already has (helpers, the
 * languages, the games); returns the URLs with their language clusters for the sitemap.
 */
export async function writeArticles(site) {
  const { ROOT, SITE, TODAY, ANALYTICS, esc, json, iconLinks, logoLink, footerLinks, LANG_PAGES, PARTY, MAIN_SLUG, imageFor, guideFor, adSlot = () => '' } = site;
  const text = { en: (await import('./en.mjs')).default };
  // a language whose articles are not written yet is left out everywhere, links and hreflang included
  for (const L of LANG_PAGES) text[L.code] = (await import(`./${L.code}.mjs`).catch(() => ({ default: null }))).default;
  const langs = [{ code: 'en', dir: '', label: 'English', game: 'en' }, ...LANG_PAGES.filter(L => text[L.code])];
  const base = (L) => (L.code === 'en' ? `${SITE}/` : `${SITE}/${L.dir}/`);
  const articleUrl = (L, slug) => `${base(L)}articles/${slug}/`;
  const hubUrl = (L) => `${base(L)}articles/`;
  const cluster = (urlFor) => [...langs.map(L => [L.code, urlFor(L)]), ['x-default', urlFor(langs[0])]];
  const alternates = (urlFor) => cluster(urlFor).map(([c, h]) => `<link rel="alternate" hreflang="${c}" href="${h}">`).join('\n');
  const byslug = Object.fromEntries(PARTY.map(g => [g.slug, g]));
  const out = [];

  // a game's name and one-line description in a language (English from the catalog)
  const gameText = (L, slug) => {
    if (L.code === 'en') return slug === MAIN_SLUG ? ['Raja Rani Chor Police (Cops and Robbers)', 'Four folded chits, one thief: the Police has to catch the Thief by reading faces.'] : [byslug[slug].name, byslug[slug].blurb];
    return slug === MAIN_SLUG ? L.main : L.names[slug];
  };
  const css = 'body{margin:0;background:#140b07;color:#f6ead2;font:17px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Devanagari","Noto Sans Bengali",sans-serif}main{max-width:780px;margin:0 auto;padding:20px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(28px,6vw,40px);line-height:1.2;margin:18px 0 10px}h2{font-size:22px;margin-top:32px}h3{font-size:18px;margin:0}.crumbs{font-size:14px;opacity:.8}.btn{display:inline-block;padding:12px 20px;border-radius:12px;background:#ffd27a;color:#140b07;font-weight:800;text-decoration:none}.games,.classic,.list{list-style:none;padding:0}.games li{display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08)}.games img{border-radius:12px;flex:none}.games p,.classic p{margin:4px 0}.links a{margin-inline-end:14px;font-weight:700}.classic li{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}.meta{font-size:14px;opacity:.75}details{background:rgba(255,255,255,.04);border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}.list li{padding:6px 0}.hero{width:100%;height:auto;border-radius:14px}img{max-width:100%}p,li,h1,h2,h3{overflow-wrap:break-word}footer{margin-top:40px;font-size:14px;opacity:.8}.langs{font-size:14px}';
  const head = (L, { title, desc, url, urlFor, ld, image }) => `<!DOCTYPE html>
<html lang="${L.code}"${L.rtl ? ' dir="rtl"' : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
${alternates(urlFor)}
<meta property="og:type" content="article">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:locale" content="${L.code === 'en' ? 'en' : L.code.replace('-Latn', '').replace('-', '_')}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${image}">
${iconLinks(L.code === 'en' ? '../../' : '../../../')}
<script type="application/ld+json">${json(ld)}</script>
<style>${css}</style>
</head>`;
  const langList = (L, urlFor) => `<p class="langs">🌍 ${esc(text[L.code].ui.langs)}: ${langs.filter(o => o !== L).map(o => `<a href="${urlFor(o)}" hreflang="${o.code}" lang="${o.code}">${esc(o.label)}</a>`).join(' · ')}</p>`;

  for (const L of langs) {
    const T = text[L.code], up = L.code === 'en' ? '../../' : '../../../';
    const dir = L.code === 'en' ? join(ROOT, 'articles') : join(ROOT, L.dir, 'articles');
    const rulesHref = (slug) => (L.code !== 'en' && (slug === MAIN_SLUG || guideFor(L.code, slug)) ? `${up}${L.dir}/games/${slug}/` : `${up}games/${slug}/`);
    const playHref = (slug) => (slug === MAIN_SLUG ? `${up}?game=${MAIN_SLUG}&lang=${L.game}` : `${up}play/?game=${slug}&mode=play&lang=${L.game}`);
    const players = (slug) => { const g = slug === MAIN_SLUG ? { min: 4, max: 4 } : byslug[slug]; return g.min === g.max ? `${g.min}` : `${g.min}–${g.max}`; };

    for (const A of ARTICLES) {
      const a = T.articles[A.slug], url = articleUrl(L, A.slug), urlFor = (o) => articleUrl(o, A.slug);
      const image = `${SITE}/assets/gameplay/${A.cover}.jpg`;
      const faqLd = a.faq.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } }));
      const ld = [
        { '@context': 'https://schema.org', '@type': 'Article', headline: a.h1, description: a.desc, inLanguage: L.code, url, image: [image, `${SITE}/assets/home.jpg`], datePublished: PUBLISHED, dateModified: TODAY, author: { '@type': 'Organization', name: 'ChitPlay', url: `${SITE}/` }, publisher: { '@type': 'Organization', name: 'ChitPlay', logo: { '@type': 'ImageObject', url: `${SITE}/assets/icon-512.png` } }, mainEntityOfPage: url },
        { '@context': 'https://schema.org', '@type': 'ItemList', name: T.ui.online, itemListElement: A.games.map((slug, i) => ({ '@type': 'ListItem', position: i + 1, name: gameText(L, slug)[0], url: rulesHref(slug).replace(up, `${SITE}/`) })) },
        { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: L.code, mainEntity: faqLd },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: base(L) }, { '@type': 'ListItem', position: 2, name: T.ui.hub, item: hubUrl(L) }, { '@type': 'ListItem', position: 3, name: a.h1, item: url }] },
      ];
      const gameItems = A.games.map(slug => {
        const [name, blurb] = gameText(L, slug);
        return `<li><img src="${up}assets/${imageFor(slug, true)}" alt="" width="64" height="64" loading="lazy" decoding="async"><div><h3>${esc(name)}</h3><p>${esc(blurb)}</p><p class="meta">👥 ${players(slug)} ${esc(T.ui.players)}</p><p class="links"><a href="${playHref(slug)}">${esc(T.ui.play)}</a><a href="${rulesHref(slug)}">${esc(T.ui.rules)}</a></p></div></li>`;
      }).join('');
      const classic = A.offline.map(k => { const [name, how, needs, n] = T.offline[k]; return `<li><h3>${esc(name)}</h3><p>${esc(how)}</p><p class="meta">👥 ${esc(n)} ${esc(T.ui.players)} · ${esc(T.ui.needs)}: ${esc(needs)}</p></li>`; }).join('');
      const more = ARTICLES.filter(o => o !== A).map(o => `<li><a href="../${o.slug}/">${esc(T.articles[o.slug].h1)}</a></li>`).join('');
      const html = `${head(L, { title: `${a.title} | ChitPlay`, desc: a.desc, url, urlFor, ld, image })}
<body>
<main>
${logoLink(up)}
<p class="crumbs"><a href="${L.code === 'en' ? up : `${up}${L.dir}/`}">${esc(T.ui.home)}</a> › <a href="../">${esc(T.ui.hub)}</a></p>
<article>
<h1>${esc(a.h1)}</h1>
<p class="meta">${esc(T.ui.updated)}: <time datetime="${TODAY}">${TODAY}</time></p>
<img class="hero" src="${up}assets/gameplay/${A.cover}.jpg" alt="${esc(gameText(L, A.cover)[0])}" width="1200" height="630" fetchpriority="high" decoding="async">
${a.intro.map(p => `<p>${esc(p)}</p>`).join('\n')}
<h2>${esc(T.ui.online)}</h2>
<p>${esc(T.ui.onlineNote)}</p>
<ul class="games">${gameItems}</ul>
${adSlot('article')}
<h2>${esc(T.ui.offline)}</h2>
<ul class="classic">${classic}</ul>
<h2>${esc(T.ui.tips)}</h2>
<ul>${a.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
<h2>${esc(T.ui.faq)}</h2>
${a.faq.map(([q, ans]) => `<details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join('\n')}
</article>
<h2>${esc(T.ui.more)}</h2>
<ul class="list">${more}</ul>
${langList(L, urlFor)}
<footer>${footerLinks(up)} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
      mkdirSync(join(dir, A.slug), { recursive: true });
      writeFileSync(join(dir, A.slug, 'index.html'), html);
      out.push({ url, cluster: cluster(urlFor), image });
    }

    // the list of articles in this language
    const hubUp = L.code === 'en' ? '../' : '../../';
    const url = hubUrl(L);
    const ld = [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: T.ui.hubTitle, description: T.ui.hubDesc, inLanguage: L.code, url },
      { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: ARTICLES.map((A, i) => ({ '@type': 'ListItem', position: i + 1, name: T.articles[A.slug].h1, url: articleUrl(L, A.slug) })) },
    ];
    const items = ARTICLES.map(A => `<li><img src="${hubUp}assets/${imageFor(A.cover, true)}" alt="" width="64" height="64" loading="lazy" decoding="async"><div><h3><a href="${A.slug}/">${esc(T.articles[A.slug].h1)}</a></h3><p>${esc(T.articles[A.slug].desc)}</p></div></li>`).join('');
    const hub = `${head(L, { title: `${T.ui.hubTitle} | ChitPlay`, desc: T.ui.hubDesc, url, urlFor: hubUrl, ld, image: `${SITE}/assets/home.jpg` }).replace(iconLinks(up), iconLinks(hubUp))}
<body>
<main>
${logoLink(hubUp)}
<h1>${esc(T.ui.hubTitle)}</h1>
<p>${esc(T.ui.hubIntro)}</p>
<ul class="games">${items}</ul>
${langList(L, hubUrl)}
<footer>${footerLinks(hubUp)} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), hub);
    out.push({ url, cluster: cluster(hubUrl), image: null });
  }
  return out;
}
