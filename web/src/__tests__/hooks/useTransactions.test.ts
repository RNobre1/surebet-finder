import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTransactions } from '../../hooks/useTransactions'
import type { Transaction } from '../../types'

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  }
})

import { supabase } from '../../lib/supabase'

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    user_id: 'u-1',
    account_id: 'acc-1',
    type: 'deposit',
    amount: 1000,
    description: 'Initial',
    date: '2025-01-01T12:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tx-2',
    user_id: 'u-1',
    account_id: 'acc-1',
    type: 'surebet_profit',
    amount: 50,
    description: 'Profit',
    date: '2025-01-02T12:00:00Z',
    created_at: '2025-01-02T00:00:00Z',
  }
]

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates total profit and deposits correctly', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: mockTransactions, error: null })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any)

    const { result } = renderHook(() => useTransactions('u-1'))
    await act(async () => {})

    expect(result.current.transactions).toHaveLength(2)
    expect(result.current.totalDeposited).toBe(1000)
    expect(result.current.totalProfit).toBe(50)
  })

  it('generates chart data correctly for month period', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-10T12:00:00Z')) // ensure relative dates logic works
    
    const orderMock = vi.fn().mockResolvedValue({ data: mockTransactions, error: null })
    const eqMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any)

    const { result } = renderHook(() => useTransactions('u-1'))
    await act(async () => {})

    const chartData = result.current.getChartData('month')
    expect(chartData.length).toBeGreaterThan(0)
    
    // Day 1 => Week 1
    const week1Data = chartData.find(d => d.label === 'Sem 1')
    expect(week1Data).toBeDefined()
    expect(week1Data?.deposits).toBe(1000)
    expect(week1Data?.profit).toBe(50)

    vi.useRealTimers()
  })
})
