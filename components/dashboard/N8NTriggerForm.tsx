// components/dashboard/N8NTriggerForm.tsx
'use client'

import React, { useState } from 'react'

type Option = { value: string; label: string }

const CATEGORIES: Option[] = [
  { value: 'cartoes', label: 'Cartões' },
  { value: 'beneficios', label: 'Benefícios' },
  { value: 'concursos', label: 'Concursos' },
  { value: 'empregos', label: 'Empregos' },
]

const POST_TYPES: Option[] = [
  { value: 'post', label: 'Post (artigo)' },
  { value: 'news', label: 'Notícia' },
  { value: 'guia', label: 'Guia' },
  { value: 'quiz', label: 'Quiz' },
]

export default function N8NTriggerForm() {
  const [category, setCategory] = useState('beneficios')
  const [postType, setPostType] = useState('post')
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [badge, setBadge] = useState('')
  const [published, setPublished] = useState(true)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'dashboard',
          requestedBy: 'admin',
          category,
          postType,
          title: title.trim() || null,
          prompt: prompt.trim(),
          badge: badge.trim() || null,
          flags: { published },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Falha (${res.status})`)
      setResult(typeof data?.data === 'string' ? data.data : JSON.stringify(data.data, null, 2))
    } catch (err: any) {
      setError(err?.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-xl font-bold text-slate-800">🚀 Disparar fluxo no n8n</h2>
      <p className="mb-6 text-sm text-slate-600">
        Escolha categoria e tipo, escreva o prompt e envie. O servidor repassa ao webhook do n8n.
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Categoria
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Tipo de Post
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
            >
              {POST_TYPES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Título (opcional)
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Bolsa Família 2025: regras e valores"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Prompt <span className="text-red-500">*</span>
          <textarea
            className="mt-1 min-h-[140px] w-full rounded-xl border px-3 py-2"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex.: Gerar artigo de 800-1200 palavras com subtítulos H2/H3, bullets e tabela..."
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Badge (opcional)
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Ex.: EM ALTA, NOVIDADES, RECOMENDADO"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pt-6">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-5 w-5 accent-sky-600"
            />
            Marcar como publicado
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="rounded-xl bg-sky-600 px-5 py-2 font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? 'Enviando…' : 'Enviar para n8n'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => { setResult(null); setError(null); }}
            className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            Limpar resultado
          </button>
        </div>
      </form>

      {(error || result) && (
        <div className="mt-6">
          {error && (
            <pre className="whitespace-pre-wrap rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </pre>
          )}
          {result && (
            <pre className="mt-3 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-3 text-sm text-green-200">
              {result}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
