import type { Handler, Config } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
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
      RESEND_API_KEY: !!RESEND_API_KEY
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

    // 2. Fetch users to notify
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

    // 3. Format email body
    const htmlBody = formatSurebetsEmail(arbs)

    // 4. Send email
    const resend = new Resend(RESEND_API_KEY)
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Default sender for Resend free tier
      to: emails,
      subject: `🔥 ${arbs.length} Surebets Encontradas!`,
      html: htmlBody,
    })

    console.log(`Successfully sent email with ${arbs.length} surebets to ${emails.length} users.`)
    return { statusCode: 200, body: 'Email sent' }
  } catch (err) {
    console.error('Error executing cron_surebets:', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}

interface Outcome {
  name: string
  price: number
}

interface Market {
  key: string
  outcomes: Outcome[]
}

interface Bookmaker {
  title: string
  markets: Market[]
}

interface Surebet {
  home_team: string
  away_team: string
  bookmakers: Bookmaker[]
}


// Helper para formatar o email e calcular as stakes baseadas em 100 BRL
function formatSurebetsEmail(arbs: Surebet[]): string {
  let html = `<div style="font-family: Arial, sans-serif; color: #333;">`
  html += `<h2 style="color: #6366f1;">Encontramos Oportunidades de Arbitragem!</h2>`
  html += `<p>Invista R$ 100 para garantir lucro em qualquer um dos cenários abaixo:</p><hr />`

  arbs.forEach((arb) => {
    // Extraindo as pernas ("legs") dessa arbitragem
    const legs: {
      bookmaker: string
      market: string
      name: string
      price: number
    }[] = []

    if (arb.bookmakers) {
      arb.bookmakers.forEach((bm) => {
        if (bm.markets) {
          bm.markets.forEach((market) => {
            if (market.outcomes) {
              market.outcomes.forEach((outcome) => {
                legs.push({
                  bookmaker: bm.title,
                  market: market.key,
                  name: outcome.name,
                  price: outcome.price,
                })
              })
            }
          })
        }
      })
    }

    // Calcular lucro garantido
    let impliedSum = 0
    legs.forEach((l) => {
      impliedSum += 1 / l.price
    })
    const profitMargin = ((1 - impliedSum) * 100).toFixed(2)

    html += `<div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">`
    html += `<h3 style="margin: 0 0 8px 0; color: #1f2937;">⚽ ${arb.home_team} vs ${arb.away_team}</h3>`
    html += `<span style="background-color: #10b981; color: white; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: bold;">Lucro +${profitMargin}%</span>`
    html += `<ul style="list-style-type: none; padding: 0; margin-top: 12px;">`

    // Calcular stakes para o total de 100 Reais
    const TOTAL_BANKROLL = 100
    legs.forEach((leg) => {
      const stake = (TOTAL_BANKROLL * (1 / leg.price)) / impliedSum
      const ret = stake * leg.price
      html += `<li style="margin-bottom: 8px; font-size: 14px;">`
      html += `<strong>${leg.bookmaker}</strong> (${leg.market}): Aposta em <strong>${leg.name}</strong> @${leg.price.toFixed(2)}<br />`
      html += `<span style="color: #6366f1;">💰 Apostar: R$ ${stake.toFixed(2)}</span> / Retorno: R$ ${ret.toFixed(2)}`
      html += `</li>`
    })

    html += `</ul></div>`
  })

  html += `<p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Este é um scan automático de surebets (roda a cada 6 minutos).</p>`
  html += `</div>`

  return html
}
