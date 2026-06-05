import type { AccountYearBaseline, GoalSnapshot } from '../domain/types'
import { calculateGainAmount, calculateGainPercentage } from './goalCalculations'

export interface AccountYearGrowth {
  year: number
  yearStartBalance: number
  yearStartDate: string
  currentBalance: number
  gainAmount: number
  gainPercentage: number
}

/** Primer snapshot del año — la fecha en que empezó el historial, no el 1 de enero. */
export function resolveYearBaselineFromSnapshots(
  snapshots: GoalSnapshot[],
  year: number,
): AccountYearBaseline | null {
  const yearPrefix = `${year}-`
  const inYear = snapshots.filter((s) => s.tradingDate.startsWith(yearPrefix))
  if (inYear.length === 0) return null

  const first = [...inYear].sort(
    (a, b) =>
      a.tradingDate.localeCompare(b.tradingDate) || a.createdAt.localeCompare(b.createdAt),
  )[0]

  return {
    year,
    balance: first.baseBalance,
    asOfDate: first.tradingDate,
  }
}

export function buildAccountYearGrowth(
  year: number,
  yearStartBalance: number,
  yearStartDate: string,
  currentBalance: number,
): AccountYearGrowth {
  return {
    year,
    yearStartBalance,
    yearStartDate,
    currentBalance,
    gainAmount: calculateGainAmount(currentBalance, yearStartBalance),
    gainPercentage: calculateGainPercentage(currentBalance, yearStartBalance),
  }
}
