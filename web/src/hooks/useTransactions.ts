import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaction, ChartDataPoint } from '../types'

interface UseTransactionsState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  totalProfit: number
  totalDeposited: number
  refetch: () => Promise<void>
  create: (
    data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>,
    userId: string
  ) => Promise<void>
  getChartData: (period: 'week' | 'month' | 'year') => ChartDataPoint[]
}

export function useTransactions(userId: string | null): UseTransactionsState {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('transactions')
      .select('*, bookmaker_account:bookmaker_accounts(name, color)')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (err) {
      setError(err.message)
      setTransactions([])
    } else {
      setTransactions((data ?? []) as Transaction[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions()
  }, [fetchTransactions])

  const create = useCallback(
    async (data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>, uid: string) => {
      const { error: err } = await supabase.from('transactions').insert({ ...data, user_id: uid })
      if (!err) await fetchTransactions()
    },
    [fetchTransactions]
  )

  const totalProfit = transactions
    .filter((t): t is Transaction => ['surebet_profit', 'free_bet'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDeposited = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0)

  const getChartData = useCallback(
    (period: 'week' | 'month' | 'year'): ChartDataPoint[] => {
      const now = new Date()
      const grouped: Record<string, ChartDataPoint> = {}

      transactions.forEach((t) => {
        const date = new Date(t.date)
        let label = ''

        if (period === 'week') {
          // Group by day of week (last 7 days)
          const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
          if (diff > 7) return
          label = date.toLocaleDateString('pt-BR', { weekday: 'short' })
        } else if (period === 'month') {
          // Group by week number of current month
          const week = Math.ceil(date.getDate() / 7)
          label = `Sem ${week}`
        } else {
          // Group by month
          label = date.toLocaleDateString('pt-BR', { month: 'short' })
        }

        if (!grouped[label]) {
          grouped[label] = { label, profit: 0, deposits: 0, withdrawals: 0 }
        }
        if (['surebet_profit', 'free_bet'].includes(t.type)) grouped[label].profit += t.amount
        if (t.type === 'deposit') grouped[label].deposits += t.amount
        if (t.type === 'withdrawal') grouped[label].withdrawals += t.amount
      })

      return Object.values(grouped)
    },
    [transactions]
  )

  return {
    transactions,
    loading,
    error,
    totalProfit,
    totalDeposited,
    refetch: fetchTransactions,
    create,
    getChartData,
  }
}
