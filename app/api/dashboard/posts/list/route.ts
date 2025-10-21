// app/api/dashboard/posts/list/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const u = new URL(req.url)
    const page = Math.max(1, Number(u.searchParams.get('page') || '1'))
    const _limit = Math.max(1, Number(u.searchParams.get('limit') || '20'))
    const limit = Math.min(_limit, 100)

    const q = (u.searchParams.get('q') || '').trim()
    // '', 'published', 'draft', 'all'
    const status = (u.searchParams.get('status') || '').trim()
    const type = (u.searchParams.get('type') || '').trim()
    const placement = (u.searchParams.get('placement') || '').trim().toUpperCase()

    const from = (page - 1) * limit
    const to = from + limit - 1

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const db = createClient(url, key, { auth: { persistSession: false } })

    // sempre trazer todos os campos relevantes ao dashboard / home
    let query = db
      .from('posts')
      .select(
        [
          'id',
          'title',
          'slug',
          'type',
          'category',
          'image_url',
          'summary',
          'excerpt',
          'content_html',
          'status',
          'placements',
          'url_path',
          'reading_time',
          'created_at',
          'published_at',
          'updated_at',
        ].join(', '),
        { count: 'exact' }
      )
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    // busca
    if (q) {
      // title OR slug
      query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`)
    }

    // filtro de status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    } else if (!status) {
      // default: published
      query = query.eq('status', 'published')
    }

    // placement em text[] (overlaps)
    if (placement) {
      query = query.overlaps('placements', [placement])
    }

    if (type) query = query.eq('type', type)

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
