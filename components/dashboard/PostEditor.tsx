'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; name: string; slug?: string }
type Status = 'draft' | 'published'

type PostEditorProps = {
  initial: {
    id?: string
    title: string
    slug?: string
    badge?: string
    type?: 'concursos' | 'empregos' | 'cartoes' | 'guias' | 'outros'
    category?: string
    image_url?: string
    content?: string // HTML
    minutes?: number | null
    status?: string | null
    extras?: any
    gallery?: any[]
    sources?: any[]
    excerpt?: string | null
  }
}

/* ---------------------------------------------------- helpers */
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

function readingMinutesFromHTML(html?: string, fallback = 2) {
  if (!html) return fallback
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
  const words = text.split(' ').filter(Boolean).length
  return Math.max(fallback, Math.round(words / 200))
}

function normStatus(v?: string | null): Status {
  const s = (v || '').toLowerCase()
  return s === 'published' || s === 'publicado' ? 'published' : 'draft'
}

/* =======================================================
   EDITOR
   ======================================================= */
export default function PostEditor({ initial }: PostEditorProps) {
  const router = useRouter()
  const statusNorm: Status = normStatus(initial.status)

  // estilos utilitários (reutilizáveis)
  const glass = 'rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur shadow-sm'
  const btnGhost = 'rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-white/60 backdrop-blur'
  const chip = 'rounded-full border px-2 py-0.5 text-xs'

  const [saving, setSaving] = useState(false)
  const [loadingIA, setLoadingIA] = useState<null | 'research' | 'text' | 'image'>(null)
  const [slugLocked, setSlugLocked] = useState(true)

  const [form, setForm] = useState({
    id: initial.id ?? undefined,
    title: initial.title ?? '',
    slug: initial.slug ?? '',
    badge: initial.badge ?? '',
    type: (initial.type as any) || 'outros',
    category: initial.category || '',
    image_url: initial.image_url || '',
    content: initial.content || '',
    minutes: initial.minutes ?? null,
    status: statusNorm as Status,
    extras: initial.extras ?? {},
    gallery: initial.gallery ?? [],
    sources: initial.sources ?? [],
    excerpt: (initial.excerpt as string | undefined) || '',
  })

  // autoslug enquanto travado
  useEffect(() => {
    if (!slugLocked) return
    const s = slugify(form.title || '')
    setForm(f => ({ ...f, slug: s }))
  }, [form.title, slugLocked])

  const reading = useMemo(() => readingMinutesFromHTML(form.content), [form.content])

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  /* ---------- categorias (autocomplete) ---------- */
  const [categories, setCategories] = useState<Category[]>([])
  const [qCat, setQCat] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const catBoxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let off = false
    ;(async () => {
      try {
        const data = await fetchJSON<{ items: Category[] }>('/api/dashboard/categories/list')
        if (!off) setCategories(data.items || [])
      } catch {}
    })()
    return () => { off = true }
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!catBoxRef.current) return
      if (!catBoxRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const filteredCats = useMemo(() => {
    const q = qCat.trim().toLowerCase()
    if (!q) return categories.slice(0, 12)
    return categories
      .filter(c => c.name.toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q))
      .slice(0, 12)
  }, [qCat, categories])

  /* ---------- IA: Perplexity (usa /api/research com {q,type}) ---------- */
  async function handleResearch() {
    if (!form.title) return alert('Defina um título primeiro.')
    setLoadingIA('research')
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: form.title, type: form.type }),
      })
      const j = await res.json() as any
      if (!res.ok || j?.ok === false) throw new Error(j?.error || 'Falha na pesquisa')

      const data = j.data || j || {}
      const outline: string[] = data.bullets || data.outline || []
      const outlineHTML = outline.map(h => `<h2>${h}</h2>`).join('\n')
      const summaryHTML = data.summary ? `<p>${data.summary}</p>` : ''

      setForm(f => ({
        ...f,
        title: f.title || data.suggestedTitle || f.title,
        excerpt: f.excerpt || (data.summary || '').slice(0, 180),
        content: [f.content?.trim(), outlineHTML, summaryHTML].filter(Boolean).join('\n'),
      }))
    } catch (e) {
      console.error(e); alert('Falha ao pesquisar com Perplexity.')
    } finally { setLoadingIA(null) }
  }

  /* ---------- IA: Texto com Gemini (usa /api/posts/generate) ---------- */
  async function handleGenerateText() {
    if (!form.title) return alert('Defina um título primeiro.')
    setLoadingIA('text')
    try {
      const res = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, category: form.category || '' }),
      })
      const j = await res.json() as any
      if (!res.ok || j?.ok === false) throw new Error(j?.error || 'Falha ao gerar')

      const data = j.data || j || {}
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        excerpt: data.meta || data.excerpt || f.excerpt,
        content: [f.content?.trim(), (data.content || data.content_html || '').trim()].filter(Boolean).join('\n\n'),
      }))
    } catch (e) {
      console.error(e); alert('Falha ao gerar texto.')
    } finally { setLoadingIA(null) }
  }

  /* ---------- Imagem: busca POST /api/images/search ---------- */
  async function handleImage() {
    if (!form.title) return alert('Defina um título primeiro.')
    setLoadingIA('image')
    try {
      const res = await fetch('/api/images/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: form.title, size: 8 }),
      })
      const j = await res.json() as any
      if (res.ok && Array.isArray(j?.results) && j.results.length) {
        const first = j.results[0]
        const url = first.url || first.src || first.large || first.largeImageURL
        if (url) {
          setForm(f => ({ ...f, image_url: url }))
          return
        }
      }
      alert('Não encontrei imagem nas buscas.')
    } catch (e) {
      console.error(e); alert('Falha ao buscar imagem.')
    } finally { setLoadingIA(null) }
  }

  /* ---------- Salvar ---------- */
  type SaveResp = { ok: boolean; post?: { id?: string; slug?: string; type?: string } ; error?: string }

  async function handleSave(publish = false) {
    // validações mínimas
    if (!form.title?.trim()) return alert('Defina um título.')
    // gera slug se vazio
    const ensuredSlug = form.slug?.trim() || slugify(form.title)
    const ensuredType = (form.type || 'outros').toLowerCase()

    setSaving(true)
    try {
      const payload = {
        id: form.id ?? undefined,
        title: form.title.trim(),
        slug: ensuredSlug,
        badge: form.badge || null,
        type: ensuredType,
        category: form.category || null,
        image_url: form.image_url || null,
        content_html: form.content || null,
        minutes: form.minutes ?? reading,          // 👈 garante preenchimento
        // status coerente no client; a API ainda deve forçar se publish=true
        status: publish ? 'published' as Status : form.status,
        publish,                                   // 👈 chave importante para a API
        extras: form.extras ?? {},
        gallery: form.gallery ?? [],
        sources: form.sources ?? [],
        excerpt: form.excerpt || null,
      }

      const j = await fetchJSON<SaveResp>('/api/dashboard/posts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!j?.ok) throw new Error(j?.error || 'Falha ao salvar')

      // mantém estado local atualizado com possíveis correções vindas do backend
      setForm(f => ({
        ...f,
        id: j.post?.id || f.id,
        slug: j.post?.slug || ensuredSlug,
        type: (j.post?.type as any) || ensuredType,
        status: publish ? 'published' : f.status,
        minutes: f.minutes ?? reading,
      }))

      alert(publish ? 'Publicado!' : 'Post salvo!')
      router.refresh()
    } catch (e) {
      console.error(e); alert('Erro ao salvar post.')
    } finally { setSaving(false) }
  }

  /* ---------- atalhos ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ---------- URL canônica ---------- */
  const canonical = useMemo(() => {
    if (!form.slug) return ''
    const type = (form.type || 'outros').toLowerCase()
    return `/posts/${type}/${form.slug}`
  }, [form.type, form.slug])

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
      {/* COLUNA ESQUERDA */}
      <div className="space-y-6">
        {/* HERO: Título */}
        <section className={`${glass} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50/60 via-transparent to-indigo-50/60 pointer-events-none" />
          <label className="block text-xs font-semibold text-slate-600 mb-2 relative">Título</label>
          <input
            className="relative w-full rounded-2xl border border-slate-300/60 bg-white/70 backdrop-blur px-4 py-3 text-xl md:text-2xl font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Concursos Públicos 2025: Guia completo…"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className={chip}>{form.type || 'outros'}</span>
            {form.category && <span className={chip}>{form.category}</span>}
            {canonical && (
              <button
                type="button"
                className="ml-auto underline underline-offset-2 hover:text-slate-700"
                onClick={() => navigator.clipboard.writeText(canonical)}
                title="Copiar URL"
              >
                {canonical}
              </button>
            )}
          </div>
        </section>

        {/* Assistente IA */}
        <section className={`${glass} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Assistente de Criação</h2>
            <div className="text-xs text-slate-500">Leitura ~ <b>{reading} min</b></div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleResearch} disabled={!!loadingIA} className={btnGhost}>
              {loadingIA === 'research' ? 'Pesquisando…' : '🔎 Perplexity'}
            </button>
            <button onClick={handleGenerateText} disabled={!!loadingIA} className={btnGhost}>
              {loadingIA === 'text' ? 'Gerando…' : '✍️ Gemini'}
            </button>
            <button onClick={handleImage} disabled={!!loadingIA} className={btnGhost}>
              {loadingIA === 'image' ? 'Buscando…' : '🖼️ Imagem'}
            </button>
          </div>
        </section>

        {/* Metadados */}
        <section className={`${glass} p-4 space-y-4`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <select
                className="w-full rounded-xl border px-3 py-2.5 bg-white/70 backdrop-blur"
                value={form.type}
                onChange={e => set('type', e.target.value as any)}
              >
                <option value="concursos">Concursos</option>
                <option value="empregos">Empregos</option>
                <option value="cartoes">Cartões</option>
                <option value="guias">Guias</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div ref={catBoxRef} className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border px-3 py-2.5 bg-white/70 backdrop-blur"
                  placeholder="Digite para procurar ou defina livre"
                  value={form.category}
                  onFocus={() => setCatOpen(true)}
                  onChange={e => { set('category', e.target.value); setQCat(e.target.value); setCatOpen(true) }}
                />
                {catOpen && filteredCats.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-white shadow">
                    {filteredCats.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { set('category', c.name); setQCat(''); setCatOpen(false) }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Slug</label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-xl border px-3 py-2.5 bg-white/70 backdrop-blur"
                  placeholder="auto a partir do título"
                  value={form.slug}
                  onChange={e => set('slug', e.target.value)}
                  disabled={slugLocked}
                />
                <button
                  type="button"
                  onClick={() => setSlugLocked(s => !s)}
                  className={btnGhost}
                  title={slugLocked ? 'Destravar edição do slug' : 'Travar slug automático'}
                >
                  {slugLocked ? '🔒' : '🔓'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Badge (opcional)</label>
              <input
                className="w-full rounded-xl border px-3 py-2.5 bg-white/70 backdrop-blur"
                placeholder="Ex.: Em alta"
                value={form.badge}
                onChange={e => set('badge', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Imagem + Excerpt + Conteúdo */}
        <section className={`${glass} p-4 space-y-4`}>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Imagem destacada (URL)</label>
            <input
              className="w-full rounded-xl border px-3 py-2.5 bg-white/70 backdrop-blur"
              placeholder="URL da imagem (1200x700+)"
              value={form.image_url}
              onChange={e => set('image_url', e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1">Resumo / Excerpt</label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border px-3 py-2 bg-white/70 backdrop-blur"
              placeholder="Resumo curto para listagens e OpenGraph (ideal 140–180 caracteres)"
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value)}
            />
            <div className="absolute right-2 bottom-2 text-[11px] text-slate-400">{form.excerpt.length}/220</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Conteúdo (HTML)</label>
            <textarea
              className="w-full min-h-[440px] rounded-xl border px-3 py-2 font-mono bg-white/70 backdrop-blur"
              placeholder="Cole aqui HTML (pode ser do Markdown convertido). Use H2/H3 para popular o Sumário."
              value={form.content}
              onChange={e => set('content', e.target.value)}
            />
          </div>
        </section>
      </div>

      {/* COLUNA DIREITA */}
      <aside className="space-y-6">
        {/* Ações */}
        <section className={`${glass} p-4 sticky top-20`}>
          <div className="grid gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                className="w-full rounded-xl border px-3 py-2.5 bg-white/70 backdrop-blur"
                value={form.status}
                onChange={e => set('status', e.target.value as Status)}
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
              <div className="mt-1 text-[11px] text-slate-500">Leitura ~ <b>{reading} min</b></div>
            </div>

            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 hover:opacity-95 disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Salvar rascunho'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full rounded-xl bg-sky-600 text-white py-2.5 hover:opacity-95 disabled:opacity-60"
            >
              {saving ? 'Publicando…' : 'Salvar e publicar'}
            </button>
          </div>
        </section>

        {/* Preview */}
        <section className={`${glass} overflow-hidden`}>
          <div className="px-4 pt-4 pb-2 border-b border-slate-200/60">
            <div className="text-xs uppercase tracking-wide text-slate-500">Preview</div>
          </div>
          <div className="p-4 space-y-3">
            {form.title && <h1 className="text-xl font-extrabold leading-tight">{form.title}</h1>}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {form.type && <span className={chip}>{form.type}</span>}
              {form.category && <span className={chip}>{form.category}</span>}
              <span className="ml-auto">{reading} min</span>
            </div>

            {form.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-200/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image_url} alt="" className="w-full h-40 object-cover" />
              </div>
            )}

            {form.excerpt && <p className="text-slate-700 text-sm">{form.excerpt}</p>}

            {form.content ? (
              <article className="post-content max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
            ) : (
              <div className="text-xs text-slate-400">O conteúdo aparecerá aqui…</div>
            )}
          </div>
        </section>
      </aside>
    </div>
  )
}
