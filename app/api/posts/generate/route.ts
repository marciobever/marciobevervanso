// app/api/posts/generate/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

// (A) Gemini primeiro (padrão)
async function generateWithGemini(title: string, category: string) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY missing')

  const SYS = `Responda APENAS JSON válido no formato:
{
  "title": "string",
  "meta": "string (<=160)",
  "outline": ["Seção 1","Seção 2"],
  "content": "<h2>...</h2><p>HTML seguro, sem <script>."
}`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${SYS}\n\nTema: ${title}\nCategoria: ${category || 'Geral'}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 0,
      topP: 1,
      maxOutputTokens: 64000,
      responseMimeType: 'application/json'
    }
  }

  const r = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=' +
      encodeURIComponent(key),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  )

  const rawText = await r.text()
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${rawText}`)

  let parsed: any
  try {
    parsed = JSON.parse(rawText)
  } catch {
    parsed = rawText
  }

  // Caso B: extrai o texto do candidate
  if (
    typeof parsed === 'object' &&
    parsed?.candidates?.[0]?.content?.parts?.length
  ) {
    const part = parsed.candidates[0].content.parts[0]
    const candidateText: string =
      (typeof part.text === 'string' && part.text) ||
      (typeof part.stringValue === 'string' && part.stringValue) ||
      ''

    const clean = candidateText.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)
    return normalizePost(data, title)
  }

  // Caso A: já é o JSON final
  if (typeof parsed === 'object') {
    return normalizePost(parsed, title)
  }

  throw new Error('Formato de resposta do Gemini inesperado')
}

// (B) Fallback: OpenAI
async function generateWithOpenAI(title: string, category: string) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY missing')

  const SYS = `Você é um redator financeiro. Responda APENAS JSON válido:
{ "title":"...", "meta":"...", "outline":["..."], "content":"<h2>...</h2><p>...</p>" }`

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: `Tema: ${title}\nCategoria: ${category || 'Geral'}` }
      ]
    })
  })

  const text = await r.text()
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${text}`)

  const j = JSON.parse(text)
  const raw = j?.choices?.[0]?.message?.content?.trim() || '{}'
  const clean = raw.replace(/```json|```/g, '').trim()
  const data = JSON.parse(clean)
  return normalizePost(data, title)
}

// Normaliza/corrige o payload final do post
function normalizePost(
  input: any,
  fallbackTitle: string
): { title: string; meta: string; outline: string[]; content: string } {
  const title: string =
    (typeof input?.title === 'string' && input.title.trim()) || fallbackTitle

  const meta: string =
    (typeof input?.meta === 'string' && input.meta.trim()) || ''

  const outline: string[] = Array.isArray(input?.outline)
    ? (input.outline as unknown[]).map((x) => String(x))
    : []

  let content: string = typeof input?.content === 'string' ? input.content : ''

  // Remove <script> maliciosos
  content = content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')

  // Fallback: gera HTML mínimo
  if (!content) {
    const paras =
      outline.length > 0
        ? outline
            .map((h: string) => `<h2>${escapeHtml(h)}</h2><p></p>`)
            .join('')
        : ''
    content = paras || `<h2>${escapeHtml(title)}</h2><p></p>`
  }

  return { title, meta, outline, content }
}

// Escape básico
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Handler HTTP
export async function POST(req: Request) {
  try {
    const { title, category = 'Geral', provider } = await req.json()
    if (!title)
      return NextResponse.json(
        { ok: false, error: 'Título obrigatório' },
        { status: 400 }
      )

    if (provider === 'openai') {
      const data = await generateWithOpenAI(title, category)
      return NextResponse.json({ ok: true, data })
    }

    try {
      const data = await generateWithGemini(title, category)
      return NextResponse.json({ ok: true, data })
    } catch (gErr: any) {
      if (process.env.OPENAI_API_KEY) {
        const data = await generateWithOpenAI(title, category)
        return NextResponse.json({ ok: true, data, note: 'fallback=openai' })
      }
      throw gErr
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'erro' },
      { status: 500 }
    )
  }
}
