import { DEFAULT_DAILY_GOAL_PCT } from './constants'
import type { GoalCycleStatus } from '../domain/types'

const BALANCE_EPSILON = 0.01

export function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}

export function roundPct(n: number): number {
  return Math.round(n * 100) / 100
}

export function calculateProjectedBalance(
  baseBalance: number,
  targetPercentage = DEFAULT_DAILY_GOAL_PCT,
): number {
  return roundUsd(baseBalance * (1 + targetPercentage / 100))
}

export function calculateGainAmount(currentBalance: number, baseBalance: number): number {
  return roundUsd(currentBalance - baseBalance)
}

export function calculateGainPercentage(currentBalance: number, baseBalance: number): number {
  if (baseBalance <= 0) return 0
  return roundPct(((currentBalance - baseBalance) / baseBalance) * 100)
}

export function calculateProgressToGoal(
  currentBalance: number,
  baseBalance: number,
  projectedBalance: number,
): number {
  const goalAmount = projectedBalance - baseBalance
  if (goalAmount <= 0) return 0
  const progress = ((currentBalance - baseBalance) / goalAmount) * 100
  return roundPct(Math.max(0, progress))
}

export function balancesDiffer(a: number, b: number): boolean {
  return Math.abs(a - b) > BALANCE_EPSILON
}

export interface ShouldCreateSnapshotParams {
  currentTradingDate: string
  snapshotTradingDate: string | null
  isTradingDay: boolean
  hasOpenPositions: boolean
  currentBalance: number
  baseBalance: number
}

export function shouldCreateNewSnapshot(params: ShouldCreateSnapshotParams): boolean {
  const {
    currentTradingDate,
    snapshotTradingDate,
    isTradingDay,
    hasOpenPositions,
    currentBalance,
    baseBalance,
  } = params

  if (!snapshotTradingDate) return true

  if (currentTradingDate === snapshotTradingDate) return false

  if (hasOpenPositions) return false

  if (!isTradingDay) return false

  return balancesDiffer(currentBalance, baseBalance)
}

export function calculateCalendarDaysSince(snapshotDate: string, currentDate: string): number {
  if (currentDate < snapshotDate) return 1
  const start = parseYmdUtc(snapshotDate)
  const end = parseYmdUtc(currentDate)
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000)
  return Math.max(1, diff + 1)
}

export function calculateTradingDaysSince(
  snapshotDate: string,
  currentDate: string,
  countTradingDays: (start: string, end: string) => number,
): number {
  if (currentDate < snapshotDate) return 1
  return countTradingDays(snapshotDate, currentDate)
}

export function calculateAverageDailyGainPercentage(
  gainPercentage: number,
  tradingDays: number,
): number {
  if (tradingDays <= 0) return 0
  return roundPct(gainPercentage / tradingDays)
}

export interface DetermineCycleStatusParams {
  isTradingDay: boolean
  hasOpenPositions: boolean
  snapshotCreated: boolean
  sameTradingDateAsSnapshot: boolean
  gainPercentage: number
  goalPct: number
}

export function determineGoalCycleStatus(params: DetermineCycleStatusParams): GoalCycleStatus {
  const {
    isTradingDay,
    hasOpenPositions,
    snapshotCreated,
    sameTradingDateAsSnapshot,
    gainPercentage,
    goalPct,
  } = params

  if (!isTradingDay) return 'non_trading_day'

  if (gainPercentage >= goalPct && !hasOpenPositions) return 'goal_reached'

  if (snapshotCreated && sameTradingDateAsSnapshot) return 'new_day_cycle'

  if (hasOpenPositions && !sameTradingDateAsSnapshot) return 'carried_open_positions'

  if (hasOpenPositions) return 'awaiting_position_close'

  return 'active_cycle'
}

export function goalCycleMessage(status: GoalCycleStatus): string {
  switch (status) {
    case 'carried_open_positions':
    case 'awaiting_position_close':
      return 'Este objetivo sigue activo porque todavía existen posiciones abiertas. El sistema continuará comparando el balance actual contra el último balance base guardado.'
    case 'new_day_cycle':
      return 'Nuevo balance base guardado para el ciclo operativo actual.'
    case 'non_trading_day':
      return 'Hoy no es día de operativa. El sistema mantiene el último objetivo activo y no crea un nuevo balance base.'
    case 'goal_reached':
      return 'Objetivo del 1% alcanzado. Si no quedan posiciones abiertas, el próximo día operativo podrá iniciar un nuevo ciclo.'
    case 'active_cycle':
    default:
      return 'Ciclo operativo activo. El balance actual se compara contra el último balance base guardado.'
  }
}

function parseYmdUtc(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
