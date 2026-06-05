import { DEFAULT_TARGET_PROFIT_PCT } from './constants'

/** Colores de casilla en racha: amarillo / verde / azul / pérdida. */
export type TradeResultTier = 'yellow' | 'green' | 'blue' | 'loss'

const BLUE_MIN_PCT = 2

export function tradeResultTier(pnlPct: number): TradeResultTier {
  if (pnlPct < 0) return 'loss'
  if (pnlPct < DEFAULT_TARGET_PROFIT_PCT) return 'yellow'
  if (pnlPct <= BLUE_MIN_PCT) return 'green'
  return 'blue'
}

/** Racha “win”: trade con ≥ 1,5%. Racha “loss”: trade en pérdida. */
export function isStreakWin(pnlPct: number): boolean {
  return pnlPct >= DEFAULT_TARGET_PROFIT_PCT
}

export function isStreakLoss(pnlPct: number): boolean {
  return pnlPct < 0
}
