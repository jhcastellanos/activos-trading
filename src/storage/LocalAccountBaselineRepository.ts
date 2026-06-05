import type { AccountYearBaseline } from '../domain/types'
import { resolveYearBaselineFromSnapshots } from '../business/accountYearGrowth'
import type { AccountBaselineRepository } from '../services/interfaces/AccountBaselineRepository'
import { localBrokerRepo } from './LocalBrokerRepository'

export class LocalAccountBaselineRepository implements AccountBaselineRepository {
  async getForYear(year: number): Promise<AccountYearBaseline | null> {
    return resolveYearBaselineFromSnapshots(localBrokerRepo.getGoalSnapshots(), year)
  }
}
