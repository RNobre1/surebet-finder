import type { Handler, Config } from '@netlify/functions'
import { getOddsApiKeys } from './lib/api_keys'
import { updateCronState } from './lib/supabase_cache'

export const config: Config = {
  schedule: '0 */12 * * *', // Every 12 hours
}

const TARGET_LEAGUES = [
  'tennis_atp',
  'tennis_wta',
  'basketball_nba',
  'soccer_epl',
  'soccer_efl_champ',
  'soccer_spain_la_liga',
  'soccer_spain_segunda_division',
  'soccer_italy_serie_a',
  'soccer_italy_serie_b',
  'soccer_germany_bundesliga',
  'soccer_germany_bundesliga2',
  'soccer_france_ligue_one',
  'soccer_france_ligue_two',
  'soccer_turkey_super_league',
  'soccer_greece_super_league',
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league',
  'soccer_brazil_campeonato',
  'soccer_brazil_serie_b',
  'soccer_conmebol_libertadores',
  'soccer_conmebol_sudamericana',
  'soccer_argentina_primera_division',
  'soccer_usa_mls',
]

export const handler: Handler = async () => {
  console.log('--- Cron Sync Events Started ---')

  try {
    const keys = getOddsApiKeys()
    if (!keys || keys.length === 0) throw new Error('No API keys configured.')

    // We only need ONE key to fetch events structure. Let's use the first one.
    const primaryKey = keys[0].key

    // Calculate time bounds: Next 48 hours
    const now = new Date()
    const commenceTimeFrom = now.toISOString()
    const nowPlus48 = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    const commenceTimeTo = nowPlus48.toISOString()

    const allEventIds: string[] = []

    for (const sport of TARGET_LEAGUES) {
      const url = `https://api.odds-api.io/v3/events?sport=${sport}&commenceTimeFrom=${commenceTimeFrom}&commenceTimeTo=${commenceTimeTo}&apiKey=${primaryKey}`
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`Error fetching events for ${sport}: ${response.statusText}`)
          continue
        }

        const json = (await response.json()) as { data?: unknown[] }
        const data = Array.isArray(json) ? json : json.data || []

        for (const evt of data as { id: string }[]) {
          if (evt && evt.id) {
            allEventIds.push(evt.id)
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${sport}:`, err)
      }
    }

    console.log(`Synced a total of ${allEventIds.length} events for the next 48h.`)

    // Save to supersonic cache
    await updateCronState('surebets_queue', {
      events: allEventIds,
      total_events: allEventIds.length,
      current_index: 0,
    })

    return { statusCode: 200, body: `Synced ${allEventIds.length} events` }
  } catch (err) {
    console.error('Error in cron_sync_events:', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
