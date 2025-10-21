// components/dashboard/PostForm.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

/* ===========================
   Tipos
   =========================== */
type Category = { id: string; name: string; slug?: string }

type Placement =
  | 'home_trending'
  | 'home_featured'
  | 'categoria_trending'
  | 'categoria_featured'
  | 'cards_sidebar'
  | 'quiz_feed'

type Flags = {
  published?: boolean
  placements?: Placement[]
  badge?: string | null
  [k: string]: any
}

type PostDraft = {
  id?: string
  title: string
  slug?: string
  type: 'concursos' | 'empregos' | 'cartoes' | 'guias' | 'outros'
  category?: string
  image_url?: string
  excerpt?: string
  content_html?: string
  status?: 'draft' | 'published'
  flags?: Flags
}

/* ===========================
   FlagsSelector
   =========================== */
const ALL_PLACEMENTS: { key: Placement; label: string }[] = [
  { key: 'home_trending', label: 'Home — Em Alta' },
  { key: 'home_featured', label: 'Home — Destaque' },
  { key: 'categoria_trending', label: 'Categoria — Em Alta' },
  { key: 'categoria_featured', label: 'Categoria — Destaque' },
  { key: 'cards_sidebar', label: 'Cards — Sidebar' },
  { key: 'quiz_feed', label: 'Feed de Quizzes' },
]

function FlagsSelector({
  value,
  onChange,
  className,
  title = 'Flags/Posicionamento',
}: {
  value?: Flags
  onChange: (next: Flags) => void
  className?: string
  title?: string
}) {
  const v: Flags = {
    published: value?.published ?? false,
    placements: value?.placements ?? [],
    badge: value?.badge ?? null,
  }

  const togglePlacement = (p: Placement) => {
    const curr = new Set(v.placements)
    if (curr.has(p)) curr.delete(p)
    else curr.add(p)
    onChange({ ...v, placements: Array.from(curr) })
  }

  return (
    <div className={className}>
      <div className="text-sm font-semibold text-slate-700 mb-2">{title}</div>

      <label className="inline-flex items-center gap-2 text-sm mb-2">
        <input
          type="checkbox"
          className="accent-sky-600"
          checked={!!v.published}
          onChange={(e) => onChange({ ...v, published: e.target.checked })}
        />
        Publicado
      </label>

      <div className="grid sm:grid-cols-2 gap-2">
        {ALL_PLACEMENTS.map((p) => (
          <label
            key={p.key}
            className="inline-flex items-center gap-2 text-sm bg-slate-50 border rounded px-2 py-1"
          >
            <input
              type="checkbox"
              className="accent-sky-600"
              checked={v.placements?.includes(p.key) ?? false}
              onChange={() => togglePlacement(p.key)}
            />
            {p.label}
          </label>
        ))}
      </div>
    </div>
  )
}

/* ===========================
   Utils
   =========================== */
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/* ===========================
   Componente principal
   =========================== */
export default function PostForm({ initial }: { initial?: Partial<PostDraft> }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [qCat, setQCat] = useState('')

  const [post, setPost] = useState<PostDraft>({
    title: initial?.title || '',
    slug: initial?.slug || '',
    type: (initial?.type as any) || 'outros',
    category: initial?.category || '',
    image_url: initial?.image_url || '',
    excerpt: initial?.excerpt || '',
    content_html: initial?.content_html || '',
    status: (initial?.status as any) || 'draft',
    flags: initial?.flags || { published: false, placements: [] },
  })

  const [flags, setFlags] = useState<Flags>(
    post.flags || { published: false, placements: [] }
  )

  // carregar categorias existentes
  useEffect(() => {
    let abort = false
    const run = async () => {
      try {
        const data = await fetchJSON<{ items: Category[] }>(
          '/api/dashboard/categories/list'
        )
        if (!abort) setCategories(data.items || [])
      } catch {
        /* silencioso */
      }
    }
    run()
    return () => {
      abort = true
    }
  }, [])

  const filteredCats = useMemo(() => {
    const q = qCat.trim().toLowerCase()
    if (!q) return categories.slice(0, 20)
    return categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.slug || '').toLowerCase().includes(q)
      )
      .slice(0, 20)
  }, [qCat, categories])

  function set<K extends keyof PostDraft>(key: K, val: PostDraft[K]) {
    setPost((p) => ({ ...p, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...post,
        flags,
      }
      await fetchJSON('/api/dashboard/posts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      alert('Post salvo!')
      router.push('/dashboard/posts/manage')
    } catch (err: any) {
      console.error(err)
      alert('Erro ao salvar post.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      {/* ESQUERDA */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="grid gap-3">
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Título"
            value={post.title}
            onChange={(e) => set('title', e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="rounded-xl border px-3 py-2"
              placeholder="Slug (opcional)"
              value={post.slug || ''}
              onChange={(e) => set('slug', e.target.value)}
            />
            <select
              className="rounded-xl border px-3 py-2"
              value={post.type}
              onChange={(e) => set('type', e.target.value as any)}
            >
              <option value="concursos">Concursos</option>
              <option value="empregos">Empregos</option>
              <option value="cartoes">Cartões</option>
              <option value="guias">Guias</option>
              <option value="outros">Outros</option>
            </select>

            {/* Categoria */}
            <div className="relative">
              <input
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Categoria"
                value={post.category || ''}
                onChange={(e) => {
                  set('category', e.target.value)
                  setQCat(e.target.value)
                }}
              />
              {filteredCats.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-white shadow">
                  {filteredCats.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        set('category', c.name)
                        setQCat('')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="URL da imagem (1200x700+)"
            value={post.image_url || ''}
            onChange={(e) => set('image_url', e.target.value)}
          />

          <textarea
            className="w-full min-h-[80px] rounded-xl border px-3 py-2"
            placeholder="Resumo / Excerpt"
            value={post.excerpt || ''}
            onChange={(e) => set('excerpt', e.target.value)}
          />

          <textarea
            className="w-full min-h-[320px] rounded-xl border px-3 py-2 font-mono"
            placeholder="Conteúdo em HTML"
            value={post.content_html || ''}
            onChange={(e) => set('content_html', e.target.value)}
          />
        </div>
      </div>

      {/* DIREITA */}
      <div className="rounded-2xl border bg-white p-4 h-fit">
        <div className="grid gap-3">
          <FlagsSelector
            value={flags}
            onChange={(next) => {
              setFlags(next)
              setPost((p) => ({ ...p, flags: next }))
            }}
          />

          <select
            className="rounded-xl border px-3 py-2"
            value={post.status || 'draft'}
            onChange={(e) => set('status', e.target.value as any)}
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 hover:opacity-95 disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
