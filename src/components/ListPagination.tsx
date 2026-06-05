type ListPaginationProps = {
  page: number
  totalPages: number
  rangeStart: number
  rangeEnd: number
  total: number
  onPrev: () => void
  onNext: () => void
  label: string
  visible: boolean
}

export function ListPagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  total,
  onPrev,
  onNext,
  label,
  visible,
}: ListPaginationProps) {
  if (!visible) return null

  return (
    <nav className="page-pagination" aria-label={label}>
      <button
        type="button"
        className="btn ghost pagination-btn"
        disabled={page <= 1}
        onClick={onPrev}
      >
        Anterior
      </button>
      <span className="pagination-meta">
        {rangeStart}–{rangeEnd} de {total} · pág. {page}/{totalPages}
      </span>
      <button
        type="button"
        className="btn ghost pagination-btn"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        Siguiente
      </button>
    </nav>
  )
}
