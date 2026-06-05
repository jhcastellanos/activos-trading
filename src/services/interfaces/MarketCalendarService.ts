export interface MarketCalendarService {
  /** ¿El mercado de EE.UU. opera este día (ET)? */
  isTradingDay(date: string): boolean

  /** Días de operativa entre dos fechas YYYY-MM-DD (inclusive). */
  getTradingDaysBetween(startDate: string, endDate: string): number

  /** Siguiente día de operativa estrictamente después de `date`. */
  getNextTradingDay(date: string): string
}
