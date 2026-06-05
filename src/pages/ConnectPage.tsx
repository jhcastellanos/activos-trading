import { useApp } from '../app/providers/AppProvider'
import { loginUrl } from '../schwab/api'
import { logout } from '../schwab/api'

export function ConnectPage() {
  const { connectionMode, session, sessionLoading, setDemoMode, refreshSession } = useApp()

  if (sessionLoading) {
    return <p className="empty">Verificando sesión…</p>
  }

  return (
    <section className="connect-page">
      <h2 className="page-title">Conexión Charles Schwab</h2>
      <p className="subtitle">
        Autenticación oficial OAuth. Esta app nunca pide tu contraseña de Schwab.
      </p>

      {connectionMode === 'demo' && (
        <div className="card">
          <p>Estás en <strong>modo Demo</strong> con datos de prueba. Al conectar Schwab, las compras/ventas se importarán desde tu cuenta.</p>
        </div>
      )}

      {session?.authenticated && connectionMode === 'schwab' ? (
        <div className="card">
          <p className="pos">Sesión Schwab activa.</p>
          {session.schwab?.needsReauth && (
            <p className="signin-error">
              La conexión expiró. <a href={loginUrl()}>Reconectar</a>
            </p>
          )}
          <button
            className="btn ghost"
            onClick={async () => {
              await logout()
              refreshSession()
            }}
          >
            Desconectar Schwab
          </button>
        </div>
      ) : (
        <>
          <a className="btn primary signin-btn" href={loginUrl()}>
            Conectar con Charles Schwab
          </a>
          <button className="btn ghost" type="button" onClick={setDemoMode} style={{ marginTop: 12 }}>
            Continuar en modo Demo (sin Schwab)
          </button>
        </>
      )}
    </section>
  )
}
