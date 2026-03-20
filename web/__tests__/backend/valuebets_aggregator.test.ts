import { describe, it, expect } from 'vitest'
import { aggregateValueBets, AggregatedValueBet } from '../../netlify/functions/lib/valuebets_aggregator'

describe('ValueBets Aggregator', () => {
  it('should format and flag the highest EV for the same event and market outcome', () => {
    const key1Bets = [
      {
        id: 'vb-1',
        eventId: 'evt-111',
        sportKey: 'tennis_atp',
        bookmaker: 'betano',
        betSide: 'home',
        expectedValue: 0.05, // 5%
        market: { name: 'h2h', home: 'Nadal', away: 'Federer' },
        bookmakerOdds: { home: 1.9 }
      }
    ]

    const key2Bets = [
      {
        id: 'vb-2',
        eventId: 'evt-111',
        sportKey: 'tennis_atp',
        bookmaker: 'betfair',
        betSide: 'home',
        expectedValue: 0.08, // 8% - Better!
        market: { name: 'h2h', home: 'Nadal', away: 'Federer' },
        bookmakerOdds: { home: 2.1 }
      },
      {
        id: 'vb-3',
        eventId: 'evt-111',
        sportKey: 'tennis_atp',
        bookmaker: 'betfair',
        betSide: 'away',
        expectedValue: 0.04, // 4% - Only one for Federer
        market: { name: 'h2h', home: 'Nadal', away: 'Federer' },
        bookmakerOdds: { away: 2.5 }
      }
    ]

    // @ts-ignore - Mocking partial ApiValueBet
    const aggregated = aggregateValueBets([key1Bets, key2Bets])

    expect(aggregated).toHaveLength(3)
    
    // Check flags
    const betanoNadal = aggregated.find(b => b.bookmaker === 'betano' && b.betSide === 'home')
    const betfairNadal = aggregated.find(b => b.bookmaker === 'betfair' && b.betSide === 'home')
    const betfairFederer = aggregated.find(b => b.betSide === 'away')

    expect(betfairNadal?.is_highest_ev).toBe(true) // 8% > 5%
    expect(betanoNadal?.is_highest_ev).toBe(false)
    expect(betfairFederer?.is_highest_ev).toBe(true) // Only one for away, so it's the best by default
  })

  it('should deduplicate EXACT same values if they happen to exist across arrays', () => {
    const bet1 = {
      id: 'vb-99',
      eventId: 'evt-111',
      sportKey: 'tennis_atp',
      bookmaker: 'betano',
      betSide: 'home',
      expectedValue: 0.05,
      market: { name: 'h2h' },
      bookmakerOdds: { home: 1.9 }
    }

    const aggregated = aggregateValueBets([[bet1], [bet1]])
    
    expect(aggregated).toHaveLength(1) // Deduped to 1
  })
})
