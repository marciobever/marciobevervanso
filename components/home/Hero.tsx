// components/home/Hero.tsx
'use client'

import Link from 'next/link'
import {
  CreditCard,
  Briefcase,
  Trophy,
  Calculator,
  TrendingUp,
  Search,
  type LucideIcon, // <<< usa o tipo oficial
} from 'lucide-react'

// Pill local que aceita className
function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border'
  return <span className={`${base} ${className ?? ''}`}>{children}</span>
}

// Ícone + métrica compactos (vidro)
function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon // <<< aqui
  value: string
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md px-3 py-2 text-white shadow-sm">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
        <Icon size={18} /> {/* Lucide aceita number | string, 18 está ok */}
      </div>
      <div className="leading-tight">
        <div className="text-lg font-extrabold">{value}</div>
        <div className="text-[11px] opacity-80">{label}</div>
      </div>
    </div>
  )
}

export default function Hero() {
  // troque por uma imagem mais on-brand quando quiser
  const heroImg =
    'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=1600&auto=format&fit=crop'

  return (
    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Finanças e oportunidades"
          className="h-full w-full object-cover opacity-35"
          loading="eager"
        />
        {/* Vignettes/gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(90rem_60rem_at_120%_-20%,rgba(59,130,246,.25),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_-20%_120%,rgba(14,165,233,.20),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 grid gap-6 p-6 md:grid-cols-2 md:p-10">
        {/* Left column */}
        <div className="text-white">
          <Pill className="mb-3 bg-white/10 text-white border-white/20">
            <TrendingUp className="mr-1 h-3.5 w-3.5" /> Tudo que importa
          </Pill>

          <h1 className="text-4xl font-black leading-[1.05] md:text-5xl">
            Finanças descomplicadas, cartões comparados e oportunidades reais
          </h1>

          <p className="mt-3 max-w-xl text-slate-200/90">
            Compare benefícios, encontre vagas e acompanhe concursos. Use nossas
            calculadoras para decidir melhor.
          </p>

          {/* Search */}
          <form action="/buscar" className="mt-6 flex items-stretch gap-2" role="search">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input
                name="q"
                className="h-12 w-full rounded-xl border border-white/20 bg-white/10 pl-9 pr-3 text-white placeholder:text-slate-300/80 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-sky-500/30"
                placeholder="Busque por cartão, vaga, concurso, guia…"
              />
            </div>
            <button className="h-12 rounded-xl bg-sky-500 px-4 font-bold text-white shadow hover:bg-sky-600">
              Pesquisar
            </button>
          </form>

          {/* quick chips */}
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {['Empregos', 'Benefícios', 'Cartões', 'Concursos'].map((t) => (
              <Link
                key={t}
                href={`/buscar?q=${encodeURIComponent(t)}`}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-slate-100 hover:bg-white/15"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        {/* Right column – metrics bar */}
        <div className="flex flex-col justify-end">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
            <Metric icon={CreditCard} value="120+" label="Guias de cartões" />
            <Metric icon={Briefcase} value="2.4k" label="Vagas monitoradas" />
            <Metric icon={Trophy} value="300+" label="Concursos ativos" />
            <Metric icon={Calculator} value="8" label="Calculadoras" />
          </div>
        </div>
      </div>
    </section>
  )
}
