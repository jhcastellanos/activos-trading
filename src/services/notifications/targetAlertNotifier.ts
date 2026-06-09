import type { TargetAlertPayload } from '../../business/targetAlerts'
import { dispatchTargetAlertShown, notifyTargetAlertsChanged } from './alertEvents'
import { appendTodayAlertLog } from './targetAlertLog'

const ENABLED_KEY = 'activos-trading:target-alerts-enabled'
const COOLDOWN_KEY = 'activos-trading:target-alerts-cooldown'

/** Mismo aviso (lote u activo) no se repite antes de 5 minutos. */
export const TARGET_ALERT_COOLDOWN_MS = 5 * 60 * 1000

type CooldownMap = Record<string, number>

export function areTargetAlertsEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

export function setTargetAlertsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0')
    notifyTargetAlertsChanged()
  } catch {
    // ignore
  }
}

function loadCooldownMap(): CooldownMap {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return {}
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as CooldownMap
    }
    return {}
  } catch {
    return {}
  }
}

function saveCooldownMap(map: CooldownMap): void {
  try {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function pruneExpiredCooldowns(map: CooldownMap, now = Date.now()): CooldownMap {
  const next: CooldownMap = {}
  for (const [key, ts] of Object.entries(map)) {
    if (now - ts < TARGET_ALERT_COOLDOWN_MS) next[key] = ts
  }
  return next
}

/** Claves (lote o resumen de activo) que aún están en ventana de 5 minutos. */
export function getActiveCooldownKeys(): Set<string> {
  const pruned = pruneExpiredCooldowns(loadCooldownMap())
  saveCooldownMap(pruned)
  return new Set(Object.keys(pruned))
}

export function isNotificationInCooldown(key: string, now = Date.now()): boolean {
  const map = loadCooldownMap()
  const ts = map[key]
  if (ts == null) return false
  return now - ts < TARGET_ALERT_COOLDOWN_MS
}

export function markNotificationCooldown(key: string, now = Date.now()): void {
  const map = pruneExpiredCooldowns(loadCooldownMap(), now)
  map[key] = now
  saveCooldownMap(map)
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestTargetAlertPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (getNotificationPermission() === 'unsupported') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

function vibrateDevice() {
  try {
    navigator.vibrate?.([180, 80, 180])
  } catch {
    // ignore
  }
}

export async function showTargetAlertNotifications(alerts: TargetAlertPayload[]): Promise<void> {
  if (!alerts.length || !areTargetAlertsEnabled()) return
  if (getNotificationPermission() !== 'granted') return

  const registration = await getServiceWorkerRegistration()

  for (const alert of alerts) {
    if (isNotificationInCooldown(alert.lotId)) continue

    const options: NotificationOptions = {
      body: alert.body,
      tag: `target-alert-${alert.lotId}`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: '/open', symbol: alert.symbol },
    }

    let pushed = false

    try {
      if (registration?.showNotification) {
        await registration.showNotification(alert.title, options)
        pushed = true
      }
    } catch (err) {
      console.warn('SW notification failed, trying fallback:', err)
    }

    if (!pushed) {
      try {
        new Notification(alert.title, options)
        pushed = true
      } catch (err) {
        console.warn('Notification API fallback failed:', err)
      }
    }

    dispatchTargetAlertShown(alert)
    appendTodayAlertLog(alert)
    vibrateDevice()
    markNotificationCooldown(alert.lotId)
  }
}
