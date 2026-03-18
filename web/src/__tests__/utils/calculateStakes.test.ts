import { describe, it, expect } from 'vitest'
import { calculateStakes, calculateProfitMargin } from '../../utils/calculateStakes'
import type { SurebetLeg } from '../../types'

const legHome: SurebetLeg = { bookmaker: 'Betano', side: 'home', label: 'Team A', odds: '2.10' }
const legAway: SurebetLeg = { bookmaker: 'Bet365', side: 'away', label: 'Team B', odds: '2.05' }

describe('calculateStakes', () => {
  it('returns empty array when no legs', () => {
    expect(calculateStakes([], 100)).toEqual([])
  })

  it('returns empty array when bankroll is 0', () => {
    expect(calculateStakes([legHome, legAway], 0)).toEqual([])
  })

  it('returns empty array when odds sum >= 1 (no arbitrage)', () => {
    const legs: SurebetLeg[] = [
      { bookmaker: 'A', side: 'home', label: 'H', odds: '1.50' },
      { bookmaker: 'B', side: 'away', label: 'A', odds: '1.50' },
    ]
    // implied = 1/1.5 + 1/1.5 = 1.333 → not an arb
    expect(calculateStakes(legs, 100)).toEqual([])
  })

  it('calculates correct stakes for a 2-leg surebet', () => {
    // implied = 1/2.10 + 1/2.05 = 0.4762 + 0.4878 = 0.9640 → arb!
    const result = calculateStakes([legHome, legAway], 100)
    expect(result).toHaveLength(2)
    // Each potentialReturn should be approximately equal (arbitrage guarantee)
    const returnHome = result[0].potentialReturn
    const returnAway = result[1].potentialReturn
    expect(Math.abs(returnHome - returnAway)).toBeLessThan(0.1)
    // All stakes sum close to bankroll
    const totalStake = result.reduce((s, r) => s + r.stake, 0)
    expect(totalStake).toBeCloseTo(100, 0)
  })

  it('assigns correct bookmaker and side to each result', () => {
    const result = calculateStakes([legHome, legAway], 100)
    expect(result[0].bookmaker).toBe('Betano')
    expect(result[0].side).toBe('home')
    expect(result[1].bookmaker).toBe('Bet365')
    expect(result[1].side).toBe('away')
  })
})

describe('calculateProfitMargin', () => {
  it('returns positive margin for a valid 2-leg surebet', () => {
    const margin = calculateProfitMargin([legHome, legAway])
    expect(margin).toBeGreaterThan(0)
    expect(margin).toBeLessThan(5) // should be a small positive %
  })

  it('returns 0 for empty legs', () => {
    expect(calculateProfitMargin([])).toBe(0)
  })

  it('returns negative or ~0 for non-arbitrage odds', () => {
    const legs: SurebetLeg[] = [
      { bookmaker: 'A', side: 'home', label: 'H', odds: '1.50' },
      { bookmaker: 'B', side: 'away', label: 'A', odds: '1.50' },
    ]
    const margin = calculateProfitMargin(legs)
    expect(margin).toBeLessThan(0)
  })
})
