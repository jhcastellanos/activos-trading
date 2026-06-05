import type { BrokerService } from '../interfaces/BrokerService'
import type {
  AccountSummary,
  ClosedTrade,
  DailyGoalState,
  DailySnapshot,
  TradeLot,
} from '../../domain/types'

/**
 * Adaptador futuro: normaliza respuestas de la API Schwab al dominio interno.
 * Mientras no haya credenciales aprobadas, lanzar o delegar a Mock.
 */
export class SchwabBrokerService implements BrokerService {
  readonly mode = 'schwab' as const

  /** Reservado para consultas por usuario en Neon cuando la API esté activa. */
  constructor(readonly userId: string) {
    void userId
  }

  async getAccountSummary(): Promise<AccountSummary> {
    throw new Error('SchwabBrokerService: pendiente de integración con API aprobada')
  }

  async getOpenLots(): Promise<TradeLot[]> {
    throw new Error('SchwabBrokerService: pendiente de sync de posiciones')
  }

  async getClosedTrades(): Promise<ClosedTrade[]> {
    throw new Error('SchwabBrokerService: pendiente de sync de transacciones')
  }

  async getDailyGoalState(): Promise<DailyGoalState> {
    throw new Error('SchwabBrokerService: pendiente')
  }

  async getDailySnapshots(): Promise<DailySnapshot[]> {
    throw new Error('SchwabBrokerService: pendiente')
  }

  async getQuotes(): Promise<Record<string, number>> {
    throw new Error('SchwabBrokerService: pendiente de market data')
  }
}
