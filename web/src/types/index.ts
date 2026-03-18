// ─── Bookmaker Account ───────────────────────────────────────────────────────
export interface BookmakerAccount {
  id: string
  user_id: string
  name: string
  balance: number
  currency: string
  color: string
  is_active: boolean
  notes?: string
  created_at: string
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export type TransactionType = 'deposit' | 'withdrawal' | 'surebet_profit' | 'free_bet' | 'other'

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  type: TransactionType
  amount: number
  description?: string
  date: string // ISO date string
  created_at: string
  bookmaker_account?: BookmakerAccount
}

// ─── Surebet ─────────────────────────────────────────────────────────────────
export interface SurebetLeg {
  bookmaker: string
  side: string
  label: string
  odds: string
  stake?: number
  directLink?: string
  href?: string
}

export interface SurebetMarket {
  name: string
  hdp?: number
}

export interface SurebetEvent {
  home: string
  away: string
  date: string
  league: string
  sport: string
}

export interface OptimalStake {
  bookmaker: string
  side: string
  stake: number
  potentialReturn: number
}

/** Raw surebet coming from odds-api.io /arbitrage-bets */
export interface ApiSurebet {
  id: string
  eventId: number
  market: SurebetMarket
  impliedProbability: number
  profitMargin: number
  totalStake: number
  updatedAt: string
  legs: SurebetLeg[]
  optimalStakes: OptimalStake[]
  event?: SurebetEvent
}

/** Surebet saved in our Supabase history */
export interface SurebetHistory {
  id: string
  user_id: string
  event_name: string
  sport: string
  league: string
  market: string
  profit_margin: number
  total_stake: number
  event_date: string
  legs: SurebetLeg[]
  status: 'active' | 'settled' | 'expired'
  created_at: string
  updated_at: string
}

// ─── Value Bet ───────────────────────────────────────────────────────────────
export interface ValueBetOdds {
  home?: string
  draw?: string
  away?: string
  hdp?: string
  href?: string
  homeDirectLink?: string
  drawDirectLink?: string
  awayDirectLink?: string
}

export interface ValueBetMarket {
  name: string
  hdp?: number
  home?: string
  draw?: string
  away?: string
  max?: number
}

export interface ApiValueBet {
  id: string
  eventId: number
  bookmaker: string
  betSide: string
  expectedValue: number
  expectedValueUpdatedAt: string
  market: ValueBetMarket
  bookmakerOdds: ValueBetOdds
  event?: SurebetEvent
}

// ─── Free Bet ────────────────────────────────────────────────────────────────
export interface FreeBet {
  id: string
  user_id: string
  bookmaker: string
  amount: number
  expires_at: string // ISO date
  description?: string
  is_used: boolean
  created_at: string
}

// ─── Dashboard Aggregations ──────────────────────────────────────────────────
export interface DashboardStats {
  totalAllocated: number
  totalProfit: number
  roi: number
  openFreeBets: number
  openFreeBetsValue: number
}

export interface ChartDataPoint {
  label: string // "Semana 12", "Mar", "2025"
  profit: number
  deposits: number
  withdrawals: number
}
