import type { WeeklyPerformance } from '../business/weeklyPerformance'

function fmtUsdCompact(n: number): string {
  if (n === 0) return '$0'
  const sign = n > 0 ? '+' : '−'
  return `${sign}$${Math.abs(n).toFixed(0)}`
}

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function WeeklyPerformancePanel({ weekly }: { weekly: WeeklyPerformance }) {
  return (
    <section className="dash-panel weekly-panel">
      <h3 className="dash-panel-title">Rendimiento semanal</h3>
      <div className="weekly-grid">
        {weekly.days.map((day) => {
          const status = day.pnlUsd > 0 ? 'pos' : day.pnlUsd < 0 ? 'neg' : 'flat'
          return (
            <div key={day.date} className={`weekly-day status-${status}`}>
              <span className="weekly-day-label">{day.dayLabel}</span>
              <span className="weekly-day-usd">{day.tradeCount > 0 ? fmtUsdCompact(day.pnlUsd) : '—'}</span>
              <span className="weekly-day-pct">
                {day.tradeCount > 0 ? fmtPct(day.avgPct) : '—'}
              </span>
              <span className="weekly-day-ops">
                {day.tradeCount} {day.tradeCount === 1 ? 'op.' : 'op.'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
