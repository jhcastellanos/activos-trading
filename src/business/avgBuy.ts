import { AVG_BUY_BUFFER_USD } from './constants'

export interface WeightedAvgBuy {
  /** Suma de (contratos × precio compra) de todos los lotes abiertos. */
  totalCostUsd: number
  /** Suma de contratos abiertos (remaining). */
  totalContracts: number
  /** totalCostUsd / totalContracts */
  avgRaw: number
  /** avgRaw + $0.01 — base para el 1,5% y el % de ganancia total. */
  avgAdjusted: number
}

export function weightedAvgBuy(
  lots: { remainingQty: number; avgBuyPrice: number }[],
): WeightedAvgBuy {
  const totalContracts = lots.reduce((s, l) => s + l.remainingQty, 0)
  const totalCostUsd = lots.reduce((s, l) => s + l.remainingQty * l.avgBuyPrice, 0)
  const avgRaw = totalContracts > 0 ? totalCostUsd / totalContracts : 0
  const avgAdjusted = avgRaw + AVG_BUY_BUFFER_USD
  return {
    totalCostUsd: roundUsd(totalCostUsd),
    totalContracts,
    avgRaw: roundUsd(avgRaw),
    avgAdjusted: roundUsd(avgAdjusted),
  }
}

/** Precio de compra de un lote + $0.01 (misma regla que el promedio). */
export function adjustedLotBuyPrice(avgBuyPrice: number): number {
  return roundUsd(avgBuyPrice + AVG_BUY_BUFFER_USD)
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}
