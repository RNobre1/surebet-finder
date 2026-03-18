import { useState, useMemo } from 'react'
import { Wallet, Plus, Trash2 } from 'lucide-react'
import { useBookmakerAccounts } from '../hooks/useBookmakerAccounts'
import { useTransactions } from '../hooks/useTransactions'
import { formatCurrency } from '../utils/formatCurrency'
import { supabase } from '../lib/supabase'

interface AccountsPageProps {
  userId: string
}

const ACCOUNT_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#06b6d4',
  '#f97316',
  '#ec4899',
]

export function AccountsPage({ userId }: AccountsPageProps) {
  const { accounts, loading, refetch, create, remove } = useBookmakerAccounts(userId)
  const { create: createTransaction } = useTransactions(userId)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddTx, setShowAddTx] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', balance: '', color: ACCOUNT_COLORS[0], notes: '' })
  const [txForm, setTxForm] = useState({
    type: 'deposit',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await create(
      {
        name: form.name,
        balance: parseFloat(form.balance) || 0,
        currency: 'BRL',
        color: form.color,
        is_active: true,
        notes: form.notes,
      },
      userId
    )
    setForm({ name: '', balance: '', color: ACCOUNT_COLORS[0], notes: '' })
    setShowAddAccount(false)
    setSaving(false)
  }

  const handleAddTx = async (e: React.FormEvent, accountId: string) => {
    e.preventDefault()
    setSaving(true)
    await createTransaction(
      {
        account_id: accountId,
        type: txForm.type as 'deposit' | 'withdrawal' | 'surebet_profit' | 'free_bet' | 'other',
        amount: parseFloat(txForm.amount),
        description: txForm.description,
        date: txForm.date,
      },
      userId
    )
    // update balance
    const acc = accounts.find((a) => a.id === accountId)!
    const delta = ['withdrawal'].includes(txForm.type)
      ? -parseFloat(txForm.amount)
      : parseFloat(txForm.amount)
    await supabase
      .from('bookmaker_accounts')
      .update({ balance: acc.balance + delta })
      .eq('id', accountId)
    setTxForm({
      type: 'deposit',
      amount: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
    })
    setShowAddTx(null)
    setSaving(false)
    refetch()
  }

  const totalBalance = useMemo(() => 
    accounts.filter((a) => a.is_active).reduce((s, a) => s + a.balance, 0),
  [accounts])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contas</h1>
          <p className="text-sm text-slate-400">Casas de apostas e saldos</p>
        </div>
        <button
          onClick={() => setShowAddAccount((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 transition-colors"
        >
          <Plus size={16} /> Adicionar casa
        </button>
      </div>

      {/* Total */}
      <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 p-5">
        <p className="text-sm text-green-400 font-medium">Total alocado</p>
        <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalBalance)}</p>
      </div>

      {/* Add account form */}
      {showAddAccount && (
        <form
          onSubmit={handleAddAccount}
          className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3"
        >
          <h3 className="font-semibold text-sm">Nova conta</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome da casa</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Betano, KTO..."
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Saldo inicial (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddAccount(false)}
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

      {/* Accounts list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Wallet size={36} className="mb-3 opacity-30" />
          <p>Nenhuma conta cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-slate-900 font-bold text-sm shrink-0"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{acc.name}</p>
                    {acc.notes && <p className="text-xs text-slate-500">{acc.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white">
                    {formatCurrency(acc.balance)}
                  </span>
                  <button
                    onClick={() => setShowAddTx(showAddTx === acc.id ? null : acc.id)}
                    className="rounded-lg bg-slate-700 p-2 hover:bg-slate-600 transition-colors text-slate-300"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => remove(acc.id)}
                    className="rounded-lg bg-slate-700 p-2 hover:bg-red-500/20 hover:text-red-400 transition-colors text-slate-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {showAddTx === acc.id && (
                <form
                  onSubmit={(e) => handleAddTx(e, acc.id)}
                  className="mt-3 pt-3 border-t border-slate-700 space-y-2"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                      <select
                        value={txForm.type}
                        onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                        className="w-full rounded-lg bg-slate-700 border border-slate-600 px-2 py-1.5 text-sm text-white focus:outline-none"
                      >
                        <option value="deposit">Depósito</option>
                        <option value="withdrawal">Saque</option>
                        <option value="surebet_profit">Lucro Surebet</option>
                        <option value="free_bet">Free Bet</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Valor (R$)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={txForm.amount}
                        onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                        placeholder="0,00"
                        className="w-full rounded-lg bg-slate-700 border border-slate-600 px-2 py-1.5 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Data</label>
                      <input
                        type="date"
                        value={txForm.date}
                        onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                        className="w-full rounded-lg bg-slate-700 border border-slate-600 px-2 py-1.5 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddTx(null)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      {saving ? '...' : 'Registrar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
