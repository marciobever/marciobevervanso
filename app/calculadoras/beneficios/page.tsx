// app/calculadoras/beneficios/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Container } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'

type Eligibility = 'provável' | 'possível' | 'não elegível'

/** Helpers locais — evitam depender de lib/format */
function formatBRL(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00'}`
  }
}
function parseBRNumber(input: string) {
  const s = String(input || '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const v = Number(s)
  return Number.isFinite(v) ? v : 0
}

function EligibilityBadge({ name, status }: { name: string; status: Eligibility }) {
  const map: Record<Eligibility, string> = {
    'provável': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'possível': 'bg-amber-50 text-amber-700 border-amber-200',
    'não elegível': 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-[5px] text-[11px] font-semibold',
        map[status],
      ].join(' ')}
    >
      {name}: {status}
    </span>
  )
}

export default function BeneficiosPage() {
  const [renda, setRenda] = useState('1.500,00')
  const [pessoas, setPessoas] = useState('3')
  const [criancas, setCriancas] = useState('1')

  const out = useMemo(() => {
    const rendaFam = parseBRNumber(renda)
    const nPessoas = Math.max(1, Math.floor(parseBRNumber(pessoas)))
    const kids = Math.max(0, Math.floor(parseBRNumber(criancas)))
    const perCapita = rendaFam / nPessoas

    const bolsaElegivel = perCapita <= 218
    const auxGasElegivel = perCapita <= 178
    const tarifaElegivel = perCapita <= 170
    const bpcElegivel = perCapita <= 353

    const piso = bolsaElegivel ? Math.max(0, 600 - rendaFam) : 0
    const adicional = bolsaElegivel ? kids * 150 : 0
    const estimativaBolsa = Math.max(0, piso + adicional)

    const beneficios: { name: string; status: Eligibility }[] = [
      { name: 'Bolsa Família', status: bolsaElegivel ? 'provável' : 'não elegível' },
      { name: 'Auxílio Gás',   status: auxGasElegivel ? 'possível' : 'não elegível' },
      { name: 'Tarifa Social', status: tarifaElegivel ? 'possível' : 'não elegível' },
      { name: 'BPC/LOAS',      status: bpcElegivel ? 'possível' : 'não elegível' },
    ]

    const destaque =
      beneficios.find(b => b.status === 'provável')?.name ||
      beneficios.find(b => b.status === 'possível')?.name ||
      'Nenhum'

    return { perCapita, estimativaBolsa, beneficios, destaque }
  }, [renda, pessoas, criancas])

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.5rem,3.2vw,2.2rem)] font-black leading-tight text-slate-900">
              Simulador de Benefícios
            </h1>
            <p className="text-slate-600 md:text-base">
              Estime a renda per capita da família, veja uma indicação de
              elegibilidade e um valor aproximado de benefício. Simulador
              didático — confirme sempre no CRAS/gov.br.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Renda familiar mensal (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 1.500,00"
                value={renda}
                onChange={(e) => setRenda(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Pessoas na família</label>
              <input
                inputMode="numeric"
                placeholder="ex.: 3"
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Crianças (0–6 anos)</label>
              <input
                inputMode="numeric"
                placeholder="ex.: 1"
                value={criancas}
                onChange={(e) => setCriancas(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <div className="self-end">
              <button
                type="submit"
                className="h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-800"
              >
                Calcular
              </button>
            </div>
          </form>

          {/* Resultados */}
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Estimativas</h2>
              <p className="text-sm text-slate-500">Com base nas informações preenchidas</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Renda per capita
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.perCapita || 0)}
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Benefício em destaque
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900" aria-live="polite">
                  {out.destaque}
                  {out.destaque === 'Bolsa Família' && (
                    <span className="ml-2 inline-block rounded-full bg-sky-50 px-2 py-[3px] text-[11px] font-semibold text-sky-700">
                      aprox. {formatBRL(out.estimativaBolsa || 0)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Possíveis programas
              </p>
              <div className="flex flex-wrap gap-2">
                {out.beneficios.map((b) => (
                  <EligibilityBadge key={b.name} name={b.name} status={b.status} />
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Este simulador é indicativo e pode não refletir regras atualizadas. Consulte o CRAS,
              CadÚnico e canais oficiais do governo para confirmação.
            </p>
          </section>

          {/* Share + Ad */}
          <SocialShare
            title="Simulador de Benefícios • Mapa do Crédito"
            summary="Descubra se sua família pode ter direito a Bolsa Família, Auxílio Gás, Tarifa Social e BPC/LOAS com base na renda per capita."
            tags={['MapaDoCredito','BolsaFamilia','BeneficiosSociais']}
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