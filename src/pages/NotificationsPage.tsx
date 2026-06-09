import { Link } from 'react-router-dom'
import { TargetAlertsHistory } from '../components/TargetAlertsHistory'
import { areTargetAlertsEnabled } from '../services/notifications/targetAlertNotifier'

export function NotificationsPage() {
  const enabled = areTargetAlertsEnabled()

  return (
    <section className="notifications-page paginated-page">
      <h2 className="page-title">Notificaciones</h2>

      {!enabled && (
        <p className="subtitle notifications-hint">
          Las alertas push están desactivadas.{' '}
          <Link to="/settings">Actívalas en Ajustes</Link> para recibir avisos cuando un lote
          supere el 1,5% de objetivo.
        </p>
      )}

      <TargetAlertsHistory />
    </section>
  )
}
