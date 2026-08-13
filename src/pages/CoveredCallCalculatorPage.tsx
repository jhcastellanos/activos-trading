import { useMemo, useState } from 'react'
import {
  calculateCoveredCallMetrics,
  validateCoveredCallInputs,
  type CoveredCallInputs,
} from '../business/coveredCallCalculator'

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtBid = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const fmtPct = (n: number, decimals = 3) => `${n.toFixed(decimals)}%`

const fmtTargetPct = (n: number) => `${n.toFixed(2)}%`

type FieldKey = keyof CoveredCallInputs

const fields: { key: FieldKey; label: string; step: string; integer?: boolean }[] = [
  { key: 'tradePrice', label: 'Trade Price', step: '0.01' },
  { key: 'contracts', label: 'Contracts', step: '1', integer: true },
  { key: 'strikePrice', label: 'Strike Price', step: '0.01' },
  { key: 'bid', label: 'Bid', step: '0.01' },
  { key: 'daysToExpiration', label: 'Days to Expiration', step: '1', integer: true },
]

function parseFieldValue(raw: string, integer?: boolean): number {
  if (raw.trim() === '') return Number.NaN
  const n = integer ? parseInt(raw, 10) : parseFloat(raw)
  return Number.isFinite(n) ? n : Number.NaN
}

export function CoveredCallCalculatorPage() {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    tradePrice: '',
    contracts: '',
    strikePrice: '',
    bid: '',
    daysToExpiration: '',
  })

  const inputs = useMemo<CoveredCallInputs>(
    () => ({
      tradePrice: parseFieldValue(values.tradePrice),
      contracts: parseFieldValue(values.contracts, true),
      strikePrice: parseFieldValue(values.strikePrice),
      bid: parseFieldValue(values.bid),
      daysToExpiration: parseFieldValue(values.daysToExpiration, true),
    }),
    [values],
  )

  const errors = useMemo(() => validateCoveredCallInputs(inputs), [inputs])
  const result = useMemo(
    () => (errors.length === 0 ? calculateCoveredCallMetrics(inputs) : null),
    [errors.length, inputs],
  )

  const showPartial = values.tradePrice || values.contracts || values.strikePrice || values.bid || values.daysToExpiration

  return (
    <section className="cc-calculator-page">
      <h2 className="page-title">Daily Percent Ratio Calculator</h2>
      <p className="subtitle">Covered Calls · actualización en tiempo real</p>

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
                min={integer ? '1' : '0'}
                value={values[key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={key === 'contracts' ? '244' : key === 'daysToExpiration' ? '127' : '0.00'}
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
          <div className="card cc-hero-card">
            <span className="cc-hero-label">Daily Percent Ratio</span>
            <strong className="cc-hero-value">{fmtPct(result.dailyPercentRatio)}</strong>
            <span className="cc-hero-badge">{result.dailyReturnLabel}</span>
            <p className="cc-hero-note">Resultado matemático informativo, no asesoría financiera.</p>
          </div>

          <div className="card cc-highlight-card">
            <span className="card-label">Total Covered Call Profit</span>
            <span className="cc-highlight-value">{currency(result.totalCoveredCallProfit)}</span>
            <p className="cc-highlight-sub">
              Net Premium + Potential Capital Gain at Assignment
            </p>
          </div>

          <div className="card cc-targets-card">
            <h3 className="settings-heading">Target Bid Recommendations</h3>
            <p className="subtitle cc-targets-note">
              Required Bid — prima por acción necesaria para alcanzar cada objetivo diario. No
              implica que exista ese bid en el mercado.
            </p>
            <div className="cc-target-grid">
              {result.targetBids.map((target) => (
                <article
                  key={target.targetDailyPct}
                  className={`cc-target-card${target.isPreferred ? ' preferred' : ''}${target.isClosestToCurrentBid ? ' closest' : ''}`}
                >
                  <span className="cc-target-pct">{fmtTargetPct(target.targetDailyPct)} Daily</span>
                  <span className="cc-target-bid-label">Required Bid</span>
                  <strong className="cc-target-bid">{fmtBid(target.requiredBid)}</strong>
                  {target.isPreferred && <span className="cc-target-tag">Objetivo preferido</span>}
                  {target.isClosestToCurrentBid && (
                    <span className="cc-target-tag closest-tag">Más cercano a tu Bid</span>
                  )}
                </article>
              ))}
            </div>
          </div>

          <div className="card cc-breakdown-card">
            <h3 className="settings-heading">Desglose</h3>
            <div className="cc-breakdown-grid">
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Total Invested</span>
                <span className="goal-metric-value">{currency(result.totalInvested)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Gross Premium</span>
                <span className="goal-metric-value">{currency(result.grossPremium)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Fees</span>
                <span className="goal-metric-value">{currency(result.contractFees)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Net Premium</span>
                <span className="goal-metric-value">{currency(result.netPremium)}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Capital Gain at Assignment</span>
                <span className={`goal-metric-value ${result.capitalGain >= 0 ? 'pos' : 'neg'}`}>
                  {currency(result.capitalGain)}
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Calendar Days</span>
                <span className="goal-metric-value">{result.calendarDays}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Trading Days</span>
                <span className="goal-metric-value">{result.businessDays}</span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Expiration Date</span>
                <span className="goal-metric-value">{result.expirationDate}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
