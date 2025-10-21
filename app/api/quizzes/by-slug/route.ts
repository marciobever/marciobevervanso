// app/api/quizzes/by-slug/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** Tipagens mínimas usadas aqui (ajuste conforme seu schema real) */
type Quiz = {
  id: string
  slug: string
  status: string
  [k: string]: any
}

type QuizQuestion = {
  id: string
  quiz_id: string
  prompt: string
  order_idx?: number
  [k: string]: any
}

type QuizOption = {
  id: string
  question_id: string
  label?: string
  value?: string
  is_correct?: boolean
  [k: string]: any
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'missing slug' }, { status: 400 })
  }

  // 1) Quiz publicado
  const { data: quizData, error: quizErr } = await db
    .from('quizzes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (quizErr) {
    return NextResponse.json({ ok: false, error: quizErr.message }, { status: 500 })
  }
  const quiz = (quizData ?? null) as Quiz | null
  if (!quiz) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  // 2) Perguntas (garante array mesmo se vier null)
  const { data: questionsData, error: qErr } = await db
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('order_idx', { ascending: true })

  if (qErr) {
    return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 })
  }
  const questions = (questionsData ?? []) as QuizQuestion[]

  // 3) Opções (só busca se houver perguntas)
  const qids = questions.map((q) => q.id)
  let options: QuizOption[] = []
  if (qids.length) {
    const { data: optionsData, error: optErr } = await db
      .from('quiz_options')
      .select('*')
      .in('question_id', qids)

    if (optErr) {
      return NextResponse.json({ ok: false, error: optErr.message }, { status: 500 })
    }
    options = (optionsData ?? []) as QuizOption[]
  }

  // 4) Agrupa opções por questão e monta estrutura final
  const byQ: Record<string, QuizOption[]> = {}
  for (const o of options) {
    ;(byQ[o.question_id] ||= []).push(o)
  }

  const withOpts = questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: byQ[q.id] ?? [],
  }))

  return NextResponse.json({ ok: true, quiz: { ...quiz, questions: withOpts } })
}
