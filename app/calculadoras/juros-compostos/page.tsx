// app/calculadoras/juros-compostos/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Container, Glass, Pill } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'
import { TrendingUp } from 'lucide-react'

function clamp(n: number, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(max, Math.max(min, n))
}
function money(n: number) {
  try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
  catch { return `R$ ${Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00'}` }
}

function futureValue({
  pv, pmt, months, rateMonthly, due = 'end',
}: { pv: number; pmt: number; months: number; rateMonthly: number; due?: 'begin' | 'end' }) {
  const n = Math.max(0, Math.floor(months))
  const i = Math.max(0, rateMonthly)
  const growthPV = pv * Math.pow(1 + i, n)
  if (i === 0) return growthPV + pmt * n
  const factor = (Math.pow(1 + i, n) - 1) / i
  const dueBoost = due === 'begin' ? (1 + i) : 1
  return growthPV + pmt * factor * dueBoost
}

export default function JurosCompostosPage() {
  const [pv, setPv] = useState(5000)
  const [pmt, setPmt] = useState(500)
  const [years, setYears] = useState(5)
  const [rateAA, setRateAA] = useState(9)
  const [due, setDue] = useState<'begin' | 'end'>('end')
  const [inflAA, setInflAA] = useState(0)

  const months = useMemo(() => Math.max(1, Math.floor(years * 12)), [years])
  const i = useMemo(() => clamp(rateAA, 0) / 100 / 12, [rateAA])
  const effAA = useMemo(() => (Math.pow(1 + i, 12) - 1) * 100, [i])
  const effAM = useMemo(() => i * 100, [i])
  const inflM = useMemo(() => (clamp(inflAA, 0) / 100) / 12, [inflAA])

  const fvNominal = useMemo(
    () => futureValue({ pv: clamp(pv, 0), pmt: clamp(pmt, 0), months, rateMonthly: i, due }),
    [pv, pmt, months, i, due]
  )
  const invested = useMemo(() => clamp(pv, 0) + clamp(pmt, 0) * months, [pv, pmt, months])
  const interest = useMemo(() => Math.max(0, fvNominal - invested), [fvNominal, invested])

  const fvReal = useMemo(() => {
    if (inflM <= 0) return fvNominal
    const deflator = Math.pow(1 + inflM, months)
    return fvNominal / deflator
  }, [fvNominal, inflM, months])

  const investedReal = useMemo(() => {
    if (inflM <= 0) return invested
    const acc = Array.from({ length: months }, (_, k) => k + 1).reduce((sum, m) => {
      return sum + (pmt / Math.pow(1 + inflM, m))
    }, pv)
    return acc
  }, [inflM, months, pmt, pv])

  const interestReal = useMemo(() => Math.max(0, fvReal - investedReal), [fvReal, investedReal])

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill>
                <TrendingUp className="mr-1 h-3.5 w-3.5" aria-hidden />
                Calculadora de Juros Compostos
              </Pill>
            </div>
            <h1 className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-black leading-tight text-slate-900">
              Quanto seu dinheiro pode crescer ao mês?
            </h1>
            <p className="text-slate-600 md:text-base">
              Depósitos no <strong>{due === 'end' ? 'fim' : 'início'}</strong> do mês, capitalização mensal.
              Use a inflação para ver o poder de compra ao final.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Capital inicial (R$)">
                <NumberInput value={pv} onChange={setPv} min={0} step={250} />
                <Range value={pv} min={0} max={200000} step={250} onChange={setPv} />
              </Field>
              <Field label="Aporte mensal (R$)">
                <NumberInput value={pmt} onChange={setPmt} min={0} step={50} />
                <Range value={pmt} min={0} max={20000} step={50} onChange={setPmt} />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Tempo (anos)">
                <NumberInput value={years} onChange={setYears} min={0.5} max={50} step={0.5} />
                <Range value={years} min={0.5} max={50} step={0.5} onChange={setYears} />
                <p className="mt-1 text-[12px] text-slate-500">Total: <strong>{months}</strong> meses</p>
              </Field>
              <Field label="Taxa nominal (% a.a.)">
                <NumberInput value={rateAA} onChange={setRateAA} min={0} max={60} step={0.1} suffix="%" />
                <Range value={rateAA} min={0} max={60} step={0.1} onChange={setRateAA} />
                <p className="mt-1 text-[12px] text-slate-500">
                  Efetiva: <strong>{effAA.toFixed(2)}% a.a.</strong> • Mensal: <strong>{effAM.toFixed(3)}% a.m.</strong>
                </p>
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Momento do aporte mensal">
                <Segmented
                  value={due}
                  onChange={(v) => setDue(v as typeof due)}
                  options={[
                    { value: 'end', label: 'Fim do mês' },
                    { value: 'begin', label: 'Início do mês' },
                  ]}
                />
              </Field>
              <Field label="Inflação estimada (% a.a.) — opcional">
                <NumberInput value={inflAA} onChange={setInflAA} min={0} max={30} step={0.1} suffix="%" />
                <Range value={inflAA} min={0} max={30} step={0.1} onChange={setInflAA} />
              </Field>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Resultado nominal"
                items={[
                  ['Total investido (PV + aportes)', money(invested)],
                  ['Juros acumulados', money(interest)],
                ]}
                emphasis={money(fvNominal)}
                emphasisLabel="Valor futuro"
              />
              <ResultCard
                title="Resultado “real” (descontada inflação)"
                items={[
                  ['Investido (valor de hoje, aprox.)', money(investedReal)],
                  ['Juros “reais” (aprox.)', money(interestReal)],
                ]}
                emphasis={money(fvReal)}
                emphasisLabel="Poder de compra no final"
              />
            </div>

            <HintCard>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                <li>Simulação didática: não considera impostos, taxas ou carências.</li>
                <li>Use taxa <strong>líquida</strong> para se aproximar de um cenário pós-impostos/custos.</li>
                <li>“Inflação” aqui é um ajuste simples para poder de compra.</li>
              </ul>
            </HintCard>
          </section>

          {/* Compartilhar + Ad */}
          <SocialShare
            title="Calculadora de Juros Compostos • Mapa do Crédito"
            summary="Simule capital inicial, aportes, tempo e taxa — compare valor nominal e poder de compra (descontando inflação)."
            tags={['MapaDoCredito','JurosCompostos','Investimentos','FinancasPessoais']}
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

/* --- Subcomponentes locais (inalterados) --- */
function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-700">{props.label}</div>
      <div className="space-y-2">{props.children}</div>
    </label>
  )
}

function NumberInput({
  value, onChange, min, max, step, suffix,
}: { value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(clamp(+e.target.value || 0, min ?? -Infinity, max ?? Infinity))}
        min={min} max={max} step={step}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 pr-12 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
      />
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-slate-500">{suffix}</span>}
    </div>
  )
}

function Range({ value, onChange, min, max, step }: { value: number; onChange: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <input
      type="range"
      className="w-full accent-sky-600"
      value={value} min={min} max={max} step={step}
      onChange={(e) => onChange(+e.target.value)}
    />
  )
}

function Segmented({
  value, onChange, options,
}: { value: string; onChange: (val: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border bg-white">
      {options.map((opt, idx) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={['px-3 py-2 text-sm font-semibold transition', active ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-50', idx !== options.length - 1 ? 'border-r' : ''].join(' ')}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ResultCard({ title, items, emphasis, emphasisLabel }: { title: string; items: Array<[string, string]>; emphasis?: string; emphasisLabel?: string }) {
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
    </div>
  )
}

function HintCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-white p-5">{children}</div>
}