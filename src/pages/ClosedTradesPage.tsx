import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import type { ClosedTrade } from '../domain/types'
import { CLOSED_TRADES_PAGE_SIZE } from '../business/constants'
import { profitVisualStatus } from '../business/profitStatus'
import { ListPagination } from '../components/ListPagination'
import { usePagination } from '../hooks/usePagination'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function sortClosedDesc(trades: ClosedTrade[]): ClosedTrade[] {
  return [...trades].sort(
    (a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime(),
  )
}

function fmtExecutedAt(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ClosedTradesPage() {
  const { broker } = useApp()
  const [trades, setTrades] = useState<ClosedTrade[]>([])

  useEffect(() => {
    broker.getClosedTrades().then(setTrades)
  }, [broker])

  const sorted = useMemo(() => sortClosedDesc(trades), [trades])
  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, showControls } =
    usePagination(sorted, CLOSED_TRADES_PAGE_SIZE)

  const totals = useMemo(() => {
    const totalPnlUsd = sorted.reduce((s, t) => s + t.pnlUsd, 0)
    const invested = sorted.reduce((s, t) => s + t.entryPrice * t.quantity, 0)
    const totalPnlPct = invested > 0 ? (totalPnlUsd / invested) * 100 : 0
    return {
      totalPnlUsd: Math.round(totalPnlUsd * 100) / 100,
      totalPnlPct: Math.round(totalPnlPct * 100) / 100,
      count: sorted.length,
    }
  }, [sorted])

  const totalStatus = profitVisualStatus(totals.totalPnlPct)

  return (
    <section className="closed-page paginated-page">
      <h2 className="page-title">Trades cerrados</h2>

      {sorted.length === 0 ? (
        <p className="empty">No hay trades cerrados.</p>
      ) : (
        <>
          <div className={`card closed-total-card status-${totalStatus}`}>
            <span className="card-label">P/L total ({totals.count} operaciones)</span>
            <span className={`card-value profit-${totalStatus}`}>{currency(totals.totalPnlUsd)}</span>
            <span className={`closed-total-pct profit-${totalStatus}`}>{fmtPct(totals.totalPnlPct)}</span>
          </div>

          <ul className="closed-list">
            {pageItems.map((t) => {
              const status = profitVisualStatus(t.pnlPct)
              return (
                <li key={t.id} className={`closed-card status-${status}`}>
                  <div className="closed-card-head">
                    <span className="closed-symbol">{t.symbol}</span>
                    <time className="closed-executed" dateTime={t.soldAt}>
                      {fmtExecutedAt(t.soldAt)}
                    </time>
                  </div>
                  <div className="closed-metrics">
                    <div className="closed-metric">
                      <span className="closed-label">Compra</span>
                      <span className="closed-value">{currency(t.entryPrice)}</span>
                    </div>
                    <div className="closed-metric">
                      <span className="closed-label">Venta</span>
                      <span className="closed-value">{currency(t.exitPrice)}</span>
                    </div>
                    <div className="closed-metric">
                      <span className="closed-label">Ganancia</span>
                      <span className={`closed-value profit-${status}`}>{currency(t.pnlUsd)}</span>
                    </div>
                    <div className="closed-metric">
                      <span className="closed-label">%</span>
                      <span className={`closed-value profit-${status}`}>{fmtPct(t.pnlPct)}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <ListPagination
            label="Paginación de trades cerrados"
            visible={showControls}
            page={page}
            totalPages={totalPages}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={sorted.length}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </section>
  )
}
