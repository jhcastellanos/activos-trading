import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../app/providers/AppProvider'
import {
  buildMultiAccountLedgerSummary,
  operableFromBalance,
  MULTI_ACCOUNT_LABELS,
  todayLedgerDateLocal,
  upsertDailyCloses,
  validateDailyCloseInput,
  type AccountSlot,
  type DailyCloseRecord,
} from '../business/multiAccountLedger'
import {
  fetchTradingAccountLedger,
  saveTradingAccountDailyCloses,
} from '../services/tradingAccountsApi'
import { localMultiAccountRepo } from '../storage/LocalMultiAccountRepository'

const currency = (n: number) =>
  new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' }).format(n)

function fmtSigned(n: number) {
  const sign = n >= 0 ? '+' : '−'
  return `${sign}${currency(Math.abs(n))}`
}

function fmtPct(n: number | null): string {
  if (n == null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function MultiAccountLedgerPage() {
  const { session, connectionMode } = useApp()
  const [records, setRecords] = useState<DailyCloseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [persistedRemote, setPersistedRemote] = useState(false)

  const [date, setDate] = useState(todayLedgerDateLocal())
  const [balances, setBalances] = useState<Record<AccountSlot, string>>({
    1: '',
    2: '',
    3: '',
  })

  const reload = useCallback(async () => {
    setLoading(true)
    let next = localMultiAccountRepo.list()
    setPersistedRemote(false)

    if (session?.authenticated) {
      const remote = await fetchTradingAccountLedger()
      if (remote) {
        next = remote
        localMultiAccountRepo.replaceAll(remote)
        setPersistedRemote(true)
      }
    }

    setRecords(next)
    setLoading(false)
  }, [session?.authenticated])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const existing = localMultiAccountRepo.getForDate(date)
    setBalances({
      1: existing[1] != null ? String(existing[1]) : '',
      2: existing[2] != null ? String(existing[2]) : '',
      3: existing[3] != null ? String(existing[3]) : '',
    })
  }, [date, records])

  const summary = useMemo(() => buildMultiAccountLedgerSummary(records), [records])

  const errors = useMemo(() => validateDailyCloseInput(date, balances), [date, balances])

  const recentBySlot = useMemo(() => {
    const slots = [1, 2, 3] as AccountSlot[]
    return Object.fromEntries(
      slots.map((slot) => [
        slot,
        [...records]
          .filter((r) => r.slot === slot)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 7),
      ]),
    ) as Record<AccountSlot, DailyCloseRecord[]>
  }, [records])

  const handleSave = async () => {
    if (errors.length > 0) return
    setSaving(true)
    setSaveMessage(null)

    const closes = ([1, 2, 3] as AccountSlot[])
      .map((slot) => {
        const raw = balances[slot].trim()
        if (raw === '') return null
        return { slot, closingBalance: parseFloat(raw) }
      })
      .filter((c): c is { slot: AccountSlot; closingBalance: number } => c != null)

    let next = upsertDailyCloses(records, date, closes)
    localMultiAccountRepo.replaceAll(next)

    if (session?.authenticated) {
      const remote = await saveTradingAccountDailyCloses({ date, closes })
      if (remote) {
        next = remote
        localMultiAccountRepo.replaceAll(remote)
        setPersistedRemote(true)
        setSaveMessage('Guardado en la base de datos.')
      } else {
        setSaveMessage('Guardado en este dispositivo (no se pudo sincronizar con el servidor).')
      }
    } else {
      setSaveMessage('Guardado en este dispositivo.')
    }

    setRecords(next)
    setSaving(false)
  }

  if (loading) {
    return <p className="empty">Cargando cuentas…</p>
  }

  return (
    <section className="cc-calculator-page ma-ledger-page">
      <h2 className="page-title">Registro de tres cuentas</h2>
      <p className="subtitle">
        Cierre diario · operable = ⅓ del balance ·{' '}
        {persistedRemote ? 'sincronizado con la base de datos' : 'almacenamiento local'}
        {connectionMode === 'demo' ? ' · modo demo' : ''}
      </p>

      <div className="card ma-hero-card">
        <span className="cc-hero-label">Total operable hoy (⅓ × 3 cuentas)</span>
        <strong className="ma-hero-value">{currency(summary.totalOperable)}</strong>
        <div className="ma-hero-grid">
          <div>
            <span className="goal-metric-label">Balance total</span>
            <span className="goal-metric-value">{currency(summary.totalBalance)}</span>
          </div>
          <div>
            <span className="goal-metric-label">Δ vs ayer (suma)</span>
            <span
              className={`goal-metric-value ${
                summary.totalDailyChange == null
                  ? ''
                  : summary.totalDailyChange >= 0
                    ? 'pos'
                    : 'neg'
              }`}
            >
              {summary.totalDailyChange == null ? '—' : fmtSigned(summary.totalDailyChange)}
            </span>
          </div>
        </div>
        {summary.asOfDate && (
          <p className="cc-fact-hint">Último cierre registrado: {fmtDate(summary.asOfDate)}</p>
        )}
      </div>

      <div className="card cc-inputs-card">
        <h3 className="settings-heading">Actualizar cierre del día</h3>
        <div className="cc-input-grid ma-ledger-form">
          <label className="cc-field cc-field-full">
            <span className="cc-field-label">Fecha</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          {([1, 2, 3] as AccountSlot[]).map((slot) => (
            <label key={slot} className="cc-field">
              <span className="cc-field-label">{MULTI_ACCOUNT_LABELS[slot]} · cierre</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={balances[slot]}
                onChange={(e) =>
                  setBalances((prev) => ({
                    ...prev,
                    [slot]: e.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
        {errors.length > 0 && (
          <ul className="cc-errors">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn primary ma-save-btn"
          disabled={saving || errors.length > 0}
          onClick={() => void handleSave()}
        >
          {saving ? 'Guardando…' : 'Guardar las tres cuentas'}
        </button>
        {saveMessage && <p className="cc-fact-hint">{saveMessage}</p>}
        {!session?.authenticated && (
          <p className="cc-fact-hint">
            Inicia sesión con Schwab en Ajustes para guardar el historial en la base de datos entre
            dispositivos.
          </p>
        )}
      </div>

      <div className="ma-accounts-grid">
        {summary.accounts.map((acc) => (
          <article key={acc.slot} className="card ma-account-card">
            <h3 className="settings-heading">{acc.label}</h3>
            <div className="ma-operable-alert">
              <span className="ma-operable-label">Operable (⅓)</span>
              <strong className="ma-operable-value">
                {acc.operableAmount != null ? currency(acc.operableAmount) : '—'}
              </strong>
              <p className="ma-operable-copy">
                Monto sugerido para operar sin comprometer todo el balance de esta cuenta.
              </p>
            </div>
            <div className="cc-breakdown-grid">
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Balance cierre</span>
                <span className="goal-metric-value">
                  {acc.latestBalance != null ? currency(acc.latestBalance) : '—'}
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Δ día</span>
                <span
                  className={`goal-metric-value ${
                    acc.dailyChange == null ? '' : acc.dailyChange >= 0 ? 'pos' : 'neg'
                  }`}
                >
                  {acc.dailyChange == null ? '—' : fmtSigned(acc.dailyChange)}
                  {acc.dailyChangePct != null ? ` (${fmtPct(acc.dailyChangePct)})` : ''}
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Desde primer registro</span>
                <span
                  className={`goal-metric-value ${
                    acc.totalChange == null ? '' : acc.totalChange >= 0 ? 'pos' : 'neg'
                  }`}
                >
                  {acc.totalChange == null ? '—' : fmtSigned(acc.totalChange)}
                  {acc.totalChangePct != null ? ` (${fmtPct(acc.totalChangePct)})` : ''}
                </span>
              </div>
              <div className="cc-breakdown-item">
                <span className="goal-metric-label">Registros</span>
                <span className="goal-metric-value">{acc.recordCount}</span>
              </div>
            </div>
            {recentBySlot[acc.slot as AccountSlot].length > 0 && (
              <ul className="ma-history-list">
                {recentBySlot[acc.slot as AccountSlot].map((row) => (
                  <li key={`${row.slot}-${row.date}`}>
                    <span>{fmtDate(row.date)}</span>
                    <span>{currency(row.closingBalance)}</span>
                    <span className="ma-history-operable">
                      ⅓ {currency(operableFromBalance(row.closingBalance))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}