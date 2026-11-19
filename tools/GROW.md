# Growing ChitPlay's reach

The site's own SEO is done: every game page has its own title, description, schema and FAQ, and the sitemap lists 990 pages in 17 languages. Bing, Yandex, Naver and the other IndexNow search engines are told about every page with `node tools/indexnow.mjs` (run it after each big push).

What is left can only be done from your own accounts. Do the steps in this order.

## 1. Google Search Console (once, 10 minutes)

1. Open https://search.google.com/search-console and add the **Domain** `chitplay.com`. Verify it with the DNS TXT record at your domain provider.
2. Go to **Sitemaps** and submit `https://www.chitplay.com/sitemap.xml`.
3. In **URL inspection**, paste these one by one and press **Request indexing** (about 10 a day are allowed):
   - https://www.chitplay.com/
   - https://www.chitplay.com/games/
   - https://www.chitplay.com/games/raja-mantri-chor-sipahi/
   - https://www.chitplay.com/games/raja-mantri-chor-police/
   - https://www.chitplay.com/games/call-break/
   - https://www.chitplay.com/games/pen-fight/
   - https://www.chitplay.com/games/carrom/
   - https://www.chitplay.com/games/ludo/
   - https://www.chitplay.com/hinglish/
   - https://www.chitplay.com/hi/
4. After 2 weeks, open **Pages** and **Performance** and share screenshots, to see what Google has indexed and which searches already bring visitors.

## 2. Bing Webmaster Tools (5 minutes)

Open https://www.bing.com/webmasters, choose **Import from Google Search Console**, and it is done. Bing also powers DuckDuckGo, Yahoo and ChatGPT search.

## 3. Search words a new site can win

Big words like "ludo online" belong to sites that are years old. These have little competition, and ChitPlay already has pages for them:

| Search | Page |
|---|---|
| raja mantri chor sipahi online | /games/raja-mantri-chor-sipahi/ |
| chor police game online | /games/raja-rani-chor-police/ |
| call break online free | /games/call-break/ |
| pen fight game online | /games/pen-fight/ |
| carrom online with friends | /games/carrom/ |
| who is the spy game online | /games/who-is-the-spy/ |
| truth or dare online with friends | /games/truth-or-dare/ |
| games for 2 people on one phone | /articles/games-for-2-people/ |

Use these exact words in posts, video titles and descriptions.

## 4. Places to list the site (links Google trusts)

Each listing is a free link back to chitplay.com.

- **itch.io:** create a free "HTML game" page for one game (for example Pen Fight) with screenshots and a big link to chitplay.com.
- **Product Hunt** (producthunt.com): launch "ChitPlay – 47 free browser games, no sign-up".
- **AlternativeTo** (alternativeto.net): add ChitPlay as an alternative to Poki, CrazyGames and Ludo King.
- **Reddit** (rules below).
- **Quora:** answer questions such as "Which websites have free multiplayer games?" or "How to play Raja Mantri Chor Sipahi online?", and link the game page.
- **Your own profiles:** put chitplay.com in the bio of your YouTube, Instagram, Facebook, X and GitHub accounts.

## 5. Ready-to-post texts

### Reddit

Communities: r/WebGames, r/IndieGaming, r/playmygame, r/indiangaming, r/boardgames (only for the board games, on their self-promotion day).

Read each community's rules first. Post once per community, and reply to every comment.

> **Title:** I made a free site with 47 browser games you can play with friends on your phones – no sign-up, no download
>
> Hi! I've been building ChitPlay: Ludo, Chess, Carrom, Call Break, Pen Fight, racing and party games like Who Is the Spy and Werewolf. Host a room, friends scan a QR code and join from their own phones. It also works offline and on one shared phone.
>
> https://www.chitplay.com
>
> I'd love feedback, especially on Pen Fight and Tunnel Race. What game should I add next?

### WhatsApp / Facebook groups (Hinglish)

> Yaaron, bachpan wala **Raja Mantri Chor Sipahi** ab phone par! 😄 Ludo, Carrom, Call Break, Pen Fight bhi, 47 games, bilkul free, koi app download nahi. Room banao, QR scan karo, sab apne phone se khelo 👇
> https://www.chitplay.com

### YouTube Shorts / Instagram Reels

Record 15–30 seconds of the screen (Android: built-in screen recorder) with a loud first second. One game per video.

| Video | Title |
|---|---|
| A Pen Fight match where the last pen falls off | Pen Fight in your browser 🖊️ free, no download #shorts |
| A close Carrom finish | Carrom online with friends, free 🎯 #shorts |
| 4 phones joining one Raja Mantri Chor Sipahi room by QR | Childhood chit game, now online 😂 Raja Mantri Chor Sipahi #shorts |
| Tunnel Race at top speed | Can you beat 1000 in Tunnel Race? 🏎️ #shorts |

Description for every video:

> Play free at https://www.chitplay.com – 47 games, no sign-up, play with friends on your phones.
> #browsergames #freegames #ludo #carrom #rajamantrichorsipahi

Post 3–4 a week. Shorts are the fastest way for a new games site to get visitors.

## 6. Keep going

- Each finished game already offers a picture of the result to share, with "Think you can beat me?" and the game's link. Ask your first players to use it.
- When the Android app is on the Play Store, add its link to the home page and to every post.
- Push changes, then run `node tools/indexnow.mjs` again.
- Real growth for a new domain takes 3–6 months. Keep posting steadily rather than all at once.
