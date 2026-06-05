import { describe, expect, it } from 'vitest'
import type { GoalSnapshot, TradeLot } from '../../domain/types'
import type { BrokerService } from '../interfaces/BrokerService'
import type {
  CreateGoalSnapshotInput,
  GoalSnapshotRepository,
} from '../interfaces/GoalSnapshotRepository'
import { DailyGoalService } from '../DailyGoalService'
import { USMarketCalendarService } from '../market/USMarketCalendarService'

class MemorySnapshotRepo implements GoalSnapshotRepository {
  snapshots: GoalSnapshot[] = []

  async getLatestSnapshot() {
    return this.snapshots[0] ?? null
  }

  async createSnapshot(input: CreateGoalSnapshotInput) {
    const s: GoalSnapshot = { id: `snap-${this.snapshots.length}`, ...input }
    this.snapshots.unshift(s)
    return s
  }

  async updateSnapshotStatus(id: string, status: GoalSnapshot['cycleStatus']) {
    this.snapshots = this.snapshots.map((s) => (s.id === id ? { ...s, cycleStatus: status } : s))
  }

  async getSnapshotHistory() {
    return [...this.snapshots]
  }
}

function mockBroker(params: {
  balance: number
  lots?: TradeLot[]
}): BrokerService {
  return {
    mode: 'demo',
    getAccountSummary: async () => ({
      totalValue: params.balance,
      dayChangeUsd: 0,
      dayChangePct: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
      openPositionsCount: params.lots?.length ?? 0,
      asOf: new Date().toISOString(),
    }),
    getCurrentAccountValue: async () => params.balance,
    getAccountBalance: async () => params.balance,
    getOpenLots: async () => params.lots ?? [],
    getOpenPositions: async () => params.lots ?? [],
    getClosedTrades: async () => [],
    getQuotes: async () => ({}),
  }
}

const openLot: TradeLot = {
  id: 'l1',
  symbol: 'AAPL',
  boughtAt: '2026-06-02T10:00:00Z',
  quantity: 1,
  remainingQty: 1,
  avgBuyPrice: 100,
  status: 'open',
}

describe('DailyGoalService', () => {
  const calendar = new USMarketCalendarService()

  it('mantiene base con posiciones abiertas en día distinto', async () => {
    const repo = new MemorySnapshotRepo()
    repo.snapshots = [
      {
        id: 'base',
        baseBalance: 10000,
        projectedBalance: 10100,
        goalPct: 1,
        tradingDate: '2026-06-02',
        createdAt: '2026-06-02T13:00:00Z',
        createdTimeEt: '09:00:00',
        cycleStatus: 'active_cycle',
        hadOpenPositionsAtCreation: false,
      },
    ]

    const service = new DailyGoalService(
      mockBroker({ balance: 10250, lots: [openLot] }),
      repo,
      calendar,
    )

    const result = await service.evaluateCurrentGoal(new Date('2026-06-04T15:00:00Z'))

    expect(result.baseBalance).toBe(10000)
    expect(result.gainAmount).toBe(250)
    expect(result.gainPercentage).toBe(2.5)
    expect(result.tradingDaysSinceBase).toBe(3)
    expect(result.averageDailyGainPct).toBeCloseTo(0.83, 1)
    expect(result.cycleStatus).toBe('carried_open_positions')
    expect(repo.snapshots).toHaveLength(1)
  })

  it('no crea snapshot en sábado', async () => {
    const repo = new MemorySnapshotRepo()
    repo.snapshots = [
      {
        id: 'base',
        baseBalance: 10000,
        projectedBalance: 10100,
        goalPct: 1,
        tradingDate: '2026-06-05',
        createdAt: '2026-06-05T13:00:00Z',
        createdTimeEt: '09:00:00',
        cycleStatus: 'active_cycle',
        hadOpenPositionsAtCreation: false,
      },
    ]

    const service = new DailyGoalService(mockBroker({ balance: 10150 }), repo, calendar)
    const result = await service.evaluateCurrentGoal(new Date('2026-06-06T15:00:00Z'))

    expect(result.isTradingDay).toBe(false)
    expect(result.cycleStatus).toBe('non_trading_day')
    expect(repo.snapshots).toHaveLength(1)
  })

  it('crea nuevo snapshot sin posiciones en día operativo', async () => {
    const repo = new MemorySnapshotRepo()
    repo.snapshots = [
      {
        id: 'base',
        baseBalance: 10000,
        projectedBalance: 10100,
        goalPct: 1,
        tradingDate: '2026-06-04',
        createdAt: '2026-06-04T13:00:00Z',
        createdTimeEt: '09:00:00',
        cycleStatus: 'active_cycle',
        hadOpenPositionsAtCreation: false,
      },
    ]

    const service = new DailyGoalService(mockBroker({ balance: 10500 }), repo, calendar)
    await service.evaluateCurrentGoal(new Date('2026-06-05T14:00:00Z'))

    expect(repo.snapshots).toHaveLength(2)
    expect(repo.snapshots[0].baseBalance).toBe(10500)
  })
})
