// app/calculadoras/aneel-tarifa-social/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Container } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'
import { Zap } from 'lucide-react'

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
type Perfil = 'baixa-renda' | 'indigena-quilombola'

export default function TarifaSocialANEELPage() {
  // Entradas
  const [pessoas, setPessoas] = useState(4)
  const [rendaTotal, setRendaTotal] = useState(2200)
  const [salarioMinimo, setSalarioMinimo] = useState(1412) // editável para manter atualizado
  const [cadunico, setCadunico] = useState(true)
  const [bpc, setBpc] = useState(false)

  const [perfil, setPerfil] = useState<Perfil>('baixa-renda')
  const [kwhMes, setKwhMes] = useState(180)        // consumo médio mensal
  const [tarifaBase, setTarifaBase] = useState(0.95) // R$/kWh (valor médio — editável)

  // Derivados de elegibilidade
  const rendaPc = useMemo(
    () => (pessoas > 0 ? rendaTotal / pessoas : 0),
    [rendaTotal, pessoas]
  )
  const limiteRendaPc = useMemo(() => salarioMinimo / 2, [salarioMinimo])

  // Elegibilidade (regras didáticas e resumidas):
  // - Famílias inscritas no CadÚnico com renda per capita <= 1/2 salário-mínimo; OU
  // - Beneficiário do BPC;
  // - (Outros critérios podem existir — aqui simplificamos).
  const elegivel = useMemo(() => {
    if (bpc) return true
    if (cadunico && rendaPc <= limiteRendaPc) return true
    return false
  }, [bpc, cadunico, rendaPc, limiteRendaPc])

  // Desconto por faixas (didático, baseado em regra mais comum)
  // Perfil "baixa-renda":
  //   0–30 kWh: 65%
  //   31–100 kWh: 40%
  //   101–220 kWh: 10%
  //   >220 kWh: 0%
  //
  // Perfil "indigena-quilombola":
  //   0–50 kWh: 100%
  //   51–100 kWh: 40%
  //   101–220 kWh: 10%
  //   >220 kWh: 0%
  function descontoFaixa(perfil: Perfil, consumo: number) {
    let d1kwh = perfil === 'indigena-quilombola' ? 50 : 30
    const bands = [
      { upTo: d1kwh, desc: perfil === 'indigena-quilombola' ? 1.0 : 0.65 },
      { upTo: 100,   desc: 0.40 },
      { upTo: 220,   desc: 0.10 },
    ]
    // retorna valor descontado em kWh-equivalente e valor a pagar
    let restante = Math.max(0, consumo)
    let descontoTotalEmReais = 0
    let custoSemDesconto = consumo * tarifaBase

    let inicioFaixa = 0
    for (const b of bands) {
      if (restante <= 0) break
      const faixaKwh = Math.max(0, Math.min(restante, b.upTo - inicioFaixa))
      descontoTotalEmReais += faixaKwh * tarifaBase * b.desc
      restante -= faixaKwh
      inicioFaixa = b.upTo
    }
    // consumo acima de 220kWh não tem desconto
    return {
      descontoReais: descontoTotalEmReais,
      valorSemDesconto: custoSemDesconto,
      valorComDesconto: Math.max(0, custoSemDesconto - descontoTotalEmReais),
    }
  }

  const resultado = useMemo(() => {
    const k = clamp(kwhMes, 0, 2000)
    const base = clamp(tarifaBase, 0, 10)
    const { descontoReais, valorSemDesconto, valorComDesconto } = descontoFaixa(perfil, k)
    return {
      consumo: k,
      tarifa: base,
      semDesc: valorSemDesconto,
      desc: descontoReais,
      comDesc: valorComDesconto,
      economiaPct: valorSemDesconto > 0 ? (descontoReais / valorSemDesconto) * 100 : 0,
    }
  }, [perfil, kwhMes, tarifaBase])

  const statusLabel = elegivel ? 'Provável elegibilidade' : 'Não atende aos critérios'
  const statusClass = elegivel
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : 'bg-amber-50 text-amber-700 ring-amber-100'

  /* ========= UI ========= */
  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-[12px] font-semibold text-slate-700">
              <Zap className="h-3.5 w-3.5" aria-hidden /> Tarifa Social de Energia (ANEEL) — Estimador
            </div>
            <h1 className="text-[clamp(1.6rem,3.2vw,2.3rem)] font-black leading-tight text-slate-900">
              Veja se sua família pode ter desconto na conta de luz
            </h1>
            <p className="text-slate-600 md:text-base">
              Estimativa didática com base em <strong>CadÚnico</strong>, <strong>BPC</strong>,
              renda per capita e faixas de consumo. Procure sua distribuidora/CRAS para confirmar e solicitar o benefício.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {/* Bloco 1 — Elegibilidade */}
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Elegibilidade</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Pessoas no domicílio">
                  <NumberInput value={pessoas} onChange={setPessoas} min={1} max={30} step={1} />
                </Field>
                <Field label="Renda familiar total (R$)">
                  <NumberInput value={rendaTotal} onChange={setRendaTotal} min={0} step={50} />
                </Field>
                <Field label="Salário mínimo vigente (R$)">
                  <NumberInput value={salarioMinimo} onChange={setSalarioMinimo} min={0} step={10} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Checkbox label="Inscrição no CadÚnico" checked={cadunico} onChange={setCadunico} />
                  <Checkbox label="Beneficiário do BPC" checked={bpc} onChange={setBpc} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Stat title="Renda per capita" value={money(rendaPc)} />
                <Stat title="Limite (½ salário mínimo)" value={money(limiteRendaPc)} />
                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</div>
                  <div className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${statusClass}`}>
                    {statusLabel}
                  </div>
                </div>
              </div>
            </section>

            {/* Bloco 2 — Consumo e perfil */}
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Consumo & Perfil</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Consumo mensal (kWh)">
                  <NumberInput value={kwhMes} onChange={setKwhMes} min={0} max={2000} step={5} />
                  <Range value={kwhMes} min={0} max={500} step={5} onChange={setKwhMes} />
                </Field>

                <Field label="Tarifa base (R$/kWh)">
                  <NumberInput value={tarifaBase} onChange={setTarifaBase} min={0} max={10} step={0.01} />
                </Field>

                <Field label="Perfil">
                  <Segmented
                    value={perfil}
                    onChange={(v) => setPerfil(v as Perfil)}
                    options={[
                      { value: 'baixa-renda', label: 'Baixa renda' },
                      { value: 'indigena-quilombola', label: 'Indígena/Quilombola' },
                    ]}
                  />
                </Field>
              </div>
            </section>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ResultCard
                title="Sem Tarifa Social"
                items={[
                  ['Consumo', `${resultado.consumo} kWh`],
                  ['Tarifa base', money(resultado.tarifa)],
                ]}
                emphasis={money(resultado.semDesc)}
                emphasisLabel="Conta estimada"
              />
              <ResultCard
                title="Com Tarifa Social"
                items={[
                  ['Desconto estimado', `− ${money(resultado.desc)}`],
                  ['Economia aproximada', `${resultado.economiaPct.toFixed(1)}%`],
                ]}
                emphasis={money(resultado.comDesc)}
                emphasisLabel="Conta com desconto"
              />
            </div>

            <HintCard>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                <li>Simulação <strong>didática</strong>. Alíquotas, impostos (ex.: ICMS), bandeiras tarifárias e tarifas diferentes por distribuidora não estão contemplados.</li>
                <li>As regras de elegibilidade e percentuais podem variar. Verifique na sua <strong>distribuidora</strong> e no <strong>CRAS</strong>.</li>
                <li>Se você for elegível, solicite a inclusão da Tarifa Social junto à distribuidora com os documentos do <strong>CadÚnico</strong> ou comprovante de <strong>BPC</strong>.</li>
              </ul>
            </HintCard>
          </section>

          {/* Share + Ad */}
          <SocialShare
            title="Tarifa Social de Energia (ANEEL) — Estimador • Mapa do Crédito"
            summary="Veja se sua família é elegível à Tarifa Social e quanto pode economizar na conta de luz com base nas faixas de consumo."
            tags={['MapaDoCredito','TarifaSocial','ANEEL','Energia','CadUnico','BPC']}
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

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 accent-sky-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
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
              active ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-50',
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

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  )
}

function HintCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-white p-5">{children}</div>
}