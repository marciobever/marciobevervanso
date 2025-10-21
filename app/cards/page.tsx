// app/cards/page.tsx
import Link from 'next/link'
import { supaPublic } from '@/lib/supa-public'

export const metadata = {
  title: 'Cartões — Mapa do Crédito',
  description: 'Compare benefícios e encontre o cartão ideal.',
}

export default async function Page() {
  const db = supaPublic()

  const { data, error } = await db
    .from('cards')
    .select('id,badge,title,meta,image_url,category,slug,created_at,status')
    .or('status.is.null,status.eq.published')
    .order('created_at', { ascending: false })
    .limit(24)

  const items = (data || []).map((c: any) => ({
    ...c,
    image_url:
      c?.image_url ||
      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1200',
  }))

  if (error) {
    // Render simples em caso de erro (evita 500)
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-black">Cartões</h1>
        <p className="text-slate-600 text-sm">Compare benefícios e encontre o cartão ideal.</p>
        <p className="mt-4 text-red-600 text-sm">Erro ao carregar cartões: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Cartões</h1>
          <p className="text-slate-600 text-sm">
            Compare benefícios e encontre o cartão ideal.
          </p>
        </div>
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {items.map((c: any) => (
          <Link
            key={c.id}
            href={`/cards/${encodeURIComponent(c.slug || c.id)}`}
            className="group overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
          >
            <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image_url}
                alt={c.title || 'Cartão de crédito'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              {c.badge ? (
                <div className="inline-block text-xs rounded-full border px-2 py-0.5 text-slate-700 border-slate-200 bg-slate-50">
                  {c.badge}
                </div>
              ) : null}
              <h3 className="font-semibold mt-2 leading-snug">{c.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{c.meta || c.category || 'Cartões'}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
