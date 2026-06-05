import { describe, expect, it } from 'vitest'
import { buildSymbolAggregate } from '../portfolio'
import type { EnrichedLot } from '../../domain/types'

function mockLot(overrides: Partial<EnrichedLot>): EnrichedLot {
  return {
    id: '1',
    symbol: 'AAPL',
    boughtAt: '2026-06-01T00:00:00Z',
    quantity: 10,
    remainingQty: 10,
    avgBuyPrice: 100,
    status: 'open',
    investedUsd: 1000,
    targetSellPrice: 101.5,
    targetProfitPct: 1.5,
    estimatedProfitUsd: 15,
    currentPrice: 102,
    distanceToTargetUsd: 0,
    distanceToTargetPct: 0,
    targetState: 'reached',
    adjustedBuyPrice: 100.01,
    currentProfitPct: 2,
    sellPriority: 1,
    sellFirst: true,
    ...overrides,
  }
}

describe('buildSymbolAggregate', () => {
  it('usa precio promedio ponderado para el 1.5% total', () => {
    const lots = [
      mockLot({ remainingQty: 10, avgBuyPrice: 100, investedUsd: 1000, currentPrice: 102 }),
      mockLot({
        id: '2',
        remainingQty: 10,
        avgBuyPrice: 200,
        investedUsd: 2000,
        currentPrice: 102,
        targetState: 'far',
        sellPriority: 2,
        sellFirst: false,
      }),
    ]
    const agg = buildSymbolAggregate(lots)
    expect(agg.avgBuyPriceRaw).toBe(150)
    expect(agg.avgBuyPrice).toBe(150.01) // +0.01
    expect(agg.targetSellPrice).toBe(152.26) // 150.01 * 1.015
    expect(agg.currentProfitPct).toBeCloseTo(-32.01, 1)
  })
})
