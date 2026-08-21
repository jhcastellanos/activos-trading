import { describe, expect, it } from 'vitest'
import {
  FEASIBILITY_TICKER_CATALOG,
  filterFeasibilityTickers,
  findFeasibilityTicker,
} from '../feasibilityTickerCatalog'

describe('feasibilityTickerCatalog', () => {
  it('includes Magnificent 7, featured tickers and 2X leveraged pairs', () => {
    expect(FEASIBILITY_TICKER_CATALOG.filter((t) => t.group === 'mag7')).toHaveLength(7)
    expect(FEASIBILITY_TICKER_CATALOG.filter((t) => t.group === 'featured')).toHaveLength(9)
    expect(FEASIBILITY_TICKER_CATALOG.filter((t) => t.group === 'leveraged2x')).toHaveLength(13)
    expect(FEASIBILITY_TICKER_CATALOG).toHaveLength(29)
  })

  it('filters by symbol, name or base symbol', () => {
    expect(filterFeasibilityTickers('tsl').map((t) => t.symbol)).toEqual(['TSLA', 'TSLL'])
    expect(filterFeasibilityTickers('apple')[0]?.symbol).toBe('AAPL')
    expect(filterFeasibilityTickers('NVDA').map((t) => t.symbol)).toEqual(['NVDA', 'NVDU'])
  })

  it('finds ticker by symbol', () => {
    expect(findFeasibilityTicker('nvda')?.name).toBe('NVIDIA')
    expect(findFeasibilityTicker('nvdu')?.baseSymbol).toBe('NVDA')
  })
})
