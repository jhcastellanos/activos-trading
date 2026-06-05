import { dedupeScalpingCatalog } from '../../business/dedupeScalpingCatalog'
import { SCALPING_CATALOG_RAW } from './scalpingAssetCatalog'

export const MOCK_SCALPING_UNIVERSE = dedupeScalpingCatalog(SCALPING_CATALOG_RAW)
