// lib/perplexity.ts
export type ResearchInput = {
  q: string
  type?: 'cards' | 'jobs' | 'contests' | 'guides'
  locale?: 'pt-BR'
}

export type ResearchHit = {
  title?: string
  url?: string
  snippet?: string
}

export type ResearchResult = {
  summary: string
  bullets: string[]
  sources: ResearchHit[]
  suggestedTitle?: string
  keywords?: string[]
}

const MODEL = 'sonar' // ou 'sonar-pro'

function buildPrompt({ q, type, locale='pt-BR' }: ResearchInput) {
  const scopes: Record<string, string> = {
    cards: `Contexto: comparar cartões de crédito no Brasil (anuidade, benefícios, pontos/milhas, cashback, aprovação).
Produza: resumo imparcial, bullets de diferenciais, ideias de título para blog e palavras-chave.`,
    jobs: `Contexto: vagas/empregos no Brasil (remoto/presencial, júnior, salário-base, requisitos).
Produza: resumo útil, bullets de requisitos/salário/tendências e palavras-chave.`,
    contests: `Contexto: concursos no Brasil (órgão, carreira, remuneração, cronograma, edital).
Produza: resumo com datas/órgãos/benefícios, bullets e palavras-chave.`,
    guides: `Contexto: finanças pessoais no Brasil.
Produza: resumo didático, bullets passo-a-passo e palavras-chave.`
  }
  const scope = scopes[type || 'guides']

  return `Você é um pesquisador. Pesquise: "${q}".
${scope}

Regras:
- Responda em ${locale}.
- Traga fontes com links (quando disponíveis).
- Seja conciso e neutro.

Formato JSON:
{
  "summary": "resumo curto e objetivo",
  "bullets": ["tópico 1", "tópico 2", "..."],
  "sources": [{"title": "...", "url": "...", "snippet": "..."}],
  "suggestedTitle": "título sugerido",
  "keywords": ["kw1","kw2","kw3"]
}`
}

export async function researchWithPerplexity(input: ResearchInput): Promise<ResearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY ausente')

  const prompt = buildPrompt(input)

  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1200
    })
  })

  if (!r.ok) {
    const txt = await r.text()
    throw new Error(`Perplexity erro: ${r.status} – ${txt}`)
  }

  const j = await r.json()
  const content: string = j?.choices?.[0]?.message?.content || ''

  // tentar parsear JSON do modelo
  try {
    const data = JSON.parse(content)
    return {
      summary: data.summary || '',
      bullets: data.bullets || [],
      sources: data.sources || [],
      suggestedTitle: data.suggestedTitle,
      keywords: data.keywords || []
    }
  } catch {
    // fallback "heurístico", caso o modelo não retorne JSON válido
    return {
      summary: content.slice(0, 500),
      bullets: [],
      sources: [],
    }
  }
}
