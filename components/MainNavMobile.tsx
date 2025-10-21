'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type {
  NavItem,
  FeaturedByKind,
  FeaturedItem,
  Kind,
} from '@/components/MainNav.types'

type Props = {
  open: boolean
  onClose: () => void
  nav: NavItem[]
  featured?: FeaturedByKind
}

function norm(s?: string | null) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function canonicalKind(p: { category?: string | null; type?: string | null }) {
  const cat = norm((p as any).category)
  const typ = norm(p.type)
  const primary = ['cartoes', 'beneficios', 'concursos', 'empregos']
  if (primary.includes(cat)) return cat
  if (primary.includes(typ)) return typ
  if ((typ === 'guia' || typ === 'lista') && cat) return cat
  return 'posts'
}

function buildPostHref(p: FeaturedItem, fallbackKind: Kind) {
  const guess = canonicalKind(p)
  const k: Kind =
    guess === 'cartoes' || guess === 'beneficios' || guess === 'concursos' || guess === 'empregos'
      ? (guess as Kind)
      : fallbackKind
  const slugOrId = p.slug || p.id
  return `/posts/${encodeURIComponent(k)}/${encodeURIComponent(String(slugOrId))}`
}

export default function MainNavMobile({ open, onClose, nav, featured }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // ESC fecha
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toggle = (key: string) =>
    setExpanded((s) => ({ ...s, [key]: !s[key] }))

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <button
        aria-label="Fechar menu"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        id="main-nav-mobile"
        className="absolute left-0 top-0 h-full w-[88%] max-w-[360px] translate-x-0 bg-white shadow-2xl
                   rounded-r-2xl border-r border-slate-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="Mapa do Crédito" className="h-8 w-8 rounded-xl" />
            <span className="text-lg font-extrabold text-slate-900">Mapa do Crédito</span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <X className="h-5 w-5 text-slate-900" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-2">
            {nav.map((n, idx) => {
              const key = `${n.label}-${idx}`
              const kind = n.kind
              const indexHref = n.indexHref || (kind ? `/posts?type=${kind}` : '#')
              const items = (kind && featured?.[kind]) || []
              const showFeatured = Array.isArray(items) && items.length > 0

              return (
                <li key={key} className="rounded-xl border border-slate-200">
                  {/* Cabeçalho da seção */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={indexHref}
                      onClick={onClose}
                      className="flex-1 px-4 py-3 font-semibold text-slate-900"
                    >
                      {n.label}
                    </Link>
                    {showFeatured && (
                      <button
                        onClick={() => toggle(key)}
                        aria-expanded={!!expanded[key]}
                        aria-controls={`sec-${idx}`}
                        className="px-3 py-3 text-slate-600 hover:text-slate-900"
                      >
                        {expanded[key] ? '−' : '+'}
                      </button>
                    )}
                  </div>

                  {/* Lista expandida de destaques */}
                  {showFeatured && expanded[key] && (
                    <div id={`sec-${idx}`} className="border-t border-slate-200">
                      <ul className="divide-y">
                        {items.slice(0, 8).map((it) => {
                          const href = buildPostHref(it, kind!)
                          return (
                            <li key={it.id}>
                              <Link
                                href={href}
                                onClick={onClose}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                              >
                                <div className="h-12 w-16 overflow-hidden rounded-md bg-slate-100 shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {it.image_url ? (
                                    <img
                                      src={it.image_url}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <div className="line-clamp-2 text-sm text-slate-800">{it.title}</div>
                                </div>
                              </Link>
                            </li>
                          )
                        })}
                        <li>
                          <Link
                            href={indexHref}
                            onClick={onClose}
                            className="block px-4 py-3 text-sm font-medium text-sky-700 hover:bg-slate-50"
                          >
                            Ver todos em {n.label}
                          </Link>
                        </li>
                      </ul>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Ações rápidas */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/calculadoras"
              onClick={onClose}
              className="text-center rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white"
            >
              Calculadoras
            </Link>
            <Link
              href="/buscar"
              onClick={onClose}
              className="text-center rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-900"
            >
              Buscar
            </Link>
          </div>
        </nav>

        {/* Rodapé */}
        <div className="border-t px-4 py-3 text-xs text-slate-500">
          © {new Date().getFullYear()} Mapa do Crédito
        </div>
      </aside>
    </div>
  )
}
