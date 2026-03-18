import type { Handler } from '@netlify/functions'
import { fetchSurebetsFromApi } from '../lib/surebetsFetcher'

const BOOKMAKERS = 'Betano,Bet365'

export const handler: Handler = async () => {
  const API_KEY = process.env.ODDS_API_KEY ?? ''

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ODDS_API_KEY not set' }) }
  }

  const arbs = await fetchSurebetsFromApi(API_KEY, BOOKMAKERS)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arbs),
  }
}
