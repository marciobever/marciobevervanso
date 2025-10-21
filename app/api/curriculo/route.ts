import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // segurança simples (campos obrigatórios)
    if (!body?.name || !body?.email) {
      return NextResponse.json({ ok:false, error:'Nome e e-mail obrigatórios.' }, { status: 400 })
    }

    // Envia para o n8n
    const hook = process.env.N8N_WEBHOOK_URL
    if (!hook) {
      return NextResponse.json({ ok:false, error:'N8N_WEBHOOK_URL ausente.' }, { status: 500 })
    }

    const res = await fetch(`${hook.replace(/\/$/,'')}/cv-generate`, {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ ok:false, error: data?.error || `Falha n8n (${res.status})` }, { status: 500 })
    }

    return NextResponse.json({ ok:true, ...data })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Erro' }, { status: 500 })
  }
}
