import type { AccountSummary, ClosedTrade, TradeLot } from '../../domain/types'

/** Contrato único para Mock y Schwab API real. */
export interface BrokerService {
  readonly mode: 'demo' | 'schwab'

  getAccountSummary(): Promise<AccountSummary>

  /** Valor total actual de la cuenta (equity). */
  getCurrentAccountValue(): Promise<number>

  /** Alias semántico de getCurrentAccountValue. */
  getAccountBalance(): Promise<number>

  getOpenLots(): Promise<TradeLot[]>

  /** Alias de getOpenLots. */
  getOpenPositions(): Promise<TradeLot[]>

  getClosedTrades(): Promise<ClosedTrade[]>
  getQuotes(symbols: string[]): Promise<Record<string, number>>

  syncTradesFromBroker?(): Promise<{ imported: number; updated: number }>

  addLot?(lot: Omit<TradeLot, 'id'>): Promise<TradeLot>
  closeLotPartial?(lotId: string, qty: number, exitPrice: number): Promise<void>
}
