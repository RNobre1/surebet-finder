import type { Handler, Config } from '@netlify/functions'
import { getOddsApiKeys } from './lib/api_keys'
import { updateCronState } from './lib/supabase_cache'

export const config: Config = {
  schedule: '0 */12 * * *', // Every 12 hours
}

// Keywords to identify "Premium" leagues (Fuzzy matching)
const PREMIUM_KEYWORDS = [
  'Premier League',
  'Championship',
  'La Liga',
  'Serie A',
  'Serie B',
  'Bundesliga',
  'Ligue 1',
  'Ligue 2',
  'Super League',
  'Champions League',
  'Europa League',
  'Campeonato Brasileiro',
  'Libertadores',
  'Sudamericana',
  'Primera Division',
  'MLS',
  'NBA',
  'NCAAB',
  'ATP',
  'WTA',
]

const MAJOR_SPORTS = ['football', 'tennis', 'basketball', 'volleyball', 'handball', 'ice-hockey']

export const handler: Handler = async () => {
  console.log('--- Cron Sync Events Started (Dynamic Mode) ---')

  try {
    const keys = getOddsApiKeys()
    if (!keys || keys.length === 0) throw new Error('No API keys configured.')

    const primaryKey = keys[0].key
    const allEventIds: string[] = []

    // 1. Fetch available sports
    const sportsRes = await fetch(`https://api.odds-api.io/v3/sports?apiKey=${primaryKey}`)
    if (!sportsRes.ok) throw new Error(`Failed to fetch sports: ${sportsRes.statusText}`)
    const sports = (await sportsRes.json()) as { name: string; slug: string }[]

    // 2. Filter for major sports
    const targetSports = sports.filter((s) => MAJOR_SPORTS.includes(s.slug))

    for (const sport of targetSports) {
      console.log(`Discovering leagues for ${sport.name}...`)

      // 3. Fetch leagues for this sport
      try {
        const leaguesRes = await fetch(
          `https://api.odds-api.io/v3/leagues?apiKey=${primaryKey}&sport=${sport.slug}`
        )
        if (!leaguesRes.ok) {
          console.error(`Failed to fetch leagues for ${sport.slug}: ${leaguesRes.statusText}`)
          continue
        }
        const leagues = (await leaguesRes.json()) as {
          name: string
          slug: string
          eventsCount: number
        }[]

        // 4. Identify target leagues (premium or with active events)
        const matches = leagues.filter((l) => {
          const isPremium = PREMIUM_KEYWORDS.some((kw) =>
            l.name.toLowerCase().includes(kw.toLowerCase())
          )
          return isPremium && l.eventsCount > 0
        })

        if (matches.length === 0) {
          console.log(`No specific premium leagues found for ${sport.name}. Skipping.`)
          continue
        }

        // 5. Fetch events for each matched league
        for (const league of matches) {
          console.log(`Fetching events for ${league.name} (${league.slug})...`)
          const url = `https://api.odds-api.io/v3/events?sport=${sport.slug}&league=${league.slug}&apiKey=${primaryKey}`

          try {
            const response = await fetch(url)
            if (!response.ok) {
              console.error(`Error fetching events for ${league.slug}: ${response.statusText}`)
              continue
            }

            const data = (await response.json()) as { id: string | number; date: string }[]
            if (!Array.isArray(data)) continue

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
            console.error(`Failed to fetch events for league ${league.slug}:`, err)
          }
        }
      } catch (err) {
        console.error(`Error processing sport ${sport.slug}:`, err)
      }
    }

    // Deduplicate IDs
    const uniqueIds = Array.from(new Set(allEventIds))

    console.log(`Synced a total of ${uniqueIds.length} events for the next 48h.`)

    // Save to cache
    await updateCronState('surebets_queue', {
      events: uniqueIds,
      total_events: uniqueIds.length,
      current_index: 0,
      last_sync: new Date().toISOString(),
    })

    return { statusCode: 200, body: `Synced ${uniqueIds.length} events dynamically` }
  } catch (err) {
    console.error('Error in cron_sync_events:', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
