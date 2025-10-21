// app/api/posts/research-generate/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

type ResearchInput = {
  query: string
  title?: string
  category?: string
  preferredDomains?: string[]
  temperature?: number
  maxTokens?: number
}

function jsonUtf(payload: any, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init?.headers || {}) },
  })
}

/** 1) Pesquisa no Perplexity (modelo 'sonar') */
async function researchWithPerplexity(input: ResearchInput): Promise<{ researchText: string; raw: any }> {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) throw new Error('PERPLEXITY_API_KEY missing')
  if (!input.query) throw new Error('query obrigatória')

  const body: any = {
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content:
          'Você é um pesquisador de conteúdo financeiro. Resuma com objetividade, traga fatos e números, cite nomes de produtos/empresas relevantes. Responda em português do Brasil.',
      },
      { role: 'user', content: input.query },
    ],
    temperature: typeof input.temperature === 'number' ? input.temperature : 0.2,
    max_tokens: typeof input.maxTokens === 'number' ? input.maxTokens : 1000,
  }

  if (Array.isArray(input.preferredDomains) && input.preferredDomains.length) {
    body.search_domain_filter = input.preferredDomains
  }

  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await r.text()
  if (!r.ok) {
    throw new Error(`Perplexity ${r.status}: ${text}`)
  }

  const j = JSON.parse(text)
  const researchText: string = j?.choices?.[0]?.message?.content ?? ''
  return { researchText, raw: j }
}

/** 2) Desenvolve com Gemini 2.5 Pro (saída em JSON no nosso contrato) */
async function writeWithGemini(params: {
  title: string
  category: string
  research: string
}): Promise<{ title: string; meta: string; outline: string[]; content: string }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY missing')

  const SYS = `Você vai redigir um post a partir do bloco <RESEARCH> com fatos atuais.
Regras:
- Escreva em Português (Brasil), claro e prático.
- Use apenas informações apoiadas pelo <RESEARCH>.
- Não invente dados.
- Produza APENAS JSON válido no formato:
{
  "title": "string",
  "meta": "string (<=160)",
  "outline": ["Seção 1","Seção 2", "..."],
  "content": "<h2>...</h2><p>HTML seguro, sem <script>.</p>"
}`

  const user = `Tema: ${params.title}
Categoria: ${params.category}

<RESEARCH>
${params.research}
</RESEARCH>`

  const body = {
    contents: [{ role: 'user', parts: [{ text: `${SYS}\n\n${user}` }] }],
    generationConfig: {
      temperature: 0.2,
      topK: 0,
      topP: 1,
      maxOutputTokens: 64000,
      responseMimeType: 'application/json',
    },
  }

  const r = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=' +
      encodeURIComponent(key),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  const rawText = await r.text()
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${rawText}`)

  // Pode vir JSON direto ou candidates[].content.parts[].text com uma string JSON
  let parsed: any
  try {
    parsed = JSON.parse(rawText)
  } catch {
    parsed = rawText
  }

  if (typeof parsed === 'object' && parsed?.candidates?.[0]?.content?.parts?.length) {
    const part = parsed.candidates[0].content.parts[0]
    const candidateText: string =
      (typeof part.text === 'string' && part.text) ||
      (typeof part.stringValue === 'string' && part.stringValue) ||
      ''
    const clean = candidateText.replace(/```json|```/g, '').trim()
    return normalizePost(JSON.parse(clean), params.title)
  }

  if (typeof parsed === 'object') {
    return normalizePost(parsed, params.title)
  }

  throw new Error('Formato de resposta do Gemini inesperado')
}

/** Normaliza o payload do post */
function normalizePost(
  input: any,
  fallbackTitle: string
): { title: string; meta: string; outline: string[]; content: string } {
  const title: string = (typeof input?.title === 'string' && input.title.trim()) || fallbackTitle
  const meta: string = (typeof input?.meta === 'string' && input.meta.trim()) || ''
  const outline: string[] = Array.isArray(input?.outline) ? (input.outline as unknown[]).map((x) => String(x)) : []
  let content: string = typeof input?.content === 'string' ? input.content : ''

  // Defesa simples: remove <script>...</script>
  content = content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')

  if (!content) {
    const paras: string =
      outline.length > 0
        ? outline.map((h: string) => `<h2>${escapeHtml(h)}</h2><p></p>`).join('')
        : ''
    content = paras || `<h2>${escapeHtml(title)}</h2><p></p>`
  }

  return { title, meta, outline, content }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Handler: Perplexity (research) → Gemini (redação) */
export async function POST(req: Request) {
  try {
    const { query, title, category = 'Geral', preferredDomains = [] }: ResearchInput = await req.json()
    const effectiveTitle = title || query
    if (!query) return jsonUtf({ ok: false, error: 'query obrigatória' }, { status: 400 })

    const { researchText, raw } = await researchWithPerplexity({
      query,
      preferredDomains,
    })

    const data = await writeWithGemini({
      title: effectiveTitle!,
      category,
      research: researchText,
    })

    // devolve o post e também o "research" (para debug/insight no painel)
    return jsonUtf({
      ok: true,
      data,
      research: { text: researchText, upstream: raw },
    })
  } catch (e: any) {
    return jsonUtf({ ok: false, error: e?.message || 'erro' }, { status: 500 })
  }
}
