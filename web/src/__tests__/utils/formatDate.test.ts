import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatDate, formatDateTime, daysUntilExpiry, isExpiringSoon } from '../../utils/formatDate'

describe('formatDate', () => {
  it('formats an ISO string as dd/mm/yyyy', () => {
    // Use a date string without time to avoid UTC/local timezone issues
    expect(formatDate('2025-10-15')).toBe('15/10/2025')
  })

  it('formats another date correctly', () => {
    expect(formatDate('2026-03-01')).toBe('01/03/2026')
  })
})

describe('formatDateTime', () => {
  it('includes time in the formatted string', () => {
    const result = formatDateTime('2025-10-15T15:00:00Z')
    expect(result).toContain('15/10/2025')
    // time portion exists (locale-dependent but string should be longer)
    expect(result.length).toBeGreaterThan('15/10/2025'.length)
  })
})

describe('daysUntilExpiry', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns positive days for a future date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T12:00:00Z'))
    // Use date-only strings so timezone doesn't shift the day
    const result = daysUntilExpiry('2025-03-24')
    expect(result).toBeGreaterThan(0)
  })

  it('returns 0 or 1 for same day (timezone-safe)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))
    const result = daysUntilExpiry('2025-03-17')
    // May be 0 or 1 depending on how the Date parses local vs UTC midnight
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })

  it('returns negative days for an expired date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))
    const result = daysUntilExpiry('2025-03-10')
    expect(result).toBeLessThan(0)
  })
})

describe('isExpiringSoon', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when expires within 7 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))
    expect(isExpiringSoon('2025-03-23')).toBe(true)
  })

  it('returns false when expires in more than 7 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))
    expect(isExpiringSoon('2025-03-25')).toBe(false)
  })

  it('returns false for already expired dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))
    expect(isExpiringSoon('2025-03-10')).toBe(false)
  })

  it('respects custom threshold', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))
    expect(isExpiringSoon('2025-03-20', 2)).toBe(false)
    expect(isExpiringSoon('2025-03-18', 2)).toBe(true)
  })
})
