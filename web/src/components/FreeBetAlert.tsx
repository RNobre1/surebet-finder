import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate, daysUntilExpiry, isExpiringSoon } from '../utils/formatDate'
import type { FreeBet } from '../types'

interface FreeBetAlertProps {
  freeBet: FreeBet
  onMarkUsed?: (id: string) => void
}

export function FreeBetAlert({ freeBet, onMarkUsed }: FreeBetAlertProps) {
  const days = daysUntilExpiry(freeBet.expires_at)
  const expiringSoon = isExpiringSoon(freeBet.expires_at)
  const expired = days < 0

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
        freeBet.is_used
          ? 'border-slate-700 bg-slate-800/50 opacity-60'
          : expired
            ? 'border-red-500/40 bg-red-500/10'
            : expiringSoon
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-slate-700 bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        {freeBet.is_used ? (
          <CheckCircle2 size={18} className="text-slate-500 shrink-0" />
        ) : expired ? (
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
        ) : expiringSoon ? (
          <Clock size={18} className="text-amber-400 shrink-0" />
        ) : (
          <div className="h-4.5 w-4.5" />
        )}
        <div>
          <p className="text-sm font-semibold text-white">{freeBet.bookmaker}</p>
          <p className="text-xs text-slate-400">
            {freeBet.description || 'Free bet'} · {formatDate(freeBet.expires_at)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-semibold text-white">{formatCurrency(freeBet.amount)}</span>

        {freeBet.is_used ? (
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
            Utilizada
          </span>
        ) : expired ? (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
            Expirada
          </span>
        ) : expiringSoon ? (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
            Vence em {days} dia{days !== 1 ? 's' : ''}
          </span>
        ) : null}

        {!freeBet.is_used && !expired && onMarkUsed && (
          <button
            onClick={() => onMarkUsed(freeBet.id)}
            className="text-xs text-slate-400 hover:text-green-400 transition-colors"
          >
            Marcar usada
          </button>
        )}
      </div>
    </div>
  )
}
