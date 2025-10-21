'use client'
import { useState } from 'react'
import { upsertCard, deleteCard } from '@/app/dashboard/posts/actions'
import ImagePicker from '@/components/ImagePicker'

export default function CardForm({ initialList }: { initialList: any[] }) {
  const [list, setList] = useState(initialList||[])
  const [form, setForm] = useState<any>({ title:'', badge:'', meta:'', image_url:'' })
  const [pickerOpen, setPickerOpen] = useState(false)

  const save = async () => {
    if (!form.title.trim()) return alert('Informe o título')
    await upsertCard(form)
    window.location.reload()
  }

  const edit = (c:any) => setForm(c)
  const remove = async (id:string) => {
    if (!confirm('Excluir cartão?')) return
    await deleteCard(id)
    window.location.reload()
  }

  return (
    <div className="grid md:grid-cols-[1fr_.6fr] gap-4">
      <div className="rounded bg-white border p-3">
        <div className="text-sm text-slate-500 mb-2">Cadastrar/Editar cartão</div>
        <div className="space-y-2">
          <input className="w-full border rounded px-2 py-1" placeholder="Título"
                 value={form.title} onChange={e=>setForm((f:any)=>({...f, title: e.target.value}))}/>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Badge (ex.: Cashback)"
                   value={form.badge||''} onChange={e=>setForm((f:any)=>({...f, badge: e.target.value}))}/>
            <input className="border rounded px-2 py-1" placeholder="Meta (ex.: 1,2% cashback)"
                   value={form.meta||''} onChange={e=>setForm((f:any)=>({...f, meta: e.target.value}))}/>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input className="border rounded px-2 py-1" placeholder="URL da imagem"
                   value={form.image_url||''} onChange={e=>setForm((f:any)=>({...f, image_url: e.target.value}))}/>
            <button onClick={()=>setPickerOpen(true)} className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm">
              Buscar imagem
            </button>
          </div>
          {form.image_url && (<img src={form.image_url} className="w-full rounded border" />)}
          <div className="flex gap-2 pt-2">
            <button onClick={save} className="rounded bg-sky-600 text-white px-3 py-1.5">Salvar</button>
            {form.id && <button onClick={()=>remove(form.id)} className="rounded bg-rose-600 text-white px-3 py-1.5">Excluir</button>}
          </div>
        </div>
      </div>

      <div className="rounded bg-white border p-3">
        <div className="text-sm text-slate-500 mb-2">Cartões</div>
        <ul className="space-y-2">
          {list.map((c:any)=>(
            <li key={c.id} className="rounded border p-2 flex items-center gap-3">
              <img src={c.image_url||'https://picsum.photos/seed/card/120/80'} className="w-20 h-14 object-cover rounded border" />
              <div className="flex-1">
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs text-slate-500">{c.badge} • {c.meta}</div>
              </div>
              <button onClick={()=>edit(c)} className="rounded bg-slate-100 px-3 py-1.5 text-sm">Editar</button>
            </li>
          ))}
        </ul>
      </div>

      {pickerOpen && (
        <ImagePicker
          initialQuery={form.title || 'card'}
          onPick={(img) => { setForm((f:any) => ({ ...f, image_url: img.src })); setPickerOpen(false)}}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
