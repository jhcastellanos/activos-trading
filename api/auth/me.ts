import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/db'
import { getSession } from '../_lib/session'

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
}
