import { describe, it, expect } from 'vitest'
import { formatCurrency, formatCurrencyCompact } from '../../utils/formatCurrency'

describe('formatCurrency', () => {
  it('formats a positive number as BRL', () => {
    expect(formatCurrency(1234.56)).toBe('R$\u00a01.234,56')
  })

  it('formats zero as R$ 0,00', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00')
  })

  it('formats a negative number', () => {
    expect(formatCurrency(-50)).toBe('-R$\u00a050,00')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('R$\u00a011,00')
  })
})

describe('formatCurrencyCompact', () => {
  it('formats without currency symbol', () => {
    const result = formatCurrencyCompact(1234.56)
    expect(result).toBe('1.234,56')
  })

  it('always shows 2 decimal places', () => {
    expect(formatCurrencyCompact(10)).toBe('10,00')
  })
})
