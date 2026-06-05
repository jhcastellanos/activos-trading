import type { RankedScalpingAsset } from '../domain/types'
import { ISSUER_LABELS } from '../business/leveragedEtfCatalog'
import { SCALPING_SECTOR_LABELS } from '../business/scalpingSectors'
import { TURNOVER_TIER_LABELS } from '../business/turnoverTier'
import { turnoverTierClass } from '../business/scalpingAssetRank'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function ScalpingAssetRow({ item }: { item: RankedScalpingAsset }) {
  const levClass = item.tradeLeverage === 2 ? 'scalp-trade-x2' : 'scalp-trade-x3'

  return (
    <li className="scalp-asset-row">
      <div className="scalp-asset-head">
        <span className="scalp-rank">#{item.rank}</span>
        <div className="scalp-symbol-block">
          <span className="scalp-symbol">{item.symbol}</span>
          <span className="scalp-name">{item.name}</span>
        </div>
        <span className={`scalp-sector-badge sector-${item.sector}`}>
          {SCALPING_SECTOR_LABELS[item.sector]}
        </span>
      </div>

      <div className="scalp-trade-as">
        <span className="scalp-trade-label">Operar</span>
        <span className="scalp-trade-pick">
          <span className={`scalp-trade-badge ${levClass}`}>
            {item.tradeBull}{' '}
            <span className="scalp-trade-mult">x{item.tradeLeverage}</span>
          </span>
          <span className="scalp-trade-issuer">{ISSUER_LABELS[item.tradeBullIssuer]}</span>
        </span>
        {item.tradeInverse ? (
          <span className="scalp-trade-inverse">Inv. {item.tradeInverse}</span>
        ) : null}
      </div>

      <div className="scalp-metrics">
        <div className="scalp-metric scalp-metric-primary">
          <span className="scalp-metric-label">Range%</span>
          <span className="scalp-metric-value">{fmtPct(item.avgDailyRangePct)}</span>
        </div>
        <div className="scalp-metric">
          <span className="scalp-metric-label">Turnover</span>
          <span className={`scalp-turnover-badge ${turnoverTierClass(item.turnoverTier)}`}>
            {TURNOVER_TIER_LABELS[item.turnoverTier]}
          </span>
          <span className="scalp-metric-sub">{fmtPct(item.turnoverPct)}</span>
        </div>
        <div className="scalp-metric">
          <span className="scalp-metric-label">NAV</span>
          <span className="scalp-metric-value">{currency(item.nav)}</span>
          <span className="scalp-metric-sub">
            Precio {currency(item.price)}
            {item.priceBelowNav ? (
              <span className="scalp-nav-signal"> · bajo NAV ({fmtPct(item.navDiscountPct)})</span>
            ) : (
              <span className="scalp-nav-neutral"> · sobre NAV</span>
            )}
          </span>
        </div>
      </div>
    </li>
  )
}
