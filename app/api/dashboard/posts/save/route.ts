// app/api/dashboard/posts/save/route.ts
import { NextResponse } from 'next/server'
import { supaAdmin } from '@/lib/supa-admin'

function normStatus(v?: string | null): 'draft' | 'published' {
  const s = (v || '').toLowerCase()
  return s === 'published' || s === 'publicado' ? 'published' : 'draft'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const db = supaAdmin()

    // 1) Regras simples de status
    const publish = !!body.publish
    const status: 'draft' | 'published' = publish ? 'published' : normStatus(body.status)

    // 2) Campos OBRIGATÓRIOS (sem fallback aqui)
    const title = String(body.title || '').trim()
    const slug  = String(body.slug  || '').trim()
    const content_html = String(body.content_html || body.content || '').trim()
    const image_url    = String(body.image_url || body.cover || '').trim()

    if (!title) return NextResponse.json({ ok:false, error:'title obrigatório' }, { status:400 })
    if (!slug)  return NextResponse.json({ ok:false, error:'slug obrigatório' }, { status:400 })
    if (!content_html) return NextResponse.json({ ok:false, error:'content_html obrigatório' }, { status:400 })
    if (!image_url)    return NextResponse.json({ ok:false, error:'image_url (cover) obrigatório' }, { status:400 })

    // 3) Também exigimos resumo e tags (para o card e navegação)
    const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
    const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : ''
    const tags    = Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : []

    if (!summary) return NextResponse.json({ ok:false, error:'summary obrigatório' }, { status:400 })
    if (!excerpt) return NextResponse.json({ ok:false, error:'excerpt obrigatório' }, { status:400 })
    if (!tags.length) return NextResponse.json({ ok:false, error:'tags obrigatório (text[])' }, { status:400 })

    // 4) Campos opcionais (pass-through)
    const payload = {
      id: body.id ?? undefined,
      title,
      slug,
      type: body.type ?? null,           // ex.: 'cartoes'
      category: body.category ?? null,   // ex.: 'cartoes'
      image_url,
      summary,                           // 👈 agora persiste
      excerpt,
      content_html,
      minutes: Number.isFinite(Number(body.minutes)) ? Number(body.minutes) : null,
      reading_time: Number.isFinite(Number(body.reading_time)) ? Number(body.reading_time) : null,
      status,
      url_path: body.url_path ?? null,
      // arrays/objetos como vieram do n8n
      placements: Array.isArray(body.placements) ? body.placements.map(String) : [],
      tags,                              // 👈 text[]
      sources: Array.isArray(body.sources) ? body.sources : [],
      extras: body.extras ?? {},
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
      // published_at/updated_at ficam a cargo de triggers no DB (recomendado)
    }

    // 5) Upsert (id => update, senão insert)
    const q = payload.id
      ? db.from('posts').update(payload).eq('id', payload.id).select().single()
      : db.from('posts').insert(payload).select().single()

    const { data, error } = await q
    if (error) {
      console.error('[posts/save] erro:', error)
      return NextResponse.json({ ok:false, error: error.message }, { status:400 })
    }

    return NextResponse.json({ ok:true, post: data })
  } catch (err: any) {
    console.error('[posts/save] exception:', err)
    return NextResponse.json({ ok:false, error: err?.message || 'Erro inesperado' }, { status:500 })
  }
}
