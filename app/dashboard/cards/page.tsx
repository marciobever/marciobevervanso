'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type CardRow = {
  id?: string
  title?: string
  badge?: string
  meta?: string
  image_url?: string
  created_at?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CardsPage() {
  const [items, setItems] = useState<CardRow[]>([])
  const [form, setForm] = useState<CardRow>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function save() {
    if (!form.title?.trim()) return alert('Informe o título do cartão')
    if (form.id)
      await supabase.from('cards').update(form).eq('id', form.id)
    else
      await supabase.from('cards').insert(form)

    setForm({})
    load()
  }

  async function del(id?: string) {
    if (!id) return
    if (!confirm('Excluir cartão?')) return
    await supabase.from('cards').delete().eq('id', id)
    load()
  }

  async function pickImage() {
    const q = (form.title || 'cartão').trim()
    const r = await fetch(`/api/images/search?q=${encodeURIComponent(q)}&limit=1`)
    const j = await r.json()
    const url = j?.images?.[0]?.src
    if (!url) return alert('Nenhuma imagem encontrada.')
    setForm((f: any) => ({ ...f, image_url: url }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cartões</h1>
        <button onClick={()=>setForm({})} className="rounded bg-slate-900 text-white px-3 py-1.5">Novo cartão</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* FORM */}
        <div className="p-3 border rounded bg-white space-y-2">
          <input
            className="border rounded px-2 py-1 w-full"
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
              placeholder="Meta (ex.: 1,2% cashback / Renda mínima etc.)"
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
              onClick={pickImage}
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-sm"
            >
              Buscar
            </button>
          </div>

          {form.image_url && (
            <img src={form.image_url} className="w-full rounded border" alt="cartão" />
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={save} className="px-3 py-1.5 bg-sky-600 text-white rounded text-sm">
              Salvar
            </button>
            <button onClick={() => setForm({})} className="px-3 py-1.5 bg-slate-100 rounded text-sm">
              Limpar
            </button>
            {form.id && (
              <button onClick={() => del(form.id)} className="px-3 py-1.5 bg-rose-600 text-white rounded text-sm">
                Excluir
              </button>
            )}
          </div>
        </div>

        {/* LISTA */}
        <div className="space-y-2">
          {loading ? (
            'Carregando…'
          ) : items.length === 0 ? (
            <div className="text-sm text-slate-500">Nenhum cartão cadastrado.</div>
          ) : (
            items.map((i) => (
              <div
                key={i.id}
                className="border rounded bg-white p-2 grid grid-cols-[64px_1fr_auto] gap-2 items-center"
              >
                <img
                  src={i.image_url || 'https://picsum.photos/seed/card/128/80'}
                  className="w-16 h-16 object-cover rounded border"
                  alt=""
                />
                <div>
                  <div className="font-semibold">{i.title}</div>
                  <div className="text-xs text-slate-500">
                    {i.badge} {i.meta ? `• ${i.meta}` : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm(i)}
                    className="px-2 py-1 bg-slate-100 rounded text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => del(i.id)}
                    className="px-2 py-1 bg-rose-600 text-white rounded text-xs"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
