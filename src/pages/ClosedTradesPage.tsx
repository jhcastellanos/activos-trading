import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import type { ClosedTrade } from '../domain/types'
import { profitVisualStatus } from '../business/profitStatus'

const PAGE_SIZE = 10

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
  const [page, setPage] = useState(1)

  useEffect(() => {
    broker.getClosedTrades().then(setTrades)
  }, [broker])

  const sorted = useMemo(() => sortClosedDesc(trades), [trades])
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, page])

  const rangeStart = sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, sorted.length)

  return (
    <section className="closed-page">
      <h2 className="page-title">Trades cerrados</h2>
      <p className="subtitle">Más reciente primero · {PAGE_SIZE} por página.</p>

      {sorted.length === 0 ? (
        <p className="empty">No hay trades cerrados.</p>
      ) : (
        <>
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

          {totalPages > 1 && (
            <nav className="closed-pagination" aria-label="Paginación de trades cerrados">
              <button
                type="button"
                className="btn ghost pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <span className="pagination-meta">
                {rangeStart}–{rangeEnd} de {sorted.length} · pág. {page}/{totalPages}
              </span>
              <button
                type="button"
                className="btn ghost pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
