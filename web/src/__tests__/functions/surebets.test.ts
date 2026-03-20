import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../../../netlify/functions/surebets'
import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import * as supabaseCache from '../../../netlify/functions/lib/supabase_cache'

// Mock supabaseCache
vi.mock('../../../netlify/functions/lib/supabase_cache', () => ({
  getSupabaseClient: vi.fn(),
}))

describe('Netlify Function: surebets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches surebets and returns results successfully from cache', async () => {
    const mockData = [{ id: '1', homeTeam: 'Team A' }]
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    }
    vi.mocked(supabaseCache.getSupabaseClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof supabaseCache.getSupabaseClient>
    )

    const response = await handler({} as HandlerEvent, {} as HandlerContext)

    expect(response?.statusCode).toBe(200)
    const body = JSON.parse(response?.body || '[]')
    expect(body).toHaveLength(1)
    expect(body[0].id).toBe('1')
  })

  it('handles database errors gracefully', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
    }
    vi.mocked(supabaseCache.getSupabaseClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof supabaseCache.getSupabaseClient>
    )

    const response = await handler({} as HandlerEvent, {} as HandlerContext)

    expect(response?.statusCode).toBe(500)
    expect(JSON.parse(response?.body || '{}')).toHaveProperty('error')
  })
})
