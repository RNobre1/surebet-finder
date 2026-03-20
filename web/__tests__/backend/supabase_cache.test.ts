import { describe, it, expect, vi, beforeEach } from 'vitest'

const { selectMock, insertMock, deleteMock, updateMock } = vi.hoisted(() => {
  const eqMock = vi.fn()
  const neqMock = vi.fn()
  const selectMock = vi.fn(() => ({ eq: eqMock }))
  const deleteMock = vi.fn(() => ({ neq: neqMock }))
  const updateMock = vi.fn(() => ({ eq: eqMock }))
  const insertMock = vi.fn()

  return { selectMock, insertMock, deleteMock, updateMock }
})

vi.mock('@supabase/supabase-js', () => {
  const mockClient = {
    from: vi.fn(() => ({
      select: selectMock,
      insert: insertMock,
      delete: deleteMock,
      update: updateMock,
    })),
  }
  return { createClient: vi.fn(() => mockClient) }
})

import { saveValueBets, getCronState } from '../../netlify/functions/lib/supabase_cache'

describe('Supabase Cache Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    delete process.env.VITE_SUPABASE_URL
    // @ts-ignore
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    // @ts-ignore
    process.env.SUPABASE_URL = 'http://localhost'
    // @ts-ignore
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key'
  })

  it('should delete old valuebets and insert new ones', async () => {
    // Override the hoisted mock specifically for this test
    deleteMock.mockReturnValue({
      neq: vi.fn().mockResolvedValue({ error: null }),
    })
    insertMock.mockResolvedValue({ error: null })

    const mockBets = [{ id: '1', expectedValue: 0.05 }] as Record<string, unknown>[]

    const result = await saveValueBets(mockBets)
    expect(result.success).toBe(true)

    // Should call delete first to flush old cache
    expect(deleteMock).toHaveBeenCalled()
    // Should call insert with new items
    expect(insertMock).toHaveBeenCalledWith(mockBets)
  })

  it('should fetch cron state correctly', async () => {
    const mockState = { id: 1, last_run: '2025', current_index: 0, total_events: 150 }
    
    selectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockState, error: null }),
      }),
    })

    const state = await getCronState('surebets')
    expect(state).toEqual(mockState)
  })
})
