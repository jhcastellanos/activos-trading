import type { TradeLot } from '../domain/types'

/** Ordena lotes LIFO: última compra primero (mayor fecha = prioridad 1). */
export function sortLotsLifo<T extends Pick<TradeLot, 'boughtAt' | 'id'>>(lots: T[]): T[] {
  return [...lots].sort((a, b) => {
    const tb = new Date(b.boughtAt).getTime() - new Date(a.boughtAt).getTime()
    if (tb !== 0) return tb
    return b.id.localeCompare(a.id)
  })
}

/** Asigna sellPriority 1 = vender primero. */
export function assignSellPriority<T extends Pick<TradeLot, 'boughtAt' | 'id'>>(
  lots: T[],
): (T & { sellPriority: number; sellFirst: boolean })[] {
  const sorted = sortLotsLifo(lots)
  return sorted.map((lot, i) => ({
    ...lot,
    sellPriority: i + 1,
    sellFirst: i === 0,
  }))
}
