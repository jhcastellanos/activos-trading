export type AssetType = 'cripto' | 'accion' | 'forex' | 'otro'

export interface Asset {
  id: string
  symbol: string
  name: string
  type: AssetType
  quantity: number
  buyPrice: number
  currentPrice: number
}
