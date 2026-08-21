import { COVERED_CALL_SHARES_PER_CONTRACT } from './coveredCallCalculator'

export const CC_FEASIBILITY_SHARES_PER_CONTRACT = COVERED_CALL_SHARES_PER_CONTRACT

/** Umbral $ para considerar ATM vs ITM/OTM. */
export const CC_FEASIBILITY_ATM_THRESHOLD_USD = 0.05

export type CallMoneyness = 'OTM' | 'ATM' | 'ITM'

export type BetterAlternative = 'assignment' | 'btc_sell' | 'tie'

export type CoveredCallFeasibilityInputs = {
  ticker: string
  shareQuantity: number
  avgBuyPrice: number
  /** Costo total real de todas las acciones (opcional). */
  totalCostBasis: number | null
  contracts: number
  strikePrice: number
  originalPremiumPerShare: number
  /** Prima neta total recibida al abrir (opcional). */
  netPremiumReceived: number | null
  currentCallPrice: number
  daysToExpiration: number | null
  expirationDate: string | null
  currentAssetPrice: number
  estimatedSellPrice: number
  buyToCloseFee: number
  sellSharesFee: number
  assignmentFee: number
}

export type ScenarioResult = {
  stockPnl: number
  callPnl: number
  totalPnlGross: number
  totalPnlNet: number
  assignmentProceeds: number
  buyToCloseCost: number
  stockSaleProceeds: number
}

export type CoveredCallFeasibilityResult = {
  valid: boolean
  errors: string[]
  ticker: string
  shareQuantity: number
  coveredShares: number
  uncoveredShares: number
  costBasisCovered: number
  costBasisUncovered: number
  netPremiumReceived: number
  daysToExpiration: number
  moneyness: CallMoneyness
  moneynessLabel: string
  distanceFromStrikeUsd: number
  distanceFromStrikePct: number
  intrinsicValuePerShare: number
  extrinsicValuePerShare: number
  extrinsicValueTotal: number
  assignmentLikely: boolean
  scenarioAssignment: ScenarioResult
  scenarioBtcSell: ScenarioResult
  betterAlternative: BetterAlternative
  betterAlternativeLabel: string
  differenceUsd: number
  differenceFavorsLabel: string
  breakevenSellPrice: number
  breakevenSellPriceQuick: number
  sellPriceGapPerShare: number
  sellPriceGapTotal: number
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}

function roundPrice(n: number): number {
  return Math.round(n * 100) / 100
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100
}

function parseYmd(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysToExpirationFromDate(
  expirationDate: string,
  referenceDate = new Date(),
): number {
  const end = parseYmd(expirationDate)
  const start = new Date(referenceDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000)
  return Math.max(0, diff)
}

export function resolveDaysToExpiration(
  daysToExpiration: number | null,
  expirationDate: string | null,
  referenceDate = new Date(),
): number {
  if (expirationDate) return daysToExpirationFromDate(expirationDate, referenceDate)
  return Math.max(0, daysToExpiration ?? 0)
}

export function validateCoveredCallFeasibilityInputs(
  input: CoveredCallFeasibilityInputs,
): string[] {
  const errors: string[] = []

  if (!input.ticker.trim()) errors.push('Ticker es obligatorio.')
  if (!Number.isInteger(input.shareQuantity) || input.shareQuantity <= 0) {
    errors.push('Cantidad de acciones debe ser un entero mayor que 0.')
  }
  if (!Number.isFinite(input.avgBuyPrice) || input.avgBuyPrice <= 0) {
    errors.push('Precio promedio de compra debe ser mayor que 0.')
  }
  if (input.totalCostBasis != null && input.totalCostBasis <= 0) {
    errors.push('Costo total debe ser mayor que 0 si se indica.')
  }
  if (!Number.isInteger(input.contracts) || input.contracts <= 0) {
    errors.push('Contratos vendidos debe ser un entero mayor que 0.')
  }
  if (!Number.isFinite(input.strikePrice) || input.strikePrice <= 0) {
    errors.push('Strike Price debe ser mayor que 0.')
  }
  if (!Number.isFinite(input.originalPremiumPerShare) || input.originalPremiumPerShare < 0) {
    errors.push('Prima original no puede ser negativa.')
  }
  if (input.netPremiumReceived != null && input.netPremiumReceived < 0) {
    errors.push('Prima neta recibida no puede ser negativa.')
  }
  if (!Number.isFinite(input.currentCallPrice) || input.currentCallPrice < 0) {
    errors.push('Precio actual del Call no puede ser negativo.')
  }
  if (!Number.isFinite(input.currentAssetPrice) || input.currentAssetPrice <= 0) {
    errors.push('Precio actual del activo debe ser mayor que 0.')
  }
  if (!Number.isFinite(input.estimatedSellPrice) || input.estimatedSellPrice <= 0) {
    errors.push('Precio estimado de venta debe ser mayor que 0.')
  }
  if (input.daysToExpiration == null && !input.expirationDate) {
    errors.push('Indica DTE o fecha de expiración.')
  }
  if (input.daysToExpiration != null && (!Number.isInteger(input.daysToExpiration) || input.daysToExpiration < 0)) {
    errors.push('DTE debe ser un entero ≥ 0.')
  }
  if (input.expirationDate && Number.isNaN(parseYmd(input.expirationDate).getTime())) {
    errors.push('Fecha de expiración no válida.')
  }

  const covered = input.contracts * CC_FEASIBILITY_SHARES_PER_CONTRACT
  if (Number.isInteger(input.shareQuantity) && input.shareQuantity > 0 && covered > input.shareQuantity) {
    errors.push(
      `Contratos cubren ${covered} acciones pero solo tienes ${input.shareQuantity}. Reduce contratos o aumenta acciones.`,
    )
  }

  return errors
}

export function costBasisForShares(
  shareQuantity: number,
  shares: number,
  avgBuyPrice: number,
  totalCostBasis: number | null,
): number {
  if (shareQuantity <= 0 || shares <= 0) return 0
  if (totalCostBasis != null && totalCostBasis > 0) {
    return roundUsd(totalCostBasis * (shares / shareQuantity))
  }
  return roundUsd(avgBuyPrice * shares)
}

export function resolveNetPremiumReceived(input: CoveredCallFeasibilityInputs): number {
  if (input.netPremiumReceived != null) return roundUsd(input.netPremiumReceived)
  return roundUsd(
    input.originalPremiumPerShare * CC_FEASIBILITY_SHARES_PER_CONTRACT * input.contracts,
  )
}

export function callMoneyness(
  currentAssetPrice: number,
  strikePrice: number,
): { moneyness: CallMoneyness; label: string; distanceUsd: number; distancePct: number } {
  const distanceUsd = roundPrice(currentAssetPrice - strikePrice)
  const distancePct = strikePrice > 0 ? roundPct((distanceUsd / strikePrice) * 100) : 0

  if (Math.abs(distanceUsd) <= CC_FEASIBILITY_ATM_THRESHOLD_USD) {
    return { moneyness: 'ATM', label: 'ATM — At the Money', distanceUsd, distancePct }
  }
  if (distanceUsd > 0) {
    return {
      moneyness: 'ITM',
      label: `ITM por ${fmtUsdAbs(distanceUsd)}/share (${Math.abs(distancePct).toFixed(2)}% por encima del strike)`,
      distanceUsd,
      distancePct,
    }
  }
  return {
    moneyness: 'OTM',
    label: `OTM por ${fmtUsdAbs(distanceUsd)}/share (${Math.abs(distancePct).toFixed(2)}% por debajo del strike)`,
    distanceUsd,
    distancePct,
  }
}

function fmtUsdAbs(n: number): string {
  return `$${Math.abs(n).toFixed(2)}`
}

export function intrinsicExtrinsic(
  currentAssetPrice: number,
  strikePrice: number,
  currentCallPrice: number,
  coveredShares: number,
): {
  intrinsicValuePerShare: number
  extrinsicValuePerShare: number
  extrinsicValueTotal: number
} {
  const intrinsicValuePerShare = roundPrice(Math.max(currentAssetPrice - strikePrice, 0))
  const extrinsicValuePerShare = roundPrice(Math.max(currentCallPrice - intrinsicValuePerShare, 0))
  const extrinsicValueTotal = roundUsd(extrinsicValuePerShare * coveredShares)
  return { intrinsicValuePerShare, extrinsicValuePerShare, extrinsicValueTotal }
}

export function breakevenSellPriceExact(
  strikePrice: number,
  currentCallPrice: number,
  coveredShares: number,
  buyToCloseFee: number,
  sellSharesFee: number,
  assignmentFee: number,
): number {
  if (coveredShares <= 0) return strikePrice
  const feeAdjustPerShare = (buyToCloseFee - sellSharesFee + assignmentFee) / coveredShares
  return roundPrice(strikePrice + currentCallPrice + feeAdjustPerShare)
}

export function calculateCoveredCallFeasibility(
  input: CoveredCallFeasibilityInputs,
  referenceDate = new Date(),
): CoveredCallFeasibilityResult | null {
  const errors = validateCoveredCallFeasibilityInputs(input)
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      ticker: input.ticker,
      shareQuantity: input.shareQuantity,
      coveredShares: 0,
      uncoveredShares: 0,
      costBasisCovered: 0,
      costBasisUncovered: 0,
      netPremiumReceived: 0,
      daysToExpiration: 0,
      moneyness: 'OTM',
      moneynessLabel: '',
      distanceFromStrikeUsd: 0,
      distanceFromStrikePct: 0,
      intrinsicValuePerShare: 0,
      extrinsicValuePerShare: 0,
      extrinsicValueTotal: 0,
      assignmentLikely: false,
      scenarioAssignment: emptyScenario(),
      scenarioBtcSell: emptyScenario(),
      betterAlternative: 'tie',
      betterAlternativeLabel: '',
      differenceUsd: 0,
      differenceFavorsLabel: '',
      breakevenSellPrice: 0,
      breakevenSellPriceQuick: 0,
      sellPriceGapPerShare: 0,
      sellPriceGapTotal: 0,
    }
  }

  const coveredShares = input.contracts * CC_FEASIBILITY_SHARES_PER_CONTRACT
  const uncoveredShares = Math.max(0, input.shareQuantity - coveredShares)
  const costBasisCovered = costBasisForShares(
    input.shareQuantity,
    coveredShares,
    input.avgBuyPrice,
    input.totalCostBasis,
  )
  const costBasisUncovered = costBasisForShares(
    input.shareQuantity,
    uncoveredShares,
    input.avgBuyPrice,
    input.totalCostBasis,
  )
  const netPremiumReceived = resolveNetPremiumReceived(input)
  const daysToExpiration = resolveDaysToExpiration(
    input.daysToExpiration,
    input.expirationDate,
    referenceDate,
  )

  const { moneyness, label: moneynessLabel, distanceUsd, distancePct } = callMoneyness(
    input.currentAssetPrice,
    input.strikePrice,
  )
  const assignmentLikely = input.currentAssetPrice > input.strikePrice

  const { intrinsicValuePerShare, extrinsicValuePerShare, extrinsicValueTotal } =
    intrinsicExtrinsic(
      input.currentAssetPrice,
      input.strikePrice,
      input.currentCallPrice,
      coveredShares,
    )

  const assignmentProceeds = roundUsd(input.strikePrice * coveredShares)
  const stockPnlAssignment = roundUsd(assignmentProceeds - costBasisCovered)
  const scenarioAssignmentGross = roundUsd(stockPnlAssignment + netPremiumReceived)
  const scenarioAssignmentNet = roundUsd(scenarioAssignmentGross - input.assignmentFee)

  const buyToCloseCost = roundUsd(
    input.currentCallPrice * CC_FEASIBILITY_SHARES_PER_CONTRACT * input.contracts +
      input.buyToCloseFee,
  )
  const callPnlBtc = roundUsd(netPremiumReceived - buyToCloseCost)
  const stockSaleProceeds = roundUsd(input.estimatedSellPrice * coveredShares)
  const stockPnlBtc = roundUsd(stockSaleProceeds - costBasisCovered - input.sellSharesFee)
  const scenarioBtcGross = roundUsd(stockPnlBtc + callPnlBtc)
  const scenarioBtcNet = scenarioBtcGross

  const scenarioAssignment: ScenarioResult = {
    stockPnl: stockPnlAssignment,
    callPnl: netPremiumReceived,
    totalPnlGross: scenarioAssignmentGross,
    totalPnlNet: scenarioAssignmentNet,
    assignmentProceeds,
    buyToCloseCost: 0,
    stockSaleProceeds: assignmentProceeds,
  }

  const scenarioBtcSell: ScenarioResult = {
    stockPnl: stockPnlBtc,
    callPnl: callPnlBtc,
    totalPnlGross: scenarioBtcGross,
    totalPnlNet: scenarioBtcNet,
    assignmentProceeds: 0,
    buyToCloseCost,
    stockSaleProceeds,
  }

  const compareA = scenarioAssignmentNet
  const compareB = scenarioBtcNet
  const differenceUsd = roundUsd(Math.abs(compareA - compareB))

  let betterAlternative: BetterAlternative = 'tie'
  let betterAlternativeLabel = 'Empate entre alternativas'
  let differenceFavorsLabel = 'Sin ventaja clara'

  if (compareA > compareB + 0.005) {
    betterAlternative = 'assignment'
    betterAlternativeLabel = 'Mantener Covered Call / aceptar asignación'
    differenceFavorsLabel = `+$${differenceUsd.toFixed(2)} a favor de aceptar asignación`
  } else if (compareB > compareA + 0.005) {
    betterAlternative = 'btc_sell'
    betterAlternativeLabel = 'Recomprar Call + vender acciones'
    differenceFavorsLabel = `+$${differenceUsd.toFixed(2)} a favor de Buy to Close + venta`
  }

  const breakevenSellPriceQuick = roundPrice(input.strikePrice + input.currentCallPrice)
  const breakevenSellPrice = breakevenSellPriceExact(
    input.strikePrice,
    input.currentCallPrice,
    coveredShares,
    input.buyToCloseFee,
    input.sellSharesFee,
    input.assignmentFee,
  )
  const sellPriceGapPerShare = roundPrice(input.estimatedSellPrice - breakevenSellPrice)
  const sellPriceGapTotal = roundUsd(sellPriceGapPerShare * coveredShares)

  return {
    valid: true,
    errors: [],
    ticker: input.ticker.trim().toUpperCase(),
    shareQuantity: input.shareQuantity,
    coveredShares,
    uncoveredShares,
    costBasisCovered,
    costBasisUncovered,
    netPremiumReceived,
    daysToExpiration,
    moneyness,
    moneynessLabel,
    distanceFromStrikeUsd: distanceUsd,
    distanceFromStrikePct: distancePct,
    intrinsicValuePerShare,
    extrinsicValuePerShare,
    extrinsicValueTotal,
    assignmentLikely,
    scenarioAssignment,
    scenarioBtcSell,
    betterAlternative,
    betterAlternativeLabel,
    differenceUsd,
    differenceFavorsLabel,
    breakevenSellPrice,
    breakevenSellPriceQuick,
    sellPriceGapPerShare,
    sellPriceGapTotal,
  }
}

function emptyScenario(): ScenarioResult {
  return {
    stockPnl: 0,
    callPnl: 0,
    totalPnlGross: 0,
    totalPnlNet: 0,
    assignmentProceeds: 0,
    buyToCloseCost: 0,
    stockSaleProceeds: 0,
  }
}
