import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Este endpoint recebe um LOTE de oportunidades vindas do n8n e
 * cria/atualiza PÁGINAS internas na tabela `posts` (public).
 *
 * Cada item vira um post com:
 * - type: 'empregos' | 'concursos' | 'beneficios'
 * - status: 'published' (ou 'draft' se quiser)
 * - content_html: sumário + seções (texto gerado no próprio n8n se preferir)
 * - extras.source_url / extras.source_id (p/ deduplicação e referência)
 */

export const dynamic = 'force-dynamic'

type IncomingItem = {
  type: 'empregos' | 'concursos' | 'beneficios'
  title: string
  summary?: string
  image_url?: string
  location?: string
  deadline?: string | null
  company?: string | null
  salary?: string | null
  link?: string | null            // link da fonte (externo) — fica só no extras
  source_id?: string | null       // id único da fonte (p/ dedup)
  content_html?: string | null    // se vier pronto do n8n, usamos
  category?: string | null        // ex.: 'TI', 'Administrativo', 'Federal'
  badge?: string | null           // ex.: 'NOVIDADE'
  published?: boolean             // default true
}

function slugify(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 96)
}

function defaultTemplate(item: IncomingItem) {
  const parts: string[] = []
  if (item.summary) parts.push(`<p>${item.summary}</p>`)
  parts.push(`<h2>Como funciona</h2><p>Confira os detalhes desta oportunidade.</p>`)
  if (item.company) parts.push(`<p><strong>Empresa/Órgão:</strong> ${item.company}</p>`)
  if (item.location) parts.push(`<p><strong>Localidade:</strong> ${item.location}</p>`)
  if (item.salary) parts.push(`<p><strong>Faixa salarial:</strong> ${item.salary}</p>`)
  if (item.deadline) parts.push(`<p><strong>Prazo/Inscrições até:</strong> ${item.deadline}</p>`)
  parts.push(`<h3>Como se inscrever</h3><p>As instruções de inscrição estão descritas acima. Em caso de dúvidas, consulte o edital/site oficial.</p>`)
  return parts.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const items = (await req.json()) as IncomingItem[] | IncomingItem
    const list = Array.isArray(items) ? items : [items]
    if (!list.length) {
      return NextResponse.json({ ok: false, error: 'Payload vazio' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!url || !key) {
      return NextResponse.json({ ok: false, error: 'Faltam envs do Supabase' }, { status: 500 })
    }

    const db = createClient(url, key, { auth: { persistSession: false } })

    // upsert 1 a 1 para controlar deduplicação por source_id ou slug.
    const created: any[] = []
    const errors: any[] = []

    for (const item of list) {
      try {
        if (!item.title || !item.type) throw new Error('title e type são obrigatórios')

        // slug base por título
        let slug = slugify(item.title)

        // se veio source_id, deduplicamos por ele. senão, tentamos pelo slug.
        let existing: any = null
        if (item.source_id) {
          const { data, error } = await db
            .from('posts')
            .select('id, slug')
            .eq('type', item.type)
            .contains('extras', { source_id: item.source_id })
            .maybeSingle()
          if (error) throw error
          existing = data
        } else {
          const { data, error } = await db
            .from('posts')
            .select('id, slug')
            .eq('type', item.type)
            .eq('slug', slug)
            .maybeSingle()
          if (error) throw error
          existing = data
        }

        // se já existe com o mesmo slug, gera variante
        if (!existing) {
          let tries = 0
          while (true) {
            const { data, error } = await db
              .from('posts')
              .select('id')
              .eq('type', item.type)
              .eq('slug', slug)
              .maybeSingle()
            if (error) throw error
            if (!data) break
            tries++
            slug = `${slug}-${tries}`
          }
        }

        const published = item.published !== false
        const now = new Date().toISOString()

        const payload: Record<string, any> = {
          title: item.title,
          slug,
          type: item.type,
          category: item.category || null,
          image_url: item.image_url || null,
          excerpt: item.summary || null,
          content_html: item.content_html || defaultTemplate(item),
          status: published ? 'published' : 'draft',
          published_at: published ? now : null,
          updated_at: now,
          flags: {
            published,
            badge: item.badge || null,
            placements: ['home_featured'], // ajuste se quiser direcionar posições
          },
          extras: {
            source_id: item.source_id || null,
            source_url: item.link || null,
            location: item.location || null,
            deadline: item.deadline || null,
            company: item.company || null,
            salary: item.salary || null,
          },
        }

        let res
        if (existing?.id) {
          res = await db.from('posts').update(payload).eq('id', existing.id).select('id,slug').single()
        } else {
          res = await db.from('posts').insert(payload).select('id,slug').single()
        }
        if (res.error) throw res.error

        const urlPath = `/oportunidades/${item.type}/${res.data.slug}`
        created.push({ id: res.data.id, slug: res.data.slug, url: urlPath })
      } catch (e: any) {
        errors.push({ item: item?.title, error: e?.message || String(e) })
      }
    }

    return NextResponse.json({ ok: true, created, errors })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Erro inesperado' }, { status: 500 })
  }
}
