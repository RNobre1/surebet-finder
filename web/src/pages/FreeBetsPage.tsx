import { useState } from 'react'
import { Gift, Plus, AlertCircle } from 'lucide-react'
import { FreeBetAlert } from '../components/FreeBetAlert'
import { useFreeBets } from '../hooks/useFreeBets'
import { supabase } from '../lib/supabase'

interface FreeBetsPageProps {
  userId: string
}

export function FreeBetsPage({ userId }: FreeBetsPageProps) {
  const { freeBets, expiringFreeBets, loading, refetch } = useFreeBets(userId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ bookmaker: '', amount: '', expires_at: '', description: '' })
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('free_bets').insert({
      user_id: userId,
      bookmaker: form.bookmaker,
      amount: parseFloat(form.amount),
      expires_at: form.expires_at || null,
      description: form.description || null,
    })
    setForm({ bookmaker: '', amount: '', expires_at: '', description: '' })
    setShowForm(false)
    setSaving(false)
    refetch()
  }

  const handleMarkUsed = async (id: string) => {
    await supabase.from('free_bets').update({ is_used: true }).eq('id', id)
    refetch()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Apostas Grátis</h1>
          <p className="text-sm text-slate-400 mt-1">Free bets e bônus das casas</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 transition-colors"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {/* Expiring alerts summary */}
      {expiringFreeBets.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <span className="text-sm text-amber-300">
            {expiringFreeBets.length} aposta{expiringFreeBets.length !== 1 ? 's' : ''} vencendo em
            breve!
          </span>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3"
        >
          <h3 className="font-semibold text-sm">Nova aposta grátis</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Casa de apostas</label>
              <input
                required
                value={form.bookmaker}
                onChange={(e) => setForm({ ...form, bookmaker: e.target.value })}
                placeholder="KTO, Bet365..."
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Valor (R$)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Vencimento</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Descrição (opcional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Bônus de boas-vindas..."
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      ) : freeBets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Gift size={36} className="mb-3 opacity-30" />
          <p>Nenhuma aposta grátis cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {freeBets.map((fb) => (
            <FreeBetAlert key={fb.id} freeBet={fb} onMarkUsed={handleMarkUsed} />
          ))}
        </div>
      )}
    </div>
  )
}
