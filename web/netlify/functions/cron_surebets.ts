import type { Handler, Config } from '@netlify/functions'
import { getOddsApiKeys } from './lib/api_keys'
import { getCronState, updateCronState, saveSurebets } from './lib/supabase_cache'
import { mergeAndCalculateSurebets, type OddsApiEvent } from './lib/surebet_calculator'

export const config: Config = {
  schedule: '*/5 * * * *', // Trigger every 5 mins, throttling handled internally
}

// 94 available points per key per hour (after 6 points reserved for ValueBets)
const MAX_POINTS_PER_HOUR = 94

export const handler: Handler = async () => {
  console.log('--- Cron Surebets Started ---')

  try {
    const state = await getCronState('surebets_queue')
    if (!state || !state.events || state.events.length === 0) {
      console.log('No events in queue. Awaiting cron_sync_events.')
      return { statusCode: 200, body: 'No events' }
    }

    const allEvents: string[] = state.events
    // Cap at 230 events to guarantee we can run at least every 15 mins (23 reqs * 4 runs = 92)
    const activeEvents = allEvents.slice(0, 230)
    const reqsPerRun = Math.ceil(activeEvents.length / 10) // 10 events per multi request

    // Throttling Logic
    const maxRunsPerHour = Math.floor(MAX_POINTS_PER_HOUR / reqsPerRun)
    const minMinutesBetweenRuns = Math.ceil(60 / maxRunsPerHour)

    const now = new Date()
    if (state.last_run) {
      const lastRun = new Date(state.last_run)
      const diffMinutes = (now.getTime() - lastRun.getTime()) / 60000

      if (diffMinutes < minMinutesBetweenRuns) {
        console.log(
          `Throttled: ${
            activeEvents.length
          } events require ${minMinutesBetweenRuns}m interval. Ran ${diffMinutes.toFixed(1)}m ago.`
        )
        return { statusCode: 200, body: 'Throttled to save API quota' }
      }
    }

    // Execution time!
    const keys = getOddsApiKeys()
    if (!keys || keys.length === 0) throw new Error('No API keys configured.')

    // Break activeEvents into chunks of 10
    const chunks: string[][] = []
    for (let i = 0; i < activeEvents.length; i += 10) {
      chunks.push(activeEvents.slice(i, i + 10))
    }

    const allKeysPromises = keys.map(async (keyConfig) => {
      const bookmakers = keyConfig.bookmakers.join(',')
      const keyEvents: Record<string, unknown>[] = []

      // We must fetch each chunk using this key
      for (const chunk of chunks) {
        const eventIds = chunk.join(',')
        const url = `https://api.odds-api.io/v3/odds/multi?eventIds=${eventIds}&bookmakers=${bookmakers}&apiKey=${keyConfig.key}`
        try {
          const response = await fetch(url)
          if (!response.ok) continue
          const json = (await response.json()) as { data?: unknown[] }
          const data = Array.isArray(json) ? json : json.data || []
          keyEvents.push(...(data as Record<string, unknown>[]))
        } catch (err) {
          console.error(`Failed to fetch chunk for ${keyConfig.key}:`, err)
        }
      }

      return keyEvents
    })

    const allKeyResults = await Promise.all(allKeysPromises)

    // Calculate surebets combining the arrays from all keys
    const calculatedSurebets = mergeAndCalculateSurebets(
      allKeyResults as unknown as OddsApiEvent[][]
    )
    console.log(
      `Calculated ${calculatedSurebets.length} surebets across ${activeEvents.length} events.`
    )

    // Save active surebets
    await saveSurebets(calculatedSurebets)

    // Update state to register the run time
    await updateCronState('surebets_queue', {
      events: allEvents, // Keep full pool intact
      last_run: now.toISOString(),
    })

    return {
      statusCode: 200,
      body: `Matched ${calculatedSurebets.length} surebets`,
    }
  } catch (err) {
    console.error('Error in cron_surebets:', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
