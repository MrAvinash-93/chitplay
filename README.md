# CHITPLAY

**The childhood chit game, from around the world.**

A 3D take on the classic four-player paper-chit game, for every age. Four characters (children, teenagers, adults or elders) sit on the floor of an old-style room. They toss the chits, peek at them, bluff, investigate and react, talking in speech bubbles while the camera follows the conversation. You can take a seat, invite friends on their own phones, or just watch.

## Profile, rank and characters

- **👤 Profile:** name (letters only), gender, 24 ready-made characters or your own (age, hair, skin, eyes, clothes, glasses, facial hair, headwear), and the graphics level (Auto, Low, Medium, High, 4K). A random name that fits your country is picked on your first visit.
- **Score:** solo and Nearby points are kept apart. Lifetime points set your rank, and there are badges, a play streak and your best matches. Everything stays on the device, and **Reset score** erases it.
- **✕ menu:** Pause (really stops the match, on every phone if the host pauses), Restart (solo), Quit.
- **Cheat:** 70% unnoticed, and you see one innocent player's chit, never the thief's; sometimes with a close call. 30% caught: you see nothing, lose 100 and get one of 26 scenes that don't repeat until all have played.
- **Toss:** anyone can throw the chits; after 5 seconds someone else does.

## Quick start

ChitPlay is a zero-build project (native ES modules, three.js vendored locally).

```bash
cd chitplay
python serve.py
```

Then open `http://127.0.0.1:8000`.

`serve.py` sends `Cache-Control: no-store`, so edited modules always load on a normal refresh. With plain `python -m http.server`, the browser may keep using stale modules until you hard-refresh (Ctrl+Shift+R).

## Country editions

Players pick a game by its **name**, written in Latin letters so anyone can read it: Raja Rani Chor Police, Raja Wazir Chor Sipahi, Mafia Game, Jingcha Zhua Xiaotou, Cops and Robbers… There are no country or flag pickers. Every visit opens on the game of the country the player is in, and that game is listed first with a ⭐. Detection uses the device timezone, or the browser-language region when the timezone is hidden, with no permission and no network. Anywhere without its own game opens on **Cops and Robbers**.

On phones: 🔄 switches to fullscreen landscape (Android; iPhone shows a "turn your phone" nudge). Phones held upright also get a clear rotate button on the start screen and a dismissible one during the match. The screen stays awake during a match, and key moments give a short vibration.

**Home screen:** swipe the big game cards left or right (or use ‹ › and the arrow keys). Whichever card stops in the middle becomes the game, and the room, players, roles and rules switch with it. Then tap **▶ Play** or **👀 Just Watch**, pick the rounds, and optionally a chat language. There are no flags anywhere.

**Language:** menus, rules and voices are always **English**. The players' chat bubbles are English by default, and **🗣️ Chat** lets each player read them in their own language, always written in Latin letters: Hinglish, Roman Urdu, Roman Nepali, Roman Bangla, Japanese (Romaji), Korean (Romanized), Chinese (Pinyin), Russian (Latin), Deutsch, Français, Português or Español. Any language works with any game. Moments a language doesn't have yet (game-specific rules) borrow the game's English line, so nobody goes quiet. Each game keeps its own role names, such as Raja (King), Chor (Thief) or Huángdì (Emperor). Each edition changes the role names, points, who guesses, a rule twist, the players' names and the room.

| Country | Game | Roles (points) | Rule twist |
|---|---|---|---|
| India | Chor Police Raja Rani | Raja 1000 · Rani 800 · Police 500 · Chor | Police picks the Chor from 3. On a wrong guess, Police and Chor swap points |
| Pakistan | Raja Wazir Chor Sipahi | Raja 1000 · Wazir 800 · Sipahi 500 · Chor | Classic opening: Raja reveals and asks "Mera Wazir kaun?", then the **Wazir** guesses between the last 2. Wrong guess swaps Wazir and Chor |
| Nepal | Raja Mantri Chor Sipahi | Raja 1000 · Mantri 800 · Sipahi 500 · Chor | Same classic opening. The **Mantri** guesses. Lines are in Nepali |
| Japan | Tono-sama to Dorobō | Tono-sama 1000 · Karō 800 · Okappiki 500 · Dorobō | Okappiki gets one **clue** that clears an innocent before guessing |
| South Korea | Mafia Game | Citizen 600 · Doctor 800 · Police 500 · Mafia | **Night phase:** the Mafia attacks and the Doctor tries to save. An unsaved victim scores 0 that round |
| USA | Cops and Robbers | Mayor 1000 · Banker 800 · Sheriff 500 · Robber | Sheriff gets **two shots** (the second catch is worth half) |
| UK | Cops and Robbers | King 1000 · Queen 800 · Bobby 500 · Robber | Everyone gives an **alibi**. A wrong arrest costs the Bobby **200** |
| China | Jǐngchá Zhuā Xiǎotōu | Huángdì 1000 · Zǎixiàng 800 · Jǐngchá 500 · Xiǎotōu | A caught Xiǎotōu pays a **200 fine** to the Jǐngchá |
| Bangladesh | Raja Mantri Chor Police | Raja 1000 · Mantri 800 · Police 500 · Chor | Raja asks "Amar Police kothay?", then the **Police** guesses between the last 2. Wrong guess swaps points |
| Russia | Мафия | Мирный 600 · Доктор 800 · Комиссар 500 · Мафия | **Night check:** the Комиссар secretly checks one player and sometimes finds the Mafia straight away |
| Germany | Räuber und Gendarm | König 1000 · Königin 800 · Gendarm 500 · Räuber | A **witness** gives a tip, right about 65% of the time |
| France | Gendarmes et Voleurs | Roi 1000 · Reine 800 · Gendarme 500 · Voleur | The **last round counts double** |
| Brazil | Polícia e Ladrão | Rei 1000 · Rainha 800 · Polícia 500 · Ladrão | An escaping Ladrão also **steals 300 from the Rei** |
| Mexico | Policías y Ladrones | Rey 1000 · Reina 800 · Policía 500 · Ladrón | Someone **can't stop giggling**: usually the Ladrón, but not always |

Each room has its own floor and mat, a localised calendar, a ball (cricket, baseball or ping-pong), role hats (crown, tiara, turban, dhaka topi, cowboy hat, custodian helmet, doctor's band, mask…) and its own blackout flavour (load shedding, typhoon, thunderstorm or a blown fuse).

## Playing

- **Play:** you sit front-left. Your only actions are tapping to open your chit and, when you are the guesser, tapping the player you suspect (name chips work too).
- **Just Watch:** all four players are computer players.
- **Rounds:** choose 3, 5, 7, 10 or 20 on the start screen (7 by default).
- **Fair turns:** the guessing role goes to whoever has had it the fewest times, picked at random among ties. Everyone gets turns, and the human always gets at least one per match.
- **Your name:** set on the start screen and remembered on this device (default **Avin**). It's your name in Play and Nearby Play; two players with one name become Avin and Avin 2.
- **🤫 Cheat:** when you are the guesser, the Cheat button tries to peek at a chit, once a round, with a 50/50 chance of seeing it. If it works, one innocent suspect is cleared. Either way there's a 35% chance someone notices ("Oye! Tu cheating kar raha hai!" / "Arre maine nahi kiya!") and you lose 100. Computer guessers try it half the time.
- **Chat language:** chosen on the start screen (🗣️ Chat), see *Language* above.
- **End of match:** final standings with 🥇🥈🥉, awards (🕵️ Sharp Eye for the most catches, 🦊 Escape Artist for the thief who got away most; no award on a tie), and **📤 Share**. Share opens the phone's share sheet, or copies an "I scored … can you beat me?" message with a link to that game.
- **Your stats:** wins, matches and best score from Play mode are kept on this device and shown on the home screen.
- **Layout:** works on any screen, from 320px phones and landscape phones to tablets and big desktops (two-column start sheet in landscape, Play buttons first on small phones).
- **Sound:** ceiling-fan hum while the power's on, thunder and rain for storm blackouts, crickets at night. Each player's voice changes with the moment: excited, sad, scared, whispering or sly.
- **Voices 🗣️:** players speak their lines aloud in English with the browser's built-in speech voices, using an accent that suits the game where the device has one (Indian, British or American English). Each character gets a voice and pitch that suit their age. If no voice is installed, the speech bubbles still work. Off by default; toggle with 🤐 / 🗣️.
- **Expressions:** each player has eyes, brows and a mouth that change with their mood, plus situation animations (laugh, cry, shrug, deny, jump, sneak, wave) and emote bubbles (❗❓💢😂😭🤫).

Before the result, roles are shown only when the rules make them public (the Raja's opening, the guesser's hat). Lines spoken before the result are role-neutral, so a bluffing thief sounds exactly like the royals.

## Dialogue never repeats

Every language pack (`src/world/lines/*.js`) has many lines per moment plus short interjections. The engine in `src/world/dialogue.js` guarantees that no sentence is spoken twice in a match. It prefers lines that haven't been used yet, and if a moment's lines ever run out, the player stays quiet instead of repeating.

## Deploy on GitHub Pages

There is no build step: the repo itself is the website.

The live site is **https://www.chitplay.com** (domain bought at Spaceship).

1. Push the project to a GitHub repository.
2. In the repository, open **Settings → Pages**, set **Source: Deploy from a branch**, choose **Branch: main**, folder **/ (root)**, and save. The `CNAME` file in the repo sets the custom domain.
3. In Spaceship's DNS settings for `chitplay.com`, remove any existing parking/`A` records and add:

   | Type | Host | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `<your-github-username>.github.io` |

4. Once GitHub shows the DNS check as passed, tick **Enforce HTTPS** in Settings → Pages.

All paths are relative. `.nojekyll` tells Pages to serve the files as they are, and `404.html` sends lost visitors back to the game.

## Analytics

Every page loads Google Tag Manager (`GTM-KRTTSTQQ`). The GA4 tag (`G-Z89HHLVEQT`) lives inside that container, so don't add `gtag.js` separately or visits count twice. Google Consent Mode keeps analytics and ad cookies off by default in the EEA, UK and Switzerland. The snippet lives in `tools/build-seo.mjs`.

**Weight:** the first visit downloads about 840 KB, or roughly 230 KB over the wire because GitHub Pages serves gzip. Most of that is three.js, slimmed to the parts the game uses: 492 KB instead of 655 KB. Dialogue is fetched one language at a time, and the service worker makes later visits instant. `archive/` and `tests/` are never loaded by the game, so you can leave them out of the repo if you want it smaller.

## Refresh-proof

A match is saved locally (in `localStorage`) at the start of every round, after every round is scored, and after a cheat. If the page is refreshed or the browser closes by accident, the game reopens in the **same round with the same chits**. Roles are not re-dealt, so a refresh can't be used to re-roll your chit or undo a caught cheat. The score, turn order and the lines already spoken (so nothing repeats) are kept too. Tapping ✕ deliberately ends the match. Saves expire after 7 days.

## Performance

- The start screen appears immediately. three.js and the 3D room load in the background.
- Only the dialogue pack for the language being played is downloaded.
- The 3D room renders at a low internal resolution at 30 fps. On slow devices it lowers its own quality (resolution, then shadows and dust) instead of stuttering.
- In production a service worker (`sw.js`) makes repeat visits instant and lets the game run offline. It's disabled on localhost/LAN so edits show up straight away.

## SEO

The site is built around the **game names** people search for, not the countries:

- `games/<slug>/` has one landing page per game name, for example `games/raja-rani-chor-police/`, `games/raja-mantri-chor-sipahi/`, `games/raja-wazir-chor-sipahi/`, `games/mafia-game/` and `games/jingcha-zhua-xiaotou/`. Each page has its own title, description, every alternative name (local script + English), rules, roles table, a worked scoring example (computed by the real rules engine, so it always matches the game), a "how to play" section written the way people search locally (*Raja Rani Chor Police kaise khele*, *警察抓小偷怎么玩*, *Como jogar Polícia e Ladrão*…), printable chits (🖨️ prints only the four chits), FAQ, `VideoGame` + `FAQPage` + `HowTo` + `BreadcrumbList` structured data, and **Play** links that open that exact game (`/?game=<slug>`). Titles include the local-script name, for example *Raja Rani Chor Police (राजा रानी चोर पुलिस) – Play Online Free*, so searches in that country find it.
- `games/` is a hub page listing every game name.
- The homepage has a focused title and description, Open Graph / Twitter cards (`assets/og-image.jpg`), JSON-LD with the main game names and the publisher's details, and a crawlable intro with links to every game page (shown in the start sheet under 📖).
- `sitemap.xml`, `robots.txt` and `manifest.webmanifest` (installable PWA).

Rebuild after any game, rule or policy change:

```bash
node tools/build-seo.mjs
```

This regenerates every page, the sitemap, robots.txt, `CNAME`, the manifest and the SEO and analytics blocks in `index.html` and `404.html`. The domain defaults to `https://www.chitplay.com`.

**Ready for ads:** `about/`, `contact/`, `privacy/` (including the Google advertising-cookie and Analytics wording AdSense asks for), `terms/` and `disclaimer/` are generated and linked from every page footer and the start screen. Contact: chitplaygame@gmail.com. Developer: Mr Avinash. Once AdSense gives you a publisher id, pass it as a second argument to write `ads.txt`:

```bash
node tools/build-seo.mjs https://www.chitplay.com pub-1234567890123456
```

When you serve ads to visitors in the EU/UK, turn on Google's consent message (Privacy & messaging in AdSense).

## Project layout

```
src/world/countries.js   editions: roles, points, rules, players, theme, language
src/world/match.js       rules engine (guesser, swap/penalty/fine, clue, night, second shot)
src/world/dialogue.js    no-repeat line picker
src/world/lines/         English packs (international, American, British, Japanese/Korean/Chinese games) + 12 Latin-script chat packs
src/world/voice.js       per-player speech-synthesis voices
src/world/world-3d.js    the 3D room, camera, lighting, power cuts, story API
src/world/players.js        the players' rig, poses and accessories
src/world/themes.js      per-game room textures
src/ui/screens/game-screen.js  start screen + the match director
src/net/nearby.js        Nearby Play rooms: up to 4 phones over WebRTC (PeerJS), joined with a 6-digit code
```

The earlier 2D screens and local pass-and-play were retired, along with the old 2D four-phone multiplayer (Nearby Play replaces it). They were moved to `archive/legacy-2d/`, not deleted. Core modules (`src/core`, `src/persistence`) and their tests (`tests/index.html`) are unchanged.
