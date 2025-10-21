'use client'

import { useState } from 'react'
import clsx from 'clsx'

export type BeneficioQuizQuestion = {
  id: string
  prompt: string
  options: string[]        // 4 opções
  correctIndex?: number    // ignorado em survey
  explain?: string
}

export type BeneficioQuiz = {
  title?: string
  desc?: string
  questions: BeneficioQuizQuestion[]
}

export default function BeneficioQuiz({
  quiz,
  mode = 'survey',            // pesquisa por padrão
  compact = true,             // visual compacto
  relatedLinks = [],
  onFinish,
  onRequestClose,             // permite fechar do próprio componente
}: {
  quiz: BeneficioQuiz
  mode?: 'survey' | 'quiz'
  compact?: boolean
  relatedLinks?: { title: string; url: string }[]
  onFinish?: (answers: number[]) => void
  onRequestClose?: () => void
}) {
  const total = quiz.questions.length
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(-1))
  const [done, setDone] = useState(false)

  const q = quiz.questions[step]
  const progress = Math.round(((done ? total : step) / total) * 100)

  function select(idx: number) {
    setAnswers(prev => {
      const next = [...prev]
      next[step] = idx
      return next
    })
    if (mode === 'survey') {
      setTimeout(() => next(), 120)
    }
  }
  function next() {
    if (step < total - 1) setStep(step + 1)
    else {
      setDone(true)
      onFinish?.(answers)
    }
  }
  function restart() {
    setAnswers(Array(total).fill(-1))
    setStep(0)
    setDone(false)
  }

  return (
    <section className={clsx(
      'rounded-xl border border-emerald-200 bg-white p-4 sm:p-5',
      compact && 'p-4'
    )}>
      {/* Header compacto */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-emerald-900">{quiz.title || 'Questionário'}</h2>
          <span className="text-[11px] font-medium text-emerald-800">
            {done ? 'Concluído' : `Pergunta ${step + 1}/${total}`}
          </span>
        </div>
        {quiz.desc && <p className="mt-1 text-xs text-emerald-900/80">{quiz.desc}</p>}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${done ? 100 : progress}%` }} />
        </div>
      </div>

      {done ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">Obrigado por responder!</div>
          <p className="mt-1 text-sm text-emerald-900/80">
            Com base nas suas respostas, veja conteúdos úteis para continuar:
          </p>

          {Array.isArray(relatedLinks) && relatedLinks.length > 0 && (
            <ul className="mt-3 space-y-2">
              {relatedLinks.map((l) => (
                <li key={l.url}>
                  <a href={l.url} className="text-emerald-700 hover:underline text-sm">
                    {l.title}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={restart}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-[0.98]"
            >
              Refazer
            </button>

            {onRequestClose && (
              <button
                onClick={onRequestClose}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">{q.prompt}</h3>
          </div>

          <div className="grid gap-2">
            {q.options.map((opt, idx) => {
              const selected = answers[step] === idx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => select(idx)}
                  className={clsx(
                    'w-full rounded-lg border px-3 py-2 text-left text-[13px] transition',
                    selected
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {mode === 'quiz' && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={next}
                disabled={answers[step] === -1}
                className={clsx(
                  'rounded-lg px-4 py-2 text-xs font-semibold text-white active:scale-[0.98]',
                  answers[step] === -1 ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {step < total - 1 ? 'Próxima' : 'Finalizar'}
              </button>
              <button
                onClick={restart}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
              >
                Recomeçar
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
