/** Acciones por contrato de opción. */
export const CSP_SHARES_PER_CONTRACT = 100

export type CashSecuredPutInputs = {
  currentPrice: number
  strikePrice: number
  premiumPerShare: number
  daysToExpiration: number
  delta: number
}

export type CashSecuredPutCalculation = {
  collateralRequired: number
  premiumReceived: number
  roicPct: number
  annualizedRoicPct: number
  assignedPrice: number
  breakEvenPrice: number
  effectiveCostBasis: number
  downsideProtectionUsd: number
  downsideProtectionPct: number
  daysToExpiration: number
  delta: number
  approxProbabilityItmPct: number
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100
}

function roundPrice(n: number): number {
  return Math.round(n * 100) / 100
}

export function validateCashSecuredPutInputs(input: CashSecuredPutInputs): string[] {
  const errors: string[] = []

  if (!Number.isFinite(input.currentPrice) || input.currentPrice <= 0) {
    errors.push('Current Price debe ser mayor que 0.')
  }
  if (!Number.isFinite(input.strikePrice) || input.strikePrice <= 0) {
    errors.push('Strike Price debe ser mayor que 0.')
  }
  if (!Number.isFinite(input.premiumPerShare) || input.premiumPerShare < 0) {
    errors.push('Premium Per Share no puede ser negativo.')
  }
  if (!Number.isInteger(input.daysToExpiration) || input.daysToExpiration <= 0) {
    errors.push('Days to Expiration debe ser un entero mayor que 0.')
  }
  if (!Number.isFinite(input.delta)) {
    errors.push('Delta debe ser un número válido.')
  }

  return errors
}

export function calculateCashSecuredPutMetrics(
  input: CashSecuredPutInputs,
): CashSecuredPutCalculation | null {
  if (validateCashSecuredPutInputs(input).length > 0) return null

  const shares = CSP_SHARES_PER_CONTRACT
  const collateralRequired = roundUsd(input.strikePrice * shares)
  const premiumReceived = roundUsd(input.premiumPerShare * shares)
  const roicPct =
    collateralRequired > 0 ? roundPct((premiumReceived / collateralRequired) * 100) : 0
  const annualizedRoicPct = roundPct(roicPct * (365 / input.daysToExpiration))
  const breakEvenPrice = roundPrice(input.strikePrice - input.premiumPerShare)
  const effectiveCostBasis = roundUsd(breakEvenPrice * shares)
  const downsideProtectionUsd = roundPrice(input.premiumPerShare)
  const downsideProtectionPct =
    input.strikePrice > 0 ? roundPct((input.premiumPerShare / input.strikePrice) * 100) : 0
  const approxProbabilityItmPct = roundPct(Math.abs(input.delta) * 100)

  return {
    collateralRequired,
    premiumReceived,
    roicPct,
    annualizedRoicPct,
    assignedPrice: roundPrice(input.strikePrice),
    breakEvenPrice,
    effectiveCostBasis,
    downsideProtectionUsd,
    downsideProtectionPct,
    daysToExpiration: input.daysToExpiration,
    delta: input.delta,
    approxProbabilityItmPct,
  }
}
