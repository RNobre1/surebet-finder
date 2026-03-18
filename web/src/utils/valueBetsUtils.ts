/**
 * A API retorna `expectedValue` como percentual bruto da razão entre a odd da casa e a odd justa.
 * Ex: 118.8 significa que a odd é 118.8% da justa (18.8% de valor acima do justo).
 * Para obter o EV% real, subtraímos 100.
 * Ex: 118.8 → 18.8% de EV
 */
export function normalizeEv(expectedValue: number): number {
  return expectedValue - 100
}

export function formatEvPercentage(evPercent: number): string {
  const prefix = evPercent > 0 ? '+' : ''
  return `${prefix}${evPercent.toFixed(2)}%`
}

/**
 * True odds = bookmakerOdds / (1 + EV/100)
 * Com EV = 18.8%: trueOdds = 3.30 / 1.188 = 2.78 ✓
 */
export function getTrueOdds(bookmakerOdds: number, evPercent: number): number {
  if (!bookmakerOdds) return bookmakerOdds
  const evDecimal = evPercent / 100
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
    const key = `${bet.eventId}-${bet.bookmaker}-${bet.market?.name}-${bet.betSide}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Gera um label legível para a linha de aposta baseado nos dados da API.
 * Exemplos:
 *  - ML home  → "Manchester United (Vitória)"
 *  - Totals over, hdp 2.5 → "Over 2.5 Gols"
 *  - Spread home, hdp -0.5 → "Handicap -0.5 (Manchester United)"
 */
export function getBetLabel(params: {
  marketName: string
  betSide: string
  hdp?: number | null
  home?: string
  away?: string
}): string {
  const { marketName, betSide, hdp, home, away } = params
  const market = marketName?.toUpperCase()

  // Moneyline / 1X2
  if (market === 'ML' || market === '1X2') {
    if (betSide === 'home') return `${home || 'Casa'} (Vitória)`
    if (betSide === 'away') return `${away || 'Visitante'} (Vitória)`
    if (betSide === 'draw') return 'Empate'
    return betSide
  }

  // Totals / Over-Under
  if (market === 'TOTALS' || market === 'TOTAL') {
    const line = hdp != null ? hdp : ''
    if (betSide === 'over' || betSide === 'home') return `Over ${line} Gols`
    if (betSide === 'under' || betSide === 'away') return `Under ${line} Gols`
    return `Totais ${line} (${betSide})`
  }

  // Spread / Handicap Asiático
  if (market === 'SPREAD' || market === 'HANDICAP' || market === 'AH') {
    const sign = hdp != null && hdp > 0 ? '+' : ''
    const line = hdp != null ? `${sign}${hdp}` : ''
    if (betSide === 'home') return `Handicap ${line} ${home ? `(${home})` : '(Casa)'}`
    if (betSide === 'away') return `Handicap ${line} ${away ? `(${away})` : '(Visitante)'}`
    return `Handicap ${line} (${betSide})`
  }

  // Corners, Cards, etc. (mercados compostos)
  if (market.includes('CORNER')) {
    const line = hdp != null ? hdp : ''
    if (betSide === 'over' || betSide === 'home') return `Over ${line} Escanteios`
    if (betSide === 'under' || betSide === 'away') return `Under ${line} Escanteios`
    return `${marketName} (${betSide})`
  }
  if (market.includes('CARD')) {
    const line = hdp != null ? hdp : ''
    if (betSide === 'over' || betSide === 'home') return `Over ${line} Cartões`
    if (betSide === 'under' || betSide === 'away') return `Under ${line} Cartões`
    return `${marketName} (${betSide})`
  }

  // Fallback genérico
  const side =
    betSide === 'home' ? home || 'Casa' : betSide === 'away' ? away || 'Visitante' : betSide
  return `${marketName}${hdp != null ? ` ${hdp > 0 ? '+' : ''}${hdp}` : ''} — ${side}`
}
