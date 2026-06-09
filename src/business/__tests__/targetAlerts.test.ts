import { describe, expect, it } from 'vitest'
import {
  analyzeTargetAlerts,
  buildAllContractsMessage,
  buildSingleLotMessage,
} from '../targetAlerts'
import type { SymbolPositionGroup } from '../../domain/types'

type LotSpec = {
  id: string
  targetState: 'far' | 'near' | 'reached'
  boughtAt: string
  remainingQty?: number
  sellPriority?: number
  sellFirst?: boolean
}

function group(symbol: string, lots: LotSpec[]): SymbolPositionGroup {
  return {
    symbol,
    currentPrice: 100,
    totalRemainingQty: lots.reduce((s, l) => s + (l.remainingQty ?? 10), 0),
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
      quantity: l.remainingQty ?? 10,
      remainingQty: l.remainingQty ?? 10,
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
  it('mensaje: cantidad de contratos antes que la fecha', () => {
    const msg = buildSingleLotMessage('AAPL', {
      sellPriority: 1,
      sellFirst: true,
      boughtAt: '2026-06-04T10:00:00Z',
      remainingQty: 10,
    })
    expect(msg.title).toMatch(/10 contratos ·/)
    expect(msg.body).toMatch(/10 contratos ·/)
    expect(msg.body.indexOf('10 contratos')).toBeLessThan(msg.body.indexOf('jun'))
    expect(msg.body).toContain('vender primero')
  })

  it('compra anterior: contratos antes que fecha en título y cuerpo', () => {
    const msg = buildSingleLotMessage('AAPL', {
      sellPriority: 2,
      sellFirst: false,
      boughtAt: '2026-06-02T10:00:00Z',
      remainingQty: 15,
    })
    expect(msg.title).toContain('15 contratos ·')
    expect(msg.title).not.toContain('compra del')
    expect(msg.body).toContain('15 contratos ·')
    expect(msg.body).toContain('LIFO #2')
  })

  it('notifica lote que ya está en objetivo (sin cruce previo)', () => {
    const groups = [
      group('AAPL', [
        {
          id: 'lot-aapl-1',
          targetState: 'reached',
          boughtAt: '2026-06-04T10:00:00Z',
          remainingQty: 10,
          sellPriority: 1,
          sellFirst: true,
        },
      ]),
    ]
    const alerts = analyzeTargetAlerts(groups, new Set())
    expect(alerts).toHaveLength(1)
    expect(alerts[0].lotId).toBe('lot-aapl-1')
    expect(alerts[0].body).toContain('10 contratos ·')
    expect(alerts[0].body).toContain('1,5%')
  })

  it('no notifica lote en cooldown', () => {
    const groups = [
      group('AAPL', [{ id: 'a1', targetState: 'reached', boughtAt: '2026-06-04T10:00:00Z' }]),
    ]
    const alerts = analyzeTargetAlerts(groups, new Set(['a1']))
    expect(alerts).toHaveLength(0)
  })

  it('ordena por LIFO y notifica varios lotes en objetivo', () => {
    const groups = [
      group('TQQQ', [
        {
          id: 'new',
          targetState: 'reached',
          boughtAt: '2026-06-04T10:00:00Z',
          sellPriority: 1,
          sellFirst: true,
        },
        { id: 'old', targetState: 'reached', boughtAt: '2026-06-01T10:00:00Z', sellPriority: 2 },
      ]),
    ]
    const alerts = analyzeTargetAlerts(groups, new Set())
    const lotAlerts = alerts.filter((a) => a.kind === 'single_lot')
    expect(lotAlerts).toHaveLength(2)
    expect(lotAlerts[0].lotId).toBe('new')
    expect(alerts.some((a) => a.kind === 'all_contracts')).toBe(true)
  })

  it('no repite resumen de activo si summary está en cooldown', () => {
    const groups = [
      group('TQQQ', [
        { id: 't1', targetState: 'reached', boughtAt: '2026-06-04T10:00:00Z' },
        { id: 't2', targetState: 'reached', boughtAt: '2026-06-01T10:00:00Z' },
      ]),
    ]
    const alerts = analyzeTargetAlerts(groups, new Set(['summary-TQQQ', 't1', 't2']))
    expect(alerts).toHaveLength(0)
  })

  it('resumen cuando todos los lotes quedan en objetivo', () => {
    const msg = buildAllContractsMessage('TQQQ', 3)
    expect(msg.body).toContain('orden LIFO por fecha de compra')
  })
})
