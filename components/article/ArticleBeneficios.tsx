'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import CategoryBadge from '@/components/ui/CategoryBadge'
import AdSlot from '@/components/ads/AdSlot'
import QuizCTAInline from '@/components/quiz/beneficio/QuizCTAInline'

export type Json = Record<string, any> | null
export type PostRow = {
  id: string
  title: string
  slug: string
  type: string | null
  category: string | null
  image_url: string | null
  content_html: string | null
  minutes: number | null
  reading_time?: number | null
  created_at: string | null
  published_at?: string | null
  status: 'draft' | 'published'
  extras: Json
  flags: Json
  summary?: string | null
  excerpt?: string | null
  tags?: string[] | null
  sources?: Array<{ name?: string; url?: string } | string> | null
}

type Related = Pick< PostRow, 'id' | 'title' | 'slug' | 'type' | 'category' | 'image_url' | 'created_at' >

function stripTags(html: string) { return (html || '').replace(/<[^>]+>/g, '') }
function slugify(s: string) {
  return stripTags(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9\s-]/g,'')
    .trim().replace(/\s+/g,'-')
}
type TocItem = { id: string; text: string; level: 2 | 3 }

function parseAndStripSummary(html?: string) {
  const H = String(html || '')
  const re = /<p>\s*<strong>\s*Resumo\s*<\/strong>\s*<\/p>\s*<p>([\s\S]*?)<\/p>/i
  const m = H.match(re)
  if (!m) {
    const m2 = H.match(/<p>([\s\S]*?)<\/p>/i)
    return { summary: m2?.[1] ? stripTags(m2[1]).replace(/\s+/g,' ').trim() : null, htmlWithoutSummary: H }
  }
  const summary = stripTags(m[1]).replace(/\s+/g,' ').trim()
  const htmlWithoutSummary = H.replace(re,'').replace(/\n{3,}/g,'\n\n').trim()
  return { summary, htmlWithoutSummary }
}

function buildTocAndInjectIds(html: string) {
  const ids = new Set<string>()
  const items: TocItem[] = []
  const replaced = (html || '')
    .replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (_m, attrs = '', inner) => {
      const text = stripTags(inner)
      let id = slugify(text) || 'secao'; let i = 2
      while (ids.has(id)) id = `${id}-${i++}`
      ids.add(id); items.push({ id, text, level: 2 })
      return `<h2 id="${id}"${attrs || ''}>${inner}</h2>`
    })
    .replace(/<h3(\s[^>]*)?>([\s\S]*?)<\/h3>/gi, (_m, attrs = '', inner) => {
      const text = stripTags(inner)
      let id = slugify(text) || 'subsecao'; let i = 2
      while (ids.has(id)) id = `${id}-${i++}`
      ids.add(id); items.push({ id, text, level: 3 })
      return `<h3 id="${id}"${attrs || ''}>${inner}</h3>`
    })
  return { html: replaced, toc: items }
}

function formatMinutes(min?: number | null, reading_time?: number | null) {
  const val = reading_time ?? min
  if (!val || val < 1) return 'Leitura rápida'
  return `Leitura de ${val} min`
}
function formatDate(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR',{ day:'2-digit', month:'short', year:'numeric' })
}
function normalizeSources(src?: Array<{ name?: string; url?: string }|string>|null) {
  if (!Array.isArray(src)) return []
  return src.map((s) => {
    if (typeof s === 'string') return { name: s.replace(/^https?:\/\//,''), url: s }
    const name = (s?.name && String(s.name)) || (s?.url ? String(s.url).replace(/^https?:\/\//,'') : '')
    const url = s?.url ? String(s.url) : ''
    if (!name && !url) return null
    return { name, url }
  }).filter(Boolean) as { name: string; url: string }[]
}

// split após primeiro </p>
function splitAfterFirstParagraph(html: string) {
  const H = String(html || '')
  const i = H.toLowerCase().indexOf('</p>')
  if (i === -1) return { before: H, after: '' }
  const cut = i + 4
  return { before: H.slice(0, cut), after: H.slice(cut) }
}

export default function ArticleBeneficios({ post, related = [] }: { post: PostRow; related?: Related[] }) {
  const kind = (post.type || post.category || 'beneficios').toLowerCase()

  const parsed = parseAndStripSummary(post.content_html || '')
  const summary =
    (typeof post.summary === 'string' && post.summary.trim()) ||
    (post.extras as any)?.summary || parsed.summary || (post.excerpt ? String(post.excerpt) : '')

  const processed = buildTocAndInjectIds(parsed.htmlWithoutSummary || '')
  let fullHtml = processed.html || ''

  // remove marker se existir (vamos controlar o CTA na posição desejada)
  fullHtml = fullHtml.replace(/<!--\s*QUIZ_WIDGET\s*-->/g, '')

  const tags = Array.isArray(post.tags) ? post.tags.filter(Boolean) : []
  const sources = normalizeSources(post.sources)
  const rawQuiz = (post.extras as any)?.quiz
  const hasQuiz = !!rawQuiz && Array.isArray(rawQuiz.questions) && rawQuiz.questions.length > 0

  // split conteúdo após 1º parágrafo
  const parts = useMemo(() => splitAfterFirstParagraph(fullHtml), [fullHtml])

  // links finais do quiz (ajuste se quiser)
  const relatedLinks = [
    { title: 'Calendário do Bolsa Família (NIS por mês)', url: '/posts/beneficios/calendario-bolsa-familia-2025' },
    { title: 'Como atualizar o CadÚnico (passo a passo)', url: '/posts/beneficios/como-atualizar-cadunico' },
    { title: 'BPC/LOAS 2025 — guia completo', url: '/posts/beneficios/bpc-loas-2025-guia-completo-beneficio-prestacao-continuada' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <nav className="text-sm text-slate-500">
          <Link href="/" className="hover:underline">Início</Link>
          <span className="mx-1">/</span>
          <Link href={`/posts/${encodeURIComponent(kind)}`} className="hover:underline">
            {kind[0].toUpperCase() + kind.slice(1)}
          </Link>
        </nav>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* MAIN */}
        <div>
          <h1 className="text-3xl font-black leading-tight md:text-4xl">{post.title}</h1>

          <div className="mt-2 mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <CategoryBadge value={kind} />
            <span>• {formatMinutes(post.minutes, post.reading_time)}</span>
            {post.created_at && <span>• {formatDate(post.created_at)}</span>}
          </div>

          {post.image_url && (
            <figure className="relative mb-4 overflow-hidden rounded-2xl sm:mb-6">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
            </figure>
          )}

          {/* AD — MOBILE */}
          <div className="mb-6 block lg:hidden">
            <AdSlot
              slot="inarticle"
              className="mx-auto w-full rounded-2xl border bg-white"
              style={{ minHeight: 90 }}
            />
          </div>

          {/* Sumário */}
          {processed.toc.length > 0 && (
            <div className="mb-6 rounded-xl border border-emerald-700 bg-emerald-900 p-5 text-white shadow sm:mb-8">
              <h2 className="mb-3 text-base font-bold">Sumário</h2>
              <ul className="space-y-2 text-sm leading-6">
                {processed.toc.map((i) => (
                  <li key={i.id} className={i.level === 3 ? 'ml-4 list-disc marker:text-emerald-300' : 'list-none'}>
                    <a href={`#${i.id}`} className="transition hover:text-emerald-200 hover:underline">{i.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resumo */}
          {summary && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
              <h2 className="mb-2 text-lg font-bold text-emerald-900">Resumo</h2>
              <p className="leading-relaxed text-emerald-900/90">{summary}</p>
            </div>
          )}

          {/* CONTEÚDO com CTA do QUIZ após 1º parágrafo */}
          <article className="post-content prose prose-slate max-w-none">
            <div dangerouslySetInnerHTML={{ __html: parts.before }} />
            {hasQuiz && <QuizCTAInline quiz={rawQuiz} relatedLinks={relatedLinks} />}
            <div dangerouslySetInnerHTML={{ __html: parts.after }} />
          </article>

          {/* Tags */}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <section className="mt-10">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Fontes */}
          {Array.isArray(post.sources) && post.sources.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-lg font-semibold">Fontes</h2>
              <ul className="list-disc space-y-1 pl-6 text-sm">
                {normalizeSources(post.sources).map((s, idx) => (
                  <li key={`${s.url || s.name}-${idx}`}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                        {s.name || s.url}
                      </a>
                    ) : (
                      <span>{s.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* AD — MOBILE: antes do rodapé */}
          <section className="mt-10 block lg:hidden">
            <AdSlot
              slot="content_bottom"
              className="mx-auto w-full rounded-2xl border bg-white"
              style={{ minHeight: 90 }}
            />
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Patrocinado</div>
              <div className="mt-2">
                <AdSlot slot="sidebar" fit />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
