import { useApp } from '../app/providers/AppProvider'
import { SymbolBlock } from '../components/SymbolBlock'
import { MARKET_PRICE_REFRESH_MS, useLiveOpenPositions } from '../hooks/useLiveOpenPositions'

export function OpenPositionsPage() {
  const { broker, connectionMode } = useApp()
  const { groups, loading, priceUpdatedAt, refreshing, reload } = useLiveOpenPositions(broker)

  const handleSellLot = async (lotId: string, symbol: string) => {
    if (broker.mode !== 'demo' || !broker.closeLotPartial) return
    const priceStr = prompt(`Precio de venta ${symbol}:`)
    const qtyStr = prompt('Cantidad de contratos a vender:')
    if (!priceStr || !qtyStr) return
    await broker.closeLotPartial(lotId, parseFloat(qtyStr), parseFloat(priceStr))
    reload()
  }

  if (loading && groups.length === 0) {
    return <p className="empty">Cargando posiciones…</p>
  }

  const secsAgo =
    priceUpdatedAt != null
      ? Math.max(0, Math.floor((Date.now() - priceUpdatedAt.getTime()) / 1000))
      : null

  return (
    <section className="open-page">
      <h2 className="page-title">Posiciones abiertas</h2>
      <p className="page-hint">
        Agrupado por activo · cantidad en <strong>contratos</strong> (acciones/unidades, no
        dólares) · última compra arriba (LIFO).
      </p>
      <p className={`price-live ${refreshing ? 'price-live-pulse' : ''}`}>
        Precio de mercado: se actualiza cada {MARKET_PRICE_REFRESH_MS / 1000} s
        {secsAgo != null && ` · última lectura hace ${secsAgo} s`}
        {connectionMode === 'schwab' && ' (vía Schwab cuando esté conectado)'}
      </p>

      {groups.length === 0 && <p className="empty">No hay posiciones abiertas.</p>}

      {groups.map((g) => (
        <SymbolBlock
          key={g.symbol}
          group={g}
          priceUpdatedAt={priceUpdatedAt}
          showDemoSell={broker.mode === 'demo'}
          onSellLot={(id) => handleSellLot(id, g.symbol)}
        />
      ))}
    </section>
  )
}
