# Sending ChitPlay to CrazyGames and Poki

The website (www.chitplay.com) and the portal builds come from the same code. A portal build is the
game alone: no guide pages, no AdSense, no Google Analytics, no links out to the website, and the
portal's own SDK for ads.

## Make the builds

```
node tools/release.mjs        # stamp the current version on every file
node tools/build-portal.mjs   # dist/crazygames/ and dist/poki/, plus a .zip of each
```

`dist/` is not part of the website and is not committed to Git.

Each build is about 2.6 MB in 153 files (under 1 MB zipped). It contains:

- the game (`index.html`)
- the table and TV games (`play/index.html`)
- the code
- the icons

## What the game tells the portal (src/platform/portal.js)

| Moment | CrazyGames SDK v3 | Poki SDK |
|---|---|---|
| The 3D room has loaded | `game.loadingStop()` | `gameLoadingFinished()` |
| A match or a run starts, or play resumes after the pause menu | `game.gameplayStart()` | `gameplayStart()` |
| Pause menu opened, a match ends, leaving a game | `game.gameplayStop()` | `gameplayStop()` |
| Play again (a natural break between matches) | `ad.requestAd('midgame')` | `commercialBreak()` |

While an ad plays, the game is paused and silent: sound and voices are off. When the ad ends, sound comes back as it was.

On the website these calls do nothing.

## Before submitting: check in the portal's own tester

- **CrazyGames:** upload the zip in the Developer Portal and use its QA tool. In the tool:
  - the game loads
  - the gameplay events arrive in the right order
  - the midgame ad appears after "Play again"
- **Poki:** use the Poki Inspector (inspector.poki.dev) with `dist/poki/`, and check the same three things.

## Good to know

- Online play and Nearby play use the PeerJS connection service on the internet, as on the website.
- The game saves progress in the browser on the portal's site, so a player's profile there is separate from www.chitplay.com.
- Poki chooses its games itself: apply through their developer page. CrazyGames accepts direct uploads.
