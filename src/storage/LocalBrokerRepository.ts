import type { ClosedTrade, DailySnapshot, GoalSnapshot, TradeLot } from '../domain/types'
import { DEFAULT_DAILY_GOAL_PCT } from '../business/constants'
import { calculateProjectedBalance } from '../business/goalCalculations'
import { MOCK_CLOSED, MOCK_GOAL_SNAPSHOT, MOCK_LOTS } from '../services/mock/seedData'

const KEY = 'activos-trading:broker-data'

interface StoredData {
  lots: TradeLot[]
  closed: ClosedTrade[]
  /** @deprecated migrado a goalSnapshots */
  snapshots?: DailySnapshot[]
  /** @deprecated migrado a goalSnapshots */
  dailyBase?: number
  goalSnapshots: GoalSnapshot[]
}

function migrateLegacy(data: Partial<StoredData>): GoalSnapshot[] {
  if (data.goalSnapshots?.length) return data.goalSnapshots

  if (data.dailyBase != null) {
    const base = data.dailyBase
    const legacyDate = data.snapshots?.[0]?.date ?? MOCK_GOAL_SNAPSHOT.tradingDate
    return [
      {
        id: 'migrated-base',
        baseBalance: base,
        projectedBalance: calculateProjectedBalance(base, DEFAULT_DAILY_GOAL_PCT),
        goalPct: DEFAULT_DAILY_GOAL_PCT,
        tradingDate: legacyDate,
        createdAt: `${legacyDate}T13:00:00.000Z`,
        createdTimeEt: '09:00:00',
        cycleStatus: 'carried_open_positions',
        hadOpenPositionsAtCreation: true,
      },
    ]
  }

  return [{ ...MOCK_GOAL_SNAPSHOT }]
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredData>
      const goalSnapshots = migrateLegacy(parsed)
      return {
        lots: parsed.lots ?? [...MOCK_LOTS],
        closed: parsed.closed ?? [...MOCK_CLOSED],
        goalSnapshots,
      }
    }
  } catch {
    // ignore
  }
  return {
    lots: [...MOCK_LOTS],
    closed: [...MOCK_CLOSED],
    goalSnapshots: [{ ...MOCK_GOAL_SNAPSHOT }],
  }
}

function save(data: StoredData): void {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      lots: data.lots,
      closed: data.closed,
      goalSnapshots: data.goalSnapshots,
    }),
  )
}

export const localBrokerRepo = {
  get(): StoredData {
    return load()
  },
  getGoalSnapshots(): GoalSnapshot[] {
    return load().goalSnapshots
  },
  addGoalSnapshot(snapshot: GoalSnapshot): void {
    const d = load()
    d.goalSnapshots = [snapshot, ...d.goalSnapshots]
    save(d)
  },
  updateGoalSnapshotStatus(id: string, status: GoalSnapshot['cycleStatus']): void {
    const d = load()
    d.goalSnapshots = d.goalSnapshots.map((s) =>
      s.id === id ? { ...s, cycleStatus: status } : s,
    )
    save(d)
  },
  setLots(lots: TradeLot[]): void {
    const d = load()
    d.lots = lots
    save(d)
  },
  setClosed(closed: ClosedTrade[]): void {
    const d = load()
    d.closed = closed
    save(d)
  },
  resetToSeed(): void {
    save({
      lots: [...MOCK_LOTS],
      closed: [...MOCK_CLOSED],
      goalSnapshots: [{ ...MOCK_GOAL_SNAPSHOT }],
    })
  },
}
