import type { SymbolPositionGroup } from '../domain/types'
import { profitVisualStatus } from '../business/profitStatus'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function contractLabel(remaining: number, bought: number): string {
  if (remaining === bought) {
    return `${remaining} ${remaining === 1 ? 'contrato' : 'contratos'}`
  }
  return `${remaining} de ${bought}`
}

export function SymbolBlock({
  group,
  priceUpdatedAt,
  onSellLot,
  showDemoSell,
}: {
  group: SymbolPositionGroup
  priceUpdatedAt?: Date | null
  onSellLot?: (lotId: string) => void
  showDemoSell?: boolean
}) {
  const { aggregate: agg } = group
  const aggStatus = profitVisualStatus(agg.currentProfitPct)
  const totalBought = group.lots.reduce((s, l) => s + l.quantity, 0)

  return (
    <article className={`symbol-block status-${aggStatus}`}>
      <header className="symbol-head">
        <div className="symbol-title">
          <span className="symbol-ticker">{group.symbol}</span>
          <p className="symbol-meta">
            {group.totalRemainingQty} abiertos · {group.lots.length}{' '}
            {group.lots.length === 1 ? 'compra' : 'compras'} ({totalBought} comprados)
          </p>
        </div>
        <div className="symbol-live">
          <span className="symbol-price">{currency(group.currentPrice)}</span>
          <span className={`symbol-pct profit-${aggStatus}`}>{fmtPct(agg.currentProfitPct)}</span>
          {priceUpdatedAt && (
            <span className="symbol-price-time">
              {priceUpdatedAt.toLocaleTimeString('es', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </header>

      <div className={`symbol-basis status-${aggStatus}`}>
        <div className="basis-item">
          <span className="basis-label">Prom. compra</span>
          <span className="basis-value">{currency(agg.avgBuyPrice)}</span>
        </div>
        <div className="basis-item">
          <span className="basis-label">Venta mín.</span>
          <span className={`basis-value profit-${aggStatus}`}>{currency(agg.targetSellPrice)}</span>
        </div>
      </div>

      <div className="symbol-lots-head">
        <span>Por compra</span>
        <span className="symbol-lots-hint">orden LIFO</span>
      </div>

      <ol className="lot-list">
        {group.lots.map((lot) => {
          const lotStatus = profitVisualStatus(lot.currentProfitPct)
          return (
            <li
              key={lot.id}
              className={`lot-row status-${lotStatus} ${lot.sellFirst ? 'lot-first' : ''}`}
            >
              <div className="lot-line">
                <span className="lot-rank">{lot.sellPriority}</span>
                <div className="lot-main">
                  <div className="lot-title-row">
                    <strong>{contractLabel(lot.remainingQty, lot.quantity)}</strong>
                    <span className={`lot-pct profit-${lotStatus}`}>{fmtPct(lot.currentProfitPct)}</span>
                  </div>
                  <p className="lot-sub">
                    {fmtDate(lot.boughtAt)} · {currency(lot.avgBuyPrice)}/contr. · objetivo{' '}
                    <span className={`profit-${lotStatus}`}>{currency(lot.targetSellPrice)}</span>
                  </p>
                </div>
              </div>
              {(lot.sellFirst || (showDemoSell && onSellLot)) && (
                <div className="lot-actions">
                  {lot.sellFirst && <span className="lot-badge">Vender primero</span>}
                  {showDemoSell && onSellLot && (
                    <button type="button" className="lot-sell-link" onClick={() => onSellLot(lot.id)}>
                      Vender
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </article>
  )
}
