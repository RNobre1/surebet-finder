import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handler } from '../../../netlify/functions/valuebets'

const originalEnv = process.env

describe('Netlify Function: valuebets', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env = { ...originalEnv, ODDS_API_KEY: 'test-key' }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env = originalEnv
  })

  it('returns 500 if ODDS_API_KEY is not set', async () => {
    process.env.ODDS_API_KEY = ''
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler({} as any, {} as any)
    expect(response?.statusCode).toBe(500)
    expect(JSON.parse(response?.body || '')).toEqual({ error: 'ODDS_API_KEY not set' })
  })

  it('fetches value bets, merges, and sorts them by expectedValue', async () => {
    // 2 bookmakers * 5 sports = 10 calls
    // We will return data for just two specific calls and empty arrays for others
    let callCount = 0
    vi.mocked(fetch).mockImplementation(async () => {
      callCount++
      if (callCount === 1) return { ok: true, json: async () => [{ id: '1', expectedValue: 3.5 }] } as Response
      if (callCount === 5) return { ok: true, json: async () => [{ id: '2', expectedValue: 5.2 }] } as Response
      if (callCount === 9) return { ok: true, json: async () => [{ id: '3', expectedValue: 1.1 }] } as Response
      return { ok: true, json: async () => [] } as Response
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler({} as any, {} as any)
    
    expect(response?.statusCode).toBe(200)
    const body = JSON.parse(response?.body || '[]')
    
    // Should have 3 results
    expect(body).toHaveLength(3)
    
    // Should be sorted descending by expectedValue
    expect(body[0].expectedValue).toBe(5.2)
    expect(body[1].expectedValue).toBe(3.5)
    expect(body[2].expectedValue).toBe(1.1)
    
    // Total calls should be 2 * 5 = 10
    expect(fetch).toHaveBeenCalledTimes(10)
  })
})
