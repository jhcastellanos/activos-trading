import type { GoalCycleStatus, GoalSnapshot } from '../domain/types'
import type {
  CreateGoalSnapshotInput,
  GoalSnapshotRepository,
} from '../services/interfaces/GoalSnapshotRepository'
import { localBrokerRepo } from './LocalBrokerRepository'

export class LocalGoalSnapshotRepository implements GoalSnapshotRepository {
  async getLatestSnapshot(): Promise<GoalSnapshot | null> {
    const snapshots = localBrokerRepo.getGoalSnapshots()
    if (snapshots.length === 0) return null
    return [...snapshots].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  }

  async createSnapshot(input: CreateGoalSnapshotInput): Promise<GoalSnapshot> {
    const snapshot: GoalSnapshot = {
      id: crypto.randomUUID(),
      ...input,
    }
    localBrokerRepo.addGoalSnapshot(snapshot)
    return snapshot
  }

  async updateSnapshotStatus(id: string, status: GoalCycleStatus): Promise<void> {
    localBrokerRepo.updateGoalSnapshotStatus(id, status)
  }

  async getSnapshotHistory(): Promise<GoalSnapshot[]> {
    return [...localBrokerRepo.getGoalSnapshots()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
  }
}
