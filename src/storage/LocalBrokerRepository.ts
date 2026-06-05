import type { ClosedTrade, DailySnapshot, TradeLot } from '../domain/types'
import {
  MOCK_CLOSED,
  MOCK_DAILY_BASE,
  MOCK_LOTS,
  MOCK_SNAPSHOTS,
} from '../services/mock/seedData'

const KEY = 'activos-trading:broker-data'

interface StoredData {
  lots: TradeLot[]
  closed: ClosedTrade[]
  snapshots: DailySnapshot[]
  dailyBase: number
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as StoredData
  } catch {
    // ignore
  }
  return {
    lots: [...MOCK_LOTS],
    closed: [...MOCK_CLOSED],
    snapshots: [...MOCK_SNAPSHOTS],
    dailyBase: MOCK_DAILY_BASE,
  }
}

function save(data: StoredData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const localBrokerRepo = {
  get(): StoredData {
    return load()
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
      snapshots: [...MOCK_SNAPSHOTS],
      dailyBase: MOCK_DAILY_BASE,
    })
  },
}
