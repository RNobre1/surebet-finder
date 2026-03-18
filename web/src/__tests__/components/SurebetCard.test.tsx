import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SurebetCard } from '../../components/surebets/SurebetCard'
import type { ApiSurebet } from '../../types'

const mockSurebet: ApiSurebet = {
  id: 'arb-1',
  eventId: 123,
  market: { name: 'ML' },
  impliedProbability: 98.5,
  profitMargin: 1.52,
  totalStake: 100,
  updatedAt: '2025-10-15T10:30:00Z',
  legs: [
    { bookmaker: 'Betano', side: 'home', label: 'Team A', odds: '2.10' },
    { bookmaker: 'Bet365', side: 'away', label: 'Team B', odds: '2.05' },
  ],
  optimalStakes: [],
  event: {
    home: 'Manchester United',
    away: 'Liverpool',
    date: '2025-10-15T15:00:00Z',
    league: 'Premier League',
    sport: 'football',
  },
}

describe('SurebetCard', () => {
  it('renders event name (home vs away)', () => {
    render(<SurebetCard surebet={mockSurebet} />)
    expect(screen.getByText(/Manchester United/i)).toBeInTheDocument()
    expect(screen.getByText(/Liverpool/i)).toBeInTheDocument()
  })

  it('renders profit margin as percentage', () => {
    render(<SurebetCard surebet={mockSurebet} />)
    expect(screen.getByText(/1,52%/i)).toBeInTheDocument()
  })

  it('renders each bookmaker name from legs', () => {
    render(<SurebetCard surebet={mockSurebet} />)
    expect(screen.getByText(/Betano/i)).toBeInTheDocument()
    expect(screen.getByText(/Bet365/i)).toBeInTheDocument()
  })

  it('renders odds for each leg', () => {
    render(<SurebetCard surebet={mockSurebet} />)
    expect(screen.getByText(/2\.10/)).toBeInTheDocument()
    expect(screen.getByText(/2\.05/)).toBeInTheDocument()
  })

  it('renders league and sport', () => {
    render(<SurebetCard surebet={mockSurebet} />)
    expect(screen.getByText(/Premier League/i)).toBeInTheDocument()
  })

  it('renders market name', () => {
    render(<SurebetCard surebet={mockSurebet} />)
    expect(screen.getByText(/ML/i)).toBeInTheDocument()
  })
})
