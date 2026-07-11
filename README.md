# ⚾ baseball.dj

Game-day DJ soundboard for youth baseball — walk-up music, announcer
intros, and cheers, run from the DJ parent's phone (paired to the
Bluetooth speaker). A static, offline-capable PWA: load it once at home
and it works at a field with zero bars.

**Live:** https://jaywang64.github.io/baseball.dj/

## How game day works

1. Open the site, tap **🔊 arm audio** (one-time per open — phone
   browsers require a tap before sound).
2. **Lineup tab:** tap today's kids into batting order, arrows to
   reorder.
3. **Game tab:** tap the big **NOW BATTING** card to play the batter's
   intro + walk-up; it auto-advances to the next kid. Cheer buttons
   below; **FADE** / **STOP** always at hand. Starting any sound fades
   out the current one.

## Adding content (folders are the database)

```
public/
  leagues/<league>/<team>/
    roster.json          { "name": "9U Red Sox", "players": [{ "name": "Max", "number": 7 }] }
    walkup/              "Name - Artist - Title - walkup.mp3"  (put "[placeholder]" in the
                         filename if the kid hasn't picked a song yet)
    intros/              generated announcer intros, "<name>.mp3"
    cheers/              team-specific cheers (optional)
    celebrate/           optional "<name>.mp3" scored-a-run clips ("default.mp3" = fallback);
                         shows a 🎉 button on the batter card
  shared/cheers/         cheers every team gets ("Title.mp3") — interrupt the music
  shared/sfx/            one-shot effects (air horn…) — play OVER the music
  shared/calls/          announcer event calls ("Run Scored.mp3"…) — duck the music to 30%
  shared/party/          full-length tracks for between-innings PARTY mode
                         (streamed + cached on play; not part of the FIELD READY precache)
```

- **New song:** drop the MP3 in `walkup/`, push. The build regenerates
  the manifest from the folders.
- **New team or league:** create the folders + `roster.json`, push.
  The app grows a team picker automatically.
- **Missing jersey number:** use `"number": null` — the announcer skips
  the number, never the kid.

## Announcer intros

```
ELEVENLABS_API_KEY=... node scripts/generate-intros.mjs leagues/mdba/9u-red-sox
```

Generates a stadium-announcer MP3 per player missing one
("Now batting… number 7… MAX!"), loudness-normalized to match the music
(needs ffmpeg). `--force <name>` regenerates one player — e.g. after a
jersey number arrives. Optional `"phonetic"` field in roster.json fixes
pronunciation. Then commit the new files in `intros/` and push.

## Develop

```
npm install
npm run dev     # local dev server
npm test        # vitest
npm run build   # production build (dist/)
```

Deploys automatically to GitHub Pages on push to `main`
(`.github/workflows/deploy.yml`).
