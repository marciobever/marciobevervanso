// app/calculadoras/cashback-vs-pontos/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Container } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'

/* =========================
   Helpers (format/parse)
========================= */
function money(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00'}`
  }
}
function clamp(n: number, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(max, Math.max(min, n))
}

/* =========================
   Página
========================= */
export default function CashbackVsPontosPage() {
  // Entradas (valores iniciais razoáveis)
  const [gastoMensal, setGastoMensal] = useState(2500)       // R$
  const [pctCashback, setPctCashback] = useState(1.2)        // %
  const [pontosPorReal, setPontosPorReal] = useState(1.8)    // pts/R$
  const [valorPonto, setValorPonto] = useState(0.035)        // R$/pt
  const [anuidadeCash, setAnuidadeCash] = useState(0)        // R$
  const [anuidadePontos, setAnuidadePontos] = useState(600)  // R$
  const [descontoAnuidade, setDescontoAnuidade] = useState(100) // %
  const [bonusAdesao, setBonusAdesao] = useState(0)          // pts

  // Derivados
  const gastoAnual = useMemo(() => clamp(gastoMensal, 0) * 12, [gastoMensal])
  const anuidadePontosLiquida = useMemo(() => {
    const desc = clamp(descontoAnuidade, 0, 100) / 100
    return clamp(anuidadePontos, 0) * (1 - desc)
  }, [anuidadePontos, descontoAnuidade])

  // Cashback
  const cashbackBrutoAno = useMemo(
    () => gastoAnual * clamp(pctCashback, 0) / 100,
    [gastoAnual, pctCashback]
  )
  const cashbackLiquidoAno = useMemo(
    () => Math.max(0, cashbackBrutoAno - clamp(anuidadeCash, 0)),
    [cashbackBrutoAno, anuidadeCash]
  )

  // Pontos
  const pontosAno = useMemo(
    () => gastoAnual * clamp(pontosPorReal, 0) + clamp(bonusAdesao, 0),
    [gastoAnual, pontosPorReal, bonusAdesao]
  )
  const valorPontosAno = useMemo(
    () => pontosAno * clamp(valorPonto, 0),
    [pontosAno, valorPonto]
  )
  const pontosLiquidoAno = useMemo(
    () => Math.max(0, valorPontosAno - anuidadePontosLiquida),
    [valorPontosAno, anuidadePontosLiquida]
  )

  // Resultado e diferença
  const melhor =
    pontosLiquidoAno > cashbackLiquidoAno ? 'Pontos' :
    pontosLiquidoAno < cashbackLiquidoAno ? 'Cashback' : 'Empate'

  const diff = Math.abs(pontosLiquidoAno - cashbackLiquidoAno)

  // Ponto de indiferença: % cashback necessária para empatar com pontos
  const pctIndiferenca = useMemo(() => {
    if (gastoAnual <= 0) return 0
    const alvo = (pontosAno * clamp(valorPonto, 0) - anuidadePontosLiquida) + clamp(anuidadeCash, 0)
    const c = alvo / gastoAnual
    return Math.max(0, c * 100)
  }, [gastoAnual, pontosAno, valorPonto, anuidadePontosLiquida, anuidadeCash])

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-black leading-tight text-slate-900">
              Cashback x Pontos — qual rende mais?
            </h1>
            <p className="text-slate-600 md:text-base">
              Compare o retorno anual de um cartão com <strong>cashback</strong> com o de um cartão de <strong>pontos/milhas</strong>.
              Ajuste as variáveis e veja o resultado líquido já descontando anuidades e bônus.
            </p>
          </header>

          {/* Form */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {/* Linha 1 */}
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Gasto mensal no cartão (R$)">
                <NumberInput value={gastoMensal} onChange={setGastoMensal} min={0} step={50} />
                <Range
                  value={gastoMensal}
                  min={0}
                  max={20000}
                  step={100}
                  onChange={setGastoMensal}
                />
              </Field>

              <Field label="% de cashback">
                <NumberInput value={pctCashback} onChange={setPctCashback} min={0} step={0.1} suffix="%" />
                <Range
                  value={pctCashback}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setPctCashback}
                />
              </Field>
            </div>

            {/* Linha 2 */}
            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Pontos por real">
                <NumberInput value={pontosPorReal} onChange={setPontosPorReal} min={0} step={0.1} />
                <Range
                  value={pontosPorReal}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setPontosPorReal}
                />
              </Field>

              <Field label="Valor do ponto (R$)">
                <NumberInput value={valorPonto} onChange={setValorPonto} min={0} step={0.001} />
                <Range
                  value={valorPonto}
                  min={0}
                  max={0.15}
                  step={0.001}
                  onChange={setValorPonto}
                />
              </Field>

              <Field label="Bônus de adesão (pontos)">
                <NumberInput value={bonusAdesao} onChange={setBonusAdesao} min={0} step={1000} />
                <Range
                  value={bonusAdesao}
                  min={0}
                  max={200000}
                  step={1000}
                  onChange={setBonusAdesao}
                />
              </Field>
            </div>

            {/* Linha 3 */}
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Anuidade (cartão de cashback)">
                <NumberInput value={anuidadeCash} onChange={setAnuidadeCash} min={0} step={50} />
                <Range
                  value={anuidadeCash}
                  min={0}
                  max={1500}
                  step={50}
                  onChange={setAnuidadeCash}
                />
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Anuidade (cartão de pontos)">
                  <NumberInput value={anuidadePontos} onChange={setAnuidadePontos} min={0} step={50} />
                  <Range
                    value={anuidadePontos}
                    min={0}
                    max={2500}
                    step={50}
                    onChange={setAnuidadePontos}
                  />
                </Field>

                <Field label="Desconto na anuidade (%)">
                  <NumberInput value={descontoAnuidade} onChange={setDescontoAnuidade} min={0} max={100} step={5} suffix="%" />
                  <Range
                    value={descontoAnuidade}
                    min={0}
                    max={100}
                    step={5}
                    onChange={setDescontoAnuidade}
                  />
                </Field>
              </div>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            {/* Cards principais */}
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Cashback (líquido ao ano)"
                subtitle={`Bruto: ${money(cashbackBrutoAno)} • Anuidade: ${money(anuidadeCash)}`}
                value={money(cashbackLiquidoAno)}
              />
              <ResultCard
                title="Pontos (líquido ao ano)"
                subtitle={`Pontos/ano: ${pontosAno.toLocaleString('pt-BR')} • Valor pts: ${money(valorPontosAno)} • Anuidade líquida: ${money(anuidadePontosLiquida)}`}
                value={money(pontosLiquidoAno)}
              />
            </div>

            {/* Barra de comparação + destaque */}
            <CompareBar
              aLabel="Cashback"
              bLabel="Pontos"
              aValue={cashbackLiquidoAno}
              bValue={pontosLiquidoAno}
            />

            <div className="rounded-2xl border bg-white p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-slate-700">
                  <span className="text-sm mr-2">Melhor para você:</span>
                  <strong className="text-base">{melhor}</strong>
                  {diff > 0 && (
                    <span className="ml-2 text-sm text-slate-500">({money(diff)} de diferença/ano)</span>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  Ponto de indiferença do cashback: <strong>{pctIndiferenca.toFixed(2)}%</strong>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="rounded-2xl border bg-white p-5">
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                <li>O valor do ponto varia por programa/parceiro e promoção de transferência. Ajuste conforme seu cenário real.</li>
                <li>Considere requisitos de isenção de anuidade (gasto mínimo, portabilidade de salário, negociação).</li>
                <li>Para um comparativo perfeito, inclua benefícios específicos do cartão de pontos (salas VIP, seguros, parceiros).</li>
              </ul>
            </div>
          </section>

          {/* Compartilhar + Anúncio */}
          <SocialShare
            title="Cashback x Pontos — qual rende mais? • Mapa do Crédito"
            summary="Simule o retorno anual e descubra se vale mais a pena um cartão com cashback ou com pontos/milhas."
            tags={['MapaDoCredito','Cashback','Pontos','Milhas']}
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
  subtitle,
  value,
}: {
  title: string
  subtitle?: string
  value: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
      {subtitle && <div className="mt-1 text-[12px] text-slate-500">{subtitle}</div>}
    </div>
  )
}

/** Barra horizontal para comparar dois valores */
function CompareBar({
  aLabel,
  bLabel,
  aValue,
  bValue,
}: {
  aLabel: string
  bLabel: string
  aValue: number
  bValue: number
}) {
  const total = Math.max(aValue + bValue, 1)
  const aPct = (aValue / total) * 100
  const bPct = 100 - aPct
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
        <span>{aLabel}</span>
        <span>{bLabel}</span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-emerald-500" style={{ width: `${aPct}%` }} />
        <div className="h-full -mt-4 bg-sky-500" style={{ width: `${bPct}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 text-[12px] text-slate-600">
        <div className="text-emerald-700">
          {aLabel}: <strong>{money(aValue)}</strong>
        </div>
        <div className="text-right text-sky-700">
          {bLabel}: <strong>{money(bValue)}</strong>
        </div>
      </div>
    </div>
  )
}