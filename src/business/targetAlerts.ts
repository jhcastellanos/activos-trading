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

/** Un lote concreto; LIFO #1 = compra más reciente (mayor fecha). */
export function buildSingleLotMessage(
  symbol: string,
  lot: Pick<EnrichedLot, 'sellPriority' | 'sellFirst' | 'boughtAt'>,
): Pick<TargetAlertPayload, 'title' | 'body' | 'kind'> {
  const fecha = formatLotBoughtAt(lot.boughtAt)

  if (lot.sellFirst) {
    return {
      kind: 'single_lot',
      title: `${symbol} · última compra`,
      body: `${symbol} · Última compra (${fecha}) supera 1,5% de objetivo de venta — vender primero (LIFO)`,
    }
  }

  return {
    kind: 'single_lot',
    title: `${symbol} · compra ${fecha}`,
    body: `${symbol} · Compra del ${fecha} supera 1,5% de objetivo de venta (LIFO #${lot.sellPriority})`,
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

function lotReachedMap(groups: SymbolPositionGroup[]): Map<string, boolean> {
  const map = new Map<string, boolean>()
  for (const group of groups) {
    for (const lot of group.lots) {
      map.set(lot.id, lot.targetState === 'reached')
    }
  }
  return map
}

/** Lotes abiertos del activo, orden LIFO por fecha de compra (más reciente primero). */
function openLotsLifo(group: SymbolPositionGroup): EnrichedLot[] {
  const open = group.lots.filter((l) => l.remainingQty > 0 && l.status !== 'closed')
  return assignSellPriority(sortLotsLifo(open))
}

/**
 * Detecta lotes que acaban de cruzar el 1,5% — un aviso por lote, en orden LIFO (última compra primero).
 * Si todos los lotes del activo quedan en objetivo, agrega un resumen final.
 */
export function analyzeTargetAlerts(
  previousGroups: SymbolPositionGroup[],
  nextGroups: SymbolPositionGroup[],
  alreadyNotifiedLotIds: ReadonlySet<string>,
): TargetAlertPayload[] {
  const prevReached = lotReachedMap(previousGroups)
  const alerts: TargetAlertPayload[] = []

  for (const group of nextGroups) {
    const openLots = openLotsLifo(group)
    if (openLots.length === 0) continue

    const newlyReached = openLots.filter(
      (lot) =>
        lot.targetState === 'reached' &&
        !prevReached.get(lot.id) &&
        !alreadyNotifiedLotIds.has(lot.id),
    )
    if (newlyReached.length === 0) continue

    const lotsAtTarget = openLots.filter((l) => l.targetState === 'reached').length
    const totalLots = openLots.length
    const allAtTarget = lotsAtTarget === totalLots

    // Un aviso por cada lote que acaba de cruzar, en orden LIFO (última fecha de compra primero).
    for (const lot of newlyReached) {
      const message =
        totalLots === 1
          ? {
              kind: 'all_contracts' as const,
              title: `${group.symbol} · objetivo 1,5%`,
              body: `Activo ${group.symbol} supera 1,5% de objetivo de venta`,
            }
          : buildSingleLotMessage(group.symbol, lot)

      alerts.push({
        symbol: group.symbol,
        lotId: lot.id,
        sellPriority: lot.sellPriority,
        sellFirst: lot.sellFirst,
        boughtAt: lot.boughtAt,
        lotsAtTarget,
        totalLots,
        newlyReachedLotIds: [lot.id],
        ...message,
      })
    }

    if (allAtTarget && totalLots > 1) {
      const summary = buildAllContractsMessage(group.symbol, totalLots)
      alerts.push({
        symbol: group.symbol,
        lotId: `summary-${group.symbol}`,
        sellPriority: 0,
        sellFirst: false,
        boughtAt: openLots[0]?.boughtAt ?? '',
        lotsAtTarget,
        totalLots,
        newlyReachedLotIds: newlyReached.map((l) => l.id),
        ...summary,
      })
    }
  }

  return alerts
}

/** Lotes que dejaron de estar en objetivo — se quitan del registro de avisos enviados. */
export function lotIdsNoLongerAtTarget(groups: SymbolPositionGroup[]): Set<string> {
  const ids = new Set<string>()
  for (const group of groups) {
    for (const lot of group.lots) {
      if (lot.targetState !== 'reached') ids.add(lot.id)
    }
  }
  return ids
}
