'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { FileText, Tags, BookMarked, Puzzle, PlusCircle, Sparkles, Mail, Home, LogOut } from 'lucide-react'

const fetcher = (u: string) =>
  fetch(u).then(r => r.json()).catch(() => ({ ok: false }))

const TILES = [
  { key: 'posts',        label: 'Posts',       href: '/dashboard/posts',        icon: FileText },
  { key: 'categories',   label: 'Categorias',  href: '/dashboard/categories',   icon: Tags },
  { key: 'webstories',   label: 'Webstories',  href: '/dashboard/webstories',   icon: BookMarked },
  { key: 'integracoes',  label: 'Integrações', href: '/dashboard/integracoes',  icon: Puzzle },
] as const

function TileSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-10 bg-slate-200 rounded" />
      <div className="mt-3 h-5 w-24 bg-slate-200 rounded" />
      <div className="mt-3 h-8 w-16 bg-slate-200 rounded" />
      <div className="mt-4 h-3 w-40 bg-slate-200 rounded" />
    </div>
  )
}

export default function DashboardHome() {
  const { data: countsRes, isLoading } =
    useSWR('/api/dashboard-counts?only=posts,categories,webstories', fetcher, { revalidateOnFocus:false })
  const { data: analyticsRes }  = useSWR('/api/dashboard/analytics', fetcher, { revalidateOnFocus:false })
  const { data: newsletterRes } = useSWR('/api/dashboard/newsletter?limit=6', fetcher, { revalidateOnFocus:false })

  const counts  = (countsRes && countsRes.counts) || {}
  const views7d = (analyticsRes && analyticsRes.views_last7) || 0
  const trend7d = (analyticsRes && analyticsRes.trend_last7) || 0
  const subs    = (newsletterRes && newsletterRes.items) || []

  async function handleSignOut(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/dashboard/login'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Gestão de conteúdo, integrações e visões rápidas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* ✅ Novo Post → integrações */}
          <Link
            href="/dashboard/integracoes#artigos"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold shadow hover:bg-sky-700"
          >
            <PlusCircle size={16} /> Novo post
          </Link>

          <Link
            href="/dashboard/webstories/new"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow hover:bg-violet-700"
          >
            <Sparkles size={16} /> Novo Webstory
          </Link>

          {/* 🔙 Voltar ao site */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold hover:bg-slate-50"
          >
            <Home size={16} /> Voltar ao site
          </Link>

          {/* 🚪 Sair */}
          <form onSubmit={handleSignOut}>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold hover:bg-slate-50"
            >
              <LogOut size={16} /> Sair
            </button>
          </form>
        </div>
      </header>

      {/* Tiles principais */}
      <section aria-label="Métricas" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <TileSkeleton key={`s-${i}`} />)
          : TILES.map((t) => {
              const Icon = t.icon
              const count =
                t.key === 'integracoes'
                  ? '—'
                  : (counts as Record<string, number>)[t.key] ?? 0
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:ring-1 hover:ring-slate-200 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">/{t.key}</span>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-700">
                      <Icon size={18} />
                    </span>
                  </div>
                  <div className="mt-2 font-semibold">{t.label}</div>
                  <div className="text-3xl font-black tracking-tight mt-1">{count}</div>
                  <div className="mt-3 text-sm text-sky-700 font-semibold">Abrir {t.label.toLowerCase()} →</div>
                </Link>
              )
            })}
      </section>

      {/* Analytics + Newsletter */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Analytics (7 dias)</div>
              <div className="mt-1 text-3xl font-black">{views7d.toLocaleString('pt-BR')}</div>
              <div className={`text-sm ${trend7d >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend7d >= 0 ? '▲' : '▼'} {Math.abs(trend7d)}%
              </div>
            </div>
            <Link href="/dashboard/settings" className="text-sm text-slate-500 hover:text-slate-700">Configurar fonte</Link>
          </div>
          <div className="mt-4 h-32 w-full rounded-lg bg-slate-100 grid place-items-center text-slate-400 text-xs">
            Gráfico de visualizações (placeholder)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Newsletter</div>
            <Mail size={16} className="text-slate-500" />
          </div>
          <ul className="mt-3 space-y-2">
            {subs.length === 0 && <li className="text-sm text-slate-500">Sem inscrições recentes.</li>}
            {subs.map((s: any) => (
              <li key={s.id} className="text-sm">
                <span className="font-medium">{s.email}</span>{' '}
                <span className="text-slate-500">· {new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/settings" className="mt-3 inline-block text-sm font-semibold text-sky-700 hover:underline">
            Integrar provedor →
          </Link>
        </div>
      </section>
    </div>
  )
}
