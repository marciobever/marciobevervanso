// app/cards/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supaPublic } from '@/lib/supa-public'

type Card = {
  id: string
  slug: string | null
  title: string
  meta: string | null
  image_url: string | null
  category: string | null
  badge: string | null
}

async function getCard(idOrSlug: string): Promise<Card | null> {
  const db = supaPublic()

  // Tenta por slug
  {
    const { data, error } = await db
      .from('cards')
      .select('*')
      .eq('slug', idOrSlug)
      .maybeSingle()

    if (error) throw error
    if (data) return data as Card
  }

  // Tenta por id
  {
    const { data, error } = await db
      .from('cards')
      .select('*')
      .eq('id', idOrSlug)
      .maybeSingle()

    if (error) throw error
    if (data) return data as Card
  }

  return null
}

export default async function CardPage({ params }: { params: { id: string } }) {
  const card = await getCard(params.id)
  if (!card) notFound()

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/cards" className="text-sm text-slate-600 hover:underline">
        ← Voltar
      </Link>

      <article className="mt-3 rounded-2xl border bg-white overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.image_url || 'https://picsum.photos/seed/card/1200/800'}
          alt=""
          className="w-full aspect-[16/9] object-cover"
        />
        <div className="p-5 space-y-2">
          <div className="text-[11px] text-slate-500">{card.category || 'Cartão'}</div>
          <h1 className="text-2xl md:text-3xl font-black">{card.title}</h1>
          {card.meta ? <p className="text-slate-600">{card.meta}</p> : null}
          {card.badge ? (
            <div className="inline-block text-xs rounded-full border px-2 py-0.5 text-slate-700 border-slate-200 bg-slate-50">
              {card.badge}
            </div>
          ) : null}
        </div>
      </article>
    </main>
  )
}
