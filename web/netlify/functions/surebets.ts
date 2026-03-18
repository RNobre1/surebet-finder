import type { Handler } from '@netlify/functions'

const ODDS_API_BASE = 'https://api.odds-api.io/v3'
const BOOKMAKERS = 'Betano,Bet365'
const SPORTS = ['football', 'basketball', 'american-football', 'tennis', 'volleyball']

export const handler: Handler = async () => {
  const API_KEY = process.env.ODDS_API_KEY ?? ''

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ODDS_API_KEY not set' }) }
  }

  const results = await Promise.allSettled(
    SPORTS.map((sport) => {
      const url = new URL(`${ODDS_API_BASE}/arbitrage-bets`)
      url.searchParams.set('apiKey', API_KEY)
      url.searchParams.set('bookmakers', BOOKMAKERS)
      url.searchParams.set('sport', sport)
      url.searchParams.set('includeEventDetails', 'true')
      return fetch(url.toString()).then((r) => (r.ok ? r.json() : []))
    })
  )

  const arbs = results.flatMap((r) =>
    r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []
  )

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arbs),
  }
}
