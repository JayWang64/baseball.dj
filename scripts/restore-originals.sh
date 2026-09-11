#!/usr/bin/env bash
# Revert the announcer-overlay treatment: put the clean songs back as walk-ups
# and restore the separate intro files, so the app plays announcer -> then song.
#
#   bash scripts/restore-originals.sh
#
# Then rebuild + commit + push.
set -euo pipefail
cd "$(dirname "$0")/.."

TEAM="public/leagues/mdba/9u-red-sox"

echo "Restoring clean songs into ${TEAM}/walkup ..."
for f in originals/2026/9u-red-sox/walkup/*.mp3; do
  case "$(basename "$f")" in "old - "*) continue ;; esac   # skip retired songs
  cp "$f" "${TEAM}/walkup/"
done

echo "Restoring separate intros into ${TEAM}/intros ..."
mkdir -p "${TEAM}/intros"
cp originals/2026/9u-red-sox/intros/*.mp3 "${TEAM}/intros/"

echo "Done. Now run: npm run build   (regenerates the manifest), then commit + push."
