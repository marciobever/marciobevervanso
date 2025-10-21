// app/api/webstories/images/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Provider = 'pexels' | 'pixabay' | 'unsplash' | 'searchapi' | 'custom'

type SelectedImage = {
  id: string
  provider: Provider | string
  full: string
  thumb?: string
  w?: number | null
  h?: number | null
  alt?: string
  page?: string
  host?: string
  score?: number
}

type Slide = {
  id?: string
  type?: 'cover' | 'content' | 'cta'
  heading?: string
  sub?: string
  cta_label?: string
  cta_url?: string
  // no FE, preferimos 'center' em vez de 'middle'
  overlay?: { pos?: 'top' | 'center' | 'bottom' | 'middle'; tone?: 'light' | 'dark' }
}

type Meta = {
  title?: string
  summary?: string
  tags?: string[]
  slug?: string
  published?: boolean
  slides?: Slide[]
  ai_prompts?: Record<string, any>
  template?: string | null
}

type Body = {
  selected: SelectedImage[]
  coverId?: string | null
  meta?: Meta
}

function ok(data: any, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status })
}

function bad(status: number, message: string, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ? { extra } : {}) }, { status })
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80)
}

function fixOverlay(ov?: Slide['overlay']): NonNullable<Slide['overlay']> {
  const tone = ov?.tone || 'dark'
  const posRaw = ov?.pos || 'bottom'
  const pos = posRaw === 'middle' ? 'center' : posRaw // normaliza
  return { pos, tone }
}

function defaultSlide(idx: number, meta: Meta): Slide {
  if (idx === 0) {
    return {
      id: 'capa',
      type: 'cover',
      heading: meta.title || 'Webstory',
      sub: meta.summary || '',
      overlay: { pos: 'bottom', tone: 'dark' },
    }
  }
  return {
    id: `s${idx}`,
    type: 'content',
    heading: `Slide ${idx}`,
    sub: '',
    overlay: { pos: 'bottom', tone: 'dark' },
  }
}

const PUB = process.env.WEBSTORIES_PUBLISHER || 'Receita Popular'
const PUB_LOGO =
  process.env.WEBSTORIES_PUBLISHER_LOGO ||
  'https://news.receitapopular.com.br/logo.png'
const CANON = (process.env.WEBSTORIES_CANONICAL_BASE || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/,'')
const SUPA_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return bad(400, 'JSON inválido')
  }

  if (!Array.isArray(body.selected) || body.selected.length === 0) {
    return bad(422, '`selected` vazio')
  }

  // defaults de meta
  body.meta = body.meta || {}
  if (!body.meta.title) body.meta.title = 'Webstory'
  if (!('published' in body.meta)) body.meta.published = false

  // capa
  const byId = new Map(body.selected.map((i) => [i.id, i]))
  const cover = (body.coverId && byId.get(body.coverId)) || body.selected[0]
  const pool = body.selected.filter((i) => i.id !== cover.id)
  const imgs: SelectedImage[] = [cover, ...pool]

  // total de páginas = nº de imagens selecionadas
  const total = imgs.length

  // base de textos (não limita o total)
  const baseSlides: Slide[] = Array.isArray(body.meta.slides) ? body.meta.slides : []

  // monta slides finais no mesmo comprimento de `total`
  const slides: Slide[] = Array.from({ length: total }, (_, idx) => {
    const s = baseSlides[idx]
    const d = defaultSlide(idx, body.meta!)
    return {
      id: (s?.id || d.id)!,
      type: (s?.type || d.type)!,
      heading: s?.heading ?? d.heading,
      sub: s?.sub ?? d.sub,
      cta_label: s?.cta_label ?? '',
      cta_url: s?.cta_url ?? '',
      overlay: fixOverlay(s?.overlay ?? d.overlay),
    }
  })

  // construir páginas (1:1 com imagens)
  const pages = slides.map((s, idx) => {
    const img = imgs[idx] || imgs[imgs.length - 1]
    const heading = s.heading || (idx === 0 ? body.meta!.title! : `Slide ${idx}`)
    const imgUrl = img?.full || ''

    return {
      id: s.id!,
      type: s.type!,
      heading,
      sub: s.sub || '',
      cta_label: s.cta_label || '',
      cta_url: s.cta_url || '',
      overlay: fixOverlay(s.overlay),

      // usado pelo viewer/AMP
      bg: imgUrl,

      // mantém objeto de imagem
      image: {
        id: img?.id || (idx === 0 ? 'cover' : `img${idx}`),
        url: imgUrl,
        thumb: img?.thumb || '',
        alt: img?.alt || heading,
        provider: (img?.provider as Provider) || 'custom',
        w: img?.w ?? null,
        h: img?.h ?? null,
        page: img?.page || '',
        host: img?.host || '',
      },
    }
  })

  // slug/canonical
  const baseSlug =
    body.meta.slug ? slugify(body.meta.slug) : slugify(`${body.meta.title}-${Date.now()}`)
  const slug = baseSlug || 'webstory'

  const payload = {
    slug,
    lang: 'pt-br',
    title: body.meta.title!,
    publisher: PUB,
    publisher_logo: PUB_LOGO,
    poster_portrait: cover.full,
    canonical_url: `${CANON}/webstories/${slug}`,
    published: !!body.meta.published,
    template: body.meta.template ?? null, // persiste template se vier
    pages,
  }

  const haveSupabase = !!(SUPA_URL && SUPA_KEY)
  if (!haveSupabase) {
    return ok({
      slug,
      published: payload.published,
      persisted: false,
      pagesCount: pages.length,
      record: payload,
      note: 'Supabase não configurado; devolvendo payload sem persistir.',
    })
  }

  const supabase = createClient(SUPA_URL!, SUPA_KEY!, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('webstories')
    .upsert(payload, { onConflict: 'slug' })
    .select()
    .single()

  if (error) {
    return bad(500, 'Erro ao salvar no Supabase', { details: error.message })
  }

  return ok({
    slug: data.slug,
    published: data.published,
    persisted: true,
    pagesCount: pages.length,
    record: data,
  })
}