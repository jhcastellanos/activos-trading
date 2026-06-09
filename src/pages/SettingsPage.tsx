import { useApp } from '../app/providers/AppProvider'
import { useTheme } from '../app/providers/ThemeProvider'
import { TargetAlertsHistory } from '../components/TargetAlertsHistory'
import { TargetAlertsSettings } from '../components/TargetAlertsSettings'
import { localBrokerRepo } from '../storage/LocalBrokerRepository'

export function SettingsPage() {
  const { connectionMode } = useApp()
  const { theme, setTheme } = useTheme()

  return (
    <section>
      <h2 className="page-title">Configuración</h2>

      <div className="card settings-card">
        <h3 className="settings-heading">Apariencia</h3>
        <p className="subtitle">El tema se guarda en este dispositivo.</p>
        <div className="theme-toggle" role="group" aria-label="Tema de la aplicación">
          <button
            type="button"
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            Claro
          </button>
          <button
            type="button"
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            Oscuro
          </button>
        </div>
      </div>

      <TargetAlertsSettings />
      <TargetAlertsHistory />

      <div className="card settings-card">
        <h3 className="settings-heading">Colores de ganancia</h3>
        <ul className="legend-list">
          <li>
            <span className="legend-dot profit-met" /> Verde: ≥ 1,5% (objetivo cumplido)
          </li>
          <li>
            <span className="legend-dot profit-pending" /> Amarillo: 0% a 1,49% (aún no llega)
          </li>
          <li>
            <span className="legend-dot profit-loss" /> Rojo: por debajo de 0% (pérdida)
          </li>
        </ul>
      </div>

      <div className="card settings-card">
        <p>
          Precio compra promedio = <strong>total invertido ÷ contratos abiertos</strong>, luego se suma{' '}
          <strong>$0.01</strong> a ese promedio (y a cada lote). El 1,5% se calcula sobre esa base.
        </p>
        <p>
          Objetivo por lote: <strong>1,5%</strong> mínimo al vender.
        </p>
        <p>
          Objetivo diario: <strong>1%</strong> sobre base de cuenta.
        </p>
        <p>Modo conexión: {connectionMode}</p>
      </div>

      {connectionMode === 'demo' && (
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            localBrokerRepo.resetToSeed()
            window.location.reload()
          }}
        >
          Restaurar datos demo (incluye ejemplos rojo/amarillo/verde)
        </button>
      )}
    </section>
  )
}
