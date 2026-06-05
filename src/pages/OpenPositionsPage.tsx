import { useApp } from '../app/providers/AppProvider'
import { OPEN_SYMBOLS_PAGE_SIZE } from '../business/constants'
import { ListPagination } from '../components/ListPagination'
import { SymbolBlock } from '../components/SymbolBlock'
import { usePagination } from '../hooks/usePagination'
import { useLiveOpenPositions } from '../hooks/useLiveOpenPositions'

export function OpenPositionsPage() {
  const { broker } = useApp()
  const { groups, loading, priceUpdatedAt } = useLiveOpenPositions(broker)

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, showControls } =
    usePagination(groups, OPEN_SYMBOLS_PAGE_SIZE)

  if (loading && groups.length === 0) {
    return <p className="empty">Cargando posiciones…</p>
  }

  return (
    <section className="open-page paginated-page">
      <h2 className="page-title">Posiciones abiertas</h2>

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
