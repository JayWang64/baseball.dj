import { describe, it, expect } from 'vitest'
import { buildIntroText } from '../scripts/generate-intros.mjs'

describe('buildIntroText', () => {
  it('announces number and name', () => {
    expect(buildIntroText({ name: 'Ajith', number: 8 })).toBe(
      'Now batting… number 8… Ajith!'
    )
  })

  it('skips the number, not the kid, when number is missing', () => {
    expect(buildIntroText({ name: 'Blake', number: null })).toBe('Now batting… Blake!')
  })

  it('uses phonetic spelling for pronunciation when provided', () => {
    expect(buildIntroText({ name: 'Shayen', number: null, phonetic: 'SHY-en' })).toBe(
      'Now batting… SHY-en!'
    )
  })
})
