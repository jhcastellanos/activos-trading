import { describe, expect, it } from 'vitest'
import type { GoalSnapshot } from '../../domain/types'
import { buildAccountYearGrowth, resolveYearBaselineFromSnapshots } from '../accountYearGrowth'

const snapshot = (
  tradingDate: string,
  baseBalance: number,
  createdAt: string,
): GoalSnapshot => ({
  id: tradingDate,
  baseBalance,
  projectedBalance: baseBalance * 1.01,
  goalPct: 1,
  tradingDate,
  createdAt,
  createdTimeEt: '09:00:00',
  cycleStatus: 'new_day_cycle',
  hadOpenPositionsAtCreation: false,
})

describe('resolveYearBaselineFromSnapshots', () => {
  it('usa el primer snapshot del año por tradingDate', () => {
    const baseline = resolveYearBaselineFromSnapshots(
      [
        snapshot('2026-06-02', 51000, '2026-06-02T13:00:00Z'),
        snapshot('2026-01-02', 45000, '2026-01-02T14:00:00Z'),
        snapshot('2026-03-10', 47000, '2026-03-10T14:00:00Z'),
      ],
      2026,
    )
    expect(baseline).toEqual({
      year: 2026,
      balance: 45000,
      asOfDate: '2026-01-02',
    })
  })
})

describe('buildAccountYearGrowth', () => {
  it('calcula ganancia desde el primer registro del año', () => {
    const g = buildAccountYearGrowth(2026, 51000, '2026-06-02', 52480.5)
    expect(g.gainAmount).toBe(1480.5)
    expect(g.gainPercentage).toBe(2.9)
  })
})
