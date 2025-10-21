import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Job = {
  id: string
  title?: string
  role?: string
  location?: string
  type?: string
  deadline?: string
}

const MOCK: Job[] = [
  { id: 'j1', role: 'Assistente Administrativo (Remoto)', location: 'Brasil', type: 'Remote', deadline: '20/09' },
  { id: 'j2', role: 'Analista de Suporte – Júnior', location: 'SP', type: 'Full', deadline: '25/09' },
  { id: 'j3', role: 'Vendedor Interno – 1º emprego', location: 'RJ', type: 'Part' },
  { id: 'j4', role: 'Social Media (Freelancer)', location: 'Home Office', type: 'Remote' },
]

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(12, Math.max(1, Number(url.searchParams.get('limit') || '6')))

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // se tiver supabase configurado, busca de lá (tabela: jobs)
    if (SUPA_URL && SUPA_ANON) {
      const db = createClient(SUPA_URL, SUPA_ANON)
      const { data, error } = await db
        .from('jobs')
        .select('*')
        .or('status.is.null,status.eq.published')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        return NextResponse.json({ ok: true, items: data })
      }
    }

    // fallback mock
    return NextResponse.json({ ok: true, items: MOCK.slice(0, limit) })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}
