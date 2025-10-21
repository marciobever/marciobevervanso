// app/dashboard/n8n/page.tsx
'use client'

import N8NRunPanel from '@/components/dashboard/N8NRunPanel'

// Mantemos a rota dinâmica e sem cache de fetch
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          Integração n8n
        </h1>
        <p className="text-slate-600">
          Dispare a busca de imagens, escolha capa/inline e gere o artigo — tudo aqui.
        </p>
      </header>

      <section className="rounded-2xl border bg-white/70 backdrop-blur-md shadow-sm p-6">
        <N8NRunPanel />
      </section>
    </main>
  )
}
