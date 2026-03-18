import { useState, useCallback } from 'react'
import type { ApiSurebet } from '../types'

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
      const res = await fetch('/api/surebets')
      if (!res.ok) {
        throw new Error(`Erro ${res.status} ao buscar surebets`)
      }
      const data: ApiSurebet[] = await res.json()
      setSurebets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setSurebets([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { surebets, loading, error, fetch: fetchSurebets }
}
