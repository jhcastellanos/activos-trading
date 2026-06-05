/** Ganancia mínima por lote al vender (regla de negocio). */
export const DEFAULT_TARGET_PROFIT_PCT = 1.5

/** Se suma al precio de compra promedio (y a cada lote) antes de calcular el 1,5%. */
export const AVG_BUY_BUFFER_USD = 0.01

/** Objetivo de crecimiento diario sobre la base de cuenta. */
export const DEFAULT_DAILY_GOAL_PCT = 1

/** Umbral para estado visual "cerca del objetivo" (% restante al target). */
export const NEAR_TARGET_THRESHOLD_PCT = 0.3
