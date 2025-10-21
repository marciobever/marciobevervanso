// app/concursos/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getContest(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const db = createClient(url, key, { auth: { persistSession: false } })

  const { data, error } = await db.from('contests').select('*').eq('id', id).single()
  if (error || !data) return null
  return data
}

export default async function ContestDetail({ params }: { params: { id: string } }) {
  const contest = await getContest(params.id)
  if (!contest) return notFound()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl md:text-3xl font-black">
        {contest.org}{contest.role ? ` – ${contest.role}` : ''}
      </h1>
      <p className="text-slate-600 mt-1">
        UF {contest.uf ?? '—'} {contest.deadline ? `• até ${contest.deadline}` : ''}
      </p>

      {contest.description && (
        <article
          className="prose prose-slate mt-6"
          dangerouslySetInnerHTML={{ __html: contest.description }}
        />
      )}

      {contest.edital_url && (
        <a
          href={contest.edital_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-6 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
        >
          Abrir edital
        </a>
      )}
    </main>
  )
}
