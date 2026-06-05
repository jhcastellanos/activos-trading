import { describe, expect, it } from 'vitest'
import type { ClosedTrade } from '../../domain/types'
import { buildTradeStreak } from '../tradeStreak'
import { tradeResultTier } from '../tradeResultTier'

const t = (id: string, pnlPct: number, pnlUsd: number): ClosedTrade => ({
  id,
  symbol: 'X',
  boughtAt: '2026-06-01T10:00:00Z',
  soldAt: `2026-06-0${id}T14:00:00Z`,
  quantity: 1,
  entryPrice: 100,
  exitPrice: 100,
  pnlUsd,
  pnlPct,
  durationMs: 1000,
  closeMethod: 'demo',
})

describe('tradeResultTier', () => {
  it('asigna amarillo, verde, azul y pérdida', () => {
    expect(tradeResultTier(0.8)).toBe('yellow')
    expect(tradeResultTier(1.5)).toBe('green')
    expect(tradeResultTier(2)).toBe('green')
    expect(tradeResultTier(2.01)).toBe('blue')
    expect(tradeResultTier(-1)).toBe('loss')
  })
})

describe('buildTradeStreak', () => {
  it('ordena por venta reciente y calcula rachas', () => {
    const trades = [
      t('5', 1.6, 10),
      t('4', 1.7, 12),
      t('3', -2, -8),
      t('2', 2.5, 20),
      t('1', 0.5, 3),
    ]
    const r = buildTradeStreak(trades, 4)
    expect(r.tiles).toHaveLength(4)
    expect(r.tiles[0].id).toBe('5')
    expect(r.streaks.activeType).toBe('win')
    expect(r.streaks.activeCount).toBe(2)
  })
})
