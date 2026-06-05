import type { BrokerService } from './interfaces/BrokerService'
import type { SymbolPositionGroup } from '../domain/types'
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
}
