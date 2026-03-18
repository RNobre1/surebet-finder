import type { SurebetLeg, OptimalStake } from '../types'

/**
 * Calculates optimal stakes for each leg of a surebet given a total bankroll.
 * Formula per leg: stake_i = totalBankroll * (1/odds_i) / impliedProbabilitySum
 *
 * @param legs - Array of surebet legs with odds
 * @param totalBankroll - Total amount to invest across all legs
 * @returns Array of {side, bookmaker, stake, potentialReturn} or the API's optimalStakes scaled
 */
export function calculateStakes(legs: SurebetLeg[], totalBankroll: number): OptimalStake[] {
  if (!legs || legs.length === 0 || totalBankroll <= 0) return []

  const impliedSum = legs.reduce((sum, leg) => {
    const odds = parseFloat(leg.odds)
    return isNaN(odds) || odds <= 0 ? sum : sum + 1 / odds
  }, 0)

  if (impliedSum <= 0 || impliedSum >= 1) return []

  return legs.map((leg) => {
    const odds = parseFloat(leg.odds)
    if (isNaN(odds) || odds <= 0) {
      return { bookmaker: leg.bookmaker, side: leg.side, stake: 0, potentialReturn: 0 }
    }
    const stake = (totalBankroll * (1 / odds)) / impliedSum
    const potentialReturn = stake * odds
    return {
      bookmaker: leg.bookmaker,
      side: leg.side,
      stake: parseFloat(stake.toFixed(2)),
      potentialReturn: parseFloat(potentialReturn.toFixed(2)),
    }
  })
}

/**
 * Calculates the profit margin given a list of legs (implied probability sum).
 * A positive margin means guaranteed profit.
 */
export function calculateProfitMargin(legs: SurebetLeg[]): number {
  const impliedSum = legs.reduce((sum, leg) => {
    const odds = parseFloat(leg.odds)
    return isNaN(odds) || odds <= 0 ? sum : sum + 1 / odds
  }, 0)
  if (impliedSum <= 0) return 0
  return parseFloat(((1 - impliedSum) * 100).toFixed(4))
}
