'use client'

import { useEffect, useRef, useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

export default function DashboardLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [msg,   setMsg]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  // Prefill seguro + foco
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('dash_login_email')
        if (saved) setEmail(saved)
      }
    } catch { /* ignore */ }
    emailRef.current?.focus()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setMsg(null)

    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        cache: 'no-store',
      })

      // parse robusto
      let data: any = null
      const text = await res.text()
      try { data = text ? JSON.parse(text) : {} } catch { data = { message: text } }

      if (!res.ok || !data?.ok) {
        setMsg(data?.message || 'Falha no login. Verifique suas credenciais.')
      } else {
        try {
          if (remember) window.localStorage.setItem('dash_login_email', email.trim())
          else window.localStorage.removeItem('dash_login_email')
        } catch { /* ignore */ }
        window.location.href = '/dashboard'
      }
    } catch {
      setMsg('Não foi possível conectar. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100svh] grid place-items-center bg-[radial-gradient(80%_120%_at_-10%_-10%,#e9f1ff_0%,transparent_40%),radial-gradient(70%_120%_at_110%_0%,#f1edff_0%,transparent_45%),#f6f8fb] px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight tracking-tight">Acesso ao Dashboard</h1>
            <p className="text-xs text-slate-500 -mt-0.5">Área restrita • Mapa do Crédito</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white/90 p-6 shadow-sm backdrop-blur">
          <form onSubmit={submit} className="space-y-4">
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  required
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border px-9 py-2 outline-none transition focus:ring-4 focus:ring-sky-500/20"
                  autoComplete="username"
                  inputMode="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border px-9 py-2 pr-10 outline-none transition focus:ring-4 focus:ring-sky-500/20"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <label className="inline-flex select-none items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Lembrar e-mail neste dispositivo
                </label>
                <a href="#" className="font-medium text-sky-700 hover:underline">
                  Esqueci minha senha
                </a>
              </div>
            </div>

            {/* Mensagem de erro */}
            {msg && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {msg}
              </div>
            )}

            {/* Botão */}
            <button
              disabled={loading}
              className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</>) : 'Entrar'}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
            Acesso exclusivo para administradores. Em caso de problemas, contate o suporte.
          </p>
        </div>
      </div>
    </main>
  )
}
