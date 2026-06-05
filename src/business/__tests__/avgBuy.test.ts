import { describe, expect, it } from 'vitest'
import { weightedAvgBuy } from '../avgBuy'

describe('weightedAvgBuy', () => {
  it('calcula prom. ponderado y suma $0.01', () => {
    const w = weightedAvgBuy([
      { remainingQty: 10, avgBuyPrice: 188.4 },
      { remainingQty: 15, avgBuyPrice: 200 },
      { remainingQty: 20, avgBuyPrice: 210 },
    ])
    expect(w.totalCostUsd).toBe(9084)
    expect(w.totalContracts).toBe(45)
    expect(w.avgRaw).toBe(201.87)
    expect(w.avgAdjusted).toBe(201.88)
  })
})
