import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FreeBetAlert } from '../../components/FreeBetAlert'
import type { FreeBet } from '../../types'

const makeFreeBet = (expiresAt: string, isUsed = false): FreeBet => ({
  id: 'fb-1',
  user_id: 'user-123',
  bookmaker: 'KTO',
  amount: 20,
  expires_at: expiresAt,
  is_used: isUsed,
  created_at: '2025-03-01T00:00:00Z',
})

describe('FreeBetAlert', () => {
  it('shows warning badge when expiring within 7 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))

    const freeBet = makeFreeBet('2025-03-19')
    render(<FreeBetAlert freeBet={freeBet} />)
    expect(screen.getByText(/vence em 2 dias?/i)).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('does not show warning for far-off expiry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))

    const freeBet = makeFreeBet('2025-04-30')
    render(<FreeBetAlert freeBet={freeBet} />)
    expect(screen.queryByText(/vence em/i)).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('shows "Expirada" for expired free bets', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-17T00:00:00Z'))

    const freeBet = makeFreeBet('2025-03-10')
    render(<FreeBetAlert freeBet={freeBet} />)
    expect(screen.getByText(/expirada/i)).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('shows bookmaker name and amount', () => {
    const freeBet = makeFreeBet('2025-12-31')
    render(<FreeBetAlert freeBet={freeBet} />)
    expect(screen.getByText(/KTO/i)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*20/i)).toBeInTheDocument()
  })

  it('shows "Utilizada" badge when is_used is true', () => {
    const freeBet = makeFreeBet('2025-12-31', true)
    render(<FreeBetAlert freeBet={freeBet} />)
    expect(screen.getByText(/utilizada/i)).toBeInTheDocument()
  })
})
