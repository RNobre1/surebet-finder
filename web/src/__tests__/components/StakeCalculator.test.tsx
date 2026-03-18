import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StakeCalculator } from '../../components/surebets/StakeCalculator'
import type { ApiSurebet } from '../../types'

const mockSurebet: ApiSurebet = {
  id: 'arb-1',
  eventId: 123,
  market: { name: 'ML' },
  impliedProbability: 98.5,
  profitMargin: 1.52,
  totalStake: 100,
  updatedAt: new Date().toISOString(),
  legs: [
    { bookmaker: 'Betano', side: 'home', label: 'Team A', odds: '2.10' },
    { bookmaker: 'Bet365', side: 'away', label: 'Team B', odds: '2.05' },
  ],
  optimalStakes: [],
}

describe('StakeCalculator', () => {
  it('renders input field and calculate button', () => {
    render(<StakeCalculator surebet={mockSurebet} />)
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /calcular/i })).toBeInTheDocument()
  })

  it('shows stakes for each bookmaker after calculation', () => {
    render(<StakeCalculator surebet={mockSurebet} />)
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: /calcular/i }))

    expect(screen.getByText(/Betano/i)).toBeInTheDocument()
    expect(screen.getByText(/Bet365/i)).toBeInTheDocument()
    // Stake values should appear
    expect(screen.getAllByText(/R\$/i).length).toBeGreaterThan(0)
  })

  it('does not show results before calculation', () => {
    render(<StakeCalculator surebet={mockSurebet} />)
    expect(screen.queryByText(/Betano/i)).not.toBeInTheDocument()
  })

  it('calls onSave when save button is clicked after calculation', () => {
    const onSave = vi.fn()
    render(<StakeCalculator surebet={mockSurebet} onSave={onSave} />)
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '200' } })
    fireEvent.click(screen.getByRole('button', { name: /calcular/i }))
    const saveBtn = screen.getByRole('button', { name: /salvar/i })
    fireEvent.click(saveBtn)
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ totalBankroll: 200 }))
  })
})
