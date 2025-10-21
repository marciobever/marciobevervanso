'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function GenericPage() {
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const table = typeof window !== 'undefined' && location.pathname.includes('/cards') ? 'cards' : 'guides'
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async function load(){ const { data } = await supabase.from(table).select('*').order('created_at',{ascending:false}); setItems(data||[]) }
  useEffect(()=>{ load() }, [])

  async function save(){ if(form.id) await supabase.from(table).update(form).eq('id',form.id); else await supabase.from(table).insert(form); setForm({}); load() }
  async function del(id:string){ if(!confirm('Excluir?'))return; await supabase.from(table).delete().eq('id',id); load() }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{table==='cards'?'Cartões':'Guias'}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 border rounded bg-white space-y-2">
          <input className="border rounded px-2 py-1 w-full" placeholder="Título" value={form.title||''} onChange={e=>setForm((f:any)=>({...f,title:e.target.value}))}/>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Categoria" value={form.category||''} onChange={e=>setForm((f:any)=>({...f,category:e.target.value}))}/>
            <input className="border rounded px-2 py-1" placeholder="Badge" value={form.badge||''} onChange={e=>setForm((f:any)=>({...f,badge:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input className="border rounded px-2 py-1" placeholder="URL imagem" value={form.image_url||''} onChange={e=>setForm((f:any)=>({...f,image_url:e.target.value}))}/>
            <button onClick={async()=>{ const r=await fetch(`/api/images/search?q=${encodeURIComponent(form.title||form.category||table)}&limit=1`); const j=await r.json(); setForm((f:any)=>({...f,image_url:j?.images?.[0]?.src||f.image_url})) }} className="px-3 py-1.5 bg-slate-900 text-white rounded text-sm">Imagem</button>
          </div>
          <textarea className="border rounded px-2 py-1 w-full h-24" placeholder="Conteúdo" value={form.content||''} onChange={e=>setForm((f:any)=>({...f,content:e.target.value}))}/>
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1.5 bg-sky-600 text-white rounded text-sm">Salvar</button>
            <button onClick={()=>setForm({})} className="px-3 py-1.5 bg-slate-100 rounded text-sm">Limpar</button>
          </div>
        </div>
        <div className="space-y-2">
          {items.map(i=>(
            <div key={i.id} className="border rounded bg-white p-2 grid grid-cols-[64px_1fr_auto] gap-2 items-center">
              <img src={i.image_url||'https://picsum.photos/seed/g/128/80'} className="w-16 h-16 object-cover rounded border"/>
              <div><div className="font-semibold">{i.title}</div><div className="text-xs text-slate-500">{i.category} · {i.badge}</div></div>
              <div className="flex gap-2">
                <button onClick={()=>setForm(i)} className="px-2 py-1 bg-slate-100 rounded text-xs">Editar</button>
                <button onClick={()=>del(i.id)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
