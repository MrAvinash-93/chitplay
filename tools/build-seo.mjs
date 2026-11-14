/**
 * Builds the search-engine side of ChitPlay from the game data:
 *   games/<slug>/index.html  — one landing page per game name (rules, roles, FAQ)
 *   games/index.html         — hub of every game name
 *   sitemap.xml, robots.txt, manifest.webmanifest
 *   indoor-games/, school-games/ — the topics people search for: what to play with four people
 *   about, contact, privacy, terms, disclaimer — the pages ad networks look for
 *   CNAME                    — the custom domain for GitHub Pages
 *   index.html, 404.html     — refreshes the <!-- seo:… --> and <!-- analytics --> blocks
 *
 * Usage:  node tools/build-seo.mjs [https://www.chitplay.com]
 *         node tools/build-seo.mjs [https://www.chitplay.com] --game-guides-only
 * (Run it again whenever a game, name or rule changes.)
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const SITE = (ARGS.find(arg => !arg.startsWith('--')) || process.env.SITE_URL || 'https://www.chitplay.com').replace(/\/+$/, '');
const MAIN_SLUG = 'cops-and-robbers';
const MAIN_URL = `${SITE}/games/${MAIN_SLUG}/`;
const TODAY = new Date().toISOString().slice(0, 10);
const GAME_GUIDES_ONLY = ARGS.includes('--game-guides-only');

// AdSense publisher id: from the command line once, then remembered through ads.txt
const ADS_TXT = join(ROOT, 'ads.txt');
const SAVED_PUB = existsSync(ADS_TXT) ? (readFileSync(ADS_TXT, 'utf8').match(/pub-\d{10,20}/)?.[0] || '') : '';
const PUB = (ARGS.find(arg => /^pub-\d{10,20}$/.test(arg)) || process.env.ADSENSE_PUB || SAVED_PUB).trim();
const HAS_ADS = /^pub-\d{10,20}$/.test(PUB);
// both ways AdSense verifies a site: the meta tag and the ad code itself
const ADSENSE_TAG = HAS_ADS ? `\n<meta name="google-adsense-account" content="ca-${PUB}">\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${PUB}" crossorigin="anonymous"></script>` : '';
/**
 * Ad places on the reading pages (game guides, articles, categories): between paragraphs, never next to
 * a Play button, and never on the pages games are played on. Each needs an AdSense ad unit: paste its
 * slot number here and rebuild. An empty slot writes nothing at all, so no page shows an empty box.
 */
const AD_SLOTS = { guide: '', article: '', category: '' };
/**
 * Adsterra native banner (4:1): used in an ad place that has no AdSense unit. Its container id may
 * appear only once on a page, and every reading page has exactly one ad place, so that holds.
 * Empty ADSTERRA_NATIVE turns it off everywhere.
 */
const ADSTERRA_NATIVE = { src: 'https://bauval.org/21/d5795ad3a6b91ea89d9d71ba6f70c273', id: 'd5795ad3a6b91ea89d9d71ba6f70c273' };
const adsterraBox = () => (ADSTERRA_NATIVE.id ? `<aside class="adbox" aria-label="Advertisement"><small>Advertisement</small><div id="container-${ADSTERRA_NATIVE.id}" style="min-height:120px"></div><script async="async" data-cfasync="false" src="${ADSTERRA_NATIVE.src}"></script></aside>` : '');
/**
 * Adsterra display banner, near the end of a reading page (after its questions). Both sizes share the
 * network's global atOptions, so a page runs exactly one: 300×250 on a phone, 728×90 on a wide screen,
 * chosen as the page loads. The script writes its frame where it stands, so it runs while the page
 * is read in (document.write), as the network's own code does. Empty keys turn it off.
 */
const ADSTERRA_BANNER = { phone: '0d0ef2bd40ba59e938dff27d3e6fd82c', wide: '8097c2bfb6769d5f4e6978f1fb86828a' };
const bannerSlot = () => (ADSTERRA_BANNER.phone ? `<aside class="adbox adbox--banner" aria-label="Advertisement"><small>Advertisement</small><div class="adbanner" style="display:flex;justify-content:center;overflow:hidden;min-height:90px"><script>(function(){var w=window.innerWidth>=760&&'${ADSTERRA_BANNER.wide}';var k=w||'${ADSTERRA_BANNER.phone}';window.atOptions={key:k,format:'iframe',height:w?90:250,width:w?728:300,params:{}};document.write('<scr'+'ipt src="https://bauval.org/22/'+k+'"><\\/scr'+'ipt>');})();</script></div></aside>` : '');
const adSlot = (name) => (HAS_ADS && AD_SLOTS[name] ? `<aside class="adbox" aria-label="Advertisement"><small>Advertisement</small><ins class="adsbygoogle" style="display:block;min-height:250px" data-ad-client="ca-${PUB}" data-ad-slot="${AD_SLOTS[name]}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></aside>` : adsterraBox());

const CONTACT_EMAIL = 'chitplaygame@gmail.com';
const DEVELOPER = 'Mr Avinash';
const MAILTO = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;
const DEVELOPER_LD = { '@type': 'Person', name: 'Avinash', honorificPrefix: 'Mr', email: CONTACT_EMAIL };

// Google Tag Manager only: the GA4 tag (G-Z89HHLVEQT) lives inside this container,
// so adding gtag.js as well would count every visit twice.
// Consent mode: where the law needs an opt-in (EEA, UK, Switzerland) cookies stay off until consent.
const CONSENT_REGIONS = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];
const CONSENT_KEYS = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'];
const consentArg = (value, region) => JSON.stringify({ ...Object.fromEntries(CONSENT_KEYS.map(k => [k, value])), ...(region ? { region } : {}) }).replace(/"/g, "'");
const ANALYTICS = `<!-- analytics -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', ${consentArg('granted')});
  gtag('consent', 'default', ${consentArg('denied', CONSENT_REGIONS)});
  gtag('js', new Date());
</script>
<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-KRTTSTQQ"></script>${ADSENSE_TAG}
<!-- /analytics -->`;

const footerLinks = (up) => `<a href="${up}games/">All games</a> · <a href="${up}how-to-play/">How to play</a> · <a href="${up}strategy/">Strategy</a> · <a href="${up}indoor-games/">Indoor games</a> · <a href="${up}school-games/">School games</a> · <a href="${up}articles/">Game ideas</a> · <a href="${up}about/">About</a> · <a href="${up}contact/">Contact</a> · <a href="${up}privacy/">Privacy</a> · <a href="${up}terms/">Terms</a> · <a href="${up}disclaimer/">Disclaimer</a><br>🌍 ${langLinks(up)}`;
const logoLink = (up) => `<a href="${up}" style="display:inline-block"><img src="${up}assets/logo.webp" alt="ChitPlay" width="180" height="31" style="display:block"></a>`;
const iconLinks = (up) => `<link rel="icon" href="${up}assets/icon-192.png" sizes="192x192" type="image/png">
<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="icon" href="${up}favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" sizes="180x180" href="${up}assets/apple-touch-icon.png">
<link rel="manifest" href="${up}manifest.webmanifest">
<meta name="theme-color" content="#140b07">`;

const src = readFileSync(join(ROOT, 'src/world/countries.js'), 'utf8');
const C = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const { COUNTRIES, COUNTRY_ORDER, GAME_SLUGS, GAME_AKA, GAME_NAME_EN, ROLE_LATIN, localize } = C;
const { LANG_PAGES } = await import('./seo-langs.mjs');
const { guideFor } = await import('./seo-guides.mjs');
// the game-idea articles (tools/articles): every game page links to the ones that list it
const { ARTICLES } = await import('./articles/index.mjs');
const ARTICLE_WORDS = Object.fromEntries(await Promise.all(['en', ...LANG_PAGES.map(L => L.code)].map(async c => [c, (await import(`./articles/${c}.mjs`)).default])));
/** "Featured in" links for a game: up is the path from the page to the site root, dir the language folder ('' for English). */
function featuredIn(slug, code, up, dir) {
  const T = ARTICLE_WORDS[code];
  const list = ARTICLES.filter(a => a.games.includes(slug));
  if (!T || !list.length) return '';
  return `<h2>${esc(T.ui.hub)}</h2>\n<ul class="featured-in">${list.map(a => `<li><a href="${up}${dir ? `${dir}/` : ''}articles/${a.slug}/">${esc(T.articles[a.slug].h1)}</a></li>`).join('')}</ul>`;
}
const { default: MAIN_GUIDES } = await import('./guides/main.mjs');
// a game's page in a language is only offered to search engines once that language has its own full guide
const guidedLangs = (slug) => LANG_PAGES.filter(L => guideFor(L.code, slug));
const NAMES_BY_COUNTRY = COUNTRY_ORDER.map(id => ({ id, country: COUNTRIES[id].name, name: GAME_NAME_EN[id], aka: GAME_AKA[id].filter(a => a !== GAME_NAME_EN[id]).slice(0, 2), roles: (ROLE_LATIN[id] || []).join(', ') }));
/** The games list in English and its pages in other languages point at each other, so each search shows its own. */
const hreflangLinks = () => [['en', `${SITE}/games/`], ...LANG_PAGES.map(L => [L.code, `${SITE}/${L.dir}/`]), ['x-default', `${SITE}/games/`]]
  .map(([c, u]) => `<link rel="alternate" hreflang="${c}" href="${u}">`).join('\n');
const langLinks = (up) => LANG_PAGES.map(L => `<a href="${up}${L.dir}/" hreflang="${L.code}" lang="${L.code}">${L.label}</a>`).join(' · ');

// the real rules engine, so the worked scoring examples always match the game
const M = await import('data:text/javascript;base64,' + Buffer.from(readFileSync(join(ROOT, 'src/world/match.js'), 'utf8')).toString('base64'));

// "How to play" in the way people search for it locally (Latin letters where that is how people type)
const LOCAL_HOWTO = {
  IN: ['hi-Latn', 'Raja Rani Chor Police kaise khele', 'Chaar log, chaar parchiyan: Raja, Rani, Chor aur Police. Parchiyan mod ke beech me daalo, sab ek-ek uthao aur chupke se dekho. Police bolta hai "Main Police hoon!" aur use Chor pakadna hota hai. Sahi pakda to Police ko 500 milte hain aur Chor ko 0. Galat pakda to Chor ko 500 milte hain aur Police ko 0. Raja ko 1000 aur Rani ko 800 milte hain. Jitne round chaho khelo, sabse zyada points wala jeetta hai.'],
  PK: ['ur-Latn', 'Raja Wazir Chor Sipahi kaise khelein', 'Chaar parchiyan: Raja, Wazir, Chor aur Sipahi. Sab ek-ek parchi uthate hain. Sirf Wazir samne aata hai, baqi koi apni parchi nahi batata. Usay baqi teen mein se Chor pehchanna hota hai. Sahi pehchana to Wazir ko 800, ghalat hua to Chor ko 800 aur Wazir ko 0. Raja ko 1000 aur Sipahi ko 500 milte hain.'],
  NP: ['ne-Latn', 'Raja Mantri Chor Sipahi kasari khelne', 'Char ota chit: Raja, Mantri, Chor ra Sipahi. Sabai le euta chit tanchhan. Mantri matra aafno parichaya dinchha, ani baki tin madhye Chor chinnu parchha. Sahi bhaye Mantri lai 800, galat bhaye Chor lai 800 ra Mantri lai 0. Raja lai 1000 ra Sipahi lai 500.'],
  BD: ['bn-Latn', 'Raja Mantri Chor Police kivabe khelbo', 'Charti chirkut: Raja, Mantri, Chor ar Police. Sobai ekta kore chirkut tule chupi chupi dekhe. Shudhu Police nijer porichoy dey, ar baki tin joner moddhe Chor khuje ber kore. Thik dhorle Police pay 500, bhul hole Chor pay 500 ar Police shunno. Raja pay 1000, Mantri pay 800.'],
  JP: ['ja', '殿様と泥棒の遊び方', '四枚の紙に殿様・家老・岡っ引き・泥棒と書いて、たたんで一枚ずつ引きます。岡っ引きが名乗り出て、泥棒が誰かを当てます。ヒントで一人は無実とわかります。当たれば岡っ引きに500点、外れたら泥棒に1000点。'],
  KR: ['ko', '마피아 게임 하는 법 (쪽지 버전)', '네 장의 쪽지에 시민, 의사, 경찰, 마피아를 적어 한 장씩 뽑아요. 밤에 마피아가 한 명을 공격하고 의사는 한 명을 살릴 수 있어요. 경찰이 마피아를 맞히면 500점, 틀리면 마피아가 1000점을 가져가요.'],
  CN: ['zh', '警察抓小偷怎么玩', '四张纸条：皇帝、宰相、警察、小偷，折好后每人抽一张。警察亮明身份，要找出谁是小偷。抓对了，警察得500分，小偷还要罚200分给警察；抓错了，小偷得1000分。'],
  RU: ['ru', 'Как играть в Мафию на бумажках', 'Четыре записки: Мирный, Доктор, Комиссар и Мафия. Каждый тянет одну. Ночью Комиссар тайно проверяет одного игрока. Угадал Мафию — Комиссар получает 500 очков, ошибся — Мафия получает 1000.'],
  DE: ['de', 'So spielt man Räuber und Gendarm mit Zetteln', 'Vier gefaltete Zettel: König, Königin, Gendarm und Räuber. Jeder zieht einen. Der Gendarm gibt sich zu erkennen und muss den Räuber finden. Ein Zeuge gibt ihm einen Tipp, der aber nicht immer stimmt. Richtig geraten: 500 Punkte für den Gendarm. Falsch geraten: Der Räuber bekommt 1000.'],
  FR: ['fr', 'Comment jouer à Gendarmes et Voleurs avec des papiers', 'Quatre papiers pliés : Roi, Reine, Gendarme et Voleur. Chacun en tire un. Le Gendarme se dévoile et doit trouver le Voleur. S’il a raison, il gagne 500 points ; sinon, le Voleur gagne 1000. La dernière manche compte double.'],
  BR: ['pt-BR', 'Como jogar Polícia e Ladrão com papelzinhos', 'Quatro papéis dobrados: Rei, Rainha, Polícia e Ladrão. Cada um tira um. A Polícia se revela e tem que descobrir o Ladrão. Acertou: 500 pontos para a Polícia. Errou: o Ladrão ganha 1000 e ainda rouba 300 do Rei.'],
  MX: ['es-MX', 'Cómo jugar Policías y Ladrones con papelitos', 'Cuatro papelitos doblados: Rey, Reina, Policía y Ladrón. Cada quien saca uno. El Policía se descubre y tiene que adivinar quién es el Ladrón. Si acierta, gana 500 puntos; si falla, el Ladrón se lleva 1000. Ojo: alguien siempre se ríe, y casi siempre es el Ladrón.'],
};

/** One worked round, scored by the real engine: { caught, missed } points per seat (seat i holds SLOTS[i]). */
function scoringExample(base) {
  const run = (accuse) => {
    const m = new M.Match(base, 4, 5);
    m.round = 1;
    m.roles = SLOTS.slice();
    m.nightResult = base.rules.night ? { victim: 0, doctor: 1, save: 0, saved: true } : null;
    return m.resolve([accuse]).points;
  };
  const g = SLOTS.indexOf(base.rules.guesser);
  const wrong = [0, 1, 2].find(s => s !== g);
  return { caught: run(3), missed: run(wrong), guesserSeat: g, wrongSeat: wrong };
}

const LANG = { IN: 'hi', PK: 'ur', NP: 'ne', BD: 'bn', JP: 'ja', KR: 'ko', CN: 'zh', RU: 'ru', US: 'en', UK: 'en-GB', DE: 'de', FR: 'fr', BR: 'pt-BR', MX: 'es-MX' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const regexEsc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const SLOTS = ['king', 'queen', 'detective', 'thief'];

function pageFor(id) {
  const base = COUNTRIES[id];
  const en = localize(base, 'en');
  const local = localize(base, 'local');
  const slug = GAME_SLUGS[id];
  const primary = GAME_NAME_EN[id];
  const aka = [primary, ...GAME_AKA[id].filter(a => a !== primary)];
  const url = `${SITE}/games/${slug}/`;
  const guesserEn = en.roles[base.rules.guesser].name;
  const thiefEn = en.roles.thief.name;
  const sameName = local.game === en.game;
  // the name in the country's own script (राजा रानी चोर पुलिस, 警察抓小偷…) helps people searching there
  const localScript = aka.find(a => /[^\u0000-ɏ\s'’&,.:()-]/.test(a)) || (local.game !== primary ? local.game : null);
  const country = base.name;
  // India searches both names: Raja Rani Chor Police and (Raja Rani) Chor Sipahi
  const seoName = id === 'IN' ? 'Raja Rani Chor Police (Chor Sipahi)' : primary.replace(':', '');
  const title = `${seoName} – Play Free Online | ChitPlay`;
  const desc = `Play ${primary}${localScript ? ` (${localScript})` : ''} free on ChitPlay, the 3D chit game for all ages. The ${guesserEn} must catch the ${thiefEn}: rules, scoring and printable chits.`;
  const lh = LOCAL_HOWTO[id];
  const ex = scoringExample(base);
  const castName = (i) => base.cast[i];
  // the game's own role name in Latin letters (Raja, Wazir…), plus English and local script when they differ
  const roleLabel = (slot, i) => {
    const own = ROLE_LATIN?.[id]?.[i] || en.roles[slot].name;
    const enName = en.roles[slot].name;
    return { own, enName: own.toLowerCase() === enName.toLowerCase() ? null : enName, script: [own, enName].includes(local.roles[slot].name) ? null : local.roles[slot].name };
  };
  const exRows = SLOTS.map((slot, i) => {
    const l = roleLabel(slot, i);
    return `<tr><td>${esc(castName(i))}</td><td>${esc(base.roles[slot].emoji)} ${esc(l.own)}${l.enName ? ` (${esc(l.enName)})` : ''}</td><td>${ex.caught[i]}</td><td>${ex.missed[i]}</td></tr>`;
  }).join('');
  const chits = SLOTS.map((slot, i) => {
    const l = roleLabel(slot, i);
    return `<div class="chit"><span class="chit-emoji">${esc(base.roles[slot].emoji)}</span><strong>${esc(l.own)}</strong>${l.script ? `<span lang="${LANG[id]}">${esc(l.script)}</span>` : ''}${l.enName ? `<span>${esc(l.enName)}</span>` : ''}<small>${slot === 'thief' ? '0' : base.roles[slot].points} pts</small></div>`;
  }).join('');
  const playEn = `../../?game=${slug}`;
  const roleRows = SLOTS.map(slot => {
    const r = base.roles[slot];
    const pts = slot === 'thief' ? `0 if caught · ${base.rules.escape ?? base.roles[base.rules.guesser].points} if not` : r.points;
    return `<tr><td>${esc(r.emoji)} <strong>${esc(en.roles[slot].name)}</strong></td><td lang="${LANG[id]}">${esc(local.roles[slot].name)}</td><td>${esc(pts)}</td></tr>`;
  }).join('');
  const steps = [
    `Four players each draw a folded paper chit. Each chit hides one role: ${SLOTS.map(s => en.roles[s].name).join(', ')}.`,
    `The ${guesserEn} reveals their chit. Nobody else says who they are: everyone keeps a straight face.`,
    `The ${guesserEn} studies the faces and accuses one player of being the ${thiefEn}.`,
    `Everyone opens their chit and scores: ${en.ruleText}`,
    'Play 3, 5, 7, 10 or 20 rounds. The highest total wins.',
  ];
  const faq = [
    [`How do you play ${primary}?`, `${steps.join(' ')}`],
    [`Is ${primary} free to play online?`, `Yes. ChitPlay is free, runs in any modern browser on phone or computer, and needs no download or sign-up.`],
    [`How many players does ${primary} need?`, `The classic game needs exactly four players. In CHITPLAY you can play with three computer players, invite up to three friends on their own phones, pass a single phone around, or just watch.`],
    [`Is ${primary} only for children?`, `No. Children, teenagers, parents and grandparents all play it. It takes a minute to learn, and bluffing is just as much fun at any age.`],
    [`Is ${primary} a good indoor game?`, `Yes. On paper all you need is a page and a pen, so it works at home, in a classroom, on a train or during a power cut. Online you only need a phone.`],
    [`What are the roles in ${primary}?`, `${SLOTS.map(s => `${en.roles[s].name} (${local.roles[s].name})`).join(', ')}.`],
    [`What is ${primary} also called?`, `${aka.join(', ')}.`],
    [`Can we play ${primary} on one phone?`, `Yes. Choose Single Phone and pass it around: each person secretly opens their own chit, then the ${guesserEn} takes the phone to make the catch. Two to four people can play.`],
    [`Can I play ${primary} on my phone?`, `Yes. ChitPlay works on Android and iPhone browsers. Tap 🔄 to play in landscape, and add it to your home screen to play like an app, even offline.`],
    [`Which languages can I play ${primary} in?`, 'The game and the voices are in English. The players\' chat bubbles can also be shown in Hinglish, Roman Urdu, Roman Nepali, Roman Bangla, Japanese, Korean, Chinese, Russian, German, French, Portuguese or Spanish, all written in Latin letters.'],
    [`How do you make the chits for ${primary} at home?`, `Tear a page into four slips, write ${SLOTS.map(s => en.roles[s].name).join(', ')} on them with the points, fold them and shuffle. Or print the ready-made chits on this page.`],
    [`How many points does each role get in ${primary}?`, `${SLOTS.filter(s => s !== 'thief').map(s => `${en.roles[s].name} ${base.roles[s].points}`).join(', ')}. The ${thiefEn} gets 0 when caught and ${base.rules.escape ?? base.roles[base.rules.guesser].points} when not caught.`],
    [`Can you cheat in ${primary}?`, `In CHITPLAY the ${guesserEn} can press 🤫 Cheat to try to peek at a chit. Seven times in ten nobody notices, and you see one innocent player's chit, never the ${thiefEn}'s. Three times in ten you are caught: you see nothing, you lose 100 points, and the table lets you hear about it. Computer players try it too.`],
  ];
  const ruleTip = base.rules.secondChance ? `You get two shots: use the first to test your hunch, then watch how everyone reacts.`
    : base.rules.night ? `Watch who looks relieved after the night. The Mafia already knows who was attacked.`
    : base.rules.check ? `Your night check either catches the Mafia straight away or clears someone. Either way, one fewer suspect.`
    : base.rules.witness ? `Witnesses are right about two times in three, so trust the tip but check the faces too.`
    : base.rules.tell ? `Someone always giggles. It's usually the ${thiefEn}, but a smart ${thiefEn} might make someone else laugh.`
    : base.rules.hint ? `The clue clears one innocent, so you're down to two. Look for the one avoiding your eyes.`
    : base.rules.alibi ? `Listen to the alibis. The vaguest one is often the ${thiefEn}.`
    : base.rules.fine ? `Catching the ${thiefEn} also earns you their 200 fine, so it's worth taking your time.`
    : base.rules.steal ? `If the ${thiefEn} escapes they also steal 300 from the ${en.roles.king.name}, so even royals want them caught.`
    : base.rules.finalDouble ? `The last round counts double. A comeback is always possible.`
    : `A wrong guess swaps your points with the ${thiefEn}'s, so think before you point.`;
  const tips = [
    `As the ${thiefEn}: act exactly like everyone else. Don't over-explain and don't go too quiet.`,
    `As the ${guesserEn}: watch who looks away, laughs too much, or rushes to say “it's not me”.`,
    `As a royal: acting a little nervous can pull suspicion away from the real ${thiefEn}.`,
    ruleTip,
  ];
  const others = COUNTRY_ORDER.filter(o => o !== id).map(o => `<li><a href="../${GAME_SLUGS[o]}/">${esc(GAME_NAME_EN[o])}</a></li>`).join('');
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'VideoGame', name: primary, alternateName: aka.slice(1),
      url, description: desc, genre: ['Party game', 'Social deduction game', 'Paper chit game'],
      countryOfOrigin: { '@type': 'Country', name: country },
      gamePlatform: 'Web browser', applicationCategory: 'Game', operatingSystem: 'Any',
      numberOfPlayers: { '@type': 'QuantitativeValue', value: 4 }, playMode: ['https://schema.org/SinglePlayer', 'https://schema.org/MultiPlayer'],
      inLanguage: ['en', LANG[id]], image: [`${SITE}/assets/chitplay-game.jpg`, `${SITE}/assets/home.jpg`],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: DEVELOPER_LD,
      isPartOf: { '@type': 'WebSite', name: 'CHITPLAY', url: `${SITE}/` },
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
    {
      '@context': 'https://schema.org', '@type': 'HowTo', name: `How to play ${primary}`,
      description: `How to play ${primary} (${aka.slice(1, 3).join(', ')}) with four paper chits.`,
      totalTime: 'PT5M', supply: [{ '@type': 'HowToSupply', name: '4 paper chits' }, { '@type': 'HowToSupply', name: 'A pen' }],
      step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'CHITPLAY', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Games', item: `${SITE}/games/` },
        { '@type': 'ListItem', position: 3, name: primary, item: url },
      ],
    },
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#140b07">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/home.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/home.jpg">
${iconLinks('../../')}
<link rel="manifest" href="../../manifest.webmanifest">
<script type="application/ld+json">${json(ld)}</script>
<style>
:root{--bg:#140b07;--panel:#24140c;--ink:#f6ead2;--muted:#d4c2a0;--gold:#ffd27a;--accent:#ff8a3d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--gold)}main{max-width:820px;margin:0 auto;padding:20px 16px 48px}
nav.crumbs{font-size:13px;color:var(--muted)}nav.crumbs a{color:var(--muted)}
h1{font-size:clamp(26px,6vw,40px);line-height:1.15;margin:12px 0 8px;color:var(--gold)}h2{font-size:22px;margin:32px 0 10px}
.lead{font-size:18px;color:var(--muted)}.aka{display:flex;flex-wrap:wrap;gap:6px;padding:0;list-style:none}
.aka li{padding:4px 12px;border:1px solid #6b4a2a;border-radius:999px;font-size:14px}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}.btn{display:inline-block;padding:14px 22px;border-radius:12px;font-weight:700;text-decoration:none;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6}
.btn.alt{background:#3a2414;color:var(--ink);border:1px solid #6b4a2a}
table{width:100%;border-collapse:collapse;background:var(--panel);border-radius:12px;overflow:hidden}td,th{padding:10px 12px;border-bottom:1px solid #3a2414;text-align:left;overflow-wrap:anywhere}h1,h2,p,li{overflow-wrap:anywhere}
ol li{margin:6px 0}details{background:var(--panel);border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}
.others{columns:2;padding-left:18px}footer{margin-top:40px;font-size:13px;color:var(--muted)}
button.btn{border:1px solid #6b4a2a;font:inherit;font-weight:700;cursor:pointer}
.chits{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.chit{display:flex;flex-direction:column;align-items:center;gap:2px;padding:18px 10px;border:2px dashed #b08a5a;border-radius:6px;background:#f6ead2;color:#2a1a10;text-align:center}
.chit-emoji{font-size:34px;line-height:1}.chit strong{font-size:20px}.chit small{color:#6b4a2a}
@media print{body{background:#fff}body *{visibility:hidden}.chits,.chits *{visibility:visible}.chits{position:absolute;inset:0;gap:0}.chit{min-height:45vh;justify-content:center;border-color:#999;background:#fff}.chit strong{font-size:32px}.chit-emoji{font-size:64px}}
</style>
</head>
<body>
<main>
${logoLink('../../')}
<nav class="crumbs" aria-label="Breadcrumb"><a href="../../">ChitPlay</a> › <a href="../">Games</a> › ${esc(primary)}</nav>
<h1>${esc(primary)}: play the indoor chit game online</h1>
<p class="lead" style="margin-top:-4px">${esc(country)}'s chit game${localScript ? ` · <span lang="${LANG[id]}">${esc(localScript)}</span>` : ''}</p>
<p class="lead">The 4-player paper chit game <strong>${esc(primary)}</strong>${sameName ? '' : ` (${esc(en.game)})`}, free in your browser for all ages. Four players, four folded chits: the ${esc(guesserEn)} has to catch the ${esc(thiefEn)}.</p>
<img src="../../assets/chitplay-game.webp" alt="${esc(primary)} in ChitPlay: four players at the chit game in a 3D room" width="1200" height="675" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px">
<div class="cta"><a class="btn" href="${playEn}">▶ Play ${esc(primary)} now</a></div>
<h2>Also known as</h2>
<ul class="aka">${aka.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
<h2>How to play ${esc(primary)}</h2>
<ol>${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
<h2>Roles and points</h2>
<table><thead><tr><th>Role</th><th>Local name</th><th>Points</th></tr></thead><tbody>${roleRows}</tbody></table>
<h2>The special rule</h2>
<p>${esc(en.ruleText)}</p>
${local.ruleText !== en.ruleText ? `<p lang="${LANG[id]}">${esc(local.ruleText)}</p>` : ''}
<h2>Scoring example</h2>
<p>One round of ${esc(primary)}. ${esc(castName(ex.guesserSeat))} is the ${esc(guesserEn)}. What everyone scores if the ${esc(thiefEn)} is caught, and if ${esc(castName(ex.guesserSeat))} accuses ${esc(castName(ex.wrongSeat))} instead:</p>
<table><thead><tr><th>Player</th><th>Chit</th><th>${esc(thiefEn)} caught</th><th>Wrong guess</th></tr></thead><tbody>${exRows}</tbody></table>
${lh ? `<h2 lang="${lh[0]}">${esc(lh[1])}</h2>\n<p lang="${lh[0]}">${esc(lh[2])}</p>` : ''}
<h2>Print the chits</h2>
<p>Playing with real paper? Print this page, cut out the four chits, fold them and shuffle.</p>
<div class="chits">${chits}</div>
<p><button class="btn alt" type="button" onclick="window.print()">🖨️ Print the chits</button></p>
<h2>Questions</h2>
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<h2>Tips to win ${esc(primary)}</h2>
<ul>${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
<h2>More chit games</h2>
<ul class="others">${others}</ul>
<p><a class="btn" href="${playEn}">▶ Start a game of ${esc(primary)}</a></p>
<footer>${footerLinks('../../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}

// ── Table games: one guide page each, written from the same rules the game itself shows ──
const { ALL_GAMES: TABLE_GAMES } = await import('../src/arcade/catalog.js');
const { RULES } = await import('../src/arcade/rules.js');
globalThis.document ??= undefined;
const { logoSvg } = await import('../src/arcade/logo.js');
const PARTY = TABLE_GAMES.map((g) => {
  if (!RULES[g.slug]) throw new Error(`no rules written for ${g.slug}`);
  for (const L of LANG_PAGES) {
    if (!L.names[g.slug]) throw new Error(`no ${L.label} game name for ${g.slug}`);
  }
  return { ...g, ...RULES[g.slug], players: g.min === g.max ? String(g.min) : `${g.min}–${g.max}`, time: `${g.minutes} ${g.minutes === "1" ? "minute" : "minutes"}` };
});
const imageFor = (slug, square = false, extension = 'webp') => {
  const file = `${slug}${square ? '-square' : ''}.${extension}`;
  return existsSync(join(ROOT, 'assets', 'games', file)) ? `games/${file}` : `chitplay-game.${extension}`;
};
const gameplayImageFor = (slug) => `gameplay/${slug}.jpg`;
/**
 * The questions people ask a phone or a smart speaker about a game, answered in a sentence or two.
 * They go after the game's own questions (never twice), on the page and in its FAQ data.
 */
function voiceFaq(g) {
  const n = g.min === g.max ? `${g.min}` : `${g.min} to ${g.max}`;
  const list = [
    [`How do you play ${g.name} online with friends?`, `Open ${g.name} on ChitPlay and choose Play with Friends. One phone opens a room and gets a 6-digit code; your friends type the code or scan the QR code on their own phones and join. No sign-up is needed.`],
    [`Can I play ${g.name} without downloading anything?`, `Yes. ${g.name} runs in the web browser on phones, tablets and computers. Open www.chitplay.com, pick ${g.name} and play as a guest.`],
    [`How many players can play ${g.name}?`, `${g.name} on ChitPlay is for ${n} player${g.max > 1 ? 's' : ''}. ${g.min === 1 ? 'You can play alone, or with friends and family.' : 'Computer players fill any empty seats, so you can always start a game.'}`],
    [`Is ${g.name} free to play?`, `Yes, ${g.name} is completely free on ChitPlay. There is no real money, betting or prizes, and points have no value outside the game.`],
    [`Can I play ${g.name} against the computer?`, g.min === 1 ? `Yes. You can play ${g.name} on your own and try to beat your best score, or race against computer players.` : `Yes. Choose Play and ChitPlay's computer players take the other seats, at an easy, normal or hard level.`],
  ];
  const seen = new Set((g.faq || []).map(([q]) => q.toLowerCase()));
  return list.filter(([q]) => !seen.has(q.toLowerCase()));
}
/** Every way this game can be played, with a link straight into each. */
function waysToPlay(g) {
  const p = (mode) => `../../play/?game=${g.slug}&mode=${mode}`;
  const solo = g.min === 1;
  const ways = [
    ['play', '👤 Guest play', solo ? 'Start straight away, no account and no sign-up. Your best score is kept on your device.' : `Start straight away against computer players, no account and no sign-up. Choose ${g.min === g.max ? g.min : `${g.min} to ${g.max}`} players.`],
    ['online', '🌍 Play online', 'Get matched with real players from around the world. If nobody is free within a few seconds, computer players take the empty seats so you are never left waiting.'],
    ['nearby', '👫 Play with friends', 'Open a room, and friends join from their own phones with a 6-digit code or by scanning a QR code. Works on the same Wi-Fi or across the internet.'],
    ['pass', g.video ? '🎮 Two on one screen' : '📱 One phone', g.video ? 'Sit side by side: one player on W A S D, the other on the arrow keys, or a gamepad each.' : 'Pass one phone around the table; secrets stay hidden until it is your turn.'],
    ['watch', '👀 Watch', 'Let the computer players show you how the game goes before you jump in.'],
  ];
  return `<h2>Ways to play ${esc(g.name)}</h2>
<ul class="ways">${ways.map(([m, t, d]) => `<li><a href="${p(m)}"><strong>${t}</strong></a> ${esc(d)}</li>`).join('')}</ul>`;
}
function partyPage(g) {
  const url = `${SITE}/games/${g.slug}/`;
  const plain = g.name.replace('?', '');
  const title = `ChitPlay: ${plain} Game – Play Free Online${g.video ? ' in 3D' : ''}`;
  const img = `${SITE}/assets/${imageFor(g.slug, false, 'jpg')}`;
  const imgSq = `${SITE}/assets/${imageFor(g.slug, true, 'jpg')}`;
  const art = imageFor(g.slug);
  const icon = imageFor(g.slug, true);
  const plainName = g.name.replace('?', '');
  const localizedNames = LANG_PAGES.map(L => ({ language: L, name: L.names[g.slug][0] }));
  const alternateNames = [...new Set(localizedNames.map(x => x.name).filter(n => n !== g.name))];
  const metaDesc = [
    `Play ${plainName} free online: ${g.blurb} No sign-up: play the computer, online or with friends.`,
    `Play ${plainName} free online: ${g.blurb} Free, no sign-up, in 3D.`,
    `Play ${plainName} free online: ${g.blurb}`,
  ].find(d => d.length <= 158) || `Play ${plainName} free online: ${g.blurb}`.slice(0, 155).replace(/\s+\S*$/, '') + '…';
  const play = `../../play/?game=${g.slug}`;
  const gameplayImg = `${SITE}/assets/${gameplayImageFor(g.slug)}`;
  // the same kind first, then the most-played kinds, so every page offers a few games to try next
  const related = [...PARTY.filter(o => o.slug !== g.slug && o.kind === g.kind), ...PARTY.filter(o => o.slug !== g.slug && o.kind !== g.kind && o.hot)].slice(0, 8)
    .map(o => `<li><a href="../${o.slug}/"><img src="../../assets/${imageFor(o.slug, true)}" alt="" width="72" height="72" loading="lazy" decoding="async"><span>${esc(o.name)}</span></a></li>`).join('');
  const nameRows = localizedNames.map(({ language, name }) => `<li><a href="../../${language.dir}/games/${g.slug}/" hreflang="${language.code}" lang="${language.code}">${esc(language.label)}: <span>${esc(name)}</span></a><small>English: ${esc(g.name)}</small></li>`).join('');
  const alternates = [['en', url], ...guidedLangs(g.slug).map(L => [L.code, `${SITE}/${L.dir}/games/${g.slug}/`]), ['x-default', url]]
    .map(([code, href]) => `<link rel="alternate" hreflang="${code}" href="${href}">`).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'VideoGame', name: g.name, alternateName: alternateNames, url, description: metaDesc, playMode: g.min === 1 ? ['SinglePlayer', 'MultiPlayer', 'CoOp'] : ['MultiPlayer'], inLanguage: 'en', image: [gameplayImg, imgSq, img], gamePlatform: 'Web browser', applicationCategory: 'Game', genre: [`${g.kind} game`], numberOfPlayers: { '@type': 'QuantitativeValue', minValue: g.min, maxValue: g.max }, author: DEVELOPER_LD, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [...g.faq, ...voiceFaq(g)].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Games', item: `${SITE}/games/` }, { '@type': 'ListItem', position: 3, name: g.name, item: url }] },
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${gameplayImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(plain)} gameplay in ChitPlay's 3D room">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${gameplayImg}">
${iconLinks('../../')}
${alternates}
<script type="application/ld+json">${json(ld)}</script>
<link rel="stylesheet" href="../../assets/game-guide.css?v=20261114-1448">
</head>
<body class="game-guide">
<a class="skip-link" href="#content">Skip to game guide</a>
<main id="content" class="guide">
${logoLink('../../')}
<nav aria-label="Breadcrumb"><a href="../../">ChitPlay</a> › <a href="../">Games</a> › ${esc(g.name)}</nav>
<div class="gamehead"><img src="../../assets/${icon}" alt="" width="96" height="96" decoding="async"><h1>${esc(g.name)}: play free online and learn the rules</h1></div>
<p class="playtop playmodes"><a class="btn btn--big" href="${play}&mode=play">▶ Play ${esc(g.name)} now</a><a class="btn btn--mode" href="${play}&mode=online">🌍 Play online</a><a class="btn btn--mode" href="${play}&mode=nearby">👫 Play with friends</a></p>
<ul class="facts"><li>👥 ${g.players} players</li><li>⏱ ${g.time}</li><li>👤 guest play</li><li>🌍 online opponents</li><li>🤖 computer players</li><li>👫 play with friends</li><li>🆓 free, no sign-up</li></ul>
<p>${esc(g.intro)}</p>
<figure class="gameplay-preview"><img src="../../assets/${gameplayImageFor(g.slug)}" alt="${esc(plain)} gameplay in ChitPlay's 3D room" width="1200" height="630" fetchpriority="high" decoding="async"><figcaption>Actual gameplay in the ChitPlay 3D room.</figcaption></figure>
${waysToPlay(g)}
${adSlot('guide')}
<h2>How to play</h2>
<ol>${g.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
<h2>Scoring</h2>
<p>${esc(g.scoring)}</p>
<h2>Who wins</h2>
<p>${esc(g.win)}</p>
${g.levels ? `<h2>Levels</h2>\n<ol>${g.levels.map(([k, d]) => `<li><strong>${esc(k)}:</strong> ${esc(d)}</li>`).join('')}</ol>
` : ''}${g.house ? `<h2>House rules you can switch on</h2>\n<ul>${g.house.map(([k, d]) => `<li><strong>${esc(k)}:</strong> ${esc(d)}</li>`).join('')}</ul>` : ''}
<h2>Tips</h2>
<ul>${g.tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>Questions</h2>
${[...g.faq, ...voiceFaq(g)].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<section class="language-names" aria-labelledby="language-names-title">
<h2 id="language-names-title">What is ${esc(g.name)} called in other languages?</h2>
<ul>${nameRows}</ul>
</section>
${bannerSlot()}
${featuredIn(g.slug, 'en', '../../', '')}
<h2>More games</h2>
<ul class="more-games">${related}</ul>
<p><a href="../cops-and-robbers/">Cops and Robbers (Raja Rani Chor Police)</a> · <a href="../">All games</a></p>
<p><small>Points in this game have no value. ChitPlay involves no real money, betting or prizes.</small></p>
<footer>${footerLinks('../../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}

function localizedPartyPage(g, L) {
  const name = L.names[g.slug][0];
  const description = L.names[g.slug][1];
  const url = `${SITE}/${L.dir}/games/${g.slug}/`;
  const enUrl = `${SITE}/games/${g.slug}/`;
  // a name the language shares with English ("Carrom") gets that language's "play free" instead of "Carrom (Carrom)",
  // so each language's page has its own title
  const plain = (s) => s.toLowerCase().replace(/[’']/g, "'");
  const sameName = plain(name).includes(plain(g.name));   // "Carrom", "Ludo (petits chevaux)": English is already in it
  const freePlay = L.ui.playNow.replace(/^▶\s*/, '');
  const named = sameName ? name : `${name} (${g.name})`;
  const title = [`${named} – ${freePlay} | ChitPlay`, `${named} | ChitPlay`].find(t => t.length <= 62) || `${named} | ChitPlay`;
  const rawMetaDesc = sameName ? `${name}: ${description}` : `${name} (${g.name}): ${description}`;
  const metaDesc = rawMetaDesc.length > 157 ? `${rawMetaDesc.slice(0, 157).replace(/\s+\S*$/, '')}…` : rawMetaDesc;
  const img = `${SITE}/assets/${imageFor(g.slug, false, 'jpg')}`;
  const gameplayImg = `${SITE}/assets/${gameplayImageFor(g.slug)}`;
  const icon = imageFor(g.slug, true);
  const play = `../../../play/?game=${g.slug}&mode=play&lang=${L.game}`;
  const alternates = [['en', enUrl], ...guidedLangs(g.slug).map(language => [language.code, `${SITE}/${language.dir}/games/${g.slug}/`]), ['x-default', enUrl]]
    .map(([code, href]) => `<link rel="alternate" hreflang="${code}" href="${href}">`).join('\n');
  const related = [...PARTY.filter(other => other.slug !== g.slug && other.kind === g.kind), ...PARTY.filter(other => other.slug !== g.slug && other.kind !== g.kind && other.hot)].slice(0, 8);
  const otherLanguages = LANG_PAGES.filter(language => language !== L)
    .map(language => `<li><a href="../../../${language.dir}/games/${g.slug}/" hreflang="${language.code}" lang="${language.code}">${esc(language.label)}: ${esc(language.names[g.slug][0])}</a></li>`).join('');
  const guide = guideFor(L.code, g.slug);
  const guideHtml = guide ? `<section class="guide-card" aria-labelledby="local-how">
<h2 id="local-how">${esc(guide.headings.how)}</h2>
<ol>${guide.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
${guide.scoring ? `<h3>${esc(guide.headings.scoring)}</h3>\n<p>${esc(guide.scoring)}</p>` : ''}
${guide.win ? `<h3>${esc(guide.headings.win)}</h3>\n<p>${esc(guide.win)}</p>` : ''}
</section>
${adSlot('guide')}
<section aria-labelledby="local-faq">
<h2 id="local-faq">${esc(guide.headings.faq)}</h2>
${guide.faq.map(([q, a]) => `<details open><summary><strong>${esc(q)}</strong></summary><p>${esc(a)}</p></details>`).join('\n')}
</section>` : '';
  const ld = [
    ...(guide ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: L.code, mainEntity: guide.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : []),
    { '@context': 'https://schema.org', '@type': 'VideoGame', name, alternateName: [g.name], url, description, playMode: g.min === 1 ? ['SinglePlayer', 'MultiPlayer', 'CoOp'] : ['MultiPlayer'], inLanguage: L.code, image: [gameplayImg, img], gamePlatform: 'Web browser', applicationCategory: 'Game', genre: [L.kinds[g.kind] || g.kind], numberOfPlayers: { '@type': 'QuantitativeValue', minValue: g.min, maxValue: g.max }, author: DEVELOPER_LD, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: L.gamesTitle, item: `${SITE}/${L.dir}/` }, { '@type': 'ListItem', position: 3, name, item: url }] },
  ];
  return `<!DOCTYPE html>
<html lang="${L.code}"${L.rtl ? ' dir="rtl"' : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${guide ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:locale" content="${L.code.replace('-Latn', '').replace('-', '_')}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${gameplayImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(name)} gameplay in ChitPlay's 3D room">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${gameplayImg}">
${iconLinks('../../../')}
${alternates}
<script type="application/ld+json">${json(ld)}</script>
<link rel="stylesheet" href="../../../assets/game-guide.css?v=20261114-1448">
</head>
<body class="game-guide" lang="${L.code}">
<a class="skip-link" href="#content">${esc(L.ui.skip)}</a>
<main id="content" class="guide" lang="${L.code}">
${logoLink('../../../')}
<nav aria-label="Breadcrumb"><a href="../../../${L.dir}/">ChitPlay</a> › <a href="../../../${L.dir}/">${esc(L.gamesTitle)}</a> › ${esc(name)}</nav>
<div class="gamehead"><img src="../../../assets/${icon}" alt="" width="96" height="96" decoding="async"><h1>${esc(name)} <span class="english-name" lang="en">(${esc(g.name)})</span></h1></div>
<p class="playtop"><a class="btn btn--big" href="${play}">${esc(L.ui.playNow)}</a></p>
<ul class="facts"><li>👥 ${g.players} ${esc(L.ui.players)}</li><li>${esc(L.kinds[g.kind] || g.kind)}</li><li>🆓</li></ul>
<section class="guide-card" aria-labelledby="local-summary">
<h2 id="local-summary">${esc(L.ui.guide)}</h2>
<p>${esc(description)}</p>
<p class="english-name" lang="en">English name: <strong>${esc(g.name)}</strong></p>
</section>
<figure class="gameplay-preview"><img src="../../../assets/${gameplayImageFor(g.slug)}" alt="${esc(name)} gameplay in ChitPlay's 3D room" width="1200" height="630" fetchpriority="high" decoding="async"><figcaption>${esc(name)} · ${esc(g.name)}</figcaption></figure>
${guideHtml}
<h2>${esc(L.waysTitle)}</h2>
<ul class="ways">${L.ways.map(([heading, detail]) => `<li><strong>${esc(heading)}:</strong> ${esc(detail)}</li>`).join('')}</ul>
<h2>${esc(L.ui.langs)}</h2>
<ul class="language-names">${otherLanguages}<li><a href="${enUrl}" hreflang="en" lang="en">English: ${esc(g.name)} · ${esc(L.ui.rules)}</a></li></ul>
${bannerSlot()}
${featuredIn(g.slug, L.code, '../../../', L.dir)}
<h2>${esc(L.gamesTitle)}</h2>
<ul class="more-games">${related.map(other => `<li><a href="../../../${L.dir}/games/${other.slug}/" hreflang="${L.code}" title="${esc(L.names[other.slug][1])}"><img src="../../../assets/${imageFor(other.slug, true)}" alt="" width="72" height="72" loading="lazy" decoding="async"><span>${esc(L.names[other.slug][0])}</span></a></li>`).join('')}</ul>
<p><small>${esc(L.ui.note)}</small></p>
<footer><a href="../../../${L.dir}/">${esc(L.gamesTitle)}</a> · ${footerLinks('../../../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}

function localizedMainGamePage(L) {
  const name = L.main[0];
  const description = L.main[1];
  const url = `${SITE}/${L.dir}/games/${MAIN_SLUG}/`;
  const gameplayImg = `${SITE}/assets/${gameplayImageFor(MAIN_SLUG)}`;
  const promoImg = `${SITE}/assets/${imageFor(MAIN_SLUG, false, 'jpg')}`;
  const englishLink = `<li><a href="${MAIN_URL}" hreflang="en" lang="en">English: Raja Rani Chor Police · Cops and Robbers</a></li>`;
  const otherLanguages = LANG_PAGES.filter(language => language !== L)
    .map(language => `<li><a href="../../../${language.dir}/games/${MAIN_SLUG}/" hreflang="${language.code}" lang="${language.code}">${esc(language.label)}: ${esc(language.main[0])}</a></li>`)
    .join('');
  const alternates = [['en', MAIN_URL], ...LANG_PAGES.map(language => [language.code, `${SITE}/${language.dir}/games/${MAIN_SLUG}/`]), ['x-default', MAIN_URL]]
    .map(([code, href]) => `<link rel="alternate" hreflang="${code}" href="${href}">`).join('\n');
  const related = [...PARTY.filter(game => game.kind === 'Party'), ...PARTY.filter(game => game.kind !== 'Party' && game.hot)].slice(0, 8);
  const ld = [
    ...(MAIN_GUIDES[L.code] ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: L.code, mainEntity: MAIN_GUIDES[L.code].faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : []),
    { '@context': 'https://schema.org', '@type': 'VideoGame', name, alternateName: ['Raja Rani Chor Police', 'Cops and Robbers'], url, description, playMode: ['SinglePlayer', 'MultiPlayer', 'CoOp'], inLanguage: L.code, image: [gameplayImg, promoImg], gamePlatform: 'Web browser', applicationCategory: 'Game', genre: [L.kinds.Party || 'Party game', 'Social deduction'], numberOfPlayers: { '@type': 'QuantitativeValue', value: 4 }, author: DEVELOPER_LD, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: L.gamesTitle, item: `${SITE}/${L.dir}/` }, { '@type': 'ListItem', position: 3, name, item: url }] },
  ];
  return `<!DOCTYPE html>
<html lang="${L.code}"${L.rtl ? ' dir="rtl"' : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(mainTitle(L, name))} | ChitPlay</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:locale" content="${L.code.replace('-Latn', '').replace('-', '_')}">
<meta property="og:title" content="${esc(mainTitle(L, name))} | ChitPlay">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${gameplayImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(name)} gameplay in ChitPlay's 3D room">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(mainTitle(L, name))} | ChitPlay">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${gameplayImg}">
${iconLinks('../../../')}
${alternates}
<script type="application/ld+json">${json(ld)}</script>
<link rel="stylesheet" href="../../../assets/game-guide.css?v=20261114-1448">
</head>
<body class="game-guide" lang="${L.code}">
<a class="skip-link" href="#content">${esc(L.ui.skip)}</a>
<main id="content" class="guide" lang="${L.code}">
${logoLink('../../../')}
<nav aria-label="Breadcrumb"><a href="../../../${L.dir}/">ChitPlay</a> › <a href="../../../${L.dir}/">${esc(L.gamesTitle)}</a> › ${esc(name)}</nav>
<div class="gamehead"><img src="../../../assets/${imageFor(MAIN_SLUG, true)}" alt="" width="96" height="96" decoding="async"><h1>${esc(name)} <span class="english-name" lang="en">(Raja Rani Chor Police · Cops and Robbers)</span></h1></div>
<p class="playtop"><a class="btn btn--big" href="../../../${mainPlay(L)}">${esc(L.ui.playNow)}</a></p>
<ul class="facts"><li>👥 4 ${esc(L.ui.players)}</li><li>${esc(L.kinds.Party || 'Party game')}</li><li>🆓</li></ul>
<section class="guide-card" aria-labelledby="local-summary">
<h2 id="local-summary">${esc(L.ui.guide)}</h2>
<p>${esc(description)}</p>
<p class="english-name" lang="en">English names: <strong>Raja Rani Chor Police · Cops and Robbers</strong></p>
</section>
<figure class="gameplay-preview"><img src="../../../assets/${gameplayImageFor(MAIN_SLUG)}" alt="${esc(name)} gameplay in ChitPlay's 3D room" width="1200" height="630" fetchpriority="high" decoding="async"><figcaption>${esc(name)} · Raja Rani Chor Police</figcaption></figure>
${MAIN_GUIDES[L.code] ? `<section class="guide-card" aria-labelledby="main-how">
<h2 id="main-how">${esc(MAIN_GUIDES[L.code].how)}</h2>
<ol>${MAIN_GUIDES[L.code].steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
</section>
<section aria-labelledby="main-faq">
<h2 id="main-faq">${esc(MAIN_GUIDES[L.code].faqTitle)}</h2>
${MAIN_GUIDES[L.code].faq.map(([q, a]) => `<details open><summary><strong>${esc(q)}</strong></summary><p>${esc(a)}</p></details>`).join('\n')}
</section>` : ''}
<h2>${esc(L.waysTitle)}</h2>
<ul class="ways">${L.ways.map(([heading, detail]) => `<li><strong>${esc(heading)}:</strong> ${esc(detail)}</li>`).join('')}</ul>
<h2>${esc(L.ui.langs)}</h2>
<ul class="language-names">${englishLink}${otherLanguages}</ul>
<p><a href="${MAIN_URL}" hreflang="en" lang="en">English: ${esc(L.ui.rules)}</a></p>
${featuredIn(MAIN_SLUG, L.code, '../../../', L.dir)}
<h2>${esc(L.gamesTitle)}</h2>
<ul class="more-games">${related.map(game => `<li><a href="../../../${L.dir}/games/${game.slug}/" hreflang="${L.code}" title="${esc(L.names[game.slug][1])}"><img src="../../../assets/${imageFor(game.slug, true)}" alt="" width="72" height="72" loading="lazy" decoding="async"><span>${esc(L.names[game.slug][0])}</span></a></li>`).join('')}</ul>
<p><small>${esc(L.ui.note)}</small></p>
<footer><a href="../../../${L.dir}/">${esc(L.gamesTitle)}</a> · ${footerLinks('../../../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}

function writeLocalizedMainGuides() {
  for (const L of LANG_PAGES) {
    const dir = join(ROOT, L.dir, 'games', MAIN_SLUG);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), localizedMainGamePage(L));
  }
}

function writeMainGuide() {
  const dir = join(ROOT, 'games', MAIN_SLUG);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), mainGamePage());
  writeLocalizedMainGuides();
}

function writeGameGuides() {
  for (const g of PARTY) {
    const englishDir = join(ROOT, 'games', g.slug);
    mkdirSync(englishDir, { recursive: true });
    writeFileSync(join(englishDir, 'index.html'), partyPage(g));
    for (const L of LANG_PAGES) {
      const localizedDir = join(ROOT, L.dir, 'games', g.slug);
      mkdirSync(localizedDir, { recursive: true });
      writeFileSync(join(localizedDir, 'index.html'), localizedPartyPage(g, L));
    }
  }
  writeMainGuide();
}

function updateLocalizedGameLists() {
  for (const L of LANG_PAGES) {
    const path = join(ROOT, L.dir, 'index.html');
    if (!existsSync(path)) continue;
    let html = readFileSync(path, 'utf8');
    for (const g of PARTY) {
      const localHref = `href="games/${g.slug}/"`;
      if (!html.includes(localHref)) {
        const englishLink = new RegExp(`(<a href="../games/${g.slug}/" hreflang="en">[^<]*</a>)`);
        if (englishLink.test(html)) {
          html = html.replace(englishLink, `$1 <a href="games/${g.slug}/" hreflang="${L.code}">${esc(L.ui.guide)}</a>`);
        } else {
          const heading = regexEsc(esc(L.kinds[g.kind] || g.kind));
          const section = new RegExp(`(<h3>${heading}</h3>\\s*<ul class="games">)([\\s\\S]*?)(</ul>)`);
          const item = `<li><img src="../assets/${imageFor(g.slug, true)}" alt="" width="56" height="56" loading="lazy" decoding="async"><div><strong lang="${L.code}">${esc(L.names[g.slug][0])}</strong> <small lang="en">English: ${esc(g.name)}</small><br>${esc(L.names[g.slug][1])}<br><a class="go" href="../play/?game=${g.slug}&mode=play&lang=${L.game}">${esc(L.ui.play)}</a> <a href="games/${g.slug}/" hreflang="${L.code}">${esc(L.ui.guide)}</a> <a href="../games/${g.slug}/" hreflang="en">${esc(L.ui.rules)}</a></div></li>`;
          if (!section.test(html)) throw new Error(`no ${heading} section in ${L.label} games page`);
          html = html.replace(section, `$1$2${item}$3`);
        }
      }
      const card = new RegExp(`<li>(?:(?!</li>)[\\s\\S])*?href="../play/\\?game=${g.slug}(?:&|")(?:(?!</li>)[\\s\\S])*?</li>`);
      const match = html.match(card);
      if (match && !match[0].includes('lang="en">English:')) {
        html = html.replace(match[0], match[0].replace('</strong>', `</strong> <small lang="en">English: ${esc(g.name)}</small>`));
      }
    }
    const mainGuideLink = `<a href="../games/${MAIN_SLUG}/" hreflang="en">${esc(L.ui.rules)}</a>`;
    if (!html.includes(`href="games/${MAIN_SLUG}/"`)) {
      html = html.replace(mainGuideLink, `<a href="games/${MAIN_SLUG}/" hreflang="${L.code}">${esc(L.ui.guide)}</a> ${mainGuideLink}`);
    }
    const data = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!data) throw new Error(`no structured game list in ${L.label} games page`);
    const ld = JSON.parse(data[1]);
    const list = ld.find(item => item['@type'] === 'ItemList');
    if (!list) throw new Error(`no item list in ${L.label} games page`);
    const main = {
      ...list.itemListElement[0],
      name: L.main[0],
      url: `${SITE}/${L.dir}/games/${MAIN_SLUG}/`,
      image: `${SITE}/assets/${imageFor(MAIN_SLUG, true, 'jpg')}`,
    };
    list.numberOfItems = PARTY.length + 1;
    list.itemListElement = [main, ...PARTY.map((g, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: L.names[g.slug][0],
      url: `${SITE}/${L.dir}/games/${g.slug}/`,
      image: `${SITE}/assets/${imageFor(g.slug, true, 'jpg')}`,
    }))];
    html = html.replace(data[0], `<script type="application/ld+json">${json(ld)}</script>`);
    writeFileSync(path, html);
  }
}

function updateGameGuideSitemap() {
  const path = join(ROOT, 'sitemap.xml');
  if (!existsSync(path)) return;
  let xml = readFileSync(path, 'utf8');
  for (const g of PARTY) {
    const alternates = [['en', `${SITE}/games/${g.slug}/`], ...guidedLangs(g.slug).map(L => [L.code, `${SITE}/${L.dir}/games/${g.slug}/`]), ['x-default', `${SITE}/games/${g.slug}/`]]
      .map(([code, href]) => `<xhtml:link rel="alternate" hreflang="${code}" href="${href}"/>`).join('');
    for (const url of [`${SITE}/games/${g.slug}/`, ...guidedLangs(g.slug).map(L => `${SITE}/${L.dir}/games/${g.slug}/`)]) {
      const loc = `<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`;
      const entry = new RegExp(`<url>(?:(?!</url>)[\\s\\S])*?${loc}(?:(?!</url>)[\\s\\S])*?</url>`);
      const gameplayImage = `<image:image><image:loc>${SITE}/assets/${gameplayImageFor(g.slug)}</image:loc></image:image>`;
      const promoImage = `<image:image><image:loc>${SITE}/assets/${imageFor(g.slug, false, 'jpg')}</image:loc></image:image>`;
      if (entry.test(xml)) {
        xml = xml.replace(entry, block => {
          if (!block.includes(`${SITE}/assets/${gameplayImageFor(g.slug)}`)) block = block.replace('</url>', `${gameplayImage}</url>`);
          if (!block.includes('<image:image>')) block = block.replace('</url>', `${promoImage}</url>`);
          return block.includes('hreflang=') ? block : block.replace('</url>', `${alternates}</url>`);
        });
      } else {
        xml = xml.replace('</urlset>', `<url><loc>${url}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${gameplayImage}${promoImage}${alternates}</url>\n</urlset>`);
      }
    }
  }
  const mainAlternates = [['en', MAIN_URL], ...LANG_PAGES.map(L => [L.code, `${SITE}/${L.dir}/games/${MAIN_SLUG}/`]), ['x-default', MAIN_URL]]
    .map(([code, href]) => `<xhtml:link rel="alternate" hreflang="${code}" href="${href}"/>`).join('');
  const mainUrls = [MAIN_URL, ...LANG_PAGES.map(L => `${SITE}/${L.dir}/games/${MAIN_SLUG}/`)];
  for (const url of mainUrls) {
    const loc = `<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`;
    const entry = new RegExp(`<url>(?:(?!</url>)[\\s\\S])*?${loc}(?:(?!</url>)[\\s\\S])*?</url>`);
    const gameplayImage = `<image:image><image:loc>${SITE}/assets/${gameplayImageFor(MAIN_SLUG)}</image:loc></image:image>`;
    const promoImage = `<image:image><image:loc>${SITE}/assets/${imageFor(MAIN_SLUG, false, 'jpg')}</image:loc></image:image>`;
    if (entry.test(xml)) {
      xml = xml.replace(entry, block => {
        if (!block.includes(`${SITE}/assets/${gameplayImageFor(MAIN_SLUG)}`)) block = block.replace('</url>', `${gameplayImage}</url>`);
        if (!block.includes('<image:image>')) block = block.replace('</url>', `${promoImage}</url>`);
        return block.includes('hreflang=') ? block : block.replace('</url>', `${mainAlternates}</url>`);
      });
    } else {
      xml = xml.replace('</urlset>', `<url><loc>${url}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>${gameplayImage}${promoImage}${mainAlternates}</url>\n</urlset>`);
    }
  }
  writeFileSync(path, xml);
}

function updateEnglishGameList() {
  const path = join(ROOT, 'games', 'index.html');
  if (!existsSync(path)) return;
  let html = readFileSync(path, 'utf8');
  html = html.replace(/All ChitPlay games: \d+ free indoor games online/, `All ChitPlay games: ${PARTY.length + 1} free indoor games online`);
  html = html.replace(/Raja Rani Chor Police and \d+\+ more free games/g, `Raja Rani Chor Police and ${PARTY.length}+ more free games`);

  const data = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!data) throw new Error('no structured game list in English games page');
  const ld = JSON.parse(data[1]);
  const list = ld.find(item => item['@type'] === 'ItemList');
  if (!list) throw new Error('no item list in English games page');
  const main = list.itemListElement[0];
  list.numberOfItems = PARTY.length + 1;
  list.itemListElement = [main, ...PARTY.map((g, index) => ({
    '@type': 'ListItem',
    position: index + 2,
    name: g.name,
    url: `${SITE}/games/${g.slug}/`,
    image: `${SITE}/assets/${imageFor(g.slug, true, 'jpg')}`,
  }))];
  html = html.replace(data[0], `<script type="application/ld+json">${json(ld)}</script>`);

  const headings = {
    Arcade: 'Arcade games (3D, on the TV)',
    Board: 'Board games',
    Cards: 'Card games',
    Puzzle: 'Puzzle and pen-and-paper games',
    Dice: 'Dice games',
    Party: 'Party games',
    Paper: 'Pen and paper games',
    Tiles: 'Tile games',
    Chits: 'Chit games',
  };
  for (const kind of new Set(PARTY.map(g => g.kind))) {
    const heading = headings[kind];
    if (!heading) throw new Error(`no English game list heading for ${kind}`);
    const section = new RegExp(`(<h2>${regexEsc(esc(heading))}</h2>\\s*<ul>)([\\s\\S]*?)(</ul>)`);
    const match = html.match(section);
    if (!match) throw new Error(`no ${heading} section in English games page`);
    const entries = PARTY.filter(g => g.kind === kind && !match[2].includes(`href="${g.slug}/"`))
      .map(g => `<li><a href="${g.slug}/">${esc(g.name)}</a>: ${esc(g.blurb)} <small>${g.players} players, ${g.time}.</small></li>`)
      .join('');
    if (entries) html = html.replace(match[0], `${match[1]}${match[2]}${entries}${match[3]}`);
  }
  writeFileSync(path, html);
}

if (GAME_GUIDES_ONLY) {
  writeGameGuides();
  updateLocalizedGameLists();
  updateEnglishGameList();
  updateGameGuideSitemap();
  console.log(`Game guides built for ${PARTY.length} games in English and ${LANG_PAGES.length} more languages.`);
  process.exit(0);
}

for (const g of PARTY) {
  mkdirSync(join(ROOT, 'games', g.slug), { recursive: true });
  writeFileSync(join(ROOT, 'games', g.slug, 'index.html'), partyPage(g));
  for (const L of LANG_PAGES) {
    const localizedDir = join(ROOT, L.dir, 'games', g.slug);
    mkdirSync(localizedDir, { recursive: true });
    writeFileSync(join(localizedDir, 'index.html'), localizedPartyPage(g, L));
  }
}

// ── One page per kind of game, for people who search for "board games", "card games"… ──
const CATEGORIES = [
  { slug: 'board-games', kinds: ['Board', 'Dice'], name: 'Board games',
    title: 'Free Board Games Online: Ludo, Chess, Carrom | ChitPlay',
    desc: 'Play Ludo, Chess, Carrom, Snakes and Ladders, Checkers and more board and dice games free online in 3D, against the computer or with friends.',
    h1: 'Board games: play free online in 3D',
    intro: ['The board games families have played at home for generations, set out on a mat in a 3D room: Ludo, Carrom, Chess, Snakes and Ladders, Checkers, Reversi, Mancala, Nine Men\u2019s Morris and Four in a Row, plus the dice games Yacht and Pig.', 'Every game follows its usual rules, with the house rules people argue about switchable on or off. Play the computer at easy, normal or hard, invite friends to join from their own phones with a code, or pass one phone round the table.'],
    faq: [['What is the best board game to play online with friends?', 'Ludo is the favourite: two to four players, quick to learn and full of comebacks. Chess and Carrom are best for two.'], ['Can I play board games online without signing up?', 'Yes. Every ChitPlay board game can be played as a guest, with no account and no download.']] },
  { slug: 'card-games', kinds: ['Cards'], name: 'Card games',
    title: 'Free Card Games Online: Call Break, Crazy Eights | ChitPlay',
    desc: 'Play Call Break, Color Clash and Crazy Eights free online in 3D: card games for 2 to 4 players against the computer or with friends.',
    h1: 'Card games: play free online with friends',
    intro: ['Shuffle up for card games that work as well at a table as they do on a phone. Call Break is the trick-taking favourite of South Asia, where spades are always trumps. Color Clash is a fast colour-and-number shedding game with +2 and Rainbow +4 cards, and Crazy Eights is the classic where an eight changes the suit.', 'Your hand stays hidden on your own screen, the table shows the cards everyone can see, and computer players fill any empty seat.', 'Each game keeps score across several rounds, so one bad hand never decides it: Call Break is played over five rounds, Color Clash to 150 points or five rounds, and Crazy Eights over three. The score for every player stays on the screen, and the rules page of each game explains the scoring with examples, so new players can join a table and keep up from the first deal.'],
    faq: [['How do you play Call Break online?', 'Open Call Break on ChitPlay, bid how many tricks you will win, then win them. Spades are always trumps. Play the computer or invite three friends.'], ['Are the card games free?', 'Yes, all the card games are free, with no real money, betting or prizes.']] },
  { slug: 'arcade-games', kinds: ['Arcade'], name: 'Arcade games',
    title: 'Free 3D Arcade Games Online: Fly, Race, Shoot Hoops | ChitPlay',
    desc: 'Play free 3D arcade games on the TV in the ChitPlay room: Turbo Tunnel, Flying Chit, Tunnel Race, Road Dash, Hoop Flick and more, alone or racing friends.',
    h1: 'Arcade games: 3D, on the room\u2019s TV',
    intro: ['Arcade games of our own, played on the big TV in the ChitPlay room: race a car round the inside of a tunnel, steer a paper chit through bangles, fly down a turning tunnel, dodge cows in an auto-rickshaw, flick a ball through moving hoops, survive a night in a haunted hostel and more.', 'Each one has levels that bring something new, from wind on the court to spinning walls, and a pause menu when you need a break. Play alone for a high score, or race up to three friends on one screen or on their own phones.'],
    faq: [['Which arcade game is best to start with?', 'Flying Chit and Road Dash: one finger to steer, and the first levels are gentle.'], ['Do the arcade games work on phones?', 'Yes. Drag to steer on a phone; on a computer use the keys or a gamepad. Turn the phone sideways for a bigger picture.']] },
  { slug: 'party-games', kinds: ['Party'], name: 'Party games',
    title: 'Free Party Games Online: Who Is the Spy, Werewolf | ChitPlay',
    desc: 'Play Who Is the Spy, Werewolf Night, Truth or Dare, Majority Vote and more party games free online, with friends on one phone or their own.',
    h1: 'Party games for groups: free online',
    intro: ['Party games for three to ten people, for evenings with friends and family: find the spy from the clues, catch the werewolves before morning, answer a friendly truth or dare, guess what most of the table will choose, or write a folded story one line at a time.', 'Play them on one phone passed round the room, or with everyone on their own phone. And the paper chit game that started ChitPlay, Raja Rani Chor Police, is the classic four-player party game of bluffing.'],
    faq: [['What is a good party game for a big group?', 'Who Is the Spy and Werewolf Night both work well for five to ten players.'], ['Are the party games suitable for every age?', 'Yes. Questions and dares are friendly, and any prompt can be skipped.']] },
  { slug: 'pen-and-paper-games', kinds: ['Puzzle'], slugs: ['tic-tac-toe', 'dots-and-boxes', 'bingo', 'memory-match'], name: 'Pen and paper games',
    title: 'Free Pen and Paper Games Online: Tic-Tac-Toe, Bingo & More | ChitPlay',
    desc: 'Play Tic-Tac-Toe, Dots and Boxes, Bingo and Memory Match free online: the pen and paper games from school, against the computer or with friends.',
    h1: 'Pen and paper games: the school classics online',
    intro: ['The games from the back of a notebook: Tic-Tac-Toe, Dots and Boxes, Bingo with a 5 × 5 card of 1 to 25, and Memory Match, quick to learn and always ready for a rematch.', 'They are drawn on paper on the mat in the 3D room, and you can play them against the computer, with a friend on one phone, or with friends on their own phones.', 'They are small games with real thinking in them. Tic-Tac-Toe teaches you to look one move ahead and block a line before it is made. Dots and Boxes rewards patience: the player who avoids giving away the last free box usually wins the chain. Memory Match is all about concentration, remembering where each picture was when somebody else turned it over. A round takes a minute or two, so they are perfect for a short break or for playing with younger brothers, sisters and grandparents.'],
    faq: [['Can you win every game of Tic-Tac-Toe?', 'No. With perfect play from both sides it is always a draw, so the fun is in catching a mistake.'], ['How do you win Dots and Boxes?', 'Close more boxes than anyone else. Closing a box gives you another turn, so avoid drawing the third side of a box.']] },
  { slug: 'puzzle-games', kinds: [], slugs: ['unblock-puzzle', 'word-guess', 'number-memory', 'stroop-test', 'fast-typing', 'reaction-time', 'memory-match'], name: 'Puzzle and brain games',
    title: 'Free Puzzle & Brain Games Online: Unblock, Word Guess | ChitPlay',
    desc: 'Play free puzzle and brain games online: Unblock Puzzle, Word Guess, Number Memory, Stroop Test, Fast Typing and Reaction Time. No download, alone or with friends.',
    h1: 'Puzzle and brain games: free online, no download',
    intro: ['Short games that make you think fast: slide the cars out of a parking lot in Unblock Puzzle, guess a hidden word one letter at a time in Word Guess, remember longer and longer numbers in Number Memory, name the colour and not the word in the Stroop Test, type words against the clock in Fast Typing, and test your reflexes in Reaction Time.', 'Each one takes a minute or two and keeps your best score on your device, so they are perfect for a quick break. Play alone to beat your record, or race up to three friends on their own phones: every phone times its own player, so a slow connection never costs anyone points.', 'They train real skills too. Unblock Puzzle is pure planning: every lot has been solved by computer, and the fewest moves are shown, so you know how close you came. Number Memory measures how many digits you can hold at once, Fast Typing shows your speed in letters per second, and Word Guess and Fast Typing practise everyday English words.'],
    faq: [['What is a good brain game to play online for free?', 'Unblock Puzzle for planning, Number Memory for memory and the Stroop Test for focus. All three are free on ChitPlay with no download or sign-up.'], ['Can I play puzzle games with friends?', 'Yes. Open the game, choose Play with friends and share the code: everyone plays the same puzzle or word on their own phone and the best score wins.']] },
  { slug: 'racing-games', kinds: [], slugs: ['turbo-tunnel', 'tunnel-race', 'road-dash', 'flying-chit'], name: 'Racing games',
    title: 'Free Racing & Tunnel Games Online in 3D | ChitPlay',
    desc: 'Play free 3D racing and tunnel games online: race a car round a tunnel in Turbo Tunnel, fly through Tunnel Race, dodge traffic in Road Dash. No download, alone or with friends.',
    h1: 'Racing and tunnel games: free online in 3D',
    intro: ['Fast 3D games where you steer through something that never ends. In Turbo Tunnel you drive a car round the inside of a tunnel, dodging traffic, lasers and falling rocks; Tunnel Race sends a paper plane down a turning tunnel; Road Dash puts you in an auto-rickshaw on a busy road; and Flying Chit steers a winged chit through classroom bangles.', 'Every run gets faster and brings new obstacles, but nothing appears too late to dodge: each obstacle is placed so there is always a way through. Play alone for a high score, or race up to three friends on one screen or on their own phones, with no download and no sign-up.', 'On a phone you steer with the controls on screen; on a computer use the arrow keys or W A S D, or plug in a gamepad. The graphics adjust themselves to keep the game smooth on older phones.'],
    faq: [['Is there a free tunnel game I can play online?', 'Yes. Turbo Tunnel and Tunnel Race are free 3D tunnel games on ChitPlay. They run in the browser on phones and computers, with no download.'], ['Can I race my friends?', 'Yes. Choose Play with friends and share the code, or sit side by side on one computer with W A S D and the arrow keys.']] },
];
function categoryPage(c) {
  const url = `${SITE}/games/${c.slug}/`;
  const games = c.slugs ? c.slugs.map(slug => PARTY.find(g => g.slug === slug)).filter(Boolean) : PARTY.filter(g => c.kinds.includes(g.kind));
  const ld = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.h1, url, description: c.desc, isPartOf: { '@type': 'WebSite', name: 'ChitPlay', url: `${SITE}/` } },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: c.name, numberOfItems: games.length, itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.name, url: `${SITE}/games/${g.slug}/`, image: `${SITE}/assets/games/${g.slug}-square.jpg` })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Games', item: `${SITE}/games/` }, { '@type': 'ListItem', position: 3, name: c.name, item: url }] },
  ];
  const others = CATEGORIES.filter(o => o !== c).map(o => `<a href="../${o.slug}/">${esc(o.name)}</a>`).join(' · ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/home.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(c.title)}">
<meta name="twitter:description" content="${esc(c.desc)}">
<meta name="twitter:image" content="${SITE}/assets/home.jpg">
${iconLinks('../../')}
<script type="application/ld+json">${json(ld)}</script>
<style>body{margin:0;background:#140b07;color:#f6ead2;font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}main{max-width:820px;margin:0 auto;padding:20px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(26px,6vw,38px);line-height:1.2}h2{font-size:22px;margin-top:30px}.games{padding:0;list-style:none}.games li{display:flex;gap:12px;align-items:flex-start;margin:8px 0;padding:10px 12px;border-radius:12px;background:#24140c}.games img{flex:none;border-radius:12px}.games small{color:#d4c2a0}.go{font-weight:700;margin-right:10px}.btn{display:inline-block;padding:14px 24px;border-radius:12px;font-weight:700;text-decoration:none;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6}details{background:#24140c;border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}footer{margin-top:40px;font-size:13px;color:#d4c2a0}</style>
</head>
<body>
<main>
${logoLink('../../')}
<nav aria-label="Breadcrumb"><a href="../../">ChitPlay</a> › <a href="../">Games</a> › ${esc(c.name)}</nav>
<h1>${esc(c.h1)}</h1>
${c.intro.map(t => `<p>${esc(t)}</p>`).join('\n')}
<h2>${games.length} ${esc(c.name.toLowerCase())} to play</h2>
<ul class="games">${games.map(g => `<li><img src="../../assets/games/${g.slug}-square.webp" alt="${esc(g.name.replace('?', ''))} logo" width="64" height="64" loading="lazy" decoding="async"><div><strong>${esc(g.name)}</strong> <small>👥 ${g.players} players · ⏱ ${g.time}</small><br>${esc(g.blurb)}<br><a class="go" href="../../play/?game=${g.slug}&mode=play">▶ Play</a> <a href="../${g.slug}/">Rules and tips</a></div></li>`).join('')}</ul>
<p><a class="btn" href="../../">▶ Open ChitPlay</a></p>
${adSlot('category')}
<h2>Questions</h2>
${c.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
${bannerSlot()}
<h2>More kinds of games</h2>
<p>${others} · <a href="../cops-and-robbers/">Raja Rani Chor Police</a> · <a href="../">All games</a></p>
<footer>${footerLinks('../../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}
for (const c of CATEGORIES) {
  mkdirSync(join(ROOT, 'games', c.slug), { recursive: true });
  writeFileSync(join(ROOT, 'games', c.slug, 'index.html'), categoryPage(c));
}

/** The game cards' look, shared by /games/ and every language's home page. */
const CARD_CSS = ".cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin:12px 0 24px}.card{display:flex;flex-direction:column;background:#24140d;border:1px solid rgba(255,210,122,.14);border-radius:16px;overflow:hidden;transition:transform .15s,border-color .15s}.card:hover{transform:translateY(-3px);border-color:rgba(255,210,122,.5)}.card__link{display:flex;flex-direction:column;gap:4px;padding:10px 10px 6px;text-decoration:none;color:inherit;flex:1}.card__link img{width:100%;height:auto;aspect-ratio:1;border-radius:12px;display:block}.card__link strong{color:#ffd27a;font-size:16px;line-height:1.25;margin-top:4px}.card__blurb{font-size:13px;line-height:1.4;color:#e8dcc4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.card small{font-size:12px}.card__play{margin:0 10px 10px;padding:8px;border-radius:10px;text-align:center;font-weight:800;text-decoration:none;color:#140b07;background:linear-gradient(#ffb347,#f0791f)}.card__play:hover{filter:brightness(1.08)}@media (max-width:520px){.cards{grid-template-columns:repeat(2,1fr);gap:10px}}.card__links{display:flex;gap:10px;flex-wrap:wrap;margin:0 10px 10px;font-size:12px}.card__en{font-size:11px;opacity:.75}";
/** One game on the games page: its picture and name lead to the game's page, the button straight into the game. */
const hubCard = (g) => `<div class="card"><a class="card__link" href="${g.slug}/"><img src="../assets/${imageFor(g.slug, true)}" alt="${esc(g.name)}" width="160" height="160" loading="lazy" decoding="async"><strong>${esc(g.name)}</strong><span class="card__blurb">${esc(g.blurb)}</span><small>👥 ${g.players} · ⏱ ${g.time}</small></a><a class="card__play" href="../play/?game=${g.slug}&amp;mode=play" aria-label="Play ${esc(g.name)} now">▶ Play</a></div>`;
function hubPage() {
  const url = `${SITE}/games/`;
  const items = COUNTRY_ORDER.map(id => {
    const en = localize(COUNTRIES[id], 'en');
    return `<li><a href="${GAME_SLUGS[id]}/"><strong>${esc(GAME_NAME_EN[id])}</strong></a> (${esc(COUNTRIES[id].name)}) — ${esc(GAME_AKA[id].filter(a => a !== GAME_NAME_EN[id]).slice(0, 3).join(', '))}<br><small>${esc(en.ruleText)}</small></li>`;
  }).join('');
  const listed = [{ name: 'Raja Rani Chor Police (Cops and Robbers)', slug: MAIN_SLUG }, ...PARTY.map(g => ({ name: g.name, slug: g.slug }))];
  const ld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'ChitPlay games', numberOfItems: listed.length,
    itemListElement: listed.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.name, url: `${SITE}/games/${g.slug}/`, image: `${SITE}/assets/games/${g.slug}-square.jpg` })),
  };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Games', item: url }] };
  const table = COUNTRY_ORDER.map(id => {
    const b = COUNTRIES[id]; const en = localize(b, 'en');
    return `<tr><td><a href="${GAME_SLUGS[id]}/">${esc(GAME_NAME_EN[id])}</a></td><td>${esc(b.name)}</td><td>${esc(SLOTS.map(s => en.roles[s].name).join(' · '))}</td><td>${esc(en.roles[b.rules.guesser].name)}</td></tr>`;
  }).join('');
  const hubFaq = [
    ['Are Raja Rani Chor Police, Raja Mantri Chor Sipahi and King Queen Thief Police the same game?', 'Yes. They are names for the same four-player paper chit game. The role names, the points and one small rule change from place to place.'],
    ['Which chit game should I play?', 'Pick the name you grew up with. ChitPlay opens the game of your own country first, and you can swipe to any other.'],
    ['Can I play a chit game online alone?', 'Yes. In CHITPLAY three computer players sit with you. You can also invite up to three friends on their own phones, or just watch.'],
  ];
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: hubFaq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const title = 'ChitPlay: All Games – Board, Card, Arcade & Party Games';
  const desc = 'Ludo, Carrom, Chess, Call Break, Raja Rani Chor Police and 45+ more free games, each with full rules. Play in 3D, online or with friends.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/home.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="ChitPlay: Raja Rani Chor Police, Ludo, Carrom, Chess and more free indoor games">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/home.jpg">
${iconLinks('../')}
${hreflangLinks()}
<script type="application/ld+json">${json([ld, crumbs, faqLd])}</script>
<style>body{margin:0;background:#140b07;color:#f6ead2;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}main{max-width:1100px;margin:0 auto;padding:20px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(26px,6vw,38px);line-height:1.2}li{margin:14px 0}small{color:#d4c2a0}.wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;background:#24140c;font-size:14px}td,th{padding:8px 10px;border-bottom:1px solid #3a2414;text-align:left}details{background:#24140c;border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}.btn{display:inline-block;padding:14px 22px;border-radius:12px;font-weight:700;text-decoration:none;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6}${CARD_CSS}</style>
</head>
<body>
<main>
${logoLink('../')}
<h1>All ChitPlay games: ${PARTY.length + 1} free indoor games online</h1>
<p>Browse by kind: ${CATEGORIES.map(c => `<a href="${c.slug}/">${esc(c.name)}</a>`).join(' · ')}</p>
<p>Free games to play with friends and family, at any age. Looking for ideas? See <a href="../articles/">game ideas for every occasion</a>, <a href="../indoor-games/">indoor games for four people</a> and <a href="../school-games/">paper games for school</a>.</p>
<h2>Cops and Robbers (Raja Rani Chor Police) in 3D</h2>
<p>The four-chit game of bluffing, known by many names around the world. <a href="cops-and-robbers/">Rules and every name →</a></p>
<p><a class="btn" href="../${mainPlay()}">▶ Play now</a></p>
${[...new Set(PARTY.map(g => g.kind))].map(kind => `<h2>${esc({ Arcade: 'Arcade games (3D, on the TV)', Party: 'Party games', Puzzle: 'Puzzle and pen-and-paper games', Board: 'Board games', Cards: 'Card games', Paper: 'Pen and paper games', Tiles: 'Tile games', Dice: 'Dice games', Chits: 'Chit games' }[kind] || kind)}</h2>
<div class="cards">${PARTY.filter(g => g.kind === kind).map(hubCard).join('')}</div>`).join('\n')}
<p>Every game plays in 3D with computer players, with people online, with friends nearby, or on one phone handed round.</p>
<h2>Questions</h2>
${hubFaq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<footer style="margin-top:40px;font-size:13px;color:#d4c2a0">${footerLinks('../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}

/**
 * The title of the chit game's page in a language. India searches it as Raja Rani Chor Police and as
 * Raja Rani Chor Sipahi, so the Hindi and Hinglish pages carry both names; the others add the Indian name.
 */
/** The chit game opens straight from a search result, in the edition people of that language grew up with. */
const MAIN_EDITION = { hi: 'raja-rani-chor-police', 'hi-Latn': 'raja-rani-chor-police', ur: 'raja-wazir-chor-sipahi', ne: 'raja-mantri-chor-sipahi', bn: 'raja-mantri-chor-police', ja: 'tonosama-to-dorobo', ko: 'mafia-game-korean', zh: 'jingcha-zhua-xiaotou', ru: 'mafia-game', de: 'rauber-und-gendarm', fr: 'gendarmes-et-voleurs', pt: 'policia-e-ladrao', es: 'policias-y-ladrones' };
const mainPlay = (L) => `?game=${L ? MAIN_EDITION[L.code] || MAIN_SLUG : MAIN_SLUG}${L ? `&lang=${L.game}` : ''}`;
function mainTitle(L, name) {
  if (L.code === 'hi') return `${name} / चोर सिपाही (Raja Rani Chor Police)`;
  if (L.code === 'hi-Latn') return 'Raja Rani Chor Police / Raja Rani Chor Sipahi Game';
  return name.includes('Raja Rani Chor Police') ? name : `${name} (Raja Rani Chor Police)`;
}
// ── write the pages ─────────────────────────────────────────
// ── One game: /games/cops-and-robbers/ is the page; every other name's old URL redirects to it ──
function mainGamePage() {
  const title = 'Raja Rani Chor Police (Chor Sipahi) Game – Play Free | ChitPlay';
  const desc = 'Play Raja Rani Chor Police free online: the 4-player chit game also called Raja Rani Chor Sipahi, Raja Mantri Chor Sipahi and Cops and Robbers. Rules, points, 3D play.';
  const gameplayImg = `${SITE}/assets/${gameplayImageFor(MAIN_SLUG)}`;
  const names = NAMES_BY_COUNTRY.map(n => `<tr><td>${esc(n.country)}</td><td><strong>${esc(n.name)}</strong>${n.aka.length ? `<br><small>${esc(n.aka.join(' · '))}</small>` : ''}</td><td>${esc(n.roles)}</td></tr>`).join('');
  const localNames = LANG_PAGES.map(L => `<li><a href="../../${L.dir}/games/${MAIN_SLUG}/" hreflang="${L.code}" lang="${L.code}">${esc(L.label)}: ${esc(L.main[0])}</a></li>`).join('');
  const alternates = [['en', MAIN_URL], ...LANG_PAGES.map(L => [L.code, `${SITE}/${L.dir}/games/${MAIN_SLUG}/`]), ['x-default', MAIN_URL]]
    .map(([code, href]) => `<link rel="alternate" hreflang="${code}" href="${href}">`).join('\n');
  const faq = [
    ['Is Raja Rani Chor Police the same game as Cops and Robbers?', 'Yes. It is the same four-chit game. India calls it Raja Rani Chor Police or Chor Sipahi, Pakistan Raja Wazir Chor Sipahi, Nepal Raja Mantri Chor Sipahi, the USA and UK Cops and Robbers, Germany Räuber und Gendarm, and so on. ChitPlay plays it under the name of the language you choose.'],
    ['Is Raja Rani Chor Sipahi the same as Raja Rani Chor Police?', 'Yes. Sipahi is simply the older Hindi and Urdu word for a policeman, so Raja Rani Chor Sipahi and Raja Rani Chor Police are two names for one game: King, Queen, Thief and Police (Sipahi), with the same chits, points and rules. Many families also add a Mantri (minister), which makes it Raja Mantri Chor Sipahi.'],
    ['How many players do you need?', 'Four chits are used, so four players. In ChitPlay computer players fill any empty seats, so you can play alone or with one to three friends.'],
    ['How many points is each chit worth?', 'King 1000, Queen 800, Police 500 and Thief 0. The Police keeps 500 for catching the Thief; a wrong guess gives those 500 to the Thief.'],
    ['What are house rules?', 'Twists from other countries that you can switch on: an innocent player cleared before the guess (Japan), a second guess for half points (USA), a 200-point penalty for a wrong guess (UK) and a 200-point fine for a caught thief (China).'],
    ['Can I play it online with friends?', 'Yes. Use Play with Friends to make a room and share the 6-digit code, QR code or invite link, or press Play Online to sit with players from around the world.'],
  ];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'VideoGame', name: 'Cops and Robbers', alternateName: [...new Set(COUNTRY_ORDER.flatMap(id => [GAME_NAME_EN[id], ...GAME_AKA[id]]))], url: MAIN_URL, description: desc, image: [gameplayImg, `${SITE}/assets/games/cops-and-robbers-square.jpg`, `${SITE}/assets/games/cops-and-robbers.jpg`], author: DEVELOPER_LD, genre: ['Party game', 'Social deduction game', 'Paper chit game'], gamePlatform: 'Web browser', applicationCategory: 'Game', numberOfPlayers: { '@type': 'QuantitativeValue', value: 4 }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Games', item: `${SITE}/games/` }, { '@type': 'ListItem', position: 3, name: 'Cops and Robbers', item: MAIN_URL }] },
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${MAIN_URL}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${MAIN_URL}">
<meta property="og:image" content="${gameplayImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Raja Rani Chor Police gameplay in ChitPlay's 3D room">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${gameplayImg}">
${iconLinks('../../')}
${alternates}
<script type="application/ld+json">${json(ld)}</script>
<style>body{margin:0;background:#140b07;color:#f6ead2;font:17px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}main{max-width:760px;margin:0 auto;padding:24px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(28px,6vw,40px);line-height:1.2}h2{font-size:21px;margin-top:28px}.btn{display:inline-block;padding:14px 22px;border-radius:12px;font-weight:700;text-decoration:none;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6}.wrap{overflow-x:auto}.gameplay-preview{margin:20px 0}.gameplay-preview img{display:block;width:100%;height:auto;border-radius:12px}.gameplay-preview figcaption{color:#d4c2a0;font-size:13px}table{border-collapse:collapse;width:100%;font-size:15px}td,th{border-bottom:1px solid #3a2616;padding:8px;text-align:left;vertical-align:top}details{background:#24140c;border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}footer{margin-top:40px;font-size:13px;color:#d4c2a0}</style>
</head>
<body>
<main>
${logoLink('../../')}
<nav aria-label="Breadcrumb"><a href="../../">ChitPlay</a> › <a href="../">Games</a> › Cops and Robbers</nav>
<h1>Raja Rani Chor Police (Cops and Robbers): play the chit game online</h1>
<p><a class="btn" href="../../${mainPlay()}">▶ Play Raja Rani Chor Police now</a></p>
<figure class="gameplay-preview"><img src="../../assets/${gameplayImageFor(MAIN_SLUG)}" alt="Raja Rani Chor Police gameplay in ChitPlay's 3D room" width="1200" height="630" fetchpriority="high" decoding="async"><figcaption>Actual gameplay in the ChitPlay 3D room.</figcaption></figure>
<p>Four folded chits, four players, one thief. The same game is played all over the world under different names: <strong>Raja Rani Chor Police</strong> and <strong>Raja Rani Chor Sipahi</strong> in India, <strong>Raja Wazir Chor Sipahi</strong> in Pakistan, <strong>Raja Mantri Chor Sipahi</strong> in Nepal, <strong>Cops and Robbers</strong> in the USA and UK, <strong>Räuber und Gendarm</strong> in Germany. ChitPlay plays it free in your browser, in 3D, under the name of the language you pick.</p>
<h2>How to play</h2>
<ol><li>Four chits are folded and thrown down: King (1000), Queen (800), Police (500) and Thief (0).</li><li>Each player picks one and reads it secretly.</li><li>The Police says who they are and has to find the Thief among the other three.</li><li>The Police names a suspect, then everyone opens their chit.</li><li>Right guess: the Police keeps 500 and the Thief gets 0. Wrong guess: the Thief takes the Police's 500. King and Queen always keep their points.</li><li>Play as many rounds as you like; the highest total wins.</li></ol>
<h2>Example round</h2>
<div class="wrap"><table><thead><tr><th>Player</th><th>Chit</th><th>Police guesses right</th><th>Police guesses wrong</th></tr></thead><tbody><tr><td>Asha</td><td>King</td><td>1000</td><td>1000</td></tr><tr><td>Ben</td><td>Queen</td><td>800</td><td>800</td></tr><tr><td>Chetan</td><td>Police</td><td>500</td><td>0</td></tr><tr><td>Divya</td><td>Thief</td><td>0</td><td>500</td></tr></tbody></table></div>
<h2>House rules from around the world</h2>
<ul><li><strong>Japan:</strong> one innocent player is cleared before the Police guesses.</li><li><strong>USA:</strong> a second guess for half the points.</li><li><strong>UK:</strong> a wrong guess costs the Police 200 and the Thief escapes with 1000.</li><li><strong>China:</strong> a caught Thief pays a 200-point fine.</li></ul>
<p>Switch them on under <em>How to play</em> on the ChitPlay start screen.</p>
<h2>Its name in every country</h2>
<div class="wrap"><table><thead><tr><th>Country</th><th>Name</th><th>Roles</th></tr></thead><tbody>${names}</tbody></table></div>
<h2>Read the guide in your language</h2>
<ul>${localNames}</ul>
${featuredIn(MAIN_SLUG, 'en', '../../', '')}
<h2>Play it on paper</h2>
<p>Tear a page into four equal slips, write King 1000, Queen 800, Police 500 and Thief 0 (or the names you grew up with), fold them the same way and toss them down. Keep a score sheet with one column per player.</p>
<h2>Questions</h2>
${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p>More: <a href="../../how-to-play/">full guide</a> · <a href="../../strategy/">strategy and tips</a> · <a href="../">all games</a></p>
<footer>${footerLinks('../../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}
/** An old URL of the same game: tells search engines and browsers to go to the main page. */
function redirectPage(id) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(GAME_NAME_EN[id])} is Cops and Robbers | ChitPlay</title>
<link rel="canonical" href="${MAIN_URL}">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=../${MAIN_SLUG}/">
<script>location.replace('../${MAIN_SLUG}/' + location.hash);</script>
</head>
<body style="background:#140b07;color:#f6ead2;font:17px system-ui,sans-serif;padding:24px">
<p>${esc(GAME_NAME_EN[id])} is the same game as <a style="color:#ffd27a" href="../${MAIN_SLUG}/">Cops and Robbers (Raja Rani Chor Police)</a>.</p>
</body>
</html>
`;
}
for (const id of COUNTRY_ORDER) {
  const dir = join(ROOT, 'games', GAME_SLUGS[id]);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), GAME_SLUGS[id] === MAIN_SLUG ? mainGamePage() : redirectPage(id));
}
writeLocalizedMainGuides();
writeFileSync(join(ROOT, 'games', 'index.html'), hubPage());


// ── Topic pages: useful answers for what people actually search ──
const TOPICS = {
  'indoor-games': {
    title: 'Indoor Games for 2 to 4 People', h1: 'Indoor games for two to four people',
    desc: 'The best indoor games for 2 to 4 people: Ludo, Carrom, Chess, Call Break and the paper chit game. Rules for home, or play free in 3D with friends.',
    intro: 'Stuck indoors with three other people and nothing to do? The chit game needs no board and no batteries: one page, one pen, and a straight face. It has been played in homes for generations because a grandparent, a parent and a teenager can all sit down and be equally good at it.',
    sections: [
      ['Why it works at home', 'Rounds last about a minute, so it fits between other things. Nobody has to be good at anything except keeping a straight face, which makes it fair across ages. And since a different person is the guesser each round, nobody sits out.'],
      ['What you need', 'Tear a page into four slips. Write King, Queen, Police and Thief on them (or your own version of the names), fold them and shuffle. One person tosses them on the floor and everyone picks one. Keep a score on the back of the same page.'],
      ['When there are fewer than four of you', 'Open CHITPLAY on a phone: computer players take the empty seats. Friends in the same room can join from their own phones by scanning a QR code, and each person keeps their chit private on their own screen.'],
      ['Other indoor games for the same table', 'Bored of chits? The classics all work with the same few people: Ludo and Snakes and Ladders for any age, Carrom and Chess for two, Call Break and Crazy Eights with a pack of cards, Dots and Boxes with a page and a pen. All of them are on ChitPlay, each with its own rules page below.'],
      ['A forfeit makes it better', 'Agree before you start what last place has to do: sing a line of an old song, tell an embarrassing story, or make the next round of tea. CHITPLAY suggests a harmless forfeit at the end of every match.'],
    ],
    faq: [
      ['What is the best indoor game for 4 people?', 'If you have no board game at hand, the chit game (known as Raja Rani Chor Police, Mafia, or Cops and Robbers) is hard to beat: it needs only paper, takes a minute to learn and suits every age.'],
      ['What indoor games can adults and children play together?', 'Games that reward bluffing rather than skill or strength. In the chit game a child can fool an adult as easily as the other way round.'],
      ['Which indoor games need no equipment?', 'The chit game needs just a page and a pen, or only a phone if you play it online for free.'],
    ],
  },
  'school-games': {
    title: 'Paper Games to Play in School', h1: 'Paper games to play in school',
    desc: 'The classic paper game from school days: four chits, one thief, a lot of bluffing. How to play it in class or at break, and how to play it online with friends.',
    intro: 'Almost everyone who went to school in South Asia remembers a torn notebook page folded into four chits. It was played on the last bench, in free periods and on long bus rides, and it is still one of the best games for a few minutes with friends.',
    sections: [
      ['How to play with a notebook page', 'Tear a page into four slips and write the four roles with their points. Fold them the same way so nobody can tell them apart, then toss them on the desk. Everyone picks one and reads it secretly. The guesser announces themselves and has to find the thief by looking at faces. Everyone opens their chit and you add up the scores on the same page.'],
      ['Good for a free period', 'A round takes about a minute and stops whenever the teacher arrives. It helps new classmates get talking, too: you have to look people in the eye to play.'],
      ['For teachers', 'It works as an ice-breaker, for practising simple addition with the scores, and for talking about how we read other people. Each group needs only four slips. You can print ready-made chits from any of our game pages.'],
      ['Now you’ve left school', 'CHITPLAY brings the game back for anyone who misses it, whatever their age. Invite old classmates with a link and play from wherever you all are now.'],
    ],
    faq: [
      ['What paper games can you play in class?', 'The four-chit game, also known as Raja Rani Chor Police or Raja Mantri Chor Sipahi, is the classic. It only needs one notebook page.'],
      ['How do you make the chits?', 'Tear a page into four equal slips, write King 1000, Queen 800, Police 500 and Thief 0, then fold each one the same way.'],
      ['Can it be played online with classmates?', 'Yes. One person hosts in CHITPLAY and the others join by QR code, invite link or a 6-digit code. Up to four people can play.'],
    ],
  },
  'how-to-play': {
    title: 'How to Play the Chit Game', h1: 'How to play the chit game: a complete guide',
    desc: 'Step-by-step rules of Raja Rani Chor Police (Cops and Robbers): the roles, a full example round, scoring, and how to play on paper or online.',
    intro: 'The chit game is one of the simplest party games there is: four folded slips of paper, one secret each, and one person who has to work out who is lying. This guide explains every step, walks through a complete round with real scores, and shows how the same game works in CHITPLAY on a phone or computer.',
    sections: [
      ['The four roles', 'Every round uses four chits. The names change from country to country, but the jobs stay the same. The King (Raja, Mayor, Tonosama) holds the most points, usually 1000. The Queen (Rani, Wazir, Mantri, Banker) holds 800. The guesser, most often the Police (Sipahi, Sheriff, Bobby), holds 500 and has one task: name the Thief. The Thief (Chor, Robber, Dorobo, Mafia) starts with nothing and tries to stay hidden. In a few editions the guessing job belongs to a different role, for example the Wazir in Raja Wazir Chor Sipahi.'],
      ['Setting up', 'You need four players and four slips of paper of the same size. Write one role and its points on each slip, fold them the same way so nobody can tell them apart, shake them in your hands and drop them on the floor or a table. Agree on the number of rounds before you start: five or seven rounds make a good match, and twenty make a long evening.'],
      ['One round, step by step', 'First, everyone picks a chit and reads it without letting anyone else see. Second, the guesser announces themselves, so everyone knows who is hunting. Third, the other three keep a straight face while the guesser studies them, asks questions and listens to the table talk. Fourth, the guesser points at one person. Finally, everybody opens their chit and the scores are written down.'],
      ['How scoring works', 'If the guesser names the Thief correctly, the guesser keeps their points and the Thief scores nothing. If the guess is wrong, the classic rule says the guesser and the Thief swap: the guesser scores nothing and the Thief takes the guesser’s points. The King and Queen always keep their own points. After the last round the totals are added up and the highest score wins.'],
      ['A complete example', 'Asha draws the King, Ben the Queen, Chetan the Police and Divya the Thief. Chetan announces he is the Police. Ben laughs too quickly and Chetan points at him. Ben opens his chit: Queen. The guess is wrong, so the points swap. Asha scores 1000, Ben 800, Chetan 0 and Divya, the Thief who stayed calm, scores 500. In the next round the chits are shuffled again, so everybody has a new role and a new chance.'],
      ['Regional twists', 'Many countries add a rule of their own. In some editions one innocent player is cleared before the guess. In others a witness gives a tip that is right most of the time, the guesser gets a second try for half points, or a caught Thief pays a fine. Each game page on CHITPLAY explains its own rules in full, with a scoring example.'],
      ['Playing it in CHITPLAY', 'Open www.chitplay.com, choose your edition and press Play. Computer players fill the empty seats, bluff, react and talk, so you can play alone. Single Phone mode passes one phone around a room, and Play with Friends lets up to four people join from their own phones with a 6-digit code or a QR code. Your chit stays private on your own screen, the scores are kept for you, and the game remembers your rank between visits.'],
      ['Printable chits', 'To play on paper, write King 1000, Queen 800, Police 500 and Thief 0 on four slips. If your family grew up with different names, use those: the game is the same. Keep a score sheet with one column per player and one row per round, and agree on a light-hearted forfeit for last place before the first round.'],
    ],
    faq: [
      ['How many players do you need?', 'Exactly four chits are used, so four players is the classic game. With fewer people, CHITPLAY adds computer players to the empty seats.'],
      ['How long does a game take?', 'A round takes about a minute. A five-round match takes five to ten minutes.'],
      ['Who is the guesser?', 'Whoever draws the guessing chit in that round, usually the Police. Because the chits are shuffled every round, everyone gets a turn.'],
      ['Is it a gambling game?', 'No. The points are only a score for the match. Nothing is bought, bet or won, and the game is free.'],
    ],
  },
  'strategy': {
    title: 'Chit Game Strategy and Tips', h1: 'Chit game strategy: how to catch the Thief and how to hide',
    desc: 'Tips for every role in Raja Rani Chor Police and the other chit games: reading faces, bluffing, the odds of a guess, and how to stay hidden as the Thief.',
    intro: 'The chit game looks like pure luck, but good players win far more often than chance allows. The draw is random; what happens after it is all about people. These tips come from how the game is actually played, at home and in CHITPLAY, and work for every edition.',
    sections: [
      ['Know the odds', 'With three suspects, a guess made without any clue is right one time in three. Every clue that clears one person improves the odds to one in two. That is why a cleared suspect, a witness or a careful look is worth so much: it turns a coin-flip into a likely catch. Over a long match, a guesser who reads the table even a little better than chance will finish far ahead.'],
      ['As the guesser: watch first, talk second', 'In the first seconds after the chits are opened, people react before they think. Watch for the person who looks at their chit twice, folds it unusually fast, or suddenly becomes very interested in something else. Then ask simple questions and listen to how people answer, not to what they say. A Thief often answers a little too quickly or makes a joke to move attention away.'],
      ['As the guesser: use what the rules give you', 'If your edition clears an innocent player or gives you a witness, use it before you decide. In CHITPLAY you can also try to peek once a round: most of the time you see one innocent chit, but if you are noticed you lose 100 points, so it is a gamble best saved for rounds where you have no clue at all.'],
      ['As the Thief: be ordinary', 'The best disguise is to behave exactly as you did in the last round. Don’t go silent and don’t suddenly talk a lot. If you usually joke, keep joking. Look at the guesser when they look at you, then look away naturally. Pointing at someone else can work, but only if you sound like you are guessing, not accusing.'],
      ['As the King or Queen: stir things up', 'Your points are safe whatever happens, so you can make the round fun. Act a little guilty to pull suspicion towards you, or defend someone you are sure is innocent. Every wrong guess costs the guesser points, so a good King or Queen can quietly decide who wins the match.'],
      ['Reading a table you know', 'Families and old friends have tells that only show up after a few rounds: the cousin who always laughs, the friend who touches their ear. Keep a mental note of how each person behaves when they are innocent, so you notice the change when they are not.'],
      ['Table talk in CHITPLAY', 'In CHITPLAY you can send emojis and short fixed messages to other players. A private message can be a bluff: “It’s not me, check Riya” might be true, or it might be the Thief. Computer players use the same tricks, and they are not always honest either.'],
      ['Playing a long match', 'Points add up across rounds, so one big catch does not decide the match. If you are behind near the end, rounds where you are the guesser are your chance to catch up; if you are ahead, a careful guess is better than a risky peek.'],
    ],
    faq: [
      ['Is the chit game only luck?', 'The draw is luck, but the guess is skill. Reading faces and using clues makes a guesser right far more often than one time in three.'],
      ['How do you hide as the Thief?', 'Behave exactly as you did in the previous rounds. Changes in behaviour give you away more than anything you say.'],
      ['What should the King and Queen do?', 'Their points are safe, so they can bluff freely to confuse the guesser and make the round more exciting.'],
    ],
  },
};
function topicPage(slug, t) {
  const url = `${SITE}/${slug}/`;
  const title = `${t.title} | ChitPlay`;
  const items = COUNTRY_ORDER.map(id => `<li><a href="../games/${GAME_SLUGS[id]}/">${esc(GAME_NAME_EN[id])}</a> (${esc(COUNTRIES[id].name)})</li>`).join('');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: t.h1, description: t.desc, url, image: [`${SITE}/assets/chitplay-game.jpg`, `${SITE}/assets/home.jpg`], author: DEVELOPER_LD, publisher: { '@type': 'Organization', name: 'ChitPlay', logo: { '@type': 'ImageObject', url: `${SITE}/assets/icon-512.png` } }, dateModified: TODAY },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'CHITPLAY', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: t.title, item: url }] },
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(t.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(t.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/home.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(t.desc)}">
<meta name="twitter:image" content="${SITE}/assets/home.jpg">
${iconLinks('../')}
<script type="application/ld+json">${json(ld)}</script>
<style>body{margin:0;background:#140b07;color:#f6ead2;font:17px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}main{max-width:760px;margin:0 auto;padding:24px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(28px,6vw,40px);line-height:1.2}h2{font-size:21px;margin-top:28px}.btn{display:inline-block;padding:14px 22px;border-radius:12px;font-weight:700;text-decoration:none;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6}details{background:#24140c;border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}.others{columns:2}footer{margin-top:40px;font-size:13px;color:#d4c2a0}</style>
</head>
<body>
<main>
${logoLink('../')}
<h1>${esc(t.h1)}</h1>
<img src="../assets/chitplay-game.webp" alt="ChitPlay: four players at the chit game in a 3D room" width="1200" height="675" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px">
<p>${esc(t.intro)}</p>
<p><a class="btn" href="../">▶ Play free now</a></p>
${t.sections.map(([h, p]) => `<h2>${esc(h)}</h2>\n<p>${esc(p)}</p>`).join('\n')}
${slug === 'indoor-games' ? `<h2>All our indoor games</h2>\n<ul>${PARTY.map(g => `<li><a href="../games/${g.slug}/">${esc(g.name)}</a>: ${esc(g.blurb)}</li>`).join('')}</ul>` : ''}
${adSlot('article')}
<h2>Play it now</h2>
<p><a href="../games/cops-and-robbers/">Cops and Robbers</a>, also known as Raja Rani Chor Police, Chor Sipahi, Mafia or Räuber und Gendarm: one game, every name.</p>
<h2>Questions</h2>
${t.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
${bannerSlot()}
<footer>${footerLinks('../')} · © ${TODAY.slice(0, 4)} CHITPLAY</footer>
</main>
</body>
</html>
`;
}
for (const [slug, t] of Object.entries(TOPICS)) {
  mkdirSync(join(ROOT, slug), { recursive: true });
  writeFileSync(join(ROOT, slug, 'index.html'), topicPage(slug, t));
}

// ── About / Privacy / Terms (what ad networks look for before approving a site) ──
function infoPage(slug, title, desc, bodyHtml, headTitle = title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(/ChitPlay/.test(headTitle) ? headTitle : `${headTitle} | ChitPlay`)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/${slug}/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:title" content="${esc(/ChitPlay/.test(headTitle) ? headTitle : `${headTitle} | ChitPlay`)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/${slug}/">
<meta property="og:image" content="${SITE}/assets/home.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(/ChitPlay/.test(headTitle) ? headTitle : `${headTitle} | ChitPlay`)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/home.jpg">
${iconLinks('../')}
<style>body{margin:0;background:#140b07;color:#f6ead2;font:16px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}main{max-width:760px;margin:0 auto;padding:24px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(26px,6vw,36px);line-height:1.2}h2{font-size:20px;margin-top:28px}footer{margin-top:40px;font-size:13px;color:#d4c2a0}</style>
</head>
<body>
<main>
${logoLink('../')}
<p><a href="../">← Play CHITPLAY</a></p>
<h1>${esc(title)}</h1>
${bodyHtml}
<footer>${footerLinks('../')} · Last updated ${TODAY}</footer>
</main>
</body>
</html>
`;
}
const gameList = COUNTRY_ORDER.map(id => `<li><a href="../games/${GAME_SLUGS[id]}/">${esc(GAME_NAME_EN[id])}</a></li>`).join('');
const INFO = {
  about: ['About ChitPlay', 'ChitPlay is a free 3D room of 45+ indoor games: Raja Rani Chor Police, Ludo, Carrom, Chess, card, arcade and party games. Who makes it and how.', `
<p>ChitPlay is a free 3D living room full of indoor games that you play in your browser. It started with one game, the four-player paper chit game known as Raja Rani Chor Police, and it now has more than forty-five: board games, card games, party games and arcade games, all at one table, for players of every age.</p>
<p>You can play every game as a guest with no sign-up: against computer players, with people online, with friends on their own phones nearby (one shares a code, the others join), or on one phone handed round the table.</p>
<h2>Who makes ChitPlay</h2>
<p>ChitPlay is designed and developed by <strong>${DEVELOPER}</strong>, an independent developer from India. The aim is simple: keep the games people play at home, at school and with family easy to reach for anyone with a phone or a computer, without downloads, accounts or real money.</p>
<p>Questions, ideas, bug reports or business enquiries: ${MAILTO}. See the <a href="../contact/">contact page</a> for more.</p>
<h2>The games</h2>
<ul>
<li><strong>The chit game:</strong> <a href="../games/cops-and-robbers/">Raja Rani Chor Police (Cops and Robbers)</a>, with the rules and role names of fourteen countries, from Raja Mantri Chor Sipahi to Mafia and Räuber und Gendarm.</li>
${[...new Set(PARTY.map(g => g.kind))].map(kind => `<li><strong>${esc({ Arcade: 'Arcade games on the room’s TV', Party: 'Party games', Puzzle: 'Puzzle games', Board: 'Board games', Cards: 'Card games', Paper: 'Pen and paper games', Tiles: 'Tile games', Dice: 'Dice games' }[kind] || `${kind} games`)}:</strong> ${PARTY.filter(g => g.kind === kind).map(g => `<a href="../games/${g.slug}/">${esc(g.name)}</a>`).join(', ')}.</li>`).join('\n')}
</ul>
<p>Every game has its own page with the full rules, scoring, tips and answers to common questions. The <a href="../games/">games list</a> has them all.</p>
<h2>How it's made</h2>
<p>Everything runs on your device: the 3D room, the characters, the computer players, your profile and your saved games. There are no accounts and no downloads, and it works on phones, tablets and computers, even offline once it has been opened. Games with friends nearby connect phone to phone; online games share only the moves of the game.</p>
<p>The arcade games, the room and the characters are our own designs. The traditional games follow their usual rules, and where a game has regional versions, its page says which one ChitPlay plays.</p>
<h2>Fair play</h2>
<ul>
<li>No real money, betting or prizes anywhere. Points and coins have no value outside the game.</li>
<li>No pop-ups while you play: rewards and messages wait until a game is over.</li>
<li>Chat with other players is limited to emojis and short ready-made lines.</li>
</ul>
<h2>How ChitPlay stays free</h2>
<p>ChitPlay is free to play. We use Google Analytics to understand which games people enjoy, and the information pages may show advertising to cover the costs of running the site. Our <a href="../privacy/">Privacy Policy</a> explains both.</p>`, 'About ChitPlay – Free 3D Indoor Games Online'],
  contact: ['Contact ChitPlay', 'Contact the ChitPlay team by email for support, bug reports, privacy requests, copyright concerns or advertising enquiries.', `
<p>We'd love to hear from you. Email is the best way to reach us:</p>
<p style="font-size:20px"><strong>${MAILTO}</strong></p>
<p>Developer: <strong>${DEVELOPER}</strong></p>
<h2>What to write to us about</h2>
<ul>
<li><strong>Bugs:</strong> tell us the game you were playing, your phone or computer, and your browser.</li>
<li><strong>Game ideas:</strong> a version of the game from your country or a rule we've got wrong.</li>
<li><strong>Privacy requests:</strong> questions about your data. See the <a href="../privacy/">Privacy Policy</a>.</li>
<li><strong>Copyright concerns:</strong> identify the content and explain your rights in it.</li>
<li><strong>Advertising and business enquiries.</strong></li>
</ul>
<h2>Before you write</h2>
<ul>
<li><strong>How do I play a game?</strong> Every game has a page with its rules: see <a href="../games/">all games</a> or the <a href="../how-to-play/">how-to-play guide</a>.</li>
<li><strong>A friend can't join my game nearby.</strong> Both phones need to be online. Check the code and try again: on a slow network the second try usually works.</li>
<li><strong>My progress is gone.</strong> ChitPlay saves on your device. Clearing your browser's data or using a private window removes it.</li>
<li><strong>Is there an app?</strong> You can add ChitPlay to your home screen from the browser menu. It then opens like an app, even offline.</li>
</ul>
<p>ChitPlay is run by one independent developer, so a reply may take a few days. We read every message.</p>`, 'Contact ChitPlay – Help, Bugs and Ideas'],
  privacy: ['Privacy Policy', 'How ChitPlay handles your data: no accounts, game data stored on your device, Google Analytics, cookies, advertising and your choices.', `
<p>ChitPlay (www.chitplay.com) is a game that runs in your browser, developed by ${DEVELOPER}. This page explains what data it uses and the choices you have. Questions: ${MAILTO}.</p>
<h2>Saved on your device</h2>
<p>CHITPLAY saves your profile (player name, gender and character), your settings (sound, voice, conversation, chat language, graphics, number of rounds), your points, rank, badges, best matches, pinned games and your current match in your browser's local storage, so that a refresh doesn't lose your game. We don't receive this data. The reset button in your profile erases your score, and clearing your browser's site data erases everything. The game also picks a starting game and suitable first names from your device's timezone and language settings; that check happens on your device.</p>
<h2>Camera (only if you scan a QR code)</h2>
<p>When you choose to scan a friend's QR code to join a game, your browser asks for permission to use the camera, or you can take a photo instead. The picture is read on your device to find the game code. It is never stored or uploaded, and the camera stops as soon as the code is found or you cancel.</p>
<h2>What we don't ask for</h2>
<p>There are no accounts or sign-ups, and we don't ask for your email address or phone number. The player name you choose stays on your device, unless you use Play with Friends. If you email us, we use your message and address only to reply.</p>
<h2>Google Analytics</h2>
<p>We use Google Analytics 4, loaded through Google Tag Manager, to understand how the site is used, such as which pages and games are visited. It uses cookies and collects information such as pages viewed, approximate location, device and browser type, and the site that referred you. We use this information in aggregate to improve ChitPlay. You can install the <a href="https://tools.google.com/dlpage/gaoptout" rel="nofollow noopener">Google Analytics opt-out browser add-on</a> to stop it.</p>
<h2>Advertising and cookies</h2>
<p>ChitPlay may show advertising to keep the game free. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to users based on their visits to this site and/or other sites on the Internet. You can opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" rel="nofollow noopener">Google Ads Settings</a> or <a href="https://www.aboutads.info/choices/" rel="nofollow noopener">www.aboutads.info</a>.</p>
<p>Read <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener">how Google uses information from sites that use its services</a>. A cookie is a small file a website stores in your browser; you can block or delete cookies in your browser settings, and the game will still work.</p>
<h2>Visitors in the EEA, UK and Switzerland</h2>
<p>For visitors from these regions, analytics and advertising cookies are off by default and are used only if you give consent. When ads are shown, the consent message comes from Google's certified consent management platform; you can change or withdraw your choice at any time from the privacy settings link it adds to the page. You may have rights under local law to access, correct or delete personal data, or to object to its use. Email us to make a request; we hold almost nothing that identifies you, and data held by Google can be managed through the links above.</p>
<h2>Play with Friends</h2>
<p>Play with Friends is optional and only connects when you host or join a game. To find each other, the phones contact the free PeerJS connection service (peerjs.com), which sees your IP address and a temporary game code. The game then runs directly between the phones; if a direct connection isn't possible, its messages may pass through PeerJS's relay server. The name, gender and character you chose are shown to the other players in that game. Emojis and private messages are chosen from fixed lists, so no free text is sent; a private message passes through the host's phone without being shown there. The one exception is a Nearby game of Consequences, the story-writing game, where friends who invited each other with a code type their own lines; those lines are shown only to the players in that game and are not kept. CHITPLAY doesn't store any of this.</p>
<h2>Play Online (random players)</h2>
<p>Play Online is optional. It seats you at a public table with other players through the same free PeerJS connection service as Play with Friends. The other players see your player name, your character and how many points you scored this week; a name containing a swear word is shown to them as "Player". Messages at the table are only emojis and lines from a fixed list, so nobody can send you typed text, in any game. CHITPLAY keeps a short list of the players you met this week, with their points, on your device only, to show the weekly table.</p>
<h2>Daily reminder</h2>
<p>The daily reminder is off unless you turn it on, and only then does your browser ask for permission to show notifications. The time you choose and the fact that it's on stay on your device, and we receive nothing. You can turn it off in your profile or in your browser's settings at any time.</p>
<h2>Coins, challenges and rewards</h2>
<p>Coins, daily challenges, hats and colours are kept in your browser's local storage like the rest of your profile. Coins are earned by playing; they can't be bought with money and have no value outside the game.</p>
<h2>Children</h2>
<p>CHITPLAY is a general-audience game for players of all ages and is not directed specifically at children under 13. We don't knowingly collect personal information from children. If you are a parent or guardian and believe a child has sent us personal information, email ${MAILTO} and we will delete it.</p>
<h2>Changes</h2>
<p>If this policy changes, we'll update this page and the date at the bottom.</p>`],
  terms: ['Terms of Use', 'The terms for playing ChitPlay, a free browser game: fair use, intellectual property, advertising, disclaimers and how to contact us.', `
<p>By playing ChitPlay (www.chitplay.com), developed by ${DEVELOPER}, you agree to these terms. If you don't agree, please don't use the site.</p>
<h2>The game</h2>
<p>ChitPlay is provided free of charge, as is, for entertainment. We try to keep it working well on every device but can't guarantee it will always be available or error-free.</p>
<h2>Points and coins have no value</h2>
<p>Points, coins and the hats or colours you unlock in ChitPlay are only for fun. They can't be bought with real money, have no cash value and can't be exchanged or transferred. ChitPlay involves no real-money play, no paid random items and no gambling. That includes the card and dice games: nothing is bet, staked or won, and scores exist only to keep track of the game.</p>
<h2>Fair use</h2>
<p>You may play and share links to ChitPlay freely. Please don't copy the site, its artwork or its code to republish it as your own, try to disrupt the service, or tamper with or generate invalid clicks on any ads.</p>
<h2>Play with Friends and Play Online</h2>
<p>The name you enter is shown to the people in your game, including strangers at public tables. Please don't use offensive names or names that aren't yours to use.</p>
<h2>Content</h2>
<p>Game names such as Raja Rani Chor Police, Mafia or Cops and Robbers are traditional names for a public-domain game, and the other games on the site (such as Ludo, Carrom and Chess) are traditional games too. The characters, the room, the boards, the pieces and the dialogue in CHITPLAY are original. If you believe something here infringes your rights, please <a href="../contact/">contact us</a>.</p>
<h2>Advertising and links</h2>
<p>ChitPlay may display ads from third parties. We are not responsible for the content of external websites reached through ads or links.</p>
<h2>Liability</h2>
<p>To the extent the law allows, ChitPlay and its developer are not liable for any loss arising from using, or being unable to use, the site.</p>
<h2>Changes and contact</h2>
<p>We may update these terms; the date at the bottom shows the latest version. Questions: ${MAILTO}.</p>`, 'Terms of Use – ChitPlay Free Online Games'],
  disclaimer: ['Disclaimer', 'ChitPlay is a free game for entertainment only: no real money, points have no value, and external links and ads are the responsibility of third parties.', `
<p>ChitPlay is a free browser game, provided for entertainment.</p>
<h2>Entertainment only</h2>
<p>ChitPlay involves no real money, betting or prizes, in any game, including the card and dice games. Points have no value outside the game. Roles such as Thief, Mafia or Police are make-believe parts of a traditional party game and don't promote or depict real crime.</p>
<h2>Rules and accuracy</h2>
<p>Many of these games have regional versions and their rules vary from place to place. Our pages describe how each version plays in ChitPlay, and they may differ from how you learned it. We try to be accurate but make no guarantee.</p>
<h2>Online play and chat</h2>
<p>Online and nearby games connect you with other players. ChitPlay limits chat to emojis and short ready-made lines, and doesn't ask for or show personal details. Player names are chosen by players; if you see an offensive one, tell us.</p>
<h2>Health and screen time</h2>
<p>Take breaks, and look away from the screen now and then. The arcade games have moving pictures and quick flashes; if bright flashes affect you, play the board, card and party games instead.</p>
<h2>External links and advertising</h2>
<p>This site may link to other websites and show ads from third parties. We don't control them and aren't responsible for their content, products or privacy practices.</p>
<h2>Trademarks</h2>
<p>Any product or company names mentioned belong to their owners. ChitPlay isn't affiliated with or endorsed by them.</p>
<h2>Contact</h2>
<p>Something wrong on this site? Email ${MAILTO}.</p>`, 'Disclaimer – ChitPlay Free Online Games'],
};
for (const [slug, [title, desc, body, headTitle]] of Object.entries(INFO)) {
  mkdirSync(join(ROOT, slug), { recursive: true });
  writeFileSync(join(ROOT, slug, 'index.html'), infoPage(slug, title, desc, body, headTitle));
}

// ads.txt + the AdSense tag on every page, once you have a publisher id:
//   node tools/build-seo.mjs https://www.chitplay.com pub-1234567890123456
if (HAS_ADS) {
  writeFileSync(ADS_TXT, `google.com, ${PUB}, DIRECT, f08c47fec0942fa0\n`);
  console.log(`ads.txt written for ${PUB}`);
}

// GitHub Pages reads the custom domain from CNAME; a github.io address must not have one
const HOST = new URL(SITE).hostname;
if (HOST.endsWith('github.io')) rmSync(join(ROOT, 'CNAME'), { force: true });
else writeFileSync(join(ROOT, 'CNAME'), `${HOST}\n`);

// ── ChitPlay in other languages: one full page each, every game under its local name ──
// the articles list, named in each language (tools/articles/<code>.mjs ui.hubTitle)
const ARTICLE_HUB = Object.fromEntries(await Promise.all(LANG_PAGES.map(async L => [L.code, (await import(`./articles/${L.code}.mjs`).catch(() => ({ default: null }))).default?.ui.hubTitle])));
function langPage(L) {
  const url = `${SITE}/${L.dir}/`;
  const playUrl = (slug) => `../play/?game=${slug}&mode=play&lang=${L.game}`;
  const gameUrl = (slug) => `games/${slug}/`;
  const players = (g) => (g.min === g.max ? `${g.min}` : `${g.min}–${g.max}`);
  const item = (g) => `<li class="card"><a class="card__link" href="${gameUrl(g.slug)}" hreflang="${L.code}"><img src="../assets/${imageFor(g.slug, true)}" alt="${esc(L.names[g.slug][0])}" width="160" height="160" loading="lazy" decoding="async"><strong lang="${L.code}">${esc(L.names[g.slug][0])}</strong> <small class="card__en" lang="en">English: ${esc(g.name)}</small><span class="card__blurb">${esc(L.names[g.slug][1])}</span><small>👥 ${players(g)} ${esc(L.ui.players)}</small></a><a class="card__play go" href="${playUrl(g.slug)}">${esc(L.ui.play)}</a><span class="card__links"><a href="${gameUrl(g.slug)}" hreflang="${L.code}">${esc(L.ui.guide)}</a><a href="../games/${g.slug}/" hreflang="en">${esc(L.ui.rules)}</a></span></li>`;
  const kinds = ['Party', 'Board', 'Cards', 'Arcade', 'Dice', 'Puzzle'].filter(k => PARTY.some(g => g.kind === k));
  const sections = kinds.map(k => `<h3>${esc(L.kinds[k] || k)}</h3>\n<ul class="games cards">${PARTY.filter(g => g.kind === k).map(item).join('')}</ul>`).join('\n');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: L.title, url, inLanguage: L.code, description: L.desc, isPartOf: { '@type': 'WebSite', name: 'ChitPlay', url: `${SITE}/` } },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: L.gamesTitle, numberOfItems: PARTY.length + 1, itemListElement: [{ slug: MAIN_SLUG, name: L.main[0] }, ...PARTY.map(g => ({ slug: g.slug, name: L.names[g.slug][0] }))].map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.name, url: `${SITE}/${L.dir}/${gameUrl(g.slug)}`, image: `${SITE}/assets/${imageFor(g.slug, true, 'jpg')}` })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: L.code, mainEntity: L.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: L.label, item: url }] },
  ];
  return `<!DOCTYPE html>
<html lang="${L.code}"${L.rtl ? ' dir="rtl"' : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(L.title)}</title>
<meta name="description" content="${esc(L.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
${hreflangLinks()}
<meta property="og:type" content="website">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:locale" content="${L.code.replace('-Latn', '').replace('-', '_')}">
<meta property="og:title" content="${esc(L.title)}">
<meta property="og:description" content="${esc(L.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/home.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(L.title)}">
<meta name="twitter:description" content="${esc(L.desc)}">
<meta name="twitter:image" content="${SITE}/assets/home.jpg">
${iconLinks('../')}
<script type="application/ld+json">${json(ld)}</script>
<style>body{margin:0;background:#140b07;color:#f6ead2;font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Devanagari",sans-serif}main{max-width:820px;margin:0 auto;padding:20px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(26px,6vw,38px);line-height:1.2}h2{font-size:22px;margin-top:30px}h3{font-size:18px;margin:22px 0 8px;color:#ffd27a}.btn{display:inline-block;padding:14px 24px;border-radius:12px;font-weight:700;text-decoration:none;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6;font-size:18px}.ways{padding-left:0;list-style:none}.ways li{margin:8px 0;padding:10px 14px;border-radius:12px;background:#24140c}.games{padding:0;list-style:none}.games li{display:flex;gap:12px;align-items:flex-start;margin:8px 0;padding:10px 12px;border-radius:12px;background:#24140c}.games img{flex:none;border-radius:12px}.games small{color:#d4c2a0}.go{font-weight:700;margin-right:10px}.feature{display:flex;gap:14px;align-items:center;padding:14px;border-radius:14px;background:#2d170c;border:1px solid #6a3b1d}.feature img{flex:none;border-radius:16px}details{background:#24140c;border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}footer{margin-top:40px;font-size:13px;color:#d4c2a0}.langs{font-size:14px}.games li a,.feature a{display:inline-block;margin-inline-end:14px;margin-top:4px}.games li a.go,.feature a.go{font-weight:800}${CARD_CSS}ul.games.cards{list-style:none;padding:0}ul.games.cards li.card{display:flex;flex-direction:column;align-items:stretch;margin:0;padding:0;gap:0;background:#24140d}ul.games.cards li.card a.card__link{display:flex;margin:0}ul.games.cards li.card a.card__play{display:block;margin:0 10px 8px;text-align:center;color:#140b07}ul.games.cards li.card .card__links a{display:inline;margin:0}ul.games.cards .card__links{gap:4px 12px}ul.games.cards .card__en{display:block;margin-top:-2px}</style>
</head>
<body>
<main>
${logoLink('../')}
<h1>${esc(L.h1)}</h1>
${L.intro.map(p => `<p>${esc(p)}</p>`).join('\n')}
<p><a class="btn" href="../${mainPlay(L)}">${esc(L.ui.playNow)}</a></p>
<p>📚 <a href="articles/">${esc(ARTICLE_HUB[L.code] || 'Game ideas')}</a></p>
<h2>${esc(L.waysTitle)}</h2>
<ul class="ways">${L.ways.map(([t, d]) => `<li><strong>${esc(t)}:</strong> ${esc(d)}</li>`).join('')}</ul>
<h2>${esc(L.gamesTitle)}</h2>
<div class="feature"><img src="../assets/${imageFor(MAIN_SLUG, true)}" alt="${esc(L.main[0])}" width="88" height="88" loading="lazy" decoding="async"><div><strong>${esc(L.main[0])}</strong> <small>English: Raja Rani Chor Police · 👥 4 ${esc(L.ui.players)}</small><br>${esc(L.main[1])}<br><a class="go" href="../${mainPlay(L)}">${esc(L.ui.play)}</a> <a href="games/${MAIN_SLUG}/" hreflang="${L.code}">${esc(L.ui.guide)}</a> <a href="../games/${MAIN_SLUG}/" hreflang="en">${esc(L.ui.rules)}</a></div></div>
${sections}
<h2>${esc(L.faqTitle)}</h2>
${L.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<h2>${esc(L.ui.langs)}</h2>
<p class="langs"><a href="../games/" hreflang="en" lang="en">English</a> · ${LANG_PAGES.filter(o => o !== L).map(o => `<a href="../${o.dir}/" hreflang="${o.code}" lang="${o.code}">${o.label}</a>`).join(' · ')}</p>
<p><small>${esc(L.ui.note)}</small></p>
<footer>${footerLinks('../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}
for (const L of LANG_PAGES) {
  mkdirSync(join(ROOT, L.dir), { recursive: true });
  writeFileSync(join(ROOT, L.dir, 'index.html'), langPage(L));
}

// ── Game-idea articles in every language (tools/articles) ──
const { writeArticles } = await import('./articles/index.mjs');
const articlePages = await writeArticles({ ROOT, SITE, TODAY, ANALYTICS, esc, json, iconLinks, logoLink, footerLinks, LANG_PAGES, PARTY, MAIN_SLUG, imageFor, guideFor, adSlot, bannerSlot });
const articleCluster = new Map(articlePages.map(p => [p.url, p]));

const gameGuideUrls = PARTY.flatMap(g => [`${SITE}/games/${g.slug}/`, ...guidedLangs(g.slug).map(L => `${SITE}/${L.dir}/games/${g.slug}/`)]);
const localizedMainGuideUrls = LANG_PAGES.map(L => `${SITE}/${L.dir}/games/${MAIN_SLUG}/`);
const urls = [`${SITE}/`, `${SITE}/games/`, ...Object.keys(TOPICS).map(slug => `${SITE}/${slug}/`), MAIN_URL, ...localizedMainGuideUrls, ...gameGuideUrls, ...Object.keys(INFO).map(slug => `${SITE}/${slug}/`), ...LANG_PAGES.map(L => `${SITE}/${L.dir}/`), ...articlePages.map(p => p.url), ...CATEGORIES.map(c => `${SITE}/games/${c.slug}/`)];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u, i) => {
  // each game's page carries its own picture, so it can show up in image search too
  const slug = u.match(/\/games\/([a-z0-9-]+)\/$/)?.[1];
  const game = PARTY.find(g => g.slug === slug);
  const isMainGuide = u === MAIN_URL || localizedMainGuideUrls.includes(u);
  const articlePic = articleCluster.get(u)?.image;
  const pic = articlePic ? `<image:image><image:loc>${articlePic}</image:loc></image:image>` : game
    ? `<image:image><image:loc>${SITE}/assets/${gameplayImageFor(game.slug)}</image:loc></image:image><image:image><image:loc>${SITE}/assets/${imageFor(game.slug, false, 'jpg')}</image:loc></image:image>`
    : isMainGuide
      ? `<image:image><image:loc>${SITE}/assets/${gameplayImageFor(MAIN_SLUG)}</image:loc></image:image><image:image><image:loc>${SITE}/assets/${imageFor(MAIN_SLUG, false, 'jpg')}</image:loc></image:image>`
      : '';
  const gameCluster = game
    ? [['en', `${SITE}/games/${game.slug}/`], ...guidedLangs(game.slug).map(L => [L.code, `${SITE}/${L.dir}/games/${game.slug}/`]), ['x-default', `${SITE}/games/${game.slug}/`]]
    : isMainGuide
      ? [['en', MAIN_URL], ...LANG_PAGES.map(L => [L.code, `${SITE}/${L.dir}/games/${MAIN_SLUG}/`]), ['x-default', MAIN_URL]]
      : null;
  const homeCluster = u === `${SITE}/games/` || LANG_PAGES.some(L => u === `${SITE}/${L.dir}/`);
  const article = articleCluster.get(u);
  const cluster = gameCluster || article?.cluster || (homeCluster ? [['en', `${SITE}/games/`], ...LANG_PAGES.map(L => [L.code, `${SITE}/${L.dir}/`]), ['x-default', `${SITE}/games/`]] : null);
  const alt = cluster ? cluster.map(([c, h]) => `<xhtml:link rel="alternate" hreflang="${c}" href="${h}"/>`).join('') : '';
  return `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>${i === 0 ? '1.0' : i === 1 ? '0.9' : '0.8'}</priority>${pic}${alt}</url>`;
}).join('\n')}
</urlset>
`);
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /archive/\nDisallow: /tests/\nDisallow: /tools/\n\n# Google AdSense crawler\nUser-agent: Mediapartners-Google\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(ROOT, 'manifest.webmanifest'), JSON.stringify({
  name: 'CHITPLAY',
  short_name: 'CHITPLAY',
  description: 'Raja Rani Chor Police, Ludo, Carrom, Chess and 45+ free indoor games in 3D. Play the computer, online or with friends.',
  start_url: './?source=pwa',
  scope: './',
  display: 'fullscreen',
  orientation: 'any',
  background_color: '#140b07',
  theme_color: '#140b07',
  categories: ['games', 'entertainment'],
  icons: [
    { src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'assets/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'assets/icon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
}, null, 2));

// ── refresh the SEO blocks inside index.html ────────────────
const mainNames = [...new Set(COUNTRY_ORDER.flatMap(id => [GAME_NAME_EN[id], ...GAME_AKA[id].slice(0, 4)]))];
// ChitPlay is the name people should see; the title carries the names the game is searched by in each country
const homeTitle = 'ChitPlay: Raja Rani Chor Police & 45+ Indoor Games';
const homeDesc = 'Play Raja Rani Chor Police, Ludo, Carrom, Chess and 45+ free indoor games in 3D. No sign-up: play the computer, online or with friends.';
const homeLd = [
  // Google's site name comes from this block on the home page: https://developers.google.com/search/docs/appearance/site-names
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'ChitPlay', alternateName: ['CHITPLAY', 'Chit Play'], url: `${SITE}/`, inLanguage: 'en' },
  {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'ChitPlay', url: `${SITE}/`, logo: `${SITE}/assets/icon-512.png`,
    email: CONTACT_EMAIL, founder: DEVELOPER_LD,
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: CONTACT_EMAIL, url: `${SITE}/contact/` },
  },
  {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: 'ChitPlay',
    alternateName: mainNames, url: `${SITE}/`, description: homeDesc, author: DEVELOPER_LD,
    genre: ['Party game', 'Social deduction game', 'Paper chit game', 'Indoor game'], audience: { '@type': 'PeopleAudience', suggestedMinAge: 6 }, gamePlatform: 'Web browser',
    applicationCategory: 'Game', operatingSystem: 'Any', image: [`${SITE}/assets/chitplay-game.jpg`, `${SITE}/assets/home.jpg`],
    numberOfPlayers: { '@type': 'QuantitativeValue', value: 4 },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
];
const head = `<!-- seo:head -->
  <title>${esc(homeTitle)}</title>
  <meta name="description" content="${esc(homeDesc)}" />
  <link rel="canonical" href="${SITE}/" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ChitPlay" />
  <meta property="og:title" content="${esc(homeTitle)}" />
  <meta property="og:description" content="${esc(homeDesc)}" />
  <meta property="og:url" content="${SITE}/" />
  <meta property="og:image" content="${SITE}/assets/home.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="ChitPlay: Raja Rani Chor Police, Ludo, Carrom, Chess and more free indoor games" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(homeTitle)}" />
  <meta name="twitter:description" content="${esc(homeDesc)}" />
  <meta name="twitter:image" content="${SITE}/assets/home.jpg" />
  <script type="application/ld+json">${json(homeLd)}</script>
  <!-- /seo:head -->`;
const body = `<!-- seo:body -->
  <section class="seo-intro" aria-label="About ChitPlay">
    <h1>ChitPlay: indoor games online, for every age</h1>
    <p>ChitPlay is a 3D living room full of games: ${PARTY.length + 1} of them, free in your browser. Play as a guest with no sign-up, get matched with players online, play the computer, or invite friends nearby with a code.</p>
    <img src="assets/chitplay-game.webp" alt="ChitPlay: four players at the Raja Rani Chor Police chit game in a 3D room" width="1200" height="675" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px">
    <p>ChitPlay is the 4-player paper chit game, free in your browser for players of every age. Draw a folded chit, keep a straight face, and let the Police (or Sipahi, Wazir, Sheriff…) catch the Thief.</p>
    <p>The same game has many names: Raja Rani Chor Police and Raja Rani Chor Sipahi in India, Raja Mantri Chor Sipahi in Nepal, Raja Wazir Chor Sipahi in Pakistan, Chor Police in Bangladesh, Mafia in Korea and Russia, Cops and Robbers in the USA and UK, Räuber und Gendarm in Germany. ChitPlay has all of them, each with its own rules.</p>
    <h2>Every game at one table</h2>
    <p>Swipe through the games on the start screen: ${PARTY.map(g => `<a href="games/${g.slug}/">${esc(g.name)}</a>`).join(', ')}. Each one plays in 3D, with computer players, online, or with friends nearby.</p>
    <h2>One game, many names</h2>
    <p><a href="games/cops-and-robbers/">Cops and Robbers</a> is played as ${esc(COUNTRY_ORDER.map(id => GAME_NAME_EN[id]).filter(n => n !== 'Cops and Robbers').join(', '))}. Pick your language and the game takes your name for it.</p>
    <p><a href="games/">All games and rules</a> · <a href="how-to-play/">How to play (full guide)</a> · <a href="strategy/">Strategy and tips</a> · <a href="indoor-games/">Indoor games for 4 people</a> · <a href="school-games/">Paper games for school</a> · <a href="articles/">Game ideas: at home, with friends, at school, for 2 or 4 people</a> · <a href="about/">About</a> · <a href="contact/">Contact</a> · <a href="privacy/">Privacy</a> · <a href="terms/">Terms</a> · <a href="disclaimer/">Disclaimer</a></p>
    <p>🌍 ${langLinks('')}</p>
  </section>
  <!-- /seo:body -->`;
let index = readFileSync(join(ROOT, 'index.html'), 'utf8');
index = index.replace(/<!-- seo:head -->[\s\S]*?<!-- \/seo:head -->/, head).replace(/<!-- seo:body -->[\s\S]*?<!-- \/seo:body -->/, body);
index = index.replace(/<!-- analytics -->[\s\S]*?<!-- \/analytics -->/, ANALYTICS);
writeFileSync(join(ROOT, 'index.html'), index);

// the error page has no content of its own, so it carries no ad code (AdSense: no ads on screens without content)
const notFound = readFileSync(join(ROOT, '404.html'), 'utf8').replace(/<!-- analytics -->[\s\S]*?<!-- \/analytics -->/, ANALYTICS.replace(/<script[^>]*adsbygoogle\.js[^>]*><\/script>\n?/, ''));
// the page games are played on gets analytics but no ad code: no ad can ever land on a board or its buttons
const playApp = join(ROOT, 'play', 'index.html');
if (existsSync(playApp)) writeFileSync(playApp, readFileSync(playApp, 'utf8').replace(/<!-- analytics -->[\s\S]*?<!-- \/analytics -->/, ANALYTICS.replace(ADSENSE_TAG, '')));
writeFileSync(join(ROOT, '404.html'), notFound);

console.log(`SEO built for ${SITE}: ${COUNTRY_ORDER.length} game pages, hub, sitemap (${urls.length} urls), robots, manifest, index.html`);
