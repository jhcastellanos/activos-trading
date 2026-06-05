import type { ClosedTrade } from '../domain/types'
import { isStreakLoss, isStreakWin, tradeResultTier, type TradeResultTier } from './tradeResultTier'
import { roundPct, roundUsd } from './goalCalculations'

export interface TradeResultTile {
  id: string
  symbol: string
  pnlUsd: number
  pnlPct: number
  tier: TradeResultTier
  soldAt: string
}

export interface StreakCounts {
  activeType: 'win' | 'loss' | null
  activeCount: number
  maxWinStreak: number
  maxLossStreak: number
}

export interface TradeStreakResult {
  tiles: TradeResultTile[]
  streaks: StreakCounts
  totalShown: number
}

function toTile(t: ClosedTrade): TradeResultTile {
  return {
    id: t.id,
    symbol: t.symbol,
    pnlUsd: roundUsd(t.pnlUsd),
    pnlPct: roundPct(t.pnlPct),
    tier: tradeResultTier(t.pnlPct),
    soldAt: t.soldAt,
  }
}

function computeStreaks(tradesNewestFirst: ClosedTrade[]): StreakCounts {
  if (tradesNewestFirst.length === 0) {
    return { activeType: null, activeCount: 0, maxWinStreak: 0, maxLossStreak: 0 }
  }

  let activeType: 'win' | 'loss' | null = null
  let activeCount = 0

  const newest = tradesNewestFirst[0]
  if (isStreakWin(newest.pnlPct)) {
    activeType = 'win'
    for (const t of tradesNewestFirst) {
      if (!isStreakWin(t.pnlPct)) break
      activeCount++
    }
  } else if (isStreakLoss(newest.pnlPct)) {
    activeType = 'loss'
    for (const t of tradesNewestFirst) {
      if (!isStreakLoss(t.pnlPct)) break
      activeCount++
    }
  }

  let maxWin = 0
  let maxLoss = 0
  let winRun = 0
  let lossRun = 0

  for (const t of [...tradesNewestFirst].reverse()) {
    if (isStreakWin(t.pnlPct)) {
      winRun++
      lossRun = 0
      maxWin = Math.max(maxWin, winRun)
    } else if (isStreakLoss(t.pnlPct)) {
      lossRun++
      winRun = 0
      maxLoss = Math.max(maxLoss, lossRun)
    } else {
      winRun = 0
      lossRun = 0
    }
  }

  return {
    activeType,
    activeCount,
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
  }
}

export function buildTradeStreak(
  trades: ClosedTrade[],
  maxTiles: number,
): TradeStreakResult {
  const sorted = [...trades].sort(
    (a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime(),
  )
  const shown = sorted.slice(0, maxTiles)
  return {
    tiles: shown.map(toTile),
    streaks: computeStreaks(sorted),
    totalShown: shown.length,
  }
}
