'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function PopupsPage() {
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState<any>({ active: true, show_on: 'all' })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  async function load(){ const { data } = await supabase.from('popups').select('*').order('created_at',{ascending:false}); setItems(data||[]) }
  useEffect(()=>{ load() }, [])
  async function save(){ if(form.id) await supabase.from('popups').update(form).eq('id',form.id); else await supabase.from('popups').insert(form); setForm({active:true, show_on:'all'}); load() }
  async function del(id:string){ if(!confirm('Excluir?'))return; await supabase.from('popups').delete().eq('id',id); load() }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Popups</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-3 border rounded bg-white space-y-2">
          <input className="border rounded px-2 py-1 w-full" placeholder="slug" value={form.slug||''} onChange={e=>setForm((f:any)=>({...f,slug:e.target.value}))}/>
          <input className="border rounded px-2 py-1 w-full" placeholder="Título" value={form.title||''} onChange={e=>setForm((f:any)=>({...f,title:e.target.value}))}/>
          <textarea className="border rounded px-2 py-1 w-full h-20" placeholder="Mensagem" value={form.body||''} onChange={e=>setForm((f:any)=>({...f,body:e.target.value}))}/>
          <input className="border rounded px-2 py-1 w-full" placeholder="URL imagem" value={form.image_url||''} onChange={e=>setForm((f:any)=>({...f,image_url:e.target.value}))}/>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1" placeholder="CTA label" value={form.cta_label||''} onChange={e=>setForm((f:any)=>({...f,cta_label:e.target.value}))}/>
            <input className="border rounded px-2 py-1" placeholder="CTA URL" value={form.cta_url||''} onChange={e=>setForm((f:any)=>({...f,cta_url:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="border rounded px-2 py-1" value={form.show_on||'all'} onChange={e=>setForm((f:any)=>({...f,show_on:e.target.value}))}>
              <option value="all">Todas páginas</option>
              <option value="home">Home</option>
              <option value="posts">Posts</option>
              <option value="cards">Cartões</option>
            </select>
            <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!form.active} onChange={e=>setForm((f:any)=>({...f,active:e.target.checked}))}/> Ativo</label>
          </div>
          <textarea className="border rounded px-2 py-1 w-full h-16" placeholder='Condições (JSON opcional)' value={form.conditions||''} onChange={e=>setForm((f:any)=>({...f,conditions:e.target.value}))}/>
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1.5 bg-sky-600 text-white rounded text-sm">Salvar</button>
            <button onClick={()=>setForm({active:true, show_on:'all'})} className="px-3 py-1.5 bg-slate-100 rounded text-sm">Limpar</button>
          </div>
        </div>
        <div className="space-y-2">
          {items.map(i=>(
            <div key={i.id} className="border rounded bg-white p-2 flex justify-between">
              <div>
                <div className="font-semibold">{i.title} ({i.slug})</div>
                <div className="text-xs text-slate-500">{i.show_on} · {i.active?'Ativo':'Inativo'}</div>
              </div>
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
