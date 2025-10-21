// app/api/n8n/article/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_ARTICLE_URL =
  process.env.N8N_WEBHOOK_URL_ARTIGO ||
  'https://n8n.seureview.com.br/webhook/mapadocredito/artigo'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { term, cover } = body || {}

    // ✅ aceita tanto inline_image quanto inlineImg
    const inline_image = body?.inline_image ?? body?.inlineImg ?? null

    if (!term || !String(term).trim()) {
      return NextResponse.json({ ok: false, error: 'term ausente' }, { status: 400 })
    }

    const payload = {
      term,
      cover,
      inline_image, // 👈 padronizado
    }

    const r = await fetch(N8N_ARTICLE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const txt = await r.text()
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `n8n error: ${txt || r.status}` },
        { status: 502 }
      )
    }

    let data: any = {}
    try {
      data = JSON.parse(txt)
    } catch {
      data = { raw: txt }
    }

    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'erro' },
      { status: 500 }
    )
  }
}