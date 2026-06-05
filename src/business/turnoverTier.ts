import type { TurnoverTier } from '../domain/types'

export const TURNOVER_TIER_LABELS: Record<TurnoverTier, string> = {
  normal: 'Normal',
  active: 'Activo',
  very_active: 'Muy activo',
  extreme: 'Extremadamente activo',
}

/** Clasificación de liquidez por % de rotación diaria. */
export function classifyTurnover(turnoverPct: number): TurnoverTier {
  if (turnoverPct >= 30) return 'extreme'
  if (turnoverPct >= 15) return 'very_active'
  if (turnoverPct >= 5) return 'active'
  return 'normal'
}
