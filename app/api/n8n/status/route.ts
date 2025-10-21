// app/api/n8n/status/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // ou 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId') || ''

  const statusUrl = process.env.N8N_STATUS_URL?.trim()
  if (!statusUrl) {
    // Sem endpoint de status — o painel entra em "modo simples"
    return NextResponse.json(
      { ok: false, error: 'N8N_STATUS_URL não configurada' },
      { status: 501 }
    )
  }

  try {
    // Proxie para um endpoint do seu n8n que devolva andamento do job
    // Ajuste a query conforme seu fluxo (ex.: ?id=, ?jobId=, etc.)
    const url = `${statusUrl}${statusUrl.includes('?') ? '&' : '?'}jobId=${encodeURIComponent(jobId)}`
    const r = await fetch(url, { cache: 'no-store' })

    if (!r.ok) {
      const text = await r.text()
      return NextResponse.json(
        { ok: false, error: `Status ${r.status}: ${text.slice(0, 200)}` },
        { status: r.status }
      )
    }

    const data = await r.json().catch(() => ({}))

    // Normaliza o retorno para o front
    const normalized = {
      ok: true as const,
      done: Boolean(data?.done || data?.status === 'done'),
      progress:
        typeof data?.progress === 'number'
          ? Math.max(0, Math.min(100, data.progress))
          : data?.done
          ? 100
          : 50,
      status:
        (['queued', 'running', 'done', 'error'] as const).includes(data?.status)
          ? data.status
          : data?.done
          ? 'done'
          : 'running',
      message: data?.message || undefined,
      logs: Array.isArray(data?.logs) ? data.logs : undefined,
    }

    return NextResponse.json(normalized)
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Falha ao consultar status' },
      { status: 500 }
    )
  }
}
