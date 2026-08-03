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
cp originals/walkup/*.mp3 "${TEAM}/walkup/"

echo "Restoring separate intros into ${TEAM}/intros ..."
mkdir -p "${TEAM}/intros"
cp originals/intros/*.mp3 "${TEAM}/intros/"

echo "Done. Now run: npm run build   (regenerates the manifest), then commit + push."
