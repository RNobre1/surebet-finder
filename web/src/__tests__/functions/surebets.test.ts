import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handler } from '../../../netlify/functions/surebets'

const originalEnv = process.env

describe('Netlify Function: surebets', () => {
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

  it('fetches surebets and merges results successfully', async () => {
    // Mock fetch to return successful responses with dummy data
    const mockData = [{ id: '1', home_team: 'Team A' }]
    
    vi.mocked(fetch).mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockData
      } as Response
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler({} as any, {} as any)
    
    expect(response?.statusCode).toBe(200)
    const body = JSON.parse(response?.body || '[]')
    
    // 5 sports means 5 calls, and each appends mockData to results
    expect(body).toHaveLength(5)
    expect(body[0]).toEqual(mockData[0])
    expect(fetch).toHaveBeenCalledTimes(5)
  })

  it('handles fetch errors gracefully and maps to empty array', async () => {
    // Mock fetch to fail for some and succeed for others
    let callCount = 0
    vi.mocked(fetch).mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return { ok: false } as Response
      }
      return {
        ok: true,
        json: async () => [{ id: `event-${callCount}` }]
      } as Response
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler({} as any, {} as any)
    
    expect(response?.statusCode).toBe(200)
    const body = JSON.parse(response?.body || '[]')
    // 1 failed, 4 succeeded
    expect(body).toHaveLength(4)
  })
})
