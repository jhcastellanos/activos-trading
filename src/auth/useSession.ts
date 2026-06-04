import { useCallback, useEffect, useState } from 'react'
import { fetchSession, type SessionInfo } from '../schwab/api'

interface SessionState {
  loading: boolean
  session: SessionInfo | null
  error: string | null
  reload: () => void
}

export function useSession(): SessionState {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchSession()
      .then((s) => setSession(s))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { loading, session, error, reload }
}
