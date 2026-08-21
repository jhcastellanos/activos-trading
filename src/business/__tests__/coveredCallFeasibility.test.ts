import { describe, expect, it } from 'vitest'
import {
  calculateCoveredCallFeasibility,
  daysToExpirationFromDate,
  resolveDaysToExpiration,
  resolveInternalFees,
  resolveNetPremiumReceived,
  type CoveredCallFeasibilityInputs,
} from '../coveredCallFeasibility'

const TSLL_REFERENCE_DATE = new Date(2026, 5, 7)

const TSLL_INPUT: CoveredCallFeasibilityInputs = {
  ticker: 'TSLL',
  shareQuantity: 1000,
  avgBuyPrice: 8.79,
  totalCostBasis: null,
  contracts: 10,
  strikePrice: 9,
  originalPremiumPerShare: 0.1,
  netPremiumReceived: null,
  currentCallPrice: 0.76,
  expirationDate: '2026-06-07',
  currentAssetPrice: 9.75,
}

describe('calculateCoveredCallFeasibility', () => {
  it('calculates TSLL example with internal fees and sell at current price', () => {
    const result = calculateCoveredCallFeasibility(TSLL_INPUT, TSLL_REFERENCE_DATE)!
    expect(result.valid).toBe(true)
    expect(result.expirationDate).toBe('2026-06-07')
    expect(result.daysToExpiration).toBe(0)
    expect(result.coveredShares).toBe(1000)
    expect(result.netPremiumReceived).toBe(93)
    expect(result.costBasisCovered).toBe(8790)
    expect(result.scenarioAssignment.stockPnl).toBe(210)
    expect(result.scenarioAssignment.totalPnlNet).toBe(303)
    expect(result.scenarioBtcSell.buyToCloseCost).toBe(767)
    expect(result.scenarioBtcSell.callPnl).toBe(-674)
    expect(result.scenarioBtcSell.stockPnl).toBe(960)
    expect(result.scenarioBtcSell.totalPnlNet).toBe(286)
    expect(result.betterAlternative).toBe('assignment')
    expect(result.differenceUsd).toBe(17)
    expect(result.breakevenSellPriceQuick).toBe(9.76)
    expect(result.sellPriceGapPerShare).toBe(-0.02)
    expect(result.sellPriceGapTotal).toBe(-20)
  })

  it('derives net premium from original minus open contract fees', () => {
    expect(resolveNetPremiumReceived(TSLL_INPUT)).toBe(93)
  })

  it('uses proportional cost basis for uncovered shares', () => {
    const result = calculateCoveredCallFeasibility(
      {
        ...TSLL_INPUT,
        shareQuantity: 1500,
        totalCostBasis: 13184.85,
      },
      TSLL_REFERENCE_DATE,
    )!
    expect(result.coveredShares).toBe(1000)
    expect(result.uncoveredShares).toBe(500)
    expect(result.costBasisCovered).toBe(8789.9)
    expect(result.costBasisUncovered).toBe(4394.95)
  })

  it('computes intrinsic and extrinsic value', () => {
    const result = calculateCoveredCallFeasibility(TSLL_INPUT, TSLL_REFERENCE_DATE)!
    expect(result.intrinsicValuePerShare).toBe(0.75)
    expect(result.extrinsicValuePerShare).toBe(0.01)
    expect(result.extrinsicValueTotal).toBe(10)
    expect(result.moneyness).toBe('ITM')
  })

  it('flags insufficient coverage', () => {
    const result = calculateCoveredCallFeasibility(
      {
        ...TSLL_INPUT,
        shareQuantity: 500,
        contracts: 10,
      },
      TSLL_REFERENCE_DATE,
    )!
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('cubren'))).toBe(true)
  })

  it('applies internal option contract fees on open and close', () => {
    expect(resolveInternalFees(10)).toEqual({
      openCallFee: 7,
      buyToCloseFee: 7,
      sellSharesFee: 0,
      assignmentFee: 0,
    })
  })
})

describe('daysToExpirationFromDate', () => {
  it('returns calendar days until expiration', () => {
    const ref = new Date(2026, 5, 7)
    expect(daysToExpirationFromDate('2026-06-07', ref)).toBe(0)
    expect(daysToExpirationFromDate('2026-06-10', ref)).toBe(3)
  })

  it('resolveDaysToExpiration uses expiration date only', () => {
    const ref = new Date(2026, 5, 7)
    expect(resolveDaysToExpiration('2026-06-10', ref)).toBe(3)
  })
})
