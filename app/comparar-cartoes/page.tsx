'use client'

'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SlidersHorizontal, Star, Crown, ArrowUpDown } from 'lucide-react'
import { Container, Glass, Pill } from '@/components/ui'
import CategoryBadge from '@/components/ui/CategoryBadge'

type CardRow = {
  id: string
  name: string
  brand?: string            // Visa/Master/elo
  segment?: string          // Nacional/Internacional
  tier?: string             // Gold/Platinum/Black
  annual_fee?: number       // anuidade total/ano
  min_income?: number       // renda mínima
  points_per_usd?: number   // ex: 1.5
  lounge?: string           // ex: "LoungeKey 2x/mês"
  insurance?: string        // ex: "VI seguro viagem"
  highlights?: string[]     // bullets curtos
  image_url?: string
  issuer?: string           // banco/emissor
}

const FALLBACK: CardRow[] = [
  {
    id: 'c1',
    name: 'Zero+ Internacional',
    brand: 'Visa',
    segment: 'Internacional',
    tier: 'Entry',
    annual_fee: 0,
    min_income: 1500,
    points_per_usd: 0,
    lounge: '—',
    insurance: 'Garantia estendida',
    highlights: ['Sem anuidade', 'Cashback em parceiros', 'App completo'],
    image_url: 'https://picsum.photos/seed/card1/800/500',
    issuer: 'Banco X',
  },
  {
    id: 'c2',
    name: 'AeroMax Platinum',
    brand: 'Mastercard',
    segment: 'Internacional',
    tier: 'Platinum',
    annual_fee: 348,
    min_income: 4000,
    points_per_usd: 1.8,
    lounge: '2 acessos/ano',
    insurance: 'Seguro viagem + proteção de compra',
    highlights: ['Acúmulo 1.8 pts/US$', 'Sala VIP 2x/ano'],
    image_url: 'https://picsum.photos/seed/card2/800/500',
    issuer: 'Banco Y',
  },
  {
    id: 'c3',
    name: 'Black Lounge Unlimited',
    brand: 'Visa',
    segment: 'Internacional',
    tier: 'Black',
    annual_fee: 1188,
    min_income: 15000,
    points_per_usd: 2.2,
    lounge: 'Ilimitado (LoungeKey)',
    insurance: 'Travel/auto/compra premium',
    highlights: ['2.2 pts/US$', 'Lounge ilimitado', 'Seguro viagem top'],
    image_url: 'https://picsum.photos/seed/card3/800/500',
    issuer: 'Banco Z',
  },
]

export default function CompareCardsPage() {
  const [all, setAll] = useState<CardRow[]>([])
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    noFee: false,
    lounge: false,
    minIncome: 0,
    brand: 'all',   // visa/master/elo/all
    tier: 'all',    // entry/gold/platinum/black/all
  })
  const [compare, setCompare] = useState<string[]>([]) // ids selecionados
  const [sort, setSort] = useState<'relevance'|'annual_fee'|'min_income'|'points'>('relevance')

  // load (Supabase opcional)
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    if (!url || !key) {
      setAll(FALLBACK)
      return
    }
    const supabase = createClient(url, key)
    ;(async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .limit(100)
      if (error || !data?.length) setAll(FALLBACK)
      else setAll(data as any)
    })()
  }, [])

  const list = useMemo(() => {
    let arr = [...(all.length ? all : FALLBACK)]
    if (query.trim()) {
      const q = query.toLowerCase()
      arr = arr.filter(c =>
        [c.name, c.issuer, c.brand, c.tier].join(' ').toLowerCase().includes(q)
      )
    }
    if (filters.noFee)    arr = arr.filter(c => (c.annual_fee ?? 0) === 0)
    if (filters.lounge)   arr = arr.filter(c => (c.lounge || '').toLowerCase() !== '—')
    if (filters.minIncome > 0) arr = arr.filter(c => (c.min_income ?? 0) <= filters.minIncome)
    if (filters.brand !== 'all') arr = arr.filter(c => (c.brand || '').toLowerCase() === filters.brand)
    if (filters.tier !== 'all')  arr = arr.filter(c => (c.tier || '').toLowerCase().includes(filters.tier))

    switch (sort) {
      case 'annual_fee':  arr.sort((a,b)=>(a.annual_fee??0)-(b.annual_fee??0)); break
      case 'min_income':  arr.sort((a,b)=>(a.min_income??1e9)-(b.min_income??1e9)); break
      case 'points':      arr.sort((a,b)=>(b.points_per_usd??0)-(a.points_per_usd??0)); break
    }
    return arr
  }, [all, query, filters, sort])

  const toggleCompare = (id: string) => {
    setCompare(prev => prev.includes(id) ? prev.filter(x => x!==id) : prev.length >= 3 ? prev : [...prev, id])
  }

  const compared = list.filter(c => compare.includes(c.id))

  return (
    <Container>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill><SlidersHorizontal className="h-3.5 w-3.5" /> Comparar cartões</Pill>
            <span className="text-slate-500 text-sm">Selecione até 3 cartões para comparar lado a lado</span>
          </div>
        </div>

        {/* Filtros */}
        <Glass className="p-4">
          <div className="grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-3">
            <input
              placeholder="Busque por nome, banco, bandeira…"
              className="rounded-lg border px-3 py-2"
              value={query}
              onChange={e=>setQuery(e.target.value)}
            />
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.noFee} onChange={e=>setFilters({...filters,noFee:e.target.checked})}/>
              <span className="text-sm">Sem anuidade</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={filters.lounge} onChange={e=>setFilters({...filters,lounge:e.target.checked})}/>
              <span className="text-sm">Sala VIP</span>
            </label>
            <select className="rounded-lg border px-3 py-2" value={filters.brand}
              onChange={e=>setFilters({...filters,brand:e.target.value})}>
              <option value="all">Bandeira</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="elo">Elo</option>
            </select>
            <select className="rounded-lg border px-3 py-2" value={filters.tier}
              onChange={e=>setFilters({...filters,tier:e.target.value})}>
              <option value="all">Categoria</option>
              <option value="entry">Básico</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="black">Black</option>
            </select>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
              onClick={()=>setSort(s=>s==='relevance'?'annual_fee':'relevance')}>
              <ArrowUpDown className="h-4 w-4" /> Ordenar: {sort==='relevance'?'Relevância':'Anuidade'}
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
              onClick={()=>setSort('min_income')}>
              <ArrowUpDown className="h-4 w-4" /> Renda mínima
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
              onClick={()=>setSort('points')}>
              <Star className="h-4 w-4" /> Pontos/US$
            </button>
          </div>
        </Glass>

        {/* Comparação fixa (se houver) */}
        {compared.length > 0 && (
          <Glass className="mt-4 p-4 overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[200px_repeat(3,1fr)] gap-3 text-sm">
                <div className="text-slate-500">Campo</div>
                {compared.map(c=>(
                  <div key={c.id} className="font-semibold">{c.name}</div>
                ))}
                <div className="text-slate-500">Anuidade</div>
                {compared.map(c=>(
                  <div key={c.id+'a'}>R$ {c.annual_fee?.toFixed(2) ?? '—'}</div>
                ))}
                <div className="text-slate-500">Renda mínima</div>
                {compared.map(c=>(
                  <div key={c.id+'i'}>R$ {c.min_income?.toLocaleString('pt-BR') ?? '—'}</div>
                ))}
                <div className="text-slate-500">Pts/US$</div>
                {compared.map(c=>(
                  <div key={c.id+'p'}>{c.points_per_usd ?? '—'}</div>
                ))}
                <div className="text-slate-500">Lounge/Seguros</div>
                {compared.map(c=>(
                  <div key={c.id+'l'}>{c.lounge || '—'} • {c.insurance || ''}</div>
                ))}
              </div>
            </div>
          </Glass>
        )}

        {/* Grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {list.map(card => (
            <Glass key={card.id} className="overflow-hidden p-0">
              <div className="relative aspect-[16/9]">
                <img src={card.image_url} alt={card.name} className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3">
                  <CategoryBadge value={card.tier || 'cartoes'} />
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs text-slate-500">{card.issuer} • {card.brand}</div>
                <h3 className="font-bold leading-snug">{card.name}</h3>
                <ul className="mt-2 text-sm text-slate-600 space-y-1">
                  <li><strong>Anuidade:</strong> {card.annual_fee ? `R$ ${card.annual_fee.toFixed(2)}` : '0'}</li>
                  <li><strong>Renda mín.:</strong> {card.min_income ? `R$ ${card.min_income.toLocaleString('pt-BR')}` : '—'}</li>
                  <li><strong>Pontos/US$:</strong> {card.points_per_usd ?? 0}</li>
                  {card.lounge && <li><strong>VIP:</strong> {card.lounge}</li>}
                </ul>

                {card.highlights?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {card.highlights.slice(0,3).map(h=>(
                      <span key={h} className="rounded-full border px-2 py-0.5 text-xs">{h}</span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={()=>toggleCompare(card.id)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold border ${compare.includes(card.id) ? 'bg-slate-900 text-white' : 'bg-white'}`}
                  >
                    {compare.includes(card.id) ? 'Remover da comparação' : 'Comparar'}
                  </button>
                  <a href={`/posts/cartoes/${encodeURIComponent(card.id)}`} className="text-sm text-sky-700 hover:underline">
                    Detalhes
                  </a>
                </div>
              </div>
            </Glass>
          ))}
        </div>
      </section>
    </Container>
  )
}
