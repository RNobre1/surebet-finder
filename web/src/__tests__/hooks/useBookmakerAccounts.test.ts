import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBookmakerAccounts } from '../../hooks/useBookmakerAccounts'
import type { BookmakerAccount } from '../../types'

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  }
})

import { supabase } from '../../lib/supabase'

const mockAccount: BookmakerAccount = {
  id: 'acc-1',
  user_id: 'user-123',
  name: 'Betano',
  balance: 1000,
  currency: 'BRL',
  color: '#ff0000',
  is_active: true,
  notes: '',
  created_at: '2025-01-01T00:00:00Z',
}

describe('useBookmakerAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads accounts successfully', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [mockAccount], error: null })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any)

    const { result } = renderHook(() => useBookmakerAccounts('user-123'))
    
    // Initial state
    expect(result.current.loading).toBe(true)

    await act(async () => {}) // wait for effect

    expect(result.current.loading).toBe(false)
    expect(result.current.accounts).toHaveLength(1)
    expect(result.current.accounts[0].name).toBe('Betano')
  })

  it('handles create account', async () => {
    // Mock the fetch
    const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    
    // Mock the insert
    const insertMock = vi.fn().mockResolvedValue({ error: null })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'bookmaker_accounts') {
        return { select: selectMock, insert: insertMock } as any
      }
      return {} as any
    })

    const { result } = renderHook(() => useBookmakerAccounts('user-123'))
    await act(async () => {})

    await act(async () => {
      await result.current.create({
        name: 'Bet365',
        balance: 500,
        currency: 'BRL',
        color: '#00ff00',
        is_active: true,
        notes: '',
      }, 'user-123')
    })

    expect(insertMock).toHaveBeenCalledWith({
      name: 'Bet365',
      balance: 500,
      currency: 'BRL',
      color: '#00ff00',
      is_active: true,
      notes: '',
      user_id: 'user-123'
    })
  })
})
