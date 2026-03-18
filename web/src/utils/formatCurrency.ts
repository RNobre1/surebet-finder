/**
 * Formats a number as Brazilian Real (BRL).
 * e.g. 1234.56 → "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formats a number as a compact BRL value without the currency symbol,
 * useful for chart labels.
 * e.g. 1234.56 → "1.234,56"
 */
export function formatCurrencyCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
