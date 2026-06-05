import { useApp } from '../app/providers/AppProvider'
import { OPEN_SYMBOLS_PAGE_SIZE } from '../business/constants'
import { ListPagination } from '../components/ListPagination'
import { SymbolBlock } from '../components/SymbolBlock'
import { usePagination } from '../hooks/usePagination'
import { MARKET_PRICE_REFRESH_MS, useLiveOpenPositions } from '../hooks/useLiveOpenPositions'

export function OpenPositionsPage() {
  const { broker, connectionMode } = useApp()
  const { groups, loading, priceUpdatedAt, refreshing } = useLiveOpenPositions(broker)

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, showControls } =
    usePagination(groups, OPEN_SYMBOLS_PAGE_SIZE)

  if (loading && groups.length === 0) {
    return <p className="empty">Cargando posiciones…</p>
  }

  const secsAgo =
    priceUpdatedAt != null
      ? Math.max(0, Math.floor((Date.now() - priceUpdatedAt.getTime()) / 1000))
      : null

  return (
    <section className="open-page paginated-page">
      <h2 className="page-title">Posiciones abiertas</h2>
      <p className="page-hint">
        Agrupado por activo · cantidad en <strong>contratos</strong> · {OPEN_SYMBOLS_PAGE_SIZE} activos
        por página.
      </p>
      <p className={`price-live ${refreshing ? 'price-live-pulse' : ''}`}>
        Precio de mercado: se actualiza cada {MARKET_PRICE_REFRESH_MS / 1000} s
        {secsAgo != null && ` · última lectura hace ${secsAgo} s`}
        {connectionMode === 'schwab' && ' (vía Schwab cuando esté conectado)'}
      </p>

      {groups.length === 0 && <p className="empty">No hay posiciones abiertas.</p>}

      {pageItems.map((g) => (
        <SymbolBlock key={g.symbol} group={g} priceUpdatedAt={priceUpdatedAt} />
      ))}

      <ListPagination
        label="Paginación de posiciones abiertas"
        visible={showControls}
        page={page}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={groups.length}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </section>
  )
}
