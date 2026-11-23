import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/db'
import { getSession } from '../lib/session'

export const tradingAccountsRouter = Router()

const VALID_SLOTS = new Set([1, 2, 3])

function parseYmd(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return Number.isNaN(date.getTime()) ? null : date
}

async function requireUserId(req: Request, res: Response): Promise<string | null> {
  const session = await getSession(req, res)
  if (!session.userId) {
    res.status(401).json({ error: 'No autenticado' })
    return null
  }
  return session.userId
}

function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toRecord(row: {
  accountSlot: number
  date: Date
  closingBalance: number
}): { slot: 1 | 2 | 3; date: string; closingBalance: number } {
  return {
    slot: row.accountSlot as 1 | 2 | 3,
    date: formatDateOnly(row.date),
    closingBalance: row.closingBalance,
  }
}

// GET /api/trading-accounts/ledger
tradingAccountsRouter.get('/ledger', async (req, res) => {
  try {
    const userId = await requireUserId(req, res)
    if (!userId) return

    const rows = await prisma.tradingAccountDailyClose.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { accountSlot: 'asc' }],
    })
    res.json(rows.map(toRecord))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// PUT /api/trading-accounts/ledger/daily
tradingAccountsRouter.put('/ledger/daily', async (req, res) => {
  try {
    const userId = await requireUserId(req, res)
    if (!userId) return

    const { date, closes } = req.body as {
      date?: string
      closes?: { slot: number; closingBalance: number }[]
    }

    const dateObj = date ? parseYmd(date) : null
    if (!dateObj) {
      return res.status(400).json({ error: 'Fecha inválida (YYYY-MM-DD).' })
    }
    if (!Array.isArray(closes) || closes.length === 0) {
      return res.status(400).json({ error: 'closes debe ser un arreglo no vacío.' })
    }

    for (const c of closes) {
      if (!VALID_SLOTS.has(c.slot)) {
        return res.status(400).json({ error: `Slot inválido: ${c.slot}` })
      }
      if (!Number.isFinite(c.closingBalance) || c.closingBalance < 0) {
        return res.status(400).json({ error: 'Balance de cierre inválido.' })
      }
    }

    await prisma.$transaction(
      closes.map((c) =>
        prisma.tradingAccountDailyClose.upsert({
          where: {
            userId_accountSlot_date: {
              userId,
              accountSlot: c.slot,
              date: dateObj,
            },
          },
          create: {
            userId,
            accountSlot: c.slot,
            date: dateObj,
            closingBalance: c.closingBalance,
          },
          update: {
            closingBalance: c.closingBalance,
          },
        }),
      ),
    )

    const rows = await prisma.tradingAccountDailyClose.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { accountSlot: 'asc' }],
    })
    res.json(rows.map(toRecord))
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})