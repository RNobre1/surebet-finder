import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useValueBets } from '../../hooks/useValueBets'
import type { ApiValueBet } from '../../types'

import { supabase } from '../../lib/supabase'

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockValueBet: ApiValueBet = {
  id: 'vb-1',
  eventId: 654321,
  bookmaker: 'Betano',
  betSide: 'home',
  expectedValue: 0.052,
  expectedValueUpdatedAt: new Date().toISOString(),
  market: { name: 'ML', home: '2.20', draw: '3.10', away: '3.00' },
  bookmakerOdds: { home: '2.20', homeDirectLink: 'https://betano.com/...' },
  event: {
    home: 'Team A',
    away: 'Team B',
    date: '2025-10-15T15:00:00Z',
    league: 'Brasileirao',
    sport: 'football',
  },
}

describe('useValueBets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockValueBet], error: null }),
    } as unknown as ReturnType<typeof supabase.from>)
  })

  it('starts loading on mount', async () => {
    const { result } = renderHook(() => useValueBets())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.valueBets).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('sets loading true while fetching', () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    } as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useValueBets())
    // useEffect triggers immediately
    expect(result.current.loading).toBe(true)
  })

  it('loads value bets successfully from supabase', async () => {
    const lowEV: ApiValueBet = {
      ...mockValueBet,
      id: 'vb-2',
      expectedValue: 0.01,
      betSide: 'away',
    }
    const highEV: ApiValueBet = {
      ...mockValueBet,
      id: 'vb-1',
      expectedValue: 0.052,
      betSide: 'home',
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [highEV, lowEV], error: null }),
    } as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useValueBets())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.valueBets).toHaveLength(2)
    // The data returned by supabase mock is already ordered
    expect(result.current.valueBets[0].expectedValue).toBe(0.052)
    expect(result.current.valueBets[1].expectedValue).toBe(0.01)
  })

  it('handles database error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
    } as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useValueBets())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('DB Error')
    expect(result.current.valueBets).toHaveLength(0)
  })
})
