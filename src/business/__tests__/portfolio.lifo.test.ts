import { describe, expect, it } from 'vitest'
import { enrichLots } from '../portfolio'
import type { TradeLot } from '../../domain/types'

const lot = (id: string, symbol: string, boughtAt: string): TradeLot => ({
  id,
  symbol,
  boughtAt,
  quantity: 10,
  remainingQty: 10,
  avgBuyPrice: 100,
  status: 'open',
})

describe('enrichLots LIFO por activo', () => {
  it('asigna prioridad 1 a la compra más reciente de cada símbolo', () => {
    const lots = [
      lot('a-old', 'AAPL', '2026-06-01T10:00:00Z'),
      lot('a-new', 'AAPL', '2026-06-04T10:00:00Z'),
      lot('t-new', 'TQQQ', '2026-06-03T10:00:00Z'),
      lot('t-old', 'TQQQ', '2026-06-02T10:00:00Z'),
    ]
    const enriched = enrichLots(lots, { AAPL: 102, TQQQ: 50 })

    const aaplNew = enriched.find((l) => l.id === 'a-new')
    const aaplOld = enriched.find((l) => l.id === 'a-old')
    const tqqqNew = enriched.find((l) => l.id === 't-new')
    const tqqqOld = enriched.find((l) => l.id === 't-old')

    expect(aaplNew?.sellPriority).toBe(1)
    expect(aaplNew?.sellFirst).toBe(true)
    expect(aaplOld?.sellPriority).toBe(2)

    expect(tqqqNew?.sellPriority).toBe(1)
    expect(tqqqNew?.sellFirst).toBe(true)
    expect(tqqqOld?.sellPriority).toBe(2)
  })
})
