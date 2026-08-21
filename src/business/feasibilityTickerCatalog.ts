export type FeasibilityTickerGroup = 'mag7' | 'featured' | 'leveraged2x'

export type FeasibilityTickerOption = {
  symbol: string
  name: string
  group: FeasibilityTickerGroup
  /** Activo base cuando el ticker es un ETF apalancado 2X. */
  baseSymbol?: string
}

export const FEASIBILITY_TICKER_GROUP_LABELS: Record<FeasibilityTickerGroup, string> = {
  mag7: 'Magníficas 7',
  featured: 'Más negociadas',
  leveraged2x: 'Apalancadas 2X',
}

const MAG7: FeasibilityTickerOption[] = [
  { symbol: 'AAPL', name: 'Apple', group: 'mag7' },
  { symbol: 'MSFT', name: 'Microsoft', group: 'mag7' },
  { symbol: 'GOOGL', name: 'Alphabet', group: 'mag7' },
  { symbol: 'AMZN', name: 'Amazon', group: 'mag7' },
  { symbol: 'NVDA', name: 'NVIDIA', group: 'mag7' },
  { symbol: 'META', name: 'Meta Platforms', group: 'mag7' },
  { symbol: 'TSLA', name: 'Tesla', group: 'mag7' },
]

const FEATURED: FeasibilityTickerOption[] = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', group: 'featured' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', group: 'featured' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', group: 'featured' },
  { symbol: 'AVGO', name: 'Broadcom', group: 'featured' },
  { symbol: 'NFLX', name: 'Netflix', group: 'featured' },
  { symbol: 'JPM', name: 'JPMorgan Chase', group: 'featured' },
  { symbol: 'V', name: 'Visa', group: 'featured' },
  { symbol: 'COST', name: 'Costco', group: 'featured' },
  { symbol: 'PLTR', name: 'Palantir', group: 'featured' },
]

/** ETF bull 2X ligados a los tickers anteriores (cuando existen en mercado). */
const LEVERAGED_2X: FeasibilityTickerOption[] = [
  { symbol: 'AAPU', name: 'GraniteShares 2X Long AAPL Daily ETF', group: 'leveraged2x', baseSymbol: 'AAPL' },
  { symbol: 'MSFL', name: 'GraniteShares 2X Long MSFT Daily ETF', group: 'leveraged2x', baseSymbol: 'MSFT' },
  { symbol: 'GGLL', name: 'GraniteShares 2X Long GOOGL Daily ETF', group: 'leveraged2x', baseSymbol: 'GOOGL' },
  { symbol: 'AMZU', name: 'GraniteShares 2X Long AMZN Daily ETF', group: 'leveraged2x', baseSymbol: 'AMZN' },
  { symbol: 'NVDU', name: 'Direxion Daily NVDA Bull 2X Shares', group: 'leveraged2x', baseSymbol: 'NVDA' },
  { symbol: 'METU', name: 'Direxion Daily META Bull 2X Shares', group: 'leveraged2x', baseSymbol: 'META' },
  { symbol: 'TSLL', name: 'Direxion Daily TSLA Bull 2X Shares', group: 'leveraged2x', baseSymbol: 'TSLA' },
  { symbol: 'SSO', name: 'ProShares Ultra S&P500 2X (SPY)', group: 'leveraged2x', baseSymbol: 'SPY' },
  { symbol: 'QLD', name: 'ProShares Ultra QQQ 2X (QQQ)', group: 'leveraged2x', baseSymbol: 'QQQ' },
  { symbol: 'AMUU', name: 'Direxion Daily AMD Bull 2X Shares', group: 'leveraged2x', baseSymbol: 'AMD' },
  { symbol: 'AVL', name: 'GraniteShares 2X Long AVGO Daily ETF', group: 'leveraged2x', baseSymbol: 'AVGO' },
  { symbol: 'NFLU', name: 'GraniteShares 2X Long NFLX Daily ETF', group: 'leveraged2x', baseSymbol: 'NFLX' },
  { symbol: 'PLTU', name: 'GraniteShares 2X Long PLTR Daily ETF', group: 'leveraged2x', baseSymbol: 'PLTR' },
]

/** Magníficas 7 + más negociadas + sus apalancadas 2X disponibles. */
export const FEASIBILITY_TICKER_CATALOG: FeasibilityTickerOption[] = [
  ...MAG7,
  ...FEATURED,
  ...LEVERAGED_2X,
]

export function tickerLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${encodeURIComponent(symbol.trim().toUpperCase())}?format=png`
}

export function filterFeasibilityTickers(
  query: string,
  catalog = FEASIBILITY_TICKER_CATALOG,
): FeasibilityTickerOption[] {
  const q = query.trim().toUpperCase()
  if (!q) return catalog
  return catalog.filter(
    (item) =>
      item.symbol.includes(q) ||
      item.name.toUpperCase().includes(q) ||
      item.baseSymbol?.includes(q),
  )
}

export function findFeasibilityTicker(
  symbol: string,
  catalog = FEASIBILITY_TICKER_CATALOG,
): FeasibilityTickerOption | undefined {
  const normalized = symbol.trim().toUpperCase()
  if (!normalized) return undefined
  return catalog.find((item) => item.symbol === normalized)
}
