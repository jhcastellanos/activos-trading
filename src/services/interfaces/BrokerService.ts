import type {
  AccountSummary,
  ClosedTrade,
  DailyGoalState,
  DailySnapshot,
  TradeLot,
} from '../../domain/types'

/** Contrato único para Mock y Schwab API real. */
export interface BrokerService {
  readonly mode: 'demo' | 'schwab'

  getAccountSummary(): Promise<AccountSummary>
  getOpenLots(): Promise<TradeLot[]>
  getClosedTrades(): Promise<ClosedTrade[]>
  getDailyGoalState(): Promise<DailyGoalState>
  getDailySnapshots(): Promise<DailySnapshot[]>
  getQuotes(symbols: string[]): Promise<Record<string, number>>

  /**
   * Importar desde Schwab: sincroniza compras/ventas de activos y actualiza lotes.
   * Solo en modo `schwab` cuando la API esté aprobada.
   */
  syncTradesFromBroker?(): Promise<{ imported: number; updated: number }>

  /** Solo modo demo: simular operaciones localmente. */
  addLot?(lot: Omit<TradeLot, 'id'>): Promise<TradeLot>
  closeLotPartial?(lotId: string, qty: number, exitPrice: number): Promise<void>
}
