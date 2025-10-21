// app/api/posts/[slug]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:category_id ( id, name, slug ),
      post_tags:post_tags(*, tag:tag_id(id, name, slug))
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (error || !post) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

  // normaliza tags
  const tags = (post.post_tags || []).map((pt: any) => pt.tag)
  delete post.post_tags

  return NextResponse.json({ ok: true, post: { ...post, tags } })
}
