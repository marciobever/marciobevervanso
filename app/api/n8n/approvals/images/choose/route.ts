// app/api/n8n/approvals/images/choose/route.ts
import { NextResponse } from 'next/server'
import { getApproval, deleteApproval } from '@/lib/approvals'

const N8N_CALLBACK_URL = process.env.N8N_APPROVAL_CALLBACK_URL || '' // opcional

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const approval_id = String(body?.approval_id || '').trim()
    const chosen: string[] = Array.isArray(body?.urls) ? body.urls.filter((u: any) => typeof u === 'string' && u) : []

    if (!approval_id || chosen.length === 0) {
      return NextResponse.json({ error: 'approval_id e urls[] escolhidas são obrigatórios' }, { status: 400 })
    }

    const rec = getApproval(approval_id)
    if (!rec) return NextResponse.json({ error: 'não encontrado ou expirado' }, { status: 404 })

    // opcional: callback para o n8n continuar o fluxo
    let callbackStatus: number | null = null
    if (N8N_CALLBACK_URL) {
      const res = await fetch(N8N_CALLBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_id,
          chosen_urls: chosen,
          meta: rec.meta,
        }),
      })
      callbackStatus = res.status
    }

    // limpar o lote (se quiser manter, comente esta linha)
    deleteApproval(approval_id)

    return NextResponse.json({ ok: true, approval_id, chosen_count: chosen.length, callbackStatus })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'erro' }, { status: 500 })
  }
}
