// app/posts/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'

type Post = {
  id: string
  title: string
  slug: string
  image_url?: string | null
  type?: string | null
  category?: string | null
  status: 'draft' | 'published'
}

type ApiResp = { ok: boolean; items: Post[]; total: number; page: number; limit: number }
const fetcher = (u: string) => fetch(u).then(r => r.json())

function norm(s?: string | null) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // compat ES5/Netlify
    .trim()
}
function buildPostHref(p: Post) {
  const kind = norm(p.type) || norm(p.category) || 'posts'
  const slugOrId = p.slug || p.id
  return `/posts/${encodeURIComponent(kind)}/${encodeURIComponent(String(slugOrId))}`
}

function PostsAllPageInner() {
  const sp = useSearchParams()
  const router = useRouter()

  const page = Math.max(1, Number(sp.get('page') || '1'))
  const limit = Math.max(1, Math.min(30, Number(sp.get('limit') || '12')))
  const q = (sp.get('q') || '').trim()
  const type = (sp.get('type') || '').trim()
  const placement = (sp.get('placement') || '').trim()

  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (q) params.set('q', q)
  if (type) params.set('type', type)
  if (placement) params.set('placement', placement)

  const { data, isLoading, error } = useSWR<ApiResp>(`/api/dashboard/posts/list?${params.toString()}`, fetcher)

  const total = data?.total ?? 0
  const maxPage = Math.max(1, Math.ceil(total / limit))

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(sp.toString())
    if (v) next.set(k, v); else next.delete(k)
    router.push(`/posts?${next.toString()}`)
  }

  const gotoPage = (p: number) => {
    const next = new URLSearchParams(sp.toString())
    next.set('page', String(p))
    router.push(`/posts?${next.toString()}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Postagens</h1>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value)
          }}
          placeholder="Buscar..."
          className="h-10 px-3 rounded-xl border w-64"
        />
        <select
          defaultValue={type}
          onChange={(e) => setParam('type', e.target.value)}
          className="h-10 px-3 rounded-xl border"
        >
          <option value="">Tipo: todos</option>
          <option value="concursos">concursos</option>
          <option value="empregos">empregos</option>
          <option value="cartoes">cartoes</option>
          <option value="beneficios">beneficios</option>
        </select>
        <select
          defaultValue={placement}
          onChange={(e) => setParam('placement', e.target.value)}
          className="h-10 px-3 rounded-xl border"
        >
          <option value="">Placement: todos</option>
          <option value="EM_ALTA">EM_ALTA</option>
          <option value="DESTAQUE">DESTAQUE</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-slate-500">Carregando…</div>
      ) : error || !data?.ok ? (
        <div className="text-red-600">Erro ao carregar.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((p) => (
              <Link
                key={p.id}
                href={buildPostHref(p)}
                className="group rounded-2xl overflow-hidden border bg-white hover:shadow-md transition"
              >
                <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-400">sem imagem</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                    {(p.type || p.category || 'post')}
                  </div>
                  <div className="font-medium leading-snug">{p.title}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-500">
              Total: {total} — Página {page} / {maxPage}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => gotoPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-xl border px-3 py-1 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => gotoPage(Math.min(maxPage, page + 1))}
                disabled={page >= maxPage}
                className="rounded-xl border px-3 py-1 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function PostsAllPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-6 text-slate-500">Carregando…</div>}>
      <PostsAllPageInner />
    </Suspense>
  )
}