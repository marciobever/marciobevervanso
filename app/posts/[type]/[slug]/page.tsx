// app/posts/[type]/[slug]/page.tsx
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ArticleRouter from '@/components/article/ArticleRouter'

const supabase = createClient(
  String(process.env.NEXT_PUBLIC_SUPABASE_URL),
  String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  { auth: { persistSession: false } }
)

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

async function fetchBySlugOrId(slugOrId: string) {
  // 1) slug exato — published primeiro
  {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slugOrId)
      .eq('status', 'published')
      .maybeSingle()
    if (data) return data
  }
  // 2) slug exato — qualquer status (para não quebrar pré-visualização)
  {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slugOrId)
      .maybeSingle()
    if (data) return data
  }
  // 3) id exato (se for UUID)
  if (isUUID(slugOrId)) {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('id', slugOrId)
      .maybeSingle()
    if (data) return data
  }
  return null
}

export default async function PostPage({ params }: { params: { type: string; slug: string } }) {
  const post = await fetchBySlugOrId(params.slug)
  if (!post) notFound()

  return <ArticleRouter post={post as any} kindHint={params.type} />
}