import { describe, expect, it } from 'vitest'
import type { ClosedTrade } from '../../domain/types'
import {
  breakevenSellPriceWithExcess,
  closedTradeExcessUsd,
  excessCreditBySymbol,
  isIntermediateClosedTrade,
  latestOpenBoughtAtMs,
} from '../excessCredit'

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

const openLotsAfterJune15 = new Map([
  ['AAPL', [{ boughtAt: '2026-06-15T10:00:00Z' }]],
])

describe('excessCredit', () => {
  it('excedente por contrato cuando la venta supera el 1,5% planificado', () => {
    // 50.01 × 1.015 = 50.76 → (53 − 50.76) × 80 ≈ 179.20
    const excess = closedTradeExcessUsd(closed({}))
    expect(excess).toBeCloseTo(179.2, 1)
  })

  it('sin excedente si la venta no supera el objetivo 1,5%', () => {
    expect(closedTradeExcessUsd(closed({ exitPrice: 50.75 }))).toBe(0)
  })

  it('cierre intermedio: compra y venta después de todos los lotes abiertos', () => {
    const latest = latestOpenBoughtAtMs([{ boughtAt: '2026-06-15T10:00:00Z' }])
    expect(isIntermediateClosedTrade(closed({}), latest)).toBe(true)
    expect(
      isIntermediateClosedTrade(
        closed({ boughtAt: '2026-06-14T10:00:00Z', soldAt: '2026-06-25T15:00:00Z' }),
        latest,
      ),
    ).toBe(false)
    expect(
      isIntermediateClosedTrade(
        closed({ boughtAt: '2026-06-25T10:00:00Z', soldAt: '2026-06-20T11:00:00Z' }),
        latestOpenBoughtAtMs([{ boughtAt: '2026-06-22T10:00:00Z' }]),
      ),
    ).toBe(false)
  })

  it('no cuenta cierre si hay un lote abierto más reciente que la operación', () => {
    const openLots = new Map([
      [
        'AAPL',
        [{ boughtAt: '2026-06-15T10:00:00Z' }, { boughtAt: '2026-06-28T10:00:00Z' }],
      ],
    ])
    const map = excessCreditBySymbol([closed({})], openLots)
    expect(map.get('AAPL')).toBeUndefined()
  })

  it('agrupa excedente solo de cierres posteriores a lotes abiertos', () => {
    const map = excessCreditBySymbol(
      [
        closed({ symbol: 'AAPL', quantity: 80, exitPrice: 53 }),
        closed({ id: 'c2', symbol: 'TQQQ', quantity: 10, entryPrice: 100, exitPrice: 104 }),
        closed({ id: 'c3', symbol: 'AAPL', quantity: 5, entryPrice: 100, exitPrice: 101 }),
      ],
      new Map([
        ['AAPL', [{ boughtAt: '2026-06-15T10:00:00Z' }]],
        ['TQQQ', [{ boughtAt: '2026-06-01T10:00:00Z' }]],
      ]),
    )
    expect(map.get('AAPL')).toBeCloseTo(179.2, 1)
    expect(map.get('TQQQ')).toBeGreaterThan(0)
  })

  it('precio even con excedente — ejemplo Apple 1000 @ 100 + 80 cerrados', () => {
    const excess = closedTradeExcessUsd(closed({ quantity: 80, entryPrice: 50, exitPrice: 53 }))
    const { price, coversOpen } = breakevenSellPriceWithExcess(100_000, 1000, excess)
    expect(coversOpen).toBe(false)
    expect(price).toBeCloseTo(99.82, 2)
  })

  it('marca cubierto cuando el excedente supera el costo abierto', () => {
    const { price, coversOpen } = breakevenSellPriceWithExcess(1000, 10, 1500)
    expect(coversOpen).toBe(true)
    expect(price).toBe(0)
  })
})
