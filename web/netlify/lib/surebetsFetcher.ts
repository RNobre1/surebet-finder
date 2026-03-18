const ODDS_API_BASE = 'https://api.odds-api.io/v3'

/**
 * Busca surebets na Odds-API para uma lista de esportes e bookmakers.
 * Essa logica e extraida para ser reaproveitada tanto pelo proxy HTTP (UI) quanto pelo Cron Job.
 */
export async function fetchSurebetsFromApi(apiKey: string, sports: string[], bookmakers: string) {
  const results = await Promise.allSettled(
    sports.map((sport) => {
      const url = new URL(`${ODDS_API_BASE}/arbitrage-bets`)
      url.searchParams.set('apiKey', apiKey)
      url.searchParams.set('bookmakers', bookmakers)
      url.searchParams.set('sport', sport)
      url.searchParams.set('includeEventDetails', 'true')
      return fetch(url.toString()).then((r) => (r.ok ? r.json() : []))
    })
  )

  const arbs = results.flatMap((r) =>
    r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []
  )

  return arbs
}
