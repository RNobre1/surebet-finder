import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import type { SurebetHistory, ActiveSurebetLeg } from '../../types'
import { formatCurrency } from '../../utils/formatCurrency'

interface ActiveSurebetCardProps {
  surebet: SurebetHistory
  onResolve: (winningLegId: string) => void
  onVoid: () => void
}

export function ActiveSurebetCard({ surebet, onResolve, onVoid }: ActiveSurebetCardProps) {
  const isSettled = surebet.status === 'settled'
  const isVoid = surebet.status === 'void'

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isSettled ? 'bg-slate-800/20 border-green-500/20' : 
      isVoid ? 'bg-slate-800/20 border-slate-700/50' : 
      'bg-slate-800/60 border-slate-700 shadow-xl'
    }`}>
      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">{surebet.event_name}</h3>
            {isSettled && <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">RESOLVIDA</span>}
            {isVoid && <span className="text-xs font-bold text-slate-400 bg-slate-700/30 px-2 py-0.5 rounded">ANULADA</span>}
          </div>
          <div className="text-sm text-slate-400 mt-0.5">
            {surebet.sport} · {surebet.league} · Data do Evento: {new Date(surebet.event_date).toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-xs font-medium text-slate-400">Total Investido</div>
            <div className="font-mono font-semibold text-white">{formatCurrency(surebet.total_stake)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400">Lucro Garantido</div>
            <div className={`font-mono font-bold ${isVoid ? 'text-slate-500' : 'text-green-400'}`}>
              +{surebet.profit_margin.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Mercados (Legs) */}
      <div className="space-y-3">
        {surebet.legs.map((leg: ActiveSurebetLeg) => {
          const potentialReturn = leg.stake * leg.odds
          const profit = potentialReturn - surebet.total_stake

          const isWon = leg.status === 'won'
          const isLost = leg.status === 'lost'

          return (
            <div 
              key={leg.leg_id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${
                isWon ? 'bg-green-500/10 border-green-500/30' :
                isLost ? 'bg-red-500/5 border-red-500/10 opacity-50' :
                'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex-1 mb-3 sm:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{leg.market_name}</span>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-purple-400 border border-slate-700">
                    @{leg.odds.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Aposta em <span className="font-bold text-slate-300">{leg.bookmaker_id}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-medium">STAKE (VALOR)</div>
                  <div className="font-mono text-sm font-semibold text-white">
                    {formatCurrency(leg.stake)}
                  </div>
                </div>
                
                <div className="sm:text-right">
                  <div className="text-[10px] sm:text-xs text-slate-500 font-medium">RETORNO BRUTO / LÍQUIDO</div>
                  <div className="font-mono text-sm font-bold text-white">
                    {formatCurrency(potentialReturn)}{' '}
                    <span className={profit > 0 ? 'text-green-400' : 'text-slate-500'}>
                      ({profit > 0 ? '+' : ''}{formatCurrency(profit)})
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {!isSettled && !isVoid && (
                  <button
                    onClick={() => onResolve(leg.leg_id)}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400 hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                  >
                    <CheckCircle2 size={14} />
                    Deu Green
                  </button>
                )}
                {isWon && (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-green-400 bg-green-500/10 rounded-lg">
                    <CheckCircle2 size={14} /> Resolvida (Vencedora)
                  </div>
                )}
                {isLost && (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg">
                    <XCircle size={14} /> Fechada (Perdedora)
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Controles secundários */}
      {!isSettled && !isVoid && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={onVoid}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors"
          >
            <AlertTriangle size={14} />
            Anular Surebet e devolver saldos para as contas originais
          </button>
        </div>
      )}
    </div>
  )
}
