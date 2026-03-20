import type { Handler, Config } from '@netlify/functions'
import { getOddsApiKeys } from './lib/api_keys'
import { aggregateValueBets } from './lib/valuebets_aggregator'
import { saveValueBets } from './lib/supabase_cache'

export const config: Config = {
  schedule: '*/10 * * * *', // Every 10 minutes
}

export const handler: Handler = async () => {
  console.log('--- Cron ValueBets Started ---')

  try {
    const keys = getOddsApiKeys()
    if (!keys || keys.length === 0) throw new Error('No API keys configured.')

    const allValueBetsPromises = keys.map(async (keyConfig) => {
      // Endpoint v3 for value-bets global
      // Note: According to rule odds-api-quick-start.md: GET /value-bets?bookmaker={name}&apiKey={key}
      const bookmakers = keyConfig.bookmakers.join(',')
      const url = `https://api.odds-api.io/v3/value-bets?bookmakers=${bookmakers}&apiKey=${keyConfig.key}`

      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.error(
            `Error fetching valuebets for key ${keyConfig.key}: ${response.statusText}`
          )
          return []
        }
        const json = (await response.json()) as any
        return Array.isArray(json) ? json : json.data || []
      } catch (err) {
        console.error(`Failed to fetch valuebets for key ${keyConfig.key}:`, err)
        return []
      }
    })

    const allValueBetsNested = await Promise.all(allValueBetsPromises)

    // Aggregator deduplicates and highlights the highest EV
    const aggregated = aggregateValueBets(allValueBetsNested)

    // Save to supersonic cache
    const result = await saveValueBets(aggregated)

    if (!result.success) {
      throw new Error('Failed to save valuebets to Supabase cache.')
    }

    console.log(`Successfully synced ${aggregated.length} valuebets globally.`)
    return { statusCode: 200, body: `Synced ${aggregated.length} valuebets` }
  } catch (err) {
    console.error('Error in cron_valuebets:', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
