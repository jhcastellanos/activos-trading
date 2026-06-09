import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from './providers/AppProvider'
import { ConnectionBadge } from '../components/ConnectionBadge'
import { NavIcon } from '../components/NavIcon'
import { TargetAlertToast } from '../components/TargetAlertToast'
import { useTargetPriceAlertWatcher } from '../hooks/useTargetPriceAlertWatcher'

const nav = [
  { to: '/', label: 'Inicio', icon: 'home' as const },
  { to: '/open', label: 'Abiertas', icon: 'open' as const },
  { to: '/closed', label: 'Cerrados', icon: 'closed' as const },
  { to: '/assets', label: 'Activos', icon: 'assets' as const },
  { to: '/settings', label: 'Ajustes', icon: 'settings' as const },
]

export function AppShell() {
  const { connectionMode, broker } = useApp()
  useTargetPriceAlertWatcher(broker)

  return (
    <div className="app shell">
      <TargetAlertToast />
      <header className="header shell-header">
        <div>
          <h1>Activos Trading</h1>
          <ConnectionBadge mode={connectionMode} />
        </div>
      </header>

      <main className="shell-main">
        <div className="shell-page">
          <Outlet />
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end={item.to === '/'}
          >
            <NavIcon name={item.icon} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
