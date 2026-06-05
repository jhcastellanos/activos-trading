import { describe, expect, it } from 'vitest'
import { ALLOWED_SCALPING_SECTORS, isAllowedScalpingSector } from '../scalpingSectors'

describe('scalpingSectors', () => {
  it('incluye los 8 sectores con tendencia', () => {
    expect(ALLOWED_SCALPING_SECTORS).toHaveLength(8)
    expect(isAllowedScalpingSector('ia')).toBe(true)
    expect(isAllowedScalpingSector('tecnologicas')).toBe(true)
  })
})
