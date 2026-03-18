import { describe, it, expect } from 'vitest'
import {
  normalizeEv,
  formatEvPercentage,
  getTrueOdds,
  removeDuplicateValueBets,
} from '../../utils/valueBetsUtils'

describe('Value Bets Utils', () => {
  describe('normalizeEv', () => {
    it('mantém o valor original se ele já vier em base percentual normalizada pela API (ex: 5.2 significa 5.2%)', () => {
      // Diferente de multiplicá-lo por 100 incorretamente
      expect(normalizeEv(5.2)).toBe(5.2)
      expect(normalizeEv(-2.1)).toBe(-2.1)
    })

    it('limita EVs obviamente quebrados na API (acima de 1000%) ou retorna eles corrigidos (opcional, aqui mantemos intactos se estiver no formato numérico sem multx100)', () => {
      expect(normalizeEv(134.05)).toBe(134.05)
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
    it('calcula true odds corretamente baseando-se na expected_value e apostas', () => {
      // EV = (Odds / TrueOdds) - 1 => TrueOdds = Odds / (1 + EV)
      // Usando EV de 5% (0.05 decimal) e odd 2.10
      expect(getTrueOdds(2.1, 5.0)).toBeCloseTo(2.0, 2)
    })

    it('lida graciosamente com odds vazias', () => {
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
