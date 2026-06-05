import type { AccountSummary, ClosedTrade, DailySnapshot, TradeLot } from '../../domain/types'

export const MOCK_ACCOUNT: AccountSummary = {
  totalValue: 52480.5,
  dayChangeUsd: 312.4,
  dayChangePct: 0.6,
  realizedPnl: 1840.2,
  unrealizedPnl: 920.15,
  openPositionsCount: 6,
  asOf: new Date().toISOString(),
}

/** Ejemplos: verde (≥1.5%), amarillo (0–1.49%), rojo (<0%). */
export const MOCK_LOTS: TradeLot[] = [
  // AAPL — mezcla de los tres estados
  {
    id: 'lot-aapl-1',
    symbol: 'AAPL',
    boughtAt: '2026-06-04T10:15:00Z',
    quantity: 10,
    remainingQty: 10,
    avgBuyPrice: 188.4,
    status: 'open',
  },
  {
    id: 'lot-aapl-2',
    symbol: 'AAPL',
    boughtAt: '2026-06-02T15:00:00Z',
    quantity: 15,
    remainingQty: 15,
    avgBuyPrice: 200.0,
    status: 'open',
  },
  {
    id: 'lot-aapl-3',
    symbol: 'AAPL',
    boughtAt: '2026-05-28T14:30:00Z',
    quantity: 20,
    remainingQty: 20,
    avgBuyPrice: 210.0,
    status: 'open',
  },
  // NVDA — cumple (verde)
  {
    id: 'lot-nvda-1',
    symbol: 'NVDA',
    boughtAt: '2026-06-01T16:00:00Z',
    quantity: 8,
    remainingQty: 8,
    avgBuyPrice: 118.2,
    status: 'open',
  },
  // TSLA — posición total en rojo
  {
    id: 'lot-tsla-1',
    symbol: 'TSLA',
    boughtAt: '2026-06-03T11:00:00Z',
    quantity: 5,
    remainingQty: 5,
    avgBuyPrice: 285.0,
    status: 'open',
  },
]

export const MOCK_QUOTES: Record<string, number> = {
  AAPL: 201.3,
  NVDA: 122.5,
  TSLA: 268.0,
}

export const MOCK_CLOSED: ClosedTrade[] = [
  {
    id: 'ct-1',
    symbol: 'MSFT',
    boughtAt: '2026-05-20T10:00:00Z',
    soldAt: '2026-05-25T15:30:00Z',
    quantity: 12,
    entryPrice: 410,
    exitPrice: 418.5,
    pnlUsd: 102,
    pnlPct: 2.07,
    durationMs: 5 * 24 * 3600 * 1000,
    closeMethod: 'lifo',
  },
]

export const MOCK_SNAPSHOTS: DailySnapshot[] = [
  {
    id: 'ds-1',
    date: '2026-06-03',
    baseBalance: 51000,
    goalAmount: 510,
    actualResult: 420,
    dayStatus: 'carried_overnight',
    hadOvernightOpen: true,
  },
]

export const MOCK_DAILY_BASE = 51000
