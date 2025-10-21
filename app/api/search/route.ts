// app/api/search/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // usa SERVICE_ROLE se houver; senão, cai para ANON (funciona com RLS de leitura pública)
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars ausentes')
  return createClient(url, key, { auth: { persistSession: false } })
}

const SELECT_COLS =
  'id,title,slug,type,category,image_url,url_path,status,published_at,summary,excerpt'

function normalizeTerm(q: string) {
  return q
    .replace(/[“”"‘’']/g, '')
    .replace(/\u2026/g, '...')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url)
    const qRaw = (u.searchParams.get('q') ?? '').trim()
    const type = (u.searchParams.get('type') || '').trim().toLowerCase()
    const category = (u.searchParams.get('category') || '').trim()
    const page = Math.max(1, Number(u.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(u.searchParams.get('limit') || '12')))
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supa = getClient()

    // (A) Sem termo → lista publicados
    if (!qRaw) {
      let q = supa
        .from('posts')
        .select(SELECT_COLS, { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false })
        .range(from, to)

      if (type) q = q.eq('type', type)
      if (category) q = q.ilike('category', `%${category}%`)

      const { data, error, count } = await q
      if (error) {
        return NextResponse.json({ items: [], total: 0, error: error.message })
      }
      return NextResponse.json({ items: data || [], total: count ?? (data?.length || 0), page, limit })
    }

    // (B) Com termo → 1ª tentativa (campos textuais principais, com e sem acento)
    const norm = normalizeTerm(qRaw)
    const like1 = `%${qRaw}%`
    const like2 = `%${norm}%`

    const orsNoSearchText = [
      `title.ilike.${like1}`, `slug.ilike.${like1}`, `summary.ilike.${like1}`, `excerpt.ilike.${like1}`,
      `title.ilike.${like2}`, `slug.ilike.${like2}`, `summary.ilike.${like2}`, `excerpt.ilike.${like2}`,
    ].join(',')

    let q1 = supa
      .from('posts')
      .select(SELECT_COLS)
      .eq('status', 'published')
      .or(orsNoSearchText)
      .order('published_at', { ascending: false })
      .range(from, to)

    if (type) q1 = q1.eq('type', type)
    if (category) q1 = q1.ilike('category', `%${category}%`)

    let { data: items, error: err1 } = await q1

    // (C) 2ª tentativa (fallback): inclui coluna `search_text` (normalizada) se existir
    if ((!items || items.length === 0) || err1) {
      try {
        const orsWithSearchText = [
          orsNoSearchText,
          `search_text.ilike.%${norm}%`,
        ].join(',')
        let q2 = supa
          .from('posts')
          .select(SELECT_COLS)
          .eq('status', 'published')
          .or(orsWithSearchText)
          .order('published_at', { ascending: false })
          .range(from, to)

        if (type) q2 = q2.eq('type', type)
        if (category) q2 = q2.ilike('category', `%${category}%`)

        const r2 = await q2
        if (!r2.error && r2.data) items = r2.data
      } catch {
        // se a coluna não existir, ignoramos
      }
    }

    return NextResponse.json({ items: items || [], total: items?.length || 0, page, limit })
  } catch (e: any) {
    return NextResponse.json({ items: [], total: 0, error: e?.message || 'Erro' })
  }
}
