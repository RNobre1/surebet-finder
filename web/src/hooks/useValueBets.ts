import { useState, useCallback, useEffect } from 'react'
import type { ApiValueBet } from '../types'
import { supabase } from '../lib/supabase'
import { removeDuplicateValueBets } from '../utils/valueBetsUtils'

interface UseValueBetsState {
  valueBets: ApiValueBet[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
}

export function useValueBets(): UseValueBetsState {
  const [valueBets, setValueBets] = useState<ApiValueBet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchValueBets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('cached_valuebets')
        .select('*')
        .order('expectedValue', { ascending: false })

      if (dbError) throw dbError

      // Assuming valuebets in DB are already deduped by aggregator,
      // but applying it just in case if components expect it.
      const uniqueData = Array.isArray(data) ? removeDuplicateValueBets(data) : []
      const sorted = [...uniqueData].sort((a, b) => b.expectedValue - a.expectedValue)
      setValueBets(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar valuebets do banco local')
      setValueBets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchValueBets()
  }, [fetchValueBets])

  return { valueBets, loading, error, fetch: fetchValueBets }
}
