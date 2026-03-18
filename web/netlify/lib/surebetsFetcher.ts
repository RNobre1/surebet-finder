const ODDS_API_BASE = 'https://api.odds-api.io/v3'

/**
 * Busca surebets na Odds-API para uma lista de esportes e bookmakers.
 * Essa logica e extraida para ser reaproveitada tanto pelo proxy HTTP (UI) quanto pelo Cron Job.
 */
export async function fetchSurebetsFromApi(apiKey: string, bookmakers: string) {
  const url = new URL(`${ODDS_API_BASE}/arbitrage-bets`)
  url.searchParams.set('apiKey', apiKey)
  url.searchParams.set('bookmakers', bookmakers)
  url.searchParams.set('includeEventDetails', 'true')

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      console.error(`Odds-API error: ${response.status}`)
      return []
    }
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch surebets:', err)
    return []
  }
}
