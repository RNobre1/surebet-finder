import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useValueBets } from '../../hooks/useValueBets'
import type { ApiValueBet } from '../../types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

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
  })

  it('starts with idle state', () => {
    const { result } = renderHook(() => useValueBets())
    expect(result.current.loading).toBe(false)
    expect(result.current.valueBets).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('sets loading true while fetching', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useValueBets())
    act(() => {
      result.current.fetch()
    })
    expect(result.current.loading).toBe(true)
  })

  it('loads value bets and sorts by expectedValue descending', async () => {
    const lowEV: ApiValueBet = { ...mockValueBet, id: 'vb-2', expectedValue: 0.01 }
    const highEV: ApiValueBet = { ...mockValueBet, id: 'vb-1', expectedValue: 0.052 }

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([lowEV, highEV]),
    })

    const { result } = renderHook(() => useValueBets())
    await act(async () => {
      result.current.fetch()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.valueBets).toHaveLength(2)
    // Should be sorted descending by EV
    expect(result.current.valueBets[0].expectedValue).toBe(0.052)
    expect(result.current.valueBets[1].expectedValue).toBe(0.01)
  })

  it('handles fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Timeout'))

    const { result } = renderHook(() => useValueBets())
    await act(async () => {
      result.current.fetch()
    })

    expect(result.current.error).toBe('Timeout')
    expect(result.current.valueBets).toHaveLength(0)
  })
})
