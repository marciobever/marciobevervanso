// app/calculadoras/consignado/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { Container, Glass, Pill } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'
import { HandCoins } from 'lucide-react'

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
/** PMT – prestação de uma anuidade (fim do período) */
function pmt(i: number, n: number, pv: number) {
  if (n <= 0) return 0
  if (i <= 0) return pv / n
  const f = Math.pow(1 + i, n)
  return (pv * i * f) / (f - 1)
}
/** Busca a taxa i (a.m.) cujo PV dos pagamentos = principal + custos (CET aproximado) */
function solveRateByBisection({
  pv,        // valor financiado + IOF + taxas à vista
  pmtValue,  // parcela mensal total (inclui seguro mensal)
  n,         // meses
  lo = 0,
  hi = 0.1,  // 0%..10% a.m.
  iters = 60,
}: { pv: number; pmtValue: number; n: number; lo?: number; hi?: number; iters?: number }) {
  function pvFromRate(r: number) {
    if (r === 0) return pmtValue * n
    const f = Math.pow(1 + r, n)
    return pmtValue * ((f - 1) / (r * f))
  }
  let a = lo, b = hi
  for (let k = 0; k < iters; k++) {
    const m = (a + b) / 2
    const pvGuess = pvFromRate(m)
    if (pvGuess > pv) a = m
    else b = m
  }
  return (a + b) / 2
}

/* =========================
   Página
========================= */
export default function ConsignadoCalcPage() {
  // Entradas principais
  const [principal, setPrincipal] = useState(10000)  // R$ solicitado
  const [months, setMonths] = useState(48)           // prazo em meses
  const [rateAM, setRateAM] = useState(1.8)          // juros % a.m. do contrato
  // Custos acessórios
  const [openFee, setOpenFee] = useState(0)          // taxa de abertura (TAC) à vista
  const [monthlyInsurance, setMonthlyInsurance] = useState(0) // seguro mensal (R$)
  // Cheque de margem
  const [salary, setSalary] = useState(3500)         // salário líquido
  const [maxPct, setMaxPct] = useState(35)           // % da margem consignável

  // IOF — parâmetros didáticos
  const IOF_ADIC = 0.0038    // 0,38% sobre o principal
  const IOF_DIA  = 0.000082  // ~0,0082% ao dia
  const dias = 30 * Math.max(1, Math.floor(months))  // aprox. 30 dias por mês

  // Derivados
  const i = useMemo(() => clamp(rateAM, 0) / 100, [rateAM])
  const iofValor = useMemo(() => principal * IOF_ADIC + principal * IOF_DIA * dias, [principal, dias])
  const parcelaBase = useMemo(() => pmt(i, Math.max(1, Math.floor(months)), principal), [i, months, principal])
  const parcelaTotal = useMemo(() => parcelaBase + clamp(monthlyInsurance, 0), [parcelaBase, monthlyInsurance])

  // Total pago (parcela + seguro mensal) * n + TAC + IOF
  const totalPago = useMemo(
    () => parcelaTotal * Math.max(1, Math.floor(months)) + clamp(openFee, 0) + iofValor,
    [parcelaTotal, months, openFee, iofValor]
  )

  // CET aproximado: taxa i tal que PV(parcelas+seguro) = principal + IOF + TAC
  const cetAM = useMemo(() => {
    const pv = principal + iofValor + clamp(openFee, 0)
    const n = Math.max(1, Math.floor(months))
    if (pv <= 0 || parcelaTotal <= 0) return 0
    const r = solveRateByBisection({ pv, pmtValue: parcelaTotal, n, lo: 0, hi: 0.1, iters: 60 })
    return r * 100
  }, [principal, iofValor, openFee, months, parcelaTotal])
  const cetAA = useMemo(() => (Math.pow(1 + cetAM / 100, 12) - 1) * 100, [cetAM])

  // Margem consignável
  const margemMax = useMemo(() => clamp(salary, 0) * clamp(maxPct, 0, 100) / 100, [salary, maxPct])
  const cabeNaMargem = parcelaTotal <= margemMax

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill>
                <HandCoins className="mr-1 h-3.5 w-3.5" aria-hidden />
                Calculadora de Consignado
              </Pill>
              <span className="text-sm text-slate-500">
                Simule parcela, IOF, CET aproximado e verifique a margem consignável.
              </span>
            </div>
            <h1 className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-black leading-tight text-slate-900">
              Quanto fica a parcela do consignado?
            </h1>
            <p className="text-slate-600 md:text-base">
              Informe valor, prazo e taxa mensal. Inclua custos (TAC, seguro) para estimar o <strong>CET</strong>.
              Os resultados são <em>didáticos</em>; consulte as condições oficiais do seu contrato.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {/* Bloco 1: Contrato */}
            <section className="grid gap-6 md:grid-cols-2">
              <Field label="Valor solicitado (R$)">
                <NumberInput value={principal} onChange={setPrincipal} min={0} step={500} />
                <Range value={principal} min={0} max={200000} step={500} onChange={setPrincipal} />
              </Field>

              <Field label="Prazo (meses)">
                <NumberInput value={months} onChange={setMonths} min={1} max={144} step={1} />
                <Range value={months} min={1} max={144} step={1} onChange={setMonths} />
              </Field>

              <Field label="Juros do contrato (% a.m.)">
                <NumberInput value={rateAM} onChange={setRateAM} min={0} max={6} step={0.05} suffix="%" />
                <Range value={rateAM} min={0} max={6} step={0.05} onChange={setRateAM} />
              </Field>

              <Field label="Seguro mensal (R$)">
                <NumberInput value={monthlyInsurance} onChange={setMonthlyInsurance} min={0} max={200} step={1} />
                <Range value={monthlyInsurance} min={0} max={200} step={1} onChange={setMonthlyInsurance} />
              </Field>
            </section>

            {/* Bloco 2: Taxas/IOF e Margem */}
            <section className="grid gap-6 md:grid-cols-2">
              <Field label="Taxa de abertura (TAC) — à vista (R$)">
                <NumberInput value={openFee} onChange={setOpenFee} min={0} max={2000} step={10} />
                <Range value={openFee} min={0} max={2000} step={10} onChange={setOpenFee} />
              </Field>

              <Field label="Salário líquido (R$) • p/ margem">
                <NumberInput value={salary} onChange={setSalary} min={0} step={50} />
                <Range value={salary} min={0} max={20000} step={50} onChange={setSalary} />
                <div className="mt-1 text-[12px] text-slate-500">
                  Margem considerada: <strong>{maxPct}%</strong> — valor máximo da parcela: <strong>{money(margemMax)}</strong>
                </div>
              </Field>

              <Field label="% de margem consignável">
                <NumberInput value={maxPct} onChange={setMaxPct} min={0} max={70} step={1} suffix="%" />
                <Range value={maxPct} min={0} max={70} step={1} onChange={setMaxPct} />
              </Field>

              <div className="rounded-2xl border bg-white p-4 text-[13px] text-slate-600">
                <div>IOF estimado (0,38% + diário ~0,0082%/dia): <strong>{money(iofValor)}</strong></div>
                <div className="mt-1">Dias considerados: <strong>{dias}</strong></div>
              </div>
            </section>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Parcela estimada"
                items={[
                  ['Parcela base', money(parcelaBase)],
                  ['Seguro mensal', money(monthlyInsurance)],
                ]}
                emphasis={money(parcelaTotal)}
                emphasisLabel="Parcela total / mês"
                extra={
                  <Badge ok={cabeNaMargem}>
                    {cabeNaMargem
                      ? `Cabe na margem (${money(margemMax)})`
                      : `Ultrapassa a margem (${money(margemMax)})`}
                  </Badge>
                }
              />

              <ResultCard
                title="CET aproximado e custo"
                items={[
                  ['CET (a.m.)', `${cetAM.toFixed(2)}%`],
                  ['CET (a.a.)', `${cetAA.toFixed(2)}%`],
                  ['IOF total estimado', money(iofValor)],
                ]}
                emphasis={money(totalPago)}
                emphasisLabel="Custo total do contrato"
              />
            </div>

            <HintCard>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                <li>O <strong>CET</strong> é uma aproximação considerando TAC, IOF e seguro mensal. Podem existir outras tarifas.</li>
                <li>Consignado tem desconto em folha — a parcela deve respeitar a <strong>margem consignável</strong> do seu vínculo.</li>
                <li>Reveja <em>taxa</em>, <em>prazo</em> e <em>custos</em> para caber no orçamento. Prazos longos reduzem parcela, mas aumentam o custo total.</li>
              </ul>
            </HintCard>
          </section>

          {/* Share + Ad */}
          <SocialShare
            title="Calculadora de Consignado • Mapa do Crédito"
            summary="Simule parcela, IOF e CET do consignado e confira se cabe na sua margem."
            tags={['MapaDoCredito','Consignado','Emprestimo','CET']}
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

function ResultCard({
  title,
  items,
  emphasis,
  emphasisLabel,
  extra,
}: {
  title: string
  items?: Array<[string, string]>
  emphasis?: string
  emphasisLabel?: string
  extra?: React.ReactNode
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
      {extra && <div className="mt-3">{extra}</div>}
    </div>
  )
}

function HintCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-white p-5">{children}</div>
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ring-1',
        ok
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
          : 'bg-amber-50 text-amber-700 ring-amber-100',
      ].join(' ')}
    >
      {children}
    </span>
  )
}