import type { Handler } from '@netlify/functions'

const ODDS_API_BASE = 'https://api.odds-api.io/v3'
const BOOKMAKERS = ['Betano', 'Bet365']

export const handler: Handler = async () => {
  const API_KEY = process.env.ODDS_API_KEY ?? ''

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ODDS_API_KEY not set' }) }
  }

  const results = await Promise.allSettled(
    BOOKMAKERS.map((bookmaker: string) => {
      const url = new URL(`${ODDS_API_BASE}/value-bets`)
      url.searchParams.set('apiKey', API_KEY)
      url.searchParams.set('bookmaker', bookmaker)
      url.searchParams.set('includeEventDetails', 'true')
      return fetch(url.toString()).then((r) => (r.ok ? r.json() : []))
    })
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const valueBets = results.flatMap((r: any) =>
    r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []
  )

  // Sort by expectedValue descending
  valueBets.sort(
    (a: { expectedValue: number }, b: { expectedValue: number }) =>
      b.expectedValue - a.expectedValue
  )

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(valueBets),
  }
}
