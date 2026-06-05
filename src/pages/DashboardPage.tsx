import { useEffect, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import type { AccountGoalEvaluation, AccountSummary } from '../domain/types'

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
  const { broker, dailyGoal } = useApp()
  const [account, setAccount] = useState<AccountSummary | null>(null)
  const [goal, setGoal] = useState<AccountGoalEvaluation | null>(null)

  useEffect(() => {
    Promise.all([broker.getAccountSummary(), dailyGoal.evaluateCurrentGoal()]).then(([a, g]) => {
      setAccount(a)
      setGoal(g)
    })
  }, [broker, dailyGoal])

  if (!account || !goal) {
    return <p className="empty">Cargando dashboard…</p>
  }

  return (
    <section className="dashboard">
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

      <div className="summary">
        <div className="card">
          <span className="card-label">Valor total</span>
          <span className="card-value">{currency(account.totalValue)}</span>
        </div>
        <div className={`card ${account.dayChangeUsd >= 0 ? 'pos' : 'neg'}`}>
          <span className="card-label">Cambio del día</span>
          <span className="card-value">
            {currency(account.dayChangeUsd)} ({account.dayChangePct.toFixed(2)}%)
          </span>
        </div>
        <div className="card">
          <span className="card-label">Posiciones abiertas</span>
          <span className="card-value">{account.openPositionsCount}</span>
        </div>
      </div>

      <div className="summary">
        <div className="card pos">
          <span className="card-label">P/L realizado</span>
          <span className="card-value">{currency(account.realizedPnl)}</span>
        </div>
        <div className={`card ${account.unrealizedPnl >= 0 ? 'pos' : 'neg'}`}>
          <span className="card-label">P/L no realizado</span>
          <span className="card-value">{currency(account.unrealizedPnl)}</span>
        </div>
      </div>
    </section>
  )
}
