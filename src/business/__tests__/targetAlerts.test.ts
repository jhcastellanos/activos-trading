import { describe, expect, it } from 'vitest'
import {
  analyzeTargetAlerts,
  buildAllContractsMessage,
  buildSingleLotMessage,
  lotIdsNoLongerAtTarget,
} from '../targetAlerts'
import type { SymbolPositionGroup } from '../../domain/types'

type LotSpec = {
  id: string
  targetState: 'far' | 'near' | 'reached'
  boughtAt: string
  sellPriority?: number
  sellFirst?: boolean
}

function group(symbol: string, lots: LotSpec[]): SymbolPositionGroup {
  return {
    symbol,
    currentPrice: 100,
    totalRemainingQty: lots.length * 10,
    totalInvestedUsd: 1000,
    aggregate: {
      totalCostUsd: 1000,
      totalContracts: lots.length * 10,
      avgBuyPriceRaw: 100,
      avgBuyPrice: 100.01,
      targetSellPrice: 101.51,
      estimatedProfitUsd: 15,
      currentProfitPct: 0,
      targetState: 'far',
      lotsAtTarget: lots.filter((l) => l.targetState === 'reached').length,
      lotsPending: lots.filter((l) => l.targetState !== 'reached').length,
    },
    lots: lots.map((l, i) => ({
      id: l.id,
      symbol,
      boughtAt: l.boughtAt,
      quantity: 10,
      remainingQty: 10,
      avgBuyPrice: 100,
      status: 'open' as const,
      investedUsd: 1000,
      targetSellPrice: 101.51,
      targetProfitPct: 1.5,
      estimatedProfitUsd: 15,
      currentPrice: 102,
      distanceToTargetUsd: 0,
      distanceToTargetPct: 0,
      targetState: l.targetState,
      adjustedBuyPrice: 100.01,
      currentProfitPct: 2,
      sellPriority: l.sellPriority ?? i + 1,
      sellFirst: l.sellFirst ?? false,
    })),
  }
}

describe('targetAlerts', () => {
  it('mensaje última compra (LIFO #1 por fecha)', () => {
    const msg = buildSingleLotMessage('AAPL', {
      sellPriority: 1,
      sellFirst: true,
      boughtAt: '2026-06-04T10:00:00Z',
    })
    expect(msg.body).toContain('Última compra')
    expect(msg.body).toContain('vender primero')
    expect(msg.body).toContain('LIFO')
  })

  it('mensaje compra anterior con fecha', () => {
    const msg = buildSingleLotMessage('AAPL', {
      sellPriority: 2,
      sellFirst: false,
      boughtAt: '2026-06-01T10:00:00Z',
    })
    expect(msg.body).toContain('Compra del')
    expect(msg.body).toContain('LIFO #2')
  })

  it('ordena avisos por fecha de compra: la más reciente primero', () => {
    const prev = [
      group('TQQQ', [
        { id: 'old', targetState: 'near', boughtAt: '2026-06-01T10:00:00Z' },
        { id: 'new', targetState: 'near', boughtAt: '2026-06-04T10:00:00Z' },
      ]),
    ]
    const next = [
      group('TQQQ', [
        { id: 'old', targetState: 'reached', boughtAt: '2026-06-01T10:00:00Z' },
        { id: 'new', targetState: 'reached', boughtAt: '2026-06-04T10:00:00Z' },
      ]),
    ]
    const alerts = analyzeTargetAlerts(prev, next, new Set()).filter((a) => a.kind === 'single_lot')
    expect(alerts[0].lotId).toBe('new')
    expect(alerts[0].sellFirst).toBe(true)
    expect(alerts[1].lotId).toBe('old')
  })

  it('cruce parcial: solo el lote que cruzó, priorizando última compra', () => {
    const prev = [
      group('TQQQ', [
        { id: 'new', targetState: 'near', boughtAt: '2026-06-04T10:00:00Z' },
        { id: 'old', targetState: 'far', boughtAt: '2026-06-01T10:00:00Z' },
      ]),
    ]
    const next = [
      group('TQQQ', [
        { id: 'new', targetState: 'reached', boughtAt: '2026-06-04T10:00:00Z' },
        { id: 'old', targetState: 'far', boughtAt: '2026-06-01T10:00:00Z' },
      ]),
    ]
    const alerts = analyzeTargetAlerts(prev, next, new Set())
    expect(alerts).toHaveLength(1)
    expect(alerts[0].lotId).toBe('new')
    expect(alerts[0].body).toContain('Última compra')
  })

  it('no repite alerta si el lote está en cooldown', () => {
    const prev = [group('AAPL', [{ id: 'a1', targetState: 'near', boughtAt: '2026-06-04T10:00:00Z' }])]
    const next = [group('AAPL', [{ id: 'a1', targetState: 'reached', boughtAt: '2026-06-04T10:00:00Z' }])]
    const alerts = analyzeTargetAlerts(prev, next, new Set(['a1']))
    expect(alerts).toHaveLength(0)
  })

  it('no repite resumen de activo si summary está en cooldown', () => {
    const prev = [
      group('TQQQ', [
        { id: 't1', targetState: 'near', boughtAt: '2026-06-04T10:00:00Z' },
        { id: 't2', targetState: 'reached', boughtAt: '2026-06-01T10:00:00Z' },
      ]),
    ]
    const next = [
      group('TQQQ', [
        { id: 't1', targetState: 'reached', boughtAt: '2026-06-04T10:00:00Z' },
        { id: 't2', targetState: 'reached', boughtAt: '2026-06-01T10:00:00Z' },
      ]),
    ]
    const alerts = analyzeTargetAlerts(prev, next, new Set(['summary-TQQQ']))
    expect(alerts.every((a) => a.kind !== 'all_contracts')).toBe(true)
  })

  it('resumen cuando todos los lotes quedan en objetivo', () => {
    const msg = buildAllContractsMessage('TQQQ', 3)
    expect(msg.body).toContain('orden LIFO por fecha de compra')
  })
})
