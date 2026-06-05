import { describe, expect, it } from 'vitest'
import { assignSellPriority, sortLotsLifo } from '../lifo'
import type { TradeLot } from '../../domain/types'

const lot = (id: string, boughtAt: string): TradeLot => ({
  id,
  symbol: 'AAPL',
  boughtAt,
  quantity: 10,
  remainingQty: 10,
  avgBuyPrice: 100,
  status: 'open',
})

describe('sortLotsLifo', () => {
  it('ordena última compra primero', () => {
    const lots = [
      lot('1', '2026-06-01T10:00:00Z'),
      lot('2', '2026-06-03T10:00:00Z'),
      lot('3', '2026-06-02T10:00:00Z'),
    ]
    const sorted = sortLotsLifo(lots)
    expect(sorted.map((l) => l.id)).toEqual(['2', '3', '1'])
  })
})

describe('assignSellPriority', () => {
  it('marca sellFirst en el lote más reciente', () => {
    const lots = [lot('1', '2026-06-01T10:00:00Z'), lot('2', '2026-06-04T10:00:00Z')]
    const result = assignSellPriority(lots)
    expect(result.find((l) => l.id === '2')?.sellFirst).toBe(true)
    expect(result.find((l) => l.id === '2')?.sellPriority).toBe(1)
  })
})
