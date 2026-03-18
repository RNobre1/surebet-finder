import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, Zap, TrendingUp, Gift, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contas', icon: Wallet, label: 'Contas' },
  { to: '/surebets', icon: Zap, label: 'Surebets' },
  { to: '/value-bets', icon: TrendingUp, label: 'Value Bets' },
  { to: '/apostas-gratis', icon: Gift, label: 'Apostas Grátis' },
]

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const handleLogout = () => supabase.auth.signOut()

  return (
    <div className="flex h-full bg-[#0f172a] text-white">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-slate-800 bg-slate-900/60">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
            <Zap size={16} className="text-slate-900" />
          </div>
          <span className="text-base font-bold tracking-tight">
            SureBet<span className="text-green-400">Pro</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-500/15 text-green-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
