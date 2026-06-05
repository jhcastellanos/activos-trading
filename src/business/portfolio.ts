import type { EnrichedLot, SymbolAggregate, SymbolPositionGroup, TradeLot } from '../domain/types'
import { assignSellPriority } from './lifo'
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
  const withPriority = assignSellPriority(openLots)

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
): SymbolAggregate {
  const w = weightedAvgBuy(lots)
  const currentPrice = lots[0]?.currentPrice ?? w.avgAdjusted
  const target = targetSellPrice(w.avgAdjusted, profitPct)
  const lotsAtTarget = lots.filter((l) => l.targetState === 'reached').length

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
  }
}

export function groupBySymbol(enriched: EnrichedLot[]): SymbolPositionGroup[] {
  const map = new Map<string, EnrichedLot[]>()
  for (const lot of enriched) {
    const list = map.get(lot.symbol) ?? []
    list.push(lot)
    map.set(lot.symbol, list)
  }
  return [...map.entries()]
    .map(([symbol, lots]) => {
      const sorted = [...lots].sort((a, b) => a.sellPriority - b.sellPriority)
      const currentPrice = sorted[0]?.currentPrice ?? 0
      const totalRemainingQty = sorted.reduce((s, l) => s + l.remainingQty, 0)
      const totalInvestedUsd = roundUsd(sorted.reduce((s, l) => s + l.investedUsd, 0))
      return {
        symbol,
        currentPrice,
        totalRemainingQty,
        totalInvestedUsd,
        aggregate: buildSymbolAggregate(sorted),
        lots: sorted,
      }
    })
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}
