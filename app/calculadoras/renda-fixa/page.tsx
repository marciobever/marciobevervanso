// app/calculadoras/renda-fixa/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Container, Glass, Pill } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'
import { Banknote } from 'lucide-react'

/* =========================
   Helpers
========================= */
type Produto = 'CDB' | 'LCI/LCA' | 'Poupança'

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

/** IR regressivo (CDB): 22,5% (≤180d), 20% (181–360), 17,5% (361–720), 15% (>720) */
function irCdb(days: number) {
  if (days <= 180) return 0.225
  if (days <= 360) return 0.20
  if (days <= 720) return 0.175
  return 0.15
}

/** FV com capital inicial + aportes mensais (fim do mês), capitalização mensal */
function futureValue(pv: number, pmt: number, months: number, rateMonthly: number) {
  const n = Math.max(0, Math.floor(months))
  const i = Math.max(0, rateMonthly)
  const growthPV = pv * Math.pow(1 + i, n)
  if (i === 0) return growthPV + pmt * n
  const factor = (Math.pow(1 + i, n) - 1) / i
  return growthPV + pmt * factor
}

/* =========================
   Página
========================= */
export default function RendaFixaPage() {
  // Entradas com defaults realistas
  const [produto, setProduto] = useState<Produto>('CDB')
  const [pv, setPv] = useState(5_000)         // aporte inicial
  const [pmt, setPmt] = useState(500)         // aporte mensal
  const [months, setMonths] = useState(24)    // prazo (meses)

  // Taxa anual bruta (% a.a.). Para Poupança, você pode sobrescrever manualmente.
  const [rateAA, setRateAA] = useState(12)    // % a.a. (bruto)

  // Para Poupança, taxa mensal padrão (0,5% a.m. ~ regra antiga; o usuário pode editar)
  const [poupAM, setPoupAM] = useState(0.50)  // % a.m.

  // Derivados
  const iMonth = useMemo(() => {
    if (produto === 'Poupança') return clamp(poupAM, 0) / 100
    return clamp(rateAA, 0) / 100 / 12
  }, [produto, rateAA, poupAM])

  const fvBruto = useMemo(
    () => futureValue(clamp(pv, 0), clamp(pmt, 0), clamp(months, 0), iMonth),
    [pv, pmt, months, iMonth]
  )

  const investido = useMemo(() => clamp(pv, 0) + clamp(pmt, 0) * clamp(months, 0), [pv, pmt, months])
  const jurosBruto = useMemo(() => Math.max(0, fvBruto - investido), [fvBruto, investido])

  // IR (aplica somente ao CDB sobre JUROS)
  const days = useMemo(() => Math.max(1, Math.floor(months * 30)), [months])
  const irAliq = useMemo(() => (produto === 'CDB' ? irCdb(days) : 0), [produto, days])
  const irValor = useMemo(() => jurosBruto * irAliq, [jurosBruto, irAliq])

  const fvLiquido = useMemo(() => fvBruto - irValor, [fvBruto, irValor])
  const jurosLiquido = useMemo(() => Math.max(0, fvLiquido - investido), [fvLiquido, investido])

  // Equivalentes
  const effAM = useMemo(() => iMonth * 100, [iMonth])
  const effAA = useMemo(() => (Math.pow(1 + iMonth, 12) - 1) * 100, [iMonth])

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill>
                <Banknote className="mr-1 h-3.5 w-3.5" aria-hidden />
                Calculadora de Renda Fixa
              </Pill>
              <span className="text-sm text-slate-500">
                CDB (IR regressivo), LCI/LCA (isentos) e Poupança. Aportes mensais e capitalização mensal.
              </span>
            </div>

            <h1 className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-black leading-tight text-slate-900">
              Quanto rende seu investimento até o vencimento?
            </h1>
            <p className="text-slate-600 md:text-base">
              Informe produto, taxa e prazo. Para <strong>CDB</strong>, aplicamos o <strong>IR regressivo</strong> automaticamente
              sobre os <em>juros</em>. <strong>LCI/LCA</strong> são isentos de IR (simulação didática).
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {/* Linha 1 */}
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Produto">
                <Segmented
                  value={produto}
                  onChange={(v) => setProduto(v as Produto)}
                  options={[
                    { value: 'CDB', label: 'CDB' },
                    { value: 'LCI/LCA', label: 'LCI/LCA' },
                    { value: 'Poupança', label: 'Poupança' },
                  ]}
                />
              </Field>

              <Field label={produto === 'Poupança' ? 'Taxa (% a.m.)' : 'Taxa nominal (% a.a.)'}>
                {produto === 'Poupança' ? (
                  <>
                    <NumberInput value={poupAM} onChange={setPoupAM} min={0} max={2} step={0.01} suffix="%" />
                    <Range value={poupAM} min={0} max={2} step={0.01} onChange={setPoupAM} />
                  </>
                ) : (
                  <>
                    <NumberInput value={rateAA} onChange={setRateAA} min={0} max={40} step={0.1} suffix="%" />
                    <Range value={rateAA} min={0} max={40} step={0.1} onChange={setRateAA} />
                  </>
                )}
                <p className="mt-1 text-[12px] text-slate-500">
                  Efetiva: <strong>{effAA.toFixed(2)}% a.a.</strong> • Mensal: <strong>{effAM.toFixed(3)}% a.m.</strong>
                </p>
              </Field>
            </div>

            {/* Linha 2 */}
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Aporte inicial (R$)">
                <NumberInput value={pv} onChange={setPv} min={0} step={250} />
                <Range value={pv} min={0} max={500000} step={250} onChange={setPv} />
              </Field>

              <Field label="Aporte mensal (R$)">
                <NumberInput value={pmt} onChange={setPmt} min={0} step={50} />
                <Range value={pmt} min={0} max={20000} step={50} onChange={setPmt} />
              </Field>
            </div>

            {/* Linha 3 */}
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Prazo (meses)">
                <NumberInput value={months} onChange={setMonths} min={1} max={240} step={1} />
                <Range value={months} min={1} max={240} step={1} onChange={setMonths} />
                <p className="mt-1 text-[12px] text-slate-500">
                  Aproximamos {days} dias corridos para o cálculo do IR regressivo quando aplicável.
                </p>
              </Field>

              <Field label="Impostos (automático)">
                <div className="rounded-xl border bg-white p-3 text-[13px] text-slate-600">
                  {produto === 'CDB' ? (
                    <>
                      <div>IR sobre juros: <strong>{(irAliq * 100).toFixed(1)}%</strong></div>
                      <div className="mt-1">Valor do IR (estimado): <strong>{money(irValor)}</strong></div>
                    </>
                  ) : (
                    <div>Isento de IR (simulação didática para LCI/LCA e Poupança).</div>
                  )}
                </div>
              </Field>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Resultado bruto"
                items={[
                  ['Total investido (inicial + aportes)', money(investido)],
                  ['Juros brutos acumulados', money(jurosBruto)],
                ]}
                emphasis={money(fvBruto)}
                emphasisLabel="Valor futuro bruto"
              />

              <ResultCard
                title="Resultado líquido"
                items={[
                  ...(produto === 'CDB' ? [['IR sobre juros', money(irValor)] as [string, string]] : []),
                ]}
                emphasis={money(fvLiquido)}
                emphasisLabel="Valor futuro líquido"
              />
            </div>

            <HintCard>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                <li>Simulação didática: não considera IOF de resgates &lt; 30 dias, spreads, taxas de custódia nem carências.</li>
                <li>Para CDBs atrelados a <em>% do CDI</em>, converta para uma taxa anual aproximada e informe em “Taxa nominal”.</li>
                <li>LCI/LCA são <strong>isentos de IR</strong> para pessoa física (regras podem mudar). Verifique condições do emissor.</li>
              </ul>
            </HintCard>
          </section>

          {/* Share + Ad */}
          <SocialShare
            title="Calculadora de Renda Fixa • Mapa do Crédito"
            summary="Simule CDB (IR regressivo), LCI/LCA (isentos) e Poupança com aportes mensais e capitalização mensal."
            tags={['MapaDoCredito','RendaFixa','CDB','LCI','LCA','Poupanca']}
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
  suffix,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(clamp(+e.target.value || 0, min ?? -Infinity, max ?? Infinity))}
        min={min}
        max={max}
        step={step}
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

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (val: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border bg-white">
      {options.map((opt, idx) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'px-3 py-2 text-sm font-semibold transition',
              active
                ? 'bg-sky-600 text-white'
                : 'text-slate-700 hover:bg-slate-50',
              idx !== options.length - 1 ? 'border-r' : '',
            ].join(' ')}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ResultCard({
  title,
  items,
  emphasis,
  emphasisLabel,
}: {
  title: string
  items?: Array<[string, string]>
  emphasis?: string
  emphasisLabel?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      {items && (
        <div className="mt-2 space-y-2 text-[13px] text-slate-700">
          {items.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span>{k}</span>
              <strong className="text-slate-900">{v}</strong>
            </div>
          ))}
        </div>
      )}
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