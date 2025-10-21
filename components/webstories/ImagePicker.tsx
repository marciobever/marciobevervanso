// components/webstories/ImagePicker.tsx
'use client'
import { useState } from 'react'

type StockImage = { src: string; thumb?: string; w?: number; h?: number; provider?: string }
type Props = {
  initial: string | null
  stock: StockImage[]      // já vem dos seus nós (pexels/pixabay/search)
  defaultPrompt?: string   // ex: do slide 1: cover_prompt
  onChange: (src: string, meta?: any) => void
}

export default function ImagePicker({ initial, stock, defaultPrompt, onChange }: Props) {
  const [active, setActive] = useState<'stock'|'ai'>('stock')
  const [prompt, setPrompt] = useState(defaultPrompt || '' )
  const [loading, setLoading] = useState(false)

  async function generate() {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          prompt,
          // travamos vertical:
          width: 720, height: 1280,
          // presets (ajuste no n8n/runware):
          style: 'photo-realistic', seed: Date.now()
        })
      })
      const data = await res.json()
      if (!data?.ok || !data?.url) throw new Error(data?.error || 'Falha ao gerar imagem')
      onChange(data.url, { source: 'ai', prompt })
      setActive('stock')
    } catch(e:any){ alert(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          className={`px-2 py-1 rounded ${active==='stock' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}
          onClick={()=>setActive('stock')}
        >Banco</button>
        <button
          className={`px-2 py-1 rounded ${active==='ai' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}
          onClick={()=>setActive('ai')}
        >Gerar com IA</button>
      </div>

      {active === 'stock' ? (
        <div className="grid grid-cols-3 gap-2 max-h-80 overflow-auto">
          {stock.map((im, i) => (
            <button
              key={i}
              onClick={()=>onChange(im.src, { source: im.provider || 'stock' })}
              className="group relative aspect-[9/16] overflow-hidden rounded"
              title={im.provider}
            >
              {/* sempre vertical: CSS crop */}
              <img src={im.src} className="h-full w-full object-cover" />
              <span className="absolute inset-0 ring-1 ring-black/10 group-hover:ring-sky-400" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={e=>setPrompt(e.target.value)}
            className="w-full rounded border p-2 text-sm"
            placeholder="Prompt em inglês, focado em foto realista, vertical"
            rows={3}
          />
          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="rounded bg-emerald-600 px-3 py-1.5 text-white disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Gerar agora'}
          </button>
        </div>
      )}
    </div>
  )
}