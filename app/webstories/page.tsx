// app/webstories/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

type ApiRow = {
  id?: string
  slug?: string
  title?: string
  poster_portrait?: string
  image_url?: string
  cover?: string
  updated_at?: string | null
  published_at?: string | null
  created_at?: string | null
}

type Card = {
  id: string
  slug: string
  title: string
  image: string
  href: string
  published_at: string | null
}

function normalizeRow(r: ApiRow): Card | null {
  const slug = String(r.slug ?? '').trim()
  if (!slug) return null
  const title = String(r.title ?? 'Web Story')
  const image =
    String(r.poster_portrait ?? r.image_url ?? r.cover ?? '').trim()
  const published_at = (r.updated_at ?? r.published_at ?? r.created_at ?? null) as string | null
  return {
    id: String(r.id ?? slug),
    slug,
    title,
    image,
    href: `/webstories/${encodeURIComponent(slug)}/amp`,
    published_at,
  }
}

async function fetchWebstories(): Promise<Card[]> {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const base = host ? `${proto}://${host}` : ''

  const res = await fetch(`${base}/api/webstories`, {
    cache: 'no-store',
    next: { revalidate: 0 },
  })
  if (!res.ok) return []

  const json = await res.json()
  // a API pode retornar um array direto OU { items: [...] }
  const arr: ApiRow[] = Array.isArray(json) ? json : Array.isArray(json.items) ? json.items : []

  // normaliza + remove nulos
  const items = arr.map(normalizeRow).filter(Boolean) as Card[]

  // ordena por data desc (quando houver)
  items.sort((a, b) => {
    const ta = a.published_at ? Date.parse(a.published_at) : 0
    const tb = b.published_at ? Date.parse(b.published_at) : 0
    return tb - ta
  })

  return items
}

export default async function WebstoriesPage() {
  const items = await fetchWebstories()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Web Stories</h1>
          <p className="text-slate-600">Veja todos os Web Stories publicados.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-slate-600">
          Nenhum web story encontrado.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map((it) => (
            <li key={it.id} className="overflow-hidden rounded-2xl border bg-white transition hover:shadow">
              <Link href={it.href} className="block">
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                  {it.image ? (
                    <Image
                      src={it.image}
                      alt={it.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400">sem imagem</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 font-medium">{it.title}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
