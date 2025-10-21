// components/ads/AdSlot.tsx
'use client'

import { useEffect, useId, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type GPTSize = [number, number]
type SlotKey =
  | 'content_top'
  | 'content_middle'
  | 'content_bottom'
  | 'sidebar'
  | 'floating_left'
  | 'floating_right'
  | 'modal'
  | 'inarticle'
  | 'infeed'
  | 'modal_quiz_mobile'

type Props = {
  /** Pode ser uma key (ex.: "content_top") OU um ad unit completo do GAM (ex.: "/2328.../Content1") */
  slot: string
  className?: string
  style?: React.CSSProperties
  /** Se true, nunca deixa o criativo ultrapassar a largura do container (escala para caber). */
  fit?: boolean
}

const MAP: Record<SlotKey, { adUnit: string; sizes: (GPTSize | 'fluid')[] }> = {
  content_top:      { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content1', sizes: ['fluid', [300,250],[336,280],[250,250],[728,90],[970,90]] },
  content_middle:   { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content2', sizes: ['fluid', [300,250],[336,280],[250,250]] },
  content_bottom:   { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content3', sizes: ['fluid', [300,250],[336,280],[250,250]] },
  sidebar:          { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content4', sizes: [[300,250],[336,280],[300,600]] },
  floating_left:    { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content5', sizes: [[250,250],[300,250]] },
  floating_right:   { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content6', sizes: [[250,250],[300,250]] },
  infeed:           { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content7', sizes: ['fluid', [300,250]] },
  modal:            { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content8', sizes: [[300,250],[336,280]] },
  modal_quiz_mobile:{ adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content9', sizes: [[300,250],[320,100]] },
  inarticle:        { adUnit: '/23287346478/marciobevervanso.com/marciobevervanso.com_Content2', sizes: ['fluid', [300,250],[336,280],[250,250]] },
}

function isSizeTuple(x: GPTSize | 'fluid'): x is GPTSize {
  return Array.isArray(x)
}

export default function AdSlot({ slot, className, style, fit = false }: Props) {
  const id = useId().replace(/:/g, '')
  const divId = `gpt-${id}`

  const wrapRef = useRef<HTMLDivElement>(null)
  const slotObjRef = useRef<any>(null)
  const lastSizeRef = useRef<[number, number] | null>(null)
  const resizeObsRef = useRef<ResizeObserver | null>(null)

  const pathname = usePathname() || ''
  const search = useSearchParams()
  const hidden =
    pathname === '/login' ||
    pathname === '/dashboard/login' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    (search?.get('ads') || '').toLowerCase() === 'off'

  // Resolve: aceita key ou ad unit absoluta
  const conf =
    slot.startsWith('/')
      ? { adUnit: slot, sizes: ['fluid', [300,250],[336,280],[250,250]] as (GPTSize | 'fluid')[] }
      : (MAP as any)[slot as SlotKey]

  // Define e exibe o slot
  useEffect(() => {
    if (hidden || !conf) return
    const w = window as any
    w.googletag = w.googletag || { cmd: [] }
    w.__gptSlots = w.__gptSlots || {}

    w.googletag.cmd.push(function () {
      const gtag = w.googletag

      // Se já existir um slot registrado para este divId (HMR/navegação), destrói antes
      if (w.__gptSlots[divId]) {
        try { gtag.destroySlots([w.__gptSlots[divId]]) } catch {}
        delete w.__gptSlots[divId]
      }

      const mapping = gtag.sizeMapping()
        .addSize([0, 0], conf.sizes) // pode incluir 'fluid' aqui
        .build()

      const sizesNoFluid = conf.sizes.filter(isSizeTuple)

      const slotObj = gtag.defineSlot(conf.adUnit, sizesNoFluid, divId)
      if (slotObj) {
        slotObjRef.current = slotObj
        w.__gptSlots[divId] = slotObj

        slotObj
          .defineSizeMapping(mapping)
          .setCollapseEmptyDiv(true)
          .addService(gtag.pubads())
      }

      gtag.display(divId)
    })

    // Cleanup: destrói o slot deste divId ao desmontar
    return () => {
      try {
        const gtag = (window as any).googletag
        const reg = (window as any).__gptSlots || {}
        const slot = reg[divId]
        if (gtag && slot) {
          gtag.destroySlots([slot])
          delete reg[divId]
        }
      } catch {}
    }
  }, [hidden, conf?.adUnit, divId])

  // Encaixe automático após a renderização do GAM + ajuste em resize
  useEffect(() => {
    if (!fit || hidden) return
    const w = window as any
    w.googletag = w.googletag || { cmd: [] }

    function applyScale() {
      const container = wrapRef.current
      const slotEl = document.getElementById(divId) as HTMLDivElement | null
      const served = lastSizeRef.current
      if (!container || !slotEl || !served) return

      const [servedW, servedH] = served
      const maxW = container.clientWidth || servedW
      const scale = Math.min(1, maxW / servedW)

      slotEl.style.transformOrigin = 'top left'
      slotEl.style.transform = `scale(${scale})`
      slotEl.style.width = `${servedW}px`
      slotEl.style.height = `${servedH}px`

      container.style.height = `${Math.round(servedH * scale)}px`
      container.style.overflow = 'hidden'
    }

    function onRenderEnded(e: any) {
      if (!slotObjRef.current || e.slot !== slotObjRef.current) return
      const container = wrapRef.current
      const slotEl = document.getElementById(divId) as HTMLDivElement | null
      if (!container || !slotEl) return

      // colapsado (sem criativo)
      if (!e.size || (Array.isArray(e.size) && e.size[0] === 0)) {
        container.style.height = '0px'
        container.style.overflow = 'hidden'
        lastSizeRef.current = null
        return
      }

      // 'fluid' → GPT controla, não escalamos
      if (!Array.isArray(e.size)) {
        lastSizeRef.current = null
        slotEl.style.transform = ''
        slotEl.style.width = ''
        slotEl.style.height = ''
        container.style.height = ''
        container.style.overflow = ''
        return
      }

      lastSizeRef.current = e.size as [number, number]
      applyScale()
    }

    w.googletag.cmd.push(() => {
      try { w.googletag.pubads().addEventListener('slotRenderEnded', onRenderEnded) } catch {}
    })

    if ('ResizeObserver' in window) {
      resizeObsRef.current = new ResizeObserver(() => applyScale())
      if (wrapRef.current) resizeObsRef.current.observe(wrapRef.current)
    }

    return () => {
      try { w.googletag?.pubads()?.removeEventListener('slotRenderEnded', onRenderEnded) } catch {}
      if (resizeObsRef.current && wrapRef.current) {
        try { resizeObsRef.current.unobserve(wrapRef.current) } catch {}
      }
      resizeObsRef.current = null
    }
  }, [fit, hidden, divId])

  if (hidden) {
    return (
      <div
        ref={wrapRef}
        className={className}
        style={{
          ...(style || {}),
          display: 'grid',
          placeItems: 'center',
          background: '#f1f5f9',
          color: '#64748b',
          borderRadius: 12,
          minHeight: 90,
        }}
        aria-hidden
      >
        <div style={{ fontSize: 12 }}>Ads ocultos nesta página</div>
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ ...(style || {}), position: 'relative', overflow: 'hidden' }}
    >
      <div id={divId} />
    </div>
  )
}
