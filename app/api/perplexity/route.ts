// app/api/perplexity/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { query, preferredDomains = [], system, temperature = 0.2, max_tokens = 800 } = await req.json()
    const key = process.env.PERPLEXITY_API_KEY
    if (!key) return NextResponse.json({ ok:false, error:'PERPLEXITY_API_KEY missing' }, { status:500 })
    if (!query) return NextResponse.json({ ok:false, error:'query obrigatória' }, { status:400 })

    const body: any = {
      model: 'sonar',                       // <- igual ao n8n
      messages: [
        { role: 'system', content: system || 'Responda de forma objetiva. Saída: texto puro, ou JSON quando solicitado.' },
        { role: 'user', content: query }
      ],
      temperature,
      max_tokens
    }

    // se vierem domínios preferidos, passa o filtro (Perplexity aceita este campo)
    if (Array.isArray(preferredDomains) && preferredDomains.length) {
      body.search_domain_filter = preferredDomains
    }

    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const text = await r.text()
    if (!r.ok) {
      return NextResponse.json({ ok:false, upstreamStatus:r.status, upstream:text }, { status:500 })
    }

    const j = JSON.parse(text)
    const content = j?.choices?.[0]?.message?.content ?? ''
    return NextResponse.json({ ok:true, content, raw:j })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || 'erro' }, { status:500 })
  }
}
