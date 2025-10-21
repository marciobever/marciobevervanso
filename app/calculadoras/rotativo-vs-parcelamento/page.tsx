// app/calculadoras/rotativo-vs-parcelamento/page.tsx
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
export default function RotativoVsParcelamentoPage() {
  // Entradas (com defaults realistas)
  const [valorFatura, setValorFatura] = useState(1500)         // R$
  const [pagamentoAgora, setPagamentoAgora] = useState(225)    // R$ (15% de 1500)
  const [jurosRotativoAM, setJurosRotativoAM] = useState(13)   // % a.m. (ajustável)
  const [diasRotativo, setDiasRotativo] = useState(30)         // dias no rotativo

  const [parcelas, setParcelas] = useState(12)                 // n parcelas
  const [jurosParcelamentoAM, setJurosParcelamentoAM] = useState(2.5) // % a.m.

  // IOF (Brasil) — parâmetros didáticos (ajuste se quiser)
  const IOF_ADIC = 0.0038   // 0,38% no principal
  const IOF_DIA  = 0.000082 // ~0,0082% ao dia

  // Saldos e taxas
  const saldoRotativo = useMemo(
    () => Math.max(0, valorFatura - pagamentoAgora),
    [valorFatura, pagamentoAgora]
  )

  // Rotativo: juros por dia + IOF adicional e diário
  const rot = useMemo(() => {
    const taxaDia = clamp(jurosRotativoAM, 0) / 100 / 30
    const dias = clamp(diasRotativo, 0)
    const fator = Math.pow(1 + taxaDia, dias)
    const juros = saldoRotativo * (fator - 1)
    const iof = saldoRotativo * IOF_ADIC + saldoRotativo * IOF_DIA * dias
    const total = saldoRotativo + juros + iof
    return { juros, iof, total, dias }
  }, [saldoRotativo, jurosRotativoAM, diasRotativo])

  // Parcelamento: PMT financeiro sobre a fatura inteira + IOF adicional no principal
  const parc = useMemo(() => {
    const i = clamp(jurosParcelamentoAM, 0) / 100
    const n = Math.max(1, Math.floor(parcelas))
    const principal = valorFatura
    const iof = principal * IOF_ADIC
    const pmt = i === 0 ? principal / n : (principal * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
    const total = pmt * n + iof
    return { pmt, iof, total, n }
  }, [valorFatura, jurosParcelamentoAM, parcelas])

  const melhor =
    rot.total < parc.total ? 'Rotativo (somente se quitar no próximo ciclo)' :
    rot.total > parc.total ? 'Parcelamento da fatura' :
    'Empate'

  const diff = Math.abs(rot.total - parc.total)

  // Taxa mensal de parcelamento que empata com o rotativo (aprox., buscando i por bisseção)
  const taxaIndiferencaAM = useMemo(() => {
    const principal = valorFatura
    const alvo = rot.total - principal * IOF_ADIC // total do rotativo sem o IOF adicional do parcelamento
    if (principal <= 0 || alvo <= 0) return 0

    const n = Math.max(1, Math.floor(parcelas))
    // queremos pmt tal que pmt*n = alvo  => pmt = alvo/n
    const pmtDesejado = alvo / n

    // resolver pmt = (P * i * (1+i)^n) / ((1+i)^n - 1)
    // busca i em [0, 0.2] (0% a 20% a.m.) via bisseção
    let lo = 0, hi = 0.2
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2
      const pmtMid = mid === 0 ? principal / n : (principal * mid * Math.pow(1 + mid, n)) / (Math.pow(1 + mid, n) - 1)
      if (pmtMid > pmtDesejado) hi = mid
      else lo = mid
    }
    return ((lo + hi) / 2) * 100
  }, [valorFatura, rot.total, parcelas])

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-black leading-tight text-slate-900">
              Rotativo x Parcelamento da fatura
            </h1>
            <p className="text-slate-600 md:text-base">
              Compare o <strong>custo total</strong> de manter parte da fatura no <strong>rotativo</strong> por alguns dias
              versus <strong>parcelar</strong> a fatura inteira. Consideramos juros, <abbr title="Imposto sobre Operações Financeiras">IOF</abbr> e número de parcelas.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {/* Linha 1 — Fatura */}
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Valor da fatura (R$)">
                <NumberInput value={valorFatura} onChange={setValorFatura} min={0} step={50} />
                <Range value={valorFatura} min={0} max={10000} step={50} onChange={setValorFatura} />
              </Field>

              <Field label="Pagamento agora (R$)">
                <NumberInput value={pagamentoAgora} onChange={setPagamentoAgora} min={0} step={25} />
                <Range value={pagamentoAgora} min={0} max={valorFatura} step={25} onChange={setPagamentoAgora} />
              </Field>
            </div>

            {/* Linha 2 — Rotativo */}
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Juros do rotativo (% a.m.)">
                <NumberInput value={jurosRotativoAM} onChange={setJurosRotativoAM} min={0} max={20} step={0.5} suffix="%" />
                <Range value={jurosRotativoAM} min={0} max={20} step={0.5} onChange={setJurosRotativoAM} />
              </Field>

              <Field label="Dias no rotativo (até quitar)">
                <NumberInput value={diasRotativo} onChange={setDiasRotativo} min={0} max={60} step={1} />
                <Range value={diasRotativo} min={0} max={60} step={1} onChange={setDiasRotativo} />
              </Field>
            </div>

            {/* Linha 3 — Parcelamento */}
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Número de parcelas">
                <NumberInput value={parcelas} onChange={setParcelas} min={1} max={24} step={1} />
                <Range value={parcelas} min={1} max={24} step={1} onChange={setParcelas} />
              </Field>

              <Field label="Juros do parcelamento (% a.m.)">
                <NumberInput value={jurosParcelamentoAM} onChange={setJurosParcelamentoAM} min={0} max={10} step={0.1} suffix="%" />
                <Range value={jurosParcelamentoAM} min={0} max={10} step={0.1} onChange={setJurosParcelamentoAM} />
              </Field>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Cenário: Rotativo (próximo ciclo)"
                lines={[
                  ['Saldo no rotativo', money(saldoRotativo)],
                  ['Juros', money(rot.juros)],
                  ['IOF (adicional + diário)', money(rot.iof)],
                ]}
                valueLabel="Custo total"
                value={money(rot.total)}
              />
              <ResultCard
                title="Cenário: Parcelamento"
                lines={[
                  ['Parcela estimada', `${money(parc.pmt)} × ${parc.n}`],
                  ['IOF adicional (0,38%)', money(parc.iof)],
                ]}
                valueLabel="Custo total"
                value={money(parc.total)}
              />
            </div>

            <CompareBar
              aLabel="Rotativo"
              bLabel="Parcelamento"
              aValue={rot.total}
              bValue={parc.total}
            />

            <div className="rounded-2xl border bg-white p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-slate-700">
                  <span className="text-sm mr-2">Mais vantajoso:</span>
                  <strong className="text-base">{melhor}</strong>
                  {diff > 0 && (
                    <span className="ml-2 text-sm text-slate-500">
                      ({money(diff)} de diferença)
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  Taxa do parcelamento que empata com o rotativo: <strong>{taxaIndiferencaAM.toFixed(2)}% a.m.</strong>
                </div>
              </div>
              <p className="mt-2 text-[13px] text-slate-500">
                Dica: o rotativo só “vence” se você <strong>quitar integralmente</strong> no próximo ciclo. Caso contrário,
                o parcelamento geralmente tem <em>CET</em> menor e melhor previsibilidade.
              </p>
            </div>
          </section>

          {/* Compartilhar + Ad */}
          <SocialShare
            title="Rotativo x Parcelamento — qual compensa? • Mapa do Crédito"
            summary="Simule juros, IOF e parcelas para descobrir se vale mais a pena ficar no rotativo por alguns dias ou parcelar a fatura."
            tags={['MapaDoCredito','Rotativo','Parcelamento','Cartao']}
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
}: {
  title: string
  lines?: Array<[string, string]>
  valueLabel: string
  value: string
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
      <div className="mt-3 text-sm text-slate-600">{valueLabel}</div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  )
}

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
        <div className="h-full -mt-4 bg-sky-500" style={{ width: `${bPct}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 text-[12px] text-slate-600">
        <div className="text-amber-700">
          {aLabel}: <strong>{money(aValue)}</strong>
        </div>
        <div className="text-right text-sky-700">
          {bLabel}: <strong>{money(bValue)}</strong>
        </div>
      </div>
    </div>
  )
}