// components/calcs/SocialShare.tsx
'use client'

import { useMemo, useState } from 'react'

type Props = {
  title?: string
  summary?: string
  tags?: string[]
  url?: string
  campaign?: string
  className?: string
  /**
   * 'brand' = botões cheios nas cores da rede
   * 'chips' = neutro com borda e ícone colorido
   */
  variant?: 'brand' | 'chips'
  /** 'sm' | 'md' */
  size?: 'sm' | 'md'
  /** Exibe o botão nativo como o primeiro da linha */
  showNative?: boolean
  /** Modo compacto em mobile (ícones apenas < sm) */
  compactOnMobile?: boolean
}

/** Paleta + ícones (SVG inline, sem libs externas) */
const BRANDS = {
  whatsapp: { bg: '#25D366', fg: '#ffffff', Icon: IconWhatsApp, label: 'WhatsApp' },
  telegram: { bg: '#229ED9', fg: '#ffffff', Icon: IconTelegram, label: 'Telegram' },
  facebook: { bg: '#1877F2', fg: '#ffffff', Icon: IconFacebook, label: 'Facebook' },
  x:        { bg: '#000000', fg: '#ffffff', Icon: IconX,        label: 'X' },
  linkedin: { bg: '#0A66C2', fg: '#ffffff', Icon: IconLinkedIn, label: 'LinkedIn' },
} as const

export default function SocialShare({
  title = 'Confira esta página',
  summary = 'Conteúdo do Mapa do Crédito.',
  tags = ['MapaDoCredito'],
  url,
  campaign = 'calculadoras',
  className = '',
  variant = 'brand',
  size = 'md',
  showNative = true,
  compactOnMobile = true,
}: Props) {
  const [copied, setCopied] = useState(false)

  const shareUrl = useMemo(() => {
    try {
      const base = url || (typeof window !== 'undefined' ? window.location.href : '')
      if (!base) return ''
      const u = new URL(base)
      const p = u.searchParams
      if (!p.has('utm_source')) p.set('utm_source', 'share')
      if (!p.has('utm_medium')) p.set('utm_medium', 'social')
      if (!p.has('utm_campaign')) p.set('utm_campaign', campaign)
      u.search = p.toString()
      return u.toString()
    } catch {
      return url || ''
    }
  }, [url, campaign])

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const hashTags = encodeURIComponent(tags.join(','))

  const links = [
    {
      key: 'whatsapp',
      href: `https://wa.me/?text=${encodedTitle}%0A${encodedUrl}`,
      ...BRANDS.whatsapp,
      aria: 'Compartilhar no WhatsApp',
    },
    {
      key: 'telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      ...BRANDS.telegram,
      aria: 'Compartilhar no Telegram',
    },
    {
      key: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      ...BRANDS.facebook,
      aria: 'Compartilhar no Facebook',
    },
    {
      key: 'x',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${hashTags}`,
      ...BRANDS.x,
      aria: 'Compartilhar no X (Twitter)',
    },
    {
      key: 'linkedin',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      ...BRANDS.linkedin,
      aria: 'Compartilhar no LinkedIn',
    },
  ] as const

  const pad = size === 'sm' ? 'px-3' : 'px-4'
  const text = size === 'sm' ? 'text-[13px]' : 'text-sm'
  const h = size === 'sm' ? 'h-10' : 'h-11'
  const icon = size === 'sm' ? 16 : 18
  const radius = 'rounded-full'

  const labelClasses = compactOnMobile ? 'hidden sm:inline-block' : ''

  async function handleNativeShare() {
    if (!shareUrl) return
    try {
      if (navigator.share) {
        await navigator.share({ title, text: summary, url: shareUrl })
      } else {
        await copyLink()
      }
    } catch {}
  }

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      const ok = prompt('Copie o link:', shareUrl)
      if (ok) setCopied(true)
    }
  }

  return (
    <section
      className={[
        'rounded-2xl border bg-white/90 backdrop-blur p-4 md:p-5 ring-1 ring-slate-100',
        className,
      ].join(' ')}
      aria-labelledby="share-heading"
    >
      {/* Cabeçalho (alinhado à esquerda) */}
      <div className="mb-3">
        <h2 id="share-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Compartilhar
        </h2>
        <p className="text-sm text-slate-600">{title}</p>
      </div>

      {/* Linha de botões — quebra em 2 linhas se precisar */}
      <div className="flex flex-wrap items-center gap-2">
        {showNative && (
          <button
            type="button"
            onClick={handleNativeShare}
            className={[
              'inline-flex items-center font-semibold shadow-sm',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
              'hover:opacity-90 active:opacity-85',
              'bg-slate-700 text-white',
              radius, h, pad, text,
            ].join(' ')}
            aria-label="Compartilhar (nativo)"
          >
            <IconShare width={icon} height={icon} />
            <span className={`ml-2 ${labelClasses}`}>Compartilhar</span>
          </button>
        )}

        {links.map(({ key, label, href, bg, fg, Icon, aria }) =>
          variant === 'brand' ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={aria}
              className={[
                'inline-flex items-center font-semibold shadow-sm',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                'hover:opacity-90 active:opacity-85',
                radius, h, pad, text,
              ].join(' ')}
              style={{ backgroundColor: bg, color: fg }}
            >
              <Icon width={icon} height={icon} />
              <span className={`ml-2 ${labelClasses}`}>{label}</span>
            </a>
          ) : (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={aria}
              className={[
                'inline-flex items-center font-semibold border',
                'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                radius, h, pad, text,
              ].join(' ')}
            >
              {/* Ícone na cor da marca para ficar elegante no chip */}
              <Icon width={icon} height={icon} />
              <span className={`ml-2 ${labelClasses}`}>{label}</span>
            </a>
          )
        )}

        {/* Copiar link – sempre por último */}
        <button
          onClick={copyLink}
          aria-label="Copiar link"
          className={[
            'inline-flex items-center font-semibold border',
            'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
            radius, h, pad, text,
          ].join(' ')}
        >
          <IconLink width={icon} height={icon} />
          <span className={`ml-2 ${labelClasses}`}>{copied ? 'Link copiado!' : 'Copiar link'}</span>
        </button>
      </div>
    </section>
  )
}

/* ================= ÍCONES ================= */
function IconShare({ width = 18, height = 18 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18 8a3 3 0 0 0-2.816 1.995l-6.09-2.436a3 3 0 1 0-.184 1.014l6.091 2.435a3 3 0 1 0 .18-1.012l-6.09-2.437A3 3 0 1 0 6 9a3 3 0 0 0 2.816-1.994l6.09 2.436A3 3 0 1 0 18 8Z" />
    </svg>
  )
}
function IconLink({ width = 18, height = 18 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M10.59 13.41a1 1 0 0 1 0-1.41l2-2a1 1 0 1 1 1.41 1.41l-2 2a1 1 0 0 1-1.41 0ZM14.83 5.17a4 4 0 0 1 5.66 5.66l-2.83 2.83a4 4 0 0 1-5.66 0 1 1 0 0 1 1.41-1.41 2 2 0 0 0 2.83 0l2.83-2.83a2 2 0 1 0-2.83-2.83l-1 1a1 1 0 1 1-1.41-1.41l1-1Z"/>
    </svg>
  )
}
function IconWhatsApp({ width = 18, height = 18 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 256 256" aria-hidden="true" fill="currentColor">
      <path d="M128.1 20C70.6 20 24.4 66.2 24.4 123.7c0 22 6 43.3 17.4 62L24 236l51.5-17c18 9.8 38.4 15 59.6 15 57.5 0 103.7-46.2 103.7-103.7S185.6 20 128.1 20zm58.9 146.6c-2.5 7.1-12.5 13.2-20.3 15-5.4 1.3-12.5 2.3-36.3-7.8-30.5-12.9-50.3-44.6-51.8-46.7-1.5-2.1-12.4-16.5-12.4-31.5s7.6-22.4 10.8-25.5 7.1-3.3 9.5-3.3 4.7 0 6.8.1 5.2-.8 8.2 6.3c3 7.1 10.4 24.5 11.3 26.3 0.9 1.8 1.5 3.9 0.3 6.1s-1.8 3.9-3.5 6.1-3.7 5.4-5.3 7.3-3.4 4.4-1.4 8.3c1.9 3.9 8.3 13.6 17.9 22 12.3 10.9 22.7 14.3 26.6 16.2 3.9 1.9 6.2 1.6 8.5-1 2.3-2.6 9.8-11.4 12.4-15.3 2.6-3.9 5.2-3.2 8.6-1.9 3.4 1.3 21.6 10.2 25.3 12.1 3.7 1.9 6.1 3 7 4.7 0.8 1.6 0 7.4-2.5 14.5z"/>
    </svg>
  )
}
function IconTelegram({ width = 18, height = 18 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 240 240" aria-hidden="true" fill="currentColor">
      <path d="M120 0C53.7 0 0 53.7 0 120s53.7 120 120 120 120-53.7 120-120S186.3 0 120 0zm58.6 78.4l-21.3 100.6c-1.6 7.3-5.9 9.1-11.9 5.7l-33-24.3-15.9 15.3c-1.8 1.8-3.3 3.3-6.8 3.3l2.4-34.6 62.9-56.8c2.7-2.4-0.6-3.7-4.2-1.3l-77.8 49-33.4-10.4c-7.2-2.2-7.4-7.2 1.5-10.6l130.3-50.2c6.1-2.2 11.5 1.5 9.5 10.6z"/>
    </svg>
  )
}
function IconFacebook({ width = 18, height = 18 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07C1.86 17.1 5.55 21.24 10.3 22v-7.03H7.72v-2.9h2.58v-2.2c0-2.55 1.52-3.96 3.84-3.96 1.11 0 2.27.2 2.27.2v2.5h-1.28c-1.26 0-1.65.78-1.65 1.58v1.88h2.81l-.45 2.9h-2.36V22c4.75-.76 8.44-4.9 8.44-9.93z"/>
    </svg>
  )
}
function IconX({ width = 18, height = 18 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2H21l-6.52 7.46L22 22h-6.99l-4.58-6.3L5.2 22H2.44l7.03-8.04L2 2h7.09l4.14 5.64L18.244 2Zm-2.45 18h1.63L8.29 4h-1.7l9.2 16Z"/>
    </svg>
  )
}
function IconLinkedIn({ width = 18, height = 18 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M20.45 20.45h-3.56V14.9c0-1.32-.02-3.02-1.84-3.02-1.85 0-2.14 1.44-2.14 2.92v5.65H9.35V9.5h3.42v1.49h.05c.48-.9 1.66-1.85 3.42-1.85 3.66 0 4.34 2.41 4.34 5.54v5.77ZM6.33 8.01A2.07 2.07 0 1 1 6.3 3.88a2.07 2.07 0 0 1 .03 4.13ZM4.55 20.45h3.56V9.5H4.55v10.96Z"/>
    </svg>
  )
}