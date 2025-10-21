// app/calculadoras/juros-simples/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Container, Glass, Pill } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'
import { Percent } from 'lucide-react'

function clamp(n: number, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(max, Math.max(min, n))
}
function money(n: number) {
  try { return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
  catch { return `R$ ${Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00'}` }
}

export default function JurosSimplesPage() {
  const [principal, setPrincipal] = useState(5_000)
  const [rateAA, setRateAA] = useState(12)
  const [months, setMonths] = useState(18)
  const [pmt, setPmt] = useState(0)

  const iM = useMemo(() => clamp(rateAA, 0) / 100 / 12, [rateAA])
  const n  = useMemo(() => Math.max(0, Math.floor(months)), [months])

  const jurosSimples = useMemo(() => clamp(principal, 0) * iM * n, [principal, iM, n])
  const investido = useMemo(() => clamp(principal, 0) + clamp(pmt, 0) * n, [principal, pmt, n])
  const fv = useMemo(() => clamp(principal, 0) + jurosSimples + clamp(pmt, 0) * n, [principal, jurosSimples, pmt, n])
  const taxaTotalPct = useMemo(() => iM * n * 100, [iM, n])

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill>
                <Percent className="mr-1 h-3.5 w-3.5" aria-hidden />
                Calculadora de Juros Simples
              </Pill>
              <span className="text-sm text-slate-500">
                Modelo didático: juros apenas sobre o capital inicial, proporcionais ao tempo.
              </span>
            </div>

            <h1 className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-black leading-tight text-slate-900">
              Quanto rende no regime de juros simples?
            </h1>
            <p className="text-slate-600 md:text-base">
              Em <strong>juros simples</strong>, os juros incidem somente sobre o capital inicial (<em>P</em>), sem capitalização.
              Fórmula: <code className="rounded bg-slate-50 px-1">I = P × i × n</code>, onde <em>i</em> é a taxa por período e <em>n</em> o número de períodos.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Capital inicial (R$)">
                <NumberInput value={principal} onChange={setPrincipal} min={0} step={250} />
                <Range value={principal} min={0} max={500000} step={250} onChange={setPrincipal} />
              </Field>

              <Field label="Taxa nominal (% a.a.)">
                <NumberInput value={rateAA} onChange={setRateAA} min={0} max={100} step={0.1} suffix="%" />
                <Range value={rateAA} min={0} max={100} step={0.1} onChange={setRateAA} />
                <p className="mt-1 text-[12px] text-slate-500">
                  Equivalente simples mensal: <strong>{(iM * 100).toFixed(3)}% a.m.</strong>
                </p>
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Tempo (meses)">
                <NumberInput value={months} onChange={setMonths} min={0} max={600} step={1} />
                <Range value={months} min={0} max={600} step={1} onChange={setMonths} />
                <p className="mt-1 text-[12px] text-slate-500">Total: <strong>{n}</strong> mês(es)</p>
              </Field>

              <Field label="Aporte mensal (opcional, sem juros neste modelo)">
                <NumberInput value={pmt} onChange={setPmt} min={0} step={50} />
                <Range value={pmt} min={0} max={20000} step={50} onChange={setPmt} />
              </Field>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Juros simples do período"
                items={[
                  ['Capital (P)', money(principal)],
                  ['Taxa total sobre P', `${taxaTotalPct.toFixed(2)}%`],
                ]}
                emphasis={money(jurosSimples)}
                emphasisLabel="Juros (I = P × i × n)"
              />

              <ResultCard
                title="Valor futuro (modelo simples)"
                items={[
                  ['Total investido (P + aportes)', money(investido)],
                ]}
                emphasis={money(fv)}
                emphasisLabel="Valor ao final"
              />
            </div>

            <HintCard>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                <li>Em juros simples, não há <strong>capitalização</strong>. Para juros sobre juros, use a calculadora de <strong>juros compostos</strong>.</li>
                <li>Os <em>aportes mensais</em> aqui entram sem remuneração (modelo didático). Se você quiser que rendam, prefira o regime composto.</li>
                <li>Taxas reais líquidas e impostos podem alterar o resultado prático.</li>
              </ul>
            </HintCard>
          </section>

          {/* Compartilhar + Ad */}
          <SocialShare
            title="Calculadora de Juros Simples • Mapa do Crédito"
            summary="Simule juros simples sobre o capital inicial, com opção de aportes mensais sem remuneração, e veja o valor final."
            tags={['MapaDoCredito','JurosSimples','FinancasPessoais','EducacaoFinanceira']}
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

/* --- Subcomponentes locais --- */
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
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-slate-500">
          {suffix}
        </span>
      )}
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