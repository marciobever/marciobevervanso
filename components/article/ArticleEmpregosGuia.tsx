'use client'

import Link from 'next/link'
import Image from 'next/image'
import CategoryBadge from '@/components/ui/CategoryBadge'
import AdSlot from '@/components/ads/AdSlot'

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

type Related = Pick<PostRow,'id'|'title'|'slug'|'type'|'category'|'image_url'|'created_at'>

function stripTags(html: string) { return (html || '').replace(/<[^>]+>/g, '') }
function slugify(s: string) {
  return stripTags(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-')
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

function splitHtmlAfterBlocks(html: string, n = 3) {
  if (!html) return { before: '', after: '' }
  const RE = /(<\/p>|<\/h1>|<\/h2>|<\/h3>|<\/h4>|<\/ul>|<\/ol>|<\/table>|<\/blockquote>|<hr\s*\/?>)/gi
  const parts = html.split(RE)
  let blocks = 0, cursor = 0
  for (let i = 0; i < parts.length; i += 2) {
    const content = parts[i] ?? ''; const closer = parts[i + 1] ?? ''
    cursor += (content + closer).length
    if (closer) { blocks++; if (blocks >= n) break }
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
  return d.toLocaleDateString('pt-BR',{ day:'2-digit', month:'short', year:'numeric' })
}

export default function ArticleEmpregosGuia({ post, related = [] }: { post: PostRow; related?: Related[] }) {
  const kind = (post.type || post.category || 'empregos').toLowerCase()

  const parsed = parseAndStripSummary(post.content_html || '')
  const summary = (typeof post.summary === 'string' && post.summary.trim()) ||
    (post.extras as any)?.summary || parsed.summary || (post.excerpt ? String(post.excerpt) : '')

  const processed = buildTocAndInjectIds(parsed.htmlWithoutSummary || '')
  const split = splitHtmlAfterBlocks(processed.html || '', 3)

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
            <figure className="relative mb-6 overflow-hidden rounded-2xl sm:mb-8">
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

          {/* Sumário */}
          {processed.toc.length > 0 && (
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-5 text-white shadow sm:mb-8">
              <h2 className="mb-3 text-base font-bold">Sumário</h2>
              <ul className="space-y-2 text-sm leading-6">
                {processed.toc.map((i) => (
                  <li key={i.id} className={i.level === 3 ? 'ml-4 list-disc marker:text-slate-300' : 'list-none'}>
                    <a href={`#${i.id}`} className="transition hover:text-sky-200 hover:underline">{i.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resumo */}
          {summary && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h2 className="mb-2 text-lg font-bold text-slate-800">Resumo</h2>
              <p className="leading-relaxed text-slate-700">{summary}</p>
            </div>
          )}

          {/* AD inline (in-article) — MOBILE ONLY, centralizado */}
          <div className="my-6 flex justify-center lg:hidden">
            <AdSlot
              slot="inarticle"
              className="w-full"
              style={{ minHeight: 250, maxWidth: 336 }}
            />
          </div>

          {/* Destaque */}
          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-800">
            Dica: ajuste seu currículo para cada vaga e priorize palavras-chave da descrição.
          </div>

          {/* CONTEÚDO */}
          <article className="post-content prose prose-slate max-w-none">
            <div dangerouslySetInnerHTML={{ __html: split.before || '' }} />
            <div dangerouslySetInnerHTML={{ __html: split.after || '' }} />
          </article>

          {/* AD extra antes do rodapé — MOBILE ONLY */}
          <div className="mt-10 lg:hidden flex justify-center">
            <AdSlot
              slot="content_bottom"
              className="w-full"
              style={{ minHeight: 250, maxWidth: 336 }}
            />
          </div>
        </div>

        {/* SIDEBAR (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">Patrocinado</div>
              <div className="mt-2">
                <AdSlot
                  slot="sidebar"
                  className="w-full"
                  style={{ minHeight: 250, maxWidth: 336 }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
