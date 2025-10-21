// app/api/webstories/request/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* -------------------- helpers -------------------- */
function tryParseJSON(text: string): any {
  try { return JSON.parse(text) } catch {}
  // tenta extrair primeiro bloco JSON útil (array ou objeto)
  const objStart = text.indexOf('{')
  const arrStart = text.indexOf('[')
  const start = (objStart === -1) ? arrStart : (arrStart === -1 ? objStart : Math.min(objStart, arrStart))
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'))
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }
  return null
}

function unwrapN8n(raw: any): any {
  // [ { json:{...} } ] | [ {...} ] | { json:{...} } | {...}
  if (Array.isArray(raw)) return raw[0]?.json ?? raw[0] ?? {}
  if (raw && typeof raw === 'object' && raw.json) return raw.json
  return raw ?? {}
}

function toStr(v: any) { return (v == null ? '' : String(v)).trim() }
function hostOf(u: string) { try { return new URL(u).hostname.replace(/^www\./,'').toLowerCase() } catch { return '' } }

/** Normaliza respostas variadas para o shape { id, provider, full, thumb, w, h, alt, page } */
function normImages(p: any): any[] {
  if (!p) return []

  // já no formato esperado
  if (Array.isArray(p.images)) return p.images.filter((i: any) => i?.full)

  // item unitário genericão (com .full/.url/etc)
  const coerceOne = (x: any) => {
    const full = toStr(x?.full || x?.url || x?.image || x?.src || x?.link)
    if (!full) return null
    return {
      id: x?.id || full.split('?')[0],
      provider: toStr(x?.provider || 'unknown'),
      full,
      thumb: toStr(x?.thumb || x?.thumbnail || full),
      w: Number(x?.w || x?.width || 0) || null,
      h: Number(x?.h || x?.height || 0) || null,
      alt: toStr(x?.alt || x?.title || ''),
      page: toStr(x?.page || x?.context || ''),
      host: toStr(x?.host || hostOf(full)),
      score: typeof x?.score === 'number' ? x.score : undefined,
    }
  }

  // Pexels bruto ({ photos: [...] })
  if (Array.isArray(p.photos)) {
    return p.photos.map((ph: any) => coerceOne({
      id: `pex_${ph?.id}`,
      provider: 'pexels',
      full: ph?.src?.original || ph?.src?.large2x || ph?.src?.large,
      thumb: ph?.src?.medium || ph?.src?.small || ph?.src?.tiny || ph?.src?.large,
      width: ph?.width, height: ph?.height,
      title: ph?.alt || '',
      page: ph?.url || '',
    })).filter(Boolean) as any[]
  }

  // Pixabay bruto ({ hits: [...] })
  if (Array.isArray(p.hits)) {
    return p.hits.map((h: any) => coerceOne({
      id: `pix_${h?.id}`,
      provider: 'pixabay',
      full: h?.fullHDURL || h?.largeImageURL || h?.webformatURL,
      thumb: h?.previewURL || h?.webformatURL,
      width: h?.imageWidth, height: h?.imageHeight,
      title: h?.tags || '',
      page: h?.pageURL || '',
    })).filter(Boolean) as any[]
  }

  // Unsplash (search) bruto ({ results: [...] com urls })
  if (Array.isArray(p.results) && p.results[0]?.urls) {
    return p.results.map((u: any) => coerceOne({
      id: `uns_${u?.id}`,
      provider: 'unsplash',
      full: u?.urls?.full || u?.urls?.raw || u?.urls?.regular,
      thumb: u?.urls?.small || u?.urls?.thumb || u?.urls?.regular,
      width: u?.width, height: u?.height,
      title: u?.alt_description || u?.description || '',
      page: u?.links?.html || '',
    })).filter(Boolean) as any[]
  }

  // Runware comuns: { imageURL } | { artifacts:[{url}...] }
  if (p?.imageURL) {
    const full = toStr(p.imageURL)
    if (full) return [{
      id: `run_${Math.random().toString(36).slice(2,8)}`,
      provider: 'runware',
      full, thumb: full, w: null, h: null, alt: '', page: '', host: hostOf(full)
    }]
  }
  if (Array.isArray(p.artifacts)) {
    return p.artifacts.map((a: any) => coerceOne({
      id: `run_${Math.random().toString(36).slice(2,8)}`,
      provider: 'runware',
      full: a?.url || a?.imageURL || a?.image,
      thumb: a?.url || a?.imageURL || a?.image,
    })).filter(Boolean) as any[]
  }

  // genéricos comuns
  if (Array.isArray(p.items))    return normImages({ images: p.items })
  if (Array.isArray(p.data))     return normImages({ images: p.data })
  if (Array.isArray(p.results))  return normImages({ images: p.results })
  if (Array.isArray(p))          return p.map(coerceOne).filter(Boolean) as any[]

  // objeto solto
  const one = coerceOne(p)
  return one ? [one] : []
}

/* -------------------- handler -------------------- */
export async function POST(req: Request) {
  const started = Date.now()
  try {
    const body = await req.json()
    const payload = {
      term: String(body.term || '').trim(),
      slides_min: Number.isFinite(body.slides_min) ? Number(body.slides_min) : 8,
      slides_max: Number.isFinite(body.slides_max) ? Number(body.slides_max) : 12,
      source: body.source || 'dashboard',
    }

    const n8nUrl =
      process.env.WEBSTORIES_N8N_WEBHOOK ||
      process.env.WEBSTORIES_WEBHOOK_URL ||
      'https://n8n.seureview.com.br/webhook/webstories'

    // sem AbortController/timeout — deixa o provedor demorar o que precisar
    let r: Response
    try {
      r = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WEBSTORIES_API_KEY ? { 'x-api-key': process.env.WEBSTORIES_API_KEY } : {}),
          // ou Bearer:
          // ...(process.env.WEBSTORIES_API_KEY ? { Authorization: `Bearer ${process.env.WEBSTORIES_API_KEY}` } : {}),
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, code: 'fetch_failed', detail: { message: e?.message } },
        { status: 502 },
      )
    }

    const text = await r.text()
    const parsed = tryParseJSON(text)
    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          code: 'n8n_invalid_json',
          detail: { status: r.status, contentType: r.headers.get('content-type'), snippet: text.slice(0, 320) },
          took_ms: Date.now() - started,
        },
        { status: 502 },
      )
    }

    const raw = unwrapN8n(parsed)

    // imagens (vêm prontas do n8n ou tentamos normalizar)
    let images: any[] = Array.isArray(raw.images) ? raw.images : normImages(raw)
    if (!images.length && Array.isArray(parsed)) {
      const pooled = (parsed as any[])
        .map(unwrapN8n)
        .flatMap((x: any) => (Array.isArray(x?.images) ? x.images : normImages(x)))
      if (pooled.length) images = pooled
    }

    // meta/title/slides
    const meta = (raw.meta && typeof raw.meta === 'object') ? raw.meta : {}
    const title =
      (typeof raw.title === 'string' && raw.title) ||
      (typeof meta.title === 'string' && meta.title) ||
      (payload.term || 'Nova Webstory')

    const slides =
      (Array.isArray(raw.slides) && raw.slides) ||
      (Array.isArray(meta.slides) && meta.slides) ||
      []

    const ai_prompts =
      (raw.ai_prompts && typeof raw.ai_prompts === 'object' && raw.ai_prompts) ||
      (meta.ai_prompts && typeof meta.ai_prompts === 'object' && meta.ai_prompts) ||
      { width: 704, height: 1216, aspect: '9:16' }

    // constraints com tolerância (1 a menos) e clamp pelo total de imagens
    const inConstraints = (raw.constraints || meta.constraints || {}) as { min?: number; max?: number }
    const minIn = Number.isFinite(inConstraints.min) ? Number(inConstraints.min) : payload.slides_min
    const maxIn = Number.isFinite(inConstraints.max) ? Number(inConstraints.max) : payload.slides_max
    let minOut = Math.max(0, minIn - 1) // tolera 1 a menos
    minOut = Math.min(minOut, images.length) // não exige mais do que existe

    if (images.length) {
      return NextResponse.json({
        ok: true,
        // topo — facilita o front
        title,
        slides,
        ai_prompts,
        // mantém tudo que o n8n já manda
        meta: {
          ...meta,
          title,
          slides,
          ai_prompts: { width: 704, height: 1216, aspect: '9:16', ...ai_prompts },
        },
        constraints: { min: minOut, max: maxIn },
        images,
        took_ms: Date.now() - started,
      })
    }

    // Sem imagens → relata o motivo com chaves vistas
    return NextResponse.json(
      {
        ok: false,
        code: r.ok ? 'no_images' : 'n8n_http_error',
        detail: {
          status: r.status,
          has_meta: !!raw?.meta,
          keys: raw && typeof raw === 'object' ? Object.keys(raw) : [],
          note: 'Sem images[] após normalização',
        },
        took_ms: Date.now() - started,
      },
      { status: 502 },
    )
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, code: 'proxy_failed', detail: { message: err?.message } },
      { status: 500 },
    )
  }
}