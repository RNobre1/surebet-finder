import { useState, useCallback } from 'react'
import type { ApiValueBet } from '../types'
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
      const res = await fetch('/api/valuebets')
      if (!res.ok) {
        throw new Error(`Erro ${res.status} ao buscar value bets`)
      }
      const data: ApiValueBet[] = await res.json()
      // Sort descending by expectedValue and remove duplicates
      const uniqueData = Array.isArray(data) ? removeDuplicateValueBets(data) : []
      const sorted = [...uniqueData].sort((a, b) => b.expectedValue - a.expectedValue)
      setValueBets(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setValueBets([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { valueBets, loading, error, fetch: fetchValueBets }
}
