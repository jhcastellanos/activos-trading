import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appendTodayAlertLog, getTodayAlertLog, sortAlertLogNewestFirst } from '../targetAlertLog'

const LOG_KEY = 'activos-trading:target-alerts-log'
const storage = new Map<string, string>()

const sampleAlert = {
  symbol: 'AAPL',
  kind: 'single_lot' as const,
  lotId: 'lot-aapl-1',
  sellPriority: 1,
  sellFirst: true,
  boughtAt: '2026-06-04T10:00:00Z',
  lotsAtTarget: 1,
  totalLots: 3,
  newlyReachedLotIds: ['lot-aapl-1'],
  title: 'AAPL · última compra',
  body: 'AAPL · 10 contratos (4 jun 2026) superan 1,5%',
}

describe('targetAlertLog', () => {
  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
      removeItem: (k: string) => storage.delete(k),
      clear: () => storage.clear(),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-09T14:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('guarda y lista alertas del día', () => {
    appendTodayAlertLog(sampleAlert)
    const entries = getTodayAlertLog()
    expect(entries).toHaveLength(1)
    expect(entries[0].symbol).toBe('AAPL')
    expect(entries[0].sentAt).toBeTruthy()
  })

  it('ordena del más reciente al más antiguo', () => {
    const older = appendTodayAlertLog(sampleAlert, new Date('2026-06-09T10:00:00Z'))
    vi.setSystemTime(new Date('2026-06-09T14:30:00Z'))
    const newer = appendTodayAlertLog(
      { ...sampleAlert, lotId: 'lot-aapl-2', title: 'AAPL · compra' },
      new Date('2026-06-09T14:30:00Z'),
    )

    const sorted = sortAlertLogNewestFirst(getTodayAlertLog())
    expect(sorted[0].id).toBe(newer.id)
    expect(sorted[1].id).toBe(older.id)
  })

  it('limpia el historial al cambiar de día', () => {
    appendTodayAlertLog(sampleAlert)
    vi.setSystemTime(new Date('2026-06-10T08:00:00Z'))
    expect(getTodayAlertLog()).toHaveLength(0)

    const raw = storage.get(LOG_KEY)
    expect(raw).toContain('2026-06-10')
  })
})
