export const MULTI_ACCOUNT_SLOT_COUNT = 3
export const MULTI_ACCOUNT_OPERABLE_FRACTION = 1 / 3

export type AccountSlot = 1 | 2 | 3

export const MULTI_ACCOUNT_LABELS: Record<AccountSlot, string> = {
  1: 'Cuenta Pedrito',
  2: 'Cuenta Pedro',
  3: 'Cuenta Beatriz',
}

export type DailyCloseRecord = {
  slot: AccountSlot
  date: string
  closingBalance: number
}

export type AccountLedgerStats = {
  slot: AccountSlot
  label: string
  latestBalance: number | null
  latestDate: string | null
  operableAmount: number | null
  previousBalance: number | null
  dailyChange: number | null
  dailyChangePct: number | null
  totalChange: number | null
  totalChangePct: number | null
  firstBalance: number | null
  firstDate: string | null
  recordCount: number
}

export type MultiAccountLedgerSummary = {
  accounts: AccountLedgerStats[]
  totalBalance: number
  totalOperable: number
  totalDailyChange: number | null
  asOfDate: string | null
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100
}

function roundPct(n: number): number {
  return Math.round(n * 100) / 100
}

export function operableFromBalance(closingBalance: number): number {
  return roundUsd(closingBalance * MULTI_ACCOUNT_OPERABLE_FRACTION)
}

export function parseLedgerDateInput(raw: string): string | null {
  const trimmed = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  return trimmed
}

export function todayLedgerDateLocal(reference = new Date()): string {
  const y = reference.getFullYear()
  const m = String(reference.getMonth() + 1).padStart(2, '0')
  const d = String(reference.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function pctChange(from: number, to: number): number | null {
  if (from === 0) return null
  return roundPct(((to - from) / Math.abs(from)) * 100)
}

function recordsForSlot(records: DailyCloseRecord[], slot: AccountSlot): DailyCloseRecord[] {
  return records
    .filter((r) => r.slot === slot)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function buildAccountLedgerStats(
  records: DailyCloseRecord[],
  slot: AccountSlot,
): AccountLedgerStats {
  const series = recordsForSlot(records, slot)
  if (series.length === 0) {
    return {
      slot,
      label: MULTI_ACCOUNT_LABELS[slot],
      latestBalance: null,
      latestDate: null,
      operableAmount: null,
      previousBalance: null,
      dailyChange: null,
      dailyChangePct: null,
      totalChange: null,
      totalChangePct: null,
      firstBalance: null,
      firstDate: null,
      recordCount: 0,
    }
  }

  const first = series[0]
  const latest = series[series.length - 1]
  const previous = series.length > 1 ? series[series.length - 2] : null

  const dailyChange =
    previous != null ? roundUsd(latest.closingBalance - previous.closingBalance) : null

  return {
    slot,
    label: MULTI_ACCOUNT_LABELS[slot],
    latestBalance: latest.closingBalance,
    latestDate: latest.date,
    operableAmount: operableFromBalance(latest.closingBalance),
    previousBalance: previous?.closingBalance ?? null,
    dailyChange,
    dailyChangePct:
      previous != null
        ? pctChange(previous.closingBalance, latest.closingBalance)
        : null,
    totalChange: roundUsd(latest.closingBalance - first.closingBalance),
    totalChangePct: pctChange(first.closingBalance, latest.closingBalance),
    firstBalance: first.closingBalance,
    firstDate: first.date,
    recordCount: series.length,
  }
}

export function buildMultiAccountLedgerSummary(
  records: DailyCloseRecord[],
): MultiAccountLedgerSummary {
  const slots = [1, 2, 3] as AccountSlot[]
  const accounts = slots.map((slot) => buildAccountLedgerStats(records, slot))

  const totalBalance = roundUsd(
    accounts.reduce((sum, a) => sum + (a.latestBalance ?? 0), 0),
  )
  const totalOperable = roundUsd(
    accounts.reduce((sum, a) => sum + (a.operableAmount ?? 0), 0),
  )

  const dates = accounts
    .map((a) => a.latestDate)
    .filter((d): d is string => d != null)
    .sort()
  const asOfDate = dates.length ? dates[dates.length - 1] : null

  const dailyParts = accounts
    .map((a) => a.dailyChange)
    .filter((n): n is number => n != null)
  const totalDailyChange =
    dailyParts.length > 0 ? roundUsd(dailyParts.reduce((s, n) => s + n, 0)) : null

  return {
    accounts,
    totalBalance,
    totalOperable,
    totalDailyChange,
    asOfDate,
  }
}

export function upsertDailyCloses(
  records: DailyCloseRecord[],
  date: string,
  closes: { slot: AccountSlot; closingBalance: number }[],
): DailyCloseRecord[] {
  const next = records.filter(
    (r) => !(r.date === date && closes.some((c) => c.slot === r.slot)),
  )
  for (const { slot, closingBalance } of closes) {
    if (!Number.isFinite(closingBalance) || closingBalance < 0) continue
    next.push({ slot, date, closingBalance: roundUsd(closingBalance) })
  }
  return next
}

export function validateDailyCloseInput(
  date: string,
  balances: Partial<Record<AccountSlot, string>>,
): string[] {
  const errors: string[] = []
  if (!parseLedgerDateInput(date)) errors.push('Fecha no válida.')
  const slots = [1, 2, 3] as AccountSlot[]
  let anyFilled = false
  for (const slot of slots) {
    const raw = balances[slot]?.trim() ?? ''
    if (raw === '') continue
    anyFilled = true
    const n = parseFloat(raw)
    if (!Number.isFinite(n) || n < 0) {
      errors.push(`${MULTI_ACCOUNT_LABELS[slot]}: balance debe ser ≥ 0.`)
    }
  }
  if (!anyFilled) errors.push('Indica al menos un balance de cierre.')
  return errors
}