import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted mocks for Supabase
const { selectMock, insertMock, updateMock, eqMock } = vi.hoisted(() => {
  const eqMock = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
  })
  const selectMock = vi.fn(() => ({ eq: eqMock }))
  const updateMock = vi.fn(() => ({ eq: eqMock }))
  const insertMock = vi.fn().mockResolvedValue({ error: null })

  return { selectMock, insertMock, updateMock, eqMock }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: selectMock,
      insert: insertMock,
      update: updateMock,
    }))
  }))
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { getCronState, updateCronState } from '../../netlify/functions/lib/supabase_cache'
import { handler as syncEventsHandler } from '../../netlify/functions/cron_sync_events'

describe('Cron Sync Events and Cache Fix Verification (Odds-API.io v3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SUPABASE_URL', 'http://localhost')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'mock-key')
    vi.stubEnv('ODDS_API_KEYS', JSON.stringify([{ key: 'key1', bookmakers: [] }]))
    
    // Default mock behavior
    eqMock.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    })
    insertMock.mockResolvedValue({ error: null })
    updateMock.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
    })
  })

  it('getCronState should use "key" and parse "value"', async () => {
    const mockDbRow = { key: 'surebets_queue', value: JSON.stringify({ events: ['e1'] }) }
    eqMock.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: mockDbRow, error: null }),
    })

    const state = await getCronState('surebets_queue')
    
    expect(eqMock).toHaveBeenCalledWith('key', 'surebets_queue')
    expect(state).toEqual({ events: ['e1'] })
  })

  it('updateCronState should stringify state into "value" and use "key"', async () => {
    const newState = { events: ['e1'] }
    
    await updateCronState('surebets_queue', newState)

    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        key: 'surebets_queue',
        value: JSON.stringify(newState),
      }),
    ])
  })

  it('cron_sync_events should use v3 API and correct domain and mapping', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 12345, date: new Date().toISOString() }]),
    })

    await syncEventsHandler({} as any, {} as any)

    // Check if URL is v3 and uses odds-api.io
    // It should check multiple leagues, let's check one specifically
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/https:\/\/api\.odds-api\.io\/v3\/events\?.*apiKey=key1/)
    )
    
    // Verify it used sport and league params
    expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sport=')
    )
    expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('league=')
    )
  })
})
