import { describe, expect, it } from 'vitest'
import {
  buildAccountLedgerStats,
  buildMultiAccountLedgerSummary,
  operableFromBalance,
  upsertDailyCloses,
} from '../multiAccountLedger'

describe('multiAccountLedger', () => {
  it('operable is one third of balance', () => {
    expect(operableFromBalance(9000)).toBe(3000)
    expect(operableFromBalance(100)).toBe(33.33)
  })

  it('computes daily and total change', () => {
    const records = [
      { slot: 1 as const, date: '2026-11-20', closingBalance: 10000 },
      { slot: 1 as const, date: '2026-11-21', closingBalance: 10100 },
    ]
    const stats = buildAccountLedgerStats(records, 1)
    expect(stats.dailyChange).toBe(100)
    expect(stats.totalChange).toBe(100)
    expect(stats.operableAmount).toBe(3366.67)
  })

  it('summarizes three accounts', () => {
    const records = [
      { slot: 1 as const, date: '2026-11-21', closingBalance: 9000 },
      { slot: 2 as const, date: '2026-11-21', closingBalance: 6000 },
      { slot: 3 as const, date: '2026-11-21', closingBalance: 3000 },
    ]
    const summary = buildMultiAccountLedgerSummary(records)
    expect(summary.totalBalance).toBe(18000)
    expect(summary.totalOperable).toBe(6000)
  })

  it('upserts closes for a date', () => {
    const base = [{ slot: 1 as const, date: '2026-11-21', closingBalance: 100 }]
    const next = upsertDailyCloses(base, '2026-11-21', [{ slot: 1, closingBalance: 200 }])
    expect(next).toHaveLength(1)
    expect(next[0].closingBalance).toBe(200)
  })
})