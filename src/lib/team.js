import { writable } from 'svelte/store'
import manifest from './manifest.json'

const LS_KEY = 'dj.team'

export function teams() {
  return manifest.leagues.flatMap((league) =>
    league.teams.map((team) => ({ league, team }))
  )
}

function findTeam(leagueSlug, teamSlug) {
  const league = manifest.leagues.find((l) => l.slug === leagueSlug)
  const team = league?.teams.find((t) => t.slug === teamSlug)
  return team ? { league, team } : null
}

function fromKey(key) {
  if (!key) return null
  const [l, t] = key.split('/')
  return findTeam(l, t)
}

function resolveInitial() {
  const hash = location.hash.replace(/^#\//, '')
  return (
    fromKey(hash) ||
    fromKey(localStorage.getItem(LS_KEY)) ||
    (teams().length === 1 ? teams()[0] : null)
  )
}

export const currentTeam = writable(resolveInitial())

export function selectTeam(leagueSlug, teamSlug) {
  const found = findTeam(leagueSlug, teamSlug)
  if (!found) return
  localStorage.setItem(LS_KEY, `${leagueSlug}/${teamSlug}`)
  location.hash = `#/${leagueSlug}/${teamSlug}`
  currentTeam.set(found)
}

export function teamKey(sel) {
  return sel ? `${sel.league.slug}/${sel.team.slug}` : null
}

currentTeam.subscribe((sel) => {
  if (sel) {
    const want = `#/${teamKey(sel)}`
    if (location.hash !== want) location.hash = want
  }
})
