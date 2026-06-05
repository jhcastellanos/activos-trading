import { DEFAULT_DAILY_GOAL_PCT } from '../business/constants'
import {
  calculateAverageDailyGainPercentage,
  calculateCalendarDaysSince,
  calculateGainAmount,
  calculateGainPercentage,
  calculateProgressToGoal,
  calculateProjectedBalance,
  calculateTradingDaysSince,
  determineGoalCycleStatus,
  goalCycleMessage,
  shouldCreateNewSnapshot,
} from '../business/goalCalculations'
import type { AccountGoalEvaluation } from '../domain/types'
import type { BrokerService } from './interfaces/BrokerService'
import type { GoalSnapshotRepository } from './interfaces/GoalSnapshotRepository'
import type { MarketCalendarService } from './interfaces/MarketCalendarService'
import { toEastern } from './market/easternTime'

export class DailyGoalService {
  constructor(
    private readonly broker: BrokerService,
    private readonly snapshots: GoalSnapshotRepository,
    private readonly calendar: MarketCalendarService,
  ) {}

  async evaluateCurrentGoal(now: Date = new Date()): Promise<AccountGoalEvaluation> {
    const eastern = toEastern(now)
    const isTradingDay = this.calendar.isTradingDay(eastern.date)

    const [currentBalance, openLots] = await Promise.all([
      this.broker.getCurrentAccountValue(),
      this.broker.getOpenPositions(),
    ])
    const hasOpenPositions = openLots.length > 0

    let latest = await this.snapshots.getLatestSnapshot()
    let snapshotCreated = false

    const shouldCreate = shouldCreateNewSnapshot({
      currentTradingDate: eastern.date,
      snapshotTradingDate: latest?.tradingDate ?? null,
      isTradingDay,
      hasOpenPositions,
      currentBalance,
      baseBalance: latest?.baseBalance ?? currentBalance,
    })

    if (shouldCreate) {
      const projected = calculateProjectedBalance(currentBalance, DEFAULT_DAILY_GOAL_PCT)
      const initialStatus = hasOpenPositions ? 'awaiting_position_close' : 'new_day_cycle'

      latest = await this.snapshots.createSnapshot({
        baseBalance: currentBalance,
        projectedBalance: projected,
        goalPct: DEFAULT_DAILY_GOAL_PCT,
        tradingDate: eastern.date,
        createdAt: now.toISOString(),
        createdTimeEt: eastern.time,
        cycleStatus: initialStatus,
        hadOpenPositionsAtCreation: hasOpenPositions,
      })
      snapshotCreated = true
    }

    const baseBalance = latest?.baseBalance ?? currentBalance
    const projectedBalance =
      latest?.projectedBalance ?? calculateProjectedBalance(baseBalance, DEFAULT_DAILY_GOAL_PCT)
    const goalPct = latest?.goalPct ?? DEFAULT_DAILY_GOAL_PCT
    const goalAmount = projectedBalance - baseBalance

    const gainAmount = calculateGainAmount(currentBalance, baseBalance)
    const gainPercentage = calculateGainPercentage(currentBalance, baseBalance)
    const progressToGoalPct = calculateProgressToGoal(currentBalance, baseBalance, projectedBalance)

    const baseTradingDate = latest?.tradingDate ?? eastern.date
    const calendarDaysSinceBase = calculateCalendarDaysSince(baseTradingDate, eastern.date)
    const tradingDaysSinceBase = calculateTradingDaysSince(
      baseTradingDate,
      eastern.date,
      (start, end) => this.calendar.getTradingDaysBetween(start, end),
    )
    const averageDailyGainPct = calculateAverageDailyGainPercentage(
      gainPercentage,
      tradingDaysSinceBase,
    )

    const sameTradingDateAsSnapshot = latest?.tradingDate === eastern.date
    const goalReached = gainPercentage >= goalPct && !hasOpenPositions

    const cycleStatus = determineGoalCycleStatus({
      isTradingDay,
      hasOpenPositions,
      snapshotCreated,
      sameTradingDateAsSnapshot,
      gainPercentage,
      goalPct,
    })

    if (latest && latest.cycleStatus !== cycleStatus) {
      await this.snapshots.updateSnapshotStatus(latest.id, cycleStatus)
    }

    return {
      baseBalance,
      baseSnapshotAt: latest?.createdAt ?? null,
      baseSnapshotTimeEt: latest?.createdTimeEt ?? null,
      baseTradingDate: latest?.tradingDate ?? null,
      currentBalance,
      projectedBalance,
      goalPct,
      goalAmount,
      gainAmount,
      gainPercentage,
      progressToGoalPct,
      calendarDaysSinceBase,
      tradingDaysSinceBase,
      averageDailyGainPct,
      cycleStatus,
      message: goalCycleMessage(cycleStatus),
      isTradingDay,
      hasOpenPositions,
      snapshotCreated,
      goalReached,
    }
  }
}
