import { useState } from 'react'
import { CheckSquare, Plus, AlertCircle } from 'lucide-react'
import { useActiveSurebets } from '../hooks/useActiveSurebets'
import { ActiveSurebetCard } from '../components/surebets/ActiveSurebetCard'
import { AddActiveSurebetModal } from '../components/surebets/AddActiveSurebetModal'

export function ActiveSurebetsPage() {
  const { activeSurebets, loading, error, resolveLeg, voidSurebet } = useActiveSurebets()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Empty states
  if (loading && activeSurebets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-[#0f172a]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="text-green-500 hover:text-green-400" />
            Apostas Ativas
          </h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie suas Surebets e Arbitragens não-resolvidas</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-500 transition-colors"
        >
          <Plus size={18} />
          Nova Surebet
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {activeSurebets.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-slate-800 rounded-xl bg-slate-900/30">
          <CheckSquare size={40} className="mb-3 opacity-30 text-green-500" />
          <p className="text-base text-center">Você não tem apostas ativas aguardando liquidação.</p>
          <p className="text-sm mt-1 text-slate-600 text-center">Clique em "Nova Surebet" para adicionar o rastreio de um jogo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            {activeSurebets.length} aposta{activeSurebets.length !== 1 ? 's' : ''} em andamento
          </p>
          <div className="space-y-4">
            {activeSurebets.map((bet) => (
              <ActiveSurebetCard 
                key={bet.id} 
                surebet={bet} 
                onResolve={(legId) => resolveLeg(bet.id, bet, legId)}
                onVoid={() => voidSurebet(bet.id, bet)}
              />
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <AddActiveSurebetModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}
