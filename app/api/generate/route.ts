import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type GenBody = {
  kind?: 'text' | 'image'
  model?: string
  title?: string
  type?: string
  category?: string
  outline?: string[]
  prompt?: string
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildPromptText(b: GenBody) {
  const parts: string[] = []
  if (b.title) parts.push(`Título: ${b.title}`)
  if (b.type) parts.push(`Tipo: ${b.type}`)
  if (b.category) parts.push(`Categoria: ${b.category}`)
  if (b.outline?.length) parts.push(`Seções:\n- ${b.outline.join('\n- ')}`)
  if (b.prompt) parts.push(`Instruções:\n${b.prompt}`)
  parts.push(
    `Produza HTML bem formatado (h2/h3, parágrafos, listas, tabelas quando útil). Em PT-BR, tom claro e objetivo.`
  )
  return parts.join('\n\n')
}

async function generateWithOpenAI(b: GenBody) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY ausente')
  const { OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey })

  const prompt = buildPromptText(b)

  // chat → HTML
  const resp = await client.chat.completions.create({
    model: b.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Você é um redator sênior e vai responder SOMENTE em HTML válido.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  })

  const html = resp.choices?.[0]?.message?.content || ''
  const excerpt = stripHtml(html).slice(0, 220)

  return { content_html: html, excerpt }
}

async function generateWithGemini(b: GenBody) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY ausente')

  const prompt = buildPromptText(b)
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' +
    encodeURIComponent(key)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Gemini error: ${t}`)
  }
  const data = await res.json()
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    ''

  const html = text
  const excerpt = stripHtml(html).slice(0, 220)
  return { content_html: html, excerpt }
}

// opcional: geração de imagem (fallback se nenhum banco de imagem entregar)
async function generateImageFallback(b: GenBody) {
  // Prioridade: Runware (se disponível). Caso não tenha, tenta OpenAI Images (se houver).
  const runwareUrl = process.env.RUNWARE_ENDPOINT
  const runwareKey = process.env.RUNWARE_API_KEY

  if (runwareUrl && runwareKey) {
    const res = await fetch(runwareUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${runwareKey}`,
      },
      body: JSON.stringify({
        prompt:
          b.prompt || `${b.title || 'Imagem de capa'} – foto editorial, 1200x700, alta qualidade`,
        size: '1200x700',
      }),
    })
    if (!res.ok) throw new Error(`Runware error: ${await res.text()}`)
    const data = await res.json()
    const url = data?.image_url || data?.url || data?.data?.[0]?.url
    if (!url) throw new Error('Runware não retornou image_url')
    return { image_url: url }
  }

  // Fallback: OpenAI Images (se chave existir)
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const r = await client.images.generate({
      model: 'gpt-image-1',
      prompt: b.prompt || `${b.title || 'Imagem de capa'} – foto editorial, 1200x700`,
      size: '1024x1024',
    })
    const url = (r.data?.[0]?.url as string) || ''
    if (!url) throw new Error('OpenAI Images não retornou URL')
    return { image_url: url }
  }

  throw new Error('Nenhum provider configurado para geração de imagem')
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenBody
    const kind = body.kind || 'text'

    if (kind === 'image') {
      const img = await generateImageFallback(body)
      return NextResponse.json(img)
    }

    // TEXT: tenta OpenAI → fallback Gemini
    try {
      const data = await generateWithOpenAI(body)
      return NextResponse.json(data)
    } catch (err) {
      // se deu 401/invalid key, tenta Gemini automaticamente
      const msg = (err as any)?.message || ''
      if (msg?.includes('OPENAI') || msg?.includes('401') || msg?.includes('invalid_api_key')) {
        const data = await generateWithGemini(body)
        return NextResponse.json(data)
      }
      throw err
    }
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
