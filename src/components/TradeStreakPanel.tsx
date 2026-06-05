import type { TradeStreakResult } from '../business/tradeStreak'

function fmtUsdShort(n: number): string {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}$${Math.abs(n).toFixed(0)}`
}

function fmtPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function TradeStreakPanel({ streak }: { streak: TradeStreakResult }) {
  return (
    <section className="dash-panel streak-panel">
      <h3 className="dash-panel-title">
        Racha de resultados
        <span className="dash-panel-sub">últimas {streak.totalShown} operaciones</span>
      </h3>

      <div className="streak-grid">
        {streak.tiles.map((tile) => (
          <div
            key={tile.id}
            className={`streak-tile tier-${tile.tier}`}
            title={`${tile.symbol} · ${fmtUsdShort(tile.pnlUsd)} · ${fmtPct(tile.pnlPct)}`}
          >
            <span className="streak-tile-usd">{fmtUsdShort(tile.pnlUsd)}</span>
            <span className="streak-tile-pct">{fmtPct(tile.pnlPct)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
