'use client'
import { useEffect, useState } from 'react'
import { createCategory, listCategories } from '@/app/dashboard/posts/actions'

export default function CategoryMultiSelect({
  value, onChange
}: { value: string[]; onChange: (ids: string[]) => void }) {

  const [opts, setOpts] = useState<{id:string; name:string; slug:string}[]>([])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    listCategories().then(setOpts).catch(console.error)
  }, [])

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter(v=>v!==id))
    else onChange([...value, id])
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    const slug = name.toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'')
    const id = await createCategory(name.trim(), slug)
    const updated = await listCategories()
    setOpts(updated)
    onChange([...(value||[]), id])
    setName('')
    setCreating(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {opts.map(o => (
          <button key={o.id}
            type="button"
            onClick={()=>toggle(o.id)}
            className={`px-2 py-1 rounded border text-sm ${value.includes(o.id) ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white'}`}>
            {o.name}
          </button>
        ))}
        {!creating ? (
          <button type="button" onClick={()=>setCreating(true)} className="px-2 py-1 rounded border text-sm bg-white">+ Nova</button>
        ) : (
          <div className="flex gap-2">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome da categoria" className="border rounded px-2 py-1 text-sm" />
            <button type="button" onClick={handleCreate} className="px-2 py-1 rounded bg-sky-600 text-white text-sm">Salvar</button>
            <button type="button" onClick={()=>{setCreating(false); setName('')}} className="px-2 py-1 rounded border text-sm bg-white">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}
