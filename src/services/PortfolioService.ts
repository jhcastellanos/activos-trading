import type { BrokerService } from './interfaces/BrokerService'
import type { SellPlanItem, SymbolPositionGroup } from '../domain/types'
import { enrichLots, groupBySymbol } from '../business/portfolio'

export class PortfolioService {
  constructor(private readonly broker: BrokerService) {}

  async getOpenPositionGroups(): Promise<SymbolPositionGroup[]> {
    const lots = await this.broker.getOpenLots()
    const symbols = [...new Set(lots.map((l) => l.symbol))]
    const quotes = symbols.length ? await this.broker.getQuotes(symbols) : {}
    return this.getOpenPositionGroupsFrom(lots, quotes)
  }

  /** Permite reutilizar lotes y cotizaciones ya obtenidas (refresco de precio). */
  getOpenPositionGroupsFrom(
    lots: Awaited<ReturnType<BrokerService['getOpenLots']>>,
    quotes: Record<string, number>,
  ): SymbolPositionGroup[] {
    const enriched = enrichLots(lots, quotes)
    return groupBySymbol(enriched)
  }

  async getSellPlan(): Promise<SellPlanItem[]> {
    const groups = await this.getOpenPositionGroups()
    return groups.flatMap((g) =>
      g.lots.map((lot) => ({
        lotId: lot.id,
        symbol: lot.symbol,
        quantity: lot.remainingQty,
        targetSellPrice: lot.targetSellPrice,
        estimatedProfitUsd: lot.estimatedProfitUsd,
        sellPriority: lot.sellPriority,
        sellFirst: lot.sellFirst,
      })),
    )
  }
}
