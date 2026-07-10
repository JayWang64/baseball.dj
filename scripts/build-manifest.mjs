import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTeam } from './manifest-lib.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')

const mp3s = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.mp3')) : []
const dirs = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    : []
const json = (file) => JSON.parse(readFileSync(file, 'utf8'))

const sharedCheers = mp3s(join(pub, 'shared', 'cheers'))
const leagues = []

for (const leagueSlug of dirs(join(pub, 'leagues'))) {
  const leagueDir = join(pub, 'leagues', leagueSlug)
  const leagueMeta = existsSync(join(leagueDir, 'league.json'))
    ? json(join(leagueDir, 'league.json'))
    : { name: leagueSlug }
  const teams = []

  for (const teamSlug of dirs(leagueDir)) {
    const teamDir = join(leagueDir, teamSlug)
    const rosterFile = join(teamDir, 'roster.json')
    if (!existsSync(rosterFile)) {
      console.warn(`warn: ${leagueSlug}/${teamSlug} has no roster.json — skipped`)
      continue
    }
    const team = buildTeam({
      roster: json(rosterFile),
      slug: teamSlug,
      baseDir: `leagues/${leagueSlug}/${teamSlug}`,
      walkupFiles: mp3s(join(teamDir, 'walkup')),
      introFiles: mp3s(join(teamDir, 'intros')),
      sharedCheers,
      teamCheers: mp3s(join(teamDir, 'cheers')),
    })
    for (const p of team.players) {
      if (!p.walkup) console.warn(`warn: ${team.name}: ${p.name} has no walkup clip`)
      if (!p.intro) console.warn(`warn: ${team.name}: ${p.name} has no announcer intro`)
    }
    teams.push(team)
  }

  if (teams.length) leagues.push({ slug: leagueSlug, name: leagueMeta.name, teams })
}

const out = join(root, 'src', 'lib', 'manifest.json')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ leagues }, null, 2))
console.log(
  `manifest: ${leagues.length} league(s), ` +
    leagues.map((l) => l.teams.map((t) => `${t.name} (${t.players.length} players, ${t.cheers.length} cheers)`).join(', ')).join('; ')
)
