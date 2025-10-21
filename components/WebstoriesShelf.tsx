// components/WebstoriesShelf.tsx
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

type Item = {
  slug: string
  title: string
  poster_portrait: string | null
  published: boolean
  template?: string | null
}

export default async function WebstoriesShelf({ limit = 12, title = 'Webstories' }: { limit?: number; title?: string }) {
  const supaUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supaKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE

  if (!supaUrl || !supaKey) {
    return null
  }

  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } })
  let q = supabase
    .from('webstories')
    .select('slug,title,poster_portrait,published,template')
    .eq('published', true)
    .limit(limit)

  // se existir created_at/inserted_at -> ordene aqui
  // q = q.order('created_at', { ascending: false })

  const { data, error } = await q
  if (error) return null

  const items: Item[] = (data || []).filter(Boolean)

  if (!items.length) return null

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link href="/webstories" className="text-sm text-blue-600 hover:underline">
          Ver todos
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((it) => (
          <Link
            key={it.slug}
            href={`/webstories/${it.slug}`}
            className="group block"
            prefetch={false}
          >
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,.25)] ring-1 ring-black/10">
              {it.poster_portrait ? (
                <img
                  src={it.poster_portrait}
                  alt={it.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-neutral-900 text-white/60 text-xs">
                  sem capa
                </div>
              )}

              {/* Selo de template (opcional) */}
              {it.template && (
                <div className="absolute left-2 top-2 rounded-md bg-black/60 text-white text-[10px] px-1.5 py-0.5 backdrop-blur">
                  {it.template}
                </div>
              )}

              {/* Gradiente + título */}
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="rounded-xl bg-gradient-to-t from-black/70 to-black/10 p-2.5 backdrop-blur-[1px] ring-1 ring-white/10">
                  <div className="line-clamp-2 text-white text-[12px] leading-tight">
                    {it.title}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}