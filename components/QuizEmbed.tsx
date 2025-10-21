'use client'
import { useEffect, useState } from 'react'

export default function QuizEmbed({ slug }: { slug: string }) {
  const [quiz, setQuiz] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/quizzes/by-slug?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json()).then(j => setQuiz(j?.quiz || null))
  }, [slug])

  if (!quiz) return null

  function submit() {
    let s = 0
    for (const q of quiz.questions) {
      const opt = q.options.find((o: any) => o.id === answers[q.id])
      s += opt?.score || 0
    }
    setScore(s)
  }

  return (
    <div className="border rounded-xl bg-white p-4">
      <h3 className="font-bold text-lg mb-2">{quiz.title}</h3>
      <p className="text-sm text-slate-600 mb-3">{quiz.description}</p>

      {quiz.questions.map((q: any, idx: number) => (
        <div key={q.id} className="mb-3">
          <div className="font-semibold mb-1">{idx + 1}. {q.prompt}</div>
          <div className="space-y-1">
            {q.options.map((o: any) => (
              <label key={o.id} className="flex gap-2 text-sm">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[q.id] === o.id}
                  onChange={() => setAnswers(a => ({ ...a, [q.id]: o.id }))}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={submit} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm">
        Ver resultado
      </button>
      {score !== null && (
        <div className="mt-3 text-sm">Sua pontuação: <b>{score}</b></div>
      )}
    </div>
  )
}
