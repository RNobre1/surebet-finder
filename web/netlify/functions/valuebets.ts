import type { Handler } from '@netlify/functions'

const ODDS_API_BASE = 'https://api.odds-api.io/v3'
const API_KEY = process.env.ODDS_API_KEY ?? ''

const BOOKMAKERS = ['Betano', 'Bet365']
const SPORTS = ['football', 'basketball', 'american-football', 'tennis', 'volleyball']

export const handler: Handler = async () => {
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ODDS_API_KEY not set' }) }
  }

  const results = await Promise.allSettled(
    BOOKMAKERS.flatMap((bookmaker) =>
      SPORTS.map((sport) => {
        const url = new URL(`${ODDS_API_BASE}/value-bets`)
        url.searchParams.set('apiKey', API_KEY)
        url.searchParams.set('bookmaker', bookmaker)
        url.searchParams.set('sport', sport)
        url.searchParams.set('includeEventDetails', 'true')
        return fetch(url.toString()).then((r) => (r.ok ? r.json() : []))
      })
    )
  )

  const valueBets = results.flatMap((r) =>
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
