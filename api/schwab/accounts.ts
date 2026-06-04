import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSession } from '../_lib/session'
import { SchwabReauthRequired, schwabFetch } from '../_lib/schwab'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await getSession(req, res)
    if (!session.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }
    const accounts = await schwabFetch(session.userId, '/trader/v1/accounts')
    return res.status(200).json({ accounts })
  } catch (err) {
    if (err instanceof SchwabReauthRequired) {
      return res.status(401).json({ error: err.message, needsReauth: true })
    }
    res.status(500).json({ error: (err as Error).message })
  }
}
