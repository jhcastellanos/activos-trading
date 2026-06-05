import { DEFAULT_TARGET_PROFIT_PCT, NEAR_TARGET_THRESHOLD_PCT } from './constants'
import type { LotTargetState } from '../domain/types'

/** Precio mínimo de venta para lograr al menos `profitPct` de ganancia sobre el costo. */
export function targetSellPrice(buyPrice: number, profitPct = DEFAULT_TARGET_PROFIT_PCT): number {
  return roundPrice(buyPrice * (1 + profitPct / 100))
}

export function estimatedProfitUsd(
  quantity: number,
  buyPrice: number,
  sellPrice: number,
): number {
  return roundUsd((sellPrice - buyPrice) * quantity)
}

export function distanceToTarget(currentPrice: number, target: number): { usd: number; pct: number } {
  const usd = roundUsd(target - currentPrice)
  const pct = target > 0 ? roundPct(((target - currentPrice) / target) * 100) : 0
  return { usd, pct }
}

/** Ganancia/pérdida no realizada % respecto al precio de compra (no el objetivo 1,5%). */
export function currentProfitPct(buyPrice: number, currentPrice: number): number {
  if (buyPrice <= 0) return 0
  return roundPct(((currentPrice - buyPrice) / buyPrice) * 100)
}

export function lotTargetState(currentPrice: number, target: number): LotTargetState {
  if (currentPrice >= target) return 'reached'
  const { pct } = distanceToTarget(currentPrice, target)
  if (pct <= NEAR_TARGET_THRESHOLD_PCT) return 'near'
  return 'far'
}

function roundPrice(n: number): number {
  return Math.round(n * 100) / 100
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100
}
