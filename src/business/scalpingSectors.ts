import type { ScalpingSector } from '../domain/types'

export const SCALPING_SECTOR_LABELS: Record<ScalpingSector, string> = {
  ia: 'IA',
  semiconductores: 'Semiconductores',
  energia_nuclear: 'Energía nuclear',
  defensa: 'Defensa',
  data_centers: 'Data centers',
  robotica: 'Robótica',
  tierras_raras: 'Tierras raras',
  tecnologicas: 'Tecnológicas',
}

/** Sectores permitidos por tendencia de mercado. */
export const ALLOWED_SCALPING_SECTORS: ScalpingSector[] = [
  'ia',
  'semiconductores',
  'energia_nuclear',
  'defensa',
  'data_centers',
  'robotica',
  'tierras_raras',
  'tecnologicas',
]

export function isAllowedScalpingSector(sector: ScalpingSector): boolean {
  return ALLOWED_SCALPING_SECTORS.includes(sector)
}
