export function normalizeEv(expectedValue: number): number {
  return expectedValue
}

export function formatEvPercentage(expectedValue: number): string {
  const prefix = expectedValue > 0 ? '+' : ''
  return `${prefix}${expectedValue.toFixed(2)}%`
}

export function getTrueOdds(bookmakerOdds: number, expectedValuePercentage: number): number {
  if (!bookmakerOdds || expectedValuePercentage === undefined) return bookmakerOdds

  // Expected Value formula: EV = (Odds / TrueOdds) - 1
  // TrueOdds = Odds / (EV + 1)
  // Note: expectedValuePercentage is in percentage (e.g., 5.0 for 5%), so we divide by 100
  const evDecimal = expectedValuePercentage / 100
  return bookmakerOdds / (evDecimal + 1)
}

export function removeDuplicateValueBets<
  T extends {
    eventId?: string | number
    bookmaker?: string
    market?: { name?: string }
    betSide?: string
  },
>(bets: T[]): T[] {
  const seen = new Set<string>()
  return bets.filter((bet) => {
    // Unique key based on event, bookmaker, market and side
    const key = `${bet.eventId}-${bet.bookmaker}-${bet.market?.name}-${bet.betSide}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
