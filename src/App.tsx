import { useMemo, useState } from 'react'
import type { Asset, AssetType } from './types'
import { useLocalStorage } from './useLocalStorage'
import { useInstallPrompt } from './useInstallPrompt'

const TYPES: { value: AssetType; label: string }[] = [
  { value: 'cripto', label: 'Cripto' },
  { value: 'accion', label: 'Acción' },
  { value: 'forex', label: 'Forex' },
  { value: 'otro', label: 'Otro' },
]

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

const emptyForm = {
  symbol: '',
  name: '',
  type: 'cripto' as AssetType,
  quantity: '',
  buyPrice: '',
  currentPrice: '',
}

function App() {
  const [assets, setAssets] = useLocalStorage<Asset[]>('activos-trading:assets', [])
  const [form, setForm] = useState(emptyForm)
  const { canInstall, installed, promptInstall } = useInstallPrompt()

  const totals = useMemo(() => {
    const invested = assets.reduce((s, a) => s + a.quantity * a.buyPrice, 0)
    const market = assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0)
    const pnl = market - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
    return { invested, market, pnl, pnlPct }
  }, [assets])

  const addAsset = (e: React.FormEvent) => {
    e.preventDefault()
    const quantity = parseFloat(form.quantity)
    const buyPrice = parseFloat(form.buyPrice)
    const currentPrice = parseFloat(form.currentPrice || form.buyPrice)
    if (!form.symbol.trim() || Number.isNaN(quantity) || Number.isNaN(buyPrice)) return

    const asset: Asset = {
      id: crypto.randomUUID(),
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim() || form.symbol.trim().toUpperCase(),
      type: form.type,
      quantity,
      buyPrice,
      currentPrice: Number.isNaN(currentPrice) ? buyPrice : currentPrice,
    }
    setAssets((prev) => [asset, ...prev])
    setForm(emptyForm)
  }

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  const updatePrice = (id: string, value: string) => {
    const price = parseFloat(value)
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, currentPrice: Number.isNaN(price) ? 0 : price } : a)),
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Activos Trading</h1>
          <p className="subtitle">Tu portafolio, siempre a mano.</p>
        </div>
        {canInstall && !installed && (
          <button className="btn install" onClick={promptInstall}>
            Instalar app
          </button>
        )}
      </header>

      <section className="summary">
        <div className="card">
          <span className="card-label">Invertido</span>
          <span className="card-value">{currency(totals.invested)}</span>
        </div>
        <div className="card">
          <span className="card-label">Valor actual</span>
          <span className="card-value">{currency(totals.market)}</span>
        </div>
        <div className={`card ${totals.pnl >= 0 ? 'pos' : 'neg'}`}>
          <span className="card-label">Ganancia / Pérdida</span>
          <span className="card-value">
            {currency(totals.pnl)} ({totals.pnlPct.toFixed(2)}%)
          </span>
        </div>
      </section>

      <form className="form" onSubmit={addAsset}>
        <div className="row">
          <input
            placeholder="Símbolo (BTC)"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          />
          <input
            placeholder="Nombre (Bitcoin)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as AssetType })}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <input
            type="number"
            step="any"
            placeholder="Cantidad"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <input
            type="number"
            step="any"
            placeholder="Precio compra"
            value={form.buyPrice}
            onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
          />
          <input
            type="number"
            step="any"
            placeholder="Precio actual"
            value={form.currentPrice}
            onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
          />
        </div>
        <button className="btn primary" type="submit">
          Agregar activo
        </button>
      </form>

      <section className="list">
        {assets.length === 0 && (
          <p className="empty">Aún no tienes activos. Agrega el primero arriba.</p>
        )}
        {assets.map((a) => {
          const invested = a.quantity * a.buyPrice
          const market = a.quantity * a.currentPrice
          const pnl = market - invested
          const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
          return (
            <div className="asset" key={a.id}>
              <div className="asset-main">
                <div className="asset-id">
                  <span className="asset-symbol">{a.symbol}</span>
                  <span className="asset-name">{a.name}</span>
                  <span className="tag">{a.type}</span>
                </div>
                <button className="btn ghost" onClick={() => removeAsset(a.id)} aria-label="Eliminar">
                  ✕
                </button>
              </div>
              <div className="asset-grid">
                <div>
                  <span className="mini-label">Cantidad</span>
                  <span>{a.quantity}</span>
                </div>
                <div>
                  <span className="mini-label">Compra</span>
                  <span>{currency(a.buyPrice)}</span>
                </div>
                <div>
                  <span className="mini-label">Actual</span>
                  <input
                    className="price-input"
                    type="number"
                    step="any"
                    value={a.currentPrice}
                    onChange={(e) => updatePrice(a.id, e.target.value)}
                  />
                </div>
                <div className={pnl >= 0 ? 'pos' : 'neg'}>
                  <span className="mini-label">P&L</span>
                  <span>
                    {currency(pnl)} ({pnlPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <footer className="footer">
        <span>activos-trading · PWA</span>
      </footer>
    </div>
  )
}

export default App
