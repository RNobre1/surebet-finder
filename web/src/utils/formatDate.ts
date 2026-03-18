/**
 * Parses a date string safely, avoiding UTC→local timezone drift.
 * For date-only strings (YYYY-MM-DD), uses local Date constructor.
 * For datetime strings with T, uses standard new Date().
 */
function parseDate(isoString: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    const [year, month, day] = isoString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(isoString)
}

/**
 * Formats a date string as Brazilian pt-BR short date.
 * Accepts both YYYY-MM-DD and full ISO strings.
 * e.g. "2025-10-15" → "15/10/2025"
 */
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseDate(isoString))
}

/**
 * Formats an ISO date string as a pt-BR datetime.
 * e.g. "2025-10-15T15:00:00Z" → "15/10/2025 12:00"
 */
export function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

/**
 * Returns the number of days until the given ISO date expires.
 * Negative = already expired.
 */
export function daysUntilExpiry(isoDate: string): number {
  const now = new Date()
  const expiry = new Date(isoDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Returns true if the date expires within the given threshold (default 7 days).
 */
export function isExpiringSoon(isoDate: string, thresholdDays = 7): boolean {
  const days = daysUntilExpiry(isoDate)
  return days >= 0 && days <= thresholdDays
}
