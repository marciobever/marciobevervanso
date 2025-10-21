// app/api/webstories/list/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 60)
  const publishedOnly = url.searchParams.get('published') !== 'false'

  const supaUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supaKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE

  if (!supaUrl || !supaKey) {
    return NextResponse.json(
      { ok: false, error: 'SUPABASE_MISSING' },
      { status: 500 }
    )
  }

  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } })

  let q = supabase
    .from('webstories')
    .select('slug,title,poster_portrait,published,template')
    .limit(limit)

  if (publishedOnly) q = q.eq('published', true)

  // se tiver "created_at" ou "inserted_at" na tabela, você pode ordenar aqui:
  // q = q.order('created_at', { ascending: false })

  const { data, error } = await q
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, items: data || [] })
}