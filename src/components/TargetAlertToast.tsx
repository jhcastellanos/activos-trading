import { useEffect, useState } from 'react'
import type { TargetAlertPayload } from '../business/targetAlerts'
import { TARGET_ALERT_SHOWN } from '../services/notifications/alertEvents'

const TOAST_MS = 6_000

export function TargetAlertToast() {
  const [alert, setAlert] = useState<TargetAlertPayload | null>(null)

  useEffect(() => {
    const onAlert = (e: Event) => {
      const detail = (e as CustomEvent<TargetAlertPayload>).detail
      if (!detail) return
      setAlert(detail)
    }
    window.addEventListener(TARGET_ALERT_SHOWN, onAlert)
    return () => window.removeEventListener(TARGET_ALERT_SHOWN, onAlert)
  }, [])

  useEffect(() => {
    if (!alert) return
    const id = window.setTimeout(() => setAlert(null), TOAST_MS)
    return () => window.clearTimeout(id)
  }, [alert])

  if (!alert) return null

  return (
    <div className="target-alert-toast" role="status" aria-live="assertive">
      <strong>{alert.title}</strong>
      <p>{alert.body}</p>
    </div>
  )
}
