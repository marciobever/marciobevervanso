// app/dashboard/webstories/[slug]/page.tsx
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import NextDynamic from 'next/dynamic' // <- renomeado

export const dynamic = 'force-dynamic'

// carrega o componente client-side
const TemplateSelector = NextDynamic(() => import('@/components/TemplateSelector'), {
  ssr: false,
  loading: () => <div className="text-sm text-neutral-500">Carregando seletor…</div>,
})

export default async function WebstoryEditorPage({ params }: { params: { slug: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  if (!url || !anon) notFound()

  const supabase = createClient(url, anon, { auth: { persistSession: false } })
  const { data, error } = await supabase
    .from('webstories')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !data) notFound()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{data.title}</h1>
          <p className="text-sm text-gray-500">{data.slug}</p>
        </div>
        <Link
          href={`/webstories/${data.slug}`}
          target="_blank"
          className="rounded bg-black text-white px-3 py-1.5 text-sm"
        >
          Ver Story
        </Link>
      </div>

      {/* Seletor de template */}
      <TemplateSelector slug={data.slug} value={(data as any).template ?? 'classic'} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-md p-4 bg-white">
          <h2 className="font-semibold mb-2">Metadados</h2>
          <ul className="text-sm space-y-1">
            <li><b>Publisher:</b> {data.publisher}</li>
            <li><b>Publicado:</b> {data.published ? 'Sim' : 'Não'}</li>
            <li>
              <b>Poster:</b>{' '}
              <a className="text-blue-600 underline" href={data.poster_portrait} target="_blank">
                abrir
              </a>
            </li>
            {data.canonical_url && (
              <li>
                <b>Canonical:</b>{' '}
                <a className="text-blue-600 underline" href={data.canonical_url} target="_blank">
                  {data.canonical_url}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div className="border rounded-md p-4 bg-white">
          <h2 className="font-semibold mb-2">
            Slides ({Array.isArray(data.pages) ? data.pages.length : 0})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(data.pages || []).map((pg: any) => (
              <div key={pg.id} className="text-xs">
                <div className="relative aspect-[9/16] overflow-hidden rounded mb-1">
                  <img
                    src={pg.bg || pg.image?.url}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt={pg.heading}
                  />
                </div>
                <div className="font-medium truncate">{pg.id}</div>
                <div className="text-gray-500 truncate">{pg.heading}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}