// components/MainNav.tsx
'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

export type Kind = 'cartoes' | 'beneficios' | 'concursos' | 'empregos'
export type NavItem = {
  label: string
  kind?: Kind
  indexHref?: string
  megamenu?: boolean
}
export type FeaturedItem = {
  id: string
  title: string
  slug?: string | null
  image_url?: string | null
  type?: string | null
  category?: string | null
  extras?: any
  flags?: any
  groups?: any[]
}
export type FeaturedByKind = Partial<Record<Kind, FeaturedItem[]>>

function norm(s?: string | null) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}
function uniqBy<T, K>(arr: T[], key: (x: T) => K) {
  const seen = new Set<K>()
  const out: T[] = []
  for (const it of arr) {
    const k = key(it)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(it)
    }
  }
  return out
}

/* ===== URL helpers ===== */
function canonicalKind(p: { category?: string | null; type?: string | null }) {
  const cat = norm(p.category)
  const typ = norm(p.type)
  const primary = ['cartoes', 'beneficios', 'concursos', 'empregos']
  if (primary.includes(cat)) return cat as Kind
  if (primary.includes(typ)) return typ as Kind
  if ((typ === 'guia' || typ === 'lista') && cat) return cat as Kind
  return (cat || typ || 'posts') as Kind
}
function buildIndexHref(kind?: Kind) {
  return kind ? `/posts?type=${kind}` : '#'
}
function buildPostHref(p: FeaturedItem, fallbackKind: Kind) {
  const k = canonicalKind(p) || fallbackKind
  const slugOrId = p.slug || p.id
  return `/posts/${encodeURIComponent(k)}/${encodeURIComponent(String(slugOrId))}`
}

/* ===== Heurísticas de classificação ===== */
function isGuia(it: FeaturedItem) {
  const t = norm(it.type)
  const s1 = norm(it.extras?.subtype)
  const s2 = norm(it.flags?.subtype)
  return t === 'guia' || s1 === 'guia' || s2 === 'guia'
}
function isLista(it: FeaturedItem) {
  const t = norm(it.type)
  const s1 = norm(it.extras?.subtype)
  const s2 = norm(it.flags?.subtype)
  const hasGroups = Array.isArray(it.groups) && it.groups.length > 0
  return t === 'lista' || s1 === 'lista' || s2 === 'lista' || hasGroups
}

/** Mantém só itens do próprio kind (category == kind OU type == kind) */
function filterByKind(items: FeaturedItem[], kind: Kind) {
  return items.filter((it) => {
    const cat = norm(it.category)
    const typ = norm(it.type)
    return cat === kind || typ === kind
  })
}

/** Separa em duas colunas (guia/lista) com fallbacks, já assumindo itens filtrados por kind */
function classifyTwoCol(items: FeaturedItem[]) {
  const flat = uniqBy(items, (x) => x.id)
  let guia = flat.filter(isGuia)
  let lista = flat.filter((x) => !isGuia(x) || isLista(x))

  if (guia.length === 0 && lista.length === 0) {
    const a = flat.slice(0, 4)
    const b = flat.slice(4, 8)
    guia = a
    lista = b
  } else if (guia.length === 0 || lista.length === 0) {
    const base = guia.length > 0 ? guia : lista
    const left = base.slice(0, 4)
    const right = flat.filter((x) => !left.includes(x)).slice(0, 4)
    if (guia.length > 0) {
      guia = left
      lista = right
    } else {
      lista = left
      guia = right
    }
  } else {
    guia = guia.slice(0, 5)
    lista = lista.slice(0, 5)
  }

  return { guia, lista }
}

export default function MainNav({
  nav,
  featured,
  enableMega = true,
}: {
  nav: NavItem[]
  featured?: FeaturedByKind
  enableMega?: boolean
}) {
  const [openKey, setOpenKey] = useState<Kind | null>(null)

  const items = useMemo(() => {
    return (nav || []).map((n) => {
      const indexHref = n.indexHref || buildIndexHref(n.kind)
      const allowMega = enableMega && !!n.kind && (n.megamenu ?? true)
      return { ...n, indexHref, allowMega }
    })
  }, [nav, enableMega])

  return (
    <nav className="hidden md:flex items-center gap-6">
      {items.map((n, i) => {
        const key = `${n.label}-${i}`
        const kind = n.kind
        const raw: FeaturedItem[] = (kind && featured?.[kind]) || []
        // 🔒 filtra para o próprio kind
        const flatKind = kind ? filterByKind(raw, kind) : []
        const hasFlat = flatKind.length > 0
        const isTwoCol = kind === 'empregos' || kind === 'concursos'
        const showMega = !!(n.allowMega && hasFlat)

        const two = isTwoCol ? classifyTwoCol(flatKind) : null
        const mono = !isTwoCol ? flatKind.slice(0, 8) : []

        return (
          <div
            key={key}
            className="relative group"
            onMouseEnter={() => showMega && setOpenKey(kind!)}
            onMouseLeave={() => showMega && setOpenKey((k) => (k === kind ? null : k))}
          >
            <Link
              href={n.indexHref || '#'}
              className="px-3 py-2 rounded-full hover:bg-slate-100 text-slate-800 font-medium"
              aria-haspopup={showMega ? 'menu' : undefined}
              aria-expanded={showMega && openKey === kind ? true : undefined}
            >
              {n.label}
            </Link>

            {showMega && openKey === kind && (
              <div
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-[760px] rounded-2xl border bg-white shadow-lg p-4 z-40
                           opacity-0 pointer-events-none translate-y-1
                           group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition"
                role="menu"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm text-slate-500">Mais recentes</div>
                  <Link href={n.indexHref || '#'} className="text-sm text-slate-600 hover:text-slate-900 hover:underline">
                    Ver todos
                  </Link>
                </div>

                {isTwoCol ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Dicas (Guia)</div>
                      <div className="space-y-3">
                        {two!.guia.map((it) => (
                          <MenuCard key={it.id} fallbackKind={kind!} item={it} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">
                        {kind === 'empregos' ? 'Vagas (Lista)' : 'Editais (Lista)'}
                      </div>
                      <div className="space-y-3">
                        {two!.lista.map((it) => (
                          <MenuCard key={it.id} fallbackKind={kind!} item={it} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {mono.map((it) => (
                      <MenuCard key={it.id} fallbackKind={kind!} item={it} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/* ===== Card do item do mega ===== */
function MenuCard({ fallbackKind, item }: { fallbackKind: Kind; item: FeaturedItem }) {
  const href = buildPostHref(item, fallbackKind)
  return (
    <Link
      href={href}
      className="group/it flex gap-3 rounded-xl border bg-white overflow-hidden
                 hover:shadow-md hover:-translate-y-0.5 transition"
      role="menuitem"
    >
      <div className="m-2 h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover/it:scale-[1.04]"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="flex items-center pr-3">
        <div className="line-clamp-2 text-sm text-slate-800">{item.title}</div>
      </div>
    </Link>
  )
}
