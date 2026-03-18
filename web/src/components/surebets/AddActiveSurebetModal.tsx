import { useState, useEffect } from 'react'
import { X, Calculator, Plus, Save } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useBookmakerAccounts } from '../../hooks/useBookmakerAccounts'
import { useActiveSurebets } from '../../hooks/useActiveSurebets'
import type { ActiveSurebetLeg } from '../../types'

interface AddActiveSurebetModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddActiveSurebetModal({ isOpen, onClose }: AddActiveSurebetModalProps) {
  // Global States
  const { accounts } = useBookmakerAccounts()
  const { addSurebet } = useActiveSurebets()

  // Form States
  const [eventName, setEventName] = useState('')
  const [sport, setSport] = useState('')
  const [league, setLeague] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [totalStake, setTotalStake] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Legs State
  const [legs, setLegs] = useState<Partial<ActiveSurebetLeg>[]>([
    { leg_id: uuidv4(), odds: 0, stake: 0, bookmaker_id: '', market_name: '' },
    { leg_id: uuidv4(), odds: 0, stake: 0, bookmaker_id: '', market_name: '' }
  ])

  useEffect(() => {
    if (isOpen) {
      setEventName('')
      setSport('')
      setLeague('')
      setEventDate('')
      setTotalStake('')
      setLegs([
        { leg_id: uuidv4(), odds: 0, stake: 0, bookmaker_id: '', market_name: '' },
        { leg_id: uuidv4(), odds: 0, stake: 0, bookmaker_id: '', market_name: '' }
      ])
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleLegChange = (id: string, field: keyof ActiveSurebetLeg, value: any) => {
    setLegs(legs.map(leg => leg.leg_id === id ? { ...leg, [field]: value } : leg))
  }

  const addLeg = () => {
    setLegs([...legs, { leg_id: uuidv4(), odds: 0, stake: 0, bookmaker_id: '', market_name: '' }])
  }

  const calculateStakes = () => {
    if (!totalStake || Number(totalStake) <= 0) {
      setError('Insira um Valor Total de Investimento válido para auto-calcular.')
      return
    }

    // Calcula Probabilidade Implícita Total (Arbitrage Margin)
    let margin = 0
    let validOdds = true
    legs.forEach(leg => {
      if (!leg.odds || leg.odds <= 1) validOdds = false
      else margin += (1 / leg.odds)
    })

    if (!validOdds) {
      setError('Preencha todas as odds com valores maiores que 1.0 para calcular.')
      return
    }

    // Distribui o dinheiro proporcionalmente
    const newLegs = legs.map(leg => {
      const impliedProb = 1 / (leg.odds || 1)
      const exactStake = (Number(totalStake) * impliedProb) / margin
      return { ...leg, stake: Number(exactStake.toFixed(2)) }
    })

    setLegs(newLegs)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!eventName || !eventDate || !totalStake) {
      setError('Preencha os dados primários do Evento e Stake Total.')
      setLoading(false)
      return
    }

    let profitMargin = 0
    for (const leg of legs) {
      if (!leg.bookmaker_id || !leg.market_name || !leg.odds || !leg.stake) {
        setError('Preencha completamente todas as pernas da Surebet (Casa, Mercado, Odd, Stake).')
        setLoading(false)
        return
      }
    }

    // Calcular Margem Baseada nas Stakes Preenchidas (Manual ou Auto)
    // Assumimos que a arbitragem trará um retorno quase igual em qualquer ponta
    const sampleReturn = Number(legs[0].stake) * Number(legs[0].odds)
    profitMargin = ((sampleReturn - Number(totalStake)) / Number(totalStake)) * 100

    try {
      await addSurebet({
        event_name: eventName,
        sport: sport || 'Outros',
        league: league || 'Outros',
        event_date: new Date(eventDate).toISOString(),
        total_stake: Number(totalStake),
        profit_margin: profitMargin,
        legs: legs as ActiveSurebetLeg[]
      })
      onClose()
      window.location.reload() // Force parent fetch refresh via simple reload (or handle via prop)
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar aposta manual.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-green-500" />
            Lançar Surebet Manual
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/15 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Principal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Dados do Evento</h3>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Resumo do Jogo</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-green-500 focus:outline-none"
                placeholder="Ex: Lakers vs Bulls"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Esporte</label>
                <input
                  type="text"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                  placeholder="Ex: Basketball"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Data do Jogo</label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none [color-scheme:dark]"
                  required
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-800"></div>

          {/* Dinheiro & Stake */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Distribuição Financeira</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Valor Total Investido (Bankroll Alocado)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={totalStake}
                    onChange={(e) => setTotalStake(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-4 text-sm text-white font-mono placeholder-slate-500 focus:border-green-500 focus:outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={calculateStakes}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors border border-slate-600"
              >
                <Calculator size={16} /> Auto-Calcular Stakes
              </button>
            </div>

            {/* Pernas Variables */}
            <div className="space-y-3 mt-4">
              {legs.map((leg, index) => (
                <div key={leg.leg_id} className="p-4 rounded-xl border border-slate-700 bg-slate-800/40 space-y-3 relative">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                    <span className="bg-slate-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    Mercado (Leg {index + 1})
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400 uppercase">Casa de Aposta</label>
                      <select
                        value={leg.bookmaker_id}
                        onChange={(e) => handleLegChange(leg.leg_id!, 'bookmaker_id', e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                        required
                      >
                        <option value="" disabled>Selecione...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} (Saldo: R${acc.balance})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400 uppercase">Aposta (Ex: Over 2.5)</label>
                      <input
                        type="text"
                        value={leg.market_name}
                        onChange={(e) => handleLegChange(leg.leg_id!, 'market_name', e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400 uppercase">Odd Ofertada</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={leg.odds || ''}
                        onChange={(e) => handleLegChange(leg.leg_id!, 'odds', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-green-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-400 uppercase">Stake Final (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={leg.stake || ''}
                        onChange={(e) => handleLegChange(leg.leg_id!, 'stake', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-green-400 font-mono focus:border-green-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addLeg}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <Plus size={14} /> Adicionar 3ª Perna (Mercado)
            </button>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save size={16} />
                  Salvar Surebet & Descontar Saldos
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
