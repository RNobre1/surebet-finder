import { useState } from 'react'
import { Zap, RefreshCw, AlertCircle } from 'lucide-react'
import { useSurebets } from '../hooks/useSurebets'
import { SurebetCard } from '../components/surebets/SurebetCard'
import { SurebetsFilters } from '../components/surebets/SurebetsFilters'
import { Pagination } from '../components/ui/Pagination'

const MONITORED_BOOKMAKERS = ['Betano', 'Bet365']
const ITEMS_PER_PAGE = 15

export function SurebetsPage() {
  const { surebets, loading, error } = useSurebets()

  // Filters State
  const [sportFilter, setSportFilter] = useState('All')
  const [minMarginFilter, setMinMarginFilter] = useState(0)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)

  // Obter opcoes unicas para filtros
  const availableSports = Array.from(new Set(surebets.map((s) => s.event?.sport || 'Unknown')))

  // Aplicar filtros
  const filteredBets = surebets.filter((s) => {
    const sportMatch = sportFilter === 'All' || s.event?.sport === sportFilter
    const marginMatch = (s.profitMargin ?? 0) >= minMarginFilter
    return sportMatch && marginMatch
  })

  // Paginar resultados
  const totalPages = Math.ceil(filteredBets.length / ITEMS_PER_PAGE)
  const paginatedBets = filteredBets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Auto-reset
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Surebets</h1>
          <p className="text-sm text-slate-400 mt-1">Oportunidades de arbitragem em tempo real atuallizadas periodicamente</p>
        </div>
      </div>

      {/* Bookmakers info */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3">
        <Zap size={16} className="text-green-400 shrink-0" />
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

      {/* Results */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <RefreshCw size={40} className="mb-3 opacity-30 animate-spin" />
          <p className="text-base">Carregando oportunidades seguras da rede...</p>
        </div>
      )}

      {!loading && surebets.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <AlertCircle size={40} className="mb-3 opacity-30" />
          <p className="text-base">Nenhuma surebet encontrada no momento</p>
          <p className="text-sm mt-1 text-slate-600">Tente novamente em alguns minutos</p>
        </div>
      )}

      {surebets.length > 0 && (
        <div className="space-y-4">
          <SurebetsFilters
            sportFilter={sportFilter}
            setSportFilter={setSportFilter}
            minMarginFilter={minMarginFilter}
            setMinMarginFilter={setMinMarginFilter}
            availableSports={availableSports}
          />

          <p className="text-sm text-slate-400 flex items-center justify-between">
            <span>
              Mostrando {paginatedBets.length} de {filteredBets.length} resultados filtrados (total
              original: {surebets.length})
            </span>
          </p>

          <div className="space-y-3">
            {paginatedBets.map((s) => (
              <SurebetCard key={s.id} surebet={s} />
            ))}
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
