# Originals (walk-up songs + announcer voices)

These are the **clean** source files, kept so we can revert the "announcer
overlaid on the song" treatment at any time.

- `walkup/` — each kid's song with **no** announcer baked in.
- `intros/` — each kid's announcer voice on its own (normalized to -14 LUFS).

The live app currently plays a **premixed overlay** (song + announcer ducked
on top, announcer starting at 1.5s) as each kid's walk-up. The build that
creates those lives in git history; these folders are the inputs.

## To go back to the old "announcer, THEN song" style

Run:

```
bash scripts/restore-originals.sh
```

That copies these clean songs back into the walk-up folder and restores the
separate intro files, so the app plays the announcer first and then the song
(the pre-overlay behavior). Then commit + push.
