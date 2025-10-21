// app/api/n8n/approvals/image-picked/route.ts
import { NextRequest, NextResponse } from 'next/server'

// TROQUE: endpoint do seu Webhook n8n que recebe { approval_id, chosen_url }
const N8N_WEBHOOK_URL = process.env.N8N_APPROVAL_WEBHOOK_URL
  || 'https://SEU-N8N/webhook/approvals/image-picked'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const r = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // se seu n8n exigir auth, adicione aqui headers extras
    })

    const txt = await r.text()
    return new NextResponse(txt, {
      status: r.status,
      headers: { 'Content-Type': r.headers.get('content-type') || 'text/plain' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Proxy error' }, { status: 500 })
  }
}
