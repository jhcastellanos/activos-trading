import type { ClosedTrade } from '../domain/types'
import { adjustedLotBuyPrice } from './avgBuy'
import { DEFAULT_TARGET_PROFIT_PCT } from './constants'
import { targetSellPrice } from './targetPrice'

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}

function roundPrice(n: number): number {
  return Math.round(n * 100) / 100
}

/** Fecha de compra más reciente entre los lotes abiertos del símbolo. */
export function latestOpenBoughtAtMs(lots: ReadonlyArray<{ boughtAt: string }>): number | null {
  if (lots.length === 0) return null
  return Math.max(...lots.map((l) => new Date(l.boughtAt).getTime()))
}

/**
 * El cierre es intermedio: compra y venta posteriores a todos los lotes abiertos del activo.
 */
export function isIntermediateClosedTrade(
  trade: ClosedTrade,
  latestOpenBoughtAtMs: number | null,
): boolean {
  if (latestOpenBoughtAtMs == null) return false
  const boughtMs = new Date(trade.boughtAt).getTime()
  const soldMs = new Date(trade.soldAt).getTime()
  return boughtMs > latestOpenBoughtAtMs && soldMs > latestOpenBoughtAtMs
}

/** Ganancia por encima del objetivo 1,5% en un cierre (0 si no superó el plan). */
export function closedTradeExcessUsd(
  trade: ClosedTrade,
  profitPct = DEFAULT_TARGET_PROFIT_PCT,
): number {
  const buyBase = adjustedLotBuyPrice(trade.entryPrice)
  const target = targetSellPrice(buyBase, profitPct)
  if (trade.exitPrice <= target) return 0
  return roundUsd((trade.exitPrice - target) * trade.quantity)
}

/**
 * Suma excedentes de cierres del símbolo por encima del 1,5%,
 * solo si compra y venta fueron después de todos los lotes abiertos.
 */
export function excessCreditBySymbol(
  closedTrades: ClosedTrade[],
  openLotsBySymbol: ReadonlyMap<string, ReadonlyArray<{ boughtAt: string }>> = new Map(),
): Map<string, number> {
  const map = new Map<string, number>()
  for (const trade of closedTrades) {
    const openLots = openLotsBySymbol.get(trade.symbol) ?? []
    const latestOpenMs = latestOpenBoughtAtMs(openLots)
    if (!isIntermediateClosedTrade(trade, latestOpenMs)) continue

    const excess = closedTradeExcessUsd(trade)
    if (excess <= 0) continue
    map.set(trade.symbol, roundUsd((map.get(trade.symbol) ?? 0) + excess))
  }
  return map
}

/**
 * Precio de venta por contrato para salir en even en lo abierto,
 * descontando el excedente acumulado de cierres del mismo activo.
 */
export function breakevenSellPriceWithExcess(
  totalInvestedUsd: number,
  totalRemainingQty: number,
  excessCreditUsd: number,
): { price: number | null; coversOpen: boolean } {
  if (totalRemainingQty <= 0) return { price: null, coversOpen: false }
  const netCost = roundUsd(totalInvestedUsd - excessCreditUsd)
  if (netCost <= 0) return { price: 0, coversOpen: true }
  return { price: roundPrice(netCost / totalRemainingQty), coversOpen: false }
}
