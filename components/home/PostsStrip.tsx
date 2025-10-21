// components/home/PostsStrip.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import GlassCard from '@/components/ui/GlassCard'
import CategoryBadge from '@/components/ui/CategoryBadge'

type PostRow = {
  id: string
  title: string
  slug: string
  category: string | null
  type?: string | null
  status?: string | null
  image_url?: string | null
  summary?: string | null
  minutes?: number | null
  reading_time?: number | null
  placements?: string[] | null
  published_at?: string | null
  created_at?: string | null
}

type Props = {
  title: string
  limit?: number
  /** Filtra por placement (ex.: "DESTAQUE"). Se presente, ignora `type`/`category`. */
  placement?: string
  /** Filtra por type. */
  type?: 'cartoes' | 'concursos' | 'empregos' | 'beneficios'
  /** Filtra por category (ex.: "guias"). Pode combinar com `type` quando `placement` não está definido. */
  category?: string
  /** Nº de colunas no desktop (lg). */
  cols?: 1 | 2 | 3 | 4
  /** URL do "Ver todos" */
  linkAll?: string
  /** Aspect ratio do card. */
  cardAspect?: 'aspect-[4/3]' | 'aspect-[16/10]' | 'aspect-[16/9]' | 'aspect-[3/4]'
  /** Modo compacto; `compact` é alias de `dense` para compatibilidade. */
  dense?: boolean
  compact?: boolean
}

/* =========================
   Helpers de URL canônica
========================= */
function norm(s?: string | null) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/** Decide o "kind" canônico para montar /posts/{kind}/{slug} */
function canonicalKindFromRow(p: Pick<PostRow, 'category' | 'type'>) {
  const cat = norm(p?.category)
  const typ = norm(p?.type)
  const primary = ['cartoes', 'beneficios', 'concursos', 'empregos']
  if (primary.includes(cat)) return cat
  if (primary.includes(typ)) return typ
  if ((typ === 'guia' || typ === 'lista') && cat) return cat
  return cat || typ || 'posts'
}

/* =========================
   Card
========================= */
function PostCard({
  p,
  aspect = 'aspect-[4/3]',
  dense = false,
}: {
  p: PostRow
  aspect?: Props['cardAspect']
  dense?: boolean
}) {
  const kind = canonicalKindFromRow(p)
  const href = `/posts/${encodeURIComponent(kind)}/${encodeURIComponent(p.slug)}`
  const minutes = p.minutes ?? p.reading_time ?? 6

  return (
    <Link href={href} className="group block focus:outline-none">
      <GlassCard
        className={[
          'flex h-full flex-col overflow-hidden p-0 transition',
          'rounded-2xl border bg-white shadow-sm',
          'hover:-translate-y-[2px] hover:shadow-lg',
        ].join(' ')}
      >
        <div className={`relative ${aspect ?? 'aspect-[4/3]'} w-full overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-400">
              sem imagem
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
          <CategoryBadge
            value={canonicalKindFromRow(p)}
            className="absolute left-3 top-3 border-white/70 bg-white/90 backdrop-blur-sm"
          />
        </div>

        <div className={['flex flex-1 flex-col', dense ? 'p-3' : 'p-4'].join(' ')}>
          <h4
            className={[
              'line-clamp-2 font-extrabold text-slate-900',
              dense ? 'text-base leading-snug' : 'text-[1.05rem] leading-snug md:text-lg',
            ].join(' ')}
          >
            {p.title}
          </h4>

          {p.summary && (
            <p className={['mt-2 line-clamp-2 text-slate-600', dense ? 'text-sm' : 'text-[0.95rem]'].join(' ')}>
              {p.summary}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-slate-500">
            <span>{minutes} min</span>
            <span className="font-medium">Ler mais →</span>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}

/* =========================
   Componente principal
========================= */
export default function PostsStrip({
  title,
  limit = 6,
  placement,
  type,
  category,
  cols = 3,
  linkAll,
  cardAspect = 'aspect-[4/3]',
  dense,
  compact,
}: Props) {
  const [items, setItems] = useState<PostRow[]>([])
  const [loading, setLoading] = useState(true)

  const isDense = !!(dense || compact)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      setItems([])
      setLoading(false)
      return
    }

    const supabase = createClient(url, key)
    let cancelled = false

    ;(async () => {
      setLoading(true)

      // Base da query
      let query = supabase
        .from('posts')
        .select(
          'id,title,slug,category,type,status,image_url,summary,minutes,reading_time,placements,published_at,created_at'
        )
        .eq('status', 'published')

      if (placement) {
        // Quando tem placement, ignora type/category
        query = query.contains('placements', [placement])
      } else {
        const t = norm(type)
        // Casos especiais: empregos/concursos -> OR por type ou category
        if (t === 'empregos' || t === 'concursos') {
          query = query.or(`type.eq.${t},category.eq.${t}`)
        } else {
          if (type) query = query.eq('type', type)
          if (category) query = query.eq('category', category)
        }
      }

      query = query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit)

      const { data, error } = await query

      if (!cancelled) {
        setItems(error ? [] : data || [])
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [placement, type, category, limit])

  const lgCols =
    cols === 4 ? 'lg:grid-cols-4' :
    cols === 2 ? 'lg:grid-cols-2' :
    cols === 1 ? 'lg:grid-cols-1' :
    'lg:grid-cols-3'

  return (
    <section className="w-full">
      <div className="mb-4 flex items-end justify-between gap-2 md:mb-5">
        <h3 className="text-xl font-extrabold md:text-2xl">{title}</h3>
        {linkAll && (
          <Link href={linkAll} className="text-sm text-slate-500 hover:text-slate-700">
            Ver todos
          </Link>
        )}
      </div>

      <div className={`grid gap-6 sm:grid-cols-2 ${lgCols}`}>
        {loading &&
          Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="h-[320px] animate-pulse rounded-2xl border border-slate-200/70 bg-slate-50"
            />
          ))}

        {!loading && items.map((p) => (
          <PostCard key={p.id} p={p} aspect={cardAspect} dense={isDense} />
        ))}

        {!loading && items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
            Nenhum post encontrado.
          </div>
        )}
      </div>
    </section>
  )
}