import { useEffect, useState } from 'react'
import { Portfolio } from './Portfolio'
import { Transactions } from './schwab/Transactions'
import { SignInWithSchwab } from './auth/SignInWithSchwab'
import { useSession } from './auth/useSession'
import { useInstallPrompt } from './useInstallPrompt'
import { logout } from './schwab/api'

function useOAuthError(): string | null {
  const [error] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('schwab_error')
  })
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])
  return error
}

function App() {
  const { loading, session, reload } = useSession()
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const oauthError = useOAuthError()

  if (loading) {
    return (
      <div className="app center">
        <p className="empty">Cargando…</p>
      </div>
    )
  }

  if (!session?.authenticated) {
    return <SignInWithSchwab error={oauthError} />
  }

  const needsReauth = session.schwab?.needsReauth

  const handleLogout = async () => {
    await logout()
    reload()
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Activos Trading</h1>
          <p className="subtitle">
            {needsReauth ? 'Conexión con Schwab expirada' : 'Conectado con Schwab'}
          </p>
        </div>
        <div className="header-actions">
          {canInstall && !installed && (
            <button className="btn install" onClick={promptInstall}>
              Instalar app
            </button>
          )}
          <button className="btn ghost" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <Transactions />
      <Portfolio />

      <footer className="footer">
        <span>activos-trading · PWA</span>
      </footer>
    </div>
  )
}

export default App
