import { createClient } from '@supabase/supabase-js'

export function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend updates

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key missing in environment variables.')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function saveValueBets(bets: Record<string, any>[]) {
  const supabase = getSupabaseClient()

  // Flush old cache. Using neq 'id', '0' to delete practically everything.
  await supabase.from('cached_valuebets').delete().neq('id', '0')

  if (bets.length > 0) {
    const { error } = await supabase.from('cached_valuebets').insert(bets)
    if (error) {
      console.error('Error inserting valuebets:', error)
      return { success: false, error }
    }
  }

  return { success: true }
}

export async function saveSurebets(bets: Record<string, any>[]) {
  const supabase = getSupabaseClient()

  await supabase.from('cached_surebets').delete().neq('id', '0')

  if (bets.length > 0) {
    const { error } = await supabase.from('cached_surebets').insert(bets)
    if (error) {
      console.error('Error inserting surebets:', error)
      return { success: false, error }
    }
  }

  return { success: true }
}

export async function getCronState(
  type: 'surebets' | 'valuebets' | 'surebets_queue'
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cron_state')
    .select('*')
    .eq('id', type)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is 'not found'
    throw error
  }

  return data || null
}

export async function updateCronState(
  type: 'surebets' | 'valuebets' | 'surebets_queue',
  state: Record<string, any>
) {
  const supabase = getSupabaseClient()

  const payload = { id: type, ...state, updated_at: new Date().toISOString() }

  const existing = await getCronState(type)
  if (!existing) {
    const { error } = await supabase.from('cron_state').insert([payload])
    if (error) throw error
  } else {
    // Upsert
    const { error } = await supabase
      .from('cron_state')
      .update(payload)
      .eq('id', type)
    if (error) throw error
  }
}
