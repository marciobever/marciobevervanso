// app/quiz/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { supaPublic } from '@/lib/supa-public'
import QuizRunner from './QuizRunner'

export const metadata = { title: 'Quiz • Mapa do Crédito' }

export default async function QuizPage({ params }: { params: { slug: string } }) {
  const db = supaPublic()

  // 1) Quiz publicado
  const { data: quiz } = await db
    .from('quizzes')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!quiz) return notFound()

  // 2) Perguntas (ordena por order_idx; se não existir, usa ord)
  let { data: questions } = await db
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('order_idx', { ascending: true })

  // fallback: alguns bancos antigos usam "ord"
  if (!questions?.length) {
    const { data: qs2 } = await db
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('ord', { ascending: true })
    questions = qs2
  }

  // 3) Opções por pergunta
  const qids = (questions || []).map((q: any) => q.id)
  let options: any[] = []
  if (qids.length) {
    const { data: opts } = await db
      .from('quiz_options')
      .select('*')
      .in('question_id', qids)
    options = opts || []
  }

  // 4) Monta estrutura: cada pergunta com seu array de options
  const byQ: Record<string, any[]> = {}
  options.forEach(o => { (byQ[o.question_id] ||= []).push(o) })
  const questionsWithOptions = (questions || []).map((q: any) => ({
    ...q,
    // normaliza os campos:
    prompt: q.prompt ?? q.question ?? '',
    options: (byQ[q.id] || []).map(o => ({
      id: o.id,
      label: o.label,
      score: o.score ?? 0,
      is_correct: !!o.is_correct,
    })),
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur p-6 shadow-sm">
        <h1 className="text-2xl font-black">{quiz.title}</h1>
        {quiz.description && <p className="text-slate-600 mt-1">{quiz.description}</p>}

        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {quiz.cover_url && <img src={quiz.cover_url} className="rounded-xl border mb-4" alt="" />}
          <QuizRunner quiz={quiz} questions={questionsWithOptions} />
        </div>
      </div>
    </div>
  )
}
