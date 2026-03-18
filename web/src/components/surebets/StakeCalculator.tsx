import { useState } from 'react'
import { calculateStakes } from '../../utils/calculateStakes'
import { formatCurrency } from '../../utils/formatCurrency'
import type { ApiSurebet, OptimalStake } from '../../types'

interface StakeCalculatorProps {
  surebet: ApiSurebet
  onSave?: (data: { surebet: ApiSurebet; totalBankroll: number; stakes: OptimalStake[] }) => void
}

export function StakeCalculator({ surebet, onSave }: StakeCalculatorProps) {
  const [bankroll, setBankroll] = useState<string>('')
  const [stakes, setStakes] = useState<OptimalStake[] | null>(null)

  const handleCalculate = () => {
    const value = parseFloat(bankroll)
    if (isNaN(value) || value <= 0) return
    const result = calculateStakes(surebet.legs, value)
    setStakes(result)
  }

  const handleSave = () => {
    if (!stakes || !onSave) return
    onSave({ surebet, totalBankroll: parseFloat(bankroll), stakes })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={bankroll}
          onChange={(e) => setBankroll(e.target.value)}
          placeholder="Valor total (R$)"
          className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-slate-400 border border-slate-600 focus:border-green-500 focus:outline-none"
        />
        <button
          onClick={handleCalculate}
          className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500 transition-colors"
        >
          Calcular
        </button>
      </div>

      {stakes && stakes.length > 0 && (
        <div className="rounded-lg bg-slate-700/50 p-3 space-y-2">
          {stakes.map((s, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="font-medium text-white">{s.bookmaker}</span>
              <span className="text-slate-300 capitalize text-xs">{s.side}</span>
              <span className="text-green-400 font-semibold">{formatCurrency(s.stake)}</span>
              <span className="text-slate-400 text-xs">→ {formatCurrency(s.potentialReturn)}</span>
            </div>
          ))}
          {onSave && (
            <button
              onClick={handleSave}
              className="mt-2 w-full rounded-md bg-slate-600 py-1.5 text-sm text-white hover:bg-slate-500 transition-colors"
            >
              Salvar no histórico
            </button>
          )}
        </div>
      )}
    </div>
  )
}
