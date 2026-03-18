import { useState } from 'react'
import { TrendingUp, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { useValueBets } from '../hooks/useValueBets'
import { formatDateTime } from '../utils/formatDate'
import { ValueBetsFilters } from '../components/valuebets/ValueBetsFilters'
import { Pagination } from '../components/ui/Pagination'
import { normalizeEv, formatEvPercentage, getTrueOdds } from '../utils/valueBetsUtils'

const MONITORED_BOOKMAKERS = ['Betano', 'Bet365']
const ITEMS_PER_PAGE = 15

export function ValueBetsPage() {
  const { valueBets, loading, error, fetch } = useValueBets()
  const [hasFetched, setHasFetched] = useState(false)

  // Filters State
  const [sportFilter, setSportFilter] = useState('All')
  const [bookmakerFilter, setBookmakerFilter] = useState('All')
  const [minEvFilter, setMinEvFilter] = useState(0)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)

  const handleFetch = async () => {
    setCurrentPage(1)
    await fetch()
    setHasFetched(true)
  }

  // Obter opcoes unicas para filtros baseadas nos dados originais
  const availableSports = Array.from(new Set(valueBets.map((vb) => vb.event?.sport || 'Unknown')))
  const availableBookmakers = Array.from(new Set(valueBets.map((vb) => vb.bookmaker)))

  // Aplicar filtros
  const filteredBets = valueBets.filter((vb) => {
    const sportMatch = sportFilter === 'All' || vb.event?.sport === sportFilter
    const bookmakerMatch = bookmakerFilter === 'All' || vb.bookmaker === bookmakerFilter
    const rawEv = normalizeEv(vb.expectedValue ?? 0)
    const evMatch = rawEv >= minEvFilter
    return sportMatch && bookmakerMatch && evMatch
  })

  // Aplicar paginacao
  const totalPages = Math.ceil(filteredBets.length / ITEMS_PER_PAGE)
  const paginatedBets = filteredBets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset pagina ao mudar filtros caso fique vazio
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
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
          <p>Clique em "Buscar Value Bets" para iniciar</p>
        </div>
      )}

      {hasFetched && !loading && valueBets.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <AlertCircle size={40} className="mb-3 opacity-30" />
          <p>Nenhuma value bet encontrada no momento</p>
        </div>
      )}

      {/* Results table */}
      {valueBets.length > 0 && (
        <div className="space-y-4">
          <ValueBetsFilters
            sportFilter={sportFilter}
            setSportFilter={setSportFilter}
            bookmakerFilter={bookmakerFilter}
            setBookmakerFilter={setBookmakerFilter}
            minEvFilter={minEvFilter}
            setMinEvFilter={setMinEvFilter}
            availableSports={availableSports}
            availableBookmakers={availableBookmakers}
          />

          <p className="text-sm text-slate-400 flex items-center justify-between">
            <span>
              Mostrando {paginatedBets.length} de {filteredBets.length} resultados filtrados (total
              original: {valueBets.length})
            </span>
          </p>
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Evento</th>
                  <th className="px-4 py-3 text-left">Casa</th>
                  <th className="px-4 py-3 text-left">Mercado</th>
                  <th className="px-4 py-3 text-right">Odd Ofertada</th>
                  <th className="px-4 py-3 text-right">Odd Justa</th>
                  <th className="px-4 py-3 text-right">EV%</th>
                  <th className="px-4 py-3 text-center" title="Link Direto">
                    Link
                  </th>
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
                          <div className="text-xs text-slate-500">
                            {vb.event.sport} · {vb.event.league} · {formatDateTime(vb.event.date)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{vb.bookmaker}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                          {vb.market.name}
                        </span>
                        <span className="ml-1 text-xs text-slate-500 capitalize">{vb.betSide}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                        {odds ? `@${Number(odds).toFixed(2)}` : '—'}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-mono text-slate-400"
                        title="True Odds estimada baseada no Expected Value"
                      >
                        {trueOdd ? `@${trueOdd.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-purple-400">{evFormatted}</span>
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
