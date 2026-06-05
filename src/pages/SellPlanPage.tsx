import { useEffect, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import type { SellPlanItem } from '../domain/types'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

export function SellPlanPage() {
  const { portfolio } = useApp()
  const [plan, setPlan] = useState<SellPlanItem[]>([])

  useEffect(() => {
    portfolio.getSellPlan().then(setPlan)
  }, [portfolio])

  return (
    <section>
      <h2 className="page-title">Plan de venta LIFO</h2>
      <p className="subtitle">Orden sugerido: última compra primero, objetivo mínimo 1,5%.</p>
      {plan.map((item) => (
        <div className={`plan-row ${item.sellFirst ? 'plan-first' : ''}`} key={item.lotId}>
          <span className="plan-rank">#{item.sellPriority}</span>
          <div>
            <strong>
              {item.symbol} · {item.quantity} uds
            </strong>
            {item.sellFirst && <span className="lot-flag inline">Vender primero</span>}
            <p className="plan-detail">
              Mín. {currency(item.targetSellPrice)} · Ganancia est.{' '}
              <span className="pos">{currency(item.estimatedProfitUsd)}</span>
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}
