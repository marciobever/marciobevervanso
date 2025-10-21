// app/calculadoras/casa/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Container, Glass, Pill } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'
import { Home } from 'lucide-react'

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

/** Meses para atingir a meta com depósitos no FIM de cada mês (anuidade ordinária) */
function monthsToGoal(goal: number, monthly: number, rateMonthly: number) {
  const P = monthly
  const i = rateMonthly
  if (P <= 0) return Infinity
  if (i <= 0) return Math.ceil(goal / P)
  const n = Math.log((goal * i) / P + 1) / Math.log(1 + i)
  if (!Number.isFinite(n) || n < 0) return Infinity
  return Math.ceil(n)
}

/** FV de depósitos mensais no FIM do mês, por n meses */
function futureValue(monthly: number, months: number, rateMonthly: number) {
  const P = monthly
  const n = Math.max(0, Math.floor(months))
  const i = rateMonthly
  if (i <= 0) return P * n
  return P * ((Math.pow(1 + i, n) - 1) / i)
}

/** Aporte mensal necessário para alcançar FV desejado em n meses */
function paymentForFV(goal: number, months: number, rateMonthly: number) {
  const n = Math.max(1, Math.floor(months))
  const i = rateMonthly
  if (i <= 0) return goal / n
  const fator = (Math.pow(1 + i, n) - 1) / i
  return goal / fator
}

/** Formata meses em "X anos e Y meses" */
function fmtDuration(m: number) {
  if (!Number.isFinite(m)) return '—'
  const meses = Math.max(0, Math.ceil(m))
  const anos = Math.floor(meses / 12)
  const rest = meses % 12
  if (anos > 0) {
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}${rest ? ` e ${rest} ${rest === 1 ? 'mês' : 'meses'}` : ''}`
  }
  return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
}

/* =========================
   Página
========================= */
export default function HouseSavingsPage() {
  // Entradas (defaults realistas)
  const [goal, setGoal] = useState(120_000)     // meta R$
  const [monthly, setMonthly] = useState(800)   // aporte mensal R$
  const [annualRate, setAnnualRate] = useState(6) // % a.a. bruto
  const [months, setMonths] = useState(60)      // horizonte alternativo (meses)

  // Derivados
  const i = useMemo(() => clamp(annualRate, 0) / 100 / 12, [annualRate])

  const timeToGoal = useMemo(() => monthsToGoal(clamp(goal, 0), clamp(monthly, 0), i), [goal, monthly, i])
  const fvHorizon  = useMemo(() => futureValue(clamp(monthly, 0), clamp(months, 0), i), [monthly, months, i])
  const needPerMonth = useMemo(() => paymentForFV(clamp(goal, 0), clamp(months, 0), i), [goal, months, i])

  const gap = useMemo(() => clamp(goal, 0) - fvHorizon, [goal, fvHorizon]) // >0 falta; <0 sobra

  const effMonthlyPct = useMemo(() => i * 100, [i])
  const effYearPct = useMemo(() => (Math.pow(1 + i, 12) - 1) * 100, [i]) // equivalente anual efetivo

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill>
                <Home className="mr-1 h-3.5 w-3.5" aria-hidden />
                Poupança para Casa Própria
              </Pill>
              <span className="text-sm text-slate-500">
                Em quanto tempo você chega à meta — e quanto acumula em um prazo fixo.
              </span>
            </div>
            <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black leading-tight text-slate-900">
              Planeje sua entrada com aportes mensais
            </h1>
            <p className="text-slate-600 md:text-base">
              Informe meta, aporte e taxa anual estimada. A calculadora considera depósitos no <strong>fim do mês</strong>
              (anuidade ordinária). Valores são estimativas — não consideram impostos/custos.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Meta (R$)">
                <NumberInput value={goal} onChange={setGoal} min={0} step={1000} />
                <Range value={goal} min={0} max={500000} step={1000} onChange={setGoal} />
              </Field>

              <Field label="Aporte mensal (R$)">
                <NumberInput value={monthly} onChange={setMonthly} min={0} step={50} />
                <Range value={monthly} min={0} max={10000} step={50} onChange={setMonthly} />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Taxa anual (bruta, % a.a.)">
                <NumberInput value={annualRate} onChange={setAnnualRate} min={0} max={20} step={0.1} />
                <Range value={annualRate} min={0} max={20} step={0.1} onChange={setAnnualRate} />
                <p className="mt-1 text-[12px] text-slate-500">
                  Equivalente: <strong>{effMonthlyPct.toFixed(3)}% a.m.</strong> • Efetiva:{' '}
                  <strong>{effYearPct.toFixed(2)}% a.a.</strong>
                </p>
              </Field>

              <Field label="Horizonte para projeção (meses)">
                <NumberInput value={months} onChange={setMonths} min={1} max={360} step={1} />
                <Range value={months} min={1} max={360} step={1} onChange={setMonths} />
                <p className="mt-1 text-[12px] text-slate-500">
                  Aporte necessário para atingir a meta nesse prazo:{' '}
                  <strong>{money(needPerMonth)}</strong>/mês
                </p>
              </Field>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Tempo até atingir a meta"
                items={[
                  ['Meta', money(goal)],
                  ['Aporte mensal', money(monthly)],
                ]}
                emphasis={fmtDuration(timeToGoal)}
                emphasisLabel="Prazo estimado"
              />

              <ResultCard
                title="Acúmulo no horizonte escolhido"
                items={[
                  ['Horizonte', fmtDuration(months)],
                  ['Aporte mensal', money(monthly)],
                ]}
                emphasis={money(fvHorizon)}
                emphasisLabel="Total acumulado"
                extra={<GapBadge gap={gap} goal={goal} />}
              />
            </div>

            <HintCard>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                <li>Considere reservar <strong>custos de cartório/ITBI</strong> e despesas de mudança além da entrada.</li>
                <li>Taxas reais líquidas podem ser menores após impostos; ajuste a taxa anual para um cenário conservador.</li>
                <li>Depósitos no <em>início</em> do mês aumentam o acúmulo — esta simulação usa fim do mês (mais conservadora).</li>
              </ul>
            </HintCard>
          </section>

          {/* Share + Ad */}
          <SocialShare
            title="Poupança para Casa Própria • Mapa do Crédito"
            summary="Calcule em quanto tempo chega à meta da entrada e quanto acumula em um prazo fixo, com aportes mensais e juros compostos."
            tags={['MapaDoCredito','CasaPropria','Poupanca','JurosCompostos']}
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
   Subcomponentes locais
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
  extra,
}: {
  title: string
  items: Array<[string, string]>
  emphasis?: string
  emphasisLabel?: string
  extra?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
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

function GapBadge({ gap, goal }: { gap: number; goal: number }) {
  if (!Number.isFinite(gap)) return null
  if (gap > 0) {
    const pct = goal > 0 ? (gap / goal) * 100 : 0
    return (
      <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700 ring-1 ring-amber-100">
        Falta {money(gap)} ({pct.toFixed(1)}% da meta)
      </div>
    )
  }
  if (gap < 0) {
    const sobra = Math.abs(gap)
    return (
      <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
        Você ultrapassa a meta em {money(sobra)}
      </div>
    )
  }
  return (
    <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[12px] font-semibold text-sky-700 ring-1 ring-sky-100">
      Na trave: exatamente em linha com a meta
    </div>
  )
}