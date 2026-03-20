export interface OddsApiOutcome {
  name: string
  price: number
}

export interface OddsApiMarket {
  key: string
  outcomes: OddsApiOutcome[]
}

export interface OddsApiBookmaker {
  key: string
  title: string
  markets: OddsApiMarket[]
}

export interface OddsApiEvent {
  id: string
  sport_key: string
  home_team: string
  away_team: string
  bookmakers: OddsApiBookmaker[]
}

export interface InternalSurebetLeg {
  name: string
  price: number
  bookmaker: string
}

export interface InternalSurebet {
  eventId: string
  sportKey: string
  homeTeam: string
  awayTeam: string
  marketKey: string
  profitMargin: number // e.g., 0.05 for 5%
  legs: InternalSurebetLeg[]
  [key: string]: unknown
}

export function mergeAndCalculateSurebets(
  allEventsNested: OddsApiEvent[][]
): InternalSurebet[] {
  // 1. Flatten arrays
  const flattened = allEventsNested.flat()

  // 2. Group by Event ID
  const eventsById = new Map<string, OddsApiEvent>()

  for (const event of flattened) {
    if (!eventsById.has(event.id)) {
      // Deep clone or just assign the base structure but with empty bookies
      eventsById.set(event.id, {
        id: event.id,
        sport_key: event.sport_key,
        home_team: event.home_team,
        away_team: event.away_team,
        bookmakers: [], // will populate next
      })
    }
    const groupedEvent = eventsById.get(event.id)!
    // Append bookmakers from this specific API key fetch
    groupedEvent.bookmakers.push(...event.bookmakers)
  }

  const surebets: InternalSurebet[] = []

  // 3. Find surebets for each merged event
  for (const event of eventsById.values()) {
    // We must group by Market Key (e.g., 'h2h', 'spreads')
    // A single event can have multiple markets. We must check surebets per market.
    const marketsSet = new Set<string>()
    for (const bookie of event.bookmakers) {
      for (const market of bookie.markets) {
        marketsSet.add(market.key)
      }
    }

    // For each unique market in this event
    for (const marketKey of marketsSet.values()) {
      // Find the best odds for each possible outcome.
      // Example 'h2h': outcomes are typically "Team A", "Team B", maybe "Draw"
      const bestOddsPerOutcome = new Map<string, InternalSurebetLeg>()

      for (const bookie of event.bookmakers) {
        const market = bookie.markets.find((m) => m.key === marketKey)
        if (!market) continue

        for (const outcome of market.outcomes) {
          const currentBest = bestOddsPerOutcome.get(outcome.name)
          if (!currentBest || outcome.price > currentBest.price) {
            bestOddsPerOutcome.set(outcome.name, {
              name: outcome.name,
              price: outcome.price,
              bookmaker: bookie.title,
            })
          }
        }
      }

      // Check if it's a valid complete market
      // Minimal check: a market should have at least 2 outcomes to form a surebet
      if (bestOddsPerOutcome.size < 2) continue

      // Calculate the implied probability sum
      let sumProbabilities = 0
      const legs: InternalSurebetLeg[] = []

      for (const leg of bestOddsPerOutcome.values()) {
        sumProbabilities += 1 / leg.price
        legs.push(leg)
      }

      // If sum < 1.0, it denotes a surebet!
      if (sumProbabilities < 1.0) {
        // Profit margin decimal:
        const profitMargin = 1 / sumProbabilities - 1

        surebets.push({
          eventId: event.id,
          sportKey: event.sport_key,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          marketKey: marketKey,
          profitMargin: profitMargin,
          legs: legs,
        })
      }
    }
  }

  return surebets
}
