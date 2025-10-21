'use client'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Glass } from '@/components/ui'

export default function NewsletterSignup({
  className = '',
  source = 'home',
}: { className?: string; source?: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState<boolean | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null); setOk(null)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, source, tags: ['site'] }),
      })
      const data = await res.json()
      setOk(!!data?.ok)
      setMsg(data?.message || (res.ok ? 'Inscrição realizada!' : 'Erro ao inscrever.'))
      if (data?.ok) { setName(''); setEmail('') }
    } catch (err: any) {
      setOk(false); setMsg(err?.message || 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`mx-auto max-w-3xl mt-12 ${className}`}>
      <Glass className="p-8 text-center rounded-2xl">
        <div className="flex flex-col items-center">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Mail className="h-6 w-6 text-sky-600" />
            Receba novidades no seu e-mail
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Benefícios, cartões, concursos e oportunidades — de forma simples e direta.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <input
            type="text"
            placeholder="Seu nome (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-slate-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="email"
            required
            placeholder="Seu melhor e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-slate-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            disabled={loading}
            className="rounded-lg bg-sky-600 px-6 py-2 font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Inscrever-se'}
          </button>
        </form>

        {msg && (
          <p className={`mt-4 text-sm ${ok ? 'text-green-600' : 'text-red-600'}`}>
            {msg}
          </p>
        )}

        <p className="mt-3 text-[11px] text-slate-500">
          Ao se inscrever, você concorda em receber e-mails do Mapa do Crédito. Sem spam. Você pode sair quando quiser.
        </p>
      </Glass>
    </section>
  )
}
