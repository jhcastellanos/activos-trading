import { describe, expect, it } from 'vitest'
import { dedupeScalpingCatalog } from '../dedupeScalpingCatalog'
import { SCALPING_CATALOG_RAW } from '../../services/mock/scalpingAssetCatalog'

describe('dedupeScalpingCatalog', () => {
  it('elimina activos que comparten el mismo ETF bull', () => {
    const entries = [
      {
        symbol: 'AMD',
        name: 'AMD Direxion',
        sector: 'semiconductores' as const,
        tradeBull: 'AMUU',
        tradeLeverage: 2 as const,
        tradeBullIssuer: 'direxion' as const,
        price: 100,
        nav: 100,
        avgDailyRangePct: 3,
        turnoverPct: 10,
      },
      {
        symbol: 'AMD2',
        name: 'AMD Granite',
        sector: 'semiconductores' as const,
        tradeBull: 'AMDL',
        tradeLeverage: 2 as const,
        tradeBullIssuer: 'graniteshares' as const,
        price: 100,
        nav: 100,
        avgDailyRangePct: 3,
        turnoverPct: 10,
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA',
        sector: 'ia' as const,
        tradeBull: 'AMUU',
        tradeLeverage: 2 as const,
        tradeBullIssuer: 'other' as const,
        price: 100,
        nav: 100,
        avgDailyRangePct: 4,
        turnoverPct: 12,
      },
    ]
    const result = dedupeScalpingCatalog(entries)
    expect(result.filter((r) => r.tradeBull === 'AMUU')).toHaveLength(1)
    expect(result.find((r) => r.symbol === 'AMD')?.tradeBull).toBe('AMUU')
    expect(result.find((r) => r.symbol === 'NVDA')).toBeUndefined()
    expect(result.find((r) => r.symbol === 'AMD2')?.tradeBull).toBe('AMDL')
  })

  it('catálogo demo no repite bulls', () => {
    const result = dedupeScalpingCatalog(SCALPING_CATALOG_RAW)
    const bulls = result.map((r) => r.tradeBull)
    expect(new Set(bulls).size).toBe(bulls.length)
    expect(result.length).toBeGreaterThan(35)
  })
})
