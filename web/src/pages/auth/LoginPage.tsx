import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Zap } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (authError) setError(authError.message)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 shadow-lg shadow-green-500/30">
            <Zap size={28} className="text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold">
            SureBet<span className="text-green-400">Pro</span>
          </h1>
          <p className="text-sm text-slate-400">Gerencie suas apostas com inteligência</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 backdrop-blur">
          <h2 className="mb-5 text-center text-lg font-semibold">
            {isSignUp ? 'Criar conta' : 'Entrar'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-400">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-400">
            {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
            <button
              onClick={() => setIsSignUp((v) => !v)}
              className="text-green-400 hover:underline"
            >
              {isSignUp ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
