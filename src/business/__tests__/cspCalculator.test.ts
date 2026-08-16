import { describe, expect, it } from 'vitest'
import {
  calculateCashSecuredPutMetrics,
  validateCashSecuredPutInputs,
} from '../cspCalculator'

const exampleInput = {
  currentPrice: 225,
  strikePrice: 220,
  premiumPerShare: 3.5,
  daysToExpiration: 14,
  delta: -0.25,
}

describe('cspCalculator', () => {
  it('valida entradas inválidas', () => {
    expect(validateCashSecuredPutInputs({ ...exampleInput, strikePrice: 0 })).toHaveLength(1)
    expect(validateCashSecuredPutInputs({ ...exampleInput, daysToExpiration: 0 })).toHaveLength(1)
    expect(validateCashSecuredPutInputs({ ...exampleInput, premiumPerShare: -1 })).toHaveLength(1)
  })

  it('calcula métricas del ejemplo del prompt', () => {
    const result = calculateCashSecuredPutMetrics(exampleInput)
    expect(result).not.toBeNull()
    expect(result!.collateralRequired).toBe(22000)
    expect(result!.premiumReceived).toBe(350)
    expect(result!.roicPct).toBeCloseTo(1.59, 2)
    expect(result!.annualizedRoicPct).toBeCloseTo(41.45, 2)
    expect(result!.assignedPrice).toBe(220)
    expect(result!.breakEvenPrice).toBe(216.5)
    expect(result!.effectiveCostBasis).toBe(21650)
    expect(result!.downsideProtectionUsd).toBe(3.5)
    expect(result!.downsideProtectionPct).toBeCloseTo(1.59, 2)
    expect(result!.daysToExpiration).toBe(14)
    expect(result!.delta).toBe(-0.25)
    expect(result!.approxProbabilityItmPct).toBe(25)
  })
})
