import type { LeveragedIssuer } from '../domain/types'
import {
  ISSUER_PRIORITY,
  LEVERAGED_ETF_CATALOG,
  type LeveragedEtfEntry,
} from './leveragedEtfCatalog'

export interface LeveragedPairRecommendation {
  tradeX2: string
  tradeX2Issuer: LeveragedIssuer
  tradeX3: string
  tradeX3Issuer: LeveragedIssuer
}

function pickByIssuer(
  entries: LeveragedEtfEntry[],
  leverage: 2 | 3,
): LeveragedEtfEntry | null {
  for (const issuer of ISSUER_PRIORITY) {
    const match = entries.find((e) => e.leverage === leverage && e.issuer === issuer)
    if (match) return match
  }
  return entries.find((e) => e.leverage === leverage) ?? null
}

/** Recomienda x2/x3 respetando Direxion → GraniteShares → Defiance → otros. */
export function resolveLeveragedPairs(
  baseSymbol: string,
  catalog: LeveragedEtfEntry[] = LEVERAGED_ETF_CATALOG,
): LeveragedPairRecommendation {
  const entries = catalog.filter((e) => e.baseSymbol === baseSymbol)
  const x2 = pickByIssuer(entries, 2)
  const x3 = pickByIssuer(entries, 3)

  return {
    tradeX2: x2?.symbol ?? '—',
    tradeX2Issuer: x2?.issuer ?? 'other',
    tradeX3: x3?.symbol ?? '—',
    tradeX3Issuer: x3?.issuer ?? 'other',
  }
}
