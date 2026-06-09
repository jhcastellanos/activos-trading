import { useCallback, useEffect, useState } from 'react'
import {
  getTodayAlertLog,
  TARGET_ALERTS_LOG_CHANGED,
  type TargetAlertLogEntry,
} from '../services/notifications/targetAlertLog'
import { TARGET_ALERTS_CHANGED } from '../services/notifications/alertEvents'
import { areTargetAlertsEnabled } from '../services/notifications/targetAlertNotifier'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function TargetAlertsHistory() {
  const [entries, setEntries] = useState<TargetAlertLogEntry[]>([])
  const [enabled, setEnabled] = useState(areTargetAlertsEnabled)

  const refresh = useCallback(() => {
    setEnabled(areTargetAlertsEnabled())
    setEntries(getTodayAlertLog())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(TARGET_ALERTS_LOG_CHANGED, refresh)
    window.addEventListener(TARGET_ALERTS_CHANGED, refresh)
    const id = window.setInterval(refresh, 30_000)
    return () => {
      window.removeEventListener(TARGET_ALERTS_LOG_CHANGED, refresh)
      window.removeEventListener(TARGET_ALERTS_CHANGED, refresh)
      window.clearInterval(id)
    }
  }, [refresh])

  if (!enabled) return null

  const todayLabel = new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="card settings-card">
      <h3 className="settings-heading">Notificaciones de hoy</h3>
      <p className="subtitle">
        Historial del {todayLabel}. Orden: <strong>más reciente arriba</strong>. Se limpia cada día a
        medianoche local.
      </p>

      {entries.length === 0 ? (
        <p className="empty settings-empty">Aún no hay alertas enviadas hoy.</p>
      ) : (
        <div className="alert-log-table-wrap">
          <table className="alert-log-table">
            <thead>
              <tr>
                <th scope="col">Hora</th>
                <th scope="col">Activo</th>
                <th scope="col">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <time dateTime={entry.sentAt}>{formatTime(entry.sentAt)}</time>
                  </td>
                  <td className="alert-log-symbol">{entry.symbol}</td>
                  <td>
                    <span className="alert-log-title">{entry.title}</span>
                    <span className="alert-log-body">{entry.body}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
