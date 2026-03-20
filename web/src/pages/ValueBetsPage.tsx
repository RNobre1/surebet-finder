import { useState } from 'react'
import { TrendingUp, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { useValueBets } from '../hooks/useValueBets'
import { formatDateTime } from '../utils/formatDate'
import { ValueBetsFilters } from '../components/valuebets/ValueBetsFilters'
import { Pagination } from '../components/ui/Pagination'
import { normalizeEv, formatEvPercentage, getTrueOdds, getBetLabel } from '../utils/valueBetsUtils'

const MONITORED_BOOKMAKERS = ['Betano', 'Bet365']
const ITEMS_PER_PAGE = 15

export function ValueBetsPage() {
  const { valueBets, loading, error, fetch } = useValueBets()
  const [hasFetched, setHasFetched] = useState(false)

  // Selects filters
  const [sportFilter, setSportFilter] = useState('All')
  const [bookmakerFilter, setBookmakerFilter] = useState('All')
  const [marketFilter, setMarketFilter] = useState('All')

  // Date range
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Slider filters
  const [minEvFilter, setMinEvFilter] = useState(0)
  const [maxEvFilter, setMaxEvFilter] = useState(100)
  const [minOddFilter, setMinOddFilter] = useState(1.0)
  const [maxOddFilter, setMaxOddFilter] = useState(100)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  const handleFetch = async () => {
    setCurrentPage(1)
    await fetch()
    setHasFetched(true)
  }

  const handleReset = () => {
    setSportFilter('All')
    setBookmakerFilter('All')
    setMarketFilter('All')
    setDateFrom('')
    setDateTo('')
    setMinEvFilter(0)
    setMaxEvFilter(sliderMaxEv)
    setMinOddFilter(1.0)
    setMaxOddFilter(sliderMaxOdd)
    setCurrentPage(1)
  }

  // Dynamic filter options
  const availableSports = Array.from(new Set(valueBets.map((vb) => vb.event?.sport || 'Unknown')))
  const availableBookmakers = Array.from(new Set(valueBets.map((vb) => vb.bookmaker)))
  const availableMarkets = Array.from(
    new Set(valueBets.map((vb) => vb.market?.name).filter(Boolean) as string[])
  )

  // Dynamic slider max values
  const sliderMaxEv = (() => {
    if (valueBets.length === 0) return 30
    return Math.ceil(Math.max(...valueBets.map((vb) => normalizeEv(vb.expectedValue ?? 0))))
  })()

  const sliderMaxOdd = (() => {
    if (valueBets.length === 0) return 10
    return Math.ceil(
      Math.max(
        ...valueBets.map(
          (vb) => Number(vb.bookmakerOdds?.[vb.betSide as keyof typeof vb.bookmakerOdds]) || 1
        )
      )
    )
  })()

  // Apply all filters
  const filteredBets = valueBets.filter((vb) => {
    if (sportFilter !== 'All' && vb.event?.sport !== sportFilter) return false
    if (bookmakerFilter !== 'All' && vb.bookmaker !== bookmakerFilter) return false
    if (marketFilter !== 'All' && vb.market?.name !== marketFilter) return false

    // Date range
    if (vb.event?.date) {
      const eventDate = new Date(vb.event.date)
      if (dateFrom && eventDate < new Date(dateFrom)) return false
      if (dateTo && eventDate > new Date(dateTo + 'T23:59:59')) return false
    }

    // EV%
    const ev = normalizeEv(vb.expectedValue ?? 0)
    if (ev < minEvFilter || ev > maxEvFilter) return false

    // Odds
    const odd = Number(vb.bookmakerOdds?.[vb.betSide as keyof typeof vb.bookmakerOdds]) || 0
    if (odd > 0 && (odd < minOddFilter || odd > maxOddFilter)) return false

    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredBets.length / ITEMS_PER_PAGE)
  const paginatedBets = filteredBets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Value Bets</h1>
          <p className="text-sm text-slate-400 mt-1">Apostas com valor esperado positivo</p>
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-500 disabled:opacity-60 transition-all"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Buscando...' : 'Buscar Value Bets'}
        </button>
      </div>

      {/* Bookmakers info */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3">
        <TrendingUp size={16} className="text-purple-400 shrink-0" />
        <span className="text-sm text-slate-300">
          Monitorando:{' '}
          {MONITORED_BOOKMAKERS.map((b, i) => (
            <span key={b}>
              <span className="font-semibold text-white">{b}</span>
              {i < MONITORED_BOOKMAKERS.length - 1 && <span className="text-slate-500">, </span>}
            </span>
          ))}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Empty states */}
      {!hasFetched && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <TrendingUp size={40} className="mb-3 opacity-30" />
          <p>Clique em &quot;Buscar Value Bets&quot; para iniciar</p>
        </div>
      )}

      {hasFetched && !loading && valueBets.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <AlertCircle size={40} className="mb-3 opacity-30" />
          <p>Nenhuma value bet encontrada no momento</p>
        </div>
      )}

      {/* Results */}
      {valueBets.length > 0 && (
        <div className="space-y-4">
          <ValueBetsFilters
            sportFilter={sportFilter}
            setSportFilter={(v) => {
              setSportFilter(v)
              setCurrentPage(1)
            }}
            bookmakerFilter={bookmakerFilter}
            setBookmakerFilter={(v) => {
              setBookmakerFilter(v)
              setCurrentPage(1)
            }}
            marketFilter={marketFilter}
            setMarketFilter={(v) => {
              setMarketFilter(v)
              setCurrentPage(1)
            }}
            dateFrom={dateFrom}
            setDateFrom={(v) => {
              setDateFrom(v)
              setCurrentPage(1)
            }}
            dateTo={dateTo}
            setDateTo={(v) => {
              setDateTo(v)
              setCurrentPage(1)
            }}
            minEvFilter={minEvFilter}
            setMinEvFilter={(v) => {
              setMinEvFilter(v)
              setCurrentPage(1)
            }}
            maxEvFilter={maxEvFilter}
            setMaxEvFilter={(v) => {
              setMaxEvFilter(v)
              setCurrentPage(1)
            }}
            minOddFilter={minOddFilter}
            setMinOddFilter={(v) => {
              setMinOddFilter(v)
              setCurrentPage(1)
            }}
            maxOddFilter={maxOddFilter}
            setMaxOddFilter={(v) => {
              setMaxOddFilter(v)
              setCurrentPage(1)
            }}
            availableSports={availableSports}
            availableBookmakers={availableBookmakers}
            availableMarkets={availableMarkets}
            maxEv={sliderMaxEv}
            maxOdd={sliderMaxOdd}
            onReset={handleReset}
          />

          <p className="text-sm text-slate-400">
            Mostrando {paginatedBets.length} de {filteredBets.length} resultados filtrados (total:{' '}
            {valueBets.length})
          </p>

          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Evento</th>
                  <th className="px-4 py-3 text-left">Casa</th>
                  <th className="px-4 py-3 text-left">Linha de Aposta</th>
                  <th className="px-4 py-3 text-right">Odd</th>
                  <th className="px-4 py-3 text-right">Odd Justa</th>
                  <th className="px-4 py-3 text-right">EV%</th>
                  <th className="px-4 py-3 text-center">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedBets.map((vb) => {
                  const odds = vb.bookmakerOdds?.[vb.betSide as keyof typeof vb.bookmakerOdds]
                  const directLink = vb.bookmakerOdds?.[
                    `${vb.betSide}DirectLink` as keyof typeof vb.bookmakerOdds
                  ] as string | undefined

                  const evRaw = normalizeEv(vb.expectedValue ?? 0)
                  const evFormatted = formatEvPercentage(evRaw)
                  const trueOdd = getTrueOdds(Number(odds) || 0, evRaw)

                  // Humanized bet line label
                  const betLabel = getBetLabel({
                    marketName: vb.market?.name ?? '',
                    betSide: vb.betSide ?? '',
                    hdp: vb.market?.hdp ?? null,
                    home: vb.event?.home,
                    away: vb.event?.away,
                  })

                  const evColor =
                    evRaw >= 10
                      ? 'text-green-400'
                      : evRaw >= 5
                        ? 'text-purple-400'
                        : 'text-slate-300'

                  return (
                    <tr
                      key={vb.id}
                      className="bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {vb.event
                            ? `${vb.event.home} vs ${vb.event.away}`
                            : `Evento #${vb.eventId}`}
                        </div>
                        {vb.event && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {vb.event.sport} · {vb.event.league} · {formatDateTime(vb.event.date)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-300 shrink-0">{vb.bookmaker}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded bg-purple-900/40 border border-purple-700/30 px-1.5 py-0.5 text-xs font-semibold text-purple-300">
                            {vb.market?.name}
                          </span>
                          <span className="text-xs text-slate-200">{betLabel}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {odds ? `@${Number(odds).toFixed(2)}` : '—'}
                      </td>

                      <td
                        className="px-4 py-3 text-right font-mono text-slate-400"
                        title="Odd Justa estimada baseada no EV"
                      >
                        {trueOdd ? `@${trueOdd.toFixed(2)}` : '—'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${evColor}`}>
                          {evFormatted}
                        </span>
                        {vb.is_highest_ev && (
                          <span
                            title="Maior EV deste mercado"
                            className="ml-2 inline-flex items-center rounded-full bg-yellow-400/10 px-1.5 py-0.5 text-xs font-semibold text-yellow-500 ring-1 ring-inset ring-yellow-400/20"
                          >
                            ⭐ Máx
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {directLink ? (
                          <a
                            href={directLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-purple-400 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  )
}
