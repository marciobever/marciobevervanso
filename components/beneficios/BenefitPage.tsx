// components/beneficios/BenefitPage.tsx
import Link from "next/link"
import AdSlot from "@/components/ads/AdSlot"

// Blocos opcionais
export type Step = { title: string; detail?: string }
export type DocItem = { name: string; hint?: string }
export type LinkItem = { label: string; href: string }

export type ComparisonRow = { label: string; optionA: string; optionB: string }
export type Quote = { text: string; author?: string; role?: string }

export type BenefitContent = {
  slug: string
  title: string
  summary: string
  category?: string // "renda" | "contas" | "moradia" | ...
  hero?: { image?: string; caption?: string } // URL absoluta ou caminho público
  valueInfo?: string // destaque de valor/percentual sem número rígido
  audience: string // público-alvo em 1 parágrafo
  eligibility: string[] // bullets
  steps: Step[]
  docs: DocItem[]
  whereToApply?: string // 1 parágrafo claro
  importantNotes?: string[] // bullets
  faqs?: { q: string; a: string }[]
  sources?: LinkItem[] // links oficiais
  ctas?: { label: string; href: string }[]
  quotes?: Quote[]
  comparison?: { title: string; optionA: string; optionB: string; rows: ComparisonRow[] }
}

export default function BenefitPage({ c }: { c: BenefitContent }) {
  const kind = (c.category || "beneficios").toLowerCase()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* breadcrumb */}
      <div className="mb-3 text-sm text-slate-500">
        <Link href="/" className="hover:underline">Início</Link> <span className="mx-1">/</span>
        <Link href="/posts/beneficios" className="hover:underline">Benefícios</Link> <span className="mx-1">/</span>
        <span>{c.title}</span>
      </div>

      {/* AD topo */}
      <div className="mb-6">
        <AdSlot slot="content_top" />
      </div>

      {/* Hero */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold leading-tight">{c.title}</h1>
        <p className="mt-2 text-slate-600">{c.summary}</p>
        {c.hero?.image && (
          <figure className="mt-5 overflow-hidden rounded-2xl border bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.hero.image} alt={c.title} className="w-full h-auto object-cover" />
            {c.hero.caption && <figcaption className="px-3 py-2 text-xs text-slate-500">{c.hero.caption}</figcaption>}
          </figure>
        )}
      </header>

      {/* Destaque/valor */}
      {c.valueInfo && (
        <div className="mt-5 rounded-2xl border bg-emerald-50 p-4 text-emerald-900">
          <strong>Resumo do que você pode ganhar:</strong> {c.valueInfo}
        </div>
      )}

      {/* Público e critérios */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Quem pode receber</h2>
        <p className="mt-1 text-slate-700">{c.audience}</p>
        <ul className="mt-3 grid list-disc gap-2 pl-5 text-slate-700">
          {c.eligibility.map((li, i) => <li key={i}>{li}</li>)}
        </ul>
      </section>

      {/* Citações */}
      {c.quotes?.length ? (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Na prática</h2>
          <div className="mt-3 grid gap-3">
            {c.quotes.map((q, i) => (
              <blockquote key={i} className="rounded-xl border bg-white p-4">
                <p className="text-slate-800 italic">“{q.text}”</p>
                {(q.author || q.role) && (
                  <footer className="mt-2 text-sm text-slate-500">
                    {q.author}{q.role ? ` — ${q.role}` : ""}
                  </footer>
                )}
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      {/* AD no meio */}
      <div className="my-6">
        <AdSlot slot="inarticle" />
      </div>

      {/* Comparação */}
      {c.comparison && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">{c.comparison.title}</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-600">Critério</th>
                  <th className="px-3 py-2 text-left">{c.comparison.optionA}</th>
                  <th className="px-3 py-2 text-left">{c.comparison.optionB}</th>
                </tr>
              </thead>
              <tbody>
                {c.comparison.rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 text-slate-700">{r.label}</td>
                    <td className="px-3 py-2">{r.optionA}</td>
                    <td className="px-3 py-2">{r.optionB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Passo a passo */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Como pedir (passo a passo)</h2>
        <ol className="mt-3 grid gap-3 pl-5 text-slate-700 list-decimal">
          {c.steps.map((s, i) => (
            <li key={i}>
              <strong>{s.title}</strong>
              {s.detail && <span> — {s.detail}</span>}
            </li>
          ))}
        </ol>
      </section>

      {/* Documentos */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Documentos necessários</h2>
        <ul className="mt-3 grid gap-2 pl-5 list-disc text-slate-700">
          {c.docs.map((d, i) => (
            <li key={i}>
              {d.name} {d.hint && <span className="text-slate-500">({d.hint})</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* Onde solicitar */}
      {c.whereToApply && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Onde solicitar</h2>
          <p className="mt-1 text-slate-700">{c.whereToApply}</p>
        </section>
      )}

      {/* Notas importantes */}
      {c.importantNotes?.length ? (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Atenção</h2>
          <ul className="mt-2 grid gap-2 pl-5 list-disc text-slate-700">
            {c.importantNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      ) : null}

      {/* FAQs */}
      {c.faqs?.length ? (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Perguntas frequentes</h2>
          <div className="mt-3 grid gap-4">
            {c.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border p-3 bg-white">
                <div className="font-medium">{f.q}</div>
                <div className="text-slate-700">{f.a}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Fontes oficiais */}
      {c.sources?.length ? (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">Fontes oficiais</h2>
          <ul className="mt-2 grid gap-2 pl-5 list-disc">
            {c.sources.map((l, i) => (
              <li key={i}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* CTAs */}
      {c.ctas?.length ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {c.ctas.map((cta, i) => (
            <a
              key={i}
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              {cta.label}
            </a>
          ))}
        </div>
      ) : null}

      {/* AD final */}
      <div className="mt-8">
        <AdSlot slot="content_bottom" />
      </div>
    </div>
  )
}
