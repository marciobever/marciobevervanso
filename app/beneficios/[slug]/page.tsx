// app/beneficios/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getBenefit(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const db = createClient(url, key, { auth: { persistSession: false } })

  // Busca no posts: published + (type='beneficios' OU category ilike 'benef%')
  const { data, error } = await db
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .or('type.eq.beneficios,category.ilike.Benef%')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data
}

export default async function BenefitDetail({ params }: { params: { slug: string } }) {
  const post = await getBenefit(params.slug)
  if (!post) return notFound()

  const cover = post.image_url || post.image || post.og_image || post.cover_url

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl md:text-4xl font-black">{post.title}</h1>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="mt-4 rounded-xl border" />
      )}
      {post.excerpt && <p className="text-slate-600 mt-3">{post.excerpt}</p>}

      <article
        className="prose prose-slate mt-6"
        dangerouslySetInnerHTML={{ __html: post.content_html || '' }}
      />
    </main>
  )
}
