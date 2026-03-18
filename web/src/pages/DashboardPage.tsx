import { useState } from 'react'
import {
  TrendingUp,
  Wallet,
  Gift,
  Percent,
  BarChart2,
  Target,
  ArrowUpRight,
  Activity,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { useBookmakerAccounts } from '../hooks/useBookmakerAccounts'
import { useFreeBets } from '../hooks/useFreeBets'
import { useActiveSurebets } from '../hooks/useActiveSurebets'
import { formatCurrency } from '../utils/formatCurrency'
import type { ActiveSurebetLeg } from '../types'

interface DashboardPageProps {
  userId: string
}

type Period = 'week' | 'month' | 'year'

export function DashboardPage({ userId }: DashboardPageProps) {
  const { totalProfit, totalDeposited, getChartData } = useTransactions(userId)
  const { accounts } = useBookmakerAccounts(userId)
  const { freeBets, expiringFreeBets } = useFreeBets(userId)
  const { activeSurebets } = useActiveSurebets()
  const [period, setPeriod] = useState<Period>('month')

  // ----- derived values (sem useMemo para não conflitar com o React Compiler) -----
  const totalAllocated = accounts.filter((a) => a.is_active).reduce((s, a) => s + a.balance, 0)
  const roi = totalDeposited > 0 ? (totalProfit / totalDeposited) * 100 : 0
  const openFreeBetsValue = freeBets.filter((fb) => !fb.is_used).reduce((s, fb) => s + fb.amount, 0)
  const chartData = getChartData(period)
  const activeSortedAccounts = [...accounts]
    .filter((a) => a.is_active)
    .sort((a, b) => b.balance - a.balance)

  // ----- Active Surebets Metrics -----
  const activeOnly = activeSurebets.filter((s) => s.status === 'active')

  const activeTotalStaked = activeOnly.reduce((sum, s) => sum + s.total_stake, 0)

  // Para cada aposta ativa, o retorno esperado é o menor retorno bruto entre as pernas
  // (a quantia que receberemos independente do resultado)
  const activeExpectedReturn = activeOnly.reduce((sum, s) => {
    if (!s.legs || s.legs.length === 0) return sum
    const minReturn = Math.min(...(s.legs as ActiveSurebetLeg[]).map((l) => l.stake * l.odds))
    return sum + minReturn
  }, 0)

  const activeExpectedProfit = activeExpectedReturn - activeTotalStaked

  // ----- Stats cards -----
  const stats = [
    {
      label: 'Total alocado',
      value: formatCurrency(totalAllocated),
      icon: Wallet,
      color: 'text-green-400',
      bg: 'bg-green-500/15',
      border: 'border-green-500/20',
    },
    {
      label: 'Lucro total',
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/20',
    },
    {
      label: 'ROI',
      value: `${roi.toFixed(2)}%`,
      icon: Percent,
      color: 'text-purple-400',
      bg: 'bg-purple-500/15',
      border: 'border-purple-500/20',
    },
    {
      label: 'Free bets abertas',
      value: formatCurrency(openFreeBetsValue),
      icon: Gift,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/20',
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Visão geral das suas apostas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.border} bg-slate-800/60 p-4`}>
            <div
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} mb-3`}
            >
              <s.icon size={18} className={s.color} />
            </div>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Active Surebets Metrics */}
      {activeOnly.length > 0 && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-900/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-purple-400" />
            <h3 className="text-sm font-semibold text-white">
              Apostas Ativas Agora{' '}
              <span className="ml-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-xs font-bold text-purple-300">
                {activeOnly.length}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total em jogo */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/15 shrink-0">
                <Target size={18} className="text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total em Jogo</p>
                <p className="text-lg font-bold font-mono text-white">
                  {formatCurrency(activeTotalStaked)}
                </p>
              </div>
            </div>

            {/* Retorno esperado */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/15 shrink-0">
                <ArrowUpRight size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Retorno Esperado</p>
                <p className="text-lg font-bold font-mono text-blue-300">
                  {formatCurrency(activeExpectedReturn)}
                </p>
              </div>
            </div>

            {/* Lucro esperado */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-500/15 shrink-0">
                <TrendingUp size={18} className="text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Lucro Esperado</p>
                <p
                  className={`text-lg font-bold font-mono ${activeExpectedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {activeExpectedProfit >= 0 ? '+' : ''}
                  {formatCurrency(activeExpectedProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* Mini lista das apostas ativas */}
          <div className="mt-4 space-y-2">
            {activeOnly.map((s) => {
              const legs = s.legs as ActiveSurebetLeg[]
              const expectedReturn = legs.length
                ? Math.min(...legs.map((l) => l.stake * l.odds))
                : 0
              const profit = expectedReturn - s.total_stake
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 border border-slate-700/30 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-white">{s.event_name}</span>
                    <span className="ml-2 text-xs text-slate-500">{legs.length} pernas</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">
                      {formatCurrency(s.total_stake)} apostados
                    </span>
                    <span
                      className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {profit >= 0 ? '+' : ''}
                      {formatCurrency(profit)} lucro
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-1 rounded-xl bg-slate-800 p-1 w-fit">
        {(['week', 'month', 'year'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              period === p ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profit Line Chart */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" /> Evolução do Lucro
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v) => [formatCurrency(v as number), 'Lucro']}
              />
              <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Deposits/Withdrawals Bar Chart */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-400" /> Depósitos vs Saques
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                }}
                formatter={(v) => [formatCurrency(v as number)]}
              />
              <Bar dataKey="deposits" name="Depósitos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" name="Saques" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accounts breakdown */}
      {accounts.length > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Wallet size={16} className="text-slate-400" /> Saldo por Casa
          </h3>
          <div className="space-y-2">
            {activeSortedAccounts.map((acc) => {
              const pct = totalAllocated > 0 ? (acc.balance / totalAllocated) * 100 : 0
              return (
                <div key={acc.id} className="flex items-center gap-3">
                  <div
                    className="h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center text-slate-900 shrink-0"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-medium">{acc.name}</span>
                      <span className="text-slate-400">{formatCurrency(acc.balance)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-700">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: acc.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expiring free bets alert */}
      {expiringFreeBets.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-400 mb-2">
            ⚠️ Free bets vencendo em breve
          </p>
          <div className="space-y-1">
            {expiringFreeBets.map((fb) => (
              <p key={fb.id} className="text-xs text-slate-300">
                • {fb.bookmaker}: {formatCurrency(fb.amount)} — vence em {fb.expires_at}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
