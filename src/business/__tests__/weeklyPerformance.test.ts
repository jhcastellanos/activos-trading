import { describe, expect, it } from 'vitest'
import type { ClosedTrade } from '../../domain/types'
import { buildWeeklyPerformance } from '../weeklyPerformance'

const trade = (soldAt: string, pnlUsd: number, pnlPct: number): ClosedTrade => ({
  id: soldAt,
  symbol: 'X',
  boughtAt: '2026-05-01T10:00:00Z',
  soldAt,
  quantity: 1,
  entryPrice: 100,
  exitPrice: 100 + pnlUsd,
  pnlUsd,
  pnlPct,
  durationMs: 1000,
  closeMethod: 'demo',
})

describe('buildWeeklyPerformance', () => {
  it('agrupa por día de venta (ET)', () => {
    const trades = [
      trade('2026-06-02T14:00:00Z', 100, 1.5),
      trade('2026-06-02T18:00:00Z', 50, 2),
      trade('2026-06-03T14:00:00Z', -30, -1),
    ]
    const soldOnDate = (iso: string) => iso.slice(0, 10)

    const w = buildWeeklyPerformance(trades, soldOnDate, '2026-06-04')

    const tue = w.days.find((d) => d.date === '2026-06-02')!
    expect(tue.pnlUsd).toBe(150)
    expect(tue.tradeCount).toBe(2)
    expect(tue.avgPct).toBe(1.75)

    const wed = w.days.find((d) => d.date === '2026-06-03')!
    expect(wed.pnlUsd).toBe(-30)
    expect(wed.tradeCount).toBe(1)
  })
})
