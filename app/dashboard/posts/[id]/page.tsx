// app/dashboard/posts/[id]/page.tsx
import { createClient } from '@supabase/supabase-js'
import NextDynamic from 'next/dynamic'
import type { ComponentType } from 'react'

export const dynamic = 'force-dynamic'

// Tipo mínimo necessário aqui (sem depender do módulo interno)
type PostEditorPublicProps = {
  initial: any
}

// Loader retorna o componente default já tipado com as props públicas
const PostEditor = NextDynamic<PostEditorPublicProps>(
  () =>
    import('@/components/dashboard/PostEditor').then(
      (m) => m.default as unknown as ComponentType<PostEditorPublicProps>
    ),
  { ssr: false }
)

async function getPost(idOrSlug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const db = createClient(url, key, { auth: { persistSession: false } })

  const { data, error } = await db
    .from('posts')
    .select('*')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* PostEditor exige 'initial' obrigatória */}
      <PostEditor initial={post ?? null} />
    </div>
  )
}
