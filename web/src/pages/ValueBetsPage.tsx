import { useState } from 'react'
import { TrendingUp, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { useValueBets } from '../hooks/useValueBets'
import { formatDateTime } from '../utils/formatDate'

const MONITORED_BOOKMAKERS = ['Betano', 'Bet365']

export function ValueBetsPage() {
  const { valueBets, loading, error, fetch } = useValueBets()
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
        <div className="space-y-2">
          <p className="text-sm text-slate-400">
            {valueBets.length} value bet{valueBets.length !== 1 ? 's' : ''} encontrada
            {valueBets.length !== 1 ? 's' : ''}, ordenadas por EV
          </p>
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Evento</th>
                  <th className="px-4 py-3 text-left">Casa</th>
                  <th className="px-4 py-3 text-left">Mercado</th>
                  <th className="px-4 py-3 text-right">Odd</th>
                  <th className="px-4 py-3 text-right">EV%</th>
                  <th className="px-4 py-3 text-center">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {valueBets.map((vb) => {
                  const odds = vb.bookmakerOdds?.[vb.betSide as keyof typeof vb.bookmakerOdds]
                  const directLink = vb.bookmakerOdds?.[
                    `${vb.betSide}DirectLink` as keyof typeof vb.bookmakerOdds
                  ] as string | undefined
                  const ev = ((vb.expectedValue ?? 0) * 100).toFixed(2)
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
                            {vb.event.league} · {formatDateTime(vb.event.date)}
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
                        {odds ? `@${odds}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-purple-400">+{ev}%</span>
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
        </div>
      )}
    </div>
  )
}
