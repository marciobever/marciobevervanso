// app/api/n8n/approvals/confirm/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

type Json = Record<string, any> | null

// ───────────────── Supabase (Service Role) ─────────────────
function supaAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

// ───────────────── Helpers de conteúdo ─────────────────
function stripTags(s: string) {
  return (s || '').replace(/<[^>]*>/g, ' ')
}
function toAsciiLowerNoAccents(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
function slugify(s: string | null | undefined) {
  const base = toAsciiLowerNoAccents(s || '')
  const slug = base
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 140)
  return slug || null
}
function buildExcerptFromHtml(html: string, max = 220) {
  const txt = stripTags(html).replace(/\s+/g, ' ').trim()
  return txt.length > max ? txt.slice(0, max).trimEnd() + '…' : txt
}
function estimateMinutesFromHtml(html: string) {
  const wpm = 220 // média PT-BR
  const words = stripTags(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / wpm))
}

function sanitize(html: string) {
  // tipa transformTags manualmente e evita referenciar namespace de tipos
  const transformTags: Record<
    string,
    (tagName: string, attribs: Record<string, string>) => { tagName: string; attribs: Record<string, string> }
  > = {
    a: (tag, attrs) => {
      if (attrs.target === '_blank') {
        attrs.rel = attrs.rel ? `${attrs.rel} noopener noreferrer` : 'noopener noreferrer'
      }
      return { tagName: tag, attribs: attrs }
    },
    img: (tag, attrs) => {
      if (!attrs.loading) attrs.loading = 'lazy'
      return { tagName: tag, attribs: attrs }
    },
  }

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'h1',
      'h2',
      'h3',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'th',
      'td',
      'tr',
      'blockquote',
      'hr',
    ]),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      '*': ['id', 'class'],
    },
    // <<< o cast problemático foi removido; usamos o objeto diretamente >>>
    transformTags: transformTags as any,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowVulnerableTags: true,
  })
}

function mdToHtml(md: string) {
  const raw = marked.parse(md || '', { async: false }) as string
  return sanitize(raw || '')
}

// ───────────────── Normalização de um item do n8n ─────────────────
function normalizeN8nItem(item: any) {
  const id: string | null = item.id ?? null
  const title: string | null = item.title ?? null
  const type: string | null = item.type ?? item.postType ?? null
  const category: string | null = item.category ?? null

  const image_url: string | null =
    item.image_url || item.cover_url || item.og_image || item.image || null

  // conteúdo: MD e/ou HTML
  const md: string | null = item.content_md ?? item.content ?? null
  const htmlIn: string | null = item.content_html ?? null

  // converte/sanitiza
  const html = htmlIn ? sanitize(String(htmlIn)) : (md ? mdToHtml(String(md)) : '')

  // derivados
  const excerpt: string =
    (item.excerpt && String(item.excerpt).trim()) || buildExcerptFromHtml(html)
  const minutes: number = item.minutes ?? estimateMinutesFromHtml(html)
  const search_text: string = toAsciiLowerNoAccents(`${title || ''} ${excerpt || ''}`)

  // slug
  const slug: string | null = item.slug ?? slugify(title || undefined)

  // status/flags
  const published: boolean = !!(item.published ?? item.flags?.published ?? true)
  const status: 'draft' | 'published' = published ? 'published' : 'draft'

  // extras/flags/places opcionais
  const extras: Json = item.extras ?? null
  const flags: Json = item.flags ?? null
  const places: string[] | null =
    Array.isArray(item.places) ? item.places : (item.badge ? [item.badge] : null)

  return {
    id,
    title,
    slug,
    type,
    category,
    image_url,
    excerpt,
    minutes,
    content_md: md,
    content_html: html,
    search_text,
    status,
    flags,
    extras,
    places,
  }
}

// ───────────────── Persistência ─────────────────
async function upsertPost(db: ReturnType<typeof supaAdmin>, row: any) {
  const dataToSave = {
    id: row.id ?? undefined,
    title: row.title,
    slug: row.slug,
    type: row.type,
    category: row.category,
    image_url: row.image_url,
    excerpt: row.excerpt,
    minutes: row.minutes,
    content_md: row.content_md,
    content_html: row.content_html,
    search_text: row.search_text,
    status: row.status,
    flags: row.flags,
    extras: row.extras,
    places: row.places,
  }

  if (row.slug) {
    const { data: existingBySlug } = await db
      .from('posts')
      .select('id')
      .eq('slug', row.slug)
      .limit(1)
      .maybeSingle()

    if (existingBySlug?.id) {
      const { error } = await db.from('posts').update(dataToSave).eq('id', existingBySlug.id)
      if (error) throw error
      return existingBySlug.id
    }
  }

  if (row.id) {
    const { data: existingById } = await db
      .from('posts')
      .select('id')
      .eq('id', row.id)
      .limit(1)
      .maybeSingle()

    if (existingById?.id) {
      const { error } = await db.from('posts').update(dataToSave).eq('id', row.id)
      if (error) throw error
      return row.id
    }
  }

  const { data: inserted, error } = await db.from('posts').insert(dataToSave).select('id').single()
  if (error) throw error
  return inserted.id as string
}

// ───────────────── Endpoint ─────────────────
/**
 * Espera: { approval_id: string, urls: string[] }
 * Cada URL deve retornar um JSON do n8n com os campos do post (content/content_md e/ou content_html).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.approval_id || !Array.isArray(body.urls) || body.urls.length === 0) {
      return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 })
    }

    const db = supaAdmin()

    const fetched = await Promise.all(
      body.urls.map(async (u: string) => {
        const r = await fetch(u, { cache: 'no-store' })
        if (!r.ok) throw new Error(`Falha ao buscar ${u} (${r.status})`)
        return r.json()
      })
    )

    const flatItems: any[] = fetched.flatMap((x: any) =>
      Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : [x]
    )

    const results: Array<{ slug?: string | null; id?: string }> = []

    for (const raw of flatItems) {
      const row = normalizeN8nItem(raw)
      const id = await upsertPost(db, row)
      results.push({ slug: row.slug, id })
    }

    return NextResponse.json({
      ok: true,
      approval_id: body.approval_id,
      saved: results.length,
      results,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}
