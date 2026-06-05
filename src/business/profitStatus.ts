import { DEFAULT_TARGET_PROFIT_PCT } from './constants'

/** Estado visual del % de ganancia vs objetivo 1,5%. */
export type ProfitVisualStatus = 'met' | 'pending' | 'loss'

/**
 * Verde: ≥ 1,5% (objetivo cumplido)
 * Amarillo: 0% … 1,499% (aún no llega al 1,5%)
 * Rojo: < 0% (en pérdida)
 */
export function profitVisualStatus(currentProfitPct: number): ProfitVisualStatus {
  if (currentProfitPct >= DEFAULT_TARGET_PROFIT_PCT) return 'met'
  if (currentProfitPct >= 0) return 'pending'
  return 'loss'
}
