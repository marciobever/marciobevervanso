// app/calculadoras/inss-salario/page.tsx
'use client'

import { useMemo, useState } from 'react'
import Glass from '@/components/ui/Glass'
import { Container } from '@/components/ui'
import AdSlot from '@/components/ads/AdSlot'
import SocialShare from '@/components/calcs/SocialShare'

/* =========================================================
   Helpers locais (sem dependências externas)
========================================================= */
function formatBRL(n: number) {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  } catch {
    return `R$ ${Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00'}`
  }
}
function parseBR(input: string) {
  // aceita "3.500,00", "3500,00" ou "3500.00"
  const s = String(input || '').replace(/\s+/g, '').replace(/\./g, '').replace(',', '.')
  const v = Number(s)
  return Number.isFinite(v) ? v : 0
}

/* =========================================================
   Tabela 2025 (didática) — ajuste quando atualizar oficialmente
========================================================= */
type Faixa = { upTo: number; rate: number } // upTo = limite superior da faixa

const FAIXAS_2025: Faixa[] = [
  { upTo: 1412.0,  rate: 0.075 }, // 7,5% até 1.412,00
  { upTo: 2666.68, rate: 0.09  }, // 9%   até 2.666,68
  { upTo: 4000.03, rate: 0.12  }, // 12%  até 4.000,03
  { upTo: 7786.02, rate: 0.14  }, // 14%  até 7.786,02 (teto)
]

/** Soma progressiva por faixas, com teto na última faixa */
function calcINSSProgressivo(bruto: number, faixas: Faixa[]) {
  const base = Math.max(0, bruto)
  let total = 0
  let prevLim = 0

  for (const f of faixas) {
    const slice = Math.max(0, Math.min(base, f.upTo) - prevLim)
    if (slice <= 0) break
    total += slice * f.rate
    prevLim = f.upTo
  }

  // Contribuição máxima (no teto)
  const maxNoTeto = faixas.reduce((acc, f, i, arr) => {
    const lower = i === 0 ? 0 : arr[i - 1].upTo
    const span = f.upTo - lower
    return acc + span * f.rate
  }, 0)

  return Math.min(total, maxNoTeto)
}

export default function INSSSalarioPage() {
  const [bruto, setBruto] = useState('3.500,00')

  const out = useMemo(() => {
    const b = parseBR(bruto)
    const desconto = calcINSSProgressivo(b, FAIXAS_2025)
    const liquido = Math.max(0, b - desconto)
    const efetiva = b > 0 ? (desconto / b) : 0
    return { b, desconto, liquido, efetiva }
  }, [bruto])

  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header no próprio bloco */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-black leading-tight text-slate-900">
              INSS por Faixa (progressivo)
            </h1>
            <p className="text-slate-600 md:text-base">
              Calcule o <strong>desconto de INSS</strong> de forma progressiva, por faixas de salário. Os valores
              abaixo são <em>didáticos</em> e devem ser atualizados conforme portarias/tabelas oficiais vigentes.
            </p>
          </header>

          {/* Formulário */}
          <form onSubmit={(e) => e.preventDefault()} className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Salário bruto (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 3.500,00"
                value={bruto}
                onChange={(e) => setBruto(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-1 text-[12px] text-slate-500">
                Digite com vírgula para centavos (ex.: 3.500,00).
              </p>
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

          {/* Resultados — tudo no mesmo bloco */}
          <section className="space-y-8">
            {/* Destaques */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  INSS estimado
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.desconto)}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Salário após INSS
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.liquido)}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Alíquota efetiva
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {(out.efetiva * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Observações compactas */}
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-700">
                <strong>Observações:</strong> o cálculo é progressivo por faixas (similar ao IR). Há{' '}
                <em>teto de contribuição</em> — acima do limite superior, a contribuição não aumenta.
                Atualize as faixas e alíquotas quando houver nova portaria/ano-base.
              </p>
            </div>
          </section>

          {/* Compartilhar */}
          <SocialShare
            title="INSS por Faixa — calculadora • Mapa do Crédito"
            summary="Calcule o desconto progressivo de INSS por faixas, com alíquota efetiva e salário líquido."
            tags={['MapaDoCredito','INSS','Folha','Desconto']}
            variant="brand"
            size="md"
            compactOnMobile
          />

          {/* Ad discreto no rodapé do bloco */}
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