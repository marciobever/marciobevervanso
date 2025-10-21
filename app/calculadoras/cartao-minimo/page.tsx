// app/calculadoras/cartao-minimo/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Container } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'

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
export default function CartaoMinimoPage() {
  // Entradas padrão (realistas)
  const [valorFatura, setValorFatura] = useState(1500)           // R$
  const [pctMinimo, setPctMinimo] = useState(15)                 // % do mínimo (ex.: 15%)
  const [jurosRotativoAM, setJurosRotativoAM] = useState(13)     // % a.m.
  const [diasRotativo, setDiasRotativo] = useState(30)           // dias até a próxima fatura
  const [pagamentoPersonalizado, setPagamentoPersonalizado] = useState(0) // R$ a mais que o mínimo

  // IOF (didático; ajuste se quiser)
  const IOF_ADIC = 0.0038   // 0,38% no principal
  const IOF_DIA  = 0.000082 // ~0,0082% ao dia

  // Cálculos base
  const minimoReais = useMemo(
    () => (clamp(pctMinimo, 0, 100) / 100) * clamp(valorFatura, 0),
    [pctMinimo, valorFatura]
  )
  const pagamentoAgora = useMemo(
    () => clamp(minimoReais + clamp(pagamentoPersonalizado, 0), 0, valorFatura),
    [minimoReais, pagamentoPersonalizado, valorFatura]
  )
  const saldoRotativo = useMemo(
    () => Math.max(0, valorFatura - pagamentoAgora),
    [valorFatura, pagamentoAgora]
  )

  // Rotativo (com base no pagamento atual)
  const rot = useMemo(() => {
    const taxaDia = clamp(jurosRotativoAM, 0) / 100 / 30
    const dias = clamp(diasRotativo, 0)
    const fator = Math.pow(1 + taxaDia, dias)
    const juros = saldoRotativo * (fator - 1)
    const iof = saldoRotativo * IOF_ADIC + saldoRotativo * IOF_DIA * dias
    const total = saldoRotativo + juros + iof
    return { juros, iof, total, dias }
  }, [saldoRotativo, jurosRotativoAM, diasRotativo])

  // Simulação: e se eu pagar +R$100 agora?
  const extraSugestao = 100
  const rotComExtra = useMemo(() => {
    const novoSaldo = Math.max(0, valorFatura - (pagamentoAgora + extraSugestao))
    const taxaDia = clamp(jurosRotativoAM, 0) / 100 / 30
    const dias = clamp(diasRotativo, 0)
    const fator = Math.pow(1 + taxaDia, dias)
    const juros = novoSaldo * (fator - 1)
    const iof = novoSaldo * IOF_ADIC + novoSaldo * IOF_DIA * dias
    const total = novoSaldo + juros + iof
    return { juros, iof, total }
  }, [valorFatura, pagamentoAgora, jurosRotativoAM, diasRotativo])

  const economiaExtra = Math.max(0, rot.total - rotComExtra.total)

  // Quanto eu precisaria pagar AGORA para zerar rotativo (pagar à vista)
  const necessarioParaZerar = Math.max(0, valorFatura - pagamentoAgora)

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-black leading-tight text-slate-900">
              Pagar só o mínimo do cartão vale a pena?
            </h1>
            <p className="text-slate-600 md:text-base">
              Simule o custo de pagar apenas o <strong>mínimo</strong> da fatura e manter o restante no{' '}
              <strong>rotativo</strong> até a próxima fatura. Veja quanto seria economizado ao pagar um pouco a mais agora.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Valor da fatura (R$)">
                <NumberInput value={valorFatura} onChange={setValorFatura} min={0} step={50} />
                <Range value={valorFatura} min={0} max={10000} step={50} onChange={setValorFatura} />
              </Field>

              <Field label="Pagamento mínimo (% da fatura)">
                <NumberInput value={pctMinimo} onChange={setPctMinimo} min={0} max={100} step={1} suffix="%" />
                <Range value={pctMinimo} min={0} max={100} step={1} onChange={setPctMinimo} />
                <div className="text-[13px] text-slate-500">
                  Mínimo em R$: <strong>{money(minimoReais)}</strong>
                </div>
              </Field>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Pagar a mais agora (R$)">
                <NumberInput value={pagamentoPersonalizado} onChange={setPagamentoPersonalizado} min={0} step={50} />
                <Range value={pagamentoPersonalizado} min={0} max={valorFatura} step={50} onChange={setPagamentoPersonalizado} />
                <div className="text-[13px] text-slate-500">
                  Pagamento total agora: <strong>{money(pagamentoAgora)}</strong>
                </div>
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Juros do rotativo (% a.m.)">
                  <NumberInput value={jurosRotativoAM} onChange={setJurosRotativoAM} min={0} max={20} step={0.5} suffix="%" />
                  <Range value={jurosRotativoAM} min={0} max={20} step={0.5} onChange={setJurosRotativoAM} />
                </Field>

                <Field label="Dias até a próxima fatura">
                  <NumberInput value={diasRotativo} onChange={setDiasRotativo} min={0} max={60} step={1} />
                  <Range value={diasRotativo} min={0} max={60} step={1} onChange={setDiasRotativo} />
                </Field>
              </div>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Se pagar o mínimo (agora)"
                lines={[
                  ['Pagamento agora', money(pagamentoAgora)],
                  ['Saldo que vai ao rotativo', money(saldoRotativo)],
                  ['Juros estimados', money(rot.juros)],
                  ['IOF (adicional + diário)', money(rot.iof)],
                ]}
                valueLabel="Total na próxima fatura"
                value={money(rot.total)}
              />
              <ResultCard
                title={`Se pagar +${money(extraSugestao)} agora`}
                lines={[
                  ['Pagamento agora', money(pagamentoAgora + extraSugestao)],
                  ['Saldo no rotativo', money(Math.max(0, valorFatura - (pagamentoAgora + extraSugestao)))],
                ]}
                highlight={`Economia estimada: ${money(economiaExtra)}`}
                valueLabel="Total na próxima fatura"
                value={money(rotComExtra.total)}
              />
            </div>

            <CompareBar
              aLabel="Pagar só o mínimo"
              bLabel={`Pagar +${money(extraSugestao)} agora`}
              aValue={rot.total}
              bValue={rotComExtra.total}
            />

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-slate-700">
                <p className="text-sm">
                  Para <strong>zerar o rotativo</strong> neste ciclo, você precisaria pagar agora:{' '}
                  <strong>{money(necessarioParaZerar)}</strong>.
                </p>
                <p className="mt-1 text-[13px] text-slate-500">
                  Dica: negocie parcelamento oficial da própria fatura se não conseguir quitar — costuma ter{' '}
                  <em>CET</em> menor e previsibilidade melhor que ficar no rotativo.
                </p>
              </div>
            </div>
          </section>

          {/* Compartilhar + Ad */}
          <SocialShare
            title="Pagamento mínimo do cartão — simule juros do rotativo • Mapa do Crédito"
            summary="Descubra quanto custa pagar só o mínimo e quanto você economiza ao pagar um pouco a mais agora."
            tags={['MapaDoCredito','Cartao','Rotativo','Minimo']}
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
  lines,
  valueLabel,
  value,
  highlight,
}: {
  title: string
  lines?: Array<[string, string]>
  valueLabel: string
  value: string
  highlight?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="mt-2 space-y-1 text-[13px] text-slate-600">
        {lines?.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span>{k}</span>
            <strong className="text-slate-800">{v}</strong>
          </div>
        ))}
      </div>
      {highlight && (
        <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700">
          {highlight}
        </div>
      )}
      <div className="mt-3 text-sm text-slate-600">{valueLabel}</div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  )
}

/** Barra horizontal simples para comparar dois valores */
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
        <div className="h-full bg-amber-500" style={{ width: `${aPct}%` }} />
        <div className="h-full -mt-4 bg-emerald-500" style={{ width: `${bPct}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 text-[12px] text-slate-600">
        <div className="text-amber-700">
          {aLabel}: <strong>{money(aValue)}</strong>
        </div>
        <div className="text-right text-emerald-700">
          {bLabel}: <strong>{money(bValue)}</strong>
        </div>
      </div>
    </div>
  )
}