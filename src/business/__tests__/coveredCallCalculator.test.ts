import { describe, expect, it } from 'vitest'
import {
  calculateCoveredCallMetrics,
  countBusinessDaysToExpiration,
  interpretDailyReturnLabel,
  requiredBidForTargetDailyPct,
  validateCoveredCallInputs,
} from '../coveredCallCalculator'

const exampleInput = {
  tradePrice: 6.51,
  contracts: 244,
  strikePrice: 8.0,
  bid: 0.5,
  daysToExpiration: 127,
}

const refDate = new Date('2026-06-07T12:00:00')

describe('coveredCallCalculator', () => {
  it('127 calendar days ≈ 91 business days', () => {
    const businessDays = countBusinessDaysToExpiration(127, refDate)
    expect(businessDays).toBeGreaterThanOrEqual(89)
    expect(businessDays).toBeLessThanOrEqual(92)
  })

  it('valida entradas inválidas', () => {
    expect(validateCoveredCallInputs({ ...exampleInput, tradePrice: 0 })).toHaveLength(1)
    expect(validateCoveredCallInputs({ ...exampleInput, contracts: 0.5 })).toHaveLength(1)
    expect(validateCoveredCallInputs({ ...exampleInput, bid: -1 })).toHaveLength(1)
  })

  it('calcula métricas del ejemplo del prompt', () => {
    const result = calculateCoveredCallMetrics(exampleInput, refDate)
    expect(result).not.toBeNull()
    expect(result!.totalInvested).toBe(158844)
    expect(result!.grossPremium).toBe(12200)
    expect(result!.contractFees).toBe(170.8)
    expect(result!.netPremium).toBe(12029.2)
    expect(result!.capitalGain).toBe(36356)
    expect(result!.totalCoveredCallProfit).toBe(48385.2)
    expect(result!.dailyPercentRatio).toBeCloseTo(0.3347, 3)
    expect(result!.calendarDays).toBe(127)
  })

  it('permite capital gain negativo si strike < trade price', () => {
    const result = calculateCoveredCallMetrics(
      { ...exampleInput, strikePrice: 5.0 },
      refDate,
    )
    expect(result!.capitalGain).toBeLessThan(0)
  })

  it('calcula required bid para targets del prompt (91 business days)', () => {
    const totalInvested = 158844
    const capitalGain = 36356
    const contractFees = 170.8
    const contracts = 244
    const businessDays = 91

    expect(
      requiredBidForTargetDailyPct(0.3, totalInvested, capitalGain, contractFees, contracts, businessDays),
    ).toBeCloseTo(0.29, 2)
    expect(
      requiredBidForTargetDailyPct(0.5, totalInvested, capitalGain, contractFees, contracts, businessDays),
    ).toBeCloseTo(1.48, 2)
    expect(
      requiredBidForTargetDailyPct(1.0, totalInvested, capitalGain, contractFees, contracts, businessDays),
    ).toBeCloseTo(4.44, 2)
    expect(
      requiredBidForTargetDailyPct(1.5, totalInvested, capitalGain, contractFees, contracts, businessDays),
    ).toBeCloseTo(7.4, 2)
  })

  it('interpreta labels de daily return', () => {
    expect(interpretDailyReturnLabel(0.2)).toBe('Low Daily Return')
    expect(interpretDailyReturnLabel(0.335)).toBe('Moderate Daily Return')
    expect(interpretDailyReturnLabel(0.6)).toBe('Strong Daily Return')
    expect(interpretDailyReturnLabel(1.2)).toBe('Excellent Daily Return')
    expect(interpretDailyReturnLabel(1.5)).toBe('Exceptional Daily Return')
  })

  it('marca target más cercano al bid actual', () => {
    const result = calculateCoveredCallMetrics(exampleInput, refDate)
    const closest = result!.targetBids.find((t) => t.isClosestToCurrentBid)
    expect(closest).toBeDefined()
    expect(closest!.targetDailyPct).toBe(0.3)
  })
})
