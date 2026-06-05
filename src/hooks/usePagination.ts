import { useEffect, useMemo, useState } from 'react'

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const rangeStart = items.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, items.length)
  const showControls = items.length > pageSize

  return {
    page,
    setPage,
    totalPages,
    pageItems,
    rangeStart,
    rangeEnd,
    showControls,
  }
}
