import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSurebets } from '../../hooks/useSurebets'
import type { ApiSurebet } from '../../types'
import { supabase } from '../../lib/supabase'

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockSurebet: ApiSurebet = {
  id: 'arb-1',
  eventId: 123456,
  market: { name: 'ML', hdp: 0 },
  impliedProbability: 98.5,
  profitMargin: 1.52,
  totalStake: 100,
  updatedAt: new Date().toISOString(),
  legs: [
    { bookmaker: 'Betano', side: 'home', label: 'Team A', odds: '2.10' },
    { bookmaker: 'Bet365', side: 'away', label: 'Team B', odds: '2.05' },
  ],
  optimalStakes: [
    { bookmaker: 'Betano', side: 'home', stake: 49.38, potentialReturn: 103.7 },
    { bookmaker: 'Bet365', side: 'away', stake: 50.62, potentialReturn: 103.77 },
  ],
  event: {
    home: 'Team A',
    away: 'Team B',
    date: '2025-10-15T15:00:00Z',
    league: 'Premier League',
    sport: 'football',
  },
}

describe('useSurebets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock setup
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockSurebet], error: null }),
    } as any)
  })

  it('starts with idle state (not loading)', () => {
    const { result } = renderHook(() => useSurebets())
    expect(result.current.loading).toBe(false)
    expect(result.current.surebets).toHaveLength(0)
  })

  it('sets loading to true while fetching', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    } as any)

    const { result } = renderHook(() => useSurebets())

    act(() => {
      result.current.fetch()
    })

    expect(result.current.loading).toBe(true)
  })

  it('loads surebets successfully from supabase', async () => {
    const { result } = renderHook(() => useSurebets())
    await act(async () => {
      await result.current.fetch()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.surebets).toHaveLength(1)
    expect(result.current.surebets[0].profitMargin).toBe(1.52)
    expect(result.current.error).toBeNull()
  })

  it('handles database error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi
        .fn()
        .mockResolvedValue({ data: null, error: new Error('DB Error') }),
    } as any)

    const { result } = renderHook(() => useSurebets())
    await act(async () => {
      await result.current.fetch()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('DB Error')
    expect(result.current.surebets).toHaveLength(0)
  })
})
