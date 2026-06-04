import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSession } from '../_lib/session'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }
  try {
    const session = await getSession(req, res)
    session.destroy()
    return res.status(200).json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
}
