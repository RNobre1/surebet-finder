import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../../../netlify/functions/valuebets'
import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import * as supabaseCache from '../../../netlify/functions/lib/supabase_cache'

// Mock supabaseCache
vi.mock('../../../netlify/functions/lib/supabase_cache', () => ({
  getSupabaseClient: vi.fn(),
}))

describe('Netlify Function: valuebets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches value bets from cache and returns them sorted', async () => {
    const mockData = [
      { id: '2', expectedValue: 5.2 },
      { id: '1', expectedValue: 3.5 },
      { id: '3', expectedValue: 1.1 },
    ]

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    }
    vi.mocked(supabaseCache.getSupabaseClient).mockReturnValue(mockSupabase as any)

    const response = await handler({} as HandlerEvent, {} as HandlerContext)

    expect(response?.statusCode).toBe(200)
    const body = JSON.parse(response?.body || '[]')

    expect(body).toHaveLength(3)
    expect(body[0].expectedValue).toBe(5.2)
    expect(body[2].expectedValue).toBe(1.1)
  })

  it('handles database errors gracefully', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
    }
    vi.mocked(supabaseCache.getSupabaseClient).mockReturnValue(mockSupabase as any)

    const response = await handler({} as HandlerEvent, {} as HandlerContext)

    expect(response?.statusCode).toBe(500)
    expect(JSON.parse(response?.body || '{}')).toHaveProperty('error')
  })
})
