import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { SurebetHistory, ActiveSurebetLeg } from '../types'

export function useActiveSurebets() {
  const [activeSurebets, setActiveSurebets] = useState<SurebetHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActive = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: err } = await supabase
      .from('surebets_history')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
      setActiveSurebets([])
    } else {
      setActiveSurebets((data || []) as SurebetHistory[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActive()
  }, [fetchActive])

  const getUser = async () => (await supabase.auth.getUser()).data.user?.id

  const addSurebet = async (
    data: Omit<SurebetHistory, 'id' | 'created_at' | 'updated_at' | 'status' | 'user_id'>
  ) => {
    const userId = await getUser()
    if (!userId) return

    // 1. Insert surebet
    const { data: newBet, error: insertErr } = await supabase
      .from('surebets_history')
      .insert({
        ...data,
        status: 'active',
        user_id: userId,
      })
      .select()
      .single()

    if (insertErr || !newBet) {
      setError(insertErr?.message || 'Erro ao criar aposta.')
      return
    }

    // 2. Withdraw from accounts and insert transactions
    const legs = data.legs as ActiveSurebetLeg[]
    for (const leg of legs) {
      // Get current balance
      const { data: acc } = await supabase
        .from('bookmaker_accounts')
        .select('balance')
        .eq('id', leg.bookmaker_id)
        .single()

      if (acc) {
        // Update balance
        await supabase
          .from('bookmaker_accounts')
          .update({ balance: Number(acc.balance) - Number(leg.stake) })
          .eq('id', leg.bookmaker_id)

        // Add Transaction
        await supabase.from('transactions').insert({
          user_id: userId,
          account_id: leg.bookmaker_id,
          type: 'other',
          amount: -Number(leg.stake),
          description: `Alocação em Surebet: ${data.event_name} (${leg.market_name})`,
          date: new Date().toISOString(),
        })
      }
    }

    await fetchActive()
  }

  const resolveLeg = async (
    surebetId: string,
    surebet: SurebetHistory,
    winningLegId: string,
    uid?: string
  ) => {
    const userId = uid || (await getUser())
    if (!userId) return

    // Calculate updated legs
    const updatedLegs = surebet.legs.map((leg) => ({
      ...leg,
      status: leg.leg_id === winningLegId ? 'won' : 'lost',
    }))

    // 1. Update surebet status
    await supabase
      .from('surebets_history')
      .update({
        status: 'settled',
        legs: updatedLegs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', surebetId)

    // 2. Payout to winning bookmaker
    const winningLeg = surebet.legs.find((l) => l.leg_id === winningLegId)
    if (winningLeg) {
      const payout = Number(winningLeg.stake) * Number(winningLeg.odds)

      // Get current balance
      const { data: acc } = await supabase
        .from('bookmaker_accounts')
        .select('balance')
        .eq('id', winningLeg.bookmaker_id)
        .single()

      if (acc) {
        // Update balance
        await supabase
          .from('bookmaker_accounts')
          .update({ balance: Number(acc.balance) + payout })
          .eq('id', winningLeg.bookmaker_id)

        // Add Transaction
        await supabase.from('transactions').insert({
          user_id: userId,
          account_id: winningLeg.bookmaker_id,
          type: 'surebet_profit',
          amount: payout,
          description: `Retorno Surebet (WON): ${surebet.event_name}`,
          date: new Date().toISOString(),
        })
      }
    }

    await fetchActive()
  }

  const voidSurebet = async (surebetId: string, surebet: SurebetHistory, uid?: string) => {
    const userId = uid || (await getUser())
    if (!userId) return

    const updatedLegs = surebet.legs.map((leg) => ({
      ...leg,
      status: 'void',
    }))

    // 1. Update surebet status
    await supabase
      .from('surebets_history')
      .update({
        status: 'void',
        legs: updatedLegs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', surebetId)

    // 2. Refund all legs
    for (const leg of surebet.legs) {
      const { data: acc } = await supabase
        .from('bookmaker_accounts')
        .select('balance')
        .eq('id', leg.bookmaker_id)
        .single()

      if (acc) {
        await supabase
          .from('bookmaker_accounts')
          .update({ balance: Number(acc.balance) + Number(leg.stake) })
          .eq('id', leg.bookmaker_id)

        await supabase.from('transactions').insert({
          user_id: userId,
          account_id: leg.bookmaker_id,
          type: 'other',
          amount: Number(leg.stake),
          description: `Reembolso Surebet (VOID): ${surebet.event_name}`,
          date: new Date().toISOString(),
        })
      }
    }

    await fetchActive()
  }

  return { activeSurebets, loading, error, fetchActive, addSurebet, resolveLeg, voidSurebet }
}
