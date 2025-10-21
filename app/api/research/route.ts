// app/api/research/route.ts
import { NextResponse } from 'next/server'
import { researchWithPerplexity } from '@/lib/perplexity'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { q, type } = body || {}
    if (!q) return NextResponse.json({ ok: false, error: 'q é obrigatório' }, { status: 400 })

    const data = await researchWithPerplexity({ q, type })
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'erro' }, { status: 500 })
  }
}
