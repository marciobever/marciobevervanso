// components/calculadoras/CalculadorasFrame.tsx
'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import AdSlot from '@/components/ads/AdSlot'

export default function CalculadorasFrame({ children }: { children: ReactNode }) {
  const mainRef = useRef<HTMLDivElement | null>(null)
  const [topAnchor, setTopAnchor] = useState<HTMLElement | null>(null)

  // Cria um placeholder logo após o primeiro H1 para o ad mobile-top
  useEffect(() => {
    if (!mainRef.current) return

    const ensureAnchor = () => {
      const h1 = mainRef.current!.querySelector('h1')
      if (!h1) return
      // Evita duplicar
      if (mainRef.current!.querySelector('#calc-mobile-top-anchor')) return

      const anchor = document.createElement('div')
      anchor.id = 'calc-mobile-top-anchor'
      anchor.className = 'lg:hidden flex justify-center mt-3'
      h1.insertAdjacentElement('afterend', anchor)
      setTopAnchor(anchor)
    }

    // 1) tenta imediatamente
    ensureAnchor()

    // 2) observa mudanças (caso h1 apareça depois)
    const mo = new MutationObserver(() => ensureAnchor())
    mo.observe(mainRef.current, { childList: true, subtree: true })

    return () => mo.disconnect()
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_336px]">
        {/* Coluna principal */}
        <div ref={mainRef}>{children}</div>

        {/* Lateral (desktop) — único ad, sticky */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-white p-3 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Patrocinado
            </div>
            <AdSlot
              slot="sidebar"
              className="w-full"
              style={{ minHeight: 250, maxWidth: 336 }}
            />
          </div>
        </aside>
      </div>

      {/* MOBILE: ad antes do rodapé */}
      <div className="mt-8 lg:hidden flex justify-center">
        <AdSlot
          slot="content_bottom"
          className="w-full"
          style={{ minHeight: 250, maxWidth: 336 }}
        />
      </div>

      {/* MOBILE: ad logo após o primeiro <h1> (portal) */}
      {topAnchor &&
        createPortal(
          <AdSlot
            slot="inarticle"
            className="w-full"
            style={{ minHeight: 250, maxWidth: 336 }}
          />,
          topAnchor
        )}
    </div>
  )
}
