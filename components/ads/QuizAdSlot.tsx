'use client'

import { useEffect, useId, useRef } from 'react'

type Variant = 'mobile' | 'desktop' | 'custom'

type Props = {
  /** Caminho da unidade no GAM, ex.: /23287346478/marciobevervanso.com/marciobevervanso.com_Quiz_Mobile_320x100 */
  slot: string
  /** mobile = 320x100 | desktop = 200x300 | custom usa width/height */
  variant?: Variant
  /** apenas se variant = 'custom' */
  width?: number
  height?: number
  /** rótulo “Patrocinado” */
  showLabel?: boolean
  className?: string
}

/** Espera (curto) por TCF se houver CMP na página. Não bloqueia se não existir. */
function waitForTCF(timeoutMs = 1500): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve()

    // Sem CMP → segue
    const anyWin = window as any
    if (typeof anyWin.__tcfapi !== 'function') return resolve()

    let settled = false
    const tm = setTimeout(() => { if (!settled) resolve() }, timeoutMs)

    try {
      anyWin.__tcfapi('addEventListener', 2, (tcData: any, success: boolean) => {
        if (settled) return
        // Quando o CMP sinaliza ready/status, seguimos
        if (success && tcData && (tcData.eventStatus === 'tcloaded' || tcData.eventStatus === 'useractioncomplete' || tcData.eventStatus === 'cmpuishown')) {
          settled = true
          clearTimeout(tm)
          resolve()
        }
      })
    } catch {
      resolve()
    }
  })
}

/**
 * Slot de anúncio **fixo** via Google Ad Manager (GPT).
 * - Depende do GPT carregado pelo GAMBootstrap (layout raiz).
 * - Travamos width/height para não quebrar o layout nem causar CLS.
 */
export default function QuizAdSlot({
  slot: unitPath,
  variant = 'mobile',
  width,
  height,
  showLabel = false,
  className,
}: Props) {
  const divId = useId().replace(/:/g, '_')
  const slotRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const dims =
    variant === 'desktop'
      ? { w: 200, h: 300 }
      : variant === 'mobile'
      ? { w: 320, h: 100 }
      : { w: width ?? 300, h: height ?? 250 }

  const frameStyle: React.CSSProperties = {
    width: dims.w,
    height: dims.h,
    minWidth: dims.w,
    maxWidth: dims.w,
    minHeight: dims.h,
    maxHeight: dims.h,
    overflow: 'hidden',
    contain: 'strict',
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as any
    w.googletag = w.googletag || { cmd: [] }

    // evita duplo display em re-render/HMR
    if (containerRef.current?.dataset.gamDisplayed === '1') return

    ;(async () => {
      // aguarda CMP (se houver), reduz warnings de EU TCF
      await waitForTCF(1500)

      w.googletag.cmd.push(() => {
        const gtag = w.googletag
        const size: [number, number] = [dims.w, dims.h]

        // se já existe um slot antigo com mesmo divId, destrói
        try {
          const old = slotRef.current
          if (old && gtag.destroySlots) gtag.destroySlots([old])
        } catch {}

        const s = gtag.defineSlot(unitPath, size, divId)
        if (!s) return

        s.addService(gtag.pubads())
        gtag.display(divId)

        slotRef.current = s
        if (containerRef.current) containerRef.current.dataset.gamDisplayed = '1'
      })
    })()

    return () => {
      const gtag = (window as any).googletag
      if (gtag?.destroySlots && slotRef.current) {
        try { gtag.destroySlots([slotRef.current]) } catch {}
        slotRef.current = null
        if (containerRef.current) delete containerRef.current.dataset.gamDisplayed
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitPath, dims.w, dims.h, divId])

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1 text-[11px] font-semibold text-slate-500">Patrocinado</div>
      )}
      <div
        ref={containerRef}
        style={frameStyle}
        className="grid place-items-center rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <div id={divId} style={{ width: dims.w, height: dims.h }} />
      </div>
    </div>
  )
}
