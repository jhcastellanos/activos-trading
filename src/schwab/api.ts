export interface SessionInfo {
  authenticated: boolean
  userId?: string
  schwab?: {
    connected: boolean
    needsReauth: boolean
    refreshExpiresAt: string | null
  }
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init })
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // sin cuerpo JSON
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

export function fetchSession(): Promise<SessionInfo> {
  return getJson<SessionInfo>('/api/auth/me')
}

export function logout(): Promise<{ ok: boolean }> {
  return getJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
}

export function loginUrl(): string {
  return '/api/auth/schwab/login'
}

export interface TransactionsResponse {
  accountHash: string
  startDate: string
  endDate: string
  transactions: unknown[]
}

export function fetchTransactions(): Promise<TransactionsResponse> {
  return getJson<TransactionsResponse>('/api/schwab/transactions')
}
