# baseball.dj Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static offline-capable PWA soundboard (walk-up music, announcer intros, cheers) for the 2026 MDBA 9U Red Sox, organized by league/team folders, deployed to GitHub Pages.

**Architecture:** Vite + Svelte SPA, no backend. Audio + rosters live under `public/leagues/<league>/<team>/` and `public/shared/cheers/`; a build-time script generates `src/lib/manifest.json` from those folders. Playback uses Web Audio API (iOS volume/fade works only via GainNode). Day-of state in localStorage. GitHub Actions deploys `dist/` to GitHub Pages.

**Tech Stack:** Node 24, Vite 6, Svelte 5 (classic stores), vitest, vite-plugin-pwa, @fontsource/graduate + @fontsource/barlow-semi-condensed, GitHub Pages via actions/deploy-pages.

## Global Constraints

- Repo: `git@github.com:JayWang64/baseball.dj.git`; site served at `https://jaywang64.github.io/baseball.dj/` → Vite `base: '/baseball.dj/'`.
- Never commit to main; work on `feature/app-v1`, PR at the end.
- 13 players: Ajith 8, Blake ?, Hugo 1, Joshua 11, Lincoln 21, Max 7, Nathan 6, Ray 4, Shayen ?, Theo 10, Tobias 12, Xavier 3, Zachary 2. Missing number ⇒ announcer skips the number, never the kid.
- Walk-up filename grammar: `Name - [rest] - walkup.mp3`; `[placeholder]` token anywhere marks a not-yet-chosen song. Cheer grammar: `_cheer - Title.mp3` (seed) → stored as `Title.mp3` in `shared/cheers/`.
- One clip at a time; starting a new sound fades the current one out over ~300 ms.
- Visual language: Dugout theme (chalk on field-green, amber glow, Graduate/Barlow) adapted from `old/public/styles.css`; fonts self-hosted (no Google Fonts CDN).
- ElevenLabs intro generation runs only when `ELEVENLABS_API_KEY` is set; the app must work fine with zero intro files.
- `old/` stays gitignored; `songs/` is the seed source and stays in the repo root (also gitignored after seeding — the canonical copies live under `public/leagues/`).

---

### Task 1: Scaffold Vite + Svelte app

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/App.svelte` (stub), `src/app.css` (stub)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run dev` / `npm run build` / `npm test` (vitest). `vite.config.js` exports base `'/baseball.dj/'`.

- [ ] **Step 1: package.json + install**

```json
{
  "name": "baseball.dj",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "predev": "node scripts/build-manifest.mjs",
    "dev": "vite",
    "prebuild": "node scripts/build-manifest.mjs",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

Run: `npm i -D vite @sveltejs/vite-plugin-svelte svelte vitest vite-plugin-pwa && npm i @fontsource/graduate @fontsource/barlow-semi-condensed`

- [ ] **Step 2: vite.config.js**

```js
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/baseball.dj/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoupdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,mp3,json,woff2,svg,png}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: 'baseball.dj',
        short_name: 'baseball.dj',
        start_url: '.',
        display: 'standalone',
        background_color: '#102e21',
        theme_color: '#102e21',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
})
```

- [ ] **Step 3: index.html, src/main.js, stub App.svelte/app.css** (baseball favicon reused from old app; `<meta name="viewport" ... viewport-fit=cover>`). main.js:

```js
import './app.css'
import '@fontsource/graduate'
import '@fontsource/barlow-semi-condensed/400.css'
import '@fontsource/barlow-semi-condensed/600.css'
import '@fontsource/barlow-semi-condensed/700.css'
import '@fontsource/barlow-semi-condensed/800.css'
import { mount } from 'svelte'
import App from './App.svelte'
export default mount(App, { target: document.getElementById('app') })
```

- [ ] **Step 4: .gitignore additions** — `node_modules/`, `dist/`, `src/lib/manifest.json`, `songs/`, `dev-dist/`.
- [ ] **Step 5: Verify** `npm run build` fails only on missing manifest script (expected until Task 3) — so for now stub `scripts/build-manifest.mjs` with `console.log('stub')`. `npm run dev` serves the stub app.
- [ ] **Step 6: Commit** `feat: scaffold vite+svelte pwa app`

### Task 2: Seed content — league/team folders, roster.json

**Files:**
- Create: `public/leagues/mdba/league.json`, `public/leagues/mdba/9u-red-sox/roster.json`, `public/leagues/mdba/9u-red-sox/walkup/*.mp3` (13, copied from `songs/`), `public/shared/cheers/*.mp3` (4, `_cheer - ` prefix stripped), `public/leagues/mdba/9u-red-sox/intros/.gitkeep`

**Interfaces:**
- Produces: folder layout consumed by Task 3's scanner. `roster.json` schema:

```json
{
  "name": "9U Red Sox",
  "players": [
    { "name": "Ajith", "number": 8 },
    { "name": "Blake", "number": null },
    { "name": "Hugo", "number": 1 },
    { "name": "Joshua", "number": 11 },
    { "name": "Lincoln", "number": 21 },
    { "name": "Max", "number": 7 },
    { "name": "Nathan", "number": 6 },
    { "name": "Ray", "number": 4 },
    { "name": "Shayen", "number": null },
    { "name": "Theo", "number": 10 },
    { "name": "Tobias", "number": 12 },
    { "name": "Xavier", "number": 3 },
    { "name": "Zachary", "number": 2 }
  ]
}
```

`league.json`: `{ "name": "MDBA" }`

- [ ] **Step 1: Copy files** (PowerShell copy; strip `_cheer - ` prefix on cheer files).
- [ ] **Step 2: Verify** 13 mp3s in `walkup/`, 4 in `shared/cheers/`, JSON parses.
- [ ] **Step 3: Commit** `feat: seed mdba/9u-red-sox roster, walkup clips, shared cheers`

### Task 3: Manifest builder (TDD)

**Files:**
- Create: `scripts/build-manifest.mjs` (replaces stub), `scripts/manifest-lib.mjs`, `tests/manifest.test.js`

**Interfaces:**
- Produces: `src/lib/manifest.json`:

```json
{
  "leagues": [{
    "slug": "mdba", "name": "MDBA",
    "teams": [{
      "slug": "9u-red-sox", "name": "9U Red Sox",
      "players": [{
        "name": "Ajith", "number": 8,
        "walkup": { "url": "leagues/mdba/9u-red-sox/walkup/Ajith - Drake - What Did I Miss (Clean) - walkup.mp3", "title": "Drake - What Did I Miss (Clean)", "placeholder": false },
        "intro": null
      }],
      "cheers": [{ "title": "Charge (Dodger Organ)", "url": "shared/cheers/Charge (Dodger Organ).mp3" }]
    }]
  }]
}
```

- `manifest-lib.mjs` exports pure functions: `parseWalkupFilename(basename)` → `{ player, title, placeholder }` (split on `' - '`, first = player, drop trailing `walkup`, `[placeholder]` token removed from title and sets flag); `buildTeam({ roster, walkupFiles, introFiles, sharedCheers, teamCheers, baseDir })` → team object. Player↔file match: case-insensitive first-token match; intro match: `<name-lowercase>.mp3`. Missing walkup/intro ⇒ `walkup: null` / `intro: null` (app shows warning; never throws).

- [ ] **Step 1: Write failing tests** in `tests/manifest.test.js` covering: normal filename, no-artist filename (`Theo - The Avengers - walkup.mp3` → title `The Avengers`), placeholder token, cheer title from filename, player missing walkup ⇒ null, player with null number preserved, intro matched by lowercase name.
- [ ] **Step 2: Run** `npm test` → FAIL (module missing).
- [ ] **Step 3: Implement** `manifest-lib.mjs` (pure) + `build-manifest.mjs` (fs walk of `public/leagues/*/`, `public/shared/cheers/`, writes `src/lib/manifest.json`, logs a warning line per missing asset).
- [ ] **Step 4: Run** `npm test` → PASS; run `node scripts/build-manifest.mjs` → manifest lists 13 players, 4 cheers, warnings for 13 missing intros.
- [ ] **Step 5: Commit** `feat: manifest builder scanning leagues/ and shared/`

### Task 4: Dugout theme + app shell (team select, tabs)

**Files:**
- Create: `src/app.css` (full theme), `src/lib/team.js`, `src/components/TeamPicker.svelte`, `src/components/TabBar.svelte`
- Modify: `src/App.svelte`

**Interfaces:**
- `team.js` exports: `teams()` (flat `[{league, team}]` from manifest), `currentTeam` (writable store, hydrates from `location.hash` `#/league/team` else localStorage `dj.team`, persists to both), `selectTeam(leagueSlug, teamSlug)`.
- `App.svelte`: if no current team and >1 team → TeamPicker; else topbar (brand + team name) + active screen (`lineup` | `game` tabs via TabBar) rendered from a `tab` writable store (default `game` if a lineup exists in storage, else `lineup`).
- Theme: port `:root` palette, body background (mow stripes + grain), topbar, tabbar, panel, `.btn` styles from `old/public/styles.css`, replacing Google Fonts with fontsource families.

- [ ] **Step 1: Port theme css** (trimmed to what's used).
- [ ] **Step 2: Implement team.js + components; wire App.svelte.**
- [ ] **Step 3: Verify** `npm run dev` — with one team, opens straight to it, tabs switch, hash updates.
- [ ] **Step 4: Commit** `feat: app shell with dugout theme, team selection, tabs`

### Task 5: Audio engine (Web Audio, TDD on sequencing)

**Files:**
- Create: `src/lib/audio.js`, `tests/audio.test.js`

**Interfaces:**
- Exports singleton engine:
  - `arm()` — create/resume AudioContext inside a user gesture; sets `armed` store true.
  - `playSequence(urls, { onDone })` — fades out anything playing (300 ms gain ramp), then plays urls back-to-back (fetch → decodeAudioData, buffers cached in a Map by url).
  - `stop()` — hard stop; `fadeOut(ms = 1500)` — gain ramp then stop.
  - `nowPlaying` — readable store: `null | { urls, index }`.
- Constructor accepts an injectable context factory so tests pass a fake (`createEngine({ contextFactory })`); default uses `new AudioContext()`.

- [ ] **Step 1: Write failing tests** with a fake AudioContext/GainNode/BufferSource capturing calls: new playSequence cancels previous source and ramps gain; sequence advances on source `onended`; stop clears `nowPlaying`; buffers fetched once per url (fetch mocked).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: web-audio playback engine with fades and sequencing`

### Task 6: Lineup screen (TDD on store)

**Files:**
- Create: `src/lib/lineup.js`, `src/components/Lineup.svelte`, `tests/lineup.test.js`

**Interfaces:**
- `lineup.js` (per-team key `dj.lineup.<league>/<team>`): `lineup` writable store `{ order: [playerName...], batterIndex: 0 }`; `initLineup(teamKey, roster)`; `toggle(name)` add/remove; `move(name, delta)`; `advance()` / `back()` (wrap around order); `resetGame()` (batterIndex 0). Persists to localStorage on every change.
- `Lineup.svelte`: roster list — tap toggles in/out of today's order, ↑↓ buttons reorder, order numbers shown, warning badge (⚠︎) when `player.walkup === null`, `[placeholder]` chip when placeholder song.

- [ ] **Step 1: Write failing tests**: toggle adds/removes and preserves order; move clamps at ends; advance wraps; state round-trips through (mocked) localStorage; batterIndex adjusts when the current batter is removed.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Verify in dev** then **Commit** `feat: lineup screen with per-team persisted batting order`

### Task 7: Game screen (now batting, cheers, stop/fade)

**Files:**
- Create: `src/components/Game.svelte`, `src/components/CheerGrid.svelte`
- Modify: `src/App.svelte` (arm-audio overlay)

**Interfaces:**
- Consumes: `lineup` store, `audio` engine, manifest team object.
- Game screen: big NOW BATTING card (number, name, song title, amber glow) — tap plays `[intro?, walkup?].filter(Boolean)` and **auto-advances on completion**; ‹ back / skip › buttons; ON DECK line. Cheer grid below (one button per cheer, shared + team). Sticky footer: STOP (hard) and FADE buttons, disabled when nothing playing. Playing button pulses (`nowPlaying` store).
- First interaction anywhere shows/uses "🔊 tap to arm audio" overlay once per page load (`arm()`).

- [ ] **Step 1: Implement components.**
- [ ] **Step 2: Verify in dev**: batter plays walkup then advances; cheer interrupts with fade; STOP/FADE work; missing-walkup player shows warning and skips play.
- [ ] **Step 3: Commit** `feat: game screen with now-batting flow and cheer board`

### Task 8: Intro generator script

**Files:**
- Create: `scripts/generate-intros.mjs`, `tests/intros.test.js` (text-building only)

**Interfaces:**
- `buildIntroText({ name, number, phonetic })` (exported for tests): number present → `"Now batting… number 8… Ajith!"`; number null → `"Now batting… Ajith!"`; `phonetic` replaces name in TTS text only.
- CLI: `node scripts/generate-intros.mjs leagues/mdba/9u-red-sox [--force name]` — for each roster player missing `intros/<name>.mp3`, POST ElevenLabs `text-to-speech/{voiceId}` (voice id via `ELEVENLABS_VOICE_ID`, default a stock announcer-y voice; key via `ELEVENLABS_API_KEY`; exits 0 with a notice if key unset), save mp3, then ffmpeg `loudnorm=I=-14:TP=-1.5` normalize in place. Requires ffmpeg on PATH.

- [ ] **Step 1: Failing tests for `buildIntroText`** (with/without number). **Step 2: FAIL → implement → PASS.**
- [ ] **Step 3: Commit** `feat: elevenlabs intro generator (skips missing jersey numbers)`

### Task 9: Deploy to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:** deploy.yml:

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 1: Write workflow + README** (what it is, how to add a team/league/song, how to run intro generation).
- [ ] **Step 2: Full local check**: `npm test` → all pass; `npm run build` → dist has audio + sw.js.
- [ ] **Step 3: Push branch, enable Pages** (`gh api -X POST repos/JayWang64/baseball.dj/pages -f build_type=workflow`, tolerate 409 if exists), open PR, merge to main.
- [ ] **Step 4: Verify live**: workflow green; `https://jaywang64.github.io/baseball.dj/` loads, plays a cheer.

---

## Self-review notes

- Spec coverage: architecture/hosting (T1, T9), folders+manifest (T2, T3), theme+fonts (T1, T4), team picker/hash (T4), playback+fades+arm gesture (T5, T7), lineup persistence (T6), missing-number intros (T8), missing-audio warnings (T3, T6, T7), PWA offline (T1 config, verified T9). Real-device iPhone check remains a manual post-deploy step for the user (no iPhone in this environment).
- Intros can't be generated without `ELEVENLABS_API_KEY` — app ships without them; script ready.
