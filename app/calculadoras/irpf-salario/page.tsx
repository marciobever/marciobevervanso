// app/calculadoras/irpf-salario/page.tsx
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
   Faixas IRRF — exemplo didático (atualize quando precisar)
   (usa o modelo com "parcela a deduzir")
========================================================= */
type FaixaIR = { upTo: number | null; rate: number; ded: number }

const IR_FAIXAS: FaixaIR[] = [
  { upTo: 2259.20, rate: 0.00,  ded: 0.00   },
  { upTo: 2826.65, rate: 0.075, ded: 169.44 },
  { upTo: 3751.05, rate: 0.15,  ded: 381.44 },
  { upTo: 4664.68, rate: 0.225, ded: 662.77 },
  { upTo: null,    rate: 0.275, ded: 896.00 },
]

function calcIRRF(base: number, table: FaixaIR[]) {
  if (base <= 0) return 0
  for (const f of table) {
    const limit = f.upTo ?? Infinity
    if (base <= limit) {
      const imposto = base * f.rate - f.ded
      return Math.max(0, imposto)
    }
  }
  return 0
}

export default function IRPFSalarioPage() {
  /* -------- Estado -------- */
  const [bruto, setBruto] = useState('3.500,00')
  const [inss, setInss] = useState('0,00')
  const [dependentes, setDependentes] = useState('0')
  const [deducaoPorDependente, setDeducaoPorDependente] = useState('189,59') // ajustável

  /* -------- Cálculo -------- */
  const out = useMemo(() => {
    const b = parseBR(bruto)
    const dInss = Math.max(0, parseBR(inss))
    const deps = Math.max(0, Math.floor(parseBR(dependentes)))
    const dedDep = deps * Math.max(0, parseBR(deducaoPorDependente))

    const base = Math.max(0, b - dInss - dedDep)
    const ir = calcIRRF(base, IR_FAIXAS)
    const liquido = Math.max(0, b - dInss - ir)

    return { b, dInss, deps, dedDep, base, ir, liquido }
  }, [bruto, inss, dependentes, deducaoPorDependente])

  /* -------- UI -------- */
  return (
    <Container>
      <div className="py-12 md:py-16">
        <Glass className="mx-auto max-w-4xl p-8 md:p-10 space-y-10">
          {/* Header dentro do bloco */}
          <header className="space-y-3">
            <h1 className="text-[clamp(1.6rem,3.2vw,2.4rem)] font-black leading-tight text-slate-900">
              IRPF Mensal (Folha)
            </h1>
            <p className="text-slate-600 md:text-base">
              Estime o <strong>IRRF mensal</strong> a partir do salário bruto, considerando <strong>INSS</strong> e{' '}
              <strong>dedução por dependentes</strong>. Tabela de faixas com{' '}
              <em>parcela a deduzir</em> (modelo didático).
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
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">INSS descontado (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 420,00"
                value={inss}
                onChange={(e) => setInss(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-1 text-[12px] text-slate-500">
                Use o valor real do holerite ou calcule em “INSS por Faixa”.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Dependentes</label>
              <input
                inputMode="numeric"
                placeholder="ex.: 1"
                value={dependentes}
                onChange={(e) => setDependentes(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Dedução por dependente (R$)</label>
              <input
                inputMode="decimal"
                placeholder="ex.: 189,59"
                value={deducaoPorDependente}
                onChange={(e) => setDeducaoPorDependente(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="md:col-span-2">
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
                  Base de cálculo
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.base)}
                </div>
                <ul className="mt-2 space-y-1 text-[12px] text-slate-600">
                  <li>Salário bruto: <strong>{formatBRL(out.b)}</strong></li>
                  <li>− INSS: <strong>{formatBRL(out.dInss)}</strong></li>
                  {out.deps > 0 && (
                    <li>− Dependentes: <strong>{formatBRL(out.dedDep)}</strong> ({out.deps})</li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  IR estimado
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.ir)}
                </div>
                <p className="mt-1 text-[12px] text-slate-500">
                  Cálculo por faixa com parcela a deduzir.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Salário após IR
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-900" aria-live="polite">
                  {formatBRL(out.liquido)}
                </div>
              </div>
            </div>

            {/* Observações compactas */}
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-700">
                <strong>Observações:</strong> simulador <em>didático</em>. Tabelas de IRRF e deduções podem mudar.
                Verifique sempre a norma vigente e o seu holerite. Este cálculo considera dedução por dependente
                informada e não aplica outras deduções (ex.: pensão, previdência privada, etc.).
              </p>
            </div>
          </section>

          {/* Compartilhar + Anúncio */}
          <SocialShare
            title="IRPF Mensal (Folha) • Mapa do Crédito"
            summary="Estime o IRRF mensal a partir do salário bruto, com INSS e dedução por dependentes."
            tags={['MapaDoCredito', 'IRPF', 'Folha']}
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