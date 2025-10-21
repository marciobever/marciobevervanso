// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Search } from 'lucide-react'
import { Container, Pill } from '@/components/ui'
import BenefitQuizModal from '@/components/quiz/BenefitQuizModal'
import NewsletterSignup from '@/components/forms/NewsletterSignup'
import AdSlot from '@/components/ads/AdSlot'

/* ===== Helper: faixa de anúncio centralizada ===== */
function AdBand({ slot }: { slot: string }) {
  return (
    <div className="rounded-2xl border bg-white px-2 py-2">
      <div className="flex justify-center">
        {/* Sem w-full para respeitar o tamanho do criativo */}
        <AdSlot slot={slot} className="inline-block" style={{ minHeight: 90 }} />
      </div>
    </div>
  )
}

/* ===== Calculadoras (fixo: 3 escolhidas) ===== */
function CalculatorsTiles() {
  const calcs = [
    {
      title: 'Estimador Bolsa Família',
      desc: 'Veja se você tem direito e quanto pode receber',
      href: '/calculadoras/bolsa-familia-estimador',
    },
    {
      title: 'Simulador de Benefícios',
      desc: 'Compare benefícios sociais e entenda seus direitos',
      href: '/calculadoras/beneficios',
    },
    {
      title: 'Calculadora Casa Própria',
      desc: 'Planeje a compra da sua casa e simule parcelas',
      href: '/calculadoras/casa',
    },
  ]

  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Calculadoras</h2>
        <Link href="/calculadoras" className="text-sm font-medium text-blue-600 hover:underline">
          Ver todas
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {calcs.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="group rounded-2xl border bg-white p-5 transition hover:shadow-md"
          >
            <div className="text-lg font-bold">{it.title}</div>
            <div className="mt-1 text-sm text-slate-600">{it.desc}</div>
            <div className="mt-3 inline-block text-sm font-semibold text-blue-600 group-hover:underline">
              Acessar →
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ===== Categoria: 4 cards estáticos que abrem /posts?type=... ===== */
const CATEGORIES = [
  {
    slug: 'cartoes',
    title: 'Cartões',
    desc: 'Comparativos, guias e novidades de cartões.',
    img: 'https://supabase.seureview.com.br/storage/v1/object/public/mapadocredito//cartoes.png', // cartões/financeiro
  },
  {
    slug: 'beneficios',
    title: 'Benefícios',
    desc: 'Bolsa Família, Auxílio Gás, Tarifa Social e mais.',
    img: 'https://supabase.seureview.com.br/storage/v1/object/public/mapadocredito//beneficios.png', // mãos/apoio
  },
  {
    slug: 'empregos',
    title: 'Empregos',
    desc: 'Vagas confiáveis, currículos e entrevistas.',
    img: 'https://supabase.seureview.com.br/storage/v1/object/public/mapadocredito//empregos.png', // equipe no escritório
  },
  {
    slug: 'concursos',
    title: 'Concursos',
    desc: 'Editais, inscrições e calendários.',
    img: 'https://supabase.seureview.com.br/storage/v1/object/public/mapadocredito//concursos.png', // formatura
  },
] as const

function CategoryGrid() {
  return (
    <section className="mt-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={{ pathname: '/posts', query: { type: c.slug } }}
            prefetch={false}
            className="group overflow-hidden rounded-3xl border bg-white transition hover:shadow-xl"
            aria-label={`Abrir categoria ${c.title}`}
          >
            <div className="relative aspect-[3/4] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.img}
                alt={c.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                {c.title}
              </span>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-lg font-extrabold text-slate-900">{c.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.desc}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-sky-700 group-hover:underline">
                Ver categoria →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ===== WebStories (reais, via API) ===== */
function WebstoriesFromDb({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let abort = false
    ;(async () => {
      try {
        const r = await fetch(`/api/webstories/list?limit=${limit}`, { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (!abort) setItems((j?.items || []).filter(Boolean))
      } catch {
        if (!abort) setItems([])
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => {
      abort = true
    }
  }, [limit])

  if (loading) {
    return (
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Web Stories</h2>
          <div className="h-4 w-20 rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (!items || items.length === 0) return null

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Web Stories</h2>
        <Link href="/webstories" className="text-sm font-medium text-blue-600 hover:underline">
          Ver mais
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {items.slice(0, limit).map((s: any) => (
          <Link
            key={s.slug}
            href={`/webstories/${s.slug}`}
            className="group block overflow-hidden rounded-2xl border bg-white ring-1 ring-black/10"
            prefetch={false}
          >
            <div className="relative aspect-[9/16] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.poster_portrait || 'https://picsum.photos/300/500'}
                alt={s.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="rounded-xl bg-gradient-to-t from-black/70 to-black/10 p-2.5 backdrop-blur-[1px] ring-1 ring-white/10">
                  <div className="line-clamp-2 text-white text-[12px] leading-tight">
                    {s.title}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

type Tab = 'jobs' | 'contests' | 'benefits'

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('jobs')

  const FALLBACK_JOBS = [
    { id: 'j1', role: 'Assistente Administrativo', location: 'Remoto', type: 'Remote' },
    { id: 'j2', role: 'Analista de Suporte', location: 'SP', type: 'Full' },
    { id: 'j3', role: 'Vendedor Interno', location: 'RJ', type: 'Part' },
  ]
  const FALLBACK_CONTESTS = [
    { id: 'c1', org: 'Banco Público', role: 'Atendimento', uf: 'BR' },
    { id: 'c2', org: 'TR Regional', role: 'Técnico Judiciário', uf: 'SP' },
    { id: 'c3', org: 'Prefeitura', role: 'Saúde', uf: 'RS' },
  ]
  const FALLBACK_BENEFITS = [
    { id: 'b1', slug: 'bolsa-familia-2025', title: 'Bolsa Família 2025: regras e valores', agency: 'MDS' },
    { id: 'b2', slug: 'auxilio-gas-2025', title: 'Auxílio Gás 2025: calendário e como receber', agency: 'Governo Federal' },
    { id: 'b3', slug: 'tarifa-social', title: 'Tarifa Social de Energia: desconto na conta de luz', agency: 'ANEEL' },
  ]

  const [jobs, setJobs] = useState<any[]>([])
  const [contests, setContests] = useState<any[]>([])
  const [benefits, setBenefits] = useState<any[]>([])

  useEffect(() => {
    let abort = false
    const get = async (path: string) => {
      try {
        const r = await fetch(`${path}?limit=3`, { cache: 'no-store' })
        if (!r.ok) throw new Error('bad status')
        const j = await r.json()
        return j?.items ?? []
      } catch {
        return []
      }
    }
    ;(async () => {
      const [j, c, b] = await Promise.all([
        get('/api/opportunities/jobs'),
        get('/api/opportunities/contests'),
        get('/api/opportunities/benefits'),
      ])
      if (!abort) {
        setJobs(j)
        setContests(c)
        setBenefits(b)
      }
    })()
    return () => {
      abort = true
    }
  }, [])

  const jobsList = jobs.length ? jobs : FALLBACK_JOBS
  const contestsList = contests.length ? contests : FALLBACK_CONTESTS
  const benefitsList = benefits.length ? benefits : FALLBACK_BENEFITS

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="absolute inset-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=1600&auto=format&fit=crop"
            alt=""
            className="h-full w-full object-cover opacity-35"
            loading="eager"
          />
          <div className="absolute inset-0 bg-[radial-gradient(90rem_60rem_at_120%_-20%,rgba(59,130,246,.25),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_-20%_120%,rgba(14,165,233,.20),transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 md:pb-14 md:pt-14 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.25fr_.95fr] md:gap-8">
            <div className="text-white">
              <Pill>
                <TrendingUp className="mr-1 h-3.5 w-3.5" aria-hidden /> Tudo que importa
              </Pill>

              <h1 className="mt-2 text-[clamp(2rem,5vw,3.6rem)] font-black leading-[1.05]">
                Finanças descomplicadas,
                <br className="hidden sm:block" />
                cartões comparados e
                <br className="hidden sm:block" />
                oportunidades reais
              </h1>

              <p className="mt-3 max-w-2xl text-slate-200/90 md:text-lg">
                Compare benefícios, encontre vagas e acompanhe concursos. Use nossas{' '}
                <Link href="/calculadoras" className="underline decoration-white/40 underline-offset-4 hover:decoration-white">
                  calculadoras
                </Link>{' '}
                para decidir melhor.
              </p>

              <form action="/buscar" className="mt-6 flex items-stretch gap-2" role="search" aria-label="Busca no site">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" aria-hidden />
                  <input
                    name="q"
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 pl-9 pr-3 text-white placeholder:text-slate-300/80 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-sky-500/30"
                    placeholder="Busque por cartão, vaga, concurso, guia…"
                    aria-label="Pesquisar termos"
                  />
                </div>
                <button className="h-12 whitespace-nowrap rounded-xl bg-sky-500 px-4 font-bold text-white shadow hover:bg-sky-600">
                  Pesquisar
                </button>
              </form>
            </div>

            <div className="flex items-start justify-start md:items-end md:justify-end">
              <div className="grid w-full max-w-xl grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/10 p-4 text-white">120+ Guias de cartões</div>
                <div className="rounded-xl bg-white/10 p-4 text-white">2.4k Vagas monitoradas</div>
                <div className="rounded-xl bg-white/10 p-4 text-white">300+ Concursos ativos</div>
                <div className="rounded-xl bg-white/10 p-4 text-white">8 Calculadoras</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AD: logo após hero ===== */}
      <Container>
        <section className="mt-10 md:mt-12 mb-8 md:mb-12">
          <AdBand slot="content_top" />
        </section>
      </Container>

      {/* ===== Destaques (categorias) ===== */}
      <Container>
        <CategoryGrid />
      </Container>

      {/* ===== Calculadoras ===== */}
      <CalculatorsTiles />

      {/* ===== Newsletter ===== */}
      <section className="mx-auto mt-12 max-w-4xl px-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-2 text-base font-semibold">Receba alertas de novos benefícios e vagas</div>
          <NewsletterSignup />
        </div>
      </section>

      {/* ===== Oportunidades ===== */}
      <Container>
        <section id="opportunities" className="mt-16">
          <h3 className="mb-5 text-2xl font-extrabold text-slate-900 md:text-3xl">Oportunidades</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {tab === 'jobs' &&
              jobsList.slice(0, 3).map((j) => (
                <div key={j.id} className="rounded-2xl border bg-white p-4">
                  <strong>{j.role}</strong>
                  <div className="text-sm text-slate-500">
                    {j.location} • {j.type}
                  </div>
                </div>
              ))}
            {tab === 'contests' &&
              contestsList.slice(0, 3).map((c) => (
                <div key={c.id} className="rounded-2xl border bg-white p-4">
                  <strong>
                    {c.org} – {c.role}
                  </strong>
                  <div className="text-sm text-slate-500">UF {c.uf}</div>
                </div>
              ))}
            {tab === 'benefits' &&
              benefitsList.slice(0, 3).map((b) => (
                <div key={b.slug || b.id} className="rounded-2xl border bg-white p-4">
                  <strong>{b.title}</strong>
                  <div className="text-sm text-slate-500">{b.agency}</div>
                </div>
              ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setTab('jobs')}
              className={`px-3 py-1 rounded ${tab === 'jobs' ? 'bg-sky-600 text-white' : 'bg-slate-200'}`}
            >
              Empregos
            </button>
            <button
              onClick={() => setTab('contests')}
              className={`px-3 py-1 rounded ${tab === 'contests' ? 'bg-sky-600 text-white' : 'bg-slate-200'}`}
            >
              Concursos
            </button>
            <button
              onClick={() => setTab('benefits')}
              className={`px-3 py-1 rounded ${tab === 'benefits' ? 'bg-sky-600 text-white' : 'bg-slate-200'}`}
            >
              Benefícios
            </button>
          </div>
        </section>
      </Container>

      {/* ===== AD: perto do rodapé ===== */}
      <Container>
        <section className="mt-12 mb-4">
          <AdBand slot="content_bottom" />
        </section>
      </Container>

      {/* ===== WebStories (reais) ===== */}
      <WebstoriesFromDb limit={5} />

      {/* ===== Quiz só via botão ===== */}
      <BenefitQuizModal key={0} openInitially={false} />
      <button
        aria-label="Descubra seus benefícios"
        onClick={() => window.dispatchEvent(new CustomEvent('open-quiz'))}
        className="fixed bottom-5 right-5 z-[70] rounded-full bg-sky-600 px-4 py-3 font-semibold text-white shadow-xl hover:bg-sky-700"
      >
        Descubra seus benefícios
      </button>
    </>
  )
}
