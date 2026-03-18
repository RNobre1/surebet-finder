import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/auth/LoginPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const AccountsPage = lazy(() => import('./pages/AccountsPage').then(module => ({ default: module.AccountsPage })))
const SurebetsPage = lazy(() => import('./pages/SurebetsPage').then(module => ({ default: module.SurebetsPage })))
const ValueBetsPage = lazy(() => import('./pages/ValueBetsPage').then(module => ({ default: module.ValueBetsPage })))
const FreeBetsPage = lazy(() => import('./pages/FreeBetsPage').then(module => ({ default: module.FreeBetsPage })))

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0f172a]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<DashboardPage userId={user.id} />} />
            <Route path="/contas" element={<AccountsPage userId={user.id} />} />
            <Route path="/surebets" element={<SurebetsPage />} />
            <Route path="/value-bets" element={<ValueBetsPage />} />
            <Route path="/apostas-gratis" element={<FreeBetsPage userId={user.id} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}
