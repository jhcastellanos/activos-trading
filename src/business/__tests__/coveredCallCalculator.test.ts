import { describe, expect, it } from 'vitest'
import {
  calculateCoveredCallMetrics,
  countBusinessDaysToExpiration,
  dailyPercentRatio,
  interpretDailyReturnLabel,
  requiredBidForTargetDailyPct,
  totalReturnPct,
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

  it('calcula métricas del ejemplo largo del prompt', () => {
    const result = calculateCoveredCallMetrics(exampleInput, refDate)
    expect(result).not.toBeNull()
    expect(result!.totalInvested).toBe(158844)
    expect(result!.totalCoveredCallProfit).toBe(48385.2)
    expect(result!.totalReturnPct).toBeCloseTo(30.46, 1)
    expect(result!.dailyPercentRatio).toBeCloseTo(0.2396, 3)
    expect(result!.calendarDays).toBe(127)
  })

  it('daily % usa días calendario — trade corto del usuario', () => {
    const ref = new Date('2026-08-20T12:00:00')
    const result = calculateCoveredCallMetrics(
      {
        tradePrice: 8.79,
        contracts: 10,
        strikePrice: 9,
        bid: 0.1,
        daysToExpiration: 2,
      },
      ref,
    )
    expect(result!.totalReturnPct).toBeCloseTo(3.45, 2)
    expect(result!.dailyPercentRatio).toBeCloseTo(1.72, 2)
    expect(result!.businessDays).toBe(1)
  })

  it('permite capital gain negativo si strike < trade price', () => {
    const result = calculateCoveredCallMetrics(
      { ...exampleInput, strikePrice: 5.0 },
      refDate,
    )
    expect(result!.capitalGain).toBeLessThan(0)
  })

  it('required bid usa la inversa del daily ratio (días calendario)', () => {
    const totalInvested = 158844
    const capitalGain = 36356
    const contractFees = 170.8
    const contracts = 244
    const calendarDays = 127

    expect(
      requiredBidForTargetDailyPct(0.5, totalInvested, capitalGain, contractFees, contracts, calendarDays)
        .requiredBid,
    ).toBeCloseTo(2.65, 2)
    expect(
      requiredBidForTargetDailyPct(1.0, totalInvested, capitalGain, contractFees, contracts, calendarDays)
        .requiredBid,
    ).toBeCloseTo(6.78, 2)
    expect(
      requiredBidForTargetDailyPct(1.5, totalInvested, capitalGain, contractFees, contracts, calendarDays)
        .requiredBid,
    ).toBeCloseTo(10.92, 2)
    expect(
      requiredBidForTargetDailyPct(2.0, totalInvested, capitalGain, contractFees, contracts, calendarDays)
        .requiredBid,
    ).toBeCloseTo(15.05, 2)
  })

  it('verifica coherencia forward/inversa del daily ratio', () => {
    const totalInvested = 8790
    const capitalGain = 210
    const contractFees = 7
    const contracts = 10
    const calendarDays = 2
    const target = 1.5

    const { requiredBid, requiredTotalProfit } = requiredBidForTargetDailyPct(
      target,
      totalInvested,
      capitalGain,
      contractFees,
      contracts,
      calendarDays,
    )

    const gross = requiredBid * 1000
    const net = gross - contractFees
    const profit = net + capitalGain
    const daily = dailyPercentRatio(profit, totalInvested, calendarDays)

    expect(requiredTotalProfit).toBeCloseTo(totalInvested * (target / 100) * calendarDays, 0)
    expect(daily).toBeCloseTo(target, 2)
  })

  it('required bid es 0 cuando el capital gain al strike ya cubre el target', () => {
    const ref = new Date('2026-08-20T12:00:00')
    const result = calculateCoveredCallMetrics(
      {
        tradePrice: 8.79,
        contracts: 10,
        strikePrice: 9,
        bid: 0.1,
        daysToExpiration: 2,
      },
      ref,
    )
    const lowTargets = result!.targetBids.filter((t) => t.targetDailyPct <= 1)
    expect(lowTargets.every((t) => t.coveredByCapitalGain)).toBe(true)
    expect(lowTargets.every((t) => t.requiredBid === 0)).toBe(true)
  })

  it('interpreta labels de daily return', () => {
    expect(interpretDailyReturnLabel(0.2)).toBe('Low Daily Return')
    expect(interpretDailyReturnLabel(0.335)).toBe('Moderate Daily Return')
    expect(interpretDailyReturnLabel(0.6)).toBe('Strong Daily Return')
    expect(interpretDailyReturnLabel(1.2)).toBe('Excellent Daily Return')
    expect(interpretDailyReturnLabel(1.5)).toBe('Exceptional Daily Return')
  })

  it('totalReturnPct independiente de días', () => {
    expect(totalReturnPct(303, 8790)).toBeCloseTo(3.45, 2)
  })
})
