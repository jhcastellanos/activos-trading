import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { prisma } from '../lib/db'
import { getSession } from '../lib/session'
import { buildAuthorizeUrl } from '../lib/schwab'

export const authRouter = Router()

// GET /api/auth/schwab/login
authRouter.get('/schwab/login', async (req, res) => {
  try {
    const session = await getSession(req, res)
    const state = randomBytes(16).toString('hex')
    session.oauthState = state
    await session.save()
    res.redirect(302, buildAuthorizeUrl(state))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/auth/me
authRouter.get('/me', async (req, res) => {
  try {
    const session = await getSession(req, res)
    if (!session.userId) {
      return res.status(200).json({ authenticated: false })
    }
    const token = await prisma.schwabToken.findUnique({
      where: { userId: session.userId },
      select: { refreshExpiresAt: true },
    })
    const needsReauth = !token || token.refreshExpiresAt.getTime() <= Date.now()
    return res.status(200).json({
      authenticated: true,
      userId: session.userId,
      schwab: {
        connected: !needsReauth,
        needsReauth,
        refreshExpiresAt: token?.refreshExpiresAt ?? null,
      },
    })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/auth/logout
authRouter.post('/logout', async (req, res) => {
  try {
    const session = await getSession(req, res)
    session.destroy()
    return res.status(200).json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})
