import type { AccountSlot, DailyCloseRecord } from '../business/multiAccountLedger'

async function apiJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, {
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
    if (res.status === 401 || res.status === 403) return null
    if (!res.ok) throw new Error(await res.text())
    return (await res.json()) as T
  } catch {
    return null
  }
}

export type SaveDailyClosesPayload = {
  date: string
  closes: { slot: AccountSlot; closingBalance: number }[]
}

export async function fetchTradingAccountLedger(): Promise<DailyCloseRecord[] | null> {
  return apiJson<DailyCloseRecord[]>('/api/trading-accounts/ledger')
}

export async function saveTradingAccountDailyCloses(
  payload: SaveDailyClosesPayload,
): Promise<DailyCloseRecord[] | null> {
  return apiJson<DailyCloseRecord[]>('/api/trading-accounts/ledger/daily', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}