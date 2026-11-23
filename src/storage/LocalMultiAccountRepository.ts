import type { AccountSlot, DailyCloseRecord } from '../business/multiAccountLedger'

const KEY = 'activos-trading:multi-account-ledger'

function load(): DailyCloseRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DailyCloseRecord[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r) =>
        (r.slot === 1 || r.slot === 2 || r.slot === 3) &&
        typeof r.date === 'string' &&
        Number.isFinite(r.closingBalance),
    )
  } catch {
    return []
  }
}

function save(records: DailyCloseRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(records))
}

export const localMultiAccountRepo = {
  list(): DailyCloseRecord[] {
    return load()
  },
  replaceAll(records: DailyCloseRecord[]): void {
    save(records)
  },
  upsertMany(updates: DailyCloseRecord[]): DailyCloseRecord[] {
    let records = load()
    for (const u of updates) {
      records = records.filter((r) => !(r.date === u.date && r.slot === u.slot))
      records.push(u)
    }
    save(records)
    return records
  },
  getForDate(date: string): Partial<Record<AccountSlot, number>> {
    const out: Partial<Record<AccountSlot, number>> = {}
    for (const r of load()) {
      if (r.date === date) out[r.slot] = r.closingBalance
    }
    return out
  },
}