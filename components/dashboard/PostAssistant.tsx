'use client'
import { useEffect, useState } from 'react'

type Props = {
  onInsertText?: (html: string) => void
  onPickImage?: (url: string) => void
}

export default function PostAssistant({ onInsertText, onPickImage }: Props) {
  const [tab, setTab] = useState<'search'|'images'|'generate'>('search')

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex gap-2 mb-3">
        <button onClick={()=>setTab('search')}
          className={`px-3 py-1.5 rounded-lg border text-sm ${tab==='search'?'bg-slate-900 text-white':'bg-white'}`}>
          Pesquisa (Perplexity)
        </button>
        <button onClick={()=>setTab('images')}
          className={`px-3 py-1.5 rounded-lg border text-sm ${tab==='images'?'bg-slate-900 text-white':'bg-white'}`}>
          Imagens (Pexels/Pixabay)
        </button>
        <button onClick={()=>setTab('generate')}
          className={`px-3 py-1.5 rounded-lg border text-sm ${tab==='generate'?'bg-slate-900 text-white':'bg-white'}`}>
          Gerar imagem (beta)
        </button>
      </div>

      {tab==='search' && <PerplexityPanel onInsertText={onInsertText}/>}
      {tab==='images' && <ImagesPanel onPickImage={onPickImage}/>}
      {tab==='generate' && <GenPanel onPickImage={onPickImage}/>}
    </div>
  )
}

function PerplexityPanel({ onInsertText }:{ onInsertText?: (html:string)=>void }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<string>('')

  async function run() {
    if (!q.trim()) return
    setLoading(true)
    setResp('')
    const r = await fetch('/api/tools/perplexity', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ prompt: q }) })
    const j = await r.json()
    setLoading(false)
    if (!j.ok) { setResp('Erro: '+j.error); return }
    setResp(j.html || j.text || '')
  }

  return (
    <div>
      <textarea className="w-full border rounded-xl px-3 py-2 text-sm h-28"
        placeholder="Descreva o que você quer resumir/estruturar…"
        value={q} onChange={e=>setQ(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button onClick={run} disabled={loading} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm">{loading?'Pesquisando…':'Pesquisar'}</button>
        {resp && onInsertText && (
          <button onClick={()=>onInsertText(resp)} className="px-3 py-2 rounded-lg border text-sm">Inserir no conteúdo</button>
        )}
      </div>
      {resp && (
        <div className="mt-3 p-3 rounded-xl border bg-slate-50 text-sm prose prose-sm max-w-none"
             dangerouslySetInnerHTML={{ __html: resp }} />
      )}
    </div>
  )
}

function ImagesPanel({ onPickImage }:{ onPickImage?: (url:string)=>void }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  async function search() {
    if(!q.trim()) return
    setLoading(true); setItems([])
    const [pex, pixa] = await Promise.all([
      fetch('/api/tools/pexels?q='+encodeURIComponent(q)).then(r=>r.json()).catch(()=>({ urls:[] })),
      fetch('/api/tools/pixabay?q='+encodeURIComponent(q)).then(r=>r.json()).catch(()=>({ urls:[] })),
    ])
    setItems([...(pex.urls||[]), ...(pixa.urls||[])])
    setLoading(false)
  }

  return (
    <div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded-xl px-3 py-2 text-sm" placeholder="Ex.: cartão de crédito, concurso, home office…"
               value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={search} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm">{loading?'Buscando…':'Buscar'}</button>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {items.map((u,i)=>(
          <button key={i} onClick={()=>onPickImage?.(u)} className="rounded-lg overflow-hidden border hover:ring">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="w-full h-24 object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

function GenPanel({ onPickImage }:{ onPickImage?: (url:string)=>void }) {
  const [p, setP] = useState('')
  const [img, setImg] = useState<string>('')

  async function run() {
    if(!p.trim()) return
    const r = await fetch('/api/tools/generate', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ prompt: p }) })
    const j = await r.json()
    if (j.ok && j.url) { setImg(j.url) }
  }

  return (
    <div>
      <textarea className="w-full border rounded-xl px-3 py-2 text-sm h-24"
        placeholder="Descreva a imagem (ex.: ilustração flat de cartões sobre fundo azul)…"
        value={p} onChange={e=>setP(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button onClick={run} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm">Gerar</button>
        {img && onPickImage && <button onClick={()=>onPickImage(img)} className="px-3 py-2 rounded-lg border text-sm">Usar no post</button>}
      </div>
      {img && <img src={img} alt="" className="mt-3 rounded-xl border w-full object-cover" />}
      <p className="text-[11px] text-slate-500 mt-2">Requer chave configurada; se indisponível, o endpoint retorna 501.</p>
    </div>
  )
}
