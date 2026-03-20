import { expect, describe, it } from 'vitest'
import { mergeAndCalculateSurebets } from '../../netlify/functions/lib/surebet_calculator'

describe('Surebet Calculator (Cross-Bookmaker)', () => {
  it('should find a profitable surebet across two bookmakers in a 2-way market', () => {
    const eventsKey1 = [
      {
        id: 'evt-123',
        sport_key: 'tennis_atp',
        home_team: 'Nadal',
        away_team: 'Federer',
        bookmakers: [
          {
            key: 'betano',
            title: 'Betano',
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: 'Nadal', price: 2.10 },
                  { name: 'Federer', price: 1.70 },
                ],
              },
            ],
          },
        ],
      },
    ]

    const eventsKey2 = [
      {
        id: 'evt-123',
        sport_key: 'tennis_atp',
        home_team: 'Nadal',
        away_team: 'Federer',
        bookmakers: [
          {
            key: 'betfair_ex_uk',
            title: 'Betfair',
            markets: [
              {
                key: 'h2h',
                outcomes: [
                  { name: 'Nadal', price: 1.80 },
                  { name: 'Federer', price: 2.15 },
                ],
              },
            ],
          },
        ],
      },
    ]

    // Margem: 1/2.10 (Betano) + 1/2.15 (Betfair) = 0.476 + 0.465 = 0.941 (Lucro de ~6.2%)
    const surebets = mergeAndCalculateSurebets([eventsKey1, eventsKey2])

    expect(surebets).toHaveLength(1)
    expect(surebets[0].profitMargin).toBeGreaterThan(0.06)
    expect(surebets[0].profitMargin).toBeLessThan(0.07) // ~6.2%
    expect(surebets[0].legs).toHaveLength(2)
    
    // Assegurar que ele pegou a odd exata em cada casa
    const nadalLeg = surebets[0].legs.find(l => l.name === 'Nadal')
    const federerLeg = surebets[0].legs.find(l => l.name === 'Federer')
    
    expect(nadalLeg?.bookmaker).toBe('Betano')
    expect(nadalLeg?.price).toBe(2.10)
    
    expect(federerLeg?.bookmaker).toBe('Betfair')
    expect(federerLeg?.price).toBe(2.15)
  })

  it('should not return anything if combined odds do not yield a surebet', () => {
    const eventsKey1 = [
        {
          id: 'evt-123',
          sport_key: 'tennis_atp',
          home_team: 'Nadal',
          away_team: 'Federer',
          bookmakers: [
            {
              key: 'betano',
              title: 'Betano',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    { name: 'Nadal', price: 1.80 },
                    { name: 'Federer', price: 1.80 },
                  ],
                },
              ],
            },
          ],
        },
      ]
  
      const eventsKey2 = [
        {
          id: 'evt-123',
          sport_key: 'tennis_atp',
          home_team: 'Nadal',
          away_team: 'Federer',
          bookmakers: [
            {
              key: 'betfair_ex_uk',
              title: 'Betfair',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    { name: 'Nadal', price: 1.90 },
                    { name: 'Federer', price: 1.90 },
                  ],
                },
              ],
            },
          ],
        },
      ]
  
      const surebets = mergeAndCalculateSurebets([eventsKey1, eventsKey2])
      expect(surebets).toHaveLength(0) // 1/1.9 + 1/1.9 = 1.05 (> 1, sem lucro)
  })

  it('should handle 3-way markets (1X2) correctly', () => {
    const eventsKey1 = [
        {
          id: 'evt-999',
          sport_key: 'soccer_epl',
          home_team: 'Chelsea',
          away_team: 'Arsenal',
          bookmakers: [
            {
              key: 'betano',
              title: 'Betano',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    { name: 'Chelsea', price: 3.50 }, // Home
                    { name: 'Arsenal', price: 2.10 }, // Away
                    { name: 'Draw', price: 3.00 },    // Draw
                  ],
                },
              ],
            },
          ],
        },
      ]
  
      const eventsKey2 = [
        {
          id: 'evt-999',
          sport_key: 'soccer_epl',
          home_team: 'Chelsea',
          away_team: 'Arsenal',
          bookmakers: [
            {
              key: 'sportingbet',
              title: 'Sportingbet',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    { name: 'Chelsea', price: 2.80 },
                    { name: 'Arsenal', price: 3.30 }, // Away (Bet on Arsenal here)
                    { name: 'Draw', price: 3.60 },    // Draw (Bet on Draw here)
                  ],
                },
              ],
            },
          ],
        },
      ]

      // Combinacao: 
      // Chelsea: 3.50 (Betano) -> 1/3.50 = 0.2857
      // Arsenal: 3.30 (Sportingbet) -> 1/3.30 = 0.3030
      // Draw: 3.60 (Sportingbet) -> 1/3.60 = 0.2777
      // Sum = 0.8664 -> Margem = 1 / 0.8664 = 1.1542 (Lucro de ~15.4%)
  
      const surebets = mergeAndCalculateSurebets([eventsKey1, eventsKey2])
      expect(surebets).toHaveLength(1)
      expect(surebets[0].profitMargin).toBeGreaterThan(0.15)
      expect(surebets[0].profitMargin).toBeLessThan(0.16) 
      expect(surebets[0].legs).toHaveLength(3)

      const drawLeg = surebets[0].legs.find(l => l.name === 'Draw')
      expect(drawLeg?.bookmaker).toBe('Sportingbet')
      expect(drawLeg?.price).toBe(3.60)
  })
})
