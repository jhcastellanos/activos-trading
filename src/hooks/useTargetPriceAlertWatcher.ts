import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeTargetAlerts } from '../business/targetAlerts'
import type { SymbolPositionGroup } from '../domain/types'
import type { BrokerService } from '../services/interfaces/BrokerService'
import { PortfolioService } from '../services/PortfolioService'
import { TARGET_ALERTS_CHANGED } from '../services/notifications/alertEvents'
import {
  areTargetAlertsEnabled,
  getActiveCooldownKeys,
  primeAlertBaseline,
  showTargetAlertNotifications,
} from '../services/notifications/targetAlertNotifier'
import { MARKET_PRICE_REFRESH_MS } from './useLiveOpenPositions'

/**
 * Vigila precios en toda la app (cualquier pantalla) y dispara alertas 1,5%.
 */
export function useTargetPriceAlertWatcher(broker: BrokerService) {
  const portfolio = useRef(new PortfolioService(broker)).current
  const previousRef = useRef<SymbolPositionGroup[] | null>(null)
  const [enabled, setEnabled] = useState(areTargetAlertsEnabled)

  useEffect(() => {
    const sync = () => setEnabled(areTargetAlertsEnabled())
    window.addEventListener(TARGET_ALERTS_CHANGED, sync)
    return () => window.removeEventListener(TARGET_ALERTS_CHANGED, sync)
  }, [])

  const tick = useCallback(async () => {
    if (!areTargetAlertsEnabled()) return

    try {
      const lots = await broker.getOpenLots()
      const symbols = [...new Set(lots.map((l) => l.symbol))]
      const quotes = symbols.length ? await broker.getQuotes(symbols) : {}
      const next = await portfolio.getOpenPositionGroupsFrom(lots, quotes)
      const previous = previousRef.current

      if (previous) {
        const alerts = analyzeTargetAlerts(previous, next, getActiveCooldownKeys())
        await showTargetAlertNotifications(alerts)
      }

      previousRef.current = next
    } catch (err) {
      console.error('Target alert watcher tick failed:', err)
    }
  }, [broker, portfolio])

  useEffect(() => {
    if (!enabled) {
      previousRef.current = null
      return
    }

    let cancelled = false

    const bootstrap = async () => {
      try {
        const lots = await broker.getOpenLots()
        const symbols = [...new Set(lots.map((l) => l.symbol))]
        const quotes = symbols.length ? await broker.getQuotes(symbols) : {}
        const groups = await portfolio.getOpenPositionGroupsFrom(lots, quotes)
        if (!cancelled) {
          previousRef.current = groups
          primeAlertBaseline(groups)
        }
      } catch {
        // retry on next tick
      }
    }

    void bootstrap()
    void tick()

    const id = window.setInterval(() => void tick(), MARKET_PRICE_REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [enabled, broker, portfolio, tick])
}
