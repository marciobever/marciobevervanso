// app/api/quiz/beneficios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Answer = { key: string; value: string }

function toKeywords(result_key?: string | null, answers: Answer[] = []) {
  // Extrai termos úteis do result_key + respostas (bem conservador)
  const base = (result_key || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sem acento
    .replace(/[^a-z0-9\s-]/g, ' ')
  const fromAnswers = answers
    .map(a => `${a.key} ${a.value}`.toLowerCase())
    .join(' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const all = `${base} ${fromAnswers}`
  // pega palavras relevantes (min 4 chars)
  const kws = Array.from(new Set(all.split(/\s+/).filter(w => w.length >= 4))).slice(0, 8)
  return kws
}

async function fetchRecommendations(
  result_key: string | null,
  answers: Answer[] = []
) {
  const keywords = toKeywords(result_key, answers)

  // 1) Tente casar por category/tags se existirem
  // Ajuste os nomes dos campos conforme seu schema
  // Exemplo assumido: posts (id, slug, title, type, category, tags(text[]), published, created_at)
  // Se tags for jsonb array, o contains muda para .contains('tags', ['foo'])
  const recs: any[] = []

  // (a) por categoria derivada do result_key (ex.: "bolsa familia", "tarifa social")
  const catHint =
    /bolsa|familia|bf/.test((result_key || '').toLowerCase()) ? 'bolsa' :
    /tarifa|social|energia|aneel/.test((result_key || '').toLowerCase()) ? 'tarifa social' :
    null

  if (catHint) {
    const { data } = await supa
      .from('posts')
      .select('id,slug,title,excerpt,cover_url,type,category,tags,created_at')
      .eq('type', 'beneficios')
      .ilike('category', `%${catHint}%`)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(4)
    if (data?.length) recs.push(...data)
  }

  // (b) por tags (se for text[])
  if (recs.length < 4 && keywords.length) {
    // tente um "OR ilike title" de várias palavras
    const orTitle = keywords.map(k => `title.ilike.%${k}%`).join(',')
    const { data } = await supa
      .from('posts')
      .select('id,slug,title,excerpt,cover_url,type,category,tags,created_at')
      .eq('type', 'beneficios')
      .eq('published', true)
      .or(orTitle) // title ILIKE qualquer keyword
      .order('created_at', { ascending: false })
      .limit(6)
    if (data?.length) {
      for (const d of data) {
        if (!recs.find(r => r.id === d.id)) recs.push(d)
      }
    }
  }

  // (c) fallback: últimos publicados de benefícios
  if (recs.length < 3) {
    const { data } = await supa
      .from('posts')
      .select('id,slug,title,excerpt,cover_url,type,category,tags,created_at')
      .eq('type', 'beneficios')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3)
    if (data?.length) {
      for (const d of data) {
        if (!recs.find(r => r.id === d.id)) recs.push(d)
      }
    }
  }

  // normaliza para o front
  return recs.slice(0, 4).map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? null,
    cover: p.cover_url ?? null,
    url: `/posts/beneficios/${p.slug}`,
  }))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      source = 'home',
      answers = [] as Answer[],
      score = 0,
      result_key = null,
      email = null,
      consent = false,
      utm = {}
    } = body || {}

    const user_agent = req.headers.get('user-agent') || ''
    const ip = req.headers.get('x-forwarded-for') || undefined

    const { data, error } = await supa
      .from('quiz_beneficios_sessions')
      .insert([{
        source, answers, score, result_key, email, consent, utm,
        user_agent, ip
      }])
      .select()
      .single()

    if (error) throw error

    // texto do resultado (se existir catálogo)
    let result = null as any
    if (result_key) {
      const { data: cat } = await supa
        .from('quiz_beneficios_catalog')
        .select('*')
        .eq('key', result_key)
        .maybeSingle()
      result = cat
    }

    // 👇 NOVO: recomendações
    const recommendations = await fetchRecommendations(result_key, answers)

    return NextResponse.json({ ok: true, session: data, result, recommendations })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}