import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useActiveSurebets } from '../../hooks/useActiveSurebets'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    }
  },
}))

describe('useActiveSurebets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    } as any)
    
    vi.mocked(supabase.from).mockImplementation((_table) => {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      } as any
    })
  })

  it('starts with idle state', async () => {
    const { result } = renderHook(() => useActiveSurebets())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.activeSurebets).toHaveLength(0)
    expect(result.current.error).toBeNull()
  })

  it('adds a surebet and triggers balance deductions', async () => {
    const mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-bet-id' }, error: null }) }) })
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'bookmaker_accounts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null })
            })
          }),
          update: mockUpdate
        } as any
      }
      return {
        insert: mockInsert,
        update: mockUpdate,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
             eq: vi.fn().mockReturnValue({
               order: vi.fn().mockResolvedValue({ data: [], error: null })
             })
          })
        })
      } as any
    })

    const { result } = renderHook(() => useActiveSurebets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addSurebet({
        event_name: 'Brasil vs Argentina',
        sport: 'football',
        league: 'World Cup',
        profit_margin: 2.5,
        total_stake: 1000,
        event_date: '2025-10-15T15:00:00Z',
        legs: [
          { leg_id: '1', bookmaker_id: 'bookieA', market_name: 'ML Home', odds: 2.05, stake: 500, status: 'pending' },
          { leg_id: '2', bookmaker_id: 'bookieB', market_name: 'ML Away', odds: 2.05, stake: 500, status: 'pending' }
        ]
      })
    })

    expect(mockInsert).toHaveBeenCalledTimes(3) // 1 for surebets_history, 2 for transactions
    expect(result.current.error).toBeNull()
  })

  it('resolves a leg (WON), marks others LOST, adds profit and updates balance', async () => {
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const mockInsertTransaction = vi.fn().mockResolvedValue({ error: null })
    
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'transactions') {
        return { insert: mockInsertTransaction } as any
      }
      if (table === 'bookmaker_accounts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null })
            })
          }),
          update: mockUpdate
        } as any
      }
      return {
        update: mockUpdate,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
             eq: vi.fn().mockReturnValue({
               order: vi.fn().mockResolvedValue({ data: [], error: null })
             })
          })
        })
      } as any
    })

    const { result } = renderHook(() => useActiveSurebets())
    await waitFor(() => expect(result.current.loading).toBe(false))
    
    const betWithLegs = {
      id: 'abc',
      user_id: 'user',
      total_stake: 100,
      legs: [
        { leg_id: '1', bookmaker_id: 'b1', market_name: 'ML', odds: 2.1, stake: 50, status: 'pending' },
        { leg_id: '2', bookmaker_id: 'b2', market_name: 'ML', odds: 2.1, stake: 50, status: 'pending' }
      ]
    }

    await act(async () => {
      await result.current.resolveLeg('abc', betWithLegs as any, '1', 'user')
    })
    
    expect(mockUpdate).toHaveBeenCalledTimes(2) // 1 surebets_history + 1 bookmaker_accounts
    expect(mockInsertTransaction).toHaveBeenCalledTimes(1) // 1 profit transaction
  })

  it('voids a surebet, restores all stakes and sets status to void', async () => {
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const mockInsertTransaction = vi.fn().mockResolvedValue({ error: null })
    
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'transactions') {
        return { insert: mockInsertTransaction } as any
      }
      if (table === 'bookmaker_accounts') {
        return {
          select: vi.fn().mockReturnValue({
             eq: vi.fn().mockReturnValue({
               single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null })
             })
          }),
          update: mockUpdate
        } as any
      }
      return {
        update: mockUpdate,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
             eq: vi.fn().mockReturnValue({
               order: vi.fn().mockResolvedValue({ data: [], error: null })
             })
          })
        })
      } as any
    })

    const { result } = renderHook(() => useActiveSurebets())
    await waitFor(() => expect(result.current.loading).toBe(false))
    
    const betWithLegs = {
      id: 'def',
      user_id: 'user',
      total_stake: 100,
      legs: [
        { leg_id: '1', bookmaker_id: 'b1', market_name: 'ML', odds: 2.1, stake: 50, status: 'pending' },
        { leg_id: '2', bookmaker_id: 'b2', market_name: 'ML', odds: 2.1, stake: 50, status: 'pending' }
      ]
    }

    await act(async () => {
      await result.current.voidSurebet('def', betWithLegs as any, 'user')
    })
    
    expect(mockUpdate).toHaveBeenCalledTimes(3) // 1 surebets_history + 2 bookmaker_accounts updates
    expect(mockInsertTransaction).toHaveBeenCalledTimes(2) // 2 refund transactions
  })
})
