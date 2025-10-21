// app/api/posts/list/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const u = new URL(req.url)
    const page = Math.max(1, Number(u.searchParams.get('page') || '1'))
    const _limit = Math.max(1, Number(u.searchParams.get('limit') || '12'))
    const limit = Math.min(_limit, 100)

    const q = (u.searchParams.get('q') || '').trim()
    const status = (u.searchParams.get('status') || 'published').trim() // published | draft | all
    const type = (u.searchParams.get('type') || '').trim()              // cartoes | concursos | ...
    const placement = (u.searchParams.get('placement') || '').trim().toUpperCase() // EM_ALTA | DESTAQUE

    const from = (page - 1) * limit
    const to = from + limit - 1

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const db = createClient(url, key, { auth: { persistSession: false } })

    let query = db
      .from('posts')
      .select(
        'id, slug, title, summary, excerpt, url_path, published_at, image_url, type, category, minutes, reading_time, placements',
        { count: 'exact' }
      )
      .order('published_at', { ascending: false })
      .range(from, to)

    if (q) {
      // título OU slug
      query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`)
    }

    if (type) query = query.eq('type', type)

    if (placement) {
      // placements é text[] => .contains aceita array JS
      query = query.contains('placements', [placement])
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, count, error } = await query
    if (error) {
      console.error('[posts/list] erro:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    })
  } catch (err: any) {
    console.error('[posts/list] exception:', err)
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
