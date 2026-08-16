import { useMemo, useState } from 'react'
import {
  calculateCashSecuredPutMetrics,
  validateCashSecuredPutInputs,
  type CashSecuredPutInputs,
} from '../business/cspCalculator'

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const fmtPct = (n: number) => `${n.toFixed(2)}%`

type FieldKey = keyof CashSecuredPutInputs

const fields: { key: FieldKey; label: string; step: string; integer?: boolean }[] = [
  { key: 'currentPrice', label: 'Current Price', step: '0.01' },
  { key: 'strikePrice', label: 'Strike Price', step: '0.01' },
  { key: 'premiumPerShare', label: 'Premium Per Share', step: '0.01' },
  { key: 'daysToExpiration', label: 'Days to Expiration', step: '1', integer: true },
  { key: 'delta', label: 'Delta', step: '0.01' },
]

function parseFieldValue(raw: string, integer?: boolean): number {
  if (raw.trim() === '') return Number.NaN
  const n = integer ? parseInt(raw, 10) : parseFloat(raw)
  return Number.isFinite(n) ? n : Number.NaN
}

export function CashSecuredPutCalculatorPage() {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    currentPrice: '',
    strikePrice: '',
    premiumPerShare: '',
    daysToExpiration: '',
    delta: '',
  })

  const inputs = useMemo<CashSecuredPutInputs>(
    () => ({
      currentPrice: parseFieldValue(values.currentPrice),
      strikePrice: parseFieldValue(values.strikePrice),
      premiumPerShare: parseFieldValue(values.premiumPerShare),
      daysToExpiration: parseFieldValue(values.daysToExpiration, true),
      delta: parseFieldValue(values.delta),
    }),
    [values],
  )

  const errors = useMemo(() => validateCashSecuredPutInputs(inputs), [inputs])
  const result = useMemo(
    () => (errors.length === 0 ? calculateCashSecuredPutMetrics(inputs) : null),
    [errors.length, inputs],
  )

  const showPartial = Object.values(values).some((v) => v.trim() !== '')

  return (
    <section className="cc-calculator-page csp-calculator-page">
      <h2 className="page-title">Cash Secured Put Calculator</h2>
      <p className="subtitle">CSP · actualización en tiempo real · 1 contrato (100 acciones)</p>

      <div className="card cc-inputs-card">
        <h3 className="settings-heading">Parámetros del trade</h3>
        <div className="cc-input-grid">
          {fields.map(({ key, label, step, integer }) => (
            <label key={key} className="cc-field">
              <span className="cc-field-label">{label}</span>
              <input
                type="number"
                inputMode={integer ? 'numeric' : 'decimal'}
                step={step}
                value={values[key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={
                  key === 'strikePrice'
                    ? '220.00'
                    : key === 'premiumPerShare'
                      ? '3.50'
                      : key === 'daysToExpiration'
                        ? '14'
                        : key === 'delta'
                          ? '-0.25'
                          : '0.00'
                }
              />
            </label>
          ))}
        </div>
        {showPartial && errors.length > 0 && (
          <ul className="cc-errors">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
      </div>

      {result && (
        <>
          <div className="card cc-hero-card csp-breakeven-card">
            <span className="cc-hero-label">Break-Even Price</span>
            <strong className="cc-hero-value csp-breakeven-value">
              {fmtPrice(result.breakEvenPrice)}
            </strong>
            <p className="csp-breakeven-copy">
              <strong>Strike</strong> = precio al que comprarías las acciones si hay asignación (
              {fmtPrice(result.assignedPrice)}).
            </p>
            <p className="csp-breakeven-copy">
              <strong>Break-Even</strong> = hasta qué precio puede caer el activo después de la
              asignación antes de pérdida neta al vencimiento, gracias a la prima recibida (
              {fmtPrice(result.downsideProtectionUsd)} por acción).
            </p>
          </div>

          <div className="card cc-breakdown-card">
            <h3 className="settings-heading">Resultados</h3>
            <div className="cc-breakdown-grid">
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Collateral Required</span>
                <span className="goal-metric-value">{currency(result.collateralRequired)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Premium Received</span>
                <span className="goal-metric-value">{currency(result.premiumReceived)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">ROIC</span>
                <span className="goal-metric-value pos">{fmtPct(result.roicPct)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Annualized ROIC</span>
                <span className="goal-metric-value pos">{fmtPct(result.annualizedRoicPct)}</span>
                <span className="goal-metric-hint">Extrapolación matemática, no rendimiento garantizado.</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Assigned Price</span>
                <span className="goal-metric-value">{fmtPrice(result.assignedPrice)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Premium Received Per Share</span>
                <span className="goal-metric-value">{fmtPrice(result.downsideProtectionUsd)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Effective Entry Price</span>
                <span className="goal-metric-value">{fmtPrice(result.breakEvenPrice)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Effective Cost Basis</span>
                <span className="goal-metric-value">{currency(result.effectiveCostBasis)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Downside Protection from Strike</span>
                <span className="goal-metric-value">{fmtPrice(result.downsideProtectionUsd)}/share</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Downside Protection</span>
                <span className="goal-metric-value">{fmtPct(result.downsideProtectionPct)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Days to Expiration</span>
                <span className="goal-metric-value">{result.daysToExpiration}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Delta</span>
                <span className="goal-metric-value">{result.delta.toFixed(2)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Approx. Probability ITM</span>
                <span className="goal-metric-value">{fmtPct(result.approxProbabilityItmPct)}</span>
                <span className="goal-metric-hint">Aproximación por |Delta|, no probabilidad exacta.</span>
              </div>
            </div>
          </div>

          <div className="card csp-scenario-card">
            <h3 className="settings-heading">Escenarios al vencimiento</h3>
            <ul className="csp-scenario-list">
              <li>
                Acción en {fmtPrice(result.assignedPrice)}: beneficio ≈ prima recibida (
                {fmtPrice(result.downsideProtectionUsd)}/acción).
              </li>
              <li>
                Acción en {fmtPrice(result.breakEvenPrice + 1.5)}: todavía hay beneficio neto.
              </li>
              <li>
                Acción en {fmtPrice(result.breakEvenPrice)}: <strong>Break Even</strong>.
              </li>
              <li>
                Acción en {fmtPrice(result.breakEvenPrice - 1.5)}: comienza pérdida neta.
              </li>
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
