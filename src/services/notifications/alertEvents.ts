import type { TargetAlertPayload } from '../../business/targetAlerts'

export const TARGET_ALERTS_CHANGED = 'activos-trading:target-alerts-changed'

export function notifyTargetAlertsChanged(): void {
  window.dispatchEvent(new Event(TARGET_ALERTS_CHANGED))
}

export const TARGET_ALERT_SHOWN = 'activos-trading:target-alert-shown'

export function dispatchTargetAlertShown(alert: TargetAlertPayload): void {
  window.dispatchEvent(new CustomEvent(TARGET_ALERT_SHOWN, { detail: alert }))
}
