export interface InternalValueBet {
  id: string
  eventId: string | number
  bookmaker: string
  betSide: string
  expectedValue: number
  market: any
  bookmakerOdds: any
  sportKey: string
  is_highest_ev?: boolean
}

export function aggregateValueBets(
  allValueBetsNested: InternalValueBet[][]
): InternalValueBet[] {
  // Flatten array
  const flattened: InternalValueBet[] = allValueBetsNested.flat()

  // Deduplicate exact matches (same id or same (eventId + bookmaker + betSide + market.name))
  const uniqueBets = new Map<string, InternalValueBet>()

  for (const bet of flattened) {
    // some APIs return a unique ID `bet.id`, but if it's the same across keys we use it.
    // robust key:
    const uniqueKey =
      bet.id ||
      `${bet.eventId}-${bet.bookmaker}-${bet.betSide}-${bet.market?.name}-${bet.expectedValue}`
    if (!uniqueBets.has(uniqueKey)) {
      uniqueBets.set(uniqueKey, bet)
    }
  }

  const allBets = Array.from(uniqueBets.values())

  // Group by event + market + betSide to find the best EV
  const groups = new Map<string, InternalValueBet[]>()

  for (const bet of allBets) {
    const groupKey = `${bet.eventId}-${bet.market?.name}-${bet.betSide}`
    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(bet)
  }

  // Determine highest EV for each group
  for (const group of groups.values()) {
    if (group.length === 0) continue

    // Find the max expected value in this group
    let maxEvBet = group[0]
    for (const bet of group) {
      if (bet.expectedValue > maxEvBet.expectedValue) {
        maxEvBet = bet
      }
      // Initialize all as false
      bet.is_highest_ev = false
    }

    // Flag the best one
    maxEvBet.is_highest_ev = true
  }

  return allBets
}
