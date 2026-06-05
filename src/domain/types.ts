/** Modo de conexión con el broker (sin segundo login propio). */
export type ConnectionMode = 'demo' | 'disconnected' | 'schwab'

export type LotStatus = 'open' | 'partial' | 'closed'

/** Distancia visual al precio objetivo de venta (1,5%). */
export type LotTargetState = 'far' | 'near' | 'reached'

/** Cómo se cerró el trade: LIFO sugerido, simulación demo, o sync desde Schwab API. */
export type CloseMethod = 'lifo' | 'demo' | 'schwab_sync'

export type DayStatus = 'open' | 'closed_all' | 'carried_overnight'

/** Lote de compra (unidad LIFO). */
export interface TradeLot {
  id: string
  symbol: string
  boughtAt: string // ISO
  quantity: number
  remainingQty: number
  avgBuyPrice: number
  status: LotStatus
  notes?: string
}

/** Trade cerrado (historial). */
export interface ClosedTrade {
  id: string
  symbol: string
  boughtAt: string
  soldAt: string
  quantity: number
  entryPrice: number
  exitPrice: number
  pnlUsd: number
  pnlPct: number
  durationMs: number
  closeMethod: CloseMethod
  notes?: string
}

/** Resumen de cuenta (dashboard). */
export interface AccountSummary {
  totalValue: number
  dayChangeUsd: number
  dayChangePct: number
  realizedPnl: number
  unrealizedPnl: number
  openPositionsCount: number
  asOf: string
}

/** Reglas de objetivo diario del 1%. */
export interface DailyGoalState {
  /** Base sobre la que se calcula el 1% (no fluctúa si hay overnight). */
  baseBalance: number
  goalPct: number
  goalAmount: number
  currentProgressUsd: number
  currentProgressPct: number
  targetCloseValue: number
  /** Si false, no recalcular base por movimiento intradía. */
  canRecalculateBase: boolean
  hadOvernightOpenLots: boolean
  date: string // YYYY-MM-DD
}

export interface DailySnapshot {
  id: string
  date: string
  baseBalance: number
  goalAmount: number
  actualResult: number
  dayStatus: DayStatus
  hadOvernightOpen: boolean
}

/** Lote enriquecido para UI (cálculos aplicados). */
export interface EnrichedLot extends TradeLot {
  investedUsd: number
  targetSellPrice: number
  targetProfitPct: number
  estimatedProfitUsd: number
  currentPrice: number
  distanceToTargetUsd: number
  distanceToTargetPct: number
  targetState: LotTargetState
  /** Precio de compra del lote + $0.01 (base de cálculo). */
  adjustedBuyPrice: number
  /** % actual vs adjustedBuyPrice. */
  currentProfitPct: number
  sellPriority: number
  sellFirst: boolean
}

/** Objetivo 1,5% sobre toda la posición abierta del símbolo (precio promedio ponderado). */
export interface SymbolAggregate {
  totalCostUsd: number
  totalContracts: number
  /** totalCostUsd / totalContracts (sin el +$0.01). */
  avgBuyPriceRaw: number
  /** Promedio ajustado: avgBuyPriceRaw + $0.01 — base del 1,5% y % total. */
  avgBuyPrice: number
  targetSellPrice: number
  estimatedProfitUsd: number
  /** % actual vs avgBuyPrice ajustado. */
  currentProfitPct: number
  targetState: LotTargetState
  lotsAtTarget: number
  lotsPending: number
}

export interface SymbolPositionGroup {
  symbol: string
  currentPrice: number
  totalRemainingQty: number
  totalInvestedUsd: number
  aggregate: SymbolAggregate
  lots: EnrichedLot[]
}

