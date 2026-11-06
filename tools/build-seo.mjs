/**
 * Builds the search-engine side of ChitPlay from the game data:
 *   games/<slug>/index.html  — one landing page per game name (rules, roles, FAQ)
 *   games/index.html         — hub of every game name
 *   sitemap.xml, robots.txt, manifest.webmanifest
 *   about, contact, privacy, terms, disclaimer — the pages ad networks look for
 *   CNAME                    — the custom domain for GitHub Pages
 *   index.html, 404.html     — refreshes the <!-- seo:… --> and <!-- analytics --> blocks
 *
 * Usage:  node tools/build-seo.mjs [https://www.chitplay.com]
 * (Run it again whenever a game, name or rule changes.)
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.argv[2] || process.env.SITE_URL || 'https://www.chitplay.com').replace(/\/+$/, '');
const TODAY = new Date().toISOString().slice(0, 10);

// AdSense publisher id: from the command line once, then remembered through ads.txt
const ADS_TXT = join(ROOT, 'ads.txt');
const SAVED_PUB = existsSync(ADS_TXT) ? (readFileSync(ADS_TXT, 'utf8').match(/pub-\d{10,20}/)?.[0] || '') : '';
const PUB = (process.argv[3] || process.env.ADSENSE_PUB || SAVED_PUB).trim();
const HAS_ADS = /^pub-\d{10,20}$/.test(PUB);
const ADSENSE_TAG = HAS_ADS ? `\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${PUB}" crossorigin="anonymous"></script>` : '';

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

const footerLinks = (up) => `<a href="${up}games/">All games</a> · <a href="${up}about/">About</a> · <a href="${up}contact/">Contact</a> · <a href="${up}privacy/">Privacy</a> · <a href="${up}terms/">Terms</a> · <a href="${up}disclaimer/">Disclaimer</a>`;
const logoLink = (up) => `<a href="${up}" style="display:inline-block"><img src="${up}assets/logo.png" alt="CHITPLAY" width="180" height="31" style="display:block"></a>`;
const iconLinks = (up) => `<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="icon" href="${up}assets/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="${up}assets/icon-192.png">`;

const src = readFileSync(join(ROOT, 'src/world/countries.js'), 'utf8');
const C = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const { COUNTRIES, COUNTRY_ORDER, GAME_SLUGS, GAME_AKA, GAME_NAME_EN, ROLE_LATIN, localize } = C;

// the real rules engine, so the worked scoring examples always match the game
const M = await import('data:text/javascript;base64,' + Buffer.from(readFileSync(join(ROOT, 'src/world/match.js'), 'utf8')).toString('base64'));

// "How to play" in the way people search for it locally (Latin letters where that is how people type)
const LOCAL_HOWTO = {
  IN: ['hi-Latn', 'Raja Rani Chor Police kaise khele', 'Chaar log, chaar parchiyan: Raja, Rani, Chor aur Police. Parchiyan mod ke beech me daalo, sab ek-ek uthao aur chupke se dekho. Police bolta hai "Main Police hoon!" aur use Chor pakadna hota hai. Sahi pakda to Police ko 500 milte hain aur Chor ko 0. Galat pakda to Chor ko 500 milte hain aur Police ko 0. Raja ko 1000 aur Rani ko 800 milte hain. Jitne round chaho khelo, sabse zyada points wala jeetta hai.'],
  PK: ['ur-Latn', 'Raja Wazir Chor Sipahi kaise khelein', 'Chaar parchiyan: Raja, Wazir, Chor aur Sipahi. Sab ek-ek parchi uthate hain. Raja apni parchi dikha kar kehta hai "Mera Wazir kaun?" Wazir samne aata hai aur usay baqi do mein se Chor pehchanna hota hai. Sahi pehchana to Wazir ko 800, ghalat hua to Chor ko 800 aur Wazir ko 0. Raja ko 1000 aur Sipahi ko 500 milte hain.'],
  NP: ['ne-Latn', 'Raja Mantri Chor Sipahi kasari khelne', 'Char ota chit: Raja, Mantri, Chor ra Sipahi. Sabai le euta chit tanchhan. Raja le "Mero Mantri ko ho?" bhanchha, ani Mantri le baki dui madhye Chor chinnu parchha. Sahi bhaye Mantri lai 800, galat bhaye Chor lai 800 ra Mantri lai 0. Raja lai 1000 ra Sipahi lai 500.'],
  BD: ['bn-Latn', 'Raja Mantri Chor Police kivabe khelbo', 'Charti chirkut: Raja, Mantri, Chor ar Police. Sobai ekta kore chirkut tule chupi chupi dekhe. Raja bole "Amar Police kothay?", tarpor Police baki duijoner moddhe Chor khuje ber kore. Thik dhorle Police pay 500, bhul hole Chor pay 500 ar Police shunno. Raja pay 1000, Mantri pay 800.'],
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
  const ann = base.rules.announce ? SLOTS.indexOf(base.rules.announce) : -1;
  const wrong = [0, 1, 2].find(s => s !== g && s !== ann);
  return { caught: run(3), missed: run(wrong), guesserSeat: g, wrongSeat: wrong };
}

const LANG = { IN: 'hi', PK: 'ur', NP: 'ne', BD: 'bn', JP: 'ja', KR: 'ko', CN: 'zh', RU: 'ru', US: 'en', UK: 'en-GB', DE: 'de', FR: 'fr', BR: 'pt-BR', MX: 'es-MX' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  const seoName = primary.replace(':', '');
  const title = `CHITPLAY: ${seoName}`;
  const desc = `Play ${primary}${localScript ? ` (${localScript})` : ''}, ${country}'s paper chit game, free online. The ${guesserEn} must catch the ${thiefEn}. Rules and printable chits.`;
  const lh = LOCAL_HOWTO[id];
  const ex = scoringExample(base);
  const kidName = (i) => base.kids[i];
  // the game's own role name in Latin letters (Raja, Wazir…), plus English and local script when they differ
  const roleLabel = (slot, i) => {
    const own = ROLE_LATIN?.[id]?.[i] || en.roles[slot].name;
    const enName = en.roles[slot].name;
    return { own, enName: own.toLowerCase() === enName.toLowerCase() ? null : enName, script: [own, enName].includes(local.roles[slot].name) ? null : local.roles[slot].name };
  };
  const exRows = SLOTS.map((slot, i) => {
    const l = roleLabel(slot, i);
    return `<tr><td>${esc(kidName(i))}</td><td>${esc(base.roles[slot].emoji)} ${esc(l.own)}${l.enName ? ` (${esc(l.enName)})` : ''}</td><td>${ex.caught[i]}</td><td>${ex.missed[i]}</td></tr>`;
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
    base.rules.announce
      ? `The ${en.roles[base.rules.announce].name} reveals first and calls for the ${guesserEn}.`
      : `The ${guesserEn} reveals their chit. Everyone else keeps a straight face.`,
    `The ${guesserEn} studies the faces and accuses one player of being the ${thiefEn}.`,
    `Everyone opens their chit and scores: ${en.ruleText}`,
    'Play 3, 5, 7, 10 or 20 rounds. The highest total wins.',
  ];
  const faq = [
    [`How do you play ${primary}?`, `${steps.join(' ')}`],
    [`Is ${primary} free to play online?`, `Yes. ChitPlay is free, runs in any modern browser on phone or computer, and needs no download or sign-up.`],
    [`How many players does ${primary} need?`, `The classic game needs exactly four players. In ChitPlay you can play with three computer kids, or just watch all four play.`],
    [`What are the roles in ${primary}?`, `${SLOTS.map(s => `${en.roles[s].name} (${local.roles[s].name})`).join(', ')}.`],
    [`What is ${primary} also called?`, `${aka.join(', ')}.`],
    [`Can I play ${primary} on my phone?`, `Yes. ChitPlay works on Android and iPhone browsers. Tap 🔄 to play in landscape, and add it to your home screen to play like an app, even offline.`],
    [`Which languages can I play ${primary} in?`, 'The game and the voices are in English. The kids\' chat bubbles can also be shown in Hinglish, Roman Urdu, Roman Nepali, Roman Bangla, Japanese, Korean, Chinese, Russian, German, French, Portuguese or Spanish, all written in Latin letters.'],
    [`How do you make the chits for ${primary} at home?`, `Tear a page into four slips, write ${SLOTS.map(s => en.roles[s].name).join(', ')} on them with the points, fold them and shuffle. Or print the ready-made chits on this page.`],
    [`How many points does each role get in ${primary}?`, `${SLOTS.filter(s => s !== 'thief').map(s => `${en.roles[s].name} ${base.roles[s].points}`).join(', ')}. The ${thiefEn} gets 0 when caught and ${base.rules.escape ?? base.roles[base.rules.guesser].points} when not caught.`],
    [`Can you cheat in ${primary}?`, `In ChitPlay the ${guesserEn} can press 🤫 Cheat to try to peek at a chit, with a 50/50 chance of seeing it. If it works, one innocent player is cleared. If someone notices, you lose 100 points. Computer players try it too.`],
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
    : base.rules.announce ? `Once the ${en.roles[base.rules.announce].name} is revealed, it's a 50/50 between the last two. Study them closely.`
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
      inLanguage: ['en', LANG[id]], image: `${SITE}/assets/og-image.jpg`,
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
<meta property="og:site_name" content="CHITPLAY">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/og-image.jpg">
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
<nav class="crumbs" aria-label="Breadcrumb"><a href="../../">CHITPLAY</a> › <a href="../">Games</a> › ${esc(primary)}</nav>
<h1>${esc(primary)} — play online in 3D</h1>
<p class="lead" style="margin-top:-4px">${esc(country)}'s chit game${localScript ? ` · <span lang="${LANG[id]}">${esc(localScript)}</span>` : ''}</p>
<p class="lead">The 4-player paper chit game <strong>${esc(primary)}</strong>${sameName ? '' : ` (${esc(en.game)})`}, free in your browser. Four kids, four folded chits: the ${esc(guesserEn)} has to catch the ${esc(thiefEn)}.</p>
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
<p>One round of ${esc(primary)}. ${esc(kidName(ex.guesserSeat))} is the ${esc(guesserEn)}. What everyone scores if the ${esc(thiefEn)} is caught, and if ${esc(kidName(ex.guesserSeat))} accuses ${esc(kidName(ex.wrongSeat))} instead:</p>
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

function hubPage() {
  const url = `${SITE}/games/`;
  const items = COUNTRY_ORDER.map(id => {
    const en = localize(COUNTRIES[id], 'en');
    return `<li><a href="${GAME_SLUGS[id]}/"><strong>${esc(GAME_NAME_EN[id])}</strong></a> (${esc(COUNTRIES[id].name)}) — ${esc(GAME_AKA[id].filter(a => a !== GAME_NAME_EN[id]).slice(0, 3).join(', '))}<br><small>${esc(en.ruleText)}</small></li>`;
  }).join('');
  const ld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'Chit games from around the world',
    itemListElement: COUNTRY_ORDER.map((id, i) => ({ '@type': 'ListItem', position: i + 1, name: GAME_NAME_EN[id], url: `${SITE}/games/${GAME_SLUGS[id]}/` })),
  };
  const table = COUNTRY_ORDER.map(id => {
    const b = COUNTRIES[id]; const en = localize(b, 'en');
    return `<tr><td><a href="${GAME_SLUGS[id]}/">${esc(GAME_NAME_EN[id])}</a></td><td>${esc(b.name)}</td><td>${esc(SLOTS.map(s => en.roles[s].name).join(' · '))}</td><td>${esc(en.roles[b.rules.guesser].name)}</td></tr>`;
  }).join('');
  const hubFaq = [
    ['Are Raja Rani Chor Police, Raja Mantri Chor Sipahi and King Queen Thief Police the same game?', 'Yes. They are names for the same four-player paper chit game. The role names, the points and one small rule change from place to place.'],
    ['Which chit game should I play?', 'Pick the name you grew up with. ChitPlay opens the game of your own country first, and you can swipe to any other.'],
    ['Can I play a chit game online alone?', 'Yes. In ChitPlay three computer kids play with you, or you can just watch all four play.'],
  ];
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: hubFaq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const title = 'CHITPLAY: All Chit Games';
  const desc = 'Every version of the paper chit game in one place: Raja Rani Chor Police, Raja Mantri Chor Sipahi, Mafia, Cops and Robbers and more. Rules and free 3D play.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CHITPLAY">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og-image.jpg">
${iconLinks('../')}
<script type="application/ld+json">${json([ld, faqLd])}</script>
<style>body{margin:0;background:#140b07;color:#f6ead2;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}main{max-width:820px;margin:0 auto;padding:20px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(26px,6vw,38px);line-height:1.2}li{margin:14px 0}small{color:#d4c2a0}.wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;background:#24140c;font-size:14px}td,th{padding:8px 10px;border-bottom:1px solid #3a2414;text-align:left}details{background:#24140c;border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}.btn{display:inline-block;padding:14px 22px;border-radius:12px;font-weight:700;text-decoration:none;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6}</style>
</head>
<body>
<main>
${logoLink('../')}
<h1>Chit games from around the world</h1>
<p>One game, many names. Pick yours and play it free in 3D.</p>
<p><a class="btn" href="../">▶ Play now</a></p>
<ol>${items}</ol>
<h2>Roles in every version</h2>
<div class="wrap"><table><thead><tr><th>Game</th><th>Country</th><th>Roles</th><th>Who guesses</th></tr></thead><tbody>${table}</tbody></table></div>
<h2>Questions</h2>
${hubFaq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<footer style="margin-top:40px;font-size:13px;color:#d4c2a0">${footerLinks('../')} · © ${TODAY.slice(0, 4)} ChitPlay</footer>
</main>
</body>
</html>
`;
}

// ── write the pages ─────────────────────────────────────────
for (const id of COUNTRY_ORDER) {
  const dir = join(ROOT, 'games', GAME_SLUGS[id]);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), pageFor(id));
}
writeFileSync(join(ROOT, 'games', 'index.html'), hubPage());

// ── About / Privacy / Terms (what ad networks look for before approving a site) ──
function infoPage(slug, title, desc, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>CHITPLAY: ${esc(title.replace(/ ChitPlay$/, ''))}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/${slug}/">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CHITPLAY">
<meta property="og:title" content="CHITPLAY: ${esc(title.replace(/ ChitPlay$/, ''))}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/${slug}/">
<meta property="og:image" content="${SITE}/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
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
  about: ['About ChitPlay', 'ChitPlay is a free 3D paper chit game for your browser: Raja Rani Chor Police, Mafia, Cops and Robbers and more. Made by developer Mr Avinash.', `
<p>ChitPlay is a free, 3D version of the four-player paper chit game. Four kids sit around a mat, draw folded chits, bluff, and the investigator has to catch the thief. You can play with three computer kids, play with friends on nearby phones, or just watch.</p>
<h2>Who makes ChitPlay</h2>
<p>ChitPlay is designed and developed by <strong>${DEVELOPER}</strong> as an independent project, to keep a game many of us played on paper as children alive for anyone with a browser.</p>
<p>Questions, ideas, bug reports or business enquiries: ${MAILTO}. See the <a href="../contact/">contact page</a> for more.</p>
<h2>Games</h2>
<p>The same game is played under many names. ChitPlay has fourteen of them, each with its own roles, rules and room, and every one has a page with its full rules, scoring and printable chits:</p>
<ul>${gameList}</ul>
<h2>How it's made</h2>
<p>The game runs on your device: the 3D room, the kids, their voices (your browser's built-in speech) and your saved match. There are no accounts and no downloads, and it works on phones, tablets and computers, even offline once it's been opened.</p>
<h2>How ChitPlay stays free</h2>
<p>ChitPlay is free to play. We use Google Analytics to understand which games people enjoy, and the site may show advertising to cover its costs. Our <a href="../privacy/">Privacy Policy</a> explains both.</p>`],
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
<p>ChitPlay is run by one independent developer, so a reply may take a few days.</p>`],
  privacy: ['Privacy Policy', 'How ChitPlay handles your data: no accounts, game data stored on your device, Google Analytics, cookies, advertising and your choices.', `
<p>ChitPlay (www.chitplay.com) is a game that runs in your browser, developed by ${DEVELOPER}. This page explains what data it uses and the choices you have. Questions: ${MAILTO}.</p>
<h2>Saved on your device</h2>
<p>ChitPlay saves your player name and settings (sound, voice, chat language, number of rounds), your win/match counts and your current match in your browser's local storage, so that a refresh doesn't lose your game. We don't receive this data, and you can delete it at any time by clearing your browser's site data. The game also picks a starting game from your device's timezone and language settings; that check happens on your device.</p>
<h2>What we don't ask for</h2>
<p>There are no accounts or sign-ups, and we don't ask for your email address or phone number. The player name you choose stays on your device, unless you use Nearby Play. If you email us, we use your message and address only to reply.</p>
<h2>Google Analytics</h2>
<p>We use Google Analytics 4, loaded through Google Tag Manager, to understand how the site is used, such as which pages and games are visited. It uses cookies and collects information such as pages viewed, approximate location, device and browser type, and the site that referred you. We use this information in aggregate to improve ChitPlay. You can install the <a href="https://tools.google.com/dlpage/gaoptout" rel="nofollow noopener">Google Analytics opt-out browser add-on</a> to stop it.</p>
<h2>Advertising and cookies</h2>
<p>ChitPlay may show advertising to keep the game free. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to users based on their visits to this site and/or other sites on the Internet. You can opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" rel="nofollow noopener">Google Ads Settings</a> or <a href="https://www.aboutads.info/choices/" rel="nofollow noopener">www.aboutads.info</a>.</p>
<p>Read <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener">how Google uses information from sites that use its services</a>. A cookie is a small file a website stores in your browser; you can block or delete cookies in your browser settings, and the game will still work.</p>
<h2>Visitors in the EEA, UK and Switzerland</h2>
<p>For visitors from these regions, analytics and advertising cookies are off by default and are used only if you give consent. You may have rights under local law to access, correct or delete personal data, or to object to its use. Email us to make a request; we hold almost nothing that identifies you, and data held by Google can be managed through the links above.</p>
<h2>Nearby Play</h2>
<p>Nearby Play is optional and only connects when you host or join a game. To find each other, the phones contact the free PeerJS connection service (peerjs.com), which sees your IP address and a temporary game code. The game then runs directly between the phones; if a direct connection isn't possible, its messages may pass through PeerJS's relay server. The name you type is shown to the other players in that game. ChitPlay doesn't store any of this.</p>
<h2>Voices</h2>
<p>The kids' voices use your browser's built-in speech synthesis. Depending on your browser and operating system, text may be processed by the speech service built into it.</p>
<h2>Children</h2>
<p>ChitPlay is a general-audience game and is not directed at children under 13. We don't knowingly collect personal information from children. If you are a parent or guardian and believe a child has sent us personal information, email ${MAILTO} and we will delete it.</p>
<h2>Changes</h2>
<p>If this policy changes, we'll update this page and the date at the bottom.</p>`],
  terms: ['Terms of Use', 'The terms for playing ChitPlay, a free browser game: fair use, intellectual property, advertising, disclaimers and how to contact us.', `
<p>By playing ChitPlay (www.chitplay.com), developed by ${DEVELOPER}, you agree to these terms. If you don't agree, please don't use the site.</p>
<h2>The game</h2>
<p>ChitPlay is provided free of charge, as is, for entertainment. We try to keep it working well on every device but can't guarantee it will always be available or error-free.</p>
<h2>Points have no value</h2>
<p>Points in ChitPlay are only for fun. They have no cash value and can't be exchanged for anything. ChitPlay involves no real-money play or gambling.</p>
<h2>Fair use</h2>
<p>You may play and share links to ChitPlay freely. Please don't copy the site, its artwork or its code to republish it as your own, try to disrupt the service, or tamper with or generate invalid clicks on any ads.</p>
<h2>Nearby Play</h2>
<p>The name you enter is shown to the people in your game. Please don't use offensive names or names that aren't yours to use.</p>
<h2>Content</h2>
<p>Game names such as Raja Rani Chor Police, Mafia or Cops and Robbers are traditional names for a public-domain game. The kids, the room and the dialogue in ChitPlay are original. If you believe something here infringes your rights, please <a href="../contact/">contact us</a>.</p>
<h2>Advertising and links</h2>
<p>ChitPlay may display ads from third parties. We are not responsible for the content of external websites reached through ads or links.</p>
<h2>Liability</h2>
<p>To the extent the law allows, ChitPlay and its developer are not liable for any loss arising from using, or being unable to use, the site.</p>
<h2>Changes and contact</h2>
<p>We may update these terms; the date at the bottom shows the latest version. Questions: ${MAILTO}.</p>`],
  disclaimer: ['Disclaimer', 'ChitPlay is a free game for entertainment only: no real money, points have no value, and external links and ads are the responsibility of third parties.', `
<p>ChitPlay is a free browser game, provided for entertainment.</p>
<h2>Entertainment only</h2>
<p>ChitPlay involves no real money, betting or prizes. Points have no value outside the game. Roles such as Thief, Mafia or Police are make-believe parts of a traditional party game and don't promote or depict real crime.</p>
<h2>Rules and accuracy</h2>
<p>This game has many regional versions and its rules vary from place to place. Our pages describe how each version plays in ChitPlay, and they may differ from how you learned it. We try to be accurate but make no guarantee.</p>
<h2>External links and advertising</h2>
<p>This site may link to other websites and show ads from third parties. We don't control them and aren't responsible for their content, products or privacy practices.</p>
<h2>Trademarks</h2>
<p>Any product or company names mentioned belong to their owners. ChitPlay isn't affiliated with or endorsed by them.</p>
<h2>Contact</h2>
<p>Something wrong on this site? Email ${MAILTO}.</p>`],
};
for (const [slug, [title, desc, body]] of Object.entries(INFO)) {
  mkdirSync(join(ROOT, slug), { recursive: true });
  writeFileSync(join(ROOT, slug, 'index.html'), infoPage(slug, title, desc, body));
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

const urls = [`${SITE}/`, `${SITE}/games/`, ...COUNTRY_ORDER.map(id => `${SITE}/games/${GAME_SLUGS[id]}/`), ...Object.keys(INFO).map(slug => `${SITE}/${slug}/`)];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u, i) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>${i === 0 ? '1.0' : i === 1 ? '0.9' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /archive/\nDisallow: /tests/\nDisallow: /tools/\n\n# Google AdSense crawler\nUser-agent: Mediapartners-Google\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(ROOT, 'manifest.webmanifest'), JSON.stringify({
  name: 'CHITPLAY',
  short_name: 'CHITPLAY',
  description: 'The paper chit game in 3D: Raja Rani Chor Police, Raja Mantri Chor Sipahi, Mafia, Cops and Robbers and more.',
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
    { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: 'assets/icon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
}, null, 2));

// ── refresh the SEO blocks inside index.html ────────────────
const mainNames = [...new Set(COUNTRY_ORDER.flatMap(id => [GAME_NAME_EN[id], ...GAME_AKA[id].slice(0, 2)]))];
const homeTitle = 'CHITPLAY: Raja Rani Chor Police & Chit Games Online';
const homeDesc = 'The paper chit game from your school days, free online: Raja Rani Chor Police, Raja Mantri Chor Sipahi, Mafia, Cops and Robbers and more. No download needed.';
const homeLd = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'CHITPLAY', alternateName: ['ChitPlay', 'chitplay.com'], url: `${SITE}/`, inLanguage: 'en' },
  {
    '@context': 'https://schema.org', '@type': 'Organization', name: 'CHITPLAY', url: `${SITE}/`, logo: `${SITE}/assets/icon-512.png`,
    email: CONTACT_EMAIL, founder: DEVELOPER_LD,
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: CONTACT_EMAIL, url: `${SITE}/contact/` },
  },
  {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: 'CHITPLAY',
    alternateName: mainNames, url: `${SITE}/`, description: homeDesc, author: DEVELOPER_LD,
    genre: ['Party game', 'Social deduction game', 'Paper chit game'], gamePlatform: 'Web browser',
    applicationCategory: 'Game', operatingSystem: 'Any', image: `${SITE}/assets/og-image.jpg`,
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
  <meta property="og:site_name" content="CHITPLAY" />
  <meta property="og:title" content="${esc(homeTitle)}" />
  <meta property="og:description" content="${esc(homeDesc)}" />
  <meta property="og:url" content="${SITE}/" />
  <meta property="og:image" content="${SITE}/assets/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(homeTitle)}" />
  <meta name="twitter:description" content="${esc(homeDesc)}" />
  <meta name="twitter:image" content="${SITE}/assets/og-image.jpg" />
  <script type="application/ld+json">${json(homeLd)}</script>
  <!-- /seo:head -->`;
const body = `<!-- seo:body -->
  <section class="seo-intro" aria-label="About ChitPlay">
    <h1>Raja Rani Chor Police — the chit game, in 3D</h1>
    <p>ChitPlay is the 4-player paper chit game, free in your browser. Draw a folded chit, keep a straight face, and let the Police (or Sipahi, Wazir, Sheriff…) catch the Thief.</p>
    <h2>Every version of the game</h2>
    <ul>
${COUNTRY_ORDER.map(id => `      <li><a href="games/${GAME_SLUGS[id]}/">${esc(GAME_NAME_EN[id])}</a> (${esc(COUNTRIES[id].name)}) — ${esc(GAME_AKA[id].filter(a => a !== GAME_NAME_EN[id]).slice(0, 2).join(', '))}</li>`).join('\n')}
    </ul>
    <p><a href="games/">All chit games and rules</a> · <a href="about/">About</a> · <a href="contact/">Contact</a> · <a href="privacy/">Privacy</a> · <a href="terms/">Terms</a> · <a href="disclaimer/">Disclaimer</a></p>
  </section>
  <!-- /seo:body -->`;
let index = readFileSync(join(ROOT, 'index.html'), 'utf8');
index = index.replace(/<!-- seo:head -->[\s\S]*?<!-- \/seo:head -->/, head).replace(/<!-- seo:body -->[\s\S]*?<!-- \/seo:body -->/, body);
index = index.replace(/<!-- analytics -->[\s\S]*?<!-- \/analytics -->/, ANALYTICS);
writeFileSync(join(ROOT, 'index.html'), index);

const notFound = readFileSync(join(ROOT, '404.html'), 'utf8').replace(/<!-- analytics -->[\s\S]*?<!-- \/analytics -->/, ANALYTICS);
writeFileSync(join(ROOT, '404.html'), notFound);

console.log(`SEO built for ${SITE}: ${COUNTRY_ORDER.length} game pages, hub, sitemap (${urls.length} urls), robots, manifest, index.html`);
