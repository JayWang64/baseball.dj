// Generate announcer intro MP3s for players missing one.
//
// Usage:
//   node scripts/generate-intros.mjs leagues/mdba/9u-red-sox [--force <name>]
//
// Env:
//   ELEVENLABS_API_KEY   required to actually generate
//   ELEVENLABS_VOICE_ID  optional, defaults to "pNInz6obpgDQGcFmaJgB" (Adam — big announcer energy)
//
// Requires ffmpeg on PATH (loudness-normalizes each intro to match the music clips).

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

export function buildIntroText({ name, number, phonetic }) {
  const who = phonetic || name
  return number != null ? `Now batting… number ${number}… ${who}!` : `Now batting… ${who}!`
}

async function generate(teamRelDir, forceName) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const teamDir = join(root, 'public', teamRelDir)
  const rosterFile = join(teamDir, 'roster.json')
  if (!existsSync(rosterFile)) {
    console.error(`error: no roster.json at ${rosterFile}`)
    process.exit(1)
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.log('ELEVENLABS_API_KEY not set — skipping intro generation (app works without intros).')
    return
  }
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'

  const roster = JSON.parse(readFileSync(rosterFile, 'utf8'))
  const introDir = join(teamDir, 'intros')
  mkdirSync(introDir, { recursive: true })

  for (const player of roster.players) {
    const out = join(introDir, `${player.name.toLowerCase()}.mp3`)
    const force = forceName && forceName.toLowerCase() === player.name.toLowerCase()
    if (existsSync(out) && !force) {
      console.log(`skip: ${player.name} (exists)`)
      continue
    }

    const text = buildIntroText(player)
    console.log(`generate: ${player.name} — "${text}"`)
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.35, similarity_boost: 0.75, style: 0.6 },
        }),
      }
    )
    if (!res.ok) {
      console.error(`error: ElevenLabs ${res.status} for ${player.name}: ${await res.text()}`)
      process.exit(1)
    }
    writeFileSync(out, Buffer.from(await res.arrayBuffer()))

    // normalize to ~-14 LUFS so intros sit at the same level as the music clips
    const tmp = out + '.norm.mp3'
    execFileSync('ffmpeg', [
      '-y', '-i', out,
      '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11',
      '-codec:a', 'libmp3lame', '-qscale:a', '4',
      tmp,
    ], { stdio: 'pipe' })
    rmSync(out)
    renameSync(tmp, out)
  }
  console.log('done — re-run the build so the manifest picks the intros up.')
}

// run only when invoked as a CLI, not when imported by tests
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2)
  const teamRelDir = args.find((a) => !a.startsWith('--'))
  const forceIdx = args.indexOf('--force')
  const forceName = forceIdx !== -1 ? args[forceIdx + 1] : null
  if (!teamRelDir) {
    console.error('usage: node scripts/generate-intros.mjs leagues/<league>/<team> [--force <name>]')
    process.exit(1)
  }
  await generate(teamRelDir, forceName)
}
