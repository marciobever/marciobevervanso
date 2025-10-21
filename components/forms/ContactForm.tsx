'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    // Aqui você integra com seu backend/API de e-mail (Resend, Postmark, etc.)
    // Por enquanto, só simula:
    await new Promise((r) => setTimeout(r, 900))

    setLoading(false)
    alert('Recebido! Vamos responder por e-mail. (Integração entra depois.)')
    e.currentTarget.reset()
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm">Nome</label>
        <input className="mt-1 w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2" required />
      </div>
      <div>
        <label className="text-sm">E-mail</label>
        <input type="email" className="mt-1 w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2" required />
      </div>
      <div>
        <label className="text-sm">Assunto</label>
        <input className="mt-1 w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2" />
      </div>
      <div>
        <label className="text-sm">Mensagem</label>
        <textarea rows={6} className="mt-1 w-full rounded-xl border border-white/40 bg-white/60 px-3 py-2" required />
      </div>
      <button
        disabled={loading}
        className="w-full rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 transition disabled:opacity-60"
      >
        {loading ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  )
}
