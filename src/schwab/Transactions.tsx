import { useState } from 'react'
import { fetchTransactions, loginUrl, type TransactionsResponse } from './api'

export function Transactions() {
  const [data, setData] = useState<TransactionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsReauth, setNeedsReauth] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    setNeedsReauth(false)
    try {
      const res = await fetchTransactions()
      setData(res)
    } catch (e) {
      const msg = (e as Error).message
      if (/reconect|reauth|sesi[oó]n/i.test(msg)) setNeedsReauth(true)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="tx">
      <div className="tx-head">
        <h2>Transacciones de Schwab</h2>
        <button className="btn primary" onClick={load} disabled={loading}>
          {loading ? 'Cargando…' : 'Cargar transacciones'}
        </button>
      </div>

      {needsReauth && (
        <p className="signin-error">
          Tu conexión con Schwab expiró. <a href={loginUrl()}>Reconectar</a>
        </p>
      )}
      {error && !needsReauth && <p className="signin-error">{error}</p>}

      {data && (
        <p className="tx-meta">
          {Array.isArray(data.transactions) ? data.transactions.length : 0} operaciones ·{' '}
          {new Date(data.startDate).toLocaleDateString('es')} a{' '}
          {new Date(data.endDate).toLocaleDateString('es')}
        </p>
      )}

      {data && Array.isArray(data.transactions) && data.transactions.length > 0 && (
        <pre className="tx-raw">{JSON.stringify(data.transactions.slice(0, 20), null, 2)}</pre>
      )}
    </section>
  )
}
