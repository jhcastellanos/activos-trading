import { useCallback, useEffect, useRef, useState } from 'react'
import type { SymbolPositionGroup } from '../domain/types'
import type { BrokerService } from '../services/interfaces/BrokerService'
import { PortfolioService } from '../services/PortfolioService'

/** Intervalo de refresco de precio de mercado (Schwab tiene límites de rate; 5s es un balance razonable). */
export const MARKET_PRICE_REFRESH_MS = 5_000

export function useLiveOpenPositions(broker: BrokerService) {
  const portfolio = useRef(new PortfolioService(broker)).current
  const [groups, setGroups] = useState<SymbolPositionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const reload = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true)
      else setRefreshing(true)
      try {
        const [lots, closed] = await Promise.all([
          broker.getOpenLots(),
          broker.getClosedTrades(),
        ])
        const symbols = [...new Set(lots.map((l) => l.symbol))]
        const quotes = symbols.length ? await broker.getQuotes(symbols) : {}
        const next = portfolio.getOpenPositionGroupsFrom(lots, quotes, closed)
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
      if (document.visibilityState === 'visible') {
        reload({ silent: true })
      }
    }
    const id = window.setInterval(tick, MARKET_PRICE_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [reload])

  return { groups, loading, priceUpdatedAt, refreshing, reload }
}
