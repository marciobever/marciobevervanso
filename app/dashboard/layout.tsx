'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import '@/app/globals.css'

type NavItem = { href: string; label: string; icon?: React.ReactNode }

const NAV: NavItem[] = [
  { href: '/dashboard',            label: 'Dashboard',   icon: '📊' },
  { href: '/dashboard/posts',      label: 'Posts',       icon: '📝' },
  { href: '/dashboard/categories', label: 'Categorias',  icon: '🏷️' },
  { href: '/dashboard/webstories', label: 'Webstories',  icon: '📖' },
  { href: '/dashboard/n8n',        label: 'Integrações', icon: '🧩' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isDashboardHome = pathname === '/dashboard'

  // tela de login não usa layout
  if (pathname === '/dashboard/login') return <>{children}</>

  // marca admin no <html> para estilos só no dashboard
  useEffect(() => {
    document.documentElement.setAttribute('data-admin', '1')
    return () => document.documentElement.removeAttribute('data-admin')
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* CSS global válido apenas quando data-admin=1 */}
      <style jsx global>{`
        /* Esconde header/rodapé globais do site no admin */
        html[data-admin="1"] header,
        html[data-admin="1"] footer,
        html[data-admin="1"] .site-header,
        html[data-admin="1"] .site-footer {
          display: none !important;
        }
        /* Fundo do admin */
        html[data-admin="1"] body { background: #f6f8fb; }
        /* Opcional: esconder títulos grandes apenas na home do admin */
        ${isDashboardHome ? `
          html[data-admin="1"] main h1,
          html[data-admin="1"] main .page-title {
            display: none !important;
          }
        ` : ''}
      `}</style>

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 md:hidden"
              onClick={() => setOpen(v => !v)}
              aria-label="Menu"
            >
              ☰
            </button>
            <div className="font-extrabold tracking-tight text-slate-900">
              Mapa do Crédito · Admin
            </div>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await fetch('/api/auth/sign-out', { method: 'POST' })
              window.location.href = '/dashboard/login'
            }}
          >
            <button className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Sair</button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:px-8 md:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside
          className={clsx(
            'rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur',
            'md:static md:block',
            open ? 'fixed left-4 right-4 top-16 z-50 md:relative' : 'hidden md:block'
          )}
        >
          <nav className="space-y-1">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-100',
                  pathname.startsWith(item.href)
                    ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200'
                    : 'text-slate-700'
                )}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="min-h-[60vh]">{children}</main>
      </div>
    </div>
  )
}
