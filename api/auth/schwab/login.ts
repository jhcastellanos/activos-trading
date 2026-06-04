import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'node:crypto'
import { getSession } from '../../_lib/session'
import { buildAuthorizeUrl } from '../../_lib/schwab'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await getSession(req, res)
    const state = randomBytes(16).toString('hex')
    session.oauthState = state
    await session.save()
    res.redirect(302, buildAuthorizeUrl(state))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}
