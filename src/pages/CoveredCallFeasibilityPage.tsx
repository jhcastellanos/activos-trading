import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateCoveredCallFeasibility,
  CC_FEASIBILITY_SHARES_PER_CONTRACT,
  type CoveredCallFeasibilityInputs,
} from '../business/coveredCallFeasibility'

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const fmtSigned = (n: number) => {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${currency(Math.abs(n))}`
}

function parseOptional(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : null
}

function parseRequired(raw: string, integer = false): number {
  if (raw.trim() === '') return Number.NaN
  const n = integer ? parseInt(raw, 10) : parseFloat(raw)
  return Number.isFinite(n) ? n : Number.NaN
}

type FormState = {
  ticker: string
  shareQuantity: string
  avgBuyPrice: string
  totalCostBasis: string
  contracts: string
  strikePrice: string
  originalPremiumPerShare: string
  netPremiumReceived: string
  currentCallPrice: string
  daysToExpiration: string
  expirationDate: string
  useExpirationDate: boolean
  currentAssetPrice: string
  estimatedSellPrice: string
  buyToCloseFee: string
  sellSharesFee: string
  assignmentFee: string
}

const defaultForm: FormState = {
  ticker: '',
  shareQuantity: '',
  avgBuyPrice: '',
  totalCostBasis: '',
  contracts: '',
  strikePrice: '',
  originalPremiumPerShare: '',
  netPremiumReceived: '',
  currentCallPrice: '',
  daysToExpiration: '',
  expirationDate: '',
  useExpirationDate: false,
  currentAssetPrice: '',
  estimatedSellPrice: '',
  buyToCloseFee: '',
  sellSharesFee: '',
  assignmentFee: '',
}

export function CoveredCallFeasibilityPage() {
  const [values, setValues] = useState<FormState>(defaultForm)
  const sellPriceTouched = useRef(false)

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (sellPriceTouched.current) return
    if (values.currentAssetPrice.trim() !== '') {
      setValues((prev) => ({ ...prev, estimatedSellPrice: prev.currentAssetPrice }))
    }
  }, [values.currentAssetPrice])

  const inputs = useMemo<CoveredCallFeasibilityInputs>(() => {
    const currentAssetPrice = parseRequired(values.currentAssetPrice)
    const estimatedSellRaw = values.estimatedSellPrice.trim()
    const estimatedSellPrice = estimatedSellRaw
      ? parseRequired(values.estimatedSellPrice)
      : currentAssetPrice

    return {
      ticker: values.ticker,
      shareQuantity: parseRequired(values.shareQuantity, true),
      avgBuyPrice: parseRequired(values.avgBuyPrice),
      totalCostBasis: parseOptional(values.totalCostBasis),
      contracts: parseRequired(values.contracts, true),
      strikePrice: parseRequired(values.strikePrice),
      originalPremiumPerShare: parseRequired(values.originalPremiumPerShare),
      netPremiumReceived: parseOptional(values.netPremiumReceived),
      currentCallPrice: parseRequired(values.currentCallPrice),
      daysToExpiration: values.useExpirationDate
        ? null
        : parseRequired(values.daysToExpiration, true),
      expirationDate: values.useExpirationDate && values.expirationDate.trim()
        ? values.expirationDate
        : null,
      currentAssetPrice,
      estimatedSellPrice,
      buyToCloseFee: parseOptional(values.buyToCloseFee) ?? 0,
      sellSharesFee: parseOptional(values.sellSharesFee) ?? 0,
      assignmentFee: parseOptional(values.assignmentFee) ?? 0,
    }
  }, [values])

  const result = useMemo(() => calculateCoveredCallFeasibility(inputs), [inputs])

  const showPartial = Object.entries(values).some(
    ([k, v]) => k !== 'useExpirationDate' && typeof v === 'string' && v.trim() !== '',
  )

  const contractsNum = parseInt(values.contracts, 10)
  const coveredPreview =
    Number.isInteger(contractsNum) && contractsNum > 0
      ? contractsNum * CC_FEASIBILITY_SHARES_PER_CONTRACT
      : null

  const hasFees =
    (parseOptional(values.buyToCloseFee) ?? 0) > 0 ||
    (parseOptional(values.sellSharesFee) ?? 0) > 0 ||
    (parseOptional(values.assignmentFee) ?? 0) > 0

  return (
    <section className="cc-calculator-page cc-fact-page">
      <h2 className="page-title">Covered Call — Análisis de Factibilidad</h2>
      <p className="subtitle">
        Posición abierta · comparación en tiempo real · no constituye asesoramiento financiero
      </p>

      <div className="card cc-inputs-card">
        <h3 className="settings-heading">Información de las acciones</h3>
        <div className="cc-input-grid cc-fact-grid">
          <label className="cc-field cc-field-full">
            <span className="cc-field-label">Ticker</span>
            <input
              type="text"
              value={values.ticker}
              onChange={(e) => setField('ticker', e.target.value.toUpperCase())}
              placeholder="TSLL"
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">Cantidad de acciones</span>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              value={values.shareQuantity}
              onChange={(e) => setField('shareQuantity', e.target.value)}
              placeholder="1000"
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">Precio promedio de compra</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.avgBuyPrice}
              onChange={(e) => setField('avgBuyPrice', e.target.value)}
              placeholder="8.79"
            />
          </label>
          <label className="cc-field cc-field-full">
            <span className="cc-field-label">Costo total real (opcional)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.totalCostBasis}
              onChange={(e) => setField('totalCostBasis', e.target.value)}
              placeholder="8789.90"
            />
          </label>
        </div>
      </div>

      <div className="card cc-inputs-card">
        <h3 className="settings-heading">Información del Covered Call</h3>
        <div className="cc-input-grid cc-fact-grid">
          <label className="cc-field">
            <span className="cc-field-label">Contratos vendidos</span>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              value={values.contracts}
              onChange={(e) => setField('contracts', e.target.value)}
              placeholder="10"
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">Strike Price</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.strikePrice}
              onChange={(e) => setField('strikePrice', e.target.value)}
              placeholder="9.00"
            />
          </label>
          {coveredPreview != null && (
            <p className="cc-fact-hint cc-field-full">
              Acciones cubiertas = {values.contracts || '0'} contratos × 100 ={' '}
              <strong>{coveredPreview.toLocaleString()} acciones cubiertas</strong>
            </p>
          )}
          <label className="cc-field">
            <span className="cc-field-label">Prima original (por acción)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.originalPremiumPerShare}
              onChange={(e) => setField('originalPremiumPerShare', e.target.value)}
              placeholder="0.10"
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">Prima neta total (opcional)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.netPremiumReceived}
              onChange={(e) => setField('netPremiumReceived', e.target.value)}
              placeholder="93.34"
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">Precio actual Call (BTC)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.currentCallPrice}
              onChange={(e) => setField('currentCallPrice', e.target.value)}
              placeholder="0.76"
            />
          </label>
          <label className="cc-field cc-fact-dte-toggle">
            <span className="cc-field-label">Usar fecha de expiración</span>
            <input
              type="checkbox"
              checked={values.useExpirationDate}
              onChange={(e) => setField('useExpirationDate', e.target.checked)}
            />
          </label>
          {values.useExpirationDate ? (
            <label className="cc-field">
              <span className="cc-field-label">Fecha de expiración</span>
              <input
                type="date"
                value={values.expirationDate}
                onChange={(e) => setField('expirationDate', e.target.value)}
              />
            </label>
          ) : (
            <label className="cc-field">
              <span className="cc-field-label">Días restantes (DTE)</span>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={values.daysToExpiration}
                onChange={(e) => setField('daysToExpiration', e.target.value)}
                placeholder="0"
              />
            </label>
          )}
        </div>
      </div>

      <div className="card cc-inputs-card">
        <h3 className="settings-heading">Información actual del activo</h3>
        <div className="cc-input-grid cc-fact-grid">
          <label className="cc-field">
            <span className="cc-field-label">Precio actual del activo</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.currentAssetPrice}
              onChange={(e) => setField('currentAssetPrice', e.target.value)}
              placeholder="9.75"
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">Precio estimado de venta</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.estimatedSellPrice}
              onChange={(e) => {
                sellPriceTouched.current = true
                setField('estimatedSellPrice', e.target.value)
              }}
              placeholder="9.73"
            />
          </label>
        </div>
      </div>

      <div className="card cc-inputs-card">
        <h3 className="settings-heading">Fees y comisiones (opcional)</h3>
        <div className="cc-input-grid cc-fact-grid">
          <label className="cc-field">
            <span className="cc-field-label">Fee Buy to Close</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={values.buyToCloseFee}
              onChange={(e) => setField('buyToCloseFee', e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">Fee venta acciones</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={values.sellSharesFee}
              onChange={(e) => setField('sellSharesFee', e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="cc-field">
            <span className="cc-field-label">Fee asignación</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={values.assignmentFee}
              onChange={(e) => setField('assignmentFee', e.target.value)}
              placeholder="0.00"
            />
          </label>
        </div>
      </div>

      {showPartial && result && !result.valid && (
        <ul className="cc-errors card cc-inputs-card">
          {result.errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      {result?.valid && (
        <>
          <div className="card cc-fact-hero-card">
            <span className="cc-hero-label">Mejor alternativa ahora</span>
            <strong className="cc-fact-hero-title">{result.betterAlternativeLabel}</strong>
            <div className="cc-fact-compare-row">
              <div className={`cc-fact-option${result.betterAlternative === 'assignment' ? ' winner' : ''}`}>
                <span className="cc-fact-option-label">Aceptar asignación</span>
                <strong className={result.scenarioAssignment.totalPnlNet >= 0 ? 'pos' : 'neg'}>
                  {fmtSigned(result.scenarioAssignment.totalPnlNet)}
                </strong>
              </div>
              <span className="cc-fact-vs">vs.</span>
              <div className={`cc-fact-option${result.betterAlternative === 'btc_sell' ? ' winner' : ''}`}>
                <span className="cc-fact-option-label">BTC + vender</span>
                <strong className={result.scenarioBtcSell.totalPnlNet >= 0 ? 'pos' : 'neg'}>
                  {fmtSigned(result.scenarioBtcSell.totalPnlNet)}
                </strong>
              </div>
            </div>
            <p className="cc-fact-diff">
              <strong>Diferencia:</strong> {result.differenceFavorsLabel}
            </p>
            <p className="cc-fact-disclaimer">
              Recomendación basada únicamente en los números introducidos. No es asesoramiento
              financiero.
            </p>
          </div>

          <div className="card cc-fact-block">
            <h3 className="settings-heading">Posición</h3>
            <div className="cc-breakdown-grid">
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Ticker</span>
                <span className="goal-metric-value">{result.ticker}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Acciones</span>
                <span className="goal-metric-value">{result.shareQuantity.toLocaleString()}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Costo cubiertas</span>
                <span className="goal-metric-value">{currency(result.costBasisCovered)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Contratos / Strike</span>
                <span className="goal-metric-value">
                  {inputs.contracts} @ {fmtPrice(inputs.strikePrice)}
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Prima neta recibida</span>
                <span className="goal-metric-value">{currency(result.netPremiumReceived)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">DTE</span>
                <span className="goal-metric-value">{result.daysToExpiration}</span>
              </div>
            </div>
            {result.uncoveredShares > 0 && (
              <p className="cc-fact-hint">
                Acciones cubiertas: <strong>{result.coveredShares.toLocaleString()}</strong> ·
                Acciones no cubiertas:{' '}
                <strong>{result.uncoveredShares.toLocaleString()}</strong> (costo{' '}
                {currency(result.costBasisUncovered)}) — el análisis del CC aplica solo a las
                cubiertas.
              </p>
            )}
          </div>

          <div className="card cc-fact-block">
            <h3 className="settings-heading">Covered Call</h3>
            <div className="cc-fact-status-row">
              <span className={`cc-fact-moneyness cc-fact-moneyness-${result.moneyness.toLowerCase()}`}>
                {result.moneyness}
              </span>
              <span className="cc-fact-moneyness-detail">{result.moneynessLabel}</span>
            </div>
            {result.assignmentLikely && (
              <p className="cc-fact-alert">
                Precio del activo &gt; Strike: alta probabilidad de asignación si permanece ITM al
                vencimiento.
              </p>
            )}
            <div className="cc-breakdown-grid">
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Prima original</span>
                <span className="goal-metric-value">
                  {fmtPrice(inputs.originalPremiumPerShare)}/share
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Precio actual Call</span>
                <span className="goal-metric-value">{fmtPrice(inputs.currentCallPrice)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">P&L Call (BTC ahora)</span>
                <span
                  className={`goal-metric-value ${result.scenarioBtcSell.callPnl >= 0 ? 'pos' : 'neg'}`}
                >
                  {fmtSigned(result.scenarioBtcSell.callPnl)}
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Valor intrínseco</span>
                <span className="goal-metric-value">
                  {fmtPrice(result.intrinsicValuePerShare)}/share
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Valor extrínseco</span>
                <span className="goal-metric-value">
                  {fmtPrice(result.extrinsicValuePerShare)}/share
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Extrínseco total</span>
                <span className="goal-metric-value">{currency(result.extrinsicValueTotal)}</span>
              </div>
            </div>
            <blockquote className="cc-fact-quote">
              Estás pagando aproximadamente {fmtPrice(result.extrinsicValuePerShare)} por acción de
              valor extrínseco para recuperar el control de tus acciones (
              {currency(result.extrinsicValueTotal)} en {result.coveredShares.toLocaleString()}{' '}
              acciones).
            </blockquote>
          </div>

          <div className="card cc-fact-block">
            <h3 className="settings-heading">Comparación de escenarios</h3>

            <article className="cc-fact-scenario">
              <h4 className="cc-fact-scenario-title">Escenario A — Mantener / aceptar asignación</h4>
              <div className="cc-fact-calc-lines">
                <p>
                  Ingreso asignación = {fmtPrice(inputs.strikePrice)} ×{' '}
                  {result.coveredShares.toLocaleString()} ={' '}
                  <strong>{currency(result.scenarioAssignment.assignmentProceeds)}</strong>
                </p>
                <p>
                  P&L acciones = {currency(result.scenarioAssignment.assignmentProceeds)} −{' '}
                  {currency(result.costBasisCovered)} ={' '}
                  <strong>{fmtSigned(result.scenarioAssignment.stockPnl)}</strong>
                </p>
                <p>
                  P&L total = P&L acciones + prima neta ={' '}
                  <strong>{fmtSigned(result.scenarioAssignment.totalPnlGross)}</strong>
                  {hasFees && (
                    <>
                      {' '}
                      · Neto después fees:{' '}
                      <strong>{fmtSigned(result.scenarioAssignment.totalPnlNet)}</strong>
                    </>
                  )}
                </p>
              </div>
              <p className="cc-fact-scenario-result">
                Resultado si permites asignación:{' '}
                <strong className={result.scenarioAssignment.totalPnlNet >= 0 ? 'pos' : 'neg'}>
                  {fmtSigned(result.scenarioAssignment.totalPnlNet)}
                </strong>
              </p>
            </article>

            <article className="cc-fact-scenario">
              <h4 className="cc-fact-scenario-title">
                Escenario B — Buy to Close + vender acciones
              </h4>
              <div className="cc-fact-calc-lines">
                <p>
                  Costo BTC = {fmtPrice(inputs.currentCallPrice)} × 100 × {inputs.contracts} ={' '}
                  <strong>{currency(result.scenarioBtcSell.buyToCloseCost)}</strong>
                </p>
                <p>
                  P&L Covered Call = {currency(result.netPremiumReceived)} −{' '}
                  {currency(result.scenarioBtcSell.buyToCloseCost)} ={' '}
                  <strong>{fmtSigned(result.scenarioBtcSell.callPnl)}</strong>
                </p>
                <p>
                  Ingreso venta = {fmtPrice(inputs.estimatedSellPrice)} ×{' '}
                  {result.coveredShares.toLocaleString()} ={' '}
                  <strong>{currency(result.scenarioBtcSell.stockSaleProceeds)}</strong>
                </p>
                <p>
                  P&L acciones = {currency(result.scenarioBtcSell.stockSaleProceeds)} −{' '}
                  {currency(result.costBasisCovered)}
                  {(parseOptional(values.sellSharesFee) ?? 0) > 0 &&
                    ` − ${currency(parseOptional(values.sellSharesFee)!)}`}
                  {' = '}
                  <strong>{fmtSigned(result.scenarioBtcSell.stockPnl)}</strong>
                </p>
                <p>
                  P&L total ={' '}
                  <strong>{fmtSigned(result.scenarioBtcSell.totalPnlGross)}</strong>
                  {hasFees && (
                    <>
                      {' '}
                      · Neto:{' '}
                      <strong>{fmtSigned(result.scenarioBtcSell.totalPnlNet)}</strong>
                    </>
                  )}
                </p>
              </div>
              <p className="cc-fact-scenario-result">
                Resultado cerrando Call y vendiendo:{' '}
                <strong className={result.scenarioBtcSell.totalPnlNet >= 0 ? 'pos' : 'neg'}>
                  {fmtSigned(result.scenarioBtcSell.totalPnlNet)}
                </strong>
              </p>
            </article>
          </div>

          <div className="card cc-fact-block cc-fact-breakeven">
            <h3 className="settings-heading">Punto de equilibrio de la decisión</h3>
            <p className="cc-fact-breakeven-main">
              Precio mínimo aproximado para justificar BTC + venta:{' '}
              <strong>{fmtPrice(result.breakevenSellPriceQuick)}</strong>
              <span className="cc-fact-breakeven-note">
                (Strike + precio Call = {fmtPrice(inputs.strikePrice)} +{' '}
                {fmtPrice(inputs.currentCallPrice)})
              </span>
            </p>
            {hasFees && (
              <p className="cc-fact-hint">
                Precio exacto con fees: <strong>{fmtPrice(result.breakevenSellPrice)}</strong>
              </p>
            )}
            <div className="cc-breakdown-grid">
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Precio necesario</span>
                <span className="goal-metric-value">{fmtPrice(result.breakevenSellPrice)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Precio estimado venta</span>
                <span className="goal-metric-value">{fmtPrice(inputs.estimatedSellPrice)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Diferencia / share</span>
                <span
                  className={`goal-metric-value ${result.sellPriceGapPerShare >= 0 ? 'pos' : 'neg'}`}
                >
                  {result.sellPriceGapPerShare >= 0 ? '+' : '−'}
                  {fmtPrice(Math.abs(result.sellPriceGapPerShare))}
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Diferencia total</span>
                <span
                  className={`goal-metric-value ${result.sellPriceGapTotal >= 0 ? 'pos' : 'neg'}`}
                >
                  {fmtSigned(result.sellPriceGapTotal)}
                </span>
              </div>
            </div>
            <p className="cc-fact-hint">{result.differenceFavorsLabel} (cálculo completo).</p>
          </div>

          <div className="card cc-fact-block cc-fact-final">
            <h3 className="settings-heading">Factibilidad</h3>
            <div className="cc-fact-final-grid">
              <div
                className={`cc-fact-final-option${result.betterAlternative === 'assignment' ? ' winner' : ''}`}
              >
                <span className="cc-fact-final-label">Aceptar asignación</span>
                <strong className={result.scenarioAssignment.totalPnlNet >= 0 ? 'pos' : 'neg'}>
                  {fmtSigned(result.scenarioAssignment.totalPnlNet)}
                </strong>
              </div>
              <span className="cc-fact-vs">vs.</span>
              <div
                className={`cc-fact-final-option${result.betterAlternative === 'btc_sell' ? ' winner' : ''}`}
              >
                <span className="cc-fact-final-label">Buy to Close + vender</span>
                <strong className={result.scenarioBtcSell.totalPnlNet >= 0 ? 'pos' : 'neg'}>
                  {fmtSigned(result.scenarioBtcSell.totalPnlNet)}
                </strong>
              </div>
            </div>
            <p className="cc-fact-diff cc-fact-diff-center">
              <strong>Diferencia: {result.differenceFavorsLabel}</strong>
            </p>
          </div>
        </>
      )}
    </section>
  )
}
