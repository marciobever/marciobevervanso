// app/webstories/[slug]/preview/page.tsx
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Pg = {
  id: string
  bg?: string
  heading: string
  sub?: string | null
  cta_url?: string | null
  cta_label?: string | null
  image?: { url?: string }
}

type TemplateKey = 'classic' | 'glass' | 'bold' | 'neo' | 'minimal'
type Theme = {
  card: string
  overlay: string
  contentBox: string
  title: string
  subtitle: string
  button: string
}

const THEMES: Record<TemplateKey, Theme> = {
  classic: {
    card:
      'relative aspect-[9/16] overflow-hidden rounded-[22px] mb-5 shadow-[0_14px_42px_rgba(0,0,0,.45)] ring-1 ring-white/10',
    overlay:
      'absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_120%,rgba(0,0,0,.65),transparent_60%)]',
    contentBox: 'absolute inset-x-0 bottom-0 p-6',
    title:
      'text-white font-semibold tracking-tight text-[24px] leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,.6)]',
    subtitle: 'text-white/90 text-[13px] mt-2 leading-snug',
    button:
      'inline-block mt-3 rounded-xl bg-white text-black text-[13px] font-medium px-3.5 py-2 shadow-md hover:shadow-lg transition',
  },
  glass: {
    card:
      'relative aspect-[9/16] overflow-hidden rounded-[28px] mb-5 shadow-[0_18px_50px_rgba(0,0,0,.5)] ring-1 ring-white/10',
    overlay: 'absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent',
    contentBox: 'absolute inset-x-0 bottom-0 p-5',
    title:
      'text-white font-semibold text-[22px] leading-tight backdrop-blur-[2px] bg-white/10 px-3 py-2 rounded-lg shadow-[0_6px_30px_rgba(0,0,0,.35)]',
    subtitle: 'text-white/85 text-[13px] mt-2 leading-snug backdrop-blur-[1px]',
    button:
      'inline-block mt-3 rounded-xl bg-white/90 hover:bg-white text-black text-[13px] font-medium px-3.5 py-2 shadow-lg transition',
  },
  bold: {
    card:
      'relative aspect-[9/16] overflow-hidden rounded-[20px] mb-5 shadow-[0_14px_48px_rgba(0,0,0,.55)] ring-2 ring-orange-400/50',
    overlay: 'absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.7),rgba(0,0,0,.1))]',
    contentBox: 'absolute inset-x-0 bottom-0 p-6',
    title:
      'text-white font-extrabold tracking-[-.02em] text-[26px] leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,.6)]',
    subtitle: 'text-white/90 text-[13px] mt-2 leading-snug',
    button:
      'inline-block mt-3 rounded-xl bg-orange-400 hover:bg-orange-300 text-black text-[13px] font-semibold px-3.5 py-2 shadow-lg transition',
  },
  neo: {
    card:
      'relative aspect-[9/16] overflow-hidden rounded-[24px] mb-5 shadow-[0_22px_60px_rgba(0,0,0,.55)] ring-1 ring-white/20',
    overlay:
      'absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(0,0,0,.75),transparent_60%)]',
    contentBox: 'absolute inset-x-0 bottom-0 p-6',
    title:
      'text-white font-semibold text-[24px] leading-tight [text-shadow:_0_0_30px_rgba(51,156,255,.8)]',
    subtitle: 'text-white/85 text-[13px] mt-2 leading-snug',
    button:
      'inline-block mt-3 rounded-xl bg-sky-400/90 hover:bg-sky-300 text-black text-[13px] font-semibold px-3.5 py-2 shadow-[0_10px_30px_rgba(56,189,248,.5)] transition',
  },
  minimal: {
    card:
      'relative aspect-[9/16] overflow-hidden rounded-[18px] mb-5 shadow-[0_12px_38px_rgba(0,0,0,.45)] ring-1 ring-white/10',
    overlay: 'absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent',
    contentBox: 'absolute inset-x-0 bottom-0 p-5',
    title: 'text-white font-medium text-[20px] leading-tight',
    subtitle: 'text-white/80 text-[12px] mt-2',
    button:
      'inline-block mt-3 rounded-lg bg-white text-black text-[12px] font-medium px-3 py-1.5 shadow-md hover:shadow-lg transition',
  },
}

function pickTheme(key?: string | null): Theme {
  const k = (key || 'classic').toLowerCase() as TemplateKey
  return THEMES[k] ?? THEMES.classic
}

export default async function WebstoryPreview({
  params,
}: { params: { slug: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE

  if (!url || !key) notFound()
  const supabase = createClient(url!, key!, { auth: { persistSession: false } })

  const { data, error } = await supabase
    .from('webstories')
    .select('slug,title,publisher,publisher_logo,poster_portrait,pages,published,canonical_url,template')
    .eq('slug', params.slug)
    .maybeSingle()

  if (error || !data) notFound()

  const pages: Pg[] = Array.isArray((data as any).pages) ? (data as any).pages : []
  const theme = pickTheme((data as any).template)

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="mx-auto max-w-sm px-3 py-4 flex items-center gap-2">
        {data.publisher_logo && (
          <img
            src={data.publisher_logo}
            alt={data.publisher}
            className="h-6 w-6 rounded"
          />
        )}
        <h1 className="text-sm text-white/80 line-clamp-1">{data.title}</h1>
      </header>

      <section className="mx-auto max-w-sm px-3 pb-12">
        {pages.map((pg) => {
          const bg = pg.bg || pg.image?.url || ''
          return (
            <article key={pg.id} className={theme.card}>
              {!!bg && (
                <img
                  src={bg}
                  alt={pg.heading}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className={theme.overlay} />
              <div className={theme.contentBox}>
                <h2 className={theme.title}>{pg.heading}</h2>
                {pg.sub && <p className={theme.subtitle}>{pg.sub}</p>}
                {pg.cta_url && pg.cta_label && (
                  <a href={pg.cta_url} className={theme.button}>
                    {pg.cta_label}
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}