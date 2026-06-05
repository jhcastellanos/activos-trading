import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from './providers/AppProvider'
import { ConnectionBadge } from '../components/ConnectionBadge'

const nav = [
  { to: '/', label: 'Inicio' },
  { to: '/open', label: 'Abiertas' },
  { to: '/sell-plan', label: 'Plan LIFO' },
  { to: '/closed', label: 'Cerrados' },
  { to: '/connect', label: 'Conexión' },
  { to: '/settings', label: 'Ajustes' },
]

export function AppShell() {
  const { connectionMode } = useApp()

  return (
    <div className="app shell">
      <header className="header shell-header">
        <div>
          <h1>Activos Trading</h1>
          <ConnectionBadge mode={connectionMode} />
        </div>
      </header>

      <main className="shell-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end={item.to === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
