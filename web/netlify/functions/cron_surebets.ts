import type { Handler, Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { Resend } from 'resend'
import { fetchSurebetsFromApi } from '../lib/surebetsFetcher'

const BOOKMAKERS = 'Betano,Bet365'

export const config: Config = {
  schedule: '* * * * *', // Every minute
}

export const handler: Handler = async () => {
  console.log('--- Cron Surebets Started ---')
  console.log('Time:', new Date().toISOString())

  const API_KEY = process.env.ODDS_API_KEY
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
    console.error('Missing env vars:', {
      API_KEY: !!API_KEY,
      SUPABASE_URL: !!SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!SUPABASE_SERVICE_KEY,
      RESEND_API_KEY: !!RESEND_API_KEY,
    })
    return { statusCode: 500, body: 'Missing environment variables' }
  }

  try {
    // 1. Fetch surebets
    const arbs = await fetchSurebetsFromApi(API_KEY, BOOKMAKERS)

    if (!arbs || arbs.length === 0) {
      console.log('No surebets found in this run.')
      return { statusCode: 200, body: 'No surebets found' }
    }

    // 2. Deduplication: compute a fingerprint and compare with the stored one
    const currentFingerprint = computeArbsFingerprint(arbs)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: stateRow } = await supabase
      .from('cron_state')
      .select('value')
      .eq('key', 'last-surebet-fingerprint')
      .maybeSingle()

    if (stateRow?.value === currentFingerprint) {
      console.log(
        `Same surebets as last run (hash: ${currentFingerprint.slice(0, 8)}...). Skipping email.`
      )
      return { statusCode: 200, body: 'No change, email skipped' }
    }

    // 3. Fetch users to notify
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers()

    if (error || !users) {
      console.error('Failed to fetch users from Supabase', error)
      return { statusCode: 500, body: 'Failed to fetch users' }
    }

    const emails = users.map((u) => u.email).filter(Boolean) as string[]

    if (emails.length === 0) {
      console.log('No active users to notify.')
      return { statusCode: 200, body: 'No active users' }
    }

    // 4. Format email body
    const htmlBody = formatSurebetsEmail(arbs)

    // 5. Send email
    const resend = new Resend(RESEND_API_KEY)
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Default sender for Resend free tier
      to: emails,
      subject: `🔥 ${arbs.length} Surebets Encontradas!`,
      html: htmlBody,
    })

    // 6. Save fingerprint so next run can skip if nothing changed
    await supabase.from('cron_state').upsert(
      { key: 'last-surebet-fingerprint', value: currentFingerprint, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

    console.log(`Successfully sent email with ${arbs.length} surebets to ${emails.length} users.`)
    return { statusCode: 200, body: 'Email sent' }
  } catch (err) {
    console.error('Error executing cron_surebets:', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}

// Computes a deterministic SHA-256 fingerprint of the surebets.
// Sorted by ID so order changes don't trigger a new email.
// Only includes stable fields — odds, legs, and profit — so cosmetic metadata changes don't matter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeArbsFingerprint(arbs: any[]): string {
  const normalized = arbs
    .map((arb) => ({
      id: arb.id,
      profitMargin: arb.profitMargin,
      market: arb.market?.name,
      hdp: arb.market?.hdp,
      legs: (arb.legs ?? []).map((l: { bookmaker: string; side: string; odds: string }) => ({
        bookmaker: l.bookmaker,
        side: l.side,
        odds: l.odds,
      })),
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))

  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

interface ArbLeg {
  bookmaker: string
  side: string
  label: string
  odds: string
  directLink?: string
}

interface ArbMarket {
  name: string
  hdp?: number
}

interface ArbEvent {
  home: string
  away: string
  date: string
  league: string
  sport: string
}

interface Surebet {
  id: string
  market: ArbMarket
  profitMargin: number
  legs: ArbLeg[]
  event?: ArbEvent
}

function getBetLineLabel(marketName: string, side: string, hdp?: number | null): string {
  const market = (marketName || '').toUpperCase()
  const line = hdp != null ? ` ${hdp > 0 ? '+' : ''}${hdp}` : ''

  if (market === 'TOTALS' || market === 'TOTAL') {
    if (side === 'over' || side === 'home') return `Over${line}`
    if (side === 'under' || side === 'away') return `Under${line}`
  }
  if (market === 'SPREAD' || market === 'HANDICAP' || market === 'AH') {
    return `Handicap${line} (${side})`
  }
  if (market.includes('CORNER')) {
    if (side === 'over' || side === 'home') return `Over${line} Escanteios`
    if (side === 'under' || side === 'away') return `Under${line} Escanteios`
  }

  return side
}

// Helper para formatar o email e calcular as stakes baseadas em 100 BRL
function formatSurebetsEmail(arbs: Surebet[]): string {
  let html = `<div style="font-family: Arial, sans-serif; color: #333;">`
  html += `<h2 style="color: #6366f1;">🔥 Encontramos Oportunidades de Arbitragem!</h2>`
  html += `<p>Invista R$ 100 para garantir lucro em qualquer um dos cenários abaixo:</p><hr />`

  arbs.forEach((arb) => {
    const event = arb.event
    const eventName = event ? `${event.home} vs ${event.away}` : `Evento #${arb.id}`
    const league = event ? `${event.sport} — ${event.league}` : ''
    const profit = (arb.profitMargin ?? 0).toFixed(2)
    const marketLabel = arb.market?.name ?? 'Mercado'
    const hdp = arb.market?.hdp ?? null

    const legs = arb.legs ?? []

    // Calcular stakes para o total de 100 Reais
    const impliedSum = legs.reduce((sum, l) => sum + 1 / Number(l.odds), 0)
    const TOTAL_BANKROLL = 100

    html += `<div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">`
    html += `<h3 style="margin: 0 0 4px 0; color: #1f2937;">${eventName}</h3>`
    if (league)
      html += `<p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${league}</p>`
    html += `<span style="background-color: #10b981; color: white; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: bold;">Lucro +${profit}%</span>`
    html += `<p style="margin: 8px 0 4px 0; font-size: 12px; font-weight: bold; color: #374151;">Mercado: ${marketLabel}${hdp != null ? ` (linha ${hdp})` : ''}</p>`
    html += `<ul style="list-style-type: none; padding: 0; margin-top: 8px;">`

    legs.forEach((leg) => {
      const odds = Number(leg.odds)
      const stake = impliedSum > 0 ? (TOTAL_BANKROLL * (1 / odds)) / impliedSum : 0
      const ret = stake * odds
      const betLine = getBetLineLabel(marketLabel, leg.side, hdp)
      const link = leg.directLink
        ? ` <a href="${leg.directLink}" style="color:#6366f1;">→ Link</a>`
        : ''

      html += `<li style="margin-bottom: 10px; font-size: 14px; padding: 8px; background:#f9fafb; border-radius:6px;">`
      html += `<strong>${leg.bookmaker}</strong>: <em>${betLine}</em> @${odds.toFixed(2)}<br />`
      html += `<span style="color: #6366f1;">💰 Apostar: R$ ${stake.toFixed(2)}</span> → Retorno: <strong>R$ ${ret.toFixed(2)}</strong>${link}`
      html += `</li>`
    })

    html += `</ul></div>`
  })

  html += `<p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Scan automático de surebets — verifica a cada minuto.</p>`
  html += `</div>`

  return html
}
