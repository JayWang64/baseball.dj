# baseball.dj — Team DJ Soundboard (Design Spec)

**Date:** 2026-07-10
**Team:** 2026 MDBA 9U Red Sox (13 players)
**Goal:** A fun, dead-simple phone web app the day's DJ parent uses to play
walk-up music, announcer intros, and cheer clips through the Bluetooth
speaker their phone is paired to.

## Scope and non-goals

- **In scope:** one-phone soundboard, batting-order game mode, cheer/event
  buttons, pre-generated AI announcer intros, offline-capable PWA, free
  static hosting.
- **Out of scope (learned from the old Dugout app, which died of
  complexity):** scorekeeping, fielding rotation, rulebook logic, any
  server/database, auth, multi-phone sync, upload UI. Music only, two
  screens.

## Architecture

Static single-page PWA — **Vite + Svelte** — deployed to **GitHub Pages**
from `github.com/JayWang64/baseball.dj` via a GitHub Actions workflow on
push. No backend, no database, $0/month hosting.

- All audio ships with the site. A service worker precaches the full app
  + audio so it works fully offline at the field after one load at home.
- Day-of state (today's lineup, current batter index) lives in
  `localStorage`.
- The "database" is the repo's folder structure plus `roster.json`;
  a build-time script turns them into `manifest.json` for the app.
- Fonts (Graduate, Barlow Semi Condensed) are **self-hosted** (the old
  app pulled them from Google Fonts, which breaks offline).

## Repo layout

```
leagues/
  mdba/                          # league (slug folder)
    league.json                  # display name, etc.
    9u-red-sox/                  # team (slug folder)
      roster.json                # source of truth for this team's players
      walkup/<player>.mp3        # ~20s normalized clips (seeded from songs/)
      intros/<player>.mp3       # AI announcer intros (generated)
      cheers/<clip>.mp3          # team-specific cheers (optional)
shared/
  cheers/<clip>.mp3              # cheers available to every team (YMCA, Charge…)
scripts/
  generate-intros.mjs            # TTS intro generation (ElevenLabs)
  build-manifest.mjs             # leagues/* + shared/* -> src/manifest.json
src/                             # Svelte app
docs/superpowers/specs/          # this doc
.claude/skills/walkup-song-clip/ # moved from old repo; clip pipeline lives here
old/                             # legacy Dugout app, reference only (gitignored)
```

**Adding a future team/league = create folders + roster.json, push.**
No code changes: the manifest build discovers every
`leagues/<league>/<team>/` folder. Generic cheers live once in
`shared/cheers/`; a team folder can add its own on top.

## Roster

`roster.json` — one entry per player: `name`, `number` (nullable),
`displayName`, optional `phonetic` (TTS pronunciation), optional
`introStyle` (`"then"` = intro then song, `"over"` = intro premixed over
song start).

Current roster (13): Ajith 8, Blake ?, Hugo 1, Joshua 11, Lincoln 21,
Max 7, Nathan 6, Ray 4, Shayen ?, Theo 10, Tobias 12, Xavier 3,
Zachary 2. Blake and Shayen have no number yet — the announcer intro
**skips the number, not the kid** ("Now batting… BLAKE!"); regenerating
after the number is added picks it up automatically.

## Content pipeline (local, in-repo)

1. **Walk-up clips:** existing `walkup-song-clip` skill (yt-dlp + ffmpeg,
   ≤20s, fades, ~-14 LUFS). Drop output into `audio/walkup/`.
2. **Announcer intros:** `scripts/generate-intros.mjs` reads
   `roster.json`, calls ElevenLabs TTS (announcer-style voice, free tier
   covers the roster many times over) for any player **missing** an intro
   MP3, and loudness-normalizes to match the music. Number omitted when
   null. `--force <name>` regenerates one player.
3. **Manifest:** `scripts/build-manifest.mjs` scans `audio/*` and
   `roster.json`, writes `manifest.json` (player → intro/walkup files,
   cheer list). Runs as part of `vite build`, so adding a sound =
   drop file → push.
4. **Seed content:** copy from `songs/` at the repo root — 13 walk-up
   clips (`Name - Artist - Title - walkup.mp3`; a `[placeholder]` token
   marks songs the kid hasn't picked yet) into
   `leagues/mdba/9u-red-sox/walkup/`, and the 4 cheer clips
   (`_cheer - <Title>.mp3`) into `shared/cheers/`. Parse player and song
   title from the filenames into the manifest. More cheers can be pulled
   later from `old/output/yt/cheer/_full/`.

## Team selection

The app opens on the last-used team (localStorage). If none — or via a
"switch team" control — a simple picker lists leagues/teams from the
manifest. With one team it goes straight to it. The selected team is
also reflected in the URL hash (`#/mdba/9u-red-sox`) so a bookmarked
link opens the right team directly.

## App UI (two screens)

Visual language carried over from Dugout's `styles.css`: chalk on
field-green, amber scoreboard glow, clay/grass accents, mow-stripe
background, grain overlay, Graduate display font, pill bottom tab bar.
Built for sunlight and thumbs — big touch targets.

1. **Lineup** — tap players from the roster into today's batting order,
   drag (or ↑↓) to reorder, toggle absent kids off. Persisted to
   localStorage. Shows a warning badge on any player missing audio.
2. **Game** — main screen:
   - Big **NOW BATTING** card showing who's up (name, number, song
     title). Tap → plays intro then walk-up (or the premixed version),
     then auto-advances the order. Back/skip controls. On-deck preview.
   - Grid of **cheer buttons** below (Charge, YMCA, Seven Nation Army…).
   - Always-visible **STOP** and **fade-out** controls.
   - One clip at a time: starting a new sound fades out the current one
     (~300ms).

## Playback / error handling

- Single shared `AudioContext`/audio element; mobile audio unlocked by a
  one-tap "arm audio" interaction on app open (iOS requirement).
- Intro→walkup sequencing handled in app (two files back-to-back with a
  short gap) unless a premixed `over` file exists.
- Missing file for a player → button renders with a warning state, never
  a silent failure.
- Bluetooth latency is inherent (~200ms) and acceptable; no compensation.

## Testing

- Unit tests for `build-manifest.mjs` (filename parsing, missing-number
  and missing-audio cases).
- Component tests for playback sequencing: intro→song, fade-on-interrupt,
  order auto-advance, localStorage persistence.
- Real-device check: iPhone + Bluetooth speaker + airplane mode (offline
  PWA proof) before first game.

## Hosting / deploy

- Repo: `git@github.com:JayWang64/baseball.dj.git` (SSH). GitHub Actions
  workflow builds the Vite site and deploys to **GitHub Pages** on every
  push to main; app served at `jaywang64.github.io/baseball.dj/`
  (Vite `base` set accordingly). Custom domain later if desired.
- Audio (~13 walkups + ~14 cheers + 13 intros ≈ 15–20 MB per team) is
  well within GitHub's limits; scales fine to a handful of teams.

## Phases

1. **Phase 1 — Soundboard core:** repo scaffold, seed audio from `old/`,
   roster.json, manifest build, Lineup + Game screens, playback engine,
   Dugout visual theme.
2. **Phase 2 — Announcer intros:** ElevenLabs script, intro→walkup
   sequencing, regenerate flow.
3. **Phase 3 — PWA/offline + deploy:** service worker precache,
   self-hosted fonts, Cloudflare Pages, real-device verification.
