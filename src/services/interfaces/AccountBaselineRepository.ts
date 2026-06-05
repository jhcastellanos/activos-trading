import type { AccountYearBaseline } from '../../domain/types'

export interface AccountBaselineRepository {
  getForYear(year: number): Promise<AccountYearBaseline | null>
}
