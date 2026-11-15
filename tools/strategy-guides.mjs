/**
 * Strategy guides, one page per game: /strategy/<game>/ (English). Original advice written for players,
 * with the reasoning behind each tip, so the page is worth reading for its own sake. Built by
 * build-seo.mjs; the URLs it returns go into the sitemap, and the strategy hub links to every guide.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const GUIDES = {
  ludo: {
    name: 'Ludo',
    title: 'Ludo Strategy: 12 Tips to Win More Games',
    h1: 'Ludo strategy: how to win more often',
    desc: 'Ludo strategy that works: when to bring tokens out, how to stay safe, when to chase a capture, and how to finish first. Tips for Normal and Score mode.',
    intro: [
      'Ludo looks like a game of pure luck: you roll, you move. But watch two players with the same rolls and the better one finishes first almost every time. The dice decide how far you can go; you decide which token goes there, and that choice, made forty or fifty times a game, is where Ludo is won.',
      'These tips start with the habits that matter most and end with the finer points. They work on a cardboard board at home and in ChitPlay, in Normal mode (first to bring all four tokens home) and in Score mode (most points when the ten-minute clock runs out).',
    ],
    sections: [
      ['1. Get two tokens out early', 'One token on the track gives you no choice: every roll has to move it, even into danger. With two out, you can always pick the safer move. Use your first sixes to bring tokens out until you have two in play; after that, a six is often better spent moving a token that is already running.'],
      ['2. Count the squares behind you', 'A rival token one to six squares behind you can capture you with a single roll. Before every move, look behind the square you are about to land on. One token behind you means about a one-in-six chance of being caught next turn; two or three tokens behind you and it becomes likely. Land in front of an empty stretch of track whenever you can.'],
      ['3. Use the safe squares', 'Start squares and the star squares cannot be captured. A token parked on a star is a token that cannot be sent home. When a rival is close behind, stepping onto a star is often worth more than racing ahead.'],
      ['4. Chase captures that are close, not far', 'A capture sends a rival token all the way back and gives you another roll, so it is worth a lot. But a token chasing a target six or more squares away is usually just wandering into danger. Go for captures you can make this turn; otherwise, play safe and let the rivals come to you.'],
      ['5. Do not leave a token at home forever', 'A token that never leaves the yard still has to make the whole journey later, when the board is crowded and every square is dangerous. Bring all four out over the course of the game rather than racing one token home and starting again from nothing.'],
      ['6. Keep a token near your start', 'A token sitting just ahead of your start square can punish any rival who walks past it. Players often keep one token in this guard position for a while, especially when two or three rivals have to pass that stretch to get home.'],
      ['7. Move the token in most danger first', 'When no move captures and no move reaches home, ask which of your tokens is most likely to be hit next turn, and move that one out of reach or onto a star. Moving the safest token is the most common mistake in Ludo.'],
      ['8. The home column is safe: use it as a bank', 'Once a token turns into its home column nobody can touch it. Tokens there are banked progress. Late in the game, it can be smart to stop a token just inside the column and use your rolls on others, then bring it in with the exact number later.'],
      ['9. Plan for exact rolls at the end', 'Reaching home needs the exact number. A token three squares from home wastes every roll that is not a three. Try to keep your last tokens at different distances from home, so more numbers are useful to you.'],
      ['10. Watch the leader', 'In a four-player game, the player closest to finishing is everyone’s problem. If a capture is available on the leader and on someone far behind, take the leader. Slowing the leader down is often worth more than a few squares of your own.'],
      ['11. Score mode: points over speed', 'In Score mode every square, every capture (+20) and every token home (+30) scores, and the game ends when the clock runs out. Captures are worth far more than they are in Normal mode, so take every safe one. Near the end of the clock, a capture or a token reaching home can swing the result; long safe walks matter less.'],
      ['12. With friends: move in time', 'In ChitPlay, playing with people online or in a Play with Friends party, each move has five seconds. If the time runs out the computer moves for you and one of your three lifelines is gone; miss three turns and you are counted as offline and out of the game. Decide quickly: the safest-move habit above makes fast decisions easy.'],
    ],
    faq: [
      ['Is Ludo just luck?', 'The rolls are luck, but which token to move is a real decision made dozens of times a game. Good players lose some games to bad rolls but win far more often over many games.'],
      ['Should I always use a six to bring a token out?', 'Early on, yes, until you have two tokens in play. Later, a six can be better used to escape a threat, make a capture or reach home, since it also gives you another roll.'],
      ['What are the safe squares in Ludo?', 'Each colour’s start square and the star squares. Tokens on them cannot be captured.'],
    ],
  },
  'call-break': {
    name: 'Call Break',
    title: 'Call Break Strategy: How to Bid and Win Tricks',
    h1: 'Call Break strategy: bidding and playing to win',
    desc: 'Call Break tips that win: how to count sure tricks for your bid, when to trump, how to lead, and how to stop the others reaching their call.',
    intro: [
      'Call Break is won at the bid. Every hand you call how many tricks you will take; make your call and you score it, fall short and you lose it. Taking extra tricks barely helps. So the whole game is about reading your hand honestly, then playing to land exactly on (or just over) your call while making the others miss theirs.',
      'Spades are always trumps, everyone must follow the suit that was led and beat the best card if they can, and a player with none of that suit must trump. These tips assume those standard rules, which are the ones ChitPlay uses.',
    ],
    sections: [
      ['Count your sure tricks', 'Start with the cards that win on their own: the ace of spades always wins; an ace in another suit usually wins the first time that suit is led; a king with the ace already gone, or a king guarded by another card of its suit, often wins too. Count those first. That number is the base of your bid.'],
      ['Add for spades, carefully', 'Spades win tricks in two ways: high spades win spade tricks, and any spade can win a trick in a suit you have run out of. Five or more spades usually earn one or two extra tricks this way. Three small spades earn far less than they seem to, because others will have higher ones.'],
      ['Short suits are worth tricks', 'If you hold no clubs, the first time clubs are led you can trump. A void (no cards of a suit) or a singleton (one card) in a side suit, together with a few spades, is worth about a trick. Count it only if you have spades to use.'],
      ['Bid low rather than high', 'Missing your call costs its full value; going over gains very little. When you are unsure between two numbers, choose the lower one. Most beginners lose games by bidding hopefully, not by playing badly.'],
      ['Lead from strength, not from aces alone', 'Leading an ace wins a trick but tells everyone you no longer hold it. Leading a suit where you have a long run lets your later cards win as the others run out. Save your lone aces to win when someone else leads that suit.'],
      ['Trump when it matters', 'When you can win with a small spade, do it on tricks that also hold high cards from others: you stop them reaching their call. Do not waste a high spade on a trick a low one would win.'],
      ['Count the spades as they fall', 'There are thirteen spades. Keep a rough count of how many have been played and which high ones are gone. When only your spades are left, every one of them is a sure trick.'],
      ['Once your call is made, defend', 'After you reach your bid, play to stop the others. Win tricks that someone needs, throw your lowest cards when you cannot win, and force the player with the highest call to use their trumps early.'],
    ],
    faq: [
      ['How many tricks should I bid in Call Break?', 'Count aces, protected kings and the tricks your spades and short suits can win. Bid that number, and choose the lower number when in doubt.'],
      ['What happens if I take more tricks than I bid?', 'In most scoring, each extra trick is worth only a tenth of a point. Missing your bid costs its full value, so making it matters far more than going over.'],
      ['Do I have to trump if I cannot follow suit?', 'Yes. In ChitPlay’s rules, with no card of the suit led you must play a spade if you have one, and a higher spade than any already played if you can.'],
    ],
  },
  carrom: {
    name: 'Carrom',
    title: 'Carrom Tips: How to Aim, Pocket and Cover the Queen',
    h1: 'Carrom tips: aiming, cuts, rebounds and the queen',
    desc: 'Carrom tips for beginners and club players: how to aim straight shots and cuts, use the board edge, plan your next shot and cover the queen.',
    intro: [
      'Carrom rewards a steady hand, but it rewards a plan even more. Good players do not just pocket a coin; they leave the next one ready, keep the opponent’s coins blocked and take the queen at the right moment.',
      'These tips work on a wooden board and in ChitPlay’s 3D carrom, where you aim the striker and choose the power before each shot.',
    ],
    sections: [
      ['Aim through the coin to the pocket', 'Imagine a straight line from the pocket through the coin you want. The striker has to hit the coin on the far side of that line, exactly where the line leaves the coin. Aim the centre of the striker at that point, not at the centre of the coin.'],
      ['Start with straight shots', 'A coin sitting in line between your baseline and a pocket is the easiest shot on the board. Take those first. Every coin you pocket gives you another turn, so easy shots chain into a run.'],
      ['Cuts: hit thinner for a sharper angle', 'To send a coin off at an angle, hit it on its side. The thinner the contact, the sharper the angle and the less power the coin takes. Cuts need more practice than straight shots, so play them with gentle power to stay in control.'],
      ['Use the edge for coins behind you', 'Coins between you and your own baseline can be reached with a rebound: bounce the striker off the board edge first. Aim at the mirror image of the coin across the edge.'],
      ['Soft power keeps the board tidy', 'A hard shot scatters coins everywhere, often leaving easy shots for the opponent. Use just enough power to reach the pocket. Your striker also stays on the board instead of following the coin in: sinking the striker is a foul that brings back one of your coins and ends your turn.'],
      ['Think one shot ahead', 'Before you shoot, ask where the striker will end up and what it will leave. A shot that pockets a coin and leaves your next coin in line is worth more than a flashy shot that leaves nothing.'],
      ['Cover the queen with a plan', 'The queen counts only if you pocket one of your own coins on the same shot or the next one (covering). Take the queen when one of your coins is ready to follow it, ideally near a pocket. Taking it with nothing ready to cover just puts it back on the board.'],
      ['Leave the last coins hard to reach', 'When you cannot make a shot, play a soft one that pushes the opponent’s coins against the edge or behind your own. A blocked board is hard to clear.'],
    ],
    faq: [
      ['How do you cover the queen in carrom?', 'Pocket one of your own coins on the same shot as the queen or on the very next one. If you miss the cover, the queen goes back to the centre.'],
      ['What is the easiest way to improve at carrom?', 'Practise straight shots with soft power, then cuts. Most points are lost to over-hit shots, not to bad aim.'],
      ['Can I play carrom online with a friend?', 'Yes. ChitPlay carrom plays free in the browser against the computer, online or with a friend on their own phone.'],
    ],
  },
  chess: {
    name: 'Chess',
    title: 'Chess Tips for Beginners: 10 Habits That Win Games',
    h1: 'Chess tips for beginners: ten habits that win games',
    desc: 'Chess tips for beginners that actually change results: develop pieces, castle early, check every move for hanging pieces, and finish with simple checkmates.',
    intro: [
      'Most chess games between beginners are not decided by deep plans. They are decided by pieces left unprotected and simple tactics missed. Fix those and you will beat players who know far more openings than you.',
      'These ten habits cover the opening, the middle game and the end. They are the same whether you play a friend or ChitPlay’s computer at your level.',
    ],
    sections: [
      ['1. Before every move, look at what your opponent just did', 'Ask: what does that move attack? What does it threaten next? Many games are lost by answering a move without noticing it was a threat.'],
      ['2. Before every move, check for loose pieces', 'Look at each of your pieces: is it attacked, and is it defended? A piece attacked more times than it is defended will be lost. Do the same check on your opponent’s pieces: a loose piece there is a free win.'],
      ['3. Control the centre', 'Pawns and pieces in the middle of the board reach more squares. Moves like e4 and d4 (or e5 and d5) give your pieces room to come out.'],
      ['4. Develop knights and bishops early', 'Bring out a different piece with each of your first moves. Moving the same piece twice in the opening, or bringing the queen out early, gives your opponent time to develop with tempo.'],
      ['5. Castle in the first ten moves', 'Castling tucks the king away and connects the rooks. A king left in the centre is the target of many quick attacks.'],
      ['6. Trade when you are ahead', 'If you have more material, exchange pieces. The fewer pieces left, the bigger your advantage counts. When behind, avoid trades and look for tactics.'],
      ['7. Look for forks, pins and skewers', 'A fork attacks two things at once; a pin stops a piece moving because something more valuable stands behind it; a skewer is a pin in reverse. Knights are the best forking pieces. Check for these every move, for you and against you.'],
      ['8. Rooks belong on open files', 'A file with no pawns on it lets a rook reach deep into the enemy position. Put your rooks there, and double them if you can.'],
      ['9. Learn two checkmates', 'King and queen against king, and king and rook against king. Push the lone king to the edge, keep your king close, and avoid stalemate by always leaving it a legal move until the mate.'],
      ['10. Use the clock, do not race it', 'With a clock, spend your time on the moves that change the game: captures, checks, threats. Play quick, natural moves when nothing is happening. In ChitPlay you can also play with no clock while you learn.'],
    ],
    faq: [
      ['What is the best opening for beginners?', 'Any opening that controls the centre, develops knights and bishops quickly and castles early. The Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4) is a good first choice.'],
      ['How do I stop losing pieces?', 'Before each move, check every piece of yours: is it attacked, and is it defended enough? This one habit stops most blunders.'],
      ['How do I get better at chess quickly?', 'Play slower games, check for loose pieces every move, learn the basic checkmates and look at your lost games to find the move where things went wrong.'],
    ],
  },
};

/** Writes every guide page and returns their URLs (for the sitemap). */
export function writeStrategyGuides({ ROOT, SITE, TODAY, ANALYTICS, esc, json, iconLinks, logoLink, footerLinks, bannerSlot, adSlot, imageFor, DEVELOPER_LD }) {
  const urls = [];
  const list = Object.entries(GUIDES);
  for (const [slug, g] of list) {
    const url = `${SITE}/strategy/${slug}/`;
    const title = `${g.title} | ChitPlay`;
    const img = `${SITE}/assets/${imageFor(slug, false, 'jpg')}`;
    const ld = [
      { '@context': 'https://schema.org', '@type': 'Article', headline: g.h1, description: g.desc, url, image: [img], datePublished: '2026-11-15', dateModified: TODAY, author: DEVELOPER_LD, publisher: { '@type': 'Organization', name: 'ChitPlay', logo: { '@type': 'ImageObject', url: `${SITE}/assets/icon-512.png` } }, mainEntityOfPage: url, inLanguage: 'en' },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ChitPlay', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: 'Strategy', item: `${SITE}/strategy/` }, { '@type': 'ListItem', position: 3, name: g.name, item: url }] },
    ];
    const others = list.filter(([s]) => s !== slug).map(([s, o]) => `<a href="../${s}/">${esc(o.name)} strategy</a>`).join(' · ');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ANALYTICS}
<title>${esc(title)}</title>
<meta name="description" content="${esc(g.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ChitPlay">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(g.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
${iconLinks('../../')}
<script type="application/ld+json">${json(ld)}</script>
<style>body{margin:0;background:#140b07;color:#f6ead2;font:17px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}main{max-width:760px;margin:0 auto;padding:24px 16px 48px}a{color:#ffd27a}h1{color:#ffd27a;font-size:clamp(28px,6vw,40px);line-height:1.2}h2{font-size:21px;margin-top:28px}.btn{display:inline-block;padding:14px 22px;border-radius:12px;font-weight:700;text-decoration:none;background:linear-gradient(180deg,#ff9a3d,#e0572a);color:#fff8e6}figure{margin:20px 0}figure img{display:block;width:100%;height:auto;border-radius:12px}figcaption{color:#d4c2a0;font-size:13px}details{background:#24140c;border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}nav{font-size:14px;color:#d4c2a0}footer{margin-top:40px;font-size:13px;color:#d4c2a0}</style>
</head>
<body>
<main>
${logoLink('../../')}
<nav aria-label="Breadcrumb"><a href="../../">ChitPlay</a> › <a href="../">Strategy</a> › ${esc(g.name)}</nav>
<h1>${esc(g.h1)}</h1>
<p><small>Updated ${TODAY}</small></p>
<figure><img src="../../assets/${imageFor(slug)}" alt="${esc(g.name)} in ChitPlay" width="1200" height="630" loading="eager" decoding="async"><figcaption>${esc(g.name)}, as played in ChitPlay.</figcaption></figure>
${g.intro.map(p => `<p>${esc(p)}</p>`).join('\n')}
<p><a class="btn" href="../../play/?game=${slug}&amp;mode=play">▶ Play ${esc(g.name)} free</a> &nbsp; <a href="../../games/${slug}/">Full ${esc(g.name)} rules</a></p>
${g.sections.map(([h, p], i) => `<h2>${esc(h)}</h2>\n<p>${esc(p)}</p>${i === 3 ? `\n${adSlot('guide')}` : ''}`).join('\n')}
<h2>Questions</h2>
${g.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
<h2>More strategy guides</h2>
<p>${others} · <a href="../">Chit game strategy</a></p>
${bannerSlot()}
<footer>${footerLinks('../../')} · © ${TODAY.slice(0, 4)} CHITPLAY</footer>
</main>
</body>
</html>
`;
    mkdirSync(join(ROOT, 'strategy', slug), { recursive: true });
    writeFileSync(join(ROOT, 'strategy', slug, 'index.html'), html);
    urls.push(url);
  }
  return urls;
}
