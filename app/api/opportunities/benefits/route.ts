import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Benefit = {
  id?: string
  slug?: string
  title: string
  agency?: string
  tag?: string
}

const MOCK: Benefit[] = [
  { slug: 'bolsa-familia-2025-regras', title: 'Bolsa Família 2025: regras, valores e como se inscrever', agency: 'MDS', tag: 'Benefícios' },
  { slug: 'auxilio-gas-2025', title: 'Auxílio Gás 2025: calendário e como receber', agency: 'Governo Federal', tag: 'Benefícios' },
]

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(12, Math.max(1, Number(url.searchParams.get('limit') || '6')))

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // se você decidir salvar benefícios em "posts" (type='beneficios'), já puxa daqui:
    if (SUPA_URL && SUPA_ANON) {
      const db = createClient(SUPA_URL, SUPA_ANON)
      const { data, error } = await db
        .from('posts')
        .select('id,slug,title,category,flags')
        .eq('status', 'published')
        .eq('type', 'beneficios')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        const mapped = data.map((p) => ({
          id: p.id,
          slug: p.slug || p.id,
          title: p.title,
          agency: p.category || undefined,
          tag: 'Benefícios',
        }))
        return NextResponse.json({ ok: true, items: mapped })
      }
    }

    return NextResponse.json({ ok: true, items: MOCK.slice(0, limit) })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}
