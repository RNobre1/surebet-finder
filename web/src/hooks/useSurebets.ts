import { useState, useCallback } from 'react'
import type { ApiSurebet } from '../types'
import { supabase } from '../lib/supabase'

interface UseSurebetsState {
  surebets: ApiSurebet[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
}

export function useSurebets(): UseSurebetsState {
  const [surebets, setSurebets] = useState<ApiSurebet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSurebets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('cached_surebets')
        .select('*')
        .order('profitMargin', { ascending: false })

      if (dbError) throw dbError

      setSurebets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar surebets do banco local')
      setSurebets([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { surebets, loading, error, fetch: fetchSurebets }
}
