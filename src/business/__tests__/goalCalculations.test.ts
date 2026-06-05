import { describe, expect, it } from 'vitest'
import {
  calculateAverageDailyGainPercentage,
  calculateCalendarDaysSince,
  calculateGainAmount,
  calculateGainPercentage,
  calculateProgressToGoal,
  calculateProjectedBalance,
  calculateTradingDaysSince,
  determineGoalCycleStatus,
  shouldCreateNewSnapshot,
} from '../goalCalculations'
import { USMarketCalendarService } from '../../services/market/USMarketCalendarService'

const calendar = new USMarketCalendarService()

describe('goalCalculations', () => {
  it('calcula balance proyectado al 1%', () => {
    expect(calculateProjectedBalance(10000, 1)).toBe(10100)
  })

  it('calcula ganancia y progreso', () => {
    expect(calculateGainAmount(10250, 10000)).toBe(250)
    expect(calculateGainPercentage(10250, 10000)).toBe(2.5)
    expect(calculateProgressToGoal(10250, 10000, 10100)).toBe(250)
  })

  it('no crea snapshot mismo día', () => {
    expect(
      shouldCreateNewSnapshot({
        currentTradingDate: '2026-06-04',
        snapshotTradingDate: '2026-06-04',
        isTradingDay: true,
        hasOpenPositions: false,
        currentBalance: 10500,
        baseBalance: 10000,
      }),
    ).toBe(false)
  })

  it('no crea snapshot con posiciones abiertas en otro día', () => {
    expect(
      shouldCreateNewSnapshot({
        currentTradingDate: '2026-06-05',
        snapshotTradingDate: '2026-06-04',
        isTradingDay: true,
        hasOpenPositions: true,
        currentBalance: 10500,
        baseBalance: 10000,
      }),
    ).toBe(false)
  })

  it('no crea snapshot en fin de semana', () => {
    expect(
      shouldCreateNewSnapshot({
        currentTradingDate: '2026-06-06',
        snapshotTradingDate: '2026-06-04',
        isTradingDay: false,
        hasOpenPositions: false,
        currentBalance: 10500,
        baseBalance: 10000,
      }),
    ).toBe(false)
  })

  it('crea snapshot en día operativo sin posiciones y balance distinto', () => {
    expect(
      shouldCreateNewSnapshot({
        currentTradingDate: '2026-06-05',
        snapshotTradingDate: '2026-06-04',
        isTradingDay: true,
        hasOpenPositions: false,
        currentBalance: 10500,
        baseBalance: 10000,
      }),
    ).toBe(true)
  })

  it('no crea snapshot si el balance no cambió', () => {
    expect(
      shouldCreateNewSnapshot({
        currentTradingDate: '2026-06-05',
        snapshotTradingDate: '2026-06-04',
        isTradingDay: true,
        hasOpenPositions: false,
        currentBalance: 10000,
        baseBalance: 10000,
      }),
    ).toBe(false)
  })

  it('calcula días calendario y operativos', () => {
    expect(calculateCalendarDaysSince('2026-06-02', '2026-06-03')).toBe(2)
    const trading = calculateTradingDaysSince('2026-06-02', '2026-06-03', (s, e) =>
      calendar.getTradingDaysBetween(s, e),
    )
    expect(trading).toBe(2)
    expect(calculateAverageDailyGainPercentage(2.5, 2)).toBe(1.25)
  })

  it('determina ciclo arrastrado por posiciones abiertas', () => {
    expect(
      determineGoalCycleStatus({
        isTradingDay: true,
        hasOpenPositions: true,
        snapshotCreated: false,
        sameTradingDateAsSnapshot: false,
        gainPercentage: 2.5,
        goalPct: 1,
      }),
    ).toBe('carried_open_positions')
  })

  it('determina día no operativo', () => {
    expect(
      determineGoalCycleStatus({
        isTradingDay: false,
        hasOpenPositions: false,
        snapshotCreated: false,
        sameTradingDateAsSnapshot: false,
        gainPercentage: 0.5,
        goalPct: 1,
      }),
    ).toBe('non_trading_day')
  })
})
