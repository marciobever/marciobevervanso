// app/calculadoras/page.tsx
'use client'

import Link from 'next/link'
import {
  Users, LifeBuoy, Lightbulb,
  Briefcase, Gift, Wallet,
  FileText, Receipt,
  BadgePercent, Calculator, Wrench, Plane,
  Home, Tag as TagIcon,
  LineChart, BarChart2, Banknote
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// ⚠️ Removido: import AdSlot from '@/components/ads/AdSlot'

type Tag =
  | 'Benefícios'
  | 'Trabalho'
  | 'Impostos'
  | 'Cartões'
  | 'Crédito'
  | 'Educação Financeira'

type Calc = {
  href: string
  title: string
  desc: string
  tag: Tag
  icon: LucideIcon
  new?: boolean
}

/* =========================
   Fonte de dados
========================= */
const ALL: Calc[] = [
  // Benefícios
  { href: '/calculadoras/bolsa-familia-estimador', title: 'Estimador Bolsa Família', desc: 'Veja se você tem direito e quanto pode receber.', icon: Users, tag: 'Benefícios', new: true },
  { href: '/calculadoras/beneficios',              title: 'Simulador de Benefícios', desc: 'Compare benefícios sociais e entenda seus direitos.', icon: LifeBuoy, tag: 'Benefícios' },
  { href: '/calculadoras/aneel-tarifa-social',     title: 'Tarifa Social de Energia', desc: 'Estimativa de desconto na conta de luz.', icon: Lightbulb, tag: 'Benefícios', new: true },

  // Trabalho
  { href: '/calculadoras/fgts-rescisao',  title: 'FGTS na Rescisão', desc: 'Calcule o valor estimado do saque ao ser desligado.', icon: Briefcase, tag: 'Trabalho', new: true },
  { href: '/calculadoras/13-salario',     title: '13º Salário', desc: 'Cálculo proporcional do 13º.', icon: Gift, tag: 'Trabalho', new: true },
  { href: '/calculadoras/salario-liquido',title: 'Salário Líquido', desc: 'Do bruto ao líquido (INSS, IR e dependentes).', icon: Wallet, tag: 'Trabalho', new: true },

  // Impostos
  { href: '/calculadoras/inss-salario', title: 'INSS por Faixa', desc: 'Desconto de INSS conforme a faixa salarial.', icon: FileText, tag: 'Impostos', new: true },
  { href: '/calculadoras/irpf-salario', title: 'IRPF Mensal', desc: 'Estimativa do IR em folha com deduções básicas.', icon: Receipt, tag: 'Impostos', new: true },

  // Cartões
  { href: '/calculadoras/cashback-vs-pontos',      title: 'Cashback x Pontos', desc: 'Descubra qual rende mais no seu perfil.', icon: BadgePercent, tag: 'Cartões', new: true },
  { href: '/calculadoras/rotativo-vs-parcelamento',title: 'Rotativo x Parcelamento', desc: 'Compare custo total e parcelas.', icon: Calculator, tag: 'Cartões', new: true },
  { href: '/calculadoras/cartao-minimo',           title: 'Mínimo do Cartão', desc: 'Impacto ao pagar só o valor mínimo.', icon: Wrench, tag: 'Cartões', new: true },
  { href: '/calculadoras/pontos',                  title: 'Pontos & Milhas', desc: 'Pontos por US$ e valor mensal/anual.', icon: Plane, tag: 'Cartões' },

  // Crédito
  { href: '/calculadoras/casa',        title: 'Casa Própria', desc: 'Planeje a compra e simule metas/parcelas.', icon: Home, tag: 'Crédito' },
  { href: '/calculadoras/consignado',  title: 'Consignado', desc: 'Parcela, prazo e custo efetivo total.', icon: TagIcon, tag: 'Crédito', new: true },

  // Educação Financeira
  { href: '/calculadoras/juros-compostos', title: 'Juros Compostos', desc: 'Aportes, taxa e tempo (tabela ano a ano).', icon: LineChart, tag: 'Educação Financeira' },
  { href: '/calculadoras/juros-simples',   title: 'Juros Simples', desc: 'Versão didática sem capitalização.', icon: BarChart2, tag: 'Educação Financeira', new: true },
  { href: '/calculadoras/renda-fixa',      title: 'Renda Fixa (CDB/Poupança)', desc: 'Projeção líquida com IR regressivo.', icon: Banknote, tag: 'Educação Financeira' },
]

const ORDER: Tag[] = ['Benefícios','Trabalho','Impostos','Cartões','Crédito','Educação Financeira']
const TITLE: Record<Tag, string> = {
  'Benefícios': 'Benefícios e programas',
  'Trabalho': 'Trabalho e salário',
  'Impostos': 'Impostos e contribuições',
  'Cartões': 'Cartões e vantagens',
  'Crédito': 'Crédito e financiamento',
  'Educação Financeira': 'Educação financeira',
}

/* =========================
   UI helpers
========================= */
function Chip({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
    >
      {children}
    </a>
  )
}

function IconBubble({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 ring-1 ring-sky-100">
      <Icon className="h-6 w-6 text-sky-700" aria-hidden />
    </div>
  )
}
function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-[2px] text-[10px] font-semibold text-slate-600">
      {tag}
    </span>
  )
}
function CalcCard({ c }: { c: Calc }) {
  return (
    <Link
      href={c.href}
      className="group block overflow-hidden rounded-2xl border bg-white ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-xl hover:ring-sky-100"
      aria-label={`Abrir: ${c.title}`}
    >
      <div className="h-1 w-full bg-gradient-to-r from-slate-200 to-slate-100" />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <IconBubble Icon={c.icon} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[16.5px] font-extrabold text-slate-900">{c.title}</h3>
              {c.new && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-[2px] text-[10px] font-semibold text-emerald-700">
                  Novo
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.desc}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-sky-700 group-hover:underline">Abrir →</span>
          </div>
        </div>
        <div className="mt-4">
          <TagBadge tag={c.tag} />
        </div>
      </div>
    </Link>
  )
}
function CategorySection({ tag, items }: { tag: Tag; items: Calc[] }) {
  if (!items.length) return null
  return (
    <section className="mt-10" id={encodeURIComponent(tag)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl">{TITLE[tag]}</h2>
        <Link
          href={`/calculadoras#${encodeURIComponent(tag)}`}
          className="hidden text-sm font-medium text-sky-700 hover:underline md:inline"
        >
          Ver tudo
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <CalcCard key={c.href} c={c} />
        ))}
      </div>
    </section>
  )
}
function QuickNav() {
  return (
    <nav aria-label="Navegação por categorias" className="mt-4 overflow-x-auto">
      <ul className="flex gap-2 pb-1">
        {ORDER.map((tag) => (
          <li key={tag}><Chip href={`#${encodeURIComponent(tag)}`}>{tag}</Chip></li>
        ))}
      </ul>
    </nav>
  )
}

/* =========================
   Página
========================= */
export default function CalculadorasPage() {
  const grouped: Record<Tag, Calc[]> = ORDER.reduce((acc, tag) => {
    acc[tag] = ALL.filter((c) => c.tag === tag).slice(0, 4)
    return acc
  }, {} as Record<Tag, Calc[]>)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Hero */}
      <header className="mb-6">
        <div className="rounded-2xl border bg-gradient-to-br from-sky-50 to-cyan-50 p-6 ring-1 ring-sky-100">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Calculadoras
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-700">
            Simule benefícios, salário líquido, impostos, cartões, crédito e mais — tudo em um só lugar.
          </p>
          <QuickNav />
          {/* ⚠️ Removidos: ads mobile/top aqui */}
        </div>
      </header>

      {/* Somente conteúdo — o layout injeta a sidebar e os ads mobile */}
      {ORDER.map((tag) => (
        <CategorySection key={tag} tag={tag} items={grouped[tag]} />
      ))}

      {/* SEO copy curto */}
      <section className="mt-12 rounded-2xl border bg-white p-5 text-sm text-slate-600">
        Nossas calculadoras ajudam você a comparar cenários e tomar decisões melhores, sem fricção.
        Escolha uma categoria e comece agora.
      </section>

      {/* ⚠️ Removidos: ads mobile/bottom aqui */}
    </main>
  )
}
