# baseball.dj Roadmap

**North star:** the DJ parent is doing 14 things at once. Every feature must
reduce taps or increase hype — anything that adds management overhead is out
of scope. This is a fun team tool, not a SaaS (though the folder-per-team
architecture keeps that door open for free).

**Current state (v1, shipped):** offline-capable PWA on GitHub Pages;
lineup with attendance + drag ordering + lock; game screen with
announcer-intro → walk-up flow, shared play/pause/stop, stop-on-next,
batting-order drawer with jump; 4 cheers; all 13 intros; iOS mute-switch
workaround; FIELD READY cache badge.

Ranked by hype-per-effort. Each phase is shippable alone.

---

## Phase 1 — Game-day reliability (do first, it protects everything else)

### 1.1 Screen wake lock
The phone dimming/locking mid-inning kills the audio session and forces
re-arming. Use the Wake Lock API while the Game tab is active.

**Acceptance criteria**
- With the app open on the Game tab, the phone does not auto-lock for the
  duration of a game (tested ≥20 min idle on iPhone Safari + Android Chrome).
- Wake lock re-acquires automatically after tab switch / notification
  interruption (`visibilitychange`).
- Lock is released when leaving the Game tab (don't cook the battery in a
  pocket).
- Graceful no-op on browsers without the API — no errors, no UI difference.

### 1.2 Big-print sunlight mode audit
Field sunlight + cheap sunglasses is the real usage environment.

**Acceptance criteria**
- All tap targets on the Game screen ≥ 56px.
- Contrast ratio ≥ 4.5:1 for all text on the Game screen (automated axe check).
- One-handed reachability: play/stop/next reachable in the bottom 60% of the
  viewport on a 6.1" phone (move transport down or dock it).

---

## Phase 2 — More hype per tap (the 10x fun)

### 2.1 Sound-effects board (SFX ≠ cheers)
Instant one-shot stadium effects: organ "Charge!" stinger, air horn,
strike-three call, glass break for a foul ball into the parking lot, crowd
"ooooh". Sourced the same way as cheers (`shared/sfx/` folder, auto-manifest).

**Acceptance criteria**
- New `shared/sfx/` folder appears as a compact grid of small buttons on the
  Game screen below cheers; adding an mp3 = drop file + push, no code.
- SFX play instantly (<150 ms perceived) from cache and do NOT interrupt the
  current song — they layer on top (separate gain node), because an air horn
  over the walk-up is the point.
- SFX buttons visually distinct from cheers (smaller, different color).

### 2.2 Announcer event calls
Pre-generated announcer lines that pair with game moments: "RUN SCORED!",
"Grand slam!", "Top of the 3rd inning", "And that's the ballgame — Red Sox
win!". Generated with the same Keith Hinton voice, normalized like intros.

**Acceptance criteria**
- `shared/calls/` folder (or per-team override) renders as a third button
  group; same drop-file workflow.
- Calls duck the music (song gain drops to ~30% during the call, restores
  after) rather than stopping it.
- Ships with ≥ 8 stock calls covering: run scored, home run, strikeout (ours),
  great catch, rally time, inning changes, game start (team announcement),
  game win.

### 2.3 Celebration songs (per-kid "he scored!" clip)
Each kid can optionally have a second clip (`celebrate/<kid>.mp3`). When the
kid on the card crosses the plate, long-press... no — a dedicated small
"🎉" button on the batter card plays it.

**Acceptance criteria**
- Optional per-kid celebration clip via folder convention; manifest exposes it.
- 🎉 button appears on the batter card only for kids who have a clip.
- Kids without one fall back to a shared `celebrate/default.mp3` if present,
  else the button is hidden.
- Same one-at-a-time + fade rules as walk-ups.

### 2.4 Between-innings party mode
Playlist that shuffles the `_full`-length cheer songs during warm-ups and
inning breaks, auto-fading when the DJ taps anything game-related.

**Acceptance criteria**
- "PARTY" toggle on the Game screen starts a shuffled queue from
  `shared/party/` (full-length tracks, seeded from `old/output/yt/cheer/_full`).
- Songs crossfade (~1s) between tracks; queue loops.
- Tapping a batter play / cheer / SFX fades party mode out and remembers it
  was on; a "resume party" chip appears after the interruption ends.
- Party mode never auto-resumes over a walk-up — only via the chip or toggle.

---

## Phase 3 — Season quality-of-life

### 3.1 Lineup presets
Coaches reuse orders. Save the current order under a name; load it later.

**Acceptance criteria**
- "Save as…" and "Load" on the Lineup screen (edit mode); presets stored in
  localStorage per team; delete supported.
- Loading a preset only sets the order — attendance stays whatever it is today.
- Max 10 presets; oldest-used shown last.

### 3.2 Share/onboard QR
Get bleacher parents onto the app with zero typing.

**Acceptance criteria**
- "Share" action in the topbar shows a QR of the team URL (generated locally,
  works offline) plus a native share-sheet button with a pre-written blurb
  ("Tap once while you have internet and you're game-ready forever").
- QR resolves to the team-specific hash URL.

### 3.3 Play stats for fun
Lightweight, local-only counters: most-played cheer, kid with most walk-ups
played, party-mode minutes. Rendered as a small "SEASON" card on the Lineup
screen. Pure fun, zero configuration.

**Acceptance criteria**
- Counters persist in localStorage per team; reset button exists.
- No stat tracking adds any tap to the game-day flow.

---

## Phase 4 — Multi-team / "not-a-SaaS" growth (parked until wanted)

The architecture already supports this (folders = teams, picker appears
automatically). If other coaches ask:

- **4.1 Second team onboarding doc** — a README recipe: fork/branch, add
  `leagues/<league>/<team>/`, push. AC: a non-programmer coach with a GitHub
  account gets live in <30 min following it.
- **4.2 Song-request flow** — parents submit YouTube links + timestamps via a
  Google Form; the clip skill batch-processes the sheet export. AC: one
  command turns the week's requests into normalized clips.
- **4.3 If it ever becomes a product**: hosted upload UI + team accounts —
  explicitly out of scope until strangers ask to pay. The moat today is the
  content pipeline (clip + announcer generation), not the player UI.

---

## Explicitly rejected (complexity traps)

- Scorekeeping, rotation, rulebook logic — Dugout died there.
- Realtime multi-phone sync — one phone owns the speaker; a second controller
  adds failure modes to solve a problem nobody has.
- Accounts/auth of any kind.
- On-demand TTS at the field — pre-generated clips are free, offline, and
  sound better.

## Suggested order

1.1 wake lock → 2.1 SFX board → 2.2 event calls → 2.4 party mode →
2.3 celebrations → 1.2 sunlight audit → 3.2 QR share → 3.1 presets → 3.3 stats.

Wake lock is first because a sleeping phone mid-game undermines everything
else; SFX/calls/party are the biggest fun-per-effort; Phase 3 rides along
whenever convenient.
