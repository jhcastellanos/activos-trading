import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ConnectionMode } from '../../domain/types'
import { DEMO_BYPASS_LOGIN } from '../../business/constants'
import type { BrokerService } from '../../services/interfaces/BrokerService'
import { DailyGoalService } from '../../services/DailyGoalService'
import { MockBrokerService } from '../../services/mock/MockBrokerService'
import { USMarketCalendarService } from '../../services/market/USMarketCalendarService'
import { PortfolioService } from '../../services/PortfolioService'
import { LocalGoalSnapshotRepository } from '../../storage/LocalGoalSnapshotRepository'
import { fetchSession, type SessionInfo } from '../../schwab/api'

const MODE_KEY = 'activos-trading:connection-mode'

interface AppContextValue {
  connectionMode: ConnectionMode
  session: SessionInfo | null
  sessionLoading: boolean
  broker: BrokerService
  portfolio: PortfolioService
  dailyGoal: DailyGoalService
  setDemoMode: () => void
  refreshSession: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function loadPreferredMode(): ConnectionMode {
  if (DEMO_BYPASS_LOGIN) return 'demo'
  const stored = localStorage.getItem(MODE_KEY)
  if (stored === 'demo') return 'demo'
  return 'disconnected'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(loadPreferredMode)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [sessionLoading, setSessionLoading] = useState(!DEMO_BYPASS_LOGIN)

  const refreshSession = useCallback(() => {
    if (DEMO_BYPASS_LOGIN) {
      setSession(null)
      setSessionLoading(false)
      return
    }
    setSessionLoading(true)
    fetchSession()
      .then((s) => {
        setSession(s)
        if (s.authenticated && s.schwab?.connected) {
          setConnectionMode('schwab')
          localStorage.removeItem(MODE_KEY)
        }
      })
      .catch(() => setSession(null))
      .finally(() => setSessionLoading(false))
  }, [])

  useEffect(() => {
    if (DEMO_BYPASS_LOGIN) {
      localStorage.setItem(MODE_KEY, 'demo')
      setConnectionMode('demo')
      refreshSession()
      return
    }
    refreshSession()
  }, [refreshSession])

  const setDemoMode = useCallback(() => {
    localStorage.setItem(MODE_KEY, 'demo')
    setConnectionMode('demo')
  }, [])

  const broker = useMemo((): BrokerService => {
    if (connectionMode === 'demo') return new MockBrokerService()
    // Schwab real: stub hasta Fase 4; fallback demo si no hay sesión
    if (connectionMode === 'schwab' && session?.authenticated) {
      // import dinámico futuro; por ahora mock para no romper UX
      return new MockBrokerService()
    }
    return new MockBrokerService()
  }, [connectionMode, session?.authenticated])

  const portfolio = useMemo(() => new PortfolioService(broker), [broker])
  const calendar = useMemo(() => new USMarketCalendarService(), [])
  const goalSnapshots = useMemo(() => new LocalGoalSnapshotRepository(), [])
  const dailyGoal = useMemo(
    () => new DailyGoalService(broker, goalSnapshots, calendar),
    [broker, goalSnapshots, calendar],
  )

  const value: AppContextValue = {
    connectionMode,
    session,
    sessionLoading,
    broker,
    portfolio,
    dailyGoal,
    setDemoMode,
    refreshSession,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
