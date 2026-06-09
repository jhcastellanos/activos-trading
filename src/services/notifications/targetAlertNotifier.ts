import type { SymbolPositionGroup } from '../../domain/types'
import type { TargetAlertPayload } from '../../business/targetAlerts'
import { dispatchTargetAlertShown, notifyTargetAlertsChanged } from './alertEvents'

const ENABLED_KEY = 'activos-trading:target-alerts-enabled'
const NOTIFIED_LOTS_KEY = 'activos-trading:target-alerts-notified-lots'

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

/** Marca lotes ya en objetivo al activar alertas para no spamear al encender. */
export function primeAlertBaseline(groups: SymbolPositionGroup[]): void {
  const reached = groups.flatMap((g) =>
    g.lots.filter((l) => l.targetState === 'reached').map((l) => l.id),
  )
  if (reached.length > 0) markLotsNotified(reached)
}

export function loadNotifiedLotIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_LOTS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

export function saveNotifiedLotIds(ids: Set<string>): void {
  try {
    localStorage.setItem(NOTIFIED_LOTS_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

/** Quita del registro los lotes que ya no están en objetivo (para poder re-alertar si vuelven a cruzar). */
export function pruneNotifiedLotIds(noLongerAtTarget: Set<string>): void {
  if (noLongerAtTarget.size === 0) return
  const current = loadNotifiedLotIds()
  const next = new Set([...current].filter((id) => !noLongerAtTarget.has(id)))
  saveNotifiedLotIds(next)
}

export function markLotsNotified(lotIds: string[]): void {
  const next = loadNotifiedLotIds()
  for (const id of lotIds) next.add(id)
  saveNotifiedLotIds(next)
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

    // Siempre aviso en pantalla (app abierta en primer plano).
    dispatchTargetAlertShown(alert)
    vibrateDevice()
    markLotsNotified(alert.newlyReachedLotIds)
  }
}
