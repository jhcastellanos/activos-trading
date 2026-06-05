import type {
  AssetScalpingProfile,
  RankedScalpingAsset,
  ScalpingSector,
  TurnoverTier,
} from '../domain/types'
import { isAllowedScalpingSector } from './scalpingSectors'
import { classifyTurnover } from './turnoverTier'
import { roundPct } from './goalCalculations'

export interface ScalpingUniverseResult {
  top: RankedScalpingAsset[]
  sectorFilter: ScalpingSector | null
  limit: number
}

/** Descuento NAV: positivo = precio por debajo del NAV (señal alcista de convergencia). */
export function navDiscountPct(price: number, nav: number): number {
  if (nav <= 0) return 0
  return roundPct(((nav - price) / nav) * 100)
}

function turnoverPoints(turnoverPct: number): number {
  if (turnoverPct >= 30) return 35
  if (turnoverPct >= 15) return 25 + ((turnoverPct - 15) / 15) * 10
  if (turnoverPct >= 5) return 15 + ((turnoverPct - 5) / 10) * 10
  return (turnoverPct / 5) * 15
}

/**
 * Puntuación para scalping intradía:
 * - Range% (~55%): amplitud diaria — más movimiento = más oportunidad de 1,5%.
 * - Turnover% (~35%): liquidez para entrar/salir sin quedar atrapado.
 * - NAV (~10%): bonus si cotiza bajo NAV (convergencia alcista potencial).
 */
export function scalpJuiceScore(profile: AssetScalpingProfile, maxRangePct: number): number {
  const rangeScore = maxRangePct > 0 ? (profile.avgDailyRangePct / maxRangePct) * 55 : 0
  const turnoverScore = turnoverPoints(profile.turnoverPct)
  const discount = navDiscountPct(profile.price, profile.nav)
  const navScore = discount > 0 ? Math.min(10, discount * 2) : 0
  return Math.round((rangeScore + turnoverScore + navScore) * 10) / 10
}

function enrich(profile: AssetScalpingProfile, maxRangePct: number): RankedScalpingAsset {
  const turnoverTier = classifyTurnover(profile.turnoverPct)
  const discount = navDiscountPct(profile.price, profile.nav)
  return {
    ...profile,
    rank: 0,
    turnoverTier,
    navDiscountPct: discount,
    juiceScore: scalpJuiceScore(profile, maxRangePct),
    priceBelowNav: profile.price < profile.nav,
  }
}

export function rankScalpingUniverse(
  profiles: AssetScalpingProfile[],
  topCount = 50,
  sector?: ScalpingSector,
): ScalpingUniverseResult {
  let eligible = profiles.filter((p) => isAllowedScalpingSector(p.sector))
  if (sector) {
    eligible = eligible.filter((p) => p.sector === sector)
  }

  const maxRangePct = Math.max(...eligible.map((p) => p.avgDailyRangePct), 0.01)
  const top = eligible
    .map((p) => enrich(p, maxRangePct))
    .sort((a, b) => b.juiceScore - a.juiceScore)
    .slice(0, topCount)
    .map((item, i) => ({ ...item, rank: i + 1 }))

  return { top, sectorFilter: sector ?? null, limit: topCount }
}

export function turnoverTierClass(tier: TurnoverTier): string {
  return `turnover-${tier.replace('_', '-')}`
}
