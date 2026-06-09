import { useCallback, useEffect, useState } from 'react'
import {
  areTargetAlertsEnabled,
  getNotificationPermission,
  requestTargetAlertPermission,
  setTargetAlertsEnabled,
} from '../services/notifications/targetAlertNotifier'

export function TargetAlertsSettings() {
  const [enabled, setEnabled] = useState(areTargetAlertsEnabled)
  const [permission, setPermission] = useState(getNotificationPermission())
  const [busy, setBusy] = useState(false)

  const refreshPermission = useCallback(() => {
    setPermission(getNotificationPermission())
  }, [])

  useEffect(() => {
    refreshPermission()
  }, [refreshPermission])

  const handleToggle = async () => {
    if (!enabled) {
      setBusy(true)
      try {
        const result = await requestTargetAlertPermission()
        setPermission(result)
        if (result === 'granted') {
          setTargetAlertsEnabled(true)
          setEnabled(true)
        }
      } finally {
        setBusy(false)
      }
      return
    }

    setTargetAlertsEnabled(false)
    setEnabled(false)
  }

  const permissionLabel =
    permission === 'unsupported'
      ? 'No soportado en este navegador'
      : permission === 'granted'
        ? 'Permitidas'
        : permission === 'denied'
          ? 'Bloqueadas (revisa ajustes del navegador)'
          : 'Sin solicitar'

  return (
    <div className="card settings-card">
      <h3 className="settings-heading">Alertas de objetivo 1,5%</h3>
      <p className="subtitle">
        Vigila precios cada 5 s en cualquier pantalla (Inicio, Abiertas, etc.) y avisa cuando un lote
        supera su venta mínima al 1,5%. En demo los precios oscilan para que puedas probar las alertas.
        Muestra notificación del sistema y banner en pantalla aunque la app esté abierta.
        La misma alerta (por lote o activo) no se repite antes de 5 minutos.
      </p>

      <p className="settings-meta">
        Permiso del sistema: <strong>{permissionLabel}</strong>
      </p>

      <button
        type="button"
        className={`btn ${enabled ? 'ghost' : 'primary'}`}
        disabled={busy || permission === 'unsupported' || permission === 'denied'}
        onClick={() => void handleToggle()}
      >
        {busy
          ? 'Solicitando…'
          : enabled
            ? 'Desactivar alertas push'
            : 'Activar alertas push'}
      </button>

      {enabled && (
        <ul className="legend-list" style={{ marginTop: '1rem' }}>
          <li>
            <strong>Última compra (LIFO):</strong> «X · Última compra (fecha) supera 1,5% — vender primero»
          </li>
          <li>
            <strong>Compra anterior:</strong> «X · Compra del (fecha) supera 1,5% (LIFO #2)»
          </li>
          <li>
            <strong>Todos los lotes:</strong> resumen cuando cada contrato del activo está en objetivo
          </li>
        </ul>
      )}
    </div>
  )
}
