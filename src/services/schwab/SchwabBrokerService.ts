import type { BrokerService } from '../interfaces/BrokerService'
import type { AccountSummary, ClosedTrade, TradeLot } from '../../domain/types'

/**
 * Adaptador futuro: normaliza respuestas de la API Schwab al dominio interno.
 */
export class SchwabBrokerService implements BrokerService {
  readonly mode = 'schwab' as const

  constructor(readonly userId: string) {
    void userId
  }

  async getAccountSummary(): Promise<AccountSummary> {
    throw new Error('SchwabBrokerService: pendiente de integración con API aprobada')
  }

  async getCurrentAccountValue(): Promise<number> {
    const summary = await this.getAccountSummary()
    return summary.totalValue
  }

  async getAccountBalance(): Promise<number> {
    return this.getCurrentAccountValue()
  }

  async getOpenLots(): Promise<TradeLot[]> {
    throw new Error('SchwabBrokerService: pendiente de sync de posiciones')
  }

  async getOpenPositions(): Promise<TradeLot[]> {
    return this.getOpenLots()
  }

  async getClosedTrades(): Promise<ClosedTrade[]> {
    throw new Error('SchwabBrokerService: pendiente de sync de transacciones')
  }

  async getQuotes(): Promise<Record<string, number>> {
    throw new Error('SchwabBrokerService: pendiente de market data')
  }
}
