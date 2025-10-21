'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import MainNav from '@/components/MainNav'
import MainNavMobile from '@/components/MainNavMobile'
import type {
  NavItem,
  FeaturedByKind,
  FeaturedItem,
  Kind,
} from '@/components/MainNav.types'

const fetcher = (u: string) => fetch(u).then(r => r.json())

function norm(s?: string | null) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}
function inferKind(label: string): Kind | undefined {
  const l = norm(label)
  if (l.startsWith('cart')) return 'cartoes'
  if (l.startsWith('benef')) return 'beneficios'
  if (l.startsWith('conc')) return 'concursos'
  if (l.startsWith('emp')) return 'empregos'
  return undefined
}
function uniqBy<T, K>(arr: T[], getKey: (x: T) => K): T[] {
  const seen = new Set<K>()
  const out: T[] = []
  for (const it of arr) {
    const k = getKey(it)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(it)
    }
  }
  return out
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  // trava o scroll do body quando o drawer abre
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // MENU (via /api/settings)
  const { data: settingsData } = useSWR('/api/settings', fetcher)
  const rawNav = (settingsData?.settings?.nav || []) as Array<{
    label: string; href?: string; kind?: string; indexHref?: string; megamenu?: boolean
  }>

  const coreKinds: Kind[] = ['cartoes', 'beneficios', 'concursos', 'empregos']
  const LABELS: Record<Kind, string> = {
    cartoes: 'Cartões',
    beneficios: 'Benefícios',
    concursos: 'Concursos',
    empregos: 'Empregos',
  }

  // tira “comparador de cartões” duplicado, etc
  const cleaned = rawNav.filter(n => {
    const lbl = norm(n.label)
    return !(lbl.includes('compar') && lbl.includes('cart')) && !(lbl.includes('compr') && lbl.includes('cart'))
  })

  const fromSettings: Partial<Record<Kind, NavItem>> = {}
  for (const n of cleaned) {
    const k = (n.kind as Kind) || inferKind(n.label)
    if (k && coreKinds.includes(k) && !fromSettings[k]) {
      fromSettings[k] = {
        label: n.label,
        kind: k,
        indexHref: n.indexHref || `/posts?type=${k}`,
        megamenu: n.megamenu ?? true,
      }
    }
  }

  const nav: NavItem[] = coreKinds.map((k) =>
    fromSettings[k] ?? { label: LABELS[k], kind: k, indexHref: `/posts?type=${k}`, megamenu: true }
  )

  // ===== Destaques (mescla TYPE + CATEGORY quando precisa) =====
  const { data: fCartoesType } = useSWR<{ items: FeaturedItem[] }>(
    '/api/dashboard/posts/list?type=cartoes&limit=16', fetcher
  )
  const { data: fBeneficiosType } = useSWR<{ items: FeaturedItem[] }>(
    '/api/dashboard/posts/list?type=beneficios&limit=16', fetcher
  )

  const { data: fEmpType } = useSWR<{ items: FeaturedItem[] }>(
    '/api/dashboard/posts/list?type=empregos&limit=24', fetcher
  )
  const { data: fEmpCat } = useSWR<{ items: FeaturedItem[] }>(
    '/api/dashboard/posts/list?category=empregos&limit=24', fetcher
  )
  const empMerged = uniqBy([...(fEmpType?.items || []), ...(fEmpCat?.items || [])], x => x.id)

  const { data: fConcType } = useSWR<{ items: FeaturedItem[] }>(
    '/api/dashboard/posts/list?type=concursos&limit=24', fetcher
  )
  const { data: fConcCat } = useSWR<{ items: FeaturedItem[] }>(
    '/api/dashboard/posts/list?category=concursos&limit=24', fetcher
  )
  const concMerged = uniqBy([...(fConcType?.items || []), ...(fConcCat?.items || [])], x => x.id)

  const featuredFlat: FeaturedByKind = {
    cartoes: fCartoesType?.items || [],
    beneficios: fBeneficiosType?.items || [],
    empregos: empMerged,
    concursos: concMerged,
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo (toca para home) */}
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="Mapa do Crédito" className="w-9 h-9 rounded-2xl" />
            <span className="text-xl font-extrabold text-slate-900">Mapa do Crédito</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:block">
            <MainNav nav={nav} featured={featuredFlat} />
          </div>

          {/* CTA (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/calculadoras"
              className="inline-flex rounded-full bg-slate-900 text-white text-base px-5 py-2.5 font-semibold shadow hover:bg-slate-800 hover:shadow-md transition"
            >
              Calculadoras
            </Link>
          </div>

          {/* Botão hamburguer (somente mobile) */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              aria-controls="main-nav-mobile"
              aria-expanded={mobileOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer/Overlay do menu mobile */}
      <MainNavMobile
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        nav={nav}
        featured={featuredFlat}
      />
    </>
  )
}
