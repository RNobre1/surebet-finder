import type { Handler, Config } from '@netlify/functions'
import { getOddsApiKeys } from './lib/api_keys'
import { updateCronState } from './lib/supabase_cache'

export const config: Config = {
  schedule: '0 */12 * * *', // Every 12 hours
}

const SLUG_MAPPING: Record<string, { sport: string; league: string }> = {
  tennis_atp: { sport: 'tennis', league: 'atp-singles' },
  tennis_wta: { sport: 'tennis', league: 'wta-singles' },
  basketball_nba: { sport: 'basketball', league: 'usa-nba' },
  soccer_epl: { sport: 'football', league: 'england-premier-league' },
  soccer_efl_champ: { sport: 'football', league: 'england-championship' },
  soccer_spain_la_liga: { sport: 'football', league: 'spain-la-liga' },
  soccer_spain_segunda_division: { sport: 'football', league: 'spain-segunda-division' },
  soccer_italy_serie_a: { sport: 'football', league: 'italy-serie-a' },
  soccer_italy_serie_b: { sport: 'football', league: 'italy-serie-b' },
  soccer_germany_bundesliga: { sport: 'football', league: 'germany-bundesliga' },
  soccer_germany_bundesliga2: { sport: 'football', league: 'germany-2-bundesliga' },
  soccer_france_ligue_one: { sport: 'football', league: 'france-ligue-1' },
  soccer_france_ligue_two: { sport: 'football', league: 'france-ligue-2' },
  soccer_turkey_super_league: { sport: 'football', league: 'turkey-super-league' },
  soccer_greece_super_league: { sport: 'football', league: 'greece-super-league-1' },
  soccer_uefa_champs_league: { sport: 'football', league: 'uefa-champions-league' },
  soccer_uefa_europa_league: { sport: 'football', league: 'uefa-europa-league' },
  soccer_brazil_campeonato: { sport: 'football', league: 'brazil-serie-a' },
  soccer_brazil_serie_b: { sport: 'football', league: 'brazil-serie-b' },
  soccer_conmebol_libertadores: { sport: 'football', league: 'conmebol-libertadores' },
  soccer_conmebol_sudamericana: { sport: 'football', league: 'conmebol-sudamericana' },
  soccer_argentina_primera_division: { sport: 'football', league: 'argentina-primera-division' },
  soccer_usa_mls: { sport: 'football', league: 'usa-mls' },
}

const TARGET_LEAGUES = Object.keys(SLUG_MAPPING)

export const handler: Handler = async () => {
  console.log('--- Cron Sync Events Started ---')

  try {
    const keys = getOddsApiKeys()
    if (!keys || keys.length === 0) throw new Error('No API keys configured.')

    // We only need ONE key to fetch events structure. Let's use the first one.
    const primaryKey = keys[0].key

    const allEventIds: string[] = []

    for (const leagueKey of TARGET_LEAGUES) {
      const { sport, league } = SLUG_MAPPING[leagueKey]
      const url = `https://api.odds-api.io/v3/events?sport=${sport}&league=${league}&apiKey=${primaryKey}`
      try {
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`Error fetching events for ${leagueKey}: ${response.statusText}`)
          continue
        }

        const data = (await response.json()) as {
          id: string | number
          date: string
        }[]

        const now = new Date()
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

        for (const evt of data) {
          if (evt && evt.id && evt.date) {
            const commenceTime = new Date(evt.date)
            if (commenceTime >= now && commenceTime <= fortyEightHoursFromNow) {
              allEventIds.push(String(evt.id))
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${leagueKey}:`, err)
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
