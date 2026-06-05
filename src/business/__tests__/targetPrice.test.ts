import { describe, expect, it } from 'vitest'
import { lotTargetState, targetSellPrice } from '../targetPrice'

describe('targetSellPrice', () => {
  it('calcula 1.5% sobre precio de compra', () => {
    expect(targetSellPrice(100, 1.5)).toBe(101.5)
  })
})

describe('lotTargetState', () => {
  it('marca reached cuando precio actual >= objetivo', () => {
    expect(lotTargetState(102, 101.5)).toBe('reached')
  })
})
