# Google AdSense for www.chitplay.com

Checked against Google's own pages on 2026-11-07. Their policies change, so re-read the links at the bottom before applying.

**No one can promise approval.** Google reviews every site by hand and gives no score in advance. What we can do is leave nothing that breaks a rule. This file lists every requirement and where the site meets it, then the steps only you can do in your AdSense account.

## Requirements and where the site stands

| Google requirement | Where CHITPLAY meets it |
|---|---|
| Your own content, high quality and original ([9724](https://support.google.com/adsense/answer/9724)) | 14 game pages with rules and scoring for each edition (about 1000 words each), a hub page, How to play (about 870 words), Strategy (about 750 words), Indoor games, School games. All written for this site; game names are traditional and public domain. |
| "Enough unique content… to determine what your site is about" and no "pages with little to no content" ([10015918](https://support.google.com/adsense/answer/10015918)) | Every page has real text, a title, a description and a heading. The game page also carries an intro and links to all guides. |
| No missing pages or broken links ([10015918](https://support.google.com/adsense/answer/10015918)) | 26 pages, 787 internal links, 0 broken (checked 2026-11-07). |
| Easy to navigate ([48182](https://support.google.com/adsense/answer/48182)) | Every page has the logo link home, a Play button and a footer linking all guides and policy pages. |
| Privacy policy with the required disclosures ([1348695](https://support.google.com/adsense/answer/1348695)) | `/privacy/` says that third-party vendors, including Google, use cookies to serve ads based on prior visits, links to Google Ads Settings and aboutads.info, explains Google's partner-sites policy, and has sections for analytics, local storage, camera, Nearby Play, children and the EEA/UK. |
| EEA/UK/Switzerland: Google-certified CMP ([13554116](https://support.google.com/adsense/answer/13554116)) | Consent Mode defaults to "denied" in those regions in every page's tag. **You switch on Google's own CMP** in AdSense (step 5 below). |
| ads.txt ([12171612](https://support.google.com/adsense/answer/12171612)) | Made automatically once you give your publisher ID (step 2). |
| No encouraging clicks: no "click the ads", "support us", arrows ([1346295](https://support.google.com/adsense/answer/1346295)) | No such wording anywhere (checked). |
| No gambling ([10437795](https://support.google.com/publisherpolicies/answer/10437795)) | Points have no value. Nothing is bought, bet or won. Terms and Disclaimer say so. |
| No adult, violent or hateful content ([9335564](https://support.google.com/adsense/answer/9335564)) | A family party game. "Thief" and "Police" are make-believe roles, as the Disclaimer says. Player messages are fixed lists, so no free text. |
| No misrepresentation or copied content | Original characters, room, dialogue and text. Contact and About name the developer. |
| Child-directed content ([3248194](https://support.google.com/adsense/answer/3248194)) | A general-audience game for all ages, not directed at children under 13 (stated in the Privacy policy). No child-directed tag is needed. |
| Ads not on pages "without publisher content" or "under construction" ([11112688](https://support.google.com/publisherpolicies/answer/11112688)) | No placeholder or empty pages. The 404 page should get no ads (step 6). |
| No ads before a game or obscuring it, nothing near game controls that invites accidental clicks ([1346295](https://support.google.com/adsense/answer/1346295)) | See step 6: ads go on the guide pages, not over the game. |
| Supported language | All pages are in English. |

## Your steps

### 1. Create the AdSense account
1. Go to https://adsense.google.com/ and sign in with chitplaygame@gmail.com. You must be 18 or older.
2. Site: `chitplay.com`. Country: India. Accept the terms.
3. AdSense shows your **publisher ID**: `pub-` followed by 16 digits. Copy it.

### 2. Put the code on the site (Claude can do this for you)
Send the publisher ID, or run:
```
node tools/build-seo.mjs https://www.chitplay.com pub-XXXXXXXXXXXXXXXX
node tools/release.mjs
git add -A && git commit -m "AdSense code and ads.txt" && git push
```
This puts the AdSense code in the `<head>` of every page and creates `https://www.chitplay.com/ads.txt` with:
```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```
The ID is remembered in ads.txt, so later rebuilds keep it.

### 3. Check
- Open https://www.chitplay.com/ads.txt. It should show the line above.
- View the source of the home page. It should include `adsbygoogle.js?client=ca-pub-…`.

### 4. Request review
In AdSense, go to **Sites → chitplay.com → "I've placed the code" → Request review**. A review "usually takes a few days", sometimes up to 2–4 weeks. Don't change the site's structure while it's being reviewed.

### 5. Consent message for Europe (required)
AdSense → **Privacy & messaging → European regulations → Create message**. This is Google's own certified CMP. Choose your site, keep the default "Consent" and "Manage options" buttons, and publish. Do the same for the **US state regulations** message if offered. Without it, visitors in the EEA, UK and Switzerland can only get non-personalized ads.

### 6. Where ads may go (after approval)
In AdSense → **Ads → By site → chitplay.com**:
- Turn on **Auto ads**.
- Under **Page exclusions**, exclude `https://www.chitplay.com/` (the game page) and `/404.html`. The game fills the screen and its buttons sit at the bottom. An anchor or in-page ad over them could cause accidental clicks, and Google penalizes those even when unintended.
- Allow ads on `/games/…`, `/how-to-play/`, `/strategy/`, `/indoor-games/` and `/school-games/`: the content pages.
- Keep **Vignette ads** on. They appear only when a visitor leaves for another page, never during play.

Never:
- click your own ads, or ask friends or family to,
- buy "click" or "visitor" traffic,
- write anything like "click an ad to support us",
- put an ad where it covers or touches the game.

### 7. If it's rejected
The email gives the reason. The usual ones:
- **"Low value content"**: add more original guides or articles, then ask for a new review.
- **"Site down or unavailable"**: check that https://www.chitplay.com opens.
- **"Policy violation"**: read the linked policy and tell Claude which one.

You can request a new review after fixing the issue.

## Google pages this is based on
- Eligibility: https://support.google.com/adsense/answer/9724
- Program policies: https://support.google.com/adsense/answer/48182
- Ad placement: https://support.google.com/adsense/answer/1346295
- Content and user experience: https://support.google.com/adsense/answer/10015918
- Publisher restrictions: https://support.google.com/publisherpolicies/answer/10437795
- Ads on screens without content: https://support.google.com/publisherpolicies/answer/11112688
- Required privacy content: https://support.google.com/adsense/answer/1348695
- Certified CMP: https://support.google.com/adsense/answer/13554116
- ads.txt: https://support.google.com/adsense/answer/12171612
- Children / COPPA: https://support.google.com/adsense/answer/3248194
