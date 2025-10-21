// app/guia/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { supaPublic } from '@/lib/supa-public'
import QuizAdSlot from '@/components/ads/QuizAdSlot'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type QuizPost = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  summary: string | null
  hero_image_url: string | null
  og_image_url: string | null
  canonical_url: string | null
  ad_top_mobile: string | null
  ad_top_desktop: string | null
  ad_inarticle: string | null
  content_md: string
  is_published: boolean
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const db = supaPublic()
  const { data } = await db
    .from('quiz_posts')
    .select('title, summary, og_image_url, canonical_url, is_published')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!data || !data.is_published) {
    return { title: 'Guia • Mapa do Crédito' }
  }

  return {
    title: data.title || 'Guia • Mapa do Crédito',
    description: data.summary || undefined,
    openGraph: {
      title: data.title || undefined,
      description: data.summary || undefined,
      images: data.og_image_url ? [{ url: data.og_image_url }] : undefined,
    },
    alternates: {
      canonical: data.canonical_url || undefined,
    },
  }
}

export default async function GuiaPage({ params }: { params: { slug: string } }) {
  const db = supaPublic()

  // Busca o post fixo publicado
  const { data: post, error } = await db
    .from('quiz_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .maybeSingle<QuizPost>()

  if (error || !post) return notFound()

  const {
    title,
    subtitle,
    summary,
    hero_image_url,
    ad_top_mobile,
    ad_top_desktop,
    ad_inarticle,
    content_md,
  } = post

  // Quebra o markdown nos marcadores de anúncios
  // Marcadores válidos no conteúdo: <!-- AD:TOP --> e <!-- AD:INARTICLE -->
  const TOP_TAG = '<!-- AD:TOP -->'
  const INARTICLE_TAG = '<!-- AD:INARTICLE -->'

  // Primeira injeção: AD:TOP (logo após o início)
  const [beforeTop, afterTopRaw] = content_md.split(TOP_TAG + '\n').length > 1
    ? content_md.split(TOP_TAG + '\n')
    : content_md.split(TOP_TAG)

  // Segunda injeção: AD:INARTICLE (um pouco mais abaixo)
  let beforeInArticle = afterTopRaw ?? content_md
  let afterInArticle: string | null = null
  if (beforeInArticle.includes(INARTICLE_TAG)) {
    const parts = beforeInArticle.split(INARTICLE_TAG + '\n')
    if (parts.length > 1) {
      beforeInArticle = parts[0]
      afterInArticle = parts.slice(1).join(INARTICLE_TAG + '\n')
    } else {
      const parts2 = beforeInArticle.split(INARTICLE_TAG)
      if (parts2.length > 1) {
        beforeInArticle = parts2[0]
        afterInArticle = parts2.slice(1).join(INARTICLE_TAG)
      }
    }
  }

  return (
    <main className="px-4 py-6">
      <article className="mx-auto w-full max-w-3xl">
        {/* HERO */}
        {hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero_image_url}
            alt=""
            className="mb-4 w-full rounded-2xl border border-slate-200 object-cover"
          />
        )}

        {/* Título */}
        <header className="mb-4">
          <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-slate-600">{subtitle}</p>
          )}
          {summary && (
            <p className="mt-2 text-sm text-slate-500">{summary}</p>
          )}
        </header>

        {/* AD TOP (mobile e desktop, travados) */}
        {(ad_top_mobile || ad_top_desktop) && (
          <div className="mb-5">
            <div className="md:hidden">
              <div className="rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                <QuizAdSlot slot={ad_top_mobile || ''} variant="mobile" />
              </div>
            </div>
            <div className="hidden md:block">
              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm w-[300px]">
                <QuizAdSlot slot={ad_top_desktop || ''} variant="custom" width={300} height={250} />
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo 1 (antes do AD:TOP) */}
        {beforeTop && (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{beforeTop}</ReactMarkdown>
          </div>
        )}

        {/* Conteúdo 2 (antes do AD:INARTICLE) */}
        {beforeInArticle && beforeInArticle !== beforeTop && (
          <div className="prose prose-slate max-w-none mt-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{beforeInArticle}</ReactMarkdown>
          </div>
        )}

        {/* AD INARTICLE */}
        {ad_inarticle && (
          <div className="my-5">
            <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm w-[300px] mx-auto">
              <QuizAdSlot slot={ad_inarticle} variant="custom" width={300} height={250} />
            </div>
          </div>
        )}

        {/* Conteúdo final (depois do AD:INARTICLE) */}
        {afterInArticle && (
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{afterInArticle}</ReactMarkdown>
          </div>
        )}
      </article>
    </main>
  )
}