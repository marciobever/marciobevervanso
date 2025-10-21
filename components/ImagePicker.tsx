'use client'
import { useEffect, useState } from 'react'

type Img = { id: string; src: string; thumb?: string; source?: 'pexels'|'pixabay'|'runware' }
export default function ImagePicker({
  initialQuery = 'finance',
  onPick,
  onClose,
}: {
  initialQuery?: string
  onPick: (img: Img) => void
  onClose: () => void
}) {
  const [q, setQ] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Img[]>([])

async function search() {
  setLoading(true)
  try {
    const r = await fetch(`/api/images/search?q=${encodeURIComponent(q)}&limit=20`)
    const j = await r.json()

    // A rota retorna { results: [...] }
    const items = (j?.results || []).map((it: any, i: number) => ({
      id: it.id || String(i),
      src: it.url || it.src || it.thumb,
      thumb: it.thumb || it.url,
      source: it.source || 'pexels', // ou 'pixabay'
    }))

    setResults(items)
  } catch (e) {
    console.error(e)
    setResults([])
  } finally {
    setLoading(false)
  }
}


  useEffect(() => { search() }, []) // primeira busca

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white border shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') search() }}
            placeholder="Buscar imagens…"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button onClick={search} className="px-3 py-2 rounded-lg bg-slate-900 text-white">Buscar</button>
          <button onClick={onClose} className="px-3 py-2 rounded-lg border">Fechar</button>
        </div>

        {loading ? 'Carregando…' : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[60vh] overflow-auto">
            {results.map(img => (
              <button
                key={img.id}
                onClick={()=>onPick(img)}  // <-- só devolve pro caller. NÃO salva no banco.
                className="group border rounded-lg overflow-hidden bg-white"
                title={img.source || 'imagem'}
              >
                <img src={img.src} className="w-full aspect-[4/3] object-cover group-hover:opacity-90" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
