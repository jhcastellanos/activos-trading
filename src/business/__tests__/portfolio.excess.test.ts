import { describe, expect, it } from 'vitest'
import { groupOpenPositions } from '../portfolio'
import type { ClosedTrade, TradeLot } from '../../domain/types'

function lot(overrides: Partial<TradeLot>): TradeLot {
  return {
    id: 'l1',
    symbol: 'AAPL',
    boughtAt: '2026-06-15T10:00:00Z',
    quantity: 1000,
    remainingQty: 1000,
    avgBuyPrice: 100,
    status: 'open',
    ...overrides,
  }
}

function closed(overrides: Partial<ClosedTrade>): ClosedTrade {
  return {
    id: 'c1',
    symbol: 'AAPL',
    boughtAt: '2026-06-20T10:00:00Z',
    soldAt: '2026-06-25T15:00:00Z',
    quantity: 80,
    entryPrice: 50,
    exitPrice: 53,
    pnlUsd: 240,
    pnlPct: 6,
    durationMs: 0,
    closeMethod: 'demo',
    ...overrides,
  }
}

describe('groupOpenPositions excess credit', () => {
  it('refleja excedente y venta even en el agregado del símbolo', () => {
    const groups = groupOpenPositions(
      [lot({ boughtAt: '2026-06-15T10:00:00Z' })],
      { AAPL: 98 },
      [closed({})],
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].aggregate.excessCreditUsd).toBeCloseTo(179.2, 1)
    expect(groups[0].aggregate.breakevenSellPrice).toBeCloseTo(99.82, 2)
    expect(groups[0].aggregate.excessCoversOpen).toBe(false)
  })

  it('ignora cierres anteriores a la compra más reciente abierta', () => {
    const groups = groupOpenPositions(
      [
        lot({ boughtAt: '2026-06-15T10:00:00Z' }),
        lot({ id: 'l2', boughtAt: '2026-06-28T10:00:00Z', quantity: 5, remainingQty: 5 }),
      ],
      { AAPL: 98 },
      [closed({})],
    )
    expect(groups[0].aggregate.excessCreditUsd).toBe(0)
  })
})
