import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { createLineup, presentNames } from '../src/lib/lineup.js'

function fakeStorage() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  }
}

const ROSTER = ['Max', 'Ajith', 'Theo', 'Hugo']

let storage, lineup

beforeEach(() => {
  storage = fakeStorage()
  lineup = createLineup(storage)
  lineup.init('mdba/9u-red-sox', ROSTER)
})

describe('lineup store (attendance model)', () => {
  it('seeds the full roster as present on first load', () => {
    expect(get(lineup).order).toEqual(ROSTER)
    expect(get(lineup).absent).toEqual([])
  })

  it('toggle marks a kid absent in place — the order never changes', () => {
    lineup.toggle('Ajith')
    expect(get(lineup).order).toEqual(ROSTER)
    expect(get(lineup).absent).toEqual(['Ajith'])
    expect(presentNames(get(lineup))).toEqual(['Max', 'Theo', 'Hugo'])
    lineup.toggle('Ajith')
    expect(get(lineup).absent).toEqual([])
  })

  it('selectAll clears all absences', () => {
    lineup.toggle('Ajith')
    lineup.toggle('Hugo')
    lineup.selectAll()
    expect(get(lineup).absent).toEqual([])
  })

  it('reorder moves a kid to the target slot', () => {
    lineup.reorder('Hugo', 'Ajith')
    expect(get(lineup).order).toEqual(['Max', 'Hugo', 'Ajith', 'Theo'])
    lineup.reorder('Max', 'Theo')
    expect(get(lineup).order).toEqual(['Hugo', 'Ajith', 'Theo', 'Max'])
    lineup.reorder('Max', 'Nobody')
    expect(get(lineup).order).toEqual(['Hugo', 'Ajith', 'Theo', 'Max'])
  })

  it('advance and back wrap around the PRESENT kids only', () => {
    lineup.toggle('Ajith') // present: Max, Theo, Hugo
    lineup.advance()
    expect(get(lineup).batterIndex).toBe(1)
    lineup.advance()
    lineup.advance()
    expect(get(lineup).batterIndex).toBe(0)
    lineup.back()
    expect(get(lineup).batterIndex).toBe(2)
  })

  it('clamps batterIndex when the count of present kids shrinks below it', () => {
    lineup.advance()
    lineup.advance()
    lineup.advance() // batterIndex 3
    lineup.toggle('Ajith')
    lineup.toggle('Hugo') // 2 present, index 3 invalid
    expect(get(lineup).batterIndex).toBe(0)
  })

  it('round-trips through storage; saved state wins over roster default', () => {
    lineup.toggle('Theo')
    lineup.reorder('Hugo', 'Max')
    const fresh = createLineup(storage)
    fresh.init('mdba/9u-red-sox', ROSTER)
    expect(get(fresh).order).toEqual(['Hugo', 'Max', 'Ajith', 'Theo'])
    expect(get(fresh).absent).toEqual(['Theo'])
  })

  it('jumpTo selects a present batter by index and ignores out-of-range', () => {
    lineup.toggle('Ajith') // present: Max, Theo, Hugo
    lineup.jumpTo(2)
    expect(get(lineup).batterIndex).toBe(2)
    lineup.jumpTo(5)
    expect(get(lineup).batterIndex).toBe(2)
    lineup.jumpTo(-1)
    expect(get(lineup).batterIndex).toBe(2)
  })

  it('persists the locked flag', () => {
    lineup.setLocked(true)
    const fresh = createLineup(storage)
    fresh.init('mdba/9u-red-sox', ROSTER)
    expect(get(fresh).locked).toBe(true)
  })
})
