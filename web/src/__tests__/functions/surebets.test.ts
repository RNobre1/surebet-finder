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

  it('fetches surebets and returns results successfully', async () => {
    // Mock fetch to return successful response with dummy data
    const mockData = [{ id: '1', home_team: 'Team A' }]

    vi.mocked(fetch).mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockData,
      } as Response
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler({} as any, {} as any)

    expect(response?.statusCode).toBe(200)
    const body = JSON.parse(response?.body || '[]')

    // Single call should return exactly what was fetched
    expect(body).toHaveLength(1)
    expect(body[0]).toEqual(mockData[0])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('handles fetch errors gracefully and returns empty array', async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      return { ok: false } as Response
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await handler({} as any, {} as any)

    expect(response?.statusCode).toBe(200)
    const body = JSON.parse(response?.body || '[]')
    expect(body).toHaveLength(0)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
