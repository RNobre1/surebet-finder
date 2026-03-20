import type { Handler } from '@netlify/functions'
import { getSupabaseClient } from './lib/supabase_cache'

export const handler: Handler = async () => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('cached_surebets')
      .select('*')
      .order('profitMargin', { ascending: false })

    if (error) throw error

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || []),
    }
  } catch (err) {
    console.error('Error in surebets proxy:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch cached surebets' }),
    }
  }
}
