// app/calculadoras/pontos/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Container, Glass, Pill } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'
import { Plane } from 'lucide-react'

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
export default function PointsCalcPage() {
  // Entradas com defaults realistas
  const [spend, setSpend] = useState(2500)   // gasto mensal (R$)
  const [usd, setUsd] = useState(5.2)        // cotação USD
  const [ppu, setPpu] = useState(1.5)        // pontos por US$
  const [cpm, setCpm] = useState(20)         // R$ por 1.000 pontos (valor conservador)

  // Derivados
  const ptsMonth = useMemo(() => (clamp(spend, 0) / clamp(usd, 0.0001)) * clamp(ppu, 0), [spend, usd, ppu])
  const ptsYear  = useMemo(() => ptsMonth * 12, [ptsMonth])

  // Valor estimado dos pontos
  // cpm = R$ por 1000 pontos → valor = (pts/1000) * cpm
  const valueMonth = useMemo(() => (ptsMonth / 1000) * clamp(cpm, 0), [ptsMonth, cpm])
  const valueYear  = useMemo(() => valueMonth * 12, [valueMonth])

  // “break-even” simples: qual CPM precisaria para valer X por mês/ano (opcionalmente mostramos a título didático)
  const cpmPara100ReaisMes = useMemo(() => (ptsMonth > 0 ? (100 / (ptsMonth / 1000)) : 0), [ptsMonth])

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill>
                <Plane className="mr-1 h-3.5 w-3.5" aria-hidden />
                Calculadora de Pontos/Milhas
              </Pill>
              <span className="text-sm text-slate-500">Projeção de acúmulo e valor estimado.</span>
            </div>

            <h1 className="text-[clamp(1.6rem,3.2vw,2.2rem)] font-black leading-tight text-slate-900">
              Quanto valem seus pontos?
            </h1>
            <p className="text-slate-600 md:text-base">
              Informe seu gasto mensal, a cotação do dólar utilizada pelo emissor, a taxa de acúmulo do seu cartão
              e um valor de referência para os pontos (<abbr title="R$ por 1.000 pontos">CPM</abbr>) para estimar
              o retorno mensal e anual.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Gasto mensal no cartão (R$)">
                <NumberInput value={spend} onChange={setSpend} min={0} step={50} />
                <Range value={spend} min={0} max={30000} step={100} onChange={setSpend} />
              </Field>

              <Field label="Pontos por US$ (pts/US$)">
                <NumberInput value={ppu} onChange={setPpu} min={0} max={10} step={0.1} />
                <Range value={ppu} min={0} max={10} step={0.1} onChange={setPpu} />
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Cotação USD usada pelo emissor">
                <NumberInput value={usd} onChange={setUsd} min={1} max={10} step={0.01} />
                <Range value={usd} min={3.5} max={7.5} step={0.01} onChange={setUsd} />
                <p className="mt-1 text-[12px] text-slate-500">
                  Dica: emissores costumam usar dólar turismo/banco com spread.
                </p>
              </Field>

              <Field label="Valor de referência (CPM: R$ por 1.000 pts)">
                <NumberInput value={cpm} onChange={setCpm} min={0} max={200} step={1} />
                <Range value={cpm} min={0} max={200} step={1} onChange={setCpm} />
                <p className="mt-1 text-[12px] text-slate-500">
                  Use 15–25 para transferências sem promoções; 30–45 para resgates longos com bônus.
                </p>
              </Field>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Acúmulo estimado"
                items={[
                  ['Pontos por mês', Math.round(ptsMonth).toLocaleString('pt-BR')],
                  ['Pontos por ano', Math.round(ptsYear).toLocaleString('pt-BR')],
                ]}
              />
              <ResultCard
                title="Valor estimado dos pontos"
                items={[
                  ['Valor/mês', money(valueMonth)],
                  ['Valor/ano', money(valueYear)],
                ]}
                emphasis={money(valueYear)}
                emphasisLabel="Retorno anual"
              />
            </div>

            <HintCard>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                <li>
                  <strong>CPM</strong> é sensível a promoções de transferência, disponibilidade de assentos e
                  programa parceiro. Ajuste conforme o seu cenário.
                </li>
                <li>
                  Para gerar ~<strong>R$ 100/mês</strong> com seus pontos, você precisaria de um CPM médio de{' '}
                  <strong>{cpmPara100ReaisMes.toFixed(1)}</strong>.
                </li>
                <li>
                  Alguns cartões pontuam <em>em R$</em> (ex.: 1,6 pt/R$); neste caso, converta para pts/US$ usando
                  a cotação média do emissor.
                </li>
              </ul>
            </HintCard>
          </section>

          {/* Share + Ad */}
          <SocialShare
            title="Calculadora de Pontos e Milhas • Mapa do Crédito"
            summary="Estime quantos pontos você acumula por mês/ano e o valor aproximado (CPM) — baseado em gasto, cotação e acúmulo."
            tags={['MapaDoCredito','Pontos','Milhas','Cartao']}
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
}: {
  title: string
  items: Array<[string, string]>
  emphasis?: string
  emphasisLabel?: string
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
          <div className="text-[12px] text-slate-600">{emphasisLabel || 'Total'}</div>
          <div className="text-2xl font-extrabold text-slate-900">{emphasis}</div>
        </div>
      )}
    </div>
  )
}

function HintCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      {children}
    </div>
  )
}