import { describe, expect, it } from 'vitest'
import { profitVisualStatus } from '../profitStatus'

describe('profitVisualStatus', () => {
  it('verde cuando >= 1.5%', () => {
    expect(profitVisualStatus(1.5)).toBe('met')
    expect(profitVisualStatus(3)).toBe('met')
  })

  it('amarillo entre 0 y 1.499%', () => {
    expect(profitVisualStatus(0)).toBe('pending')
    expect(profitVisualStatus(1.49)).toBe('pending')
  })

  it('rojo cuando < 0%', () => {
    expect(profitVisualStatus(-0.01)).toBe('loss')
    expect(profitVisualStatus(-5)).toBe('loss')
  })
})
