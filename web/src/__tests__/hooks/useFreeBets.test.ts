import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFreeBets } from '../../hooks/useFreeBets'
import type { FreeBet } from '../../types'

// Mock the ENTIRE supabase module before import resolution
vi.mock('../../lib/supabase', () => {
  const mockFrom = vi.fn()
  return {
    supabase: {
      from: mockFrom,
    },
  }
})

// Import the mocked supabase AFTER vi.mock
import { supabase } from '../../lib/supabase'

const mockFreeBet: FreeBet = {
  id: 'fb-1',
  user_id: 'user-123',
  bookmaker: 'KTO',
  amount: 20,
  expires_at: '2025-03-19',
  description: 'Welcome bonus',
  is_used: false,
  created_at: '2025-03-10T00:00:00Z',
}

const buildSupabaseMock = (resolvedValue: {
  data: FreeBet[] | null
  error: { message: string } | null
}) => {
  const orderMock = vi.fn().mockResolvedValue(resolvedValue)
  const eqMock = vi.fn().mockReturnValue({ order: orderMock })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any)
}

describe('useFreeBets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with loading state', () => {
    const orderMock = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any)

    const { result } = renderHook(() => useFreeBets('user-123'))
    expect(result.current.loading).toBe(true)
  })

  it('loads free bets successfully', async () => {
    buildSupabaseMock({ data: [mockFreeBet], error: null })

    const { result } = renderHook(() => useFreeBets('user-123'))
    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.freeBets).toHaveLength(1)
    expect(result.current.freeBets[0].bookmaker).toBe('KTO')
    expect(result.current.error).toBeNull()
  })

  it('identifies expiring free bets within 7 days', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))

    const expiringBet: FreeBet = { ...mockFreeBet, expires_at: '2025-03-19' } // 2 days away
    buildSupabaseMock({ data: [expiringBet], error: null })

    const { result } = renderHook(() => useFreeBets('user-123'))
    await act(async () => {})

    expect(result.current.expiringFreeBets).toHaveLength(1)
  })

  it('handles fetch error gracefully', async () => {
    buildSupabaseMock({ data: null, error: { message: 'DB error' } })

    const { result } = renderHook(() => useFreeBets('user-123'))
    await act(async () => {})

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('DB error')
    expect(result.current.freeBets).toHaveLength(0)
  })
})
