import { loginUrl } from '../schwab/api'

export function SignInWithSchwab({ error }: { error?: string | null }) {
  return (
    <div className="signin">
      <div className="signin-card">
        <h1>Activos Trading</h1>
        <p className="subtitle">Conecta tu cuenta de Charles Schwab para ver tus operaciones y estadísticas.</p>
        <a className="btn primary signin-btn" href={loginUrl()}>
          Iniciar sesión con Schwab
        </a>
        {error && <p className="signin-error">{error}</p>}
        <p className="signin-note">
          Usamos OAuth de Schwab. Nunca vemos tu usuario ni contraseña; tus tokens se guardan cifrados.
        </p>
      </div>
    </div>
  )
}
