import { describe, it, expect } from 'vitest'
import {
  normalizeEv,
  formatEvPercentage,
  getTrueOdds,
  removeDuplicateValueBets,
} from '../../utils/valueBetsUtils'

describe('Value Bets Utils', () => {
  describe('normalizeEv', () => {
    it('subtrai 100 do valor bruto da API para obter o EV real em %', () => {
      // A API retorna 118.8 → significa 18.8% de valor acima do justo
      expect(normalizeEv(118.8)).toBeCloseTo(18.8, 2)
      expect(normalizeEv(105.2)).toBeCloseTo(5.2, 2)
      expect(normalizeEv(100.0)).toBeCloseTo(0, 2)
    })

    it('funciona com valores abaixo de 100 (sem valor)', () => {
      expect(normalizeEv(97.5)).toBeCloseTo(-2.5, 2)
    })
  })

  describe('formatEvPercentage', () => {
    it('formata EV de ponto flutuante em string amigavel com 2 casas', () => {
      expect(formatEvPercentage(5.234)).toBe('+5.23%')
      expect(formatEvPercentage(-2.153)).toBe('-2.15%')
      expect(formatEvPercentage(0)).toBe('0.00%')
    })
  })

  describe('getTrueOdds', () => {
    it('calcula true odds corretamente: trueOdds = bookmakerOdds / (1 + ev/100)', () => {
      // EV = 18.8% (API retorna 118.8, normalizeEv retorna 18.8)
      // trueOdds = 3.30 / (1 + 0.188) = 3.30 / 1.188 ≈ 2.78
      expect(getTrueOdds(3.3, 18.8)).toBeCloseTo(2.78, 1)
      // EV = 5%: trueOdds = 2.10 / 1.05 ≈ 2.00
      expect(getTrueOdds(2.1, 5.0)).toBeCloseTo(2.0, 2)
    })

    it('retorna 0 quando odds são 0', () => {
      expect(getTrueOdds(0, 5)).toBe(0)
    })
  })

  describe('removeDuplicateValueBets', () => {
    it('remove value bets que contenham o mesmo eventId, mercado e lado sendo apostado na mesma casa', () => {
      const mockBets = [
        {
          id: '1',
          eventId: '99',
          bookmaker: 'Bet365',
          betSide: 'home',
          market: { name: 'ML' },
          expectedValue: 5,
        },
        {
          id: '2',
          eventId: '99',
          bookmaker: 'Bet365',
          betSide: 'home',
          market: { name: 'ML' },
          expectedValue: 5,
        },
        {
          id: '3',
          eventId: '99',
          bookmaker: 'Bet365',
          betSide: 'away',
          market: { name: 'ML' },
          expectedValue: 10,
        },
      ]

      const deduplicated = removeDuplicateValueBets(mockBets)
      expect(deduplicated).toHaveLength(2)
      expect(deduplicated[0].id).toBe('1')
      expect(deduplicated[1].betSide).toBe('away')
    })
  })
})
