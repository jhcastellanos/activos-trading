import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeTargetAlerts, lotIdsNoLongerAtTarget } from '../business/targetAlerts'
import type { SymbolPositionGroup } from '../domain/types'
import type { BrokerService } from '../services/interfaces/BrokerService'
import { PortfolioService } from '../services/PortfolioService'
import {
  areTargetAlertsEnabled,
  loadNotifiedLotIds,
  pruneNotifiedLotIds,
  showTargetAlertNotifications,
} from '../services/notifications/targetAlertNotifier'

/** Intervalo de refresco de precio de mercado (Schwab tiene límites de rate; 5s es un balance razonable). */
export const MARKET_PRICE_REFRESH_MS = 5_000

export function useLiveOpenPositions(broker: BrokerService) {
  const portfolio = useRef(new PortfolioService(broker)).current
  const groupsRef = useRef<SymbolPositionGroup[]>([])
  const [groups, setGroups] = useState<SymbolPositionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const reload = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true)
      else setRefreshing(true)
      try {
        const lots = await broker.getOpenLots()
        const symbols = [...new Set(lots.map((l) => l.symbol))]
        const quotes = symbols.length ? await broker.getQuotes(symbols) : {}
        const next = await portfolio.getOpenPositionGroupsFrom(lots, quotes)
        const previous = groupsRef.current

        if (areTargetAlertsEnabled() && previous.length > 0) {
          pruneNotifiedLotIds(lotIdsNoLongerAtTarget(next))
          const alerts = analyzeTargetAlerts(previous, next, loadNotifiedLotIds())
          void showTargetAlertNotifications(alerts)
        }

        groupsRef.current = next
        setGroups(next)
        setPriceUpdatedAt(new Date())
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [broker, portfolio],
  )

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const tick = () => {
      const pollInBackground = areTargetAlertsEnabled()
      if (document.visibilityState === 'visible' || pollInBackground) {
        reload({ silent: true })
      }
    }
    const id = window.setInterval(tick, MARKET_PRICE_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [reload])

  return { groups, loading, priceUpdatedAt, refreshing, reload }
}
