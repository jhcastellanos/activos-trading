import type { ScalpingCatalogEntry } from '../../business/dedupeScalpingCatalog'

/**
 * Catálogo maestro: activo principal → ETF bull (listas del usuario + complementos sectoriales).
 * dedupeScalpingCatalog elimina repetidos que compartan el mismo x2/x3.
 */
export const SCALPING_CATALOG_RAW: ScalpingCatalogEntry[] = [
  // —— Lista 1 ——
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'ia', tradeBull: 'NVDU', tradeLeverage: 2, tradeBullIssuer: 'direxion', tradeInverse: 'NVDD', price: 118.2, nav: 119.0, avgDailyRangePct: 4.2, turnoverPct: 28 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'semiconductores', tradeBull: 'AMUU', tradeLeverage: 2, tradeBullIssuer: 'direxion', price: 118.5, nav: 119.2, avgDailyRangePct: 3.8, turnoverPct: 24 },
  { symbol: 'SOXX', name: 'Semiconductor Basket', sector: 'semiconductores', tradeBull: 'SOXL', tradeLeverage: 3, tradeBullIssuer: 'direxion', tradeInverse: 'SOXS', price: 248.5, nav: 249.1, avgDailyRangePct: 2.8, turnoverPct: 12 },
  { symbol: 'AI5', name: 'Top 5 AI Chips Basket', sector: 'ia', tradeBull: 'TSXU', tradeLeverage: 2, tradeBullIssuer: 'direxion', tradeInverse: 'TSXD', price: 42.6, nav: 43.4, avgDailyRangePct: 4.5, turnoverPct: 26 },
  { symbol: 'BULZ', name: 'Big Tech / AI Basket', sector: 'ia', tradeBull: 'BULZ', tradeLeverage: 3, tradeBullIssuer: 'other', tradeInverse: 'BERZ', price: 88.4, nav: 90.1, avgDailyRangePct: 3.6, turnoverPct: 22 },
  { symbol: 'FNGU', name: 'FANG+ Big Tech', sector: 'ia', tradeBull: 'FNGU', tradeLeverage: 3, tradeBullIssuer: 'other', tradeInverse: 'FNGD', price: 312.0, nav: 318.5, avgDailyRangePct: 3.4, turnoverPct: 20 },
  { symbol: 'OKLO', name: 'Oklo', sector: 'energia_nuclear', tradeBull: 'OKLL', tradeLeverage: 2, tradeBullIssuer: 'graniteshares', price: 28.4, nav: 29.2, avgDailyRangePct: 5.1, turnoverPct: 32 },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'ia', tradeBull: 'PLTU', tradeLeverage: 2, tradeBullIssuer: 'graniteshares', tradeInverse: 'PLTD', price: 78.2, nav: 80.5, avgDailyRangePct: 4.0, turnoverPct: 25 },
  { symbol: 'TSLA', name: 'Tesla', sector: 'robotica', tradeBull: 'TSLL', tradeLeverage: 2, tradeBullIssuer: 'graniteshares', tradeInverse: 'TSLS', price: 268.0, nav: 272.5, avgDailyRangePct: 3.7, turnoverPct: 23 },

  // —— Lista 2 ——
  { symbol: 'QQQ', name: 'Nasdaq 100', sector: 'tecnologicas', tradeBull: 'TQQQ', tradeLeverage: 3, tradeBullIssuer: 'direxion', tradeInverse: 'SQQQ', price: 528.6, nav: 529.2, avgDailyRangePct: 1.8, turnoverPct: 11 },
  { symbol: 'SPY', name: 'S&P 500', sector: 'tecnologicas', tradeBull: 'SPXL', tradeLeverage: 3, tradeBullIssuer: 'direxion', tradeInverse: 'SPXS', price: 598.2, nav: 598.4, avgDailyRangePct: 0.9, turnoverPct: 6 },
  { symbol: 'IWM', name: 'Russell 2000', sector: 'tecnologicas', tradeBull: 'TNA', tradeLeverage: 3, tradeBullIssuer: 'direxion', tradeInverse: 'TZA', price: 205.3, nav: 205.8, avgDailyRangePct: 2.5, turnoverPct: 14 },
  { symbol: 'SMH', name: 'Semiconductor Sector', sector: 'semiconductores', tradeBull: 'USD', tradeLeverage: 2, tradeBullIssuer: 'direxion', tradeInverse: 'SSG', price: 285.1, nav: 284.6, avgDailyRangePct: 2.6, turnoverPct: 13 },
  { symbol: 'DUSL', name: 'Industrials / AI Infrastructure', sector: 'data_centers', tradeBull: 'DUSL', tradeLeverage: 3, tradeBullIssuer: 'direxion', tradeInverse: 'DUST', price: 68.2, nav: 69.0, avgDailyRangePct: 2.4, turnoverPct: 15 },
  { symbol: 'UBOT', name: 'Robotics Basket', sector: 'robotica', tradeBull: 'UBOT', tradeLeverage: 2, tradeBullIssuer: 'other', price: 28.4, nav: 29.1, avgDailyRangePct: 3.0, turnoverPct: 17 },
  { symbol: 'URNM', name: 'Uranium Miners Basket', sector: 'energia_nuclear', tradeBull: 'URAX', tradeLeverage: 2, tradeBullIssuer: 'defiance', price: 48.6, nav: 49.8, avgDailyRangePct: 4.1, turnoverPct: 22 },
  { symbol: 'CLDL', name: 'Cloud Computing Basket', sector: 'data_centers', tradeBull: 'CLDL', tradeLeverage: 2, tradeBullIssuer: 'other', tradeInverse: 'CLDS', price: 38.4, nav: 39.2, avgDailyRangePct: 2.5, turnoverPct: 16 },
  // AMDL omitido — mismo subyacente que AMUU (prioridad Direxion)

  // —— Lista 3 ——
  { symbol: 'COIN', name: 'Coinbase', sector: 'ia', tradeBull: 'CONL', tradeLeverage: 2, tradeBullIssuer: 'graniteshares', tradeInverse: 'CONS', price: 248.0, nav: 255.0, avgDailyRangePct: 4.8, turnoverPct: 28 },
  { symbol: 'GDX', name: 'Gold Miners Basket', sector: 'tierras_raras', tradeBull: 'JNUG', tradeLeverage: 2, tradeBullIssuer: 'direxion', tradeInverse: 'JDST', price: 36.2, nav: 36.8, avgDailyRangePct: 2.9, turnoverPct: 15 },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'tecnologicas', tradeBull: 'GGLL', tradeLeverage: 2, tradeBullIssuer: 'graniteshares', tradeInverse: 'GGLS', price: 178.4, nav: 181.2, avgDailyRangePct: 2.2, turnoverPct: 14 },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'semiconductores', tradeBull: 'AVL', tradeLeverage: 2, tradeBullIssuer: 'graniteshares', price: 168.5, nav: 171.0, avgDailyRangePct: 3.1, turnoverPct: 18 },
  { symbol: 'QCOM', name: 'Qualcomm', sector: 'semiconductores', tradeBull: 'QCMU', tradeLeverage: 2, tradeBullIssuer: 'other', tradeInverse: 'QCMD', price: 158.2, nav: 160.5, avgDailyRangePct: 2.7, turnoverPct: 16 },
  { symbol: 'ORCL', name: 'Oracle', sector: 'tecnologicas', tradeBull: 'ORCU', tradeLeverage: 2, tradeBullIssuer: 'graniteshares', price: 142.8, nav: 145.2, avgDailyRangePct: 2.4, turnoverPct: 13 },
  { symbol: 'XLE', name: 'Oil & Energy Sector', sector: 'energia_nuclear', tradeBull: 'ERX', tradeLeverage: 2, tradeBullIssuer: 'direxion', tradeInverse: 'ERY', price: 88.2, nav: 88.5, avgDailyRangePct: 2.1, turnoverPct: 9 },
  { symbol: 'USO', name: 'Crude Oil', sector: 'energia_nuclear', tradeBull: 'UCO', tradeLeverage: 2, tradeBullIssuer: 'other', tradeInverse: 'SCO', price: 72.4, nav: 73.8, avgDailyRangePct: 3.3, turnoverPct: 19 },
  { symbol: 'NOW', name: 'ServiceNow', sector: 'data_centers', tradeBull: 'NOWL', tradeLeverage: 2, tradeBullIssuer: 'graniteshares', tradeInverse: 'NOWS', price: 892.0, nav: 905.5, avgDailyRangePct: 2.1, turnoverPct: 12 },

  // —— Complementos sectoriales (bulls únicos, sin repetir lista) ——
  { symbol: 'XLK', name: 'Tecnología SPDR', sector: 'tecnologicas', tradeBull: 'QLD', tradeLeverage: 2, tradeBullIssuer: 'direxion', price: 228.4, nav: 229.0, avgDailyRangePct: 1.7, turnoverPct: 10 },
  { symbol: 'ITA', name: 'Aeroespacial y defensa', sector: 'defensa', tradeBull: 'DFEN', tradeLeverage: 3, tradeBullIssuer: 'direxion', price: 158.4, nav: 158.9, avgDailyRangePct: 1.6, turnoverPct: 8 },
  { symbol: 'BOTZ', name: 'Robótica y automatización', sector: 'robotica', tradeBull: 'TECL', tradeLeverage: 3, tradeBullIssuer: 'direxion', price: 34.2, nav: 35.0, avgDailyRangePct: 2.9, turnoverPct: 16 },
  { symbol: 'REMX', name: 'Tierras raras', sector: 'tierras_raras', tradeBull: 'GDXU', tradeLeverage: 2, tradeBullIssuer: 'other', price: 58.2, nav: 59.0, avgDailyRangePct: 3.1, turnoverPct: 17 },
  { symbol: 'LIT', name: 'Litio y baterías', sector: 'tierras_raras', tradeBull: 'NUGT', tradeLeverage: 3, tradeBullIssuer: 'direxion', price: 48.4, nav: 49.2, avgDailyRangePct: 3.5, turnoverPct: 20 },
  { symbol: 'AIQ', name: 'Inteligencia artificial', sector: 'ia', tradeBull: 'TARK', tradeLeverage: 2, tradeBullIssuer: 'other', price: 42.8, nav: 43.5, avgDailyRangePct: 3.4, turnoverPct: 18 },
  { symbol: 'CHAT', name: 'IA generativa', sector: 'ia', tradeBull: 'LABU', tradeLeverage: 3, tradeBullIssuer: 'direxion', price: 38.2, nav: 39.1, avgDailyRangePct: 3.8, turnoverPct: 21 },
  { symbol: 'SRVR', name: 'Infraestructura de datos', sector: 'data_centers', tradeBull: 'SSO', tradeLeverage: 2, tradeBullIssuer: 'direxion', price: 68.4, nav: 69.2, avgDailyRangePct: 2.2, turnoverPct: 13 },
  { symbol: 'PSI', name: 'Semiconductores Invesco', sector: 'semiconductores', tradeBull: 'SSO', tradeLeverage: 2, tradeBullIssuer: 'direxion', price: 68.2, nav: 68.9, avgDailyRangePct: 2.4, turnoverPct: 10 },
  { symbol: 'XSD', name: 'Semiconductores SPDR', sector: 'semiconductores', tradeBull: 'FAS', tradeLeverage: 3, tradeBullIssuer: 'direxion', price: 312.4, nav: 311.8, avgDailyRangePct: 2.5, turnoverPct: 11 },
  { symbol: 'PPA', name: 'Defensa Invesco', sector: 'defensa', tradeBull: 'UYG', tradeLeverage: 2, tradeBullIssuer: 'direxion', price: 112.3, nav: 112.8, avgDailyRangePct: 1.5, turnoverPct: 7 },
  { symbol: 'ARKX', name: 'Exploración espacial', sector: 'defensa', tradeBull: 'DIG', tradeLeverage: 2, tradeBullIssuer: 'direxion', price: 24.8, nav: 25.6, avgDailyRangePct: 2.4, turnoverPct: 14 },
  { symbol: 'ROBO', name: 'Robótica global', sector: 'robotica', tradeBull: 'UWM', tradeLeverage: 2, tradeBullIssuer: 'direxion', price: 58.6, nav: 59.4, avgDailyRangePct: 2.7, turnoverPct: 14 },
  { symbol: 'SKYY', name: 'Computación en la nube', sector: 'tecnologicas', tradeBull: 'DDM', tradeLeverage: 2, tradeBullIssuer: 'direxion', price: 92.4, nav: 93.8, avgDailyRangePct: 2.3, turnoverPct: 15 },
  { symbol: 'VGT', name: 'Tecnología Vanguard', sector: 'tecnologicas', tradeBull: 'UDOW', tradeLeverage: 3, tradeBullIssuer: 'direxion', price: 612.8, nav: 613.5, avgDailyRangePct: 1.6, turnoverPct: 9 },
  { symbol: 'DTCR', name: 'Data centers Nuveen', sector: 'data_centers', tradeBull: 'BIB', tradeLeverage: 2, tradeBullIssuer: 'other', price: 24.8, nav: 25.4, avgDailyRangePct: 2.4, turnoverPct: 15 },
  { symbol: 'PICK', name: 'Metales básicos', sector: 'tierras_raras', tradeBull: 'BITX', tradeLeverage: 2, tradeBullIssuer: 'other', price: 52.6, nav: 53.2, avgDailyRangePct: 2.8, turnoverPct: 15 },
]
