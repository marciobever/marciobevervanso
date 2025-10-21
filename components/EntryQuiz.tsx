'use client'
import { useEffect, useState } from 'react'

export default function EntryQuiz() {
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    // busca settings
    fetch('/api/settings').then(r=>r.json()).then(j=>{
      const s = j?.settings
      if (!s?.entry_quiz_slug) return
      const key = 'entry_quiz_seen_at'
      const days = s.entry_quiz_frequency_days ?? 7
      const last = localStorage.getItem(key)
      const now = Date.now()
      const ms = days * 24 * 60 * 60 * 1000
      if (!last || (now - Number(last)) > ms) {
        setSlug(s.entry_quiz_slug)
        setOpen(true)
      }
    })
  }, [])

  if (!open || !slug) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-xl overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-sky-50 to-indigo-50 border-b">
          <h3 className="text-xl font-extrabold">Descubra seu caminho ideal</h3>
          <p className="text-sm text-slate-600">Responda 6 perguntas e receba recomendações personalizadas.</p>
        </div>
        <div className="p-5 flex gap-2 justify-end">
          <button
            className="px-3 py-2 rounded-lg text-slate-700 border"
            onClick={() => {
              localStorage.setItem('entry_quiz_seen_at', String(Date.now()))
              setOpen(false)
            }}
          >
            Agora não
          </button>
          <a
            href={`/quiz/${slug}`}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white font-semibold"
            onClick={() => localStorage.setItem('entry_quiz_seen_at', String(Date.now()))}
          >
            Começar agora
          </a>
        </div>
      </div>
    </div>
  )
}
