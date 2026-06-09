import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TARGET_ALERT_COOLDOWN_MS,
  getActiveCooldownKeys,
  isNotificationInCooldown,
  markNotificationCooldown,
} from '../targetAlertNotifier'

const COOLDOWN_KEY = 'activos-trading:target-alerts-cooldown'

const storage = new Map<string, string>()

describe('targetAlertNotifier cooldown', () => {
  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storage.set(k, v)
      },
      removeItem: (k: string) => {
        storage.delete(k)
      },
      clear: () => storage.clear(),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('bloquea la misma clave durante 5 minutos', () => {
    markNotificationCooldown('lot-aapl-1')
    expect(isNotificationInCooldown('lot-aapl-1')).toBe(true)
    expect(getActiveCooldownKeys().has('lot-aapl-1')).toBe(true)

    vi.advanceTimersByTime(TARGET_ALERT_COOLDOWN_MS - 1)
    expect(isNotificationInCooldown('lot-aapl-1')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(isNotificationInCooldown('lot-aapl-1')).toBe(false)
    expect(getActiveCooldownKeys().has('lot-aapl-1')).toBe(false)
  })

  it('cooldowns independientes por lote y resumen de activo', () => {
    markNotificationCooldown('lot-tsla-1')
    markNotificationCooldown('summary-TQQQ')

    expect(isNotificationInCooldown('lot-tsla-1')).toBe(true)
    expect(isNotificationInCooldown('summary-TQQQ')).toBe(true)
    expect(isNotificationInCooldown('lot-aapl-2')).toBe(false)
  })

  it('limpia entradas expiradas al leer claves activas', () => {
    localStorage.setItem(
      COOLDOWN_KEY,
      JSON.stringify({
        old: Date.now() - TARGET_ALERT_COOLDOWN_MS - 1000,
        fresh: Date.now(),
      }),
    )
    const keys = getActiveCooldownKeys()
    expect(keys.has('old')).toBe(false)
    expect(keys.has('fresh')).toBe(true)
  })
})
