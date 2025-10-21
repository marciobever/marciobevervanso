'use client'

import Link from 'next/link'
import Image from 'next/image'
import CategoryBadge from '@/components/ui/CategoryBadge'
import AdSlot from '@/components/ads/AdSlot'

type Json = Record<string, any> | null

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
  // extras para rodapé
  tags?: string[] | null
  placements?: string[] | null
  sources?: Array<{ name?: string; url?: string }> | null
}

type Related = Pick<
  PostRow,
  'id' | 'title' | 'slug' | 'type' | 'category' | 'image_url' | 'created_at'
>

function stripTags(html: string) {
  return (html || '').replace(/<[^>]+>/g, '')
}
function slugify(s: string) {
  return stripTags(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

type TocItem = { id: string; text: string; level: 2 | 3 }

/** Procura o bloco de Resumo:
 * <p><strong>Resumo</strong></p><p>…</p>
 * Retorna { summary, htmlWithoutSummary }
 */
function parseAndStripSummary(html?: string) {
  const H = String(html || '')
  const re = /<p>\s*<strong>\s*Resumo\s*<\/strong>\s*<\/p>\s*<p>([\s\S]*?)<\/p>/i
  const m = H.match(re)
  if (!m) {
    // fallback: 1º parágrafo (sem remover)
    const m2 = H.match(/<p>([\s\S]*?)<\/p>/i)
    return {
      summary: m2?.[1] ? stripTags(m2[1]).replace(/\s+/g, ' ').trim() : null,
      htmlWithoutSummary: H,
    }
  }
  const summary = stripTags(m[1]).replace(/\s+/g, ' ').trim()
  const htmlWithoutSummary = H.replace(re, '').replace(/\n{3,}/g, '\n\n').trim()
  return { summary, htmlWithoutSummary }
}

/** Injeta IDs em h2/h3 e monta TOC */
function buildTocAndInjectIds(html: string) {
  const ids = new Set<string>()
  const items: TocItem[] = []
  const replaced = (html || '')
    .replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (_m, attrs = '', inner) => {
      const text = stripTags(inner)
      let id = slugify(text) || 'secao'
      let i = 2
      while (ids.has(id)) id = `${id}-${i++}`
      ids.add(id)
      items.push({ id, text, level: 2 })
      return `<h2 id="${id}"${attrs || ''}>${inner}</h2>`
    })
    .replace(/<h3(\s[^>]*)?>([\s\S]*?)<\/h3>/gi, (_m, attrs = '', inner) => {
      const text = stripTags(inner)
      let id = slugify(text) || 'subsecao'
      let i = 2
      while (ids.has(id)) id = `${id}-${i++}`
      ids.add(id)
      items.push({ id, text, level: 3 })
      return `<h3 id="${id}"${attrs || ''}>${inner}</h3>`
    })
  return { html: replaced, toc: items }
}

/** Corta HTML após N blocos (parágrafos/headers/listas/tabelas/blockquote) */
function splitHtmlAfterBlocks(html: string, n = 3) {
  if (!html) return { before: '', after: '' }
  const RE =
    /(<\/p>|<\/h1>|<\/h2>|<\/h3>|<\/h4>|<\/ul>|<\/ol>|<\/table>|<\/blockquote>|<hr\s*\/?>)/gi
  const parts = html.split(RE)
  let blocks = 0,
    cursor = 0
  for (let i = 0; i < parts.length; i += 2) {
    const content = parts[i] ?? ''
    const closer = parts[i + 1] ?? ''
    cursor += (content + closer).length
    if (closer) {
      blocks++
      if (blocks >= n) break
    }
  }
  return { before: html.slice(0, cursor), after: html.slice(cursor) }
}

function formatMinutes(min?: number | null, reading_time?: number | null) {
  const val = reading_time ?? min
  if (!val || val < 1) return 'Leitura rápida'
  return `Leitura de ${val} min`
}
function formatDate(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function ArticleView({
  post,
  related = [],
}: {
  post: PostRow
  related?: Related[]
}) {
  const kind = (post.type || post.category || 'concursos').toLowerCase()

  // 1) Resumo: preferir campo, senão extrair do HTML e remover do corpo
  const parsed = parseAndStripSummary(post.content_html || '')
  const summary =
    (typeof post.summary === 'string' && post.summary.trim()) ||
    (post.extras as any)?.summary ||
    parsed.summary ||
    (post.excerpt ? String(post.excerpt) : '')

  // 2) TOC + IDs
  const processed = buildTocAndInjectIds(parsed.htmlWithoutSummary || '')

  // 3) ponto de injeção do ad in-article
  const split = splitHtmlAfterBlocks(processed.html || '', 3)

  const sources = Array.isArray(post.sources) ? post.sources : []
  const tags = Array.isArray(post.tags) ? post.tags : []

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* breadcrumb */}
      <div className="mb-3 text-sm text-slate-500">
        <Link href="/" className="hover:underline">
          Início
        </Link>{' '}
        <span className="mx-1">/</span>
        <Link href={`/posts/${encodeURIComponent(kind)}`} className="hover:underline">
          {kind[0].toUpperCase() + kind.slice(1)}
        </Link>
      </div>

      {/* AD FIXO: topo do artigo */}
      <div className="mb-6">
        <AdSlot slot="content_top" />
      </div>

      {/* Título */}
      <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
        {post.title}
      </h1>

      {/* meta */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <CategoryBadge value={kind} />
        <span>• {formatMinutes(post.minutes, post.reading_time)}</span>
        {post.created_at && <span>• {formatDate(post.created_at)}</span>}
      </div>

      {/* capa padronizada (16:9) */}
      {post.image_url && (
        <figure className="post-hero relative mb-4 overflow-hidden rounded-2xl">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
              priority={false}
            />
          </div>
        </figure>
      )}

      {/* callout de resumo */}
      {summary && (
        <div className="callout-summary">
          <p className="callout-title">Resumo</p>
          <p className="callout-text">{summary}</p>
        </div>
      )}

      {/* sumário (TOC) */}
      {processed.toc.length > 0 && (
        <div className="mb-8 rounded-2xl border bg-white p-4">
          <div className="mb-2 text-sm font-semibold">Sumário</div>
          <ul className="text-sm leading-6">
            {processed.toc.map((i) => (
              <li
                key={i.id}
                className={i.level === 3 ? 'ml-4 list-disc' : 'font-medium'}
              >
                <a href={`#${i.id}`} className="text-sky-700 hover:underline">
                  {i.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* conteúdo + AD in-article fixo */}
      <article className="prose prose-slate max-w-none">
        {/* primeira parte */}
        <div dangerouslySetInnerHTML={{ __html: split.before || '' }} />

        {/* AD FIXO: in-article (sempre no mesmo ponto) */}
        <div className="my-6">
          <AdSlot slot="inarticle" />
        </div>

        {/* restante */}
        <div dangerouslySetInnerHTML={{ __html: split.after || '' }} />
      </article>

      {/* Tags (se existirem) */}
      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Fontes (se existirem) */}
      {sources.length > 0 && (
        <section className="mt-10 rounded-2xl border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Fontes</h2>
          <ul className="list-disc pl-5 text-sm">
            {sources.map((s, idx) => (
              <li key={idx}>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 hover:underline"
                  >
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

      {/* AD FIXO: final do artigo */}
      <div className="mt-8">
        <AdSlot slot="content_bottom" />
      </div>

      {/* relacionados */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold">Você pode gostar também</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((r) => {
              const rKind = (r.type || r.category || kind).toLowerCase()
              return (
                <Link
                  key={r.id}
                  href={`/posts/${encodeURIComponent(rKind)}/${encodeURIComponent(
                    r.slug
                  )}`}
                  className="group overflow-hidden rounded-2xl border bg-white transition hover:shadow-md"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image_url}
                        alt={r.title}
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-slate-400">
                        sem imagem
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <CategoryBadge value={r.type || r.category} className="mb-1" />
                    <div className="leading-snug font-medium">{r.title}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}