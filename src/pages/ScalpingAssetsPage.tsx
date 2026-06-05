import { useEffect, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import type { ScalpingUniverseResult } from '../business/scalpingAssetRank'
import { ALLOWED_SCALPING_SECTORS, SCALPING_SECTOR_LABELS } from '../business/scalpingSectors'
import type { ScalpingSector } from '../domain/types'
import { ScalpingAssetRow } from '../components/ScalpingAssetRow'

export function ScalpingAssetsPage() {
  const { assetScreener } = useApp()
  const [sector, setSector] = useState<ScalpingSector | null>(null)
  const [data, setData] = useState<ScalpingUniverseResult | null>(null)

  useEffect(() => {
    assetScreener.getScalpingUniverse(sector ?? undefined).then(setData)
  }, [assetScreener, sector])

  if (!data) {
    return <p className="empty">Cargando activos…</p>
  }

  const listTitle = sector
    ? `Top ${data.limit} — ${SCALPING_SECTOR_LABELS[sector]}`
    : `Top ${data.limit}`

  return (
    <section className="scalp-page">
      <h2 className="page-title">Activos para scalping</h2>
      <p className="scalp-intro">
        Solo sectores con tendencia. Sin filtro: top 50 global. Al elegir un sector: top 10 de ese
        sector. Cada activo tiene un ETF bull único (sin repetir el mismo x2/x3). Emisor: Direxion →
        GraniteShares → Defiance → otros.
      </p>

      <div className="scalp-sector-chips" role="group" aria-label="Filtrar por sector">
        <button
          type="button"
          className={`scalp-sector-chip sector-all ${sector === null ? 'active' : ''}`}
          onClick={() => setSector(null)}
        >
          Todos
        </button>
        {ALLOWED_SCALPING_SECTORS.map((s) => (
          <button
            key={s}
            type="button"
            className={`scalp-sector-chip sector-${s} ${sector === s ? 'active' : ''}`}
            onClick={() => setSector(s)}
          >
            {SCALPING_SECTOR_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="scalp-disclaimer">
        <strong>Importante:</strong> el ranking mide cuánto se mueve el subyacente — no indica
        buen momento de entrada. La decisión de compra sigue siendo tu análisis de precio y
        contexto.
      </div>

      <h3 className="scalp-section-title">{listTitle}</h3>
      <p className="scalp-section-hint">
        Ordenados por jugosidad del base (Range%, Turnover% y señal NAV).
      </p>
      {data.top.length === 0 ? (
        <p className="empty">No hay activos en este sector.</p>
      ) : (
        <ol className="scalp-asset-list">
          {data.top.map((item) => (
            <ScalpingAssetRow key={item.symbol} item={item} />
          ))}
        </ol>
      )}
    </section>
  )
}
