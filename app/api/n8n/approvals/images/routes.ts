// app/api/n8n/approvals/images/route.ts
import { NextRequest, NextResponse } from 'next/server'

type Payload = {
  approval_id: string
  urls: string[]
  title?: string | null
  category?: string | null
  ttlSec?: number
}

// --- Supabase (server) ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function saveApproval(row: {
  id: string
  type: 'images'
  payload: any
  ttl_sec: number
}) {
  // client minimalista sem sdk (para não adicionar deps)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/approvals`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
    // Nota: habilite o PostgREST no seu projeto (padrão do Supabase)
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`supabase insert failed: ${res.status} ${text}`)
  }
  return res.json().catch(() => ({}))
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Payload>

    const approval_id =
      body.approval_id ||
      `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const urls = Array.isArray(body.urls) ? body.urls.filter(Boolean) : []
    const title = body.title ?? null
    const category = body.category ?? null
    const ttlSec = Math.max(60, Number(body.ttlSec ?? 1800) || 1800)

    if (!urls.length) {
      return NextResponse.json(
        { ok: false, error: 'urls vazio' },
        { status: 400 },
      )
    }

    // salva no Supabase
    await saveApproval({
      id: approval_id,
      type: 'images',
      payload: { approval_id, urls, title, category },
      ttl_sec: ttlSec,
    })

    return NextResponse.json(
      { ok: true, approval_id, count: urls.length },
      { status: 201 },
    )
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'erro inesperado' },
      { status: 500 },
    )
  }
}
