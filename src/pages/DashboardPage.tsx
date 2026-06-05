import { useEffect, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import type { AccountGoalEvaluation } from '../domain/types'
import type { DashboardInsights } from '../services/DashboardInsightsService'
import { AccountGrowthHero } from '../components/AccountGrowthHero'
import { TradeStreakPanel } from '../components/TradeStreakPanel'
import { WeeklyPerformancePanel } from '../components/WeeklyPerformancePanel'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function fmtSnapshotDate(iso: string | null, timeEt: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const date = d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  return timeEt ? `${date}, ${timeEt} ET` : date
}

const cycleLabels: Record<AccountGoalEvaluation['cycleStatus'], string> = {
  new_day_cycle: 'Nuevo ciclo del día',
  active_cycle: 'Ciclo activo',
  carried_open_positions: 'Ciclo arrastrado por posiciones abiertas',
  goal_reached: 'Objetivo alcanzado',
  non_trading_day: 'Día no operativo',
  awaiting_position_close: 'Esperando cierre de posiciones',
}

export function DashboardPage() {
  const { dailyGoal, dashboardInsights } = useApp()
  const [goal, setGoal] = useState<AccountGoalEvaluation | null>(null)
  const [insights, setInsights] = useState<DashboardInsights | null>(null)

  useEffect(() => {
    Promise.all([dailyGoal.evaluateCurrentGoal(), dashboardInsights.getInsights()]).then(
      ([g, i]) => {
        setGoal(g)
        setInsights(i)
      },
    )
  }, [dailyGoal, dashboardInsights])

  if (!goal || !insights) {
    return <p className="empty">Cargando dashboard…</p>
  }

  return (
    <section className="dashboard">
      <AccountGrowthHero growth={insights.yearGrowth} />

      <div className={`card account-goal-card status-${goal.goalReached ? 'met' : goal.gainAmount >= 0 ? 'pending' : 'loss'}`}>
        <h2 className="account-goal-title">Objetivo de cuenta 1%</h2>
        <p className={`goal-cycle-badge cycle-${goal.cycleStatus}`}>{cycleLabels[goal.cycleStatus]}</p>

        <div className="goal-metrics">
          <div className="goal-metric">
            <span className="goal-metric-label">Balance base</span>
            <span className="goal-metric-value">{currency(goal.baseBalance)}</span>
            <span className="goal-metric-hint">
              {fmtSnapshotDate(goal.baseSnapshotAt, goal.baseSnapshotTimeEt)}
            </span>
          </div>
          <div className="goal-metric">
            <span className="goal-metric-label">Balance actual</span>
            <span className="goal-metric-value">{currency(goal.currentBalance)}</span>
          </div>
          <div className="goal-metric">
            <span className="goal-metric-label">Proyectado 1%</span>
            <span className="goal-metric-value">{currency(goal.projectedBalance)}</span>
          </div>
          <div className="goal-metric">
            <span className="goal-metric-label">Ganancia acumulada</span>
            <span className={`goal-metric-value ${goal.gainAmount >= 0 ? 'pos' : 'neg'}`}>
              {currency(goal.gainAmount)} ({fmtPct(goal.gainPercentage)})
            </span>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, goal.progressToGoalPct))}%` }}
          />
        </div>
        <p className="goal-meta">
          Progreso al 1%: {fmtPct(goal.progressToGoalPct)} · Objetivo {currency(goal.goalAmount)}
        </p>

        <div className="goal-days">
          {goal.hasOpenPositions ? (
            <>
              <p className="goal-days-main">
                <strong>{goal.tradingDaysSinceBase}</strong>{' '}
                {goal.tradingDaysSinceBase === 1 ? 'día hábil' : 'días hábiles'} con posición abierta
              </p>
              <p className="goal-days-avg">
                Promedio hacia el 1%:{' '}
                <strong className={goal.averageDailyGainPct >= 0 ? 'pos' : 'neg'}>
                  {fmtPct(goal.averageDailyGainPct)}
                </strong>
                /día hábil
              </p>
            </>
          ) : (
            <p className="goal-days-main">
              <strong>{goal.tradingDaysSinceBase}</strong>{' '}
              {goal.tradingDaysSinceBase === 1 ? 'día hábil' : 'días hábiles'} desde el balance base
              {' · '}
              Promedio{' '}
              <strong className={goal.averageDailyGainPct >= 0 ? 'pos' : 'neg'}>
                {fmtPct(goal.averageDailyGainPct)}
              </strong>
              /día hábil
            </p>
          )}
        </div>
      </div>

      <div className="dashboard-insights">
        <WeeklyPerformancePanel weekly={insights.weekly} />
        <TradeStreakPanel streak={insights.streak} />
      </div>
    </section>
  )
}
