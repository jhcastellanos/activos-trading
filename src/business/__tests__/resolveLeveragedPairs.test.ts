import { describe, expect, it } from 'vitest'
import type { LeveragedEtfEntry } from '../leveragedEtfCatalog'
import { resolveLeveragedPairs } from '../resolveLeveragedPairs'

describe('resolveLeveragedPairs', () => {
  it('prioriza Direxion para QQQ', () => {
    const pairs = resolveLeveragedPairs('QQQ')
    expect(pairs.tradeX2).toBe('QLD')
    expect(pairs.tradeX2Issuer).toBe('direxion')
    expect(pairs.tradeX3).toBe('TQQQ')
    expect(pairs.tradeX3Issuer).toBe('direxion')
  })

  it('elige Direxion x3 y other x2 cuando no hay x2 Direxion', () => {
    const pairs = resolveLeveragedPairs('SOXX')
    expect(pairs.tradeX3).toBe('SOXL')
    expect(pairs.tradeX3Issuer).toBe('direxion')
    expect(pairs.tradeX2).toBe('USD')
    expect(pairs.tradeX2Issuer).toBe('other')
  })

  it('respeta orden Defiance en energía nuclear x2', () => {
    const pairs = resolveLeveragedPairs('URA')
    expect(pairs.tradeX2).toBe('URAX')
    expect(pairs.tradeX2Issuer).toBe('defiance')
  })

  it('prioriza Direxion para XLK tecnológicas', () => {
    const pairs = resolveLeveragedPairs('XLK')
    expect(pairs.tradeX2).toBe('QLD')
    expect(pairs.tradeX3).toBe('TQQQ')
  })

  it('respeta orden custom en catálogo de prueba', () => {
    const catalog: LeveragedEtfEntry[] = [
      { baseSymbol: 'TEST', symbol: 'OTHER2', leverage: 2, issuer: 'other' },
      { baseSymbol: 'TEST', symbol: 'GRAN2', leverage: 2, issuer: 'graniteshares' },
      { baseSymbol: 'TEST', symbol: 'DIR3', leverage: 3, issuer: 'direxion' },
      { baseSymbol: 'TEST', symbol: 'DEF3', leverage: 3, issuer: 'defiance' },
    ]
    const pairs = resolveLeveragedPairs('TEST', catalog)
    expect(pairs.tradeX2).toBe('GRAN2')
    expect(pairs.tradeX3).toBe('DIR3')
  })
})
