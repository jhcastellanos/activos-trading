import { Router } from 'express'
import { createHash } from 'node:crypto'
import { prisma } from '../lib/db'
import { getSession } from '../lib/session'
import {
  SchwabReauthRequired,
  exchangeCode,
  getAccountNumbers,
  getAccountNumbersWithToken,
  persistTokens,
  schwabFetch,
} from '../lib/schwab'

export const schwabRouter = Router()

const DEFAULT_RANGE_DAYS = 90

function deriveUserKey(hashValues: string[]): string {
  const joined = [...hashValues].sort().join('|')
  return createHash('sha256').update(joined).digest('hex')
}

function isoOrDefault(value: string | undefined, fallback: Date): string {
  if (value) return new Date(value).toISOString()
  return fallback.toISOString()
}

// GET /api/schwab/callback
schwabRouter.get('/callback', async (req, res) => {
  const appBase = process.env.APP_BASE_URL || ''
  try {
    const { code, state, error } = req.query as Record<string, string | undefined>

    if (error) {
      return res.redirect(302, `${appBase}/?schwab_error=${encodeURIComponent(error)}`)
    }
    if (!code || !state) {
      return res.status(400).json({ error: 'Faltan code o state' })
    }

    const session = await getSession(req, res)
    if (!session.oauthState || session.oauthState !== state) {
      return res.status(400).json({ error: 'State inválido (posible CSRF)' })
    }
    session.oauthState = undefined

    const tokens = await exchangeCode(code)

    const accounts = await getAccountNumbersWithToken(tokens.access_token)
    if (!accounts.length) {
      return res.status(400).json({ error: 'No se encontraron cuentas de Schwab' })
    }
    const schwabUserKey = deriveUserKey(accounts.map((a) => a.hashValue))

    const user = await prisma.user.upsert({
      where: { schwabUserKey },
      create: { schwabUserKey },
      update: {},
    })

    await persistTokens(user.id, tokens)

    session.userId = user.id
    await session.save()

    res.redirect(302, `${appBase}/?connected=1`)
  } catch (err) {
    res.redirect(302, `${appBase}/?schwab_error=${encodeURIComponent((err as Error).message)}`)
  }
})

// GET /api/schwab/accounts
schwabRouter.get('/accounts', async (req, res) => {
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
})

// GET /api/schwab/transactions
schwabRouter.get('/transactions', async (req, res) => {
  try {
    const session = await getSession(req, res)
    if (!session.userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const q = req.query as Record<string, string | undefined>
    const now = new Date()
    const start = isoOrDefault(q.startDate, new Date(now.getTime() - DEFAULT_RANGE_DAYS * 86400000))
    const end = isoOrDefault(q.endDate, now)

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
})
