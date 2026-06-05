import { DEFAULT_DAILY_GOAL_PCT } from './constants'
import type { DailyGoalState, TradeLot } from '../domain/types'

function startOfDay(iso: string): string {
  return iso.slice(0, 10)
}

function isBeforeToday(boughtAt: string, today: string): boolean {
  return startOfDay(boughtAt) < today
}

/**
 * Determina si el objetivo diario puede recalcularse con un nuevo balance.
 * Regla: solo si no quedan lotes abiertos de días anteriores y el día cerró posiciones relevantes.
 */
export function canRecalculateDailyBase(
  openLots: TradeLot[],
  today: string,
): { canRecalculate: boolean; hadOvernightOpen: boolean } {
  const overnight = openLots.filter(
    (l) => l.status !== 'closed' && isBeforeToday(l.boughtAt, today),
  )
  return {
    canRecalculate: overnight.length === 0,
    hadOvernightOpen: overnight.length > 0,
  }
}

export function buildDailyGoalState(params: {
  baseBalance: number
  currentAccountValue: number
  openLots: TradeLot[]
  today: string
  goalPct?: number
}): DailyGoalState {
  const goalPct = params.goalPct ?? DEFAULT_DAILY_GOAL_PCT
  const { canRecalculate, hadOvernightOpen } = canRecalculateDailyBase(params.openLots, params.today)
  const goalAmount = roundUsd(params.baseBalance * (goalPct / 100))
  const targetCloseValue = roundUsd(params.baseBalance + goalAmount)

  // Progreso: intradía si no hay overnight; si hay overnight, progreso vs base fija sin inflar base.
  const progressUsd = roundUsd(params.currentAccountValue - params.baseBalance)
  const progressPct =
    params.baseBalance > 0 ? roundPct((progressUsd / params.baseBalance) * 100) : 0

  return {
    baseBalance: params.baseBalance,
    goalPct,
    goalAmount,
    currentProgressUsd: progressUsd,
    currentProgressPct: progressPct,
    targetCloseValue,
    canRecalculateBase: canRecalculate,
    hadOvernightOpenLots: hadOvernightOpen,
    date: params.today,
  }
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100
}
