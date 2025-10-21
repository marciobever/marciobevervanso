// app/empregos/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getJob(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const db = createClient(url, key, { auth: { persistSession: false } })

  const { data, error } = await db.from('jobs').select('*').eq('id', id).single()
  if (error || !data) return null
  return data
}

export default async function JobDetail({ params }: { params: { id: string } }) {
  const job = await getJob(params.id)
  if (!job) return notFound()

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl md:text-3xl font-black">{job.role || job.title}</h1>
      <p className="text-slate-600 mt-1">
        {job.location ?? 'Brasil'} • {job.type ?? '—'} {job.deadline ? `• até ${job.deadline}` : ''}
      </p>

      {job.description && (
        <article
          className="prose prose-slate mt-6"
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      )}

      {!job.description && job.link && (
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-6 rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white"
        >
          Candidatar / Ver vaga original
        </a>
      )}
    </main>
  )
}
