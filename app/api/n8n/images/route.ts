// app/api/n8n/images/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_IMAGES_URL =
  process.env.N8N_WEBHOOK_URL_IMAGENS ||
  'https://n8n.seureview.com.br/webhook/mapadocredito/imagens'

const TIMEOUT_MS = 25_000

type InBody = {
  term?: string
  type?: string
  category?: string
}

function normCat(v?: string) {
  // remove acentos sem usar Unicode Property Escapes (compatível com ES5)
  const s = String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // <- remove diacríticos
    .trim()

  if (!s) return 'geral'

  // como já removemos acentos, os padrões abaixo não precisam de variações acentuadas
  if (/(cartao|cartoes|credito|debito|card|visa|master|elo|amex)/.test(s)) return 'cartoes'
  if (/(beneficio|beneficios|auxilio|bolsa|bpc|loas|pis|pasep|inss|cadunico|familia)/.test(s)) return 'beneficios'
  if (/(emprego|vaga|trabalho|rh|recrut|estagio|trainee|remoto|clt|pj)/.test(s)) return 'empregos'
  if (/(concurso|edital|banca|prova|inscricao|fgv|vunesp|cebraspe|cesgranrio|ibfc|idecan|quadrix)/.test(s)) return 'concursos'

  // devolve o que vier (permite categorias novas no n8n)
  return s
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as InBody
    const term = (body.term || '').toString().trim()
    if (!term) {
      return NextResponse.json({ ok: false, error: 'term ausente' }, { status: 400 })
    }

    // aceita tanto "type" quanto "category" do front; saneia em ambos
    const type = normCat(body.type)
    const category = normCat(body.category || body.type)

    const payload = { term, type, category }

    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)

    const r = await fetch(N8N_IMAGES_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.N8N_BEARER ? { authorization: `Bearer ${process.env.N8N_BEARER}` } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t))

    const txt = await r.text()
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `n8n error (${r.status}): ${txt?.slice(0, 400)}` },
        { status: 502 }
      )
    }

    let data: any
    try {
      data = JSON.parse(txt)
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Resposta do n8n não é JSON' },
        { status: 502 }
      )
    }

    // aceita vários formatos possíveis do n8n
    let arr: any[] = []
    if (Array.isArray(data)) arr = data
    else if (Array.isArray(data.items)) arr = data.items
    else if (Array.isArray(data.data)) arr = data.data
    else if (Array.isArray(data?.data?.items)) arr = data.data.items

    if (!arr.length) {
      return NextResponse.json(
        { ok: false, error: 'Nenhuma imagem encontrada' },
        { status: 404 }
      )
    }

    // normalização final p/ o painel
    const items = arr
      .map((i: any) => ({
        id: String(i.id ?? ''),
        provider: i.provider ? String(i.provider) : undefined,
        thumb:
          i.thumb ??
          i.previewURL ??
          i.webformatURL ??
          i.src?.medium ??
          i.src?.small ??
          i.image?.thumbnailLink ??
          null,
        full:
          i.full ??
          i.largeImageURL ??
          i.url ??
          i.link ??
          i.src?.large2x ??
          i.src?.large ??
          i.src?.original ??
          null,
        w: Number(i.w ?? i.width ?? i.imageWidth ?? i.image?.width ?? 0) || undefined,
        h: Number(i.h ?? i.height ?? i.imageHeight ?? i.image?.height ?? 0) || undefined,
        alt: i.alt ?? i.title ?? i.tags ?? '',
        page: i.page ?? i.pageURL ?? i.link ?? i.image?.contextLink ?? null,
        score: typeof i.score === 'number' ? i.score : undefined,
        roleHints: Array.isArray(i.roleHints) ? i.roleHints : ['inline'],
      }))
      .filter((x: any) => !!x.full)

    return NextResponse.json({ ok: true, items })
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'Timeout ao contatar n8n' : err?.message || 'erro'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}