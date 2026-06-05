import type { AccountYearGrowth } from '../business/accountYearGrowth'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function fmtYearStartDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function AccountGrowthHero({ growth }: { growth: AccountYearGrowth }) {
  const isUp = growth.gainAmount >= 0

  return (
    <section className={`account-growth-hero ${isUp ? 'status-up' : 'status-down'}`}>
      <p className="account-growth-label">Cuenta {growth.year}</p>
      <p className="account-growth-pct">{fmtPct(growth.gainPercentage)}</p>
      <p className={`account-growth-usd ${isUp ? 'pos' : 'neg'}`}>
        {currency(growth.gainAmount)}
      </p>

      <div className="account-growth-row">
        <span className="account-growth-point-label account-growth-col-start account-growth-row-label">
          Primer registro
        </span>
        <span className="account-growth-point-label account-growth-col-current account-growth-row-label">
          Actual
        </span>

        <span className="account-growth-point-value account-growth-col-start account-growth-row-value">
          {currency(growth.yearStartBalance)}
        </span>
        <span className="account-growth-arrow" aria-hidden>
          →
        </span>
        <span className="account-growth-point-value account-growth-col-current account-growth-row-value account-growth-current">
          {currency(growth.currentBalance)}
        </span>

        <span className="account-growth-point-hint account-growth-col-start account-growth-row-hint">
          {fmtYearStartDate(growth.yearStartDate)}
        </span>
      </div>
    </section>
  )
}
