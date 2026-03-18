import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { FreeBet } from '../types'
import { isExpiringSoon } from '../utils/formatDate'

interface UseFreeBetsState {
  freeBets: FreeBet[]
  expiringFreeBets: FreeBet[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFreeBets(userId: string | null): UseFreeBetsState {
  const [freeBets, setFreeBets] = useState<FreeBet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFreeBets = useCallback(async () => {
    if (!userId) {
      setFreeBets([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('free_bets')
      .select('*')
      .eq('user_id', userId)
      .order('expires_at', { ascending: true })

    if (err) {
      setError(err.message)
      setFreeBets([])
    } else {
      setFreeBets((data ?? []) as FreeBet[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFreeBets()
  }, [fetchFreeBets])

  const expiringFreeBets = freeBets.filter((fb) => !fb.is_used && isExpiringSoon(fb.expires_at))

  return { freeBets, expiringFreeBets, loading, error, refetch: fetchFreeBets }
}
