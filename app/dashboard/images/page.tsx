'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import ImagePicker from '@/components/ImagePicker'

type Row = { id?: string; title?: string; page_url: string; source?: string }

const supa = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ImagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    const { data, error } = await supa()
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(400)
    if (!error) setRows((data as any) || [])
    setLoading(false)
    setSelected(new Set())
  }
  useEffect(()=>{ load() }, [])

  async function save() {
    if (!url) return alert('Escolha uma imagem')
    const { error } = await supa().from('images').insert({ title, page_url: url }) // <-- page_url
    if (error) return alert(error.message)
    setTitle(''); setUrl(''); await load()
  }

  function toggleOne(id?: string) {
    if (!id) return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allIds = useMemo(() => rows.map(r => r.id!).filter(Boolean), [rows])
  const allSelected = selected.size === allIds.length && allIds.length > 0

  function toggleAll() {
    setSelected(prev => {
      if (allSelected) return new Set()
      return new Set(allIds)
    })
  }

  async function delSelected() {
    if (selected.size === 0) return
    if (!confirm(`Excluir ${selected.size} imagem(ns)?`)) return
    const ids = Array.from(selected)
    const { error } = await supa().from('images').delete().in('id', ids)
    if (error) return alert(error.message)
    setRows(rows.filter(r => !r.id || !selected.has(r.id)))
    setSelected(new Set())
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Imagens</h1>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Título (opcional)</label>
            <input className="border rounded px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} />
            <label className="text-sm text-slate-600">URL da imagem</label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input className="border rounded px-3 py-2" value={url} onChange={e=>setUrl(e.target.value)} />
              <button onClick={()=>setPickerOpen(true)} className="px-3 py-2 rounded bg-slate-900 text-white">Buscar</button>
            </div>
          </div>
          <button onClick={save} className="h-[42px] px-4 rounded bg-sky-600 text-white">Salvar</button>
        </div>
        {url && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <img src={url} className="w-full aspect-[4/3] object-cover rounded border" />
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="text-sm text-slate-600">
            {rows.length} imagens • <strong>{selected.size}</strong> selecionada(s)
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="scale-110" checked={allSelected} onChange={toggleAll}/>
              Selecionar todos
            </label>
            <button
              onClick={delSelected}
              disabled={selected.size === 0}
              className={`text-sm px-3 py-1.5 rounded ${selected.size===0 ? 'bg-slate-100 text-slate-400' : 'bg-rose-600 text-white'}`}
            >
              Excluir selecionados
            </button>
            <button onClick={load} className="text-sm px-3 py-1.5 rounded border bg-white">Atualizar</button>
          </div>
        </div>

        {loading ? 'Carregando…' : (
          rows.length === 0 ? (
            <div className="text-slate-500 text-sm">Sem imagens cadastradas.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {rows.map(r => {
                const checked = r.id ? selected.has(r.id) : false
                return (
                  <div key={r.id || Math.random()} className={`border rounded-lg overflow-hidden bg-white ${checked ? 'ring-2 ring-sky-400' : ''}`}>
                    <div className="relative">
                      <img src={r.page_url} className="w-full aspect-[4/3] object-cover" /> {/* <-- page_url */}
                      <label className="absolute top-2 left-2 bg-white/90 rounded px-2 py-1 text-xs flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={()=>toggleOne(r.id)} />
                        Selecionar
                      </label>
                    </div>
                    <div className="p-2 text-xs line-clamp-1">{r.title || '—'}</div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {pickerOpen && (
        <ImagePicker
          initialQuery="finance"
          onPick={(img) => { setUrl(img.src); setPickerOpen(false) }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
