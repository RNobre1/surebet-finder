import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../../../netlify/functions/cron_surebets'
import * as apiKeys from '../../../netlify/functions/lib/api_keys'
import * as supabaseCache from '../../../netlify/functions/lib/supabase_cache'
import * as calculator from '../../../netlify/functions/lib/surebet_calculator'

// Mocks
vi.mock('../../../netlify/functions/lib/api_keys', () => ({
  getOddsApiKeys: vi.fn(),
}))

vi.mock('../../../netlify/functions/lib/supabase_cache', () => ({
  getCronState: vi.fn(),
  updateCronState: vi.fn(),
  saveSurebets: vi.fn(),
}))

vi.mock('../../../netlify/functions/lib/surebet_calculator', () => ({
  mergeAndCalculateSurebets: vi.fn(),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('Cron Surebets Scheduled Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing if no events in queue', async () => {
    vi.mocked(supabaseCache.getCronState).mockResolvedValue({ events: [] })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await handler({} as any, {} as any)

    expect(res?.statusCode).toBe(200)
    expect(res?.body).toBe('No events')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throtlles and fetches odds correctly', async () => {
    // 2 events in queue
    vi.mocked(supabaseCache.getCronState).mockResolvedValue({
      events: ['event1', 'event2'],
      last_index: 0,
    })

    vi.mocked(apiKeys.getOddsApiKeys).mockReturnValue([
      { key: 'key1', bookmakers: ['b1', 'b2'] },
    ])

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'event1', bookmakers: [] }),
    })

    vi.mocked(calculator.mergeAndCalculateSurebets).mockReturnValue([])
    vi.mocked(supabaseCache.saveSurebets).mockResolvedValue({ success: true })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await handler({} as any, {} as any)

    expect(res?.statusCode).toBe(200)
    // It should have fetched event1
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('event1')
    )
    // Should update state with new index (actually just last_run in the final version)
    expect(supabaseCache.updateCronState).toHaveBeenCalledWith(
      'surebets_queue',
      expect.objectContaining({ events: ['event1', 'event2'] })
    )
  })
})
