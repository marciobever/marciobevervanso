// components/dashboard/N8NRunPanel.tsx
'use client'

import { useMemo, useState } from 'react'

type N8NImage = {
  id: string
  provider?: string
  thumb?: string | null
  full?: string | null
  w?: number
  h?: number
  alt?: string
  page?: string | null
  score?: number
  roleHints?: string[]
}

type ImagesResp =
  | { ok: true; items: N8NImage[] }
  | { ok: false; error: string }

type ArticleResp =
  | { ok: true; data: any }
  | { ok: false; error: string }

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ')
}

const TYPE_OPTIONS = [
  { value: 'geral',      label: 'Geral',       emoji: '✨' },
  { value: 'cartoes',    label: 'Cartões',     emoji: '💳' },
  { value: 'beneficios', label: 'Benefícios',  emoji: '🎯' },
  { value: 'empregos',   label: 'Empregos',    emoji: '💼' },
  { value: 'concursos',  label: 'Concursos',   emoji: '📝' },
] as const

type TypeValue = typeof TYPE_OPTIONS[number]['value']

export default function N8NRunPanel() {
  const [term, setTerm] = useState('')
  const [type, setType] = useState<TypeValue>('geral')

  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<N8NImage[]>([])
  const [error, setError] = useState<string | null>(null)

  const [coverId, setCoverId] = useState<string | null>(null)
  const [inlineId, setInlineId] = useState<string | null>(null)

  const [sendingArticle, setSendingArticle] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  const totalByProvider = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const i of images) {
      const p = i.provider || '—'
      acc[p] = (acc[p] || 0) + 1
    }
    return acc
  }, [images])

  async function fetchImages() {
    setError(null)
    setInfo(null)
    setImages([])
    setCoverId(null)
    setInlineId(null)

    const t = term.trim()
    if (!t) {
      setError('Digite um termo.')
      return
    }

    setLoading(true)
    try {
      const r = await fetch('/api/n8n/images', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          term: t,
          // mandamos os dois nomes porque os nós do n8n podem ler um ou outro
          category: type,
          type, // <- importante para o normalizador/classificador
        }),
        cache: 'no-store',
      })
      const json = (await r.json()) as ImagesResp
      if (!json.ok) throw new Error((json as any).error || 'Falha ao buscar imagens')
      const items = (json as any).items as N8NImage[]
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Nenhuma imagem encontrada')
      }
      setImages(items)
    } catch (e: any) {
      setError(e?.message || 'Erro ao buscar imagens')
    } finally {
      setLoading(false)
    }
  }

  function selected(label: 'cover' | 'inline', id: string) {
    if (label === 'cover') setCoverId(id)
    else setInlineId(id)
  }

  async function sendArticle() {
    setError(null)
    setInfo(null)

    const t = term.trim()
    if (!t) {
      setError('Digite um termo.')
      return
    }
    if (!coverId || !inlineId) {
      setError('Selecione uma imagem de Capa e uma de Inline.')
      return
    }

    const cover = images.find(i => i.id === coverId) || null
    const inline = images.find(i => i.id === inlineId) || null

    setSendingArticle(true)
    try {
      const r = await fetch('/api/n8n/article', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          term: t,
          category: type,
          type,
          cover,                 // ok: normalizador aceita cover / cover_image
          inline_image: inline,  // 👈 chave alinhada ao normalizador
        }),
        cache: 'no-store',
      })
      const json = (await r.json()) as ArticleResp
      if (!json.ok) throw new Error((json as any).error || 'Falha ao gerar artigo')

      setInfo('Artigo disparado com sucesso. Confira os drafts no painel.')
    } catch (e: any) {
      setError(e?.message || 'Erro ao gerar artigo')
    } finally {
      setSendingArticle(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bonitinho */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">
          🖼️ Seleção de Imagens
        </h2>
        {!!images.length && (
          <div className="hidden md:flex items-center gap-2 text-xs">
            {Object.entries(totalByProvider).map(([prov, n]) => (
              <span key={prov} className="rounded-full border px-2 py-1 bg-white/70 text-slate-600">
                {prov}: <span className="font-semibold ml-1">{n}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card do Form */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur p-4 md:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-3 space-y-1">
            <label className="block text-sm font-semibold text-slate-700">
              Termo
            </label>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ex.: melhores cartões platinum 2025"
              className="w-full rounded-xl border px-3 py-3 outline-none focus:ring-4 focus:ring-sky-200"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeValue)}
              className="w-full rounded-xl border px-3 py-3 bg-white outline-none focus:ring-4 focus:ring-sky-200"
            >
              {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchImages}
            disabled={loading || !term.trim()}
            className={cls(
              'rounded-xl px-4 py-2 font-bold text-white shadow',
              loading || !term.trim() ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'
            )}
          >
            {loading ? 'Buscando…' : 'Buscar imagens'}
          </button>

          <button
            type="button"
            onClick={sendArticle}
            disabled={sendingArticle || !images.length || !coverId || !inlineId}
            className={cls(
              'rounded-xl px-4 py-2 font-bold text-white shadow',
              sendingArticle || !images.length || !coverId || !inlineId
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {sendingArticle ? 'Gerando…' : 'Gerar artigo'}
          </button>

          {!!images.length && (
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border px-2 py-1 bg-white/70">
                Total: <strong>{images.length}</strong>
              </span>
              <span className="rounded-full border px-2 py-1 bg-white/70">
                Capa: <strong>{coverId || '—'}</strong>
              </span>
              <span className="rounded-full border px-2 py-1 bg-white/70">
                Inline: <strong>{inlineId || '—'}</strong>
              </span>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}
        {info && <div className="text-sm text-emerald-700">{info}</div>}

        <div className="text-xs text-slate-500">
          Dica: a imagem de capa fica melhor em proporção mais “larga”.
        </div>
      </div>

      {/* Grid de imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => {
            const src = img.thumb || img.full || ''
            if (!src) return null
            const isCover = coverId === img.id
            const isInline = inlineId === img.id
            return (
              <div
                key={img.id}
                className={cls(
                  'relative overflow-hidden rounded-xl border bg-white/70 shadow-sm transition-all',
                  (isCover || isInline) ? 'ring-2 ring-sky-500 scale-[1.01]' : 'hover:shadow-md'
                )}
              >
                <div className="aspect-[4/3] bg-slate-100">
                  {/* usar <img> normal para evitar bloqueio de domínio do Next/Image */}
                  <img
                    src={src}
                    alt={img.alt || ''}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] uppercase text-slate-500">
                    <span className="rounded px-2 py-0.5 border bg-white/80">
                      {img.provider || '—'}
                    </span>
                    {img.w && img.h && (
                      <span className="rounded px-2 py-0.5 border bg-white/80">
                        {img.w}×{img.h}
                      </span>
                    )}
                    {typeof img.score === 'number' && (
                      <span className="rounded px-2 py-0.5 border bg-white/80">
                        score {img.score}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 line-clamp-2">
                    {img.alt || '—'}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => selected('cover', img.id)}
                      className={cls(
                        'rounded-lg border px-2 py-1 text-xs',
                        isCover ? 'bg-sky-600 text-white border-sky-600' : 'hover:bg-slate-100'
                      )}
                    >
                      {isCover ? 'Capa ✓' : 'Selecionar Capa'}
                    </button>
                    <button
                      type="button"
                      onClick={() => selected('inline', img.id)}
                      className={cls(
                        'rounded-lg border px-2 py-1 text-xs',
                        isInline ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-slate-100'
                      )}
                    >
                      {isInline ? 'Inline ✓' : 'Selecionar Inline'}
                    </button>
                    {img.page && (
                      <a
                        href={img.page}
                        className="ml-auto text-xs underline text-slate-600 hover:text-slate-800"
                        target="_blank"
                        rel="noreferrer"
                      >
                        fonte
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}