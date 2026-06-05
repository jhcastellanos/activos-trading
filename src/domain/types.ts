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

/** @deprecated Usar AccountGoalEvaluation desde DailyGoalService. */
export interface DailyGoalState {
  baseBalance: number
  goalPct: number
  goalAmount: number
  currentProgressUsd: number
  currentProgressPct: number
  targetCloseValue: number
  canRecalculateBase: boolean
  hadOvernightOpenLots: boolean
  date: string
}

/** @deprecated Usar GoalSnapshot. */
export interface DailySnapshot {
  id: string
  date: string
  baseBalance: number
  goalAmount: number
  actualResult: number
  dayStatus: DayStatus
  hadOvernightOpen: boolean
}

/** Estado del ciclo del objetivo de cuenta (1%). */
export type GoalCycleStatus =
  | 'new_day_cycle'
  | 'active_cycle'
  | 'carried_open_positions'
  | 'goal_reached'
  | 'non_trading_day'
  | 'awaiting_position_close'

/** Balance base persistido para el objetivo de cuenta. */
export interface GoalSnapshot {
  id: string
  baseBalance: number
  projectedBalance: number
  goalPct: number
  /** Fecha de operativa ET (YYYY-MM-DD). */
  tradingDate: string
  /** Momento de creación (ISO UTC). */
  createdAt: string
  /** Hora ET legible HH:mm:ss al crear. */
  createdTimeEt: string
  cycleStatus: GoalCycleStatus
  hadOpenPositionsAtCreation: boolean
}

/** Resultado procesado para el dashboard — sin lógica en el componente. */
export interface AccountGoalEvaluation {
  baseBalance: number
  baseSnapshotAt: string | null
  baseSnapshotTimeEt: string | null
  baseTradingDate: string | null
  currentBalance: number
  projectedBalance: number
  goalPct: number
  goalAmount: number
  gainAmount: number
  gainPercentage: number
  progressToGoalPct: number
  calendarDaysSinceBase: number
  tradingDaysSinceBase: number
  averageDailyGainPct: number
  cycleStatus: GoalCycleStatus
  message: string
  isTradingDay: boolean
  hasOpenPositions: boolean
  snapshotCreated: boolean
  goalReached: boolean
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

