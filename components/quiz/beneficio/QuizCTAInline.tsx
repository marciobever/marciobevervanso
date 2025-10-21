// components/quiz/beneficio/QuizCTAInline.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import BeneficioQuiz, {
  BeneficioQuiz as QuizModel, // reusa o tipo do componente (garante compatibilidade)
} from '@/components/quiz/beneficio/BeneficioQuiz'

export default function QuizCTAInline({
  quiz,
  ctaLabel = 'Verifique se você tem direito',
  relatedLinks = [] as { title: string; url: string }[],
  startOpen = false,
}: {
  quiz: QuizModel
  ctaLabel?: string
  relatedLinks?: { title: string; url: string }[]
  startOpen?: boolean
}) {
  const [open, setOpen] = useState(startOpen)
  const anchorRef = useRef<HTMLDivElement | null>(null)

  // ao abrir, rola levemente até o bloco do quiz
  useEffect(() => {
    if (open && anchorRef.current) {
      anchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [open])

  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return null
  }

  return (
    <>
      {/* CTA abaixo do primeiro parágrafo */}
      <div className="my-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-emerald-900">Quer saber se tem direito?</div>
          <p className="text-xs text-emerald-900/80">
            Responda perguntas rápidas e receba orientação com links úteis.
          </p>
        </div>
        <div className="mt-3 sm:mt-0">
          <button
            onClick={() => setOpen(true)}
            aria-expanded={open}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-[0.98]"
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* QUIZ INLINE (sem modal, sem ad, sem botão X) */}
      {open && (
        <div ref={anchorRef} className="my-4">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5 shadow-sm">
            <BeneficioQuiz
              quiz={quiz}
              mode="survey"          // questionário de roteamento
              compact
              relatedLinks={relatedLinks}
              onFinish={() => {
                // mantém visível; se quiser fechar ao fim, descomente:
                // setOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
