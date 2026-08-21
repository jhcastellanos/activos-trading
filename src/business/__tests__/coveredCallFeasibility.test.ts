import { describe, expect, it } from 'vitest'
import {
  calculateCoveredCallFeasibility,
  daysToExpirationFromDate,
  type CoveredCallFeasibilityInputs,
} from '../coveredCallFeasibility'

const TSLL_INPUT: CoveredCallFeasibilityInputs = {
  ticker: 'TSLL',
  shareQuantity: 1000,
  avgBuyPrice: 8.79,
  totalCostBasis: 8789.9,
  contracts: 10,
  strikePrice: 9,
  originalPremiumPerShare: 0.1,
  netPremiumReceived: 93.34,
  currentCallPrice: 0.76,
  daysToExpiration: 0,
  expirationDate: null,
  currentAssetPrice: 9.75,
  estimatedSellPrice: 9.73,
  buyToCloseFee: 0,
  sellSharesFee: 0,
  assignmentFee: 0,
}

describe('calculateCoveredCallFeasibility', () => {
  it('calculates TSLL example — assignment vs BTC + sell', () => {
    const result = calculateCoveredCallFeasibility(TSLL_INPUT)!
    expect(result.valid).toBe(true)
    expect(result.coveredShares).toBe(1000)
    expect(result.netPremiumReceived).toBe(93.34)
    expect(result.scenarioAssignment.stockPnl).toBe(210.1)
    expect(result.scenarioAssignment.totalPnlNet).toBe(303.44)
    expect(result.scenarioBtcSell.buyToCloseCost).toBe(760)
    expect(result.scenarioBtcSell.callPnl).toBe(-666.66)
    expect(result.scenarioBtcSell.stockPnl).toBe(940.1)
    expect(result.scenarioBtcSell.totalPnlNet).toBe(273.44)
    expect(result.betterAlternative).toBe('assignment')
    expect(result.differenceUsd).toBe(30)
    expect(result.breakevenSellPriceQuick).toBe(9.76)
    expect(result.sellPriceGapPerShare).toBe(-0.03)
    expect(result.sellPriceGapTotal).toBe(-30)
  })

  it('derives net premium from original when net not provided', () => {
    const result = calculateCoveredCallFeasibility({
      ...TSLL_INPUT,
      netPremiumReceived: null,
    })!
    expect(result.netPremiumReceived).toBe(100)
  })

  it('uses proportional cost basis for uncovered shares', () => {
    const result = calculateCoveredCallFeasibility({
      ...TSLL_INPUT,
      shareQuantity: 1500,
      totalCostBasis: 13184.85,
    })!
    expect(result.coveredShares).toBe(1000)
    expect(result.uncoveredShares).toBe(500)
    expect(result.costBasisCovered).toBe(8789.9)
    expect(result.costBasisUncovered).toBe(4394.95)
  })

  it('computes intrinsic and extrinsic value', () => {
    const result = calculateCoveredCallFeasibility(TSLL_INPUT)!
    expect(result.intrinsicValuePerShare).toBe(0.75)
    expect(result.extrinsicValuePerShare).toBe(0.01)
    expect(result.extrinsicValueTotal).toBe(10)
    expect(result.moneyness).toBe('ITM')
  })

  it('flags insufficient coverage', () => {
    const result = calculateCoveredCallFeasibility({
      ...TSLL_INPUT,
      shareQuantity: 500,
      contracts: 10,
    })!
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('cubren'))).toBe(true)
  })

  it('incorporates fees into net results', () => {
    const result = calculateCoveredCallFeasibility({
      ...TSLL_INPUT,
      buyToCloseFee: 5,
      sellSharesFee: 3,
      assignmentFee: 2,
    })!
    expect(result.scenarioAssignment.totalPnlNet).toBe(301.44)
    expect(result.scenarioBtcSell.totalPnlNet).toBe(265.44)
  })
})

describe('daysToExpirationFromDate', () => {
  it('returns calendar days until expiration', () => {
    const ref = new Date(2026, 5, 7)
    expect(daysToExpirationFromDate('2026-06-07', ref)).toBe(0)
    expect(daysToExpirationFromDate('2026-06-10', ref)).toBe(3)
  })
})
