// app/api/posts/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function jsonUtf(payload: any, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init?.headers || {}) },
  })
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL missing')
  if (!service) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing')
  return createClient(url, service, { auth: { persistSession: false } })
}

function slugify(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

/** GET — lista últimos posts (padrão PRO) */
export async function GET() {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('posts')
      .select(
        // apenas colunas do modelo PRO
        'id, slug, title, status, image_url, excerpt, content_html, published_at, updated_at, created_at'
      )
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return jsonUtf({ ok: true, data: data || [] })
  } catch (e: any) {
    return jsonUtf({ ok: false, error: e?.message || 'erro' }, { status: 500 })
  }
}

/** POST — cria/atualiza (padrão PRO sem fallback) */
export async function POST(req: Request) {
  try {
    const supabase = getClient()
    const body = await req.json()

    const {
      id,
      title,
      slug,
      status = 'draft',
      // no PRO usamos excerpt + content_html
      meta = '',
      content = '',
      image_url = '',
      published_at,
    } = body || {}

    if (!title) return jsonUtf({ ok: false, error: 'Título obrigatório' }, { status: 400 })

    const finalSlug = (slug && String(slug).trim()) || slugify(title)
    const now = new Date().toISOString()

    // payload apenas com colunas PRO
    const base = {
      title: String(title),
      slug: finalSlug,
      status: String(status),
      image_url: String(image_url || ''),
      excerpt: String(meta || ''),           // meta -> excerpt
      content_html: String(content || ''),   // content -> content_html
      updated_at: now,
      ...(published_at ? { published_at } : {}),
    }

    let row: any = null

    if (id) {
      // update por id
      const { data, error } = await supabase.from('posts').update(base).eq('id', id).select('*').single()
      if (error) throw error
      row = data
    } else {
      // upsert por slug
      const { data: existing, error: findErr } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle()
      if (findErr) throw findErr

      if (existing?.id) {
        const { data, error } = await supabase.from('posts').update(base).eq('id', existing.id).select('*').single()
        if (error) throw error
        row = data
      } else {
        const payload = { ...base, created_at: now }
        const { data, error } = await supabase.from('posts').insert(payload).select('*').single()
        if (error) throw error
        row = data
      }
    }

    return jsonUtf({ ok: true, data: row })
  } catch (e: any) {
    return jsonUtf({ ok: false, error: e?.message || 'erro' }, { status: 500 })
  }
}
