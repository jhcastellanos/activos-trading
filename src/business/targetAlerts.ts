import type { EnrichedLot, SymbolPositionGroup } from '../domain/types'
import { assignSellPriority, sortLotsLifo } from './lifo'

export type TargetAlertKind = 'single_lot' | 'all_contracts'

export type TargetAlertPayload = {
  symbol: string
  kind: TargetAlertKind
  lotId: string
  sellPriority: number
  sellFirst: boolean
  boughtAt: string
  lotsAtTarget: number
  totalLots: number
  newlyReachedLotIds: string[]
  title: string
  body: string
}

function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm
}

export function formatLotBoughtAt(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatContractsLabel(qty: number): string {
  return `${qty} ${qty === 1 ? 'contrato' : 'contratos'}`
}

/** Cantidad de contratos primero, luego fecha de compra. */
export function formatContractsAndDate(qty: number, boughtAt: string): string {
  return `${formatContractsLabel(qty)} · ${formatLotBoughtAt(boughtAt)}`
}

/** Un lote concreto; LIFO #1 = compra más reciente (mayor fecha). */
export function buildSingleLotMessage(
  symbol: string,
  lot: Pick<EnrichedLot, 'sellPriority' | 'sellFirst' | 'boughtAt' | 'remainingQty'>,
): Pick<TargetAlertPayload, 'title' | 'body' | 'kind'> {
  const contractsDate = formatContractsAndDate(lot.remainingQty, lot.boughtAt)

  if (lot.sellFirst) {
    return {
      kind: 'single_lot',
      title: `${symbol} · ${contractsDate}`,
      body: `${symbol} · ${contractsDate} superan 1,5% de objetivo — vender primero (LIFO)`,
    }
  }

  return {
    kind: 'single_lot',
    title: `${symbol} · ${contractsDate}`,
    body: `${symbol} · ${contractsDate} superan 1,5% de objetivo (LIFO #${lot.sellPriority})`,
  }
}

/** Todos los lotes abiertos del activo están en objetivo. */
export function buildAllContractsMessage(
  symbol: string,
  totalLots: number,
): Pick<TargetAlertPayload, 'title' | 'body' | 'kind'> {
  const label = plural(totalLots, 'contrato', 'contratos')
  return {
    kind: 'all_contracts',
    title: `${symbol} · todos los lotes`,
    body: `Activo ${symbol} supera 1,5% de objetivo de venta en los ${totalLots} ${label} (orden LIFO por fecha de compra)`,
  }
}

/** Lotes abiertos del activo, orden LIFO por fecha de compra (más reciente primero). */
function openLotsLifo(group: SymbolPositionGroup): EnrichedLot[] {
  const open = group.lots.filter((l) => l.remainingQty > 0 && l.status !== 'closed')
  return assignSellPriority(sortLotsLifo(open))
}

/**
 * Detecta lotes que están en objetivo 1,5% y no están en cooldown.
 * Incluye lotes que ya estaban en verde (no solo al cruzar el umbral).
 */
export function analyzeTargetAlerts(
  groups: SymbolPositionGroup[],
  cooldownKeys: ReadonlySet<string>,
): TargetAlertPayload[] {
  const alerts: TargetAlertPayload[] = []

  for (const group of groups) {
    const openLots = openLotsLifo(group)
    if (openLots.length === 0) continue

    const lotsAtTarget = openLots.filter((l) => l.targetState === 'reached')
    const lotsToNotify = lotsAtTarget.filter((lot) => !cooldownKeys.has(lot.id))
    if (lotsToNotify.length === 0) continue

    const totalLots = openLots.length
    const allAtTarget = lotsAtTarget.length === totalLots

    for (const lot of lotsToNotify) {
      const message = buildSingleLotMessage(group.symbol, lot)

      alerts.push({
        symbol: group.symbol,
        lotId: lot.id,
        sellPriority: lot.sellPriority,
        sellFirst: lot.sellFirst,
        boughtAt: lot.boughtAt,
        lotsAtTarget: lotsAtTarget.length,
        totalLots,
        newlyReachedLotIds: [lot.id],
        ...message,
      })
    }

    const summaryKey = `summary-${group.symbol}`
    if (allAtTarget && totalLots > 1 && !cooldownKeys.has(summaryKey)) {
      const summary = buildAllContractsMessage(group.symbol, totalLots)
      alerts.push({
        symbol: group.symbol,
        lotId: summaryKey,
        sellPriority: 0,
        sellFirst: false,
        boughtAt: openLots[0]?.boughtAt ?? '',
        lotsAtTarget: lotsAtTarget.length,
        totalLots,
        newlyReachedLotIds: lotsToNotify.map((l) => l.id),
        ...summary,
      })
    }
  }

  return alerts
}
