import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AccountsPage } from './pages/AccountsPage'
import { SurebetsPage } from './pages/SurebetsPage'
import { ValueBetsPage } from './pages/ValueBetsPage'
import { FreeBetsPage } from './pages/FreeBetsPage'

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
        <Routes>
          <Route path="/" element={<DashboardPage userId={user.id} />} />
          <Route path="/contas" element={<AccountsPage userId={user.id} />} />
          <Route path="/surebets" element={<SurebetsPage />} />
          <Route path="/value-bets" element={<ValueBetsPage />} />
          <Route path="/apostas-gratis" element={<FreeBetsPage userId={user.id} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
