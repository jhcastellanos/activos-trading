import type { MarketCalendarService } from '../interfaces/MarketCalendarService'

/** Feriados NYSE/Nasdaq (YYYY-MM-DD). Ampliar por año según calendario oficial. */
const US_MARKET_HOLIDAYS = new Set([
  '2026-01-01',
  '2026-01-19',
  '2026-02-16',
  '2026-04-03',
  '2026-05-25',
  '2026-06-19',
  '2026-07-03',
  '2026-09-07',
  '2026-11-26',
  '2026-12-25',
])

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

export class USMarketCalendarService implements MarketCalendarService {
  isTradingDay(date: string): boolean {
    const dt = parseYmd(date)
    const dow = dt.getUTCDay()
    if (dow === 0 || dow === 6) return false
    return !US_MARKET_HOLIDAYS.has(date)
  }

  getTradingDaysBetween(startDate: string, endDate: string): number {
    if (endDate < startDate) return 0
    let count = 0
    let cursor = startDate
    while (cursor <= endDate) {
      if (this.isTradingDay(cursor)) count++
      cursor = addDaysYmd(cursor, 1)
    }
    return Math.max(count, 1)
  }

  getNextTradingDay(date: string): string {
    let cursor = addDaysYmd(date, 1)
    for (let i = 0; i < 14; i++) {
      if (this.isTradingDay(cursor)) return cursor
      cursor = addDaysYmd(cursor, 1)
    }
    return cursor
  }
}
