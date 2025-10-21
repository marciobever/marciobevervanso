// app/buscar/page.tsx
import Link from 'next/link'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  title: string
  slug: string
  kind?: string | null
  type?: string | null
  category?: string | null
  image_url?: string | null
  excerpt?: string | null
  url_path?: string | null
}

type SearchResp = {
  ok: boolean
  items: Row[]
  total: number
  page: number
  limit: number
  error?: string
}

/** remove acentos p/ bater com rotas */
function normalizeSegment(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function buildPostUrl(row: Row) {
  if (row?.url_path) return row.url_path
  const raw = row?.kind || row?.type || row?.category || 'outros'
  const kind = normalizeSegment(String(raw))
  const slug = row?.slug || row?.id
  return `/posts/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`
}

async function doSearch(q: string, page: number, limit: number, type?: string, category?: string) {
  const hs = headers()
  const host = hs.get('x-forwarded-host') || hs.get('host') || ''
  const proto = hs.get('x-forwarded-proto') || 'https'
  const origin =
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
    (host ? `${proto}://${host}` : '') ||
    ''

  const url = origin ? new URL('/api/search', origin) : new URL('/api/search', 'http://dummy')
  url.searchParams.set('q', q)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  if (type) url.searchParams.set('type', type)
  if (category) url.searchParams.set('category', category)

  const endpoint = origin ? url.toString() : `/api/search?${url.searchParams.toString()}`
  const r = await fetch(endpoint, { cache: 'no-store' })
  return (await r.json()) as SearchResp
}

export default async function Page({ searchParams }: { searchParams: Record<string, string> }) {
  const q = (searchParams.q || '').trim()
  const page = Math.max(1, Number(searchParams.page || '1'))
  const type = searchParams.type || ''
  const category = searchParams.category || ''
  const limit = 12

  const data: SearchResp = q
    ? await doSearch(q, page, limit, type, category)
    : { ok: true, items: [], total: 0, page: 1, limit }

  const items = data.items || []
  const total = data.total || 0
  const maxPage = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* header compacto */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Resultados para “{q || '…'}”
          </h1>
          <div className="text-sm text-slate-600 mt-1">
            {total} resultado(s)
            {type ? <> · filtro: <span className="px-2 py-0.5 rounded-full bg-slate-100">{type}</span> <Link href={`/buscar?q=${encodeURIComponent(q)}`} className="underline ml-1">remover</Link></> : null}
            {category ? <> · categoria: <span className="px-2 py-0.5 rounded-full bg-slate-100">{category}</span> <Link href={`/buscar?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}`} className="underline ml-1">remover</Link></> : null}
          </div>
        </div>

        {/* mini-form p/ nova busca */}
        <form action="/buscar" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Pesquisar novamente…"
            className="w-56 sm:w-72 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button className="text-sm px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700">
            Buscar
          </button>
        </form>
      </div>

      {/* grid */}
      {items.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const href = buildPostUrl(p)
            const chip = normalizeSegment(String(p.kind || p.type || p.category || 'post'))
            return (
              <Link
                key={p.id}
                href={href}
                className="group rounded-2xl overflow-hidden border bg-white hover:shadow-md transition"
              >
                <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">{chip}</div>
                  <div className="font-medium leading-snug line-clamp-2">{p.title}</div>
                  {p.excerpt && <div className="mt-1 text-sm text-slate-500 line-clamp-2">{p.excerpt}</div>}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-slate-600">Nenhum resultado.</div>
      )}

      {/* paginação */}
      {maxPage > 1 && (
        <div className="flex items-center gap-2 mt-8">
          {Array.from({ length: maxPage }).map((_, i) => {
            const n = i + 1
            const href = `/buscar?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}${
              category ? `&category=${category}` : ''
            }&page=${n}`
            return (
              <Link
                key={n}
                href={href}
                className={`px-3 py-1 rounded-lg border ${
                  n === page ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-50'
                }`}
              >
                {n}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
