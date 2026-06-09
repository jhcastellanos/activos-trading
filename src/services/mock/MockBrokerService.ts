import type { BrokerService } from '../interfaces/BrokerService'
import type { AccountSummary, ClosedTrade, TradeLot } from '../../domain/types'
import { localBrokerRepo } from '../../storage/LocalBrokerRepository'
import { MOCK_ACCOUNT, MOCK_QUOTES } from './seedData'

/** Precio simulado por símbolo: random walk para cruzar objetivos 1,5% en demo. */
const demoQuoteState = new Map<string, number>()

function nextDemoQuote(symbol: string): number {
  const base = MOCK_QUOTES[symbol]
  if (base == null) return 0

  let price = demoQuoteState.get(symbol) ?? base
  // Paso aleatorio ±1,2% por tick — suficiente para cruzar umbrales con el refresco cada 5s.
  const stepPct = (Math.random() - 0.5) * 2.4
  price = price * (1 + stepPct / 100)
  // Ligera reversión al precio base para que oscile alrededor del mercado mock.
  price += (base - price) * 0.08
  price = Math.round(price * 100) / 100
  demoQuoteState.set(symbol, price)
  return price
}

export class MockBrokerService implements BrokerService {
  readonly mode = 'demo' as const

  async getAccountSummary(): Promise<AccountSummary> {
    const data = localBrokerRepo.get()
    const open = data.lots.filter((l) => l.status !== 'closed' && l.remainingQty > 0)
    return {
      ...MOCK_ACCOUNT,
      openPositionsCount: open.length,
      asOf: new Date().toISOString(),
    }
  }

  async getCurrentAccountValue(): Promise<number> {
    return MOCK_ACCOUNT.totalValue
  }

  async getAccountBalance(): Promise<number> {
    return this.getCurrentAccountValue()
  }

  async getOpenLots(): Promise<TradeLot[]> {
    return localBrokerRepo.get().lots.filter((l) => l.status !== 'closed' && l.remainingQty > 0)
  }

  async getOpenPositions(): Promise<TradeLot[]> {
    return this.getOpenLots()
  }

  async getClosedTrades(): Promise<ClosedTrade[]> {
    return localBrokerRepo.get().closed
  }

  async getQuotes(symbols: string[]): Promise<Record<string, number>> {
    const out: Record<string, number> = {}
    for (const s of symbols) {
      out[s] = nextDemoQuote(s)
    }
    return out
  }

  async addLot(input: Omit<TradeLot, 'id'>): Promise<TradeLot> {
    const data = localBrokerRepo.get()
    const lot: TradeLot = { ...input, id: crypto.randomUUID() }
    data.lots.push(lot)
    localBrokerRepo.setLots(data.lots)
    return lot
  }

  async closeLotPartial(lotId: string, qty: number, exitPrice: number): Promise<void> {
    const data = localBrokerRepo.get()
    const lot = data.lots.find((l) => l.id === lotId)
    if (!lot) return
    const closedQty = Math.min(qty, lot.remainingQty)
    lot.remainingQty -= closedQty
    if (lot.remainingQty <= 0) {
      lot.status = 'closed'
      lot.remainingQty = 0
    } else {
      lot.status = 'partial'
    }
    const pnlUsd = (exitPrice - lot.avgBuyPrice) * closedQty
    const pnlPct = lot.avgBuyPrice > 0 ? ((exitPrice - lot.avgBuyPrice) / lot.avgBuyPrice) * 100 : 0
    data.closed.unshift({
      id: crypto.randomUUID(),
      symbol: lot.symbol,
      boughtAt: lot.boughtAt,
      soldAt: new Date().toISOString(),
      quantity: closedQty,
      entryPrice: lot.avgBuyPrice,
      exitPrice,
      pnlUsd: Math.round(pnlUsd * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      durationMs: Date.now() - new Date(lot.boughtAt).getTime(),
      closeMethod: 'demo',
    })
    localBrokerRepo.setLots(data.lots)
    localBrokerRepo.setClosed(data.closed)
  }
}
