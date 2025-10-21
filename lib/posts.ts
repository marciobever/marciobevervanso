// lib/posts.ts
export type PostRow = {
  id: string
  title: string
  slug: string
  image_url?: string | null
  type?: string | null
  category?: string | null
  flags?: { published?: boolean; placements?: string[] } | null
  created_at?: string | null
}

function getBase() {
  // prioridade: NEXT_PUBLIC_BASE_URL -> VERCEL_URL -> localhost
  let base =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    ''

  // se vier só domínio (ex: myapp.vercel.app), prefixa https://
  if (base && !/^https?:\/\//i.test(base)) {
    base = `https://${base}`
  }

  // fallback dev
  if (!base) {
    const port = process.env.PORT || '3000'
    base = `http://localhost:${port}`
  }

  return base.replace(/\/+$/, '')
}

export async function listPosts(opts: {
  page?: number
  limit?: number
  q?: string
  type?: string
  placement?: string   // 'EM_ALTA' | 'DESTAQUE' | ...
  status?: 'published' | 'draft' | 'all'
}) {
  const p = new URLSearchParams()
  p.set('page', String(opts.page ?? 1))
  p.set('limit', String(Math.min(Math.max(Number(opts.limit ?? 6), 1), 100)))
  if (opts.q) p.set('q', opts.q)
  if (opts.type) p.set('type', opts.type)
  if (opts.status) p.set('status', opts.status)
  if (opts.placement) p.set('placement', opts.placement)

  const url = new URL(`/api/dashboard/posts/list?${p.toString()}`, getBase())
  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error(await res.text())
  const json = await res.json()
  return { items: (json.items || []) as PostRow[], total: json.total as number }
}