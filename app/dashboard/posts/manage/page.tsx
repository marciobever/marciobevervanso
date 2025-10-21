'use client'

import useSWR, { mutate as globalMutate } from 'swr'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type Post = {
  id: string
  title: string
  slug: string
  image_url?: string | null
  cover?: string | null
  kind?: string | null
  category?: string | null
  type?: string | null
  status: 'draft' | 'published'
  created_at?: string | null
  url_path?: string | null
}

type ApiResp = { ok: boolean; items: Post[]; total: number; page: number; limit: number }

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json())

function normalizeSegment(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
function isUUID(s?: string) {
  return !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}
function buildPostUrl(row: Post) {
  if (row?.url_path) return row.url_path
  const raw = row?.type || row?.category || row?.kind || 'posts'
  const kind = normalizeSegment(raw)
  const slug = row?.slug || row?.id
  return `/posts/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`
}
function fmtDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ManagePostsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [type, setType] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    p.set('limit', String(limit))
    if (q.trim()) p.set('q', q.trim())
    if (type) p.set('type', type)
    if (status) p.set('status', status)
    return p.toString()
  }, [page, limit, q, type, status])

  const key = `/api/dashboard/posts/list?${params}`
  const { data, isLoading, error, mutate } = useSWR<ApiResp>(key, fetcher)

  const total = data?.total ?? 0
  const maxPage = Math.max(1, Math.ceil(total / limit))

  async function setStatusFor(id: string, next: 'published' | 'draft') {
    await mutate(async current => {
      if (!current) return current
      const items = current.items.map(it => (it.id === id ? { ...it, status: next } : it))
      const optimistic = { ...current, items }
      const res = await fetch('/api/dashboard/posts/set-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      return optimistic
    }, { revalidate: true })
  }

  async function remove(id: string) {
    const ok = confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')
    if (!ok) return
    await mutate(async current => {
      if (!current) return current
      const optimistic = { ...current, items: current.items.filter(i => i.id !== id), total: current.total - 1 }
      const res = await fetch('/api/dashboard/posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Falha ao excluir')
      globalMutate(key)
      return optimistic
    }, { revalidate: true })
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Posts</h1>
          <p className="text-slate-500">Gerencie rascunhos e publicados.</p>
        </div>
        {/* 🔁 atualizado: leva para a página de integrações (n8n) */}
        <Link
          href="/dashboard/n8n#artigos"
          className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white shadow hover:bg-slate-800"
        >
          Novo post
        </Link>
      </div>

      {/* filtros */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white/70 p-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Buscar por título ou slug…"
            className="h-10 w-64 rounded-xl border px-3"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as any); setPage(1) }}
            className="h-10 rounded-xl border px-3"
          >
            <option value="all">Status: todos</option>
            <option value="published">Status: published</option>
            <option value="draft">Status: draft</option>
          </select>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
            className="h-10 rounded-xl border px-3"
          >
            <option value="">Tipo: todos</option>
            <option value="concursos">concursos</option>
            <option value="empregos">empregos</option>
            <option value="cartoes">cartoes</option>
            <option value="beneficios">beneficios</option>
          </select>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
            className="h-10 rounded-xl border px-3"
          >
            <option value={12}>12 por página</option>
            <option value={24}>24 por página</option>
            <option value={48}>48 por página</option>
          </select>
        </div>
      </div>

      {/* grid */}
      {isLoading ? (
        <div className="text-slate-500">Carregando…</div>
      ) : error || !data?.ok ? (
        <div className="text-red-600">Erro ao carregar: {error?.message || 'desconhecido'}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items
              .filter(p => isUUID(p.id) && p.title && p.slug)
              .map(p => {
                const section = (p.type || p.category || p.kind || 'post').toString()
                const badgeColor =
                  p.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                const thumb = p.image_url || p.cover || ''
                return (
                  <div key={p.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={p.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-400">sem imagem</div>
                      )}
                    </div>

                    <div className="p-3">
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="rounded-full border px-2 py-[2px] uppercase tracking-wide text-slate-600">
                          {section}
                        </span>
                        <span className={`rounded-full border px-2 py-[2px] ${badgeColor}`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="line-clamp-2 font-medium leading-snug">{p.title}</div>
                      {p.created_at && (
                        <div className="mt-0.5 text-[11px] text-slate-500">criado em {fmtDate(p.created_at)}</div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={buildPostUrl(p)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border px-3 py-1 text-sm hover:bg-slate-50"
                        >
                          Ver
                        </a>
                        <Link
                          href={`/dashboard/posts/${p.id}`}
                          className="rounded-xl border px-3 py-1 text-sm hover:bg-slate-50"
                        >
                          Editar
                        </Link>

                        {p.status === 'published' ? (
                          <button
                            onClick={() => setStatusFor(p.id, 'draft')}
                            className="rounded-xl border px-3 py-1 text-sm hover:bg-slate-50"
                            title="Despublicar (volta a draft)"
                          >
                            Despublicar
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatusFor(p.id, 'published')}
                            className="rounded-xl bg-slate-900 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-800"
                            title="Publicar"
                          >
                            Publicar
                          </button>
                        )}

                        <button
                          onClick={() => remove(p.id)}
                          className="ml-auto rounded-xl border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* paginação */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Total: {total} — Página {page} / {maxPage}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border px-3 py-1 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(maxPage, p + 1))}
                disabled={page >= maxPage}
                className="rounded-xl border px-3 py-1 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
