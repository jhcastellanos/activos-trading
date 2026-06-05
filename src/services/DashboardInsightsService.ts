import { buildAccountYearGrowth, type AccountYearGrowth } from '../business/accountYearGrowth'
import { buildTradeStreak, type TradeStreakResult } from '../business/tradeStreak'
import { buildWeeklyPerformance, type WeeklyPerformance } from '../business/weeklyPerformance'
import { STREAK_TILE_COUNT } from '../business/constants'
import type { AccountBaselineRepository } from './interfaces/AccountBaselineRepository'
import type { BrokerService } from './interfaces/BrokerService'
import { toEastern } from './market/easternTime'

export interface DashboardInsights {
  yearGrowth: AccountYearGrowth
  weekly: WeeklyPerformance
  streak: TradeStreakResult
  asOfEt: string
}

export class DashboardInsightsService {
  constructor(
    private readonly broker: BrokerService,
    private readonly baselines: AccountBaselineRepository,
  ) {}

  async getInsights(now: Date = new Date()): Promise<DashboardInsights> {
    const eastern = toEastern(now)
    const year = Number(eastern.date.slice(0, 4))
    const [trades, currentBalance, baseline] = await Promise.all([
      this.broker.getClosedTrades(),
      this.broker.getCurrentAccountValue(),
      this.baselines.getForYear(year),
    ])
    const soldOnDate = (iso: string) => toEastern(new Date(iso)).date

    const yearStartBalance = baseline?.balance ?? currentBalance
    const yearStartDate = baseline?.asOfDate ?? eastern.date

    return {
      yearGrowth: buildAccountYearGrowth(year, yearStartBalance, yearStartDate, currentBalance),
      weekly: buildWeeklyPerformance(trades, soldOnDate, eastern.date),
      streak: buildTradeStreak(trades, STREAK_TILE_COUNT),
      asOfEt: eastern.date,
    }
  }
}
