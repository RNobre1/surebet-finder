import { useState } from 'react'
import { TrendingUp, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDateTime } from '../../utils/formatDate'
import { StakeCalculator } from './StakeCalculator'
import type { ApiSurebet } from '../../types'

interface SurebetCardProps {
  surebet: ApiSurebet
  onSave?: (data: { surebet: ApiSurebet; totalBankroll: number }) => void
}

export function SurebetCard({ surebet, onSave }: SurebetCardProps) {
  const [showCalc, setShowCalc] = useState(false)

  const profitFormatted = surebet.profitMargin.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 space-y-3 hover:border-green-500/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          {surebet.event ? (
            <h3 className="font-semibold text-white text-sm">
              {surebet.event.home} <span className="text-slate-400">vs</span> {surebet.event.away}
            </h3>
          ) : (
            <h3 className="font-semibold text-white text-sm">Evento #{surebet.eventId}</h3>
          )}
          {surebet.event && (
            <p className="text-xs text-slate-400 mt-0.5">
              {surebet.event.league} · {surebet.event.sport}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 shrink-0">
          <TrendingUp size={12} className="text-green-400" />
          <span className="text-xs font-bold text-green-400">{profitFormatted}%</span>
        </div>
      </div>

      {/* Market */}
      <div className="flex gap-2 text-xs">
        <span className="rounded bg-slate-700 px-2 py-0.5 text-slate-300">
          {surebet.market.name}
        </span>
        {surebet.event && (
          <span className="text-slate-500">{formatDateTime(surebet.event.date)}</span>
        )}
      </div>

      {/* Legs */}
      <div className="space-y-1.5">
        {surebet.legs.map((leg, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-slate-700/50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white">{leg.bookmaker}</span>
              <span className="text-xs text-slate-400 capitalize">{leg.label || leg.side}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-green-300">@{leg.odds}</span>
              {leg.directLink && (
                <a
                  href={leg.directLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-green-400 transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Calculator Toggle */}
      <button
        onClick={() => setShowCalc((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-green-400 transition-colors"
      >
        {showCalc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showCalc ? 'Fechar calculadora' : 'Abrir calculadora'}
      </button>

      {showCalc && (
        <StakeCalculator
          surebet={surebet}
          onSave={onSave ? (d) => onSave({ surebet, totalBankroll: d.totalBankroll }) : undefined}
        />
      )}
    </div>
  )
}
