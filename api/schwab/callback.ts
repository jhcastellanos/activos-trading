import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'
import { prisma } from '../_lib/db'
import { getSession } from '../_lib/session'
import {
  exchangeCode,
  getAccountNumbersWithToken,
  persistTokens,
} from '../_lib/schwab'

function deriveUserKey(hashValues: string[]): string {
  const joined = [...hashValues].sort().join('|')
  return createHash('sha256').update(joined).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
}
