import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSession } from '../_lib/session'
import {
  SchwabReauthRequired,
  getAccountNumbers,
  schwabFetch,
} from '../_lib/schwab'

const DEFAULT_RANGE_DAYS = 90

function isoOrDefault(value: string | undefined, fallback: Date): string {
  if (value) return new Date(value).toISOString()
  return fallback.toISOString()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await getSession(req, res)
    if (!session.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const q = req.query as Record<string, string | undefined>
    const now = new Date()
    const start = isoOrDefault(q.startDate, new Date(now.getTime() - DEFAULT_RANGE_DAYS * 86400000))
    const end = isoOrDefault(q.endDate, now)

    // Si no pasan accountHash, usamos la primera cuenta del usuario.
    let accountHash = q.accountHash
    if (!accountHash) {
      const accounts = await getAccountNumbers(session.userId)
      if (!accounts.length) {
        return res.status(404).json({ error: 'No hay cuentas disponibles' })
      }
      accountHash = accounts[0].hashValue
    }

    const params = new URLSearchParams({ startDate: start, endDate: end, types: 'TRADE' })
    const transactions = await schwabFetch(
      session.userId,
      `/trader/v1/accounts/${accountHash}/transactions?${params.toString()}`,
    )

    return res.status(200).json({ accountHash, startDate: start, endDate: end, transactions })
  } catch (err) {
    if (err instanceof SchwabReauthRequired) {
      return res.status(401).json({ error: err.message, needsReauth: true })
    }
    res.status(500).json({ error: (err as Error).message })
  }
}
