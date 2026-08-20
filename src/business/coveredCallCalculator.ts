/** Fee por contrato al vender Covered Calls (modificable). */
export const COVERED_CALL_CONTRACT_FEE_USD = 0.70

/** Acciones por contrato de opción. */
export const COVERED_CALL_SHARES_PER_CONTRACT = 100

/** Objetivos de Daily Percent Ratio para Required Bid. */
export const COVERED_CALL_TARGET_DAILY_PCTS = [0.5, 1.0, 1.5, 2.0] as const

/** Target preferido visualmente. */
export const COVERED_CALL_PREFERRED_TARGET_PCT = 1.0

export type CoveredCallTargetDailyPct = (typeof COVERED_CALL_TARGET_DAILY_PCTS)[number]

export type DailyReturnLabel =
  | 'Low Daily Return'
  | 'Moderate Daily Return'
  | 'Strong Daily Return'
  | 'Excellent Daily Return'
  | 'Exceptional Daily Return'

export type CoveredCallInputs = {
  tradePrice: number
  contracts: number
  strikePrice: number
  bid: number
  daysToExpiration: number
}

export type TargetBidRecommendation = {
  targetDailyPct: CoveredCallTargetDailyPct
  /** Prima mínima por acción para alcanzar el target (0 si el strike ya lo cubre). */
  requiredBid: number
  /** Profit total necesario para ese target diario. */
  requiredTotalProfit: number
  /** La ganancia al strike ya alcanza o supera el objetivo — no hace falta prima. */
  coveredByCapitalGain: boolean
  isPreferred: boolean
  isClosestToCurrentBid: boolean
}

export type CoveredCallCalculation = {
  valid: boolean
  calendarDays: number
  businessDays: number
  expirationDate: string
  totalInvested: number
  grossPremium: number
  contractFees: number
  netPremium: number
  capitalGain: number
  totalCoveredCallProfit: number
  /** Rendimiento total del trade sobre capital (sin dividir por días). */
  totalReturnPct: number
  dailyPercentRatio: number
  dailyReturnLabel: DailyReturnLabel
  targetBids: TargetBidRecommendation[]
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}

function roundBid(n: number): number {
  return Math.round(n * 10000) / 10000
}

function roundRatio(n: number): number {
  return Math.round(n * 10000) / 10000
}

function toYmd(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

/** Hook opcional para feriados de mercado (futuro). */
export type MarketHolidayChecker = (date: Date) => boolean

/** Fecha de vencimiento = hoy + días calendario. */
export function expirationDateFromCalendarDays(
  calendarDays: number,
  referenceDate = new Date(),
): Date {
  const end = new Date(referenceDate)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + calendarDays)
  return end
}

/**
 * Días laborables (lun–vie) desde el día siguiente a hoy hasta el vencimiento inclusive.
 * Excluye fines de semana; feriados opcionales vía isHoliday.
 */
export function countBusinessDaysToExpiration(
  calendarDays: number,
  referenceDate = new Date(),
  isHoliday: MarketHolidayChecker = () => false,
): number {
  if (calendarDays <= 0) return 0

  const start = new Date(referenceDate)
  start.setHours(0, 0, 0, 0)
  const end = expirationDateFromCalendarDays(calendarDays, referenceDate)

  let count = 0
  const cur = new Date(start)
  cur.setDate(cur.getDate() + 1)

  while (cur <= end) {
    const dow = cur.getDay()
    if (dow >= 1 && dow <= 5 && !isHoliday(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }

  return count
}

export function validateCoveredCallInputs(input: CoveredCallInputs): string[] {
  const errors: string[] = []

  if (!Number.isFinite(input.tradePrice) || input.tradePrice <= 0) {
    errors.push('Trade Price debe ser mayor que 0.')
  }
  if (!Number.isInteger(input.contracts) || input.contracts <= 0) {
    errors.push('Contracts debe ser un entero mayor que 0.')
  }
  if (!Number.isFinite(input.strikePrice) || input.strikePrice <= 0) {
    errors.push('Strike Price debe ser mayor que 0.')
  }
  if (!Number.isFinite(input.bid) || input.bid < 0) {
    errors.push('Bid no puede ser negativo.')
  }
  if (!Number.isInteger(input.daysToExpiration) || input.daysToExpiration <= 0) {
    errors.push('Days to Expiration debe ser un entero mayor que 0.')
  }

  return errors
}

export function interpretDailyReturnLabel(dailyPercentRatio: number): DailyReturnLabel {
  if (dailyPercentRatio < 0.3) return 'Low Daily Return'
  if (dailyPercentRatio < 0.5) return 'Moderate Daily Return'
  if (dailyPercentRatio < 1.0) return 'Strong Daily Return'
  if (dailyPercentRatio < 1.5) return 'Excellent Daily Return'
  return 'Exceptional Daily Return'
}

export function requiredBidForTargetDailyPct(
  targetDailyPct: number,
  totalInvested: number,
  capitalGain: number,
  contractFees: number,
  contracts: number,
  /** Mismo divisor que Daily Percent Ratio: días calendario hasta vencimiento. */
  calendarDays: number,
): Pick<TargetBidRecommendation, 'requiredBid' | 'requiredTotalProfit' | 'coveredByCapitalGain'> {
  const targetDecimal = targetDailyPct / 100
  const requiredTotalProfit = roundUsd(totalInvested * targetDecimal * calendarDays)

  if (capitalGain >= requiredTotalProfit) {
    return {
      requiredBid: 0,
      requiredTotalProfit,
      coveredByCapitalGain: true,
    }
  }

  const requiredNetPremium = requiredTotalProfit - capitalGain
  const requiredGrossPremium = requiredNetPremium + contractFees
  const shares = contracts * COVERED_CALL_SHARES_PER_CONTRACT
  const requiredBid = shares > 0 ? roundBid(requiredGrossPremium / shares) : 0

  return {
    requiredBid: Math.max(0, requiredBid),
    requiredTotalProfit,
    coveredByCapitalGain: false,
  }
}

/** Daily % = (profit total / capital / días calendario) × 100 */
export function dailyPercentRatio(
  totalCoveredCallProfit: number,
  totalInvested: number,
  calendarDays: number,
): number {
  if (totalInvested <= 0 || calendarDays <= 0) return 0
  return roundRatio((totalCoveredCallProfit / totalInvested / calendarDays) * 100)
}

export function totalReturnPct(totalCoveredCallProfit: number, totalInvested: number): number {
  if (totalInvested <= 0) return 0
  return roundRatio((totalCoveredCallProfit / totalInvested) * 100)
}

export function calculateCoveredCallMetrics(
  input: CoveredCallInputs,
  referenceDate = new Date(),
  isHoliday: MarketHolidayChecker = () => false,
): CoveredCallCalculation | null {
  const errors = validateCoveredCallInputs(input)
  if (errors.length > 0) return null

  const calendarDays = input.daysToExpiration
  const businessDays = countBusinessDaysToExpiration(calendarDays, referenceDate, isHoliday)

  const shares = input.contracts * COVERED_CALL_SHARES_PER_CONTRACT
  const totalInvested = roundUsd(input.tradePrice * shares)
  const grossPremium = roundUsd(input.bid * shares)
  const contractFees = roundUsd(input.contracts * COVERED_CALL_CONTRACT_FEE_USD)
  const netPremium = roundUsd(grossPremium - contractFees)
  const capitalGain = roundUsd((input.strikePrice - input.tradePrice) * shares)
  const totalCoveredCallProfit = roundUsd(netPremium + capitalGain)
  const totalReturn = totalReturnPct(totalCoveredCallProfit, totalInvested)
  const dailyRatio = dailyPercentRatio(totalCoveredCallProfit, totalInvested, calendarDays)

  const rawTargets = COVERED_CALL_TARGET_DAILY_PCTS.map((targetDailyPct) => ({
    targetDailyPct,
    ...requiredBidForTargetDailyPct(
      targetDailyPct,
      totalInvested,
      capitalGain,
      contractFees,
      input.contracts,
      calendarDays,
    ),
  }))

  const targetsNeedingPremium = rawTargets.filter((row) => !row.coveredByCapitalGain)
  const closestTargetPct =
    input.bid >= 0 && targetsNeedingPremium.length > 0
      ? targetsNeedingPremium.reduce((best, row) => {
          const bestDiff = Math.abs(best.requiredBid - input.bid)
          const rowDiff = Math.abs(row.requiredBid - input.bid)
          return rowDiff < bestDiff ? row : best
        }).targetDailyPct
      : null

  const targetBids: TargetBidRecommendation[] = rawTargets.map((row) => ({
    targetDailyPct: row.targetDailyPct,
    requiredBid: row.requiredBid,
    requiredTotalProfit: row.requiredTotalProfit,
    coveredByCapitalGain: row.coveredByCapitalGain,
    isPreferred: row.targetDailyPct === COVERED_CALL_PREFERRED_TARGET_PCT,
    isClosestToCurrentBid: closestTargetPct === row.targetDailyPct,
  }))

  return {
    valid: true,
    calendarDays,
    businessDays,
    expirationDate: toYmd(expirationDateFromCalendarDays(calendarDays, referenceDate)),
    totalInvested,
    grossPremium,
    contractFees,
    netPremium,
    capitalGain,
    totalCoveredCallProfit,
    totalReturnPct: totalReturn,
    dailyPercentRatio: dailyRatio,
    dailyReturnLabel: interpretDailyReturnLabel(dailyRatio),
    targetBids,
  }
}
