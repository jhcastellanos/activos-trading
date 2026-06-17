import type { BrokerService } from './interfaces/BrokerService'
import type { ClosedTrade, SymbolPositionGroup, TradeLot } from '../domain/types'
import { groupOpenPositions } from '../business/portfolio'

export class PortfolioService {
  constructor(private readonly broker: BrokerService) {}

  async getOpenPositionGroups(): Promise<SymbolPositionGroup[]> {
    const [lots, closed] = await Promise.all([
      this.broker.getOpenLots(),
      this.broker.getClosedTrades(),
    ])
    const symbols = [...new Set(lots.map((l) => l.symbol))]
    const quotes = symbols.length ? await this.broker.getQuotes(symbols) : {}
    return this.getOpenPositionGroupsFrom(lots, quotes, closed)
  }

  /** Permite reutilizar lotes, cotizaciones y cierres ya obtenidos (refresco de precio). */
  getOpenPositionGroupsFrom(
    lots: TradeLot[],
    quotes: Record<string, number>,
    closedTrades: ClosedTrade[] = [],
  ): SymbolPositionGroup[] {
    return groupOpenPositions(lots, quotes, closedTrades)
  }
}
