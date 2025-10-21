'use client'

import React from 'react'

export default function QuizRunner({ quiz, questions }: { quiz: any, questions: any[] }) {
  const [i, setI] = React.useState(0)
  const [answers, setAnswers] = React.useState<any[]>([])
  const q = questions[i]

  function next(value: any) {
    const upd = [...answers, { qid: q.id, value }]
    setAnswers(upd)
    const ni = i + 1
    if (ni < questions.length) setI(ni)
    else finish(upd)
  }

  async function finish(finalAnswers: any[]) {
    // Pontuação: soma score das opções selecionadas
    let score = 0
    finalAnswers.forEach(a => {
      const qq = questions.find(x => x.id === a.qid)
      const selected = Array.isArray(a.value) ? a.value : [a.value]
      selected.forEach((optId: string) => {
        const opt = (qq?.options || []).find((o: any) => o.id === optId)
        if (opt) score += Number(opt.score || 0)
      })
    })

    // Salva sessão (lead opcional depois)
    await fetch('/api/quiz/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quiz.id, answers: finalAnswers, score })
    })

    // Redireciona para resultado (podemos criar uma tela bonita depois)
    window.location.href = `/quiz/${quiz.slug}/resultado?score=${score}`
  }

  if (!q) return <div>Carregando…</div>

  const opts = Array.isArray(q.options) ? q.options : []
  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">Pergunta {i + 1} de {questions.length}</div>
      <div className="text-lg font-semibold">{q.prompt}</div>
      <div className="grid gap-2">
        {opts.map((o: any) => (
          <button
            key={o.id}
            onClick={() => next(o.id)}
            className="text-left px-4 py-3 rounded-xl border bg-white hover:bg-slate-50 transition"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
