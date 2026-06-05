import type { AssetScalpingProfile, LeveragedIssuer, ScalpingSector } from '../domain/types'
import { isAllowedScalpingSector } from './scalpingSectors'

const ISSUER_RANK: Record<LeveragedIssuer, number> = {
  direxion: 0,
  graniteshares: 1,
  defiance: 2,
  other: 3,
}

export interface ScalpingCatalogEntry {
  symbol: string
  name: string
  sector: ScalpingSector
  tradeBull: string
  tradeLeverage: 2 | 3
  tradeBullIssuer: LeveragedIssuer
  tradeInverse?: string
  price: number
  nav: number
  avgDailyRangePct: number
  turnoverPct: number
}

/**
 * Un solo activo por ETF bull (x2/x3). Si hay duplicado, gana el de emisor con mayor prioridad.
 */
export function dedupeScalpingCatalog(entries: ScalpingCatalogEntry[]): AssetScalpingProfile[] {
  const sorted = [...entries]
    .filter((e) => isAllowedScalpingSector(e.sector))
    .sort((a, b) => ISSUER_RANK[a.tradeBullIssuer] - ISSUER_RANK[b.tradeBullIssuer])

  const usedBulls = new Set<string>()
  const result: AssetScalpingProfile[] = []

  for (const entry of sorted) {
    if (usedBulls.has(entry.tradeBull)) continue
    usedBulls.add(entry.tradeBull)
    result.push({ ...entry })
  }

  return result
}
