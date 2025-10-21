import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Contest = {
  id: string
  org: string
  role?: string
  uf?: string
  deadline?: string
}

const MOCK: Contest[] = [
  { id: 'co1', org: 'Banco Público', role: 'Atendimento', uf: 'BR', deadline: '05/10' },
  { id: 'co2', org: 'TR Regional', role: 'Técnico Judiciário', uf: 'SP', deadline: '22/11' },
  { id: 'co3', org: 'Prefeitura Capital', role: 'Saúde', uf: 'RS', deadline: '15/10' },
  { id: 'co4', org: 'Universidade Federal', role: 'Administrativa', uf: 'MG', deadline: '30/09' },
]

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(12, Math.max(1, Number(url.searchParams.get('limit') || '6')))

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (SUPA_URL && SUPA_ANON) {
      const db = createClient(SUPA_URL, SUPA_ANON)
      const { data, error } = await db
        .from('contests')
        .select('*')
        .or('status.is.null,status.eq.published')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        return NextResponse.json({ ok: true, items: data })
      }
    }

    return NextResponse.json({ ok: true, items: MOCK.slice(0, limit) })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}
