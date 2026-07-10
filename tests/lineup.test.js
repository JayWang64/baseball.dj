import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { createLineup } from '../src/lib/lineup.js'

function fakeStorage() {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  }
}

let storage, lineup

beforeEach(() => {
  storage = fakeStorage()
  lineup = createLineup(storage)
  lineup.init('mdba/9u-red-sox')
})

describe('lineup store', () => {
  it('toggle adds players in tap order and removes them', () => {
    lineup.toggle('Max')
    lineup.toggle('Ajith')
    lineup.toggle('Theo')
    expect(get(lineup).order).toEqual(['Max', 'Ajith', 'Theo'])
    lineup.toggle('Ajith')
    expect(get(lineup).order).toEqual(['Max', 'Theo'])
  })

  it('move swaps neighbors and clamps at the ends', () => {
    lineup.toggle('Max')
    lineup.toggle('Ajith')
    lineup.toggle('Theo')
    lineup.move('Theo', -1)
    expect(get(lineup).order).toEqual(['Max', 'Theo', 'Ajith'])
    lineup.move('Max', -1)
    expect(get(lineup).order).toEqual(['Max', 'Theo', 'Ajith'])
    lineup.move('Ajith', 1)
    expect(get(lineup).order).toEqual(['Max', 'Theo', 'Ajith'])
  })

  it('advance and back wrap around the order', () => {
    lineup.toggle('Max')
    lineup.toggle('Ajith')
    lineup.toggle('Theo')
    lineup.advance()
    expect(get(lineup).batterIndex).toBe(1)
    lineup.advance()
    lineup.advance()
    expect(get(lineup).batterIndex).toBe(0)
    lineup.back()
    expect(get(lineup).batterIndex).toBe(2)
  })

  it('adjusts batterIndex when a player before the current batter is removed', () => {
    lineup.toggle('Max')
    lineup.toggle('Ajith')
    lineup.toggle('Theo')
    lineup.advance()
    lineup.advance() // batting: Theo (index 2)
    lineup.toggle('Max') // remove someone earlier in the order
    expect(get(lineup).order).toEqual(['Ajith', 'Theo'])
    expect(get(lineup).batterIndex).toBe(1) // still Theo
  })

  it('resets batterIndex to 0 when the current batter is removed past the end', () => {
    lineup.toggle('Max')
    lineup.toggle('Ajith')
    lineup.advance() // batting Ajith (index 1)
    lineup.toggle('Ajith')
    expect(get(lineup).batterIndex).toBe(0)
  })

  it('round-trips through storage per team key', () => {
    lineup.toggle('Max')
    lineup.advance()
    const fresh = createLineup(storage)
    fresh.init('mdba/9u-red-sox')
    expect(get(fresh)).toEqual({ order: ['Max'], batterIndex: 0 })
    const other = createLineup(storage)
    other.init('mdba/other-team')
    expect(get(other).order).toEqual([])
  })
})
