import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../../../netlify/functions/cron_surebets'
import * as surebetsFetcher from '../../../netlify/lib/surebetsFetcher'

// Mocks
const { mockResendSend, mockListUsers, mockFrom } = vi.hoisted(() => {
  const mockResendSend = vi.fn()
  const mockListUsers = vi.fn()
  const mockCronStateSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  })
  const mockCronStateUpsert = vi.fn().mockResolvedValue({ error: null })
  const mockFrom = vi.fn((table: string) => {
    if (table === 'cron_state') {
      return { select: mockCronStateSelect, upsert: mockCronStateUpsert }
    }
    return {}
  })

  return { mockResendSend, mockListUsers, mockFrom }
})

vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(function () {
      return { emails: { send: mockResendSend } }
    }),
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: { admin: { listUsers: () => mockListUsers() } },
    from: mockFrom,
  }),
}))

vi.mock('../../../netlify/lib/surebetsFetcher', () => ({
  fetchSurebetsFromApi: vi.fn(),
}))

describe('Cron Surebets Scheduled Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ODDS_API_KEY = 'test_odds'
    process.env.VITE_SUPABASE_URL = 'http://test.supabase'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service'
    process.env.RESEND_API_KEY = 'test_resend'
  })

  it('fails if missing env variables', async () => {
    delete process.env.ODDS_API_KEY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await handler({} as any, {} as any)
    expect(res?.statusCode).toBe(500)
  })

  it('does nothing if no surebets found', async () => {
    vi.mocked(surebetsFetcher.fetchSurebetsFromApi).mockResolvedValue([])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await handler({} as any, {} as any)

    expect(res?.statusCode).toBe(200)
    expect(res?.body).toBe('No surebets found')
    expect(mockListUsers).not.toHaveBeenCalled()
    expect(mockResendSend).not.toHaveBeenCalled()
  })

  it('formats HTML correctly and sends email via Resend when surebets are found', async () => {
    // Mock surebet API response
    vi.mocked(surebetsFetcher.fetchSurebetsFromApi).mockResolvedValue([
      {
        home_team: 'Team A',
        away_team: 'Team B',
        bookmakers: [
          {
            key: 'betano',
            title: 'Betano',
            markets: [
              {
                key: 'h2h',
                outcomes: [{ name: 'Team A', price: 2.5 }],
              },
            ],
          },
          {
            key: 'bet365',
            title: 'Bet365',
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: 'Team B', price: 2.0 },
                  { name: 'Draw', price: 10.0 },
                ],
              },
            ],
          },
        ],
      },
    ])

    // Mock supabase users
    mockListUsers.mockResolvedValue({
      data: {
        users: [{ email: 'test1@test.com' }, { email: 'test2@test.com' }],
      },
      error: null,
    })

    mockResendSend.mockResolvedValue({ id: 'resend_1' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await handler({} as any, {} as any)

    expect(res?.statusCode).toBe(200)
    expect(mockListUsers).toHaveBeenCalled()
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['test1@test.com', 'test2@test.com'],
        from: 'onboarding@resend.dev',
        subject: expect.stringContaining('Surebet'),
        html: expect.stringContaining('R$ 100'),
      })
    )
  })
})
