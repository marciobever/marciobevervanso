// app/calculadoras/bolsa-familia-estimador/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Container, Glass, Pill } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'
import { Users, Baby, HeartPulse, Scale } from 'lucide-react'

/* =========================
   Parâmetros (ajuste quando houver atualização oficial)
========================= */
const BASE_MIN = 600        // benefício base por família
const EXTRA_0A6 = 150       // por criança 0–6
const EXTRA_7A18 = 50       // por criança/adolescente 7–18
const EXTRA_GESTANTE = 50   // por gestante
const LIMITE_RENDA_PC = 218 // renda per capita (hipossuficiência)

/* =========================
   Helpers
========================= */
function clamp(n: number, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(max, Math.max(min, n))
}
function money(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00'}`
  }
}

/* =========================
   Página
========================= */
export default function BolsaFamiliaEstimatorPage() {
  // Entradas
  const [pessoas, setPessoas] = useState(4)       // tamanho da família
  const [rendaTotal, setRendaTotal] = useState(1200)
  const [criancas06, setCriancas06] = useState(1)
  const [criancas718, setCriancas718] = useState(1)
  const [gestantes, setGestantes] = useState(0)

  // Derivados
  const pessoasSafe = useMemo(() => clamp(Math.floor(pessoas) || 0, 0, 30), [pessoas])
  const rendaSafe = useMemo(() => clamp(+rendaTotal || 0, 0, 200_000), [rendaTotal])

  const rendaPc = useMemo(
    () => (pessoasSafe > 0 ? rendaSafe / pessoasSafe : 0),
    [rendaSafe, pessoasSafe]
  )

  const elegivel = rendaPc <= LIMITE_RENDA_PC

  const extras = useMemo(() => {
    const c0a6 = clamp(Math.floor(criancas06) || 0, 0, 20)
    const c7a18 = clamp(Math.floor(criancas718) || 0, 0, 20)
    const g = clamp(Math.floor(gestantes) || 0, 0, 10)
    return {
      c0a6,
      c7a18,
      g,
      total: c0a6 * EXTRA_0A6 + c7a18 * EXTRA_7A18 + g * EXTRA_GESTANTE,
    }
  }, [criancas06, criancas718, gestantes])

  const beneficio = useMemo(() => (elegivel ? BASE_MIN + extras.total : 0), [elegivel, extras.total])

  // Etiquetas de status
  const statusLabel = elegivel ? 'Provável elegibilidade' : 'Acima do limite'
  const statusClass = elegivel
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : 'bg-amber-50 text-amber-700 ring-amber-100'

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill>
                <Users className="mr-1 h-3.5 w-3.5" aria-hidden />
                Estimador — Bolsa Família
              </Pill>
              <span className="text-sm text-slate-500">
                Cálculo didático por renda per capita e composição familiar.
              </span>
            </div>
            <h1 className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-black leading-tight text-slate-900">
              Você se enquadra? Veja uma estimativa rápida
            </h1>
            <p className="text-slate-600 md:text-base">
              Este simulador considera <strong>renda por pessoa (R$ {LIMITE_RENDA_PC})</strong> e adicionais para
              crianças <strong>0–6</strong>, <strong>7–18</strong> e <strong>gestantes</strong>. Os valores podem mudar —
              confirme no <strong>gov.br/MDS/Caixa</strong>.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Pessoas no domicílio">
                <NumberInput value={pessoasSafe} onChange={setPessoas} min={1} max={30} step={1} />
                <Range value={pessoasSafe} min={1} max={12} step={1} onChange={setPessoas} />
                <p className="mt-1 text-[12px] text-slate-500">Inclua todos que moram na mesma casa, parentes ou não.</p>
              </Field>

              <Field label="Renda familiar total (R$)">
                <NumberInput value={rendaSafe} onChange={setRendaTotal} min={0} step={50} />
                <Range value={rendaSafe} min={0} max={10000} step={50} onChange={setRendaTotal} />
                <p className="mt-1 text-[12px] text-slate-500">Salários, bicos, pensões etc. (soma de todos).</p>
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Crianças 0–6 anos">
                <NumberInput value={extras.c0a6} onChange={setCriancas06} min={0} max={20} step={1} />
                <Range value={extras.c0a6} min={0} max={10} step={1} onChange={setCriancas06} />
              </Field>

              <Field label="Crianças/adolescentes 7–18">
                <NumberInput value={extras.c7a18} onChange={setCriancas718} min={0} max={20} step={1} />
                <Range value={extras.c7a18} min={0} max={10} step={1} onChange={setCriancas718} />
              </Field>

              <Field label="Gestantes">
                <NumberInput value={extras.g} onChange={setGestantes} min={0} max={10} step={1} />
                <Range value={extras.g} min={0} max={5} step={1} onChange={setGestantes} />
              </Field>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Card 1: Renda per capita */}
              <ResultCard
                title="Renda per capita"
                icon={<Scale className="h-4 w-4" aria-hidden />}
                items={[
                  ['Pessoas no domicílio', String(pessoasSafe)],
                  ['Renda familiar', money(rendaSafe)],
                ]}
                emphasis={money(rendaPc)}
                emphasisLabel="R$ por pessoa"
                extra={
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${statusClass}`}>
                    {statusLabel}
                  </span>
                }
              />

              {/* Card 2: Benefício estimado */}
              <ResultCard
                title="Benefício estimado"
                icon={<Baby className="h-4 w-4" aria-hidden />}
                items={[
                  ['Base da família', money(BASE_MIN)],
                  ['0–6 anos', `${extras.c0a6} × ${money(EXTRA_0A6)}`],
                  ['7–18 anos', `${extras.c7a18} × ${money(EXTRA_7A18)}`],
                  ['Gestantes', `${extras.g} × ${money(EXTRA_GESTANTE)}`],
                ]}
                emphasis={money(beneficio)}
                emphasisLabel="Total mensal (estimado)"
              />
            </div>

            <HintCard>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                <li>Este é um <strong>estimador educativo</strong>. Condicionalidades (frequência escolar, vacinação etc.) podem influenciar.</li>
                <li>As regras e valores são <strong>atualizados pelo governo</strong>. Consulte o CRAS/Prefeitura, <strong>app Caixa Tem</strong> ou <strong>gov.br</strong>.</li>
                <li>Para saber outros programas, faça nosso <strong>quiz de benefícios</strong> na página inicial.</li>
              </ul>
            </HintCard>
          </section>

          {/* Share + Ad */}
          <SocialShare
            title="Estimador Bolsa Família • Mapa do Crédito"
            summary="Veja rapidamente se sua família se enquadra e qual o valor estimado do Bolsa Família, por renda per capita e composição."
            tags={['MapaDoCredito','BolsaFamilia','BeneficiosSociais']}
            variant="brand"
            size="md"
            compactOnMobile
          />

          <div className="pt-2">
            <div className="mx-auto max-w-sm">
              <AdSlot slot="4252785059" />
            </div>
          </div>
        </Glass>
      </div>
    </Container>
  )
}

/* =========================
   Subcomponentes locais (mesmo look & feel das outras calculadoras)
========================= */
function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{props.label}</div>
      <div className="space-y-2">{props.children}</div>
    </label>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(clamp(+e.target.value || 0, min ?? -Infinity, max ?? Infinity))}
      min={min}
      max={max}
      step={step}
      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
    />
  )
}

function Range({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  step?: number
}) {
  return (
    <input
      type="range"
      className="w-full accent-sky-600"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(+e.target.value)}
    />
  )
}

function ResultCard({
  title,
  items,
  emphasis,
  emphasisLabel,
  icon,
  extra,
}: {
  title: string
  items: Array<[string, string]>
  emphasis?: string
  emphasisLabel?: string
  icon?: React.ReactNode
  extra?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-2 space-y-2 text-[13px] text-slate-700">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span>{k}</span>
            <strong className="text-slate-900">{v}</strong>
          </div>
        ))}
      </div>
      {emphasis && (
        <div className="mt-3">
          <div className="text-[12px] text-slate-600">{emphasisLabel || 'Resultado'}</div>
          <div className="text-2xl font-extrabold text-slate-900">{emphasis}</div>
        </div>
      )}
      {extra && <div className="mt-3">{extra}</div>}
    </div>
  )
}

function HintCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-white p-5">{children}</div>
}