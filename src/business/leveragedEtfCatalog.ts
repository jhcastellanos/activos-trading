import type { LeveragedIssuer } from '../domain/types'

export type { LeveragedIssuer }

export const ISSUER_PRIORITY: LeveragedIssuer[] = [
  'direxion',
  'graniteshares',
  'defiance',
  'other',
]

export const ISSUER_LABELS: Record<LeveragedIssuer, string> = {
  direxion: 'Direxion',
  graniteshares: 'GraniteShares',
  defiance: 'Defiance',
  other: 'Otro',
}

export interface LeveragedEtfEntry {
  baseSymbol: string
  symbol: string
  leverage: 2 | 3
  issuer: LeveragedIssuer
}

const TECH_X2: LeveragedEtfEntry[] = [
  { baseSymbol: '_TECH', symbol: 'QLD', leverage: 2, issuer: 'direxion' },
  { baseSymbol: '_TECH', symbol: 'TQQQ', leverage: 3, issuer: 'direxion' },
]

function techPairs(symbols: string[]): LeveragedEtfEntry[] {
  return symbols.flatMap((base) => TECH_X2.map((e) => ({ ...e, baseSymbol: base })))
}

function semisPairs(symbols: string[]): LeveragedEtfEntry[] {
  return symbols.flatMap((base) => [
    { baseSymbol: base, symbol: 'SOXL', leverage: 3, issuer: 'direxion' },
    { baseSymbol: base, symbol: 'USD', leverage: 2, issuer: 'other' },
  ])
}

function nuclearPairs(symbols: string[]): LeveragedEtfEntry[] {
  return symbols.map((base) => ({
    baseSymbol: base,
    symbol: 'URAX',
    leverage: 2 as const,
    issuer: 'defiance' as const,
  }))
}

function defensePairs(symbols: string[]): LeveragedEtfEntry[] {
  return symbols.map((base) => ({
    baseSymbol: base,
    symbol: 'DFEN',
    leverage: 3 as const,
    issuer: 'direxion' as const,
  }))
}

function roboticsPairs(symbols: string[]): LeveragedEtfEntry[] {
  return symbols.flatMap((base) => [
    { baseSymbol: base, symbol: 'QLD', leverage: 2, issuer: 'direxion' },
    { baseSymbol: base, symbol: 'TECL', leverage: 3, issuer: 'direxion' },
  ])
}

function materialsPairs(symbols: string[]): LeveragedEtfEntry[] {
  return symbols.flatMap((base) => [
    { baseSymbol: base, symbol: 'USD', leverage: 2, issuer: 'other' },
    { baseSymbol: base, symbol: 'SOXL', leverage: 3, issuer: 'direxion' },
  ])
}

const IA_BASES = ['AIQ', 'CHAT', 'ARKQ', 'WTAI', 'THNQ', 'AIEQ', 'IVES']
const TECH_BASES = ['QQQ', 'XLK', 'VGT', 'SKYY', 'IGV', 'FTEC', 'QTEC', 'IGN']
const DATA_BASES = ['SRVR', 'DTCR', 'IDGT', 'WCLD', 'CLOU', 'INDS']
const SEMIS_BASES = ['SOXX', 'SMH', 'XSD', 'PSI', 'FTXL', 'SOXQ', 'XSDG']
const NUCLEAR_BASES = ['URA', 'NLR', 'URNM', 'NUKZ', 'URAN', 'NUCL']
const DEFENSE_BASES = ['ITA', 'PPA', 'XAR', 'ARKX', 'UFO', 'SHLD']
const ROBOTICS_BASES = ['BOTZ', 'ROBO', 'IRBO', 'UBOT', 'HTEC', 'KOMP']
const MATERIALS_BASES = ['REMX', 'LIT', 'BATT', 'COPX', 'PICK', 'GOEX']

/**
 * Catálogo de pares apalancados por ETF base.
 * Orden de emisor: Direxion → GraniteShares → Defiance → otros.
 */
export const LEVERAGED_ETF_CATALOG: LeveragedEtfEntry[] = [
  ...techPairs(IA_BASES),
  ...techPairs(TECH_BASES),
  ...techPairs(DATA_BASES),
  ...semisPairs(SEMIS_BASES),
  ...nuclearPairs(NUCLEAR_BASES),
  ...defensePairs(DEFENSE_BASES),
  ...roboticsPairs(ROBOTICS_BASES),
  ...materialsPairs(MATERIALS_BASES),
]
