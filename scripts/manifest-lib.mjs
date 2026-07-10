const PLACEHOLDER = '[placeholder]'

export function parseWalkupFilename(basename) {
  const stem = basename.replace(/\.mp3$/i, '')
  let parts = stem.split(' - ').map((s) => s.trim())
  if (parts[parts.length - 1].toLowerCase() === 'walkup') parts = parts.slice(0, -1)
  const player = parts[0]
  let rest = parts.slice(1)
  const placeholder = rest.some((p) => p.toLowerCase() === PLACEHOLDER)
  rest = rest.filter((p) => p.toLowerCase() !== PLACEHOLDER)
  return { player, title: rest.join(' - '), placeholder }
}

function cheerEntry(dir, file) {
  return { title: file.replace(/\.mp3$/i, ''), url: `${dir}/${file}` }
}

export function buildTeam({ roster, slug, baseDir, walkupFiles, introFiles, sharedCheers, teamCheers }) {
  const walkups = walkupFiles.map((f) => ({ file: f, ...parseWalkupFilename(f) }))
  const intros = new Set(introFiles.map((f) => f.toLowerCase()))

  const players = roster.players.map((p) => {
    const w = walkups.find((x) => x.player.toLowerCase() === p.name.toLowerCase())
    const introFile = `${p.name.toLowerCase()}.mp3`
    return {
      name: p.name,
      number: p.number ?? null,
      walkup: w
        ? { url: `${baseDir}/walkup/${w.file}`, title: w.title, placeholder: w.placeholder }
        : null,
      intro: intros.has(introFile) ? `${baseDir}/intros/${introFile}` : null,
    }
  })

  const cheers = [
    ...sharedCheers.map((f) => cheerEntry('shared/cheers', f)),
    ...teamCheers.map((f) => cheerEntry(`${baseDir}/cheers`, f)),
  ]

  return { slug, name: roster.name, players, cheers }
}
