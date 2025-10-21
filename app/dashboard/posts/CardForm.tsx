// app/dashboard/posts/CardForm.tsx
'use client'

import { useState } from 'react'
import { upsertCard, deleteCard } from '@/app/dashboard/posts/actions'
import ImagePicker from '@/components/ImagePicker'

/** -----------------------------
 *  Tipos e constantes
 *  ----------------------------- */
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

const ALL_PLACEMENTS: { key: Placement; label: string }[] = [
  { key: 'home_trending', label: 'Home — Em Alta' },
  { key: 'home_featured', label: 'Home — Destaque' },
  { key: 'categoria_trending', label: 'Categoria — Em Alta' },
  { key: 'categoria_featured', label: 'Categoria — Destaque' },
  { key: 'cards_sidebar', label: 'Cards — Sidebar' },
  { key: 'quiz_feed', label: 'Feed de Quizzes' },
]

/** -----------------------------
 *  FlagsSelector (local, mínimo)
 *  ----------------------------- */
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
      <div className="flex items-center gap-3 mb-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-sky-600"
            checked={!!v.published}
            onChange={(e) => onChange({ ...v, published: e.target.checked })}
          />
          Publicado
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {ALL_PLACEMENTS.map((p) => (
          <label key={p.key} className="inline-flex items-center gap-2 text-sm bg-slate-50 border rounded px-2 py-1">
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

/** -----------------------------
 *  CardForm
 *  ----------------------------- */
export default function CardForm({ initialList }: { initialList: any[] }) {
  const [list, setList] = useState<any[]>(initialList || [])
  const [form, setForm] = useState<any>({ title: '', badge: '', meta: '', image_url: '' })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [flags, setFlags] = useState<Flags>({ published: false, placements: [] })

  const save = async () => {
    if (!form.title?.trim()) {
      alert('Informe o título')
      return
    }
    // Inclui flags no payload (ajuste conforme schema da tabela)
    await upsertCard({ ...form, flags })
    window.location.reload()
  }

  const edit = (c: any) => {
    setForm(c || {})
    // se o card já tiver flags, carrega
    if (c?.flags) {
      const nextFlags: Flags = {
        published: !!c.flags.published,
        placements: Array.isArray(c.flags.placements) ? c.flags.placements : [],
        badge: c.flags.badge ?? null,
      }
      setFlags(nextFlags)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir cartão?')) return
    await deleteCard(id)
    window.location.reload()
  }

  return (
    <div className="grid md:grid-cols-[1fr_.6fr] gap-4">
      {/* Formulário */}
      <div className="rounded bg-white border p-3">
        <div className="text-sm text-slate-500 mb-2">Cadastrar/Editar cartão</div>
        <div className="space-y-2">
          <input
            className="w-full border rounded px-2 py-1"
            placeholder="Título"
            value={form.title || ''}
            onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="border rounded px-2 py-1"
              placeholder="Badge (ex.: Cashback)"
              value={form.badge || ''}
              onChange={(e) => setForm((f: any) => ({ ...f, badge: e.target.value }))}
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Meta (ex.: 1,2% cashback)"
              value={form.meta || ''}
              onChange={(e) => setForm((f: any) => ({ ...f, meta: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              className="border rounded px-2 py-1"
              placeholder="URL da imagem"
              value={form.image_url || ''}
              onChange={(e) => setForm((f: any) => ({ ...f, image_url: e.target.value }))}
            />
            <button
              onClick={() => setPickerOpen(true)}
              className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm"
            >
              Buscar imagem
            </button>
          </div>

          {form.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} className="w-full rounded border" alt="" />
          ) : null}

          {/* Flags */}
          <FlagsSelector value={flags} onChange={setFlags} className="pt-2" />

          <div className="flex gap-2 pt-2">
            <button onClick={save} className="rounded bg-sky-600 text-white px-3 py-1.5">
              Salvar
            </button>
            {form.id ? (
              <button
                onClick={() => remove(form.id)}
                className="rounded bg-rose-600 text-white px-3 py-1.5"
              >
                Excluir
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded bg-white border p-3">
        <div className="text-sm text-slate-500 mb-2">Cartões</div>
        <ul className="space-y-2">
          {list.map((c: any) => (
            <li key={c.id} className="rounded border p-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image_url || 'https://picsum.photos/seed/card/120/80'}
                className="w-20 h-14 object-cover rounded border"
                alt=""
              />
              <div className="flex-1">
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs text-slate-500">
                  {(c.badge || '').trim()} {c.badge && c.meta ? '•' : ''} {(c.meta || '').trim()}
                </div>
              </div>
              <button onClick={() => edit(c)} className="rounded bg-slate-100 px-3 py-1.5 text-sm">
                Editar
              </button>
            </li>
          ))}
        </ul>
      </div>

      {pickerOpen && (
        <ImagePicker
          initialQuery={form.title || 'card'}
          onPick={(img) => {
            setForm((f: any) => ({ ...f, image_url: img.src }))
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
