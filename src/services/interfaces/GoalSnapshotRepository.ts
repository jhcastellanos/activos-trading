import type { GoalCycleStatus, GoalSnapshot } from '../../domain/types'

export interface CreateGoalSnapshotInput {
  baseBalance: number
  projectedBalance: number
  goalPct: number
  tradingDate: string
  createdAt: string
  createdTimeEt: string
  cycleStatus: GoalCycleStatus
  hadOpenPositionsAtCreation: boolean
}

export interface GoalSnapshotRepository {
  getLatestSnapshot(): Promise<GoalSnapshot | null>
  createSnapshot(input: CreateGoalSnapshotInput): Promise<GoalSnapshot>
  updateSnapshotStatus(id: string, status: GoalCycleStatus): Promise<void>
  getSnapshotHistory(): Promise<GoalSnapshot[]>
}
