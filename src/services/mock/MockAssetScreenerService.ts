import { SCALPING_SECTOR_TOP_COUNT, SCALPING_TOP_COUNT } from '../../business/constants'
import { rankScalpingUniverse } from '../../business/scalpingAssetRank'
import type { ScalpingSector } from '../../domain/types'
import type { AssetScreenerService } from '../interfaces/AssetScreenerService'
import { MOCK_SCALPING_UNIVERSE } from './scalpingAssetSeed'

export class MockAssetScreenerService implements AssetScreenerService {
  async getScalpingUniverse(sector?: ScalpingSector) {
    const limit = sector ? SCALPING_SECTOR_TOP_COUNT : SCALPING_TOP_COUNT
    return rankScalpingUniverse(MOCK_SCALPING_UNIVERSE, limit, sector)
  }
}
