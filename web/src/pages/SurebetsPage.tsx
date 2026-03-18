import { useState } from 'react'
import { Zap, RefreshCw, AlertCircle } from 'lucide-react'
import { useSurebets } from '../hooks/useSurebets'
import { SurebetCard } from '../components/surebets/SurebetCard'

const MONITORED_BOOKMAKERS = ['Betano', 'Bet365']

export function SurebetsPage() {
  const { surebets, loading, error, fetch } = useSurebets()
  const [hasFetched, setHasFetched] = useState(false)

  const handleFetch = async () => {
    await fetch()
    setHasFetched(true)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Surebets</h1>
          <p className="text-sm text-slate-400 mt-1">Oportunidades de arbitragem em tempo real</p>
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-500 disabled:opacity-60 transition-all"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Buscando...' : 'Buscar Surebets'}
        </button>
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
      {!hasFetched && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Zap size={40} className="mb-3 opacity-30" />
          <p className="text-base">Clique em "Buscar Surebets" para iniciar</p>
        </div>
      )}

      {hasFetched && !loading && surebets.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <AlertCircle size={40} className="mb-3 opacity-30" />
          <p className="text-base">Nenhuma surebet encontrada no momento</p>
          <p className="text-sm mt-1 text-slate-600">Tente novamente em alguns minutos</p>
        </div>
      )}

      {surebets.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            {surebets.length} oportunidade{surebets.length !== 1 ? 's' : ''} encontrada
            {surebets.length !== 1 ? 's' : ''}
          </p>
          {surebets.map((s) => (
            <SurebetCard key={s.id} surebet={s} />
          ))}
        </div>
      )}
    </div>
  )
}
