import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { BookmakerAccount } from '../types'

interface UseBookmakerAccountsState {
  accounts: BookmakerAccount[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  create: (
    data: Omit<BookmakerAccount, 'id' | 'user_id' | 'created_at'>,
    userId: string
  ) => Promise<void>
  update: (id: string, data: Partial<BookmakerAccount>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useBookmakerAccounts(userId: string | null): UseBookmakerAccountsState {
  const [accounts, setAccounts] = useState<BookmakerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('bookmaker_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (err) {
      setError(err.message)
      setAccounts([])
    } else {
      setAccounts((data ?? []) as BookmakerAccount[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts()
  }, [fetchAccounts])

  const create = useCallback(
    async (data: Omit<BookmakerAccount, 'id' | 'user_id' | 'created_at'>, uid: string) => {
      const { error: err } = await supabase
        .from('bookmaker_accounts')
        .insert({ ...data, user_id: uid })
      if (!err) await fetchAccounts()
    },
    [fetchAccounts]
  )

  const update = useCallback(
    async (id: string, data: Partial<BookmakerAccount>) => {
      const { error: err } = await supabase.from('bookmaker_accounts').update(data).eq('id', id)
      if (!err) await fetchAccounts()
    },
    [fetchAccounts]
  )

  const remove = useCallback(
    async (id: string) => {
      const { error: err } = await supabase.from('bookmaker_accounts').delete().eq('id', id)
      if (!err) await fetchAccounts()
    },
    [fetchAccounts]
  )

  return { accounts, loading, error, refetch: fetchAccounts, create, update, remove }
}
