// app/api/n8n/trigger/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const { term } = await req.json() as { term?: string }
    if (!term || !term.trim()) {
      return NextResponse.json({ ok: false, error: 'term ausente' }, { status: 400 })
    }
    const url = process.env.N8N_WEBHOOK_URL
    if (!url) {
      return NextResponse.json({ ok: false, error: 'N8N_WEBHOOK_URL não configurada' }, { status: 500 })
    }

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Envie apenas o que o seu fluxo espera:
      body: JSON.stringify({ term: term.trim() }),
    })

    const text = await r.text()
    let json: any = {}
    try { json = JSON.parse(text) } catch { /* às vezes n8n retorna texto puro */ }

    if (!r.ok) {
      const msg = json?.error || json?.message || text || 'Falha no webhook do n8n'
      return NextResponse.json({ ok: false, error: msg }, { status: r.status })
    }

    // Esperado: { jobId } — mas se não vier, criamos um id local
    const jobId = json?.jobId || `run-${Date.now()}`
    const message = json?.message || 'Fluxo disparado com sucesso'
    return NextResponse.json({ ok: true, jobId, message })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'erro' }, { status: 500 })
  }
}
