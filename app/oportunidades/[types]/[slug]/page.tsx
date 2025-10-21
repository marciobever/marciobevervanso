import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Params = { type: 'empregos'|'concursos'|'beneficios'; slug: string }

async function getPost(type: string, slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || ''
  const res = await fetch(`${base}/api/dashboard/posts/list?type=${encodeURIComponent(type)}&slug=${encodeURIComponent(slug)}&limit=1`, { cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  const item = data?.items?.[0]
  return item || null
}

export default async function Page({ params }: { params: Params }) {
  const post = await getPost(params.type, params.slug)
  if (!post) return notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <article>
        <header className="mb-6">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{params.type}</div>
          <h1 className="text-3xl font-black">{post.title}</h1>
          {post.excerpt && <p className="mt-2 text-slate-600">{post.excerpt}</p>}
          {post.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt={post.title} className="mt-4 w-full rounded-xl border" />
          )}
        </header>

        {/* conteúdo HTML vindo do banco */}
        <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: post.content_html || '' }} />

        {/* metadados extras */}
        {(post.extras || post.flags) && (
          <aside className="mt-8 rounded-xl border bg-white p-4 text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              {post.extras?.company && <div><b>Empresa/Órgão:</b> {post.extras.company}</div>}
              {post.extras?.location && <div><b>Localidade:</b> {post.extras.location}</div>}
              {post.extras?.salary && <div><b>Faixa salarial:</b> {post.extras.salary}</div>}
              {post.extras?.deadline && <div><b>Prazo:</b> {post.extras.deadline}</div>}
            </div>
            {post.extras?.source_url && (
              <div className="mt-3 text-slate-500">
                Fonte monitorada internamente.
              </div>
            )}
          </aside>
        )}
      </article>
    </main>
  )
}
