import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { DashboardPage } from '../pages/DashboardPage'
import { OpenPositionsPage } from '../pages/OpenPositionsPage'
import { ClosedTradesPage } from '../pages/ClosedTradesPage'
import { SettingsPage } from '../pages/SettingsPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="open" element={<OpenPositionsPage />} />
        <Route path="sell-plan" element={<Navigate to="/closed" replace />} />
        <Route path="closed" element={<ClosedTradesPage />} />
        <Route path="connect" element={<Navigate to="/settings" replace />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="history"
          element={
            <PlaceholderPage
              title="Historial diario"
              description="Balance base, objetivo del día, resultado real y estado (overnight vs cerrado)."
            />
          }
        />
        <Route
          path="sync"
          element={
            <PlaceholderPage
              title="Sincronizar con Schwab"
              description="Cuando tu app esté aprobada, aquí importaremos automáticamente tus compras y ventas de activos desde Charles Schwab (sin CSV)."
            />
          }
        />
        <Route
          path="symbol/:symbol"
          element={
            <PlaceholderPage
              title="Detalle de activo"
              description="Vista por símbolo con todos los lotes y métricas."
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
