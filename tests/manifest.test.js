import { describe, it, expect } from 'vitest'
import { parseWalkupFilename, buildTeam } from '../scripts/manifest-lib.mjs'

describe('parseWalkupFilename', () => {
  it('parses normal Name - Artist - Title - walkup.mp3', () => {
    expect(parseWalkupFilename('Ajith - Drake - What Did I Miss (Clean) - walkup.mp3')).toEqual({
      player: 'Ajith',
      title: 'Drake - What Did I Miss (Clean)',
      placeholder: false,
    })
  })

  it('parses no-artist filename', () => {
    expect(parseWalkupFilename('Theo - The Avengers - walkup.mp3')).toEqual({
      player: 'Theo',
      title: 'The Avengers',
      placeholder: false,
    })
  })

  it('detects and strips the [placeholder] token', () => {
    expect(parseWalkupFilename('Blake - [placeholder] - Queen - We Will Rock You - walkup.mp3')).toEqual({
      player: 'Blake',
      title: 'Queen - We Will Rock You',
      placeholder: true,
    })
  })

  it('handles filename without trailing walkup token', () => {
    expect(parseWalkupFilename('Max - Michael Jackson - Beat It.mp3')).toEqual({
      player: 'Max',
      title: 'Michael Jackson - Beat It',
      placeholder: false,
    })
  })
})

describe('buildTeam', () => {
  const roster = {
    name: '9U Red Sox',
    players: [
      { name: 'Ajith', number: 8 },
      { name: 'Blake', number: null },
      { name: 'Zed', number: 99 },
    ],
  }
  const args = {
    roster,
    slug: '9u-red-sox',
    baseDir: 'leagues/mdba/9u-red-sox',
    walkupFiles: [
      'Ajith - Drake - What Did I Miss (Clean) - walkup.mp3',
      'Blake - [placeholder] - Queen - We Will Rock You - walkup.mp3',
    ],
    introFiles: ['ajith.mp3'],
    sharedCheers: ['Charge (Dodger Organ).mp3'],
    teamCheers: [],
  }

  it('matches players to walkups case-insensitively and builds urls', () => {
    const team = buildTeam(args)
    const ajith = team.players.find((p) => p.name === 'Ajith')
    expect(ajith.walkup.url).toBe(
      'leagues/mdba/9u-red-sox/walkup/Ajith - Drake - What Did I Miss (Clean) - walkup.mp3'
    )
    expect(ajith.walkup.placeholder).toBe(false)
    expect(ajith.number).toBe(8)
  })

  it('matches intros by lowercase player name', () => {
    const team = buildTeam(args)
    expect(team.players.find((p) => p.name === 'Ajith').intro).toBe(
      'leagues/mdba/9u-red-sox/intros/ajith.mp3'
    )
    expect(team.players.find((p) => p.name === 'Blake').intro).toBeNull()
  })

  it('keeps players with no walkup (null) and preserves null numbers', () => {
    const team = buildTeam(args)
    const zed = team.players.find((p) => p.name === 'Zed')
    expect(zed.walkup).toBeNull()
    const blake = team.players.find((p) => p.name === 'Blake')
    expect(blake.number).toBeNull()
    expect(blake.walkup.placeholder).toBe(true)
  })

  it('builds cheers from shared and team files with titles from filenames', () => {
    const team = buildTeam(args)
    expect(team.cheers).toEqual([
      { title: 'Charge (Dodger Organ)', url: 'shared/cheers/Charge (Dodger Organ).mp3' },
    ])
  })
})
