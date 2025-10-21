// app/api/n8n/start/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // ou 'edge', se preferir

export async function POST(req: Request) {
  const { term } = (await req.json().catch(() => ({}))) as { term?: string }
  if (!term || !term.trim()) {
    return NextResponse.json({ ok: false, error: 'Termo obrigatório' }, { status: 400 })
  }

  const url = process.env.N8N_WEBHOOK_URL?.trim()
  if (!url) {
    // Backend não configurado — o painel entra em "modo simples"
    return NextResponse.json(
      { ok: false, error: 'N8N_WEBHOOK_URL não configurada no ambiente' },
      { status: 501 }
    )
  }

  try {
    // Envia o termo ao webhook do n8n (ajuste se seu fluxo esperar outro payload)
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ term: term.trim() }),
      cache: 'no-store',
    })

    const text = await r.text()
    // Tentamos interpretar como JSON; se não, devolvemos uma mensagem básica
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }

    // Opcional: seu n8n pode retornar um jobId; se não, seguimos sem
    const jobId: string | undefined = data?.jobId || data?.id || undefined

    return NextResponse.json({
      ok: true,
      jobId,
      message: 'Fluxo disparado.',
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Falha ao chamar o n8n' },
      { status: 500 }
    )
  }
}
