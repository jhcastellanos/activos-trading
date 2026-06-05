import type { ClosedTrade } from '../domain/types'
import { roundPct, roundUsd } from './goalCalculations'

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const

export interface DayPerformance {
  date: string
  dayLabel: string
  pnlUsd: number
  avgPct: number
  tradeCount: number
}

export interface WeeklyPerformance {
  weekStart: string
  weekEnd: string
  days: DayPerformance[]
}

function parseYmd(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function formatYmd(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysYmd(date: string, days: number): string {
  const dt = parseYmd(date)
  dt.setUTCDate(dt.getUTCDate() + days)
  return formatYmd(dt)
}

/** Lunes de la semana de `referenceDate` (YYYY-MM-DD). */
export function mondayOfWeek(referenceDate: string): string {
  const dt = parseYmd(referenceDate)
  const dow = dt.getUTCDay()
  const offset = dow === 0 ? -6 : 1 - dow
  dt.setUTCDate(dt.getUTCDate() + offset)
  return formatYmd(dt)
}

export function weekdayDatesMonToFri(weekMonday: string): string[] {
  return Array.from({ length: 5 }, (_, i) => addDaysYmd(weekMonday, i))
}

function dayLabelForDate(date: string): string {
  return DAY_LABELS[parseYmd(date).getUTCDay()]
}

/**
 * Agrupa trades cerrados por día de venta (ET).
 * `soldOnDate` debe ser YYYY-MM-DD en Eastern.
 */
export function buildWeeklyPerformance(
  trades: ClosedTrade[],
  soldOnDate: (soldAtIso: string) => string,
  referenceDateEt: string,
): WeeklyPerformance {
  const weekStart = mondayOfWeek(referenceDateEt)
  const weekDates = weekdayDatesMonToFri(weekStart)
  const weekEnd = weekDates[4]

  const byDay = new Map<string, ClosedTrade[]>()
  for (const d of weekDates) byDay.set(d, [])

  for (const t of trades) {
    const soldDay = soldOnDate(t.soldAt)
    if (byDay.has(soldDay)) {
      byDay.get(soldDay)!.push(t)
    }
  }

  const days: DayPerformance[] = weekDates.map((date) => {
    const dayTrades = byDay.get(date) ?? []
    const pnlUsd = roundUsd(dayTrades.reduce((s, t) => s + t.pnlUsd, 0))
    const avgPct =
      dayTrades.length > 0
        ? roundPct(dayTrades.reduce((s, t) => s + t.pnlPct, 0) / dayTrades.length)
        : 0
    return {
      date,
      dayLabel: dayLabelForDate(date),
      pnlUsd,
      avgPct,
      tradeCount: dayTrades.length,
    }
  })

  return { weekStart, weekEnd, days }
}
