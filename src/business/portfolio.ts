import type { ClosedTrade, EnrichedLot, SymbolAggregate, SymbolPositionGroup, TradeLot } from '../domain/types'
import { breakevenSellPriceWithExcess, excessCreditBySymbol } from './excessCredit'
import { assignSellPriority, sortLotsLifo } from './lifo'
import {
  currentProfitPct,
  distanceToTarget,
  estimatedProfitUsd,
  lotTargetState,
  targetSellPrice,
} from './targetPrice'
import { adjustedLotBuyPrice, weightedAvgBuy } from './avgBuy'
import { DEFAULT_TARGET_PROFIT_PCT } from './constants'

export function enrichLots(
  lots: TradeLot[],
  pricesBySymbol: Record<string, number>,
  profitPct = DEFAULT_TARGET_PROFIT_PCT,
): EnrichedLot[] {
  const openLots = lots.filter((l) => l.status !== 'closed' && l.remainingQty > 0)

  // LIFO por activo: la compra más reciente (mayor boughtAt) es prioridad 1.
  const bySymbol = new Map<string, TradeLot[]>()
  for (const lot of openLots) {
    const list = bySymbol.get(lot.symbol) ?? []
    list.push(lot)
    bySymbol.set(lot.symbol, list)
  }

  const withPriority = [...bySymbol.values()].flatMap((symbolLots) => assignSellPriority(symbolLots))

  return withPriority.map((lot) => {
    const currentPrice = pricesBySymbol[lot.symbol] ?? lot.avgBuyPrice
    const buyBase = adjustedLotBuyPrice(lot.avgBuyPrice)
    const target = targetSellPrice(buyBase, profitPct)
    const investedUsd = lot.remainingQty * lot.avgBuyPrice
    const estProfit = estimatedProfitUsd(lot.remainingQty, buyBase, target)
    const dist = distanceToTarget(currentPrice, target)

    return {
      ...lot,
      investedUsd: roundUsd(investedUsd),
      adjustedBuyPrice: buyBase,
      targetSellPrice: target,
      targetProfitPct: profitPct,
      estimatedProfitUsd: estProfit,
      currentPrice,
      distanceToTargetUsd: dist.usd,
      distanceToTargetPct: dist.pct,
      targetState: lotTargetState(currentPrice, target),
      currentProfitPct: currentProfitPct(buyBase, currentPrice),
      sellPriority: lot.sellPriority,
      sellFirst: lot.sellFirst,
    }
  })
}

export function buildSymbolAggregate(
  lots: EnrichedLot[],
  profitPct = DEFAULT_TARGET_PROFIT_PCT,
  excessCreditUsd = 0,
): SymbolAggregate {
  const w = weightedAvgBuy(lots)
  const currentPrice = lots[0]?.currentPrice ?? w.avgAdjusted
  const target = targetSellPrice(w.avgAdjusted, profitPct)
  const lotsAtTarget = lots.filter((l) => l.targetState === 'reached').length
  const { price: breakevenSellPrice, coversOpen: excessCoversOpen } = breakevenSellPriceWithExcess(
    w.totalCostUsd,
    w.totalContracts,
    excessCreditUsd,
  )

  return {
    totalCostUsd: w.totalCostUsd,
    totalContracts: w.totalContracts,
    avgBuyPriceRaw: w.avgRaw,
    avgBuyPrice: w.avgAdjusted,
    targetSellPrice: target,
    estimatedProfitUsd: estimatedProfitUsd(w.totalContracts, w.avgAdjusted, target),
    currentProfitPct: currentProfitPct(w.avgAdjusted, currentPrice),
    targetState: lotTargetState(currentPrice, target),
    lotsAtTarget,
    lotsPending: lots.length - lotsAtTarget,
    excessCreditUsd: roundUsd(excessCreditUsd),
    breakevenSellPrice,
    excessCoversOpen,
  }
}

export function groupBySymbol(
  enriched: EnrichedLot[],
  excessBySymbol: Map<string, number> = new Map(),
): SymbolPositionGroup[] {
  const map = new Map<string, EnrichedLot[]>()
  for (const lot of enriched) {
    const list = map.get(lot.symbol) ?? []
    list.push(lot)
    map.set(lot.symbol, list)
  }
  return [...map.entries()]
    .map(([symbol, lots]) => {
      const sorted = sortLotsLifo(lots)
      const currentPrice = sorted[0]?.currentPrice ?? 0
      const totalRemainingQty = sorted.reduce((s, l) => s + l.remainingQty, 0)
      const totalInvestedUsd = roundUsd(sorted.reduce((s, l) => s + l.investedUsd, 0))
      const excessCreditUsd = excessBySymbol.get(symbol) ?? 0
      return {
        symbol,
        currentPrice,
        totalRemainingQty,
        totalInvestedUsd,
        aggregate: buildSymbolAggregate(sorted, DEFAULT_TARGET_PROFIT_PCT, excessCreditUsd),
        lots: sorted,
      }
    })
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
}

/** Aplica crédito de excedente desde cierres al agrupar posiciones abiertas. */
export function groupOpenPositions(
  lots: TradeLot[],
  pricesBySymbol: Record<string, number>,
  closedTrades: ClosedTrade[] = [],
): SymbolPositionGroup[] {
  const openLots = lots.filter((l) => l.status !== 'closed' && l.remainingQty > 0)
  const openLotsBySymbol = new Map<string, TradeLot[]>()
  for (const lot of openLots) {
    const list = openLotsBySymbol.get(lot.symbol) ?? []
    list.push(lot)
    openLotsBySymbol.set(lot.symbol, list)
  }

  const enriched = enrichLots(lots, pricesBySymbol)
  const excessBySymbol = excessCreditBySymbol(closedTrades, openLotsBySymbol)
  return groupBySymbol(enriched, excessBySymbol)
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}
