'use client'

import { useEffect, useMemo, useState } from 'react'
import Script from 'next/script'

type Page = {
  id: string
  bg: string
  heading: string
  sub?: string | null
  cta_url?: string | null
  cta_label?: string | null
}

type Story = {
  slug: string
  title: string
  tags: string[]
  template: string | null
  publisher: string
  publisher_logo?: string | null
  poster_portrait?: string | null
  published: boolean
  pages: Page[]
}

/* -------------------- template picker -------------------- */
type TemplateKey = 'classic' | 'glass' | 'wave' | 'tag'

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}
function pickTemplate(input: { slug: string; tags: string[]; explicit: string | null }): TemplateKey {
  if (input.explicit && ['classic', 'glass', 'wave', 'tag'].includes(input.explicit)) {
    return input.explicit as TemplateKey
  }
  const t = input.tags.map(t => t.toLowerCase())
  if (t.some(x => /cart(ao|ão)|crédito|credito/.test(x))) return 'wave'
  if (t.some(x => /benef[ií]cio|cashback|milha/.test(x))) return 'classic'
  if (t.some(x => /dica|tutorial|passo/.test(x))) return 'tag'
  const pool: TemplateKey[] = ['glass', 'classic', 'wave', 'tag']
  return pool[hash(input.slug) % pool.length]
}

/* -------------------- ad overlay (full-page) -------------------- */
function FullScreenAd({ onClose }: { onClose: () => void }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const [ready, setReady] = useState(false)

  // fecha com ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {client && (
        <Script
          id="adsense-auto"
          async
          strategy="afterInteractive"
          onLoad={() => setReady(true)}
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
        />
      )}
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-[min(92vw,420px)] aspect-[9/16] rounded-2xl bg-white overflow-hidden">
          {/* Cabeçalho do anúncio */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2 text-xs text-black/60">
            <span>Anúncio</span>
            <button
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black focus:outline-none"
              aria-label="Fechar anúncio"
            >
              ✕
            </button>
          </div>

          {/* Slot do anúncio */}
          <div className="absolute inset-0 grid place-items-center p-3">
            {client ? (
              <ins
                className="adsbygoogle block w-full h-full"
                style={{ display: 'block' }}
                data-ad-client={client}
                data-ad-slot=""
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            ) : (
              <div className="h-full w-full rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-50 grid place-items-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-zinc-900/90 text-white grid place-items-center">AD</div>
                  <p className="text-zinc-700 font-medium">Seu criativo aqui</p>
                  <p className="text-zinc-500 text-sm">Defina <code>NEXT_PUBLIC_ADSENSE_CLIENT</code> para AdSense</p>
                </div>
              </div>
            )}
          </div>

          {/* rodapé “Fechar em X s” opcional */}
        </div>
      </div>
    </>
  )
}

/* -------------------- Templates -------------------- */
function TextBlock({
  heading,
  sub,
  align = 'center',
  shadow = true,
}: {
  heading: string
  sub?: string | null
  align?: 'left' | 'center' | 'right'
  shadow?: boolean
}) {
  const alignCls = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center'
  return (
    <div className={`flex flex-col ${alignCls} gap-2`}>
      <h2
        className={`text-white font-semibold tracking-tight leading-tight text-[26px] sm:text-[30px] ${shadow ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,.7)]' : ''}`}
      >
        {heading}
      </h2>
      {sub ? (
        <p className={`text-white/90 text-sm ${shadow ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,.6)]' : ''}`}>
          {sub}
        </p>
      ) : null}
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 text-black px-2.5 py-1 text-xs font-medium shadow-sm">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M4 12h16M4 6h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      {children}
    </span>
  )
}

function SlideClassic({ pg }: { pg: Page }) {
  return (
    <article className="relative aspect-[9/16] overflow-hidden rounded-3xl shadow-2xl">
      <img src={pg.bg} alt={pg.heading} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.55))]" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <TextBlock heading={pg.heading} sub={pg.sub} />
        {pg.cta_url && pg.cta_label && (
          <a href={pg.cta_url} className="mt-3 inline-block rounded-full bg-white/95 px-4 py-1.5 text-sm font-semibold text-black shadow hover:bg-white">
            {pg.cta_label}
          </a>
        )}
      </div>
    </article>
  )
}

function SlideGlass({ pg }: { pg: Page }) {
  return (
    <article className="relative aspect-[9/16] overflow-hidden rounded-3xl shadow-2xl">
      <img src={pg.bg} alt={pg.heading} className="absolute inset-0 h-full w-full object-cover scale-[1.02]" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 p-4">
          <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,.5)]">
            {pg.heading}
          </h2>
          {pg.sub && <p className="text-white/85 text-sm mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,.6)]">{pg.sub}</p>}
          {pg.cta_url && pg.cta_label && (
            <a href={pg.cta_url} className="mt-3 inline-block rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-black shadow hover:bg-white">
              {pg.cta_label}
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function SlideWave({ pg }: { pg: Page }) {
  return (
    <article className="relative aspect-[9/16] overflow-hidden rounded-3xl shadow-2xl">
      <img src={pg.bg} alt={pg.heading} className="absolute inset-0 h-full w-full object-cover" />
      {/* wave */}
      <svg className="absolute inset-x-0 top-0 h-24 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="url(#g)" d="M0,64L48,90.7C96,117,192,171,288,202.7C384,235,480,245,576,229.3C672,213,768,171,864,165.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,.55)" />
            <stop offset="100%" stopColor="rgba(0,0,0,.0)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute left-4 top-4">
        <Badge>Dica de Cartão</Badge>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <TextBlock heading={pg.heading} sub={pg.sub} align="left" />
        {pg.cta_url && pg.cta_label && (
          <a href={pg.cta_url} className="mt-3 inline-block rounded-full bg-white/95 px-4 py-1.5 text-sm font-semibold text-black shadow hover:bg-white">
            {pg.cta_label}
          </a>
        )}
      </div>
    </article>
  )
}

function SlideTag({ pg }: { pg: Page }) {
  return (
    <article className="relative aspect-[9/16] overflow-hidden rounded-3xl shadow-2xl">
      <img src={pg.bg} alt={pg.heading} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute right-4 top-4">
        <span className="rounded-lg bg-black/70 text-white text-xs px-2 py-1">Web Story</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <TextBlock heading={pg.heading} sub={pg.sub} />
      </div>
    </article>
  )
}

/* -------------------- Player -------------------- */
export default function StoryPlayer({ story }: { story: Story }) {
  const [showAd, setShowAd] = useState(false)

  // frequência do anúncio: 1x por sessão
  useEffect(() => {
    const k = `ws_ad_shown_${story.slug}`
    const seen = sessionStorage.getItem(k)
    if (!seen) {
      const t = setTimeout(() => {
        setShowAd(true)
        sessionStorage.setItem(k, '1')
      }, 1400)
      return () => clearTimeout(t)
    }
  }, [story.slug])

  const tpl = useMemo(
    () => pickTemplate({ slug: story.slug, tags: story.tags || [], explicit: story.template }),
    [story.slug, story.tags, story.template]
  )

  const Slide = tpl === 'glass' ? SlideGlass : tpl === 'wave' ? SlideWave : tpl === 'tag' ? SlideTag : SlideClassic

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="mx-auto max-w-sm px-3 py-4 flex items-center gap-2">
        {story.publisher_logo && (
          <img src={story.publisher_logo} alt={story.publisher} className="h-6 w-6 rounded" />
        )}
        <h1 className="text-sm text-white/80 line-clamp-1">{story.title}</h1>
      </header>

      <section className="mx-auto max-w-sm px-3 pb-10 space-y-4">
        {story.pages.map((pg) => (
          <Slide key={pg.id} pg={pg} />
        ))}
      </section>

      {showAd && <FullScreenAd onClose={() => setShowAd(false)} />}
    </main>
  )
}