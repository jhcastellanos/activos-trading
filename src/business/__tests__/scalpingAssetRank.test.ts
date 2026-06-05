import { describe, expect, it } from 'vitest'
import type { AssetScalpingProfile } from '../../domain/types'
import { MOCK_SCALPING_UNIVERSE } from '../../services/mock/scalpingAssetSeed'
import { isAllowedScalpingSector } from '../scalpingSectors'
import { classifyTurnover } from '../turnoverTier'
import { navDiscountPct, rankScalpingUniverse, scalpJuiceScore } from '../scalpingAssetRank'

const asset = (
  symbol: string,
  overrides: Partial<AssetScalpingProfile> = {},
): AssetScalpingProfile => ({
  symbol,
  name: symbol,
  sector: 'tecnologicas',
  tradeBull: 'TQQQ',
  tradeLeverage: 3,
  tradeBullIssuer: 'direxion',
  price: 100,
  nav: 100,
  avgDailyRangePct: 2,
  turnoverPct: 8,
  ...overrides,
})

describe('classifyTurnover', () => {
  it('clasifica los cuatro niveles', () => {
    expect(classifyTurnover(3)).toBe('normal')
    expect(classifyTurnover(8)).toBe('active')
    expect(classifyTurnover(20)).toBe('very_active')
    expect(classifyTurnover(35)).toBe('extreme')
  })
})

describe('navDiscountPct', () => {
  it('positivo cuando precio está bajo NAV', () => {
    expect(navDiscountPct(8.24, 10.52)).toBeCloseTo(21.67, 1)
  })
})

describe('rankScalpingUniverse', () => {
  it('devuelve top 50 global sin bulls repetidos en universo', () => {
    const r = rankScalpingUniverse(MOCK_SCALPING_UNIVERSE, 50)
    const bulls = r.top.map((a) => a.tradeBull)
    expect(new Set(bulls).size).toBe(bulls.length)
    expect(r.top.every((a) => isAllowedScalpingSector(a.sector))).toBe(true)
  })

  it('filtra por sector con top 10', () => {
    const r = rankScalpingUniverse(MOCK_SCALPING_UNIVERSE, 10, 'ia')
    expect(r.top.length).toBeLessThanOrEqual(10)
    expect(r.top.every((a) => a.sector === 'ia')).toBe(true)
  })

  it('ordena por jugosidad', () => {
    const universe = [
      asset('QQQ', { avgDailyRangePct: 1.2, turnoverPct: 6, tradeBull: 'SPXL', tradeLeverage: 3 }),
      asset('NVDA', {
        sector: 'ia',
        avgDailyRangePct: 3.8,
        turnoverPct: 18,
        tradeBull: 'NVDU',
        tradeLeverage: 2,
      }),
    ]
    const r = rankScalpingUniverse(universe, 10)
    expect(r.top[0].symbol).toBe('NVDA')
  })

  it('prioriza range y turnover para scalping', () => {
    const low = scalpJuiceScore(asset('A', { avgDailyRangePct: 1, turnoverPct: 3 }), 5)
    const high = scalpJuiceScore(asset('B', { avgDailyRangePct: 5, turnoverPct: 25 }), 5)
    expect(high).toBeGreaterThan(low)
  })
})
