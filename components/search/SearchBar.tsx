'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Hit = {
  id: string
  title: string
  slug: string
  kind?: string | null
  type?: string | null
  category?: string | null
  image_url?: string | null
  url_path?: string | null
}

/* ===== Helpers ===== */
function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
function toLooseRoot(s: string) {
  let r = s
  r = r.replace(/oes\b/g, 'ao') // cartoes -> cartao
  r = r.replace(/es\b/g, 'e')
  r = r.replace(/s\b/g, '')
  return r
}
function buildPostUrl(hit: Hit) {
  if (hit?.url_path) return hit.url_path
  const raw = hit?.kind || hit?.type || hit?.category || 'outros'
  const kind = normalize(raw)
  const slug = hit?.slug || hit?.id
  return `/posts/${encodeURIComponent(kind)}/${encodeURIComponent(slug)}`
}

const WORDS: Record<'cartoes'|'beneficios'|'empregos'|'concursos', string[]> = {
  cartoes: ['cartao','carton','cartoes','cartões','credito','crédito','visa','master','nubank','itau','santander','anuidade'],
  beneficios: ['beneficio','beneficios','benefício','bolsa','familia','auxilio','auxílio','gas','bpc','loas','cadunico','tarifa','social'],
  empregos: ['emprego','empregos','vaga','vagas','trabalho','curriculo','currículo','contratacao','contratação','remoto','clt','freela'],
  concursos: ['concurso','concursos','edital','inscricao','inscricoes','banca','prova','gabarito']
}
type Cat = keyof typeof WORDS

function guessCategory(q: string): Cat | null {
  const norm = toLooseRoot(normalize(q))
  if (!norm) return null

  const tokens = new Set(norm.split(' ').filter(Boolean))
  tokens.add(norm)

  // <— TIPAGEM FIXA (evita Record<...> em TSX)
  const score: { [K in Cat]: number } = { cartoes: 0, beneficios: 0, empregos: 0, concursos: 0 }

  ;(Object.keys(WORDS) as Cat[]).forEach((cat) => {
    for (const w of WORDS[cat]) {
      const root = toLooseRoot(normalize(w))
      if (!root) continue
      if (tokens.has(root)) score[cat] += 3
      if (norm.includes(root) || root.includes(norm)) score[cat] += 2
      if (root.length >= 4 && norm.startsWith(root.slice(0, 4))) score[cat] += 1
    }
  })

  const best = (Object.entries(score) as [Cat, number][])
    .sort((a, b) => b[1] - a[1])[0]
  return best && best[1] >= 2 ? best[0] : null
}

/* ===== Component ===== */
export default function SearchBar({ className = '' }: { className?: string }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const boxRef = useRef<HTMLDivElement>(null)
  const reqSeq = useRef(0)

  const debounced = useMemo(() => {
    let t: any
    return (fn: () => void, ms = 250) => { clearTimeout(t); t = setTimeout(fn, ms) }
  }, [])

  const suggested = useMemo<Cat | null>(() => guessCategory(q), [q])

  useEffect(() => {
    const term = q.trim()
    if (!term) { setHits([]); setOpen(false); return }
    setLoading(true)
    debounced(async () => {
      const my = ++reqSeq.current
      try {
        const url = `/api/search?q=${encodeURIComponent(term)}&limit=6&fuzzy=1`
        const r = await fetch(url, { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (reqSeq.current !== my) return
        const items: Hit[] = Array.isArray(j.items) ? j.items : []
        setHits(items)
        setOpen(true)
      } catch {
        if (reqSeq.current !== my) return
        setHits([])
        setOpen(!!suggested)
      } finally {
        if (reqSeq.current === my) setLoading(false)
      }
    }, 300)
  }, [q, debounced, suggested])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    if (hits.length > 0) {
      router.push(`/buscar?q=${encodeURIComponent(term)}`)
    } else if (suggested) {
      router.push(`/posts?type=${encodeURIComponent(suggested)}`)
    } else {
      router.push(`/buscar?q=${encodeURIComponent(term)}`)
    }
    setOpen(false)
  }

  function goto(hit: Hit) {
    router.push(buildPostUrl(hit))
    setOpen(false)
  }

  function gotoCat(cat: Cat) {
    router.push(`/posts?type=${encodeURIComponent(cat)}`)
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busque por cartão, vaga, concurso, guia..."
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Pesquisar termos"
        />
        <button
          type="submit"
          className="rounded-xl px-5 py-3 bg-sky-600 text-white hover:bg-sky-700"
          aria-label="Pesquisar"
        >
          Pesquisar
        </button>
      </form>

      {(open || loading) && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-xl">
          {loading && <div className="p-3 text-sm text-slate-500">Buscando…</div>}
          {!loading && (
            <ul>
              {hits.map((h) => {
                const chip = normalize(String(h.kind || h.type || h.category || 'post'))
                return (
                  <li key={h.id}>
                    <button
                      onClick={() => goto(h)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {h.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={h.image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{h.title}</div>
                        <div className="text-xs text-slate-500">{chip}</div>
                      </div>
                    </button>
                  </li>
                )
              })}

              {hits.length === 0 && suggested && (
                <li className="border-t">
                  <button
                    onClick={() => gotoCat(suggested)}
                    className="block w-full px-3 py-2 text-left text-sky-700 hover:bg-slate-50"
                  >
                    Ir para categoria “{suggested}”
                  </button>
                </li>
              )}

              {q.trim() && (
                <li className="border-t">
                  <button
                    onClick={(e) => onSubmit(e as any)}
                    className="block w-full px-3 py-2 text-left text-sky-700 hover:bg-slate-50"
                  >
                    Ver todos os resultados para “{q}”
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
