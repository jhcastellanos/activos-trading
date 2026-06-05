import type { ScalpingUniverseResult } from '../../business/scalpingAssetRank'
import type { ScalpingSector } from '../../domain/types'

export interface AssetScreenerService {
  getScalpingUniverse(sector?: ScalpingSector): Promise<ScalpingUniverseResult>
}
