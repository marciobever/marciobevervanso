// components/home/Opportunities.tsx
'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Glass } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'

type Item = {
  id: string
  title?: string
  role?: string
  location?: string
  type?: string
  deadline?: string
  uf?: string
  slug?: string | null
  url_path?: string | null
  kind?: string | null
  category?: string | null
}

const FALLBACK_JOBS: Item[] = [
  { id: 'j1', role: 'Assistente Administrativo (Remoto)', location: 'Brasil', type: 'Remote', deadline: '20/09' },
  { id: 'j2', role: 'Analista de Suporte – Júnior', location: 'SP', type: 'Full', deadline: '25/09' },
]

const FALLBACK_CONTESTS: Item[] = [
  { id: 'c1', role: 'Técnico Judiciário', location: 'TRT', type: 'Edital', deadline: '22/10', uf: 'SP' },
]

const FALLBACK_BENEFITS: Item[] = [
  { id: 'b1', title: 'Bolsa Família – atualização CadÚnico', location: 'Brasil', type: 'Governo' },
  { id: 'b2', title: 'Tarifa Social de Energia', location: 'Brasil', type: 'Governo' },
]

const TAB_KIND_MAP = {
  jobs: 'empregos',
  contests: 'concursos',
  benefits: 'beneficios',
} as const

function norm(s?: string | null) {
  return (s || '').toLowerCase().trim()
}

function buildHref(x: Item, tab: 'jobs' | 'contests' | 'benefits') {
  if (x.url_path) return x.url_path
  const kind = norm(x.kind) || norm(x.category) || TAB_KIND_MAP[tab]
  const slugOrId = x.slug || x.id
  return `/posts/${encodeURIComponent(kind || 'outros')}/${encodeURIComponent(String(slugOrId))}`
}

export default function Opportunities({
  jobs = [],
  contests = [],
  benefits = [],
}: { jobs?: Item[]; contests?: Item[]; benefits?: Item[] }) {
  const [tab, setTab] = useState<'jobs' | 'contests' | 'benefits'>('jobs')

  const jobCounts = useMemo(() => {
    const total = jobs.length || FALLBACK_JOBS.length
    const remote = jobs.length
      ? jobs.filter((j) => j.type === 'Remote').length
      : FALLBACK_JOBS.filter((j) => j.type === 'Remote').length
    const full = jobs.length
      ? jobs.filter((j) => j.type === 'Full').length
      : FALLBACK_JOBS.filter((j) => j.type === 'Full').length
    return { total, remote, full }
  }, [jobs])

  const list =
    tab === 'jobs'
      ? (jobs.length ? jobs : FALLBACK_JOBS)
      : tab === 'contests'
      ? (contests.length ? contests : FALLBACK_CONTESTS)
      : (benefits.length ? benefits : FALLBACK_BENEFITS)

  return (
    <section id="opportunities" className="mt-10">
      <div className="flex items-end justify-between mb-4">
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">Oportunidades</h3>
        <p className="text-slate-500 text-sm">Atualizadas em tempo real</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('jobs')}
          className={`px-3 py-2 rounded-lg border font-semibold ${
            tab === 'jobs' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white'
          }`}
        >
          Empregos
        </button>
        <button
          onClick={() => setTab('contests')}
          className={`px-3 py-2 rounded-lg border font-semibold ${
            tab === 'contests' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white'
          }`}
        >
          Concursos
        </button>
        <button
          onClick={() => setTab('benefits')}
          className={`px-3 py-2 rounded-lg border font-semibold ${
            tab === 'benefits' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white'
          }`}
        >
          Benefícios
        </button>
      </div>

      <div className="grid md:grid-cols-[1.2fr_.8fr] gap-6">
        <div className="flex flex-col gap-3">
          {list.map((x: Item) => {
            const href = buildHref(x, tab)
            return (
              <Glass key={x.id} className="p-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <strong className="block">{x.role || x.title}</strong>
                    <div className="text-sm text-slate-500">
                      {x.location || x.uf || ''} {x.type ? `• ${x.type}` : ''}
                      {x.deadline ? ` • até ${x.deadline}` : ''}
                    </div>
                  </div>
                  <Link
                    href={href}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-bold"
                  >
                    {tab === 'contests' ? 'Ver edital' : tab === 'benefits' ? 'Como solicitar' : 'Ver detalhes'}
                  </Link>
                </div>
              </Glass>
            )
          })}
        </div>

        <aside className="space-y-3">
          <Glass className="p-4">
            <p className="text-xs text-slate-500">Resumo</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="border rounded-lg p-2 bg-white">
                <div className="font-extrabold">{jobCounts.total}</div>
                <div className="text-[11px] text-slate-500">Total</div>
              </div>
              <div className="border rounded-lg p-2 bg-white">
                <div className="font-extrabold">{jobCounts.remote}</div>
                <div className="text-[11px] text-slate-500">Remoto</div>
              </div>
              <div className="border rounded-lg p-2 bg-white">
                <div className="font-extrabold">{jobCounts.full}</div>
                <div className="text-[11px] text-slate-500">Full-time</div>
              </div>
            </div>
            <a
              href="/curriculo"
              className="mt-3 w-full inline-flex justify-center px-3 py-2 rounded-lg bg-sky-600 text-white font-bold"
            >
              Criar currículo em 5 min
            </a>
          </Glass>

          <div>
            <div className="text-xs text-slate-500 mb-1">Ad – 300x250</div>
            <AdSlot slot="oportunidades_sidebar" />
          </div>
        </aside>
      </div>
    </section>
  )
}