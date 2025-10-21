import { supaPublic } from '@/lib/supa-public'
import { slugify } from '@/lib/slugify'
import PostCard from '@/components/blog/PostCard'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const name = params.slug.replace(/-/g, ' ')
  return {
    title: `Categoria: ${name} • Mapa do Crédito`,
    description: `Posts da categoria ${name}.`
  }
}

export default async function CategoriaPage({ params }: { params: { slug: string } }) {
  const db = supaPublic()
  const { data } = await db
    .from('posts')
    .select('id,title,category,badge,image_url,content,slug,created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  // match case-insensitive via slugify(category)
  const list =
    (data || [])
      .filter((p: any) => slugify(p.category || '') === params.slug)
      .map((p: any) => ({
        ...p,
        _slug: p.slug || slugify(p.title || '')
      })) || []

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight capitalize">
        {params.slug.replace(/-/g, ' ')}
      </h1>
      <p className="text-slate-600 text-sm mb-4">Artigos recentes desta categoria.</p>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((p: any) => (
          <PostCard
            key={p.id}
            href={`/posts/${p._slug}`}
            title={p.title}
            category={p.category}
            img={p.image_url}
            badge={p.badge}
          />
        ))}
      </section>
    </main>
  )
}
