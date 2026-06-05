import { useEffect, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import type { ClosedTrade } from '../domain/types'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

export function ClosedTradesPage() {
  const { broker } = useApp()
  const [trades, setTrades] = useState<ClosedTrade[]>([])

  useEffect(() => {
    broker.getClosedTrades().then(setTrades)
  }, [broker])

  return (
    <section>
      <h2 className="page-title">Trades cerrados</h2>
      {trades.map((t) => (
        <div className="asset" key={t.id}>
          <div className="asset-main">
            <span className="asset-symbol">{t.symbol}</span>
            <span className={`tag ${t.pnlUsd >= 0 ? 'pos' : 'neg'}`}>
              {t.pnlPct.toFixed(2)}%
            </span>
          </div>
          <p className="plan-detail">
            {new Date(t.boughtAt).toLocaleDateString('es')} →{' '}
            {new Date(t.soldAt).toLocaleDateString('es')} · {t.quantity} uds · {t.closeMethod}
          </p>
          <p className="plan-detail">
            {currency(t.entryPrice)} → {currency(t.exitPrice)} · P/L {currency(t.pnlUsd)}
          </p>
        </div>
      ))}
    </section>
  )
}
