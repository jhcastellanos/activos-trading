import { useEffect, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import type { AccountSummary, DailyGoalState } from '../domain/types'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

export function DashboardPage() {
  const { broker } = useApp()
  const [account, setAccount] = useState<AccountSummary | null>(null)
  const [goal, setGoal] = useState<DailyGoalState | null>(null)

  useEffect(() => {
    Promise.all([broker.getAccountSummary(), broker.getDailyGoalState()]).then(([a, g]) => {
      setAccount(a)
      setGoal(g)
    })
  }, [broker])

  if (!account || !goal) {
    return <p className="empty">Cargando dashboard…</p>
  }

  const goalProgressPct = goal.goalAmount > 0 ? (goal.currentProgressUsd / goal.goalAmount) * 100 : 0

  return (
    <section className="dashboard">
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

      <div className="card goal-card">
        <h2>Objetivo diario ({goal.goalPct}%)</h2>
        <p className="goal-meta">
          Base: {currency(goal.baseBalance)} → Cierre objetivo: {currency(goal.targetCloseValue)}
        </p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, goalProgressPct))}%` }}
          />
        </div>
        <p className="goal-meta">
          Progreso: {currency(goal.currentProgressUsd)} ({goal.currentProgressPct.toFixed(2)}% de la
          base)
          {!goal.canRecalculateBase && ' · Base fija (posiciones overnight)'}
        </p>
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
